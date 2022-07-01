//StarSpar server file.
//(c) 2019 Gilgamech Technologies
var $gameData = {};
$gameData.ver = 384

//{ Init vars
var $http = require("http");
var sparational = require("sparational");
var $serviceName = "StarSpar";
var $servicePort = (process.env.PORT || 5010);
var $hostName = (process.env.HOST || "localhost:"+$servicePort);
sparational.starspar = new sparational.Sequelize(process.env.STARSPAR_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});
sparational.sequelize = new sparational.Sequelize(process.env.LOGGING_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});

$gameData.map = {}
$gameData.map.x = 10000
$gameData.map.y = 10000
$gameData.map.name = 'noob'
$gameData.map.player = {}
$gameData.map.playermove = 320
$gameData.map.projectile = {}
$gameData.map.projectile.move = 3
$gameData.map.npc = {}
$gameData.map.npc.demon = {}
$gameData.map.npc.demon.hp = 20
$gameData.map.npc.demon.spawnrate = 20
$gameData.map.drop = {}
$gameData.map.drop.block = {}
$gameData.map.drop.block.hp = 50
$gameData.map.drop.block.spawnrate = 1


//How fast the game should update.
var $ticksPerSecond = 10
var $tickDelay = (1000/$ticksPerSecond)
var $minutesBetweenSaves = 5
var $saveDelay = (60*1000*$minutesBetweenSaves)
var then = Date.now();
var $gameTick = 0;
var $gameSave = 0;
var $clickCheck = false;

var hitBox = 32;

//load $gameObjects var.
var $gameObjects;

//AWS
var AWS = require('aws-sdk');
var awsAccessKey = (process.env.AWS_S3_KEY || 'ASecretToEverybody')
var awsSecretKey = (process.env.AWS_S3_SECRET_KEY || 'TimeWaitsForNobody')
var awsRegion = (process.env.AWS_S3_REGION || 'us-west-2')
AWS.config.update({ accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey, region: awsRegion});
var s3 = new AWS.S3();

//load map
var BUCKET_NAME = 'gilpublic'
var file = 'starspar/gamesave.json'
var getParams = {
	Bucket: BUCKET_NAME,
	Key: file
};
s3.getObject(getParams, function (err, data) {
    if (err) {
        console.log("gameObjects err: "+err);
    } else {
		$gameObjects = JSON.parse(data.Body)
		for (object in $gameObjects) {
			$gameObjects[object].id = object;
		}// reindex input.
		//Filter out misplaced blocks.
		$gameObjects = $gameObjects.filter(o => {return o.objecttype == "block"}).filter(o => {return o.locx % 40 == 0}).filter(o => {return o.locy % 40 == 0})
		console.log('Reindexing complete - indexed '+$gameObjects.length+' game objects');
        console.log("gameObjects test data: "+JSON.stringify($gameObjects[0])); //this will log data to console
    }
})

//load IP autoblock
//var autoblock = sequelize select * from autoblock
//}

//{ functions
function getBadPW() { return Math.random().toString(36).slice(-20).slice(2); };
function writeLog($msg) { 
		console.log('error: '+$msg); 
};

function addObject(objectname,mapname,locx,locy,hp,ammo,score,ticksremaining,objectowner,updatelocation,objecttype) {
	var id = ($gameObjects.length);
	if (objecttype == 'projectile') {
		var shooter = $gameObjects.filter(o => {return o.objectname == objectowner})[0]
		if (shooter.ammo > 0) {
		//If projectile, remove ammo from the owner.
			shooter.ammo--
			$gameObjects.push({'id':id,'objectname':objectname,'mapname':mapname,'locx':locx,'locy':locy,'hp':hp,'ammo':ammo,'score':score,'ticksremaining':ticksremaining,'objectowner':objectowner,'updatelocation':1,'objecttype':objecttype})
		}
	}else{
	//Spawn the object
		$gameObjects.push({'id':id,'objectname':objectname,'mapname':mapname,'locx':locx,'locy':locy,'hp':hp,'ammo':ammo,'score':score,'ticksremaining':ticksremaining,'objectowner':objectowner,'updatelocation':1,'objecttype':objecttype})
	}
};

function gameSave() { 
	var putParams = {
		Bucket: BUCKET_NAME,
		Key: file,
		Body: JSON.stringify($gameObjects),
		ContentType: "application/json",
		ACL: 'public-read'
	};
	s3.putObject(putParams,function (err,data) {
		if (err) {
			console.log("gameSave err: "+err);
		} else {
			console.log("gameSave test data: "+JSON.stringify(data)); //this will log data to console
		}
	});
};

function moveObject(object) {
	object.updatelocation = 1;
	if (object.locx < object.ammo) {
		if (object.locx > object.ammo-$gameData.map.projectile.move) {
			object.ammo = object.locx;
		}
		object.locx = object.locx + $gameData.map.projectile.move
	} else if (object.locx > object.ammo) { 
		if (object.locx < object.ammo+$gameData.map.projectile.move) {
			object.ammo = object.locx;
		}
		object.locx = object.locx - $gameData.map.projectile.move
	} 
	if (object.locy < object.score) { 
		if (object.locy > object.score-$gameData.map.projectile.move) {
			object.score = object.locy;
		}
		object.locy = object.locy + $gameData.map.projectile.move
	} else if (object.locy > object.score) { 
		if (object.locy < object.score+$gameData.map.projectile.move) {
			object.score = object.locy;
		}
		object.locy = object.locy - $gameData.map.projectile.move
	} 
};

function gameTick() {
	//Handle all with HP below zero
	belowZeroHp = $gameObjects.filter(o => {return o.hp <= 0}) 
	for (object in belowZeroHp) {
		if (belowZeroHp[object].objecttype == 'player') { //if player, respawn. 
			belowZeroHp[object].locx = Math.round(Math.random() * $gameData.map.x)
			belowZeroHp[object].locy = Math.round(Math.random() * $gameData.map.y)
			belowZeroHp[object].hp = 100
			belowZeroHp[object].ammo = 100
			belowZeroHp[object].score = 0
			belowZeroHp[object].ticksremaining = 100
			belowZeroHp[object].updatelocation = 1
		}else if (belowZeroHp[object].objecttype == 'npc' && Math.floor(Math.random() *1000) > 250) { //Overall drop rate
			if (Math.floor(Math.random() *1000) > 750) { //Weighted to drop hp
				addObject('ammodrop',$gameData.map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),100,'ammodrop',1,'ammodrop');
			}else{
				addObject('hpdrop',$gameData.map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),100,'hpdrop',1,'hpdrop');
			}
		}else if (belowZeroHp[object].objecttype == 'block' && Math.floor(Math.random() *1000) > 250) { //Overall drop rate
			if (Math.floor(Math.random() *1000) > 250) { //Weighted to drop ammo
				addObject('ammodrop',$gameData.map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),100,'ammodrop',1,'ammodrop');
			}else{
				addObject('hpdrop',$gameData.map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),100,'hpdrop',1,'hpdrop');
			}
		}else { //everyone else
		}	
	}
	
	//Snip all with HP below zero
	$gameObjects = $gameObjects.filter(o => {return o.hp > 0}).filter(o => {return o.objecttype})
	
	for (object in $gameObjects) {
	$gameObjects[object].updatelocation = 0
	if (typeof $gameObjects[object].id == 'undefined'){$gameObjects[object].id = $gameObjects.length}
	//Handle all with HP above zero
		if ($gameObjects[object].objecttype == 'projectile') { //if projectile
			//If collides with:
				var blockObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'block'}) 
				for (collidingObject in blockObjects){
					try{blockObjects[collidingObject].hp--}catch(e){}
					$gameObjects[object].hp = 0
					blockObjects.filter(o => {return o.objectname == $gameObjects[object].objectowner}).score++
				}
				var npcObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'npc'}) 
				for (collidingObject in npcObjects){
					npcObjects[collidingObject].hp--
					$gameObjects[object].hp = 0
					npcObjects.filter(o => {return o.objectname == $gameObjects[object].objectowner}).score++
				}

			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objecttype == 'player') { //if player
			//Keep them from getting too much HP or ammo.
			if ($gameObjects[object].hp > 100) {$gameObjects[object].hp = 100}
			if ($gameObjects[object].ammo > 100) {$gameObjects[object].ammo = 100}
			if ($gameObjects[object].ticksremaining > 0) {$gameObjects[object].ticksremaining--}
			
			//If collides with:
			var notBlockObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype != 'block'})
			notBlockObjects = notBlockObjects.filter(o => {return o.objecttype != 'hpdrop'}).filter(o => {return o.objecttype != 'projectile'}).filter(o => {return o.objecttype != 'ammodrop'})
			//not colliding with itself
			notBlockObjects = notBlockObjects.filter(o => {return o.objectname != $gameObjects[object].objectname})
			//collide with demons and players - knock them back.
			for (collidingObject in notBlockObjects){
				$gameObjects[object].hp--
				notBlockObjects[collidingObject].hp--
				if ($gameObjects[object].locx < notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx += 25}
				if ($gameObjects[object].locx > notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx -= 25}
				if ($gameObjects[object].locy < notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy += 25}
				if ($gameObjects[object].locy > notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy -= 25}
			}
			//Collide with blocks, get knocked back.
			var blockObjects2 = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'block'})
			for (collidingObject in blockObjects2){
				$gameObjects[object].hp--
				blockObjects2[collidingObject].hp--
				if ($gameObjects[object].locx < blockObjects2[collidingObject].locx) {$gameObjects[object].locx -= 25}
				if ($gameObjects[object].locx > blockObjects2[collidingObject].locx) {$gameObjects[object].locx += 25}
				if ($gameObjects[object].locy < blockObjects2[collidingObject].locy) {$gameObjects[object].locy -= 25}
				if ($gameObjects[object].locy > blockObjects2[collidingObject].locy) {$gameObjects[object].locy += 25}
			}
			
			
		}else if ($gameObjects[object].objecttype == 'npc') { //if demon 
			//if ($gameObjects[object].objectname == 'demon') {$gameObjects[object].objectname = getBadPW()}
			//If near target, find a new one.
			if ($gameObjects[object].locx < $gameObjects[object].ammo+5
			&& $gameObjects[object].locx +5 > $gameObjects[object].ammo) {$gameObjects[object].ammo = Math.round(Math.random() * $gameData.map.x)}
			if ($gameObjects[object].locy < $gameObjects[object].score+5
			&& $gameObjects[object].locy +5 > $gameObjects[object].score) {$gameObjects[object].score = Math.round(Math.random() * $gameData.map.y)}
			moveObject($gameObjects[object])

			//Collide with blocks, mirror target.
			var blockObjectsNPC = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'block'})
			for (collidingObject in blockObjectsNPC){
				$gameObjects[object].hp--
				blockObjectsNPC[collidingObject].hp--
				$gameObjects[object].ammo = $gameObjects[object].locx-($gameObjects[object].ammo-$gameObjects[object].locx)
				//if demon's left of block, then it's moving right, so set ammo = demon.x-(ammo-demon.x)
				//demon 3800 ammo 4200 = 3800-(4200-3800) = 3400
				//if demon's right of block, then it's moving left, so set ammo = demon.x-(ammo-demon.x)
				//demon 4200 ammo 3800 = 4200-(3800-4200) = 4800
				$gameObjects[object].score = $gameObjects[object].locy-($gameObjects[object].score-$gameObjects[object].locy)
				//demon 3800 score 4200 = 3400
				//demon 4200 score 3800 = 4800
			}
			
			
		}else if ($gameObjects[object].objectType == 'ammodrop' || $gameObjects[object].objecttype == 'ammodrop') { //if ammodrop 
				var playerObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'player'}) 
				for (collidingObject in playerObjects){
					playerObjects[collidingObject].ammo += 25
					$gameObjects[object].hp = 0
				}
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
			
			
		}else if ($gameObjects[object].objectType == 'hpdrop' || $gameObjects[object].objecttype == 'hpdrop') { //if hpdrop 
				var playerObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'player'}) 
				for (collidingObject in playerObjects){
					playerObjects[collidingObject].hp += 25
					$gameObjects[object].hp = 0
				}
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objecttype == 'block') { //if block
		}else { //everyone else
			writeLog("Unhandled object Type: "+$gameObjects[object].objectType+" and type:"+$gameObjects[object].objecttype)
		}	
	} // end for object

			
	//Add random block and demon.
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('block',$gameData.map.name,Math.round((Math.random() * 250))*40,Math.round((Math.random() * 250))*40,$gameData.map.drop.block.hp,0,0,100,'block',1,'block');
	}
	if (Math.floor(Math.random() *1000) > 990) {
		addObject(getBadPW(),$gameData.map.name,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),$gameData.map.npc.demon.hp,Math.round(Math.random() * $gameData.map.x),Math.round(Math.random() * $gameData.map.y),1,'demon',1,'npc');
	}
};
//}

//{ StarSpar

$http.createServer(function (request, response) {
	response.setHeader('Access-Control-Allow-Origin', "*")
	
	try {
if (request.method == "GET") {
	writeLog(request.method +" request from address:" + request.connection.remoteAddress + " on port: "+request.connection.remotePort+" for path " + request.url)

	sparational.html("starspar.gilgamech.com",function($callback) {
		response.end($callback) 
	})

} else if (request.method == "POST") {
    if (request.url.indexOf("starspar?") > 0) {
	var inputPacket = request.url.split("starspar?")[1].split("&")
	var $user = inputPacket[0].split("=")[1]
	var $sessionID = inputPacket[1].split("=")[1]
	var $sessionKey = inputPacket[2].split("=")[1]
	$sessionID = $sessionID.replace(/;/g,"")
	// Receive player keystrokes
	var player = JSON.parse(inputPacket[3].split("=")[1].replace(/~~/g,"#").replace(/%20/g,'').replace(/%22/g,'"'))

	//game tick and save
	var now = Date.now();
	var delta = now - then;
	$gameSave += delta;
	if ($gameSave > $saveDelay) {
		console.log("Game Save "+$gameSave+" delay "+$saveDelay)
		$gameSave -= $saveDelay;
		gameSave();
	}
	$gameTick += delta;
	if ($gameTick > $tickDelay) {
		$gameTick -= $tickDelay;
        gameTick();
	}
	then = now;

	if($gameObjects.filter(o => {return o.objectname == player.objectname}).length <=0){
		//If the player isn't in the gameObjects list, add them.
	}
	
	if (typeof player.x == "undefined" || typeof player.y == "undefined" ) {
		//If the player doesn't know their location, throw them randomly on the map somewhere.
		//Send back all player locations, so they can find themselves if they're in the list.
		$returnGameObjects = $gameObjects.filter(o => {return o.objecttype == 'player'})
	} else {//if player.x and player.y are known
	
		//Keep them within the bounds of the $gameData.map.
		if (player.x <= 0){player.x = 0}
		if (player.y <= 0){player.y = 0}
		if (player.x >= $gameData.map.x){player.x = $gameData.map.x}
		if (player.y >= $gameData.map.y){player.y = $gameData.map.y}

		//Add projectiles if  mouse clicked.
		if (player.mouseClicked == true && $clickCheck == false){
			$clickCheck = true
			addObject('projectile',$gameData.map.name,player.x+20,player.y+20,100,player.mouseX,player.mouseY,100,$user,1,'projectile');
		}else if (player.mouseClicked == false && $clickCheck == true){
			//clickCheck prevents click-holding and reliably ensures one-projectile-per-click.
			$clickCheck = false
		}//end clickCheck
		
		var object = $gameObjects.filter(o => {return o.objectname == $user})[0]
		//add objectID if missing
		if (typeof object.id == 'undefined'){object.id = ($gameObjects.length)}
		
		//Update player location, if it's not too far away.
		if (player.x <= (object.locx + $gameData.map.player.move)
		&& object.locx <= (player.x + $gameData.map.player.move)
		&& player.y <= (object.locy + $gameData.map.player.move)
		&& object.locy <= (player.y + $gameData.map.player.move)) {
			object.locx = player.x;
			object.locy = player.y;
		} else {
			console.log("Player at x:"+player.x+" y:"+player.y+" but server has x:"+object.locx+" y:"+object.locy)
			
		
		//Describe player's newWindow on the map as centered on their player location.
		//newWindow's upper left corner (minimum) is the player location minus half the newWindow size.
		//newWindow's lower right corner (maximum) is the player location plus half the newWindow size.
		//Describe player's oldWindow on the map as centered on their player location.
		//oldWindow's upper left corner (minimum) is the object location minus half the oldWindow size.
		//oldWindow's lower right corner (maximum) is the object location plus half the oldWindow size.
		
		//Send back everything except players inside the player's newWindow...
		
		//that was outside of the oldWindow
		
		//- unless it has updatelocation  == 1
		
		//Push active players onto whatever we're returning.
		}
	
	$returnGameObjects = $gameObjects.filter(o => {return o.locx > player.x-2000}).filter(o => {return o.locx < player.x+2000}).filter(o => {return o.locy > player.y-2000}).filter(o => {return o.locy < player.y+2000}).filter(o => {return o.ticksremaining >= 0})
	$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'player'}))
	$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'npc'}))
		//Push current player
		
	} // end if player.x and player.y
	
	var $keyCallback = ""+$user+":" + $sessionID +":" + $sessionKey
	response.end($keyCallback+":gameObjects:"+JSON.stringify($returnGameObjects)+":gameData:"+JSON.stringify($gameData))

	} else {
		writeLog('Invalid request.'); 
		response.end('Invalid request.')
    }; // end request url indexOf



} else {
	response.end("Use GET or POST here.") 
}//end if request.method
	}catch(e){
		writeLog("Invalid starspar attempt: " + e.message + " - from server: " + request.connection.remoteAddress + " for path " + request.url)
		response.end("Invalid starspar attempt.") 
	}//end try
}).listen($servicePort);
//}

//{ Run Once
console.log($serviceName + ' version '+$gameData.ver+' is running on port ' + $servicePort);

process.on('SIGTERM', function () {
    server.close( function () {
		gameSave()
		process.exit(0);
	});
});
//}


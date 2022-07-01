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
        console.log("gameObjects test data: "+JSON.stringify($gameObjects[0])); //this will log data to console
    }
})
//}

//{ functions
function getBadPW() { return Math.random().toString(36).slice(-20).slice(2); };
function writeLog($msg) { 
		console.log('error: '+$msg); 
};

function addObject(objectname,mapname,locx,locy,hp,ammo,score,ticksremaining,objectowner,updatelocation,objecttype) {
	//Spawn the object
	$gameObjects.push({'objectname':objectname,'mapname':mapname,'locx':locx,'locy':locy,'hp':hp,'ammo':ammo,'score':score,'ticksremaining':ticksremaining,'objectowner':objectowner,'updatelocation':1,'objecttype':objecttype})
	
	//If projectile, remove ammo from the owner.
	if (objecttype == 'projectile') {
		var object = $gameObjects.filter(o => {return o.objectname == objectowner})[0]
		object.ammo--
	}

};

function gameSave() { 
	//var $saveObjects = $gameObjects.filter(o => {return o.updatelocation == 1}).filter(o => {return o.objectname != "ammodrop"})
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
	if (object.locx < object.ammo) { 
		if (object.locx > object.ammo-$gameData.map.projectile.move) {
	} else if (object.locx > object.ammo) { 
	} 
	if (object.locy < object.score) { 
		object.locy = object.locy + projectileSpeed
	} else if (object.locy > object.score) { 
		object.locy = object.locy - projectileSpeed
	} 
};

function gameTick() {
	//Handle all with HP below zero
	belowZeroHp = $gameObjects.filter(o => {return o.hp <= 0}) 
	for (object in belowZeroHp) {
		if (belowZeroHp[object].objecttype == 'player') { //if player, respawn. 
			belowZeroHp[object].locx = Math.round(Math.random() * map.x)
			belowZeroHp[object].locy = Math.round(Math.random() * map.y)
			belowZeroHp[object].hp = 100
			belowZeroHp[object].ammo = 100
			belowZeroHp[object].score = 0
			belowZeroHp[object].ticksremaining = 100
			belowZeroHp[object].updatelocation = 1
		}else if (belowZeroHp[object].objecttype == 'npc' && Math.floor(Math.random() *1000) > 750) { //if demon, spawn ammo.
			if (Math.floor(Math.random() *1000) > 500) { //if demon, spawn ammo.
				addObject('ammodrop',map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'ammodrop',1,'ammodrop');
			}else{
				addObject('hpdrop',map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'hpdrop',1,'hpdrop');
			}
		}else if (belowZeroHp[object].objecttype == 'projectile') { //if projectile 
		}else if (belowZeroHp[object].objecttype == 'ammodrop') { //if ammo 
		}else if (belowZeroHp[object].objecttype == 'hpdrop') { //if ammo 
		}else if (belowZeroHp[object].objecttype == 'block' && Math.floor(Math.random() *1000) > 500) { //if block, spawn ammo.
			if (Math.floor(Math.random() *1000) > 500) { //if demon, spawn ammo.
				addObject('ammodrop',map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'ammodrop',1,'ammodrop');
			}else{
				addObject('hpdrop',map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'hpdrop',1,'hpdrop');
			}
		}else { //everyone else
		}	
	}
	
	//Snip all with HP below zero
	$gameObjects = $gameObjects.filter(o => {return o.hp > 0}).filter(o => {return o.objecttype})
	
	for (object in $gameObjects) {
	//Handle all with HP above zero
		if ($gameObjects[object].objecttype == 'projectile') { //if prjectile
			//If collides with:
				var blockObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'block'}) 
				for (collidingObject in blockObjects){
					try{blockObjects[collidingObject].hp--}catch(e){}
					$gameObjects[object].hp = 0
					blockObjects.filter(o => {return o.objectname == $gameObjects[object].objectowner}).score++
					//console.log("Projectile Block collision "+$gameObjects[object].objectname+" at x:"+$gameObjects[object].locx+" y:"+$gameObjects[object].locy+"against "+blockObjects[collidingObject].objectname+" with HP "+blockObjects[collidingObject].hp+" at x:"+blockObjects[collidingObject].locx+" y:"+blockObjects[collidingObject].locy)
				}
				var npcObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'npc'}) 
				for (collidingObject in npcObjects){
					npcObjects[collidingObject].hp--
					$gameObjects[object].hp = 0
					npcObjects.filter(o => {return o.objectname == $gameObjects[object].objectowner}).score++
					//console.log("Projectile Demon collision "+$gameObjects[object].objectname+" at x:"+$gameObjects[object].locx+" y:"+$gameObjects[object].locy+"against "+npcObjects[collidingObject].objectname+" with HP "+npcObjects[collidingObject].hp+" at x:"+npcObjects[collidingObject].locx+" y:"+npcObjects[collidingObject].locy)
				}
				//player - deleted and player loses HP
				//demon - deleted and demon loses HP
				//block - deleted and block loses HP
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objecttype == 'player') { //if player
			$gameObjects[object].ticksremaining--
			//If collides with:
				var notBlockObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype != 'ammodrop'})
				notBlockObjects = notBlockObjects.filter(o => {return o.objecttype != 'hpdrop'})
				notBlockObjects = notBlockObjects.filter(o => {return o.objecttype != 'projectile'})
				notBlockObjects = notBlockObjects.filter(o => {return o.objectname != $gameObjects[object].objectname})
				for (collidingObject in notBlockObjects){
					$gameObjects[object].hp--
					notBlockObjects[collidingObject].hp--
					if ($gameObjects[object].locx < notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx += 25}
					if ($gameObjects[object].locx > notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx -= 25}
					if ($gameObjects[object].locy < notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy += 25}
					if ($gameObjects[object].locy > notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy -= 25}
					console.log("Player collision "+$gameObjects[object].objectname+" against "+notBlockObjects[collidingObject].objectname)
				}
/*
*/
				//player - knockback and both lose HP
				//demon - knockback and both lose HP
				//block - knockback and both lose HP
				
				//projectile - loses HP and projectile deleted
				
				//ammo - gains ammo and ammo deleted
				
		}else if ($gameObjects[object].objecttype == 'npc') { //if demon 
			//If collides with:
				//block - knockback
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objectType == 'ammodrop' || $gameObjects[object].objecttype == 'ammodrop') { //if projectile 
				var playerObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'player'}) 
				for (collidingObject in playerObjects){
					playerObjects[collidingObject].ammo += 25
					$gameObjects[object].hp = 0
					//console.log("Ammo collision "+$gameObjects[object].objectname+" at x:"+$gameObjects[object].locx+" y:"+$gameObjects[object].locy+"against "+playerObjects[collidingObject].objectname+" with HP "+playerObjects[collidingObject].hp+" at x:"+playerObjects[collidingObject].locx+" y:"+playerObjects[collidingObject].locy)
				}
/*
*/
			//If collides with:
				//block - knockback
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objectType == 'hpdrop' || $gameObjects[object].objecttype == 'hpdrop') { //if projectile 
				var playerObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'player'}) 
				for (collidingObject in playerObjects){
					playerObjects[collidingObject].hp += 25
					$gameObjects[object].hp = 0
					//console.log("Ammo collision "+$gameObjects[object].objectname+" at x:"+$gameObjects[object].locx+" y:"+$gameObjects[object].locy+"against "+playerObjects[collidingObject].objectname+" with HP "+playerObjects[collidingObject].hp+" at x:"+playerObjects[collidingObject].locx+" y:"+playerObjects[collidingObject].locy)
				}
/*
*/
			//If collides with:
				//block - knockback
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objecttype == 'block') { //if block
/*
				var blockObjects = $gameObjects.filter(o => {return o.locx <= $gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= $gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= $gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= $gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == 'player'}) 
				for (collidingObject in blockObjects){
					blockObjects[collidingObject].x += 25
					blockObjects[collidingObject].y += 25
					console.log("Block collision "+blockObjects[object].objectname+" against "+blockObjects[collidingObject].objectname+" with HP "+blockObjects[collidingObject].hp)
				}
*/
/*
*/
			//If collides with:
				//player - knockback and both lose HP
				//demon - knockback and both lose HP
				//projectile - loses HP and projectile deleted
				//ammo - knockback
		}else { //everyone else
			writeLog("Unhandled object Type: "+$gameObjects[object].objectType+" and type:"+$gameObjects[object].objecttype)
		}	
	} // end for object

			
	//Add random block and demon.
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('block',map.name,Math.round((Math.random() * 250))*40,Math.round((Math.random() * 250))*40,10,0,0,100,'block',1,'block');
	}
	if (Math.floor(Math.random() *1000) > 990) {
		addObject(getBadPW(),map.name,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),10,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),1,'demon',1,'npc');
	}
};
//}

//{ StarSpar
$http.createServer(function (request, response) {
	response.setHeader('Access-Control-Allow-Origin', "*")
	try {
if (request.method == "GET") {
	writeLog(request.method +" request from address:" + request.connection.remoteAddress + " on path: "+request.connection.remotePort+" for path " + request.url)

	sparational.html("starspar.gilgamech.com",function($callback) {
		response.end($callback) 
	})

} else if (request.method == "POST") {
    if (request.url.indexOf("starspar?") > 0) {//starspar from starspar
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
	}
	
	var $returnGameObjects
	if (typeof player.x == "undefined" || typeof player.y == "undefined" ) {
		$returnGameObjects = $gameObjects.filter(o => {return o.objecttype == 'player'})
		$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'npc'}))
	} else {//if player.x and player.y are known
	
		if (player.x <= 0){player.x = 0}
		if (player.y <= 0){player.y = 0}
		if (player.x >= $gameData.map.x){player.x = $gameData.map.x}
		if (player.y >= $gameData.map.y){player.y = $gameData.map.y}

			//Update player location, if it's not too far away.
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
			
		}
	
	if (player.mouseClicked == true && $clickCheck == false){
		$clickCheck = true
		addObject('projectile',map.name,player.x,player.y,100,player.mouseX,player.mouseY,100,$user,1,'projectile');
	}else if (player.mouseClicked == false && $clickCheck == true){
		$clickCheck = false
	}
	$returnGameObjects = $gameObjects.filter(o => {return o.locx > player.x-2000}).filter(o => {return o.locx < player.x+2000}).filter(o => {return o.locy > player.y-2000}).filter(o => {return o.locy < player.y+2000}).filter(o => {return o.ticksremaining >= 0})
	$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'player'}))
	$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'npc'}))
	
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


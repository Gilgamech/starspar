//StarSpar server file.
//(c) 2019 Gilgamech Technologies
var $gameData = {};
$gameData.ver = 298

//{ Init vars
var $http = require("http");
var sparational = require("sparational");
var $serviceName = "StarSpar";
var $servicePort = (process.env.PORT || 5010);
var $hostName = (process.env.HOST || "localhost:"+$servicePort);
sparational.starspar = new sparational.Sequelize(process.env.STARSPAR_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});
sparational.sequelize = new sparational.Sequelize(process.env.LOGGING_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});

var demon = {};

var map = {};
map.x = 10000
map.y = 10000
map.name = 'noob'
map.playerMoveSpeed = 320

projectileSpeed = 3;

//How fast the game should update.
var $ticks = 10
var $tickDelay = (1000/$ticks)
var $saves = 60
var $saveDelay = (1000*1000*$saves)
var then = Date.now();
var $gameTick = 0;
var $gameSave = 0;
var $clickCheck = false;

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
	$msg = $msg.toString().replace(/'/g,"~~")
	if($msg.length > 254) {
	   $msg = $msg.substring(0, 251)+"...";
	}
	sparational.sequelize.query("INSERT INTO Logs (servicename, err) SELECT '"+$serviceName+"','"+$msg+"'").then(([$PagesResults, metadata]) => {
	}).catch(function(err) {
		console.log('writeLog Insert error: '+err.message); 
	}) //	.then()
};

function addObject(objectname,mapname,locx,locy,hp,ammo,score,ticksremaining,objectowner,updatelocation,objecttype) {
	//Spawn the object
	$gameObjects.push({'objectname':objectname,'mapname':mapname,'locx':locx,'locy':locy,'hp':hp,'ammo':ammo,'score':score,'ticksremaining':ticksremaining,'objectowner':objectowner,'updatelocation':1,'objecttype':objecttype})
	
	//If projectile, remove ammo from the owner.
	if (objecttype = 'projectile') {
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
		object.locx = object.locx + projectileSpeed
	} else if (object.locx > object.ammo) { 
		object.locx = object.locx - projectileSpeed
	} 
	if (object.locy < object.score) { 
		object.locy = object.locy + projectileSpeed
	} else if (object.locy > object.score) { 
		object.locy = object.locy - projectileSpeed
	} 
};

function gameTick() {
	//Loop through game objects
	for (object in $gameObjects.filter(o => {return o.hp <= 0})) {
		if ($gameObjects[object].objecttype == 'player') { //if player, respawn. 
			$gameObjects[object].locx = Math.round(Math.random() * map.x)
			$gameObjects[object].locy = Math.round(Math.random() * map.y)
			$gameObjects[object].hp = 100
			$gameObjects[object].ammo = 100
			$gameObjects[object].score = 0
			$gameObjects[object].ticksremaining = 100
			$gameObjects[object].updatelocation = 1
		}else if ($gameObjects[object].objecttype == 'npc') { //if demon, spawn ammo.
			addObject('ammodrop',map.name,$gameObjects[object].x,$gameObjects[object].y,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'ammodrop',1,'ammodrop');
		}else if ($gameObjects[object].objecttype == 'projectile') { //if projectile 
		}else if ($gameObjects[object].objecttype == 'ammo') { //if ammo 
		}else if ($gameObjects[object].objecttype == 'block') { //if block, spawn ammo.
			addObject('ammodrop',map.name,$gameObjects[object].x,$gameObjects[object].y,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,'ammodrop',1,'ammodrop');
		}else { //everyone else
		}	
	}
	
	$gameObjects = $gameObjects.filter(o => {return o.hp > 0})
	for (object in $gameObjects) {
		if ($gameObjects[object].objectType == 'player' || $gameObjects[object].objecttype == 'player') { //if player 
			$gameObjects[object].ticksremaining--
		}else if ($gameObjects[object].objectType == 'npc' || $gameObjects[object].objecttype == 'npc') { //if demon 
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objectType == 'projectile' || $gameObjects[object].objecttype == 'projectile') { //if prjectile
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objectType == 'ammo' || $gameObjects[object].objecttype == 'ammo') { //if projectile 
			$gameObjects[object].hp--
			moveObject($gameObjects[object])
		}else if ($gameObjects[object].objectType == 'block' || $gameObjects[object].objecttype == 'block') { //if block
		}else { //everyone else
		}	
	} // end for object

			
	for (object in $gameObjects.filter(o => {return o.objectType != 'block'}).filter(o => {return o.objectType != 'player'}).filter(o => {return o.objectType != 'npc'})) { // Collision
		for (collidingObject in $gameObjects) { // receiving
			if (object.x <= (collidingObject.x + 32)
			&& collidingObject.x <= (object.x + 32)
			&& object.y <= (collidingObject.y + 32)
			&& collidingObject.y <= (object.y + 32)) {
				if ($gameObjects[object].objectType == 'projectile') { //if projectile 
					$gameObjects[collidingObject].hp--
					$gameObjects[object].hp = 0
					$gameObjects[$gameObjects[object].objectowner].score++
				}else if ($gameObjects[object].objectType == 'ammo') { //if ammo 
					// If collision with ammo
					if ($gameObjects[collidingObject].objectType == 'player') { //if object 
						$gameObjects[collidingObject].ammo += 25
						$gameObjects[object].hp = 0
					}
				}	
			} // end if object
		} // end for object
	} // end for object

	for (object in $gameObjects.filter(o => {return o.objectType != 'block'}).filter(o => {return o.objectType != 'projectile'})) { // Collision
		for (collidingObject in $gameObjects) { // receiving
			if (object.x <= (collidingObject.x + 32)
			&& collidingObject.x <= (object.x + 32)
			&& object.y <= (collidingObject.y + 32)
			&& collidingObject.y <= (object.y + 32)) {

				if (object.x < collidingObject.x) {object.x -= 10}
				if (object.x > collidingObject.x) {object.x += 10}
				if (object.y < collidingObject.y) {object.y -= 10}
				if (object.y > collidingObject.y) {object.y += 10}
					
			} // end if object
		} // end for object
	} // end for object


	//Add random block and demon.
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('block',map.name,Math.round((Math.random() * 250))*40,Math.round((Math.random() * 250))*40,10,0,0,100,'block',1,'block');
	}
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('demon',map.name,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),10,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),1,'demon',1,'npc');
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

	if($gameObjects.filter(o => {return o.objectname == player.objectname}).length <=0){
	}
	
	var $returnGameObjects
	if (typeof player.x == "undefined" || typeof player.y == "undefined" ) {
		$returnGameObjects = $gameObjects.filter(o => {return o.objecttype == 'player'})
		$returnGameObjects.push($gameObjects.filter(o => {return o.objecttype == 'npc'}))
	} else {//if player.x and player.y are known
	
		if (player.x <= 0){player.x = 0}
		if (player.y <= 0){player.y = 0}
		if (player.x >= map.x){player.x = map.x}
		if (player.y >= map.y){player.y = map.y}

			//Update player location, if it's not too far away.
		var object = $gameObjects.filter(o => {return o.objectname == $user})[0]
		if (player.x <= (object.locx + map.playerMoveSpeed)
		&& object.locx <= (player.x + map.playerMoveSpeed)
		&& player.y <= (object.locy + map.playerMoveSpeed)
		&& object.locy <= (player.y + map.playerMoveSpeed)) {
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
	$returnGameObjects = $gameObjects.filter(o => {return o.locx > player.x-2000}).filter(o => {return o.locx < player.x+2000}).filter(o => {return o.locy > player.y-2000}).filter(o => {return o.locy < player.y+2000})
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
writeLog($serviceName + ' version '+$gameData.ver+' is running on port ' + $servicePort);
console.log($serviceName + ' version '+$gameData.ver+' is running on port ' + $servicePort);
//}


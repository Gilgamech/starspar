//StarSpar server file.
//(c) 2019 Gilgamech Technologies
var $gameData = {};
$gameData.ver = 197

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

projectileSpeed = 3;

//How fast the game should update.
var $ticks = 10
var $tickDelay = (1000/$ticks)
var $saves = 10
var $saveDelay = (1000*$saves)
var then = Date.now();
var $gameTick = 0;
var $gameSave = 0;
var $clickCheck = false;

//load $gameObjects var.
var $gameObjects;
sparational.starspar.query("SELECT * FROM starsparLocations;").then(([$locResults, metadata]) => {
	$gameObjects = $locResults;
}).catch(function(err) {
	writeLog("Invalid locResults attempt - SELECT * FROM starsparLocations - " + err.message)
	console.log("Invalid locResults attempt.") 
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
		console.log('writeLog Insert error: '); 
		console.log(err); 
	}) //	.then()
};

function addObject(objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType) {
	//Spawn the object
	$gameObjects[$gameObjects.length].objectName = objectName
	$gameObjects[$gameObjects.length].mapName = mapName
	$gameObjects[$gameObjects.length].locX = locX
	$gameObjects[$gameObjects.length].locY = locY
	$gameObjects[$gameObjects.length].hp = hp
	$gameObjects[$gameObjects.length].ammo = ammo
	$gameObjects[$gameObjects.length].score = score
	$gameObjects[$gameObjects.length].ticksremaining = ticksremaining
	$gameObjects[$gameObjects.length].objectOwner = objectOwner
	$gameObjects[$gameObjects.length].updateLocation = updateLocation
	$gameObjects[$gameObjects.length].objectType = objectType
	
	//If projectile, remove ammo from the owner.
	if (objectType = 'projectile') {
		$gameObjects[objectOwner].ammo--
	}

};

function gameSave() { 
};

function moveObject(object) { 
	if (object.locx > object.ammo) { 
		object.locx = object.locx + projectileSpeed
	} else if (object.locx < object.ammo) { 
		object.locx = object.locx - projectileSpeed
	} 
	if (object.locy > object.score) { 
		object.locy = object.locy + projectileSpeed
	} else if (object.locy < object.score) { 
		object.locy = object.locy - projectileSpeed
	} 
};

function gameTick() {
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
	$gameTick += delta;
	if ($gameTick > $tickDelay) {
		$gameTick -= $tickDelay;
        gameTick();
	}
	$gameSave += delta;
	if ($gameSave > $saveDelay) {
		$gameSave -= $saveDelay;
		gameSave();
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
		if (player.x <= (object.locx + 32)
		&& object.locx <= (player.x + 32)
		&& player.y <= (object.locy + 32)
		&& object.locy <= (player.y + 32)) {
			object.locx = player.x;
			object.locy = player.y;
		} else {
			console.log("Player at x:"+player.x+" y:"+player.y+" but server has x:"+object.locx+" y:"+object.locy)
		}

	if (player.mouseClicked == true && $clickCheck == false){
		$clickCheck = true
		addObject('projectile',map.name,player.x,player.y,100,player.mouseX,player.mouseY,100,$user,0,'projectile');
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


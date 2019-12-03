//StarSpar server file.
//(c) 2019 Gilgamech Technologies
var $gameData = {};
$gameData.ver = 248

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
		console.log('writeLog Insert error: '+err.message); 
	}) //	.then()
};

function addObject(objectName,mapName,locX,locY,hp,ammo,score,ticksremaining,objectOwner,updateLocation,objectType) {
	//Spawn the object
	$gameObjects.push({'objectname':objectName,'mapname':mapName,'locx':locX,'locy':locY,'hp':hp,'ammo':ammo,'score':score,'ticksremaining':ticksremaining,'objectOwner':objectOwner,'updateLocation':1,'objectType':objectType})
	
	//If projectile, remove am	mo from the owner.
	if (objectType = 'projectile') {
		var object = $gameObjects.filter(o => {return o.objectname == objectOwner})[0]
		object.ammo--
	}

};

function gameSave() { 
	$saveObjects = $gameObjects.filter(o => {return o.updateLocation == 1})
	console.log("gameSave count "+$saveObjects.length)
	for(row = 0;row < $saveObjects.length;row++) {
		if (typeof $saveObjects[row].id != "undefined"){
			sparational.sequelize.query("UPDATE starsparLocations SET locx='"+$saveObjects[row].locX+"', locy='"+$saveObjects[row].locY+"', hp='"+$saveObjects[row].hp+"',ticksremaining='"+$saveObjects[row].ticksremaining+"',updateLocation=0 WHERE id=''"+$saveObjects[row].id+"'';").then(([$PagesResults, metadata]) => {
				writeLog("gameSave update id "+$saveObjects[row].id+" results: "+ metadata)
			}).catch(function(err) {
				writeLog('gameSave update error: '+err.message); 
			}) 
		}else{
			sparational.sequelize.query("INSERT INTO starsparLocations (objectname, mapname, locx, locy, hp, ammo, score, ticksremaining,updatelocation,objectype) SELECT '"+$saveObjects[row].objectName+"', '"+$saveObjects[row].mapName+"', '"+$saveObjects[row].locX+"', '"+$saveObjects[row].locY+"', '"+$saveObjects[row].hp+"', '"+$saveObjects[row].ammo+"', '"+$saveObjects[row].score+"', '"+$saveObjects[row].ticksremaining+"', 0, '"+$saveObjects[row].objectType+"';").then(([$PagesResults, metadata]) => {
				writeLog("gameSave Insert results: "+ metadata)
			}).catch(function(err) {
				writeLog('gameSave Insert error: '+err.message); 
			}) 
		}
	}
};

function moveObject(object) { 
	object.updateLocation = 1
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
		if ($gameObjects[object].objectType == 'player') { //if player, respawn. 
			$gameObjects[object].locx = Math.round(32 + (Math.random() * (map.x - 64)),4)
			$gameObjects[object].locy = Math.round(32 + (Math.random() * (map.x - 64)),4)
			$gameObjects[object].hp = 100
			$gameObjects[object].score = 0
			$gameObjects[object].ticksremaining = 100
			$gameObjects[object].updatelocation = 1
		}else if ($gameObjects[object].objectType == 'npc' || $gameObjects[object].objecttype == 'npc') { //if demon, spawn ammo.
			addObject('ammodrop',map.name,$gameObjects[object].x,$gameObjects[object].y,1000,Math.round(32 + (Math.random() * (map.x - 64)),4),Math.round(32 + (Math.random() * (map.x - 64)),4),100,'ammodrop',1,'ammodrop');
		}else if ($gameObjects[object].objectType == 'projectile' || $gameObjects[object].objecttype == 'projectile') { //if projectile 
		}else if ($gameObjects[object].objectType == 'ammo' || $gameObjects[object].objecttype == 'ammo') { //if ammo 
		}else if ($gameObjects[object].objectType == 'block' || $gameObjects[object].objecttype == 'block') { //if block, spawn ammo.
			addObject('ammodrop',map.name,$gameObjects[object].x,$gameObjects[object].y,1000,Math.round(32 + (Math.random() * (map.x - 64)),4),Math.round(32 + (Math.random() * (map.x - 64)),4),100,'ammodrop',1,'ammodrop');
		}else { //everyone else
		}	
	}
	
	$gameObjects = $gameObjects.filter(o => {return o.hp > 0})
	for (object in $gameObjects) {
		if(object.objecttype){object.objectType = object.objecttype}
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

	//Add random block and demon.
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('block',map.name,Math.round(32 + (Math.random() * (map.x - 64)),4),Math.round(32 + (Math.random() * (map.x - 64)),4),10,0,0,100,'block',1,'block');
	}
	if (Math.floor(Math.random() *1000) > 990) {
		addObject('demon',map.name,Math.round(32 + (Math.random() * (map.x - 64)),4),Math.round(32 + (Math.random() * (map.x - 64)),4),10,Math.round(32 + (Math.random() * (map.x - 64)),4),Math.round(32 + (Math.random() * (map.x - 64)),4),1,'demon',1,'npc');
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
			object.updateLocation = 1
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


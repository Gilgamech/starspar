//StarSpar server file.
//(c) 2019 Gilgamech Technologies
var $gameData = {};
$gameData.ver = 186

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

projectileSpeed = 100;

//How fast the game should update.
var $ticks = 10
var $tickDelay = (1000/$ticks)
var then = Date.now();
var $cumulativeTick = 0;
var $clickCheck = false;

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
//}

//{ StarSpar
$http.createServer(function (request, response) {
	response.setHeader('Access-Control-Allow-Origin', "*")
	try {
if (request.method == "GET") {
	writeLog(request.method +" request from address:" + request.connection.remoteAddress + " on path: "+request.connection.remotePort+" for path " + request.url)

	sparational.html("starspar.gilgamech.com",function($callback) {
		//Need to add login to page.
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

	if (typeof player.x == "undefined" || typeof player.y == "undefined" ) {
		sparational.starspar.query("SELECT * FROM starsparLocations where mapname = '"+map.name+"' AND ticksremaining > 0 OR objectName='"+$user+"';").then(([$locResults, metadata]) => {
            var $keyCallback = ""+$user+":" + $sessionID +":" + $sessionKey 
			response.end($keyCallback+":scores:"+JSON.stringify($locResults)+":gameData:"+JSON.stringify($gameData))
		}).catch(function(err) {
			writeLog("Invalid locResults attempt - SELECT * FROM starsparLocations where mapname = '"+map.name+"' AND ticksremaining > 0 OR objectName='"+$user+"' - " + err.message)
			console.log("Invalid locResults attempt.") 
		})
	} else {//if player.x and player.y are known
	if (player.x <= 0){player.x = 0}
	if (player.y <= 0){player.y = 0}
	if (player.x >= map.x){player.x = map.x}
	if (player.y >= map.y){player.y = map.y}

	if (player.mouseClicked == true && $clickCheck == false){
		$clickCheck = true
		sparational.starspar.query("SELECT insertProjectile('"+$user+"','"+map.name+"',"+player.x+","+player.y+","+player.mouseX+","+player.mouseY+");").then(([$PagesResults, metadata]) => {
		}).catch(function(err) {
			writeLog("Invalid insertProjectile attempt - SELECT insertProjectile('"+$user+"','"+map.name+"',"+player.x+","+player.y+","+player.mouseX+","+player.mouseY+"); - "+ err.message)
		})//end insertProjectile query
	}else if (player.mouseClicked == false && $clickCheck == true){
		$clickCheck = false
	}

	//gameTick
	var now = Date.now();
	var delta = now - then;
	$cumulativeTick += delta;
	if ($cumulativeTick > $tickDelay) {
		$cumulativeTick -= $tickDelay;
		sparational.starspar.query("SELECT gameTick();").then(([$PagesResults, metadata]) => {
		}).catch(function(err) {
			writeLog("Invalid gameTick attempt: " + err.message)
			console.log("Invalid gameTick attempt.") 		
		})
	}	

	// Store player location, send back all object locations and player scores for the player's map.
		sparational.starspar.query("SELECT * FROM updatePlayer2('"+$user+"','"+map.name+"',"+player.x+","+player.y+",0);").then(([$PagesResults, metadata]) => {
			$demonResults = $PagesResults.filter(o => {return o.objectname=="demon"})[0]
			demon.x = $demonResults.locx
			demon.y = $demonResults.locy
			
			// If collision
			if (player.x <= (demon.x + 32)
			&& demon.x <= (player.x + 32)
			&& player.y <= (demon.y + 32)
			&& demon.y <= (player.y + 32)) {
				// choose & store demon location
				sparational.starspar.query("SELECT resetDemon('"+$user+"');")
			};//end collision calculations
			
            var $keyCallback = ""+$user+":" + $sessionID +":" + $sessionKey 
			response.end($keyCallback+":scores:"+JSON.stringify($PagesResults)+":gameData:"+JSON.stringify($gameData))
		}).catch(function(err) {
			writeLog("Invalid updatePlayer2 attempt - SELECT * FROM updatePlayer2('"+$user+"','"+map.name+"',"+player.x+","+player.y+",0); - " + err.message)
		})//end Pages query

} // else if player.x and player.y are known.
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
writeLog('Service is running on port ' + $servicePort);
console.log($serviceName + ' is running on port ' + $servicePort);
//}


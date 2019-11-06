//StarSpar server file.
//(c) 2019 Gilgamech Technologies

//{ Init vars
var $http = require("http");
var sparational = require("sparational");
var $serviceName = "StarSpar";
var $servicePort = (process.env.PORT || 5010);
var $hostName = (process.env.HOST || "localhost:"+$servicePort);
sparational.starspar = new sparational.Sequelize(process.env.STARSPAR_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});
sparational.sequelize = new sparational.Sequelize(process.env.LOGGING_DATABASE_URL || 'postgres://postgres:dbpasswd@127.0.0.1:5432/postgres', {logging: false});
var heero = {};
var demon = {};
//}

//{ functions
String.prototype.octEncode = function(){
    var hex, i;
 
    var result = "";
    for (i=0; i<this.length; i++) {
        hex = this.charCodeAt(i).toString(8);
        result += ("000"+hex).slice(-4);
    }
 
    return result
}
String.prototype.octDecode = function(){
    var j;
    var hexes = this.match(/.{1,4}/g) || [];
    var back = "";
    for(j = 0; j<hexes.length; j++) {
        back += String.fromCharCode(parseInt(hexes[j], 8));
    }
 
    return back;
}
function swimmersEncode($swimmers){
    return $swimmers .octEncode().replace(/0/g,"~-~ ").replace(/1/g,"-~- ").replace(/2/g,"   ").replace(/3/g,"O_|").replace(/4/g,"o__").replace(/5/g,"o,").replace(/6/g,"o_").replace(/7/g,",")
}
function swimmersDecode($swimmers){
    return $swimmers.replace(/\~-~ /g,0).replace(/-~- /g,1).replace(/   /g,2).replace(/O_\|/g,3).replace(/o__/g,4).replace(/o,/g,5).replace(/o\_/g,6).replace(/,/g,7).octDecode() 
}var $page_views = 0;

function refreshKey($user) {
	var $outkey = {}
	$sessionID = getBadPW()
	$sessionKey = getBadPW()
	$output = ""+$user+":" + $sessionID +":" + $sessionKey 
	sparational.sequelize.query("UPDATE Sessions SET logintime = current_timestamp, sessionid = '"+$sessionID+"', sessionkey = '"+$sessionKey+"' WHERE sessionuser='"+$user+"';INSERT INTO Sessions (sessionuser, sessionid,sessionkey) SELECT '"+$user+"','"+$sessionID+"','"+$sessionKey+"' WHERE NOT EXISTS (SELECT 1 FROM Sessions WHERE sessionuser='"+$user+"');")
	return $user + ":" + $sessionID + ":" + $sessionKey
};

function resetDemon($user) {
	// Throw the demon somewhere on the screen randomly
	demon.x = Math.round(32 + (Math.random() * (1000 - 64)),4); //canvas.width = map.width
	demon.y = Math.round(32 + (Math.random() * (1000 - 64)),4); //canvas.height = map.height
	sparational.starspar.query("UPDATE starsparLocations SET locx = '"+demon.x+"', locy='"+demon.y+"' WHERE objectName = 'demon';").then(([$PagesResults, metadata]) => {
  
	}).catch(function(err) {
		writeLog("Invalid resetDemon attempt: " + err.message)
		console.log("Invalid resetDemon attempt.") 
	})//end Pages query
	//Increment & store the player's score
	sparational.starspar.query("UPDATE starsparLocations SET score = (SELECT score from starsparLocations WHERE objectName = '"+$user+"')+1 WHERE objectName = '"+$user+"';").then(([$PagesResults, metadata]) => {
	}).catch(function(err) {
		writeLog("Invalid resetDemon attempt: " + err.message)
		console.log("Invalid resetDemon attempt.") 
	})//end Pages query
	
};

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
    if (request.url.indexOf("/starspar?") > 0) {//starspar from starspar
	var inputPacket = request.url.split("/starspar?")[1].split("&")
	var $user = inputPacket[0].split("=")[1]
	var $sessionID = inputPacket[1].split("=")[1]
	var $sessionKey = inputPacket[2].split("=")[1]
	$sessionID = $sessionID.replace(/;/g,"")

	sparational.sequelize.query("SELECT sessionuser FROM Sessions WHERE sessionid = '"+$sessionID+"';").then(([$SessionResults, metadata]) => {
	if ($user==$SessionResults[0].sessionuser) {
	//Tables - Player, Ship
// Receive player keystrokes
	player = request.url.split("/&heero=?")[1].split("&")[3].split("=")[1]
	player = player.replace(/~~/g,"#")
	player = player.replace(/%20/g,'')
	player = player.replace(/%22/g,'"')
	player = JSON.parse(player)
	// Store player location
	sparational.starspar.query("UPDATE starsparLocations (x, y, score) VALUES ('"+player.x+"','"+player.y+"') where player='"+$user+"'").then(([$PagesResults, metadata]) => {
	}).catch(function(err) {
			writeLog("Invalid starspar starspar attempt: " + err.message + " - from server: " + request.connection.remoteAddress + " for path " + request.url)
		response.end("Invalid starspar starspar attempt.") 
	})//end update loc

// perform collision calculations - Are they touching?			
	// If collision
	if (player.x <= (demon.x + 32)
	&& demon.x <= (player.x + 32)
	&& player.y <= (demon.y + 32)
	&& demon.y <= (player.y + 32)) {
		// choose & store demon location
		resetDemon($user);
	};//end if player
	//Send back all object locations and player scores for the player's map.
	sparational.starspar.query("SELECT * FROM starsparLocations where mapname = '"+map+"')").then(([$ScoresResults, metadata]) => {
		response.end(refreshKey($user)+":"+JSON.stringify($ScoresResults))
	}).catch(function(err) {
			writeLog("Invalid starspar response attempt: " + err.message + " - from server: " + request.connection.remoteAddress + " for path " + request.url)
		response.end("Invalid starspar response attempt.") 
	})
	
		} else {
			writeLog("Invalid starspar attempt: bad session key for user: "+$user+" sessionID: " + $sessionID +" from server: " + request.connection.remoteAddress + " for path " + request.url)
			response.end("Invalid starspar attempt: bad session key for user: " + $user + " with sessionID-to-swim: " + swimmersEncode($sessionID)) 
		}//end if user
		}).catch(function(err) {
			console.log('Sites error: '+err.message); 
			response.end(err.message)
		});//end Session query

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
resetDemon('demon');
writeLog('Service is running on port ' + $servicePort);
console.log($serviceName + ' is running on port ' + $servicePort);
//}

/*
Logout

Auth
- Read strings from cookie, check against DB, verify IP and other deets.
- "It looks like you were logged in at a different location. Could you verify your login?"

SessionID - Hash of username, IP, port, other identifying info.
SessionKey - Hash of sessionID, GoogleAPIKey, other API keys, other data. (hash whole webpage as key? Or just with key?)

*/


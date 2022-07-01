//StarSpar server file.
//(c) 2019 Gilgamech Technologies

import java.io.*;
import java.net.*;
import java.util.*;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;


/* Unused import
import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Hashtable;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.io.InputStream;
import java.math.BigInteger;
var AWS = require("aws-sdk");
 */


class starspar {

    public static void main(String[] args) throws Exception {
		//int servicePort = (process.env.servicePort || 5010);
		//String hostName = (process.env.HOST || "localhost:"+servicePort);
		int servicePort = 9000;
		String hostName = "localhost:"+servicePort;

		String serviceName = "StarSpar";

/* Init vars
		var demon = {};

		var gameData = {};
		gameData.ver = 381
		var map = {};
		map.x = 10000
		map.y = 10000
		map.name = "noob"
		map.playerMoveSpeed = 320
		map.projectileMoveSpeed = 3
		map.demonHp = 20
		map.blockHp = 50
	sparational.starspar = new sparational.Sequelize(process.env.STARSPAR_DATABASE_URL || "postgres://postgres:dbpasswd@127.0.0.1:5432/postgres", {logging: false});
	sparational.sequelize = new sparational.Sequelize(process.env.LOGGING_DATABASE_URL || "postgres://postgres:dbpasswd@127.0.0.1:5432/postgres", {logging: false});
*/

/* How fast the game should update.
var gameObjects;
*/
int ticksPerSecond = 10;
int tickDelay = (1000/ticksPerSecond);
int minutesBetweenSaves = 5;
int saveDelay = (60*1000*minutesBetweenSaves);
Date then = new Date();  
int gameTick = 0;
int gameSave = 0;
boolean clickCheck = false;

int hitBox = 32;


/* AWS
var awsAccessKey = (process.env.AWS_S3_KEY || "AKIAJRTFMIYY4QEMZJ4Q")
var awsSecretKey = (process.env.AWS_S3_SECRET_KEY || "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")
var awsRegion = (process.env.AWS_S3_REGION || "us-west-2")
AWS.config.update({ accessKeyId: awsAccessKey, secretAccessKey: awsSecretKey, region: awsRegion});
var s3 = new AWS.S3();
*/

/* load map
*/
String BUCKET_NAME = "gilpublic";

String file = "starspar/gamesave.json";
/*
var getParams = {
	Bucket: BUCKET_NAME,
	Key: file
};
s3.getObject(getParams, public static void  (err, data) {
    if (err) {
        System.out.println("gameObjects err: "+err);
    } else {
		gameObjects = JSON.parse(data.Body)
		for (object in gameObjects) {
			gameObjects[object].id = object;
		}// reindex input.
		//Filter out misplaced blocks.
		gameObjects = gameObjects.filter(o => {return o.objecttype == "block"}).filter(o => {return o.locx % 40 == 0}).filter(o => {return o.locy % 40 == 0})
		//gameObjects = gameObjects.filter(o => {return o.locX % 20 = 0})
		System.out.println("Reindexing complete - indexed "+gameObjects.length+" game objects");
        System.out.println("gameObjects test data: "+JSON.stringify(gameObjects[0])); //this will log data to console
    }
})
*/

/* load IP autoblock
//var autoblock = sequelize select * from autoblock
*/

		System.out.println("server started at " + servicePort);
		HttpServer server = HttpServer.create(new InetSocketAddress(servicePort), 0);
        server.createContext("/", new MyHandler());
        server.setExecutor(null); // creates a default executor
        server.start();

/* End of Main
System.out.println(serviceName + " version "+gameData.ver+" is running on servicePort " + servicePort);

process.on("SIGTERM", public static void  () {
    server.close( public static void  () {
		gameSave()
		process.exit(0);
	});
});
	}
 */
    }	//end main

    static class MyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exch) throws IOException {
			Date date = new Date();
			writeLog(date+"-Request type " + exch.getRequestMethod() + " request from " + exch.getRemoteAddress());
            String response;
			if (exch.getRequestMethod() == "GET") {
				response = "Request type: " + exch.getRequestMethod() + " - Default web page goes here.";
			} else {
				response = "Request type: " + exch.getRequestMethod() + " - POST response here.";
			}
            exch.sendResponseHeaders(200, response.length());
            OutputStream os = exch.getResponseBody();
            os.write(response.getBytes());
            os.close();
        } //end handle
    } //end MyHandler


/*public static void  getBadPW() { 
		return Math.random().toString(36).slice(-20).slice(2); 
	};
*/
/*
*/
	  public static void writeLog(String msg) { 
		System.out.println("writeLog: "+msg); 
	};

/*public static void  addObject(objectname,mapname,locx,locy,hp,ammo,score,ticksremaining,objectowner,updatelocation,objecttype) {
		var id = (gameObjects.length);
		if (objecttype == "projectile") {
			var shooter = gameObjects.filter(o => {return o.objectname == objectowner})[0]
			if (shooter.ammo > 0) {
			//If projectile, remove ammo from the owner.
				shooter.ammo--
				gameObjects.push({"id":id,"objectname":objectname,"mapname":mapname,"locx":locx,"locy":locy,"hp":hp,"ammo":ammo,"score":score,"ticksremaining":ticksremaining,"objectowner":objectowner,"updatelocation":1,"objecttype":objecttype})
			}
		}else{
		//Spawn the object
			gameObjects.push({"id":id,"objectname":objectname,"mapname":mapname,"locx":locx,"locy":locy,"hp":hp,"ammo":ammo,"score":score,"ticksremaining":ticksremaining,"objectowner":objectowner,"updatelocation":1,"objecttype":objecttype})
		}
	};
*/

/*public static void  gameSave() { 
		var putParams = {
			Bucket: BUCKET_NAME,
			Key: file,
			Body: JSON.stringify(gameObjects),
			ContentType: "application/json",
			ACL: "public-read"
		};
		s3.putObject(putParams,public static void  (err,data) {
			if (err) {
				System.out.println("gameSave err: "+err);
			} else {
				System.out.println("gameSave test data: "+JSON.stringify(data)); //this will log data to console
			}
		});
	};
*/

/*public static void  moveObject(object) {
		object.updatelocation = 1;
		if (object.locx < object.ammo) {
			if (object.locx > object.ammo-map.projectileMoveSpeed) {
				object.ammo = object.locx;
			}
			object.locx = object.locx + map.projectileMoveSpeed
		} else if (object.locx > object.ammo) { 
			if (object.locx < object.ammo+map.projectileMoveSpeed) {
				object.ammo = object.locx;
			}
			object.locx = object.locx - map.projectileMoveSpeed
		} 
		if (object.locy < object.score) { 
			if (object.locy > object.score-map.projectileMoveSpeed) {
				object.score = object.locy;
			}
			object.locy = object.locy + map.projectileMoveSpeed
		} else if (object.locy > object.score) { 
			if (object.locy < object.score+map.projectileMoveSpeed) {
				object.score = object.locy;
			}
			object.locy = object.locy - map.projectileMoveSpeed
		} 
	};
*/

/*public static void  gameTick() {
		//Handle all with HP below zero
		belowZeroHp = gameObjects.filter(o => {return o.hp <= 0}) 
		for (object in belowZeroHp) {
			if (belowZeroHp[object].objecttype == "player") { //if player, respawn. 
				belowZeroHp[object].locx = Math.round(Math.random() * map.x)
				belowZeroHp[object].locy = Math.round(Math.random() * map.y)
				belowZeroHp[object].hp = 100
				belowZeroHp[object].ammo = 100
				belowZeroHp[object].score = 0
				belowZeroHp[object].ticksremaining = 100
				belowZeroHp[object].updatelocation = 1
			}else if (belowZeroHp[object].objecttype == "npc" && Math.floor(Math.random() *1000) > 250) { //if demon, spawn ammo.
				if (Math.floor(Math.random() *1000) > 750) { //if demon, spawn ammo.
					addObject("ammodrop",map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,"ammodrop",1,"ammodrop");
				}else{
					addObject("hpdrop",map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,"hpdrop",1,"hpdrop");
				}
			}else if (belowZeroHp[object].objecttype == "projectile") { //if projectile 
			}else if (belowZeroHp[object].objecttype == "ammodrop") { //if ammo 
			}else if (belowZeroHp[object].objecttype == "hpdrop") { //if ammo 
			}else if (belowZeroHp[object].objecttype == "block" && Math.floor(Math.random() *1000) > 250) { //if block, spawn ammo.
				if (Math.floor(Math.random() *1000) > 250) { //if demon, spawn ammo.
					addObject("ammodrop",map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,"ammodrop",1,"ammodrop");
				}else{
					addObject("hpdrop",map.name,belowZeroHp[object].locx,belowZeroHp[object].locy,1000,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),100,"hpdrop",1,"hpdrop");
				}
			}else { //everyone else
			}	
		}
		
		//Snip all with HP below zero
		gameObjects = gameObjects.filter(o => {return o.hp > 0}).filter(o => {return o.objecttype})
		
		for (object in gameObjects) {
		gameObjects[object].updatelocation = 0
		if (typeof gameObjects[object].id == "undefined"){gameObjects[object].id = gameObjects.length}
		//Handle all with HP above zero
			if (gameObjects[object].objecttype == "projectile") { //if prjectile
				//If collides with:
					var blockObjects = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "block"}) 
					for (collidingObject in blockObjects){
						try{blockObjects[collidingObject].hp--}catch(e){}
						gameObjects[object].hp = 0
						blockObjects.filter(o => {return o.objectname == gameObjects[object].objectowner}).score++
					}
					var npcObjects = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "npc"}) 
					for (collidingObject in npcObjects){
						npcObjects[collidingObject].hp--
						gameObjects[object].hp = 0
						npcObjects.filter(o => {return o.objectname == gameObjects[object].objectowner}).score++
					}

				gameObjects[object].hp--
				moveObject(gameObjects[object])
			}else if (gameObjects[object].objecttype == "player") { //if player
				//Keep them from getting too much HP or ammo.
				if (gameObjects[object].hp > 100) {gameObjects[object].hp = 100}
				if (gameObjects[object].ammo > 100) {gameObjects[object].ammo = 100}
				if (gameObjects[object].ticksremaining > 0) {gameObjects[object].ticksremaining--}
				
				//If collides with:
				var notBlockObjects = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype != "block"})
				notBlockObjects = notBlockObjects.filter(o => {return o.objecttype != "hpdrop"}).filter(o => {return o.objecttype != "projectile"}).filter(o => {return o.objecttype != "ammodrop"})
				//not colliding with itself
				notBlockObjects = notBlockObjects.filter(o => {return o.objectname != gameObjects[object].objectname})
				//collide with demons and players - knock them back.
				for (collidingObject in notBlockObjects){
					gameObjects[object].hp--
					notBlockObjects[collidingObject].hp--
					if (gameObjects[object].locx < notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx += 25}
					if (gameObjects[object].locx > notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx -= 25}
					if (gameObjects[object].locy < notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy += 25}
					if (gameObjects[object].locy > notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy -= 25}
				}
				//Collide with blocks, get knocked back.
				var blockObjects2 = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "block"})
				for (collidingObject in blockObjects2){
					gameObjects[object].hp--
					blockObjects2[collidingObject].hp--
					if (gameObjects[object].locx < blockObjects2[collidingObject].locx) {gameObjects[object].locx -= 25}
					if (gameObjects[object].locx > blockObjects2[collidingObject].locx) {gameObjects[object].locx += 25}
					if (gameObjects[object].locy < blockObjects2[collidingObject].locy) {gameObjects[object].locy -= 25}
					if (gameObjects[object].locy > blockObjects2[collidingObject].locy) {gameObjects[object].locy += 25}
				}
				
				
			}else if (gameObjects[object].objecttype == "npc") { //if demon 
				//if (gameObjects[object].objectname == "demon") {gameObjects[object].objectname = getBadPW()}
				//If near target, find a new one.
				if (gameObjects[object].locx < gameObjects[object].ammo+5
				&& gameObjects[object].locx +5 > gameObjects[object].ammo) {gameObjects[object].ammo = Math.round(Math.random() * map.x)}
				if (gameObjects[object].locy < gameObjects[object].score+5
				&& gameObjects[object].locy +5 > gameObjects[object].score) {gameObjects[object].score = Math.round(Math.random() * map.y)}
				moveObject(gameObjects[object])

				//Collide with blocks, mirror target.
				var blockObjectsNPC = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "block"})
				for (collidingObject in blockObjectsNPC){
					gameObjects[object].hp--
					blockObjectsNPC[collidingObject].hp--
					gameObjects[object].ammo = gameObjects[object].locx-(gameObjects[object].ammo-gameObjects[object].locx)
					//if demon"s left of block, then it"s moving right, so set ammo = demon.x-(ammo-demon.x)
					//demon 3800 ammo 4200 = 3800-(4200-3800) = 3400
					//if demon"s right of block, then it"s moving left, so set ammo = demon.x-(ammo-demon.x)
					//demon 4200 ammo 3800 = 4200-(3800-4200) = 4800
					gameObjects[object].score = gameObjects[object].locy-(gameObjects[object].score-gameObjects[object].locy)
					//demon 3800 score 4200 = 3400
					//demon 4200 score 3800 = 4800
				}
				
				
			}else if (gameObjects[object].objectType == "ammodrop" || gameObjects[object].objecttype == "ammodrop") { //if ammodrop 
					var playerObjects = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "player"}) 
					for (collidingObject in playerObjects){
						playerObjects[collidingObject].ammo += 25
						gameObjects[object].hp = 0
					}
				gameObjects[object].hp--
				moveObject(gameObjects[object])
				
				
			}else if (gameObjects[object].objectType == "hpdrop" || gameObjects[object].objecttype == "hpdrop") { //if hpdrop 
					var playerObjects = gameObjects.filter(o => {return o.locx <= gameObjects[object].locx+hitBox}).filter(o => {return o.locx >= gameObjects[object].locx -hitBox}).filter(o => {return o.locy <= gameObjects[object].locy+hitBox}).filter(o => {return o.locy >= gameObjects[object].locy -hitBox}).filter(o => {return o.objecttype == "player"}) 
					for (collidingObject in playerObjects){
						playerObjects[collidingObject].hp += 25
						gameObjects[object].hp = 0
					}
				gameObjects[object].hp--
				moveObject(gameObjects[object])
			}else if (gameObjects[object].objecttype == "block") { //if block
			}else { //everyone else
				writeLog("Unhandled object Type: "+gameObjects[object].objectType+" and type:"+gameObjects[object].objecttype)
			}	
		} // end for object

				
		//Add random block and demon.
		if (Math.floor(Math.random() *1000) > 800) {
			addObject("block",map.name,Math.round((Math.random() * 250))*40,Math.round((Math.random() * 250))*40,map.blockHp,0,0,100,"block",1,"block");
		}
		if (Math.floor(Math.random() *1000) > 800) {
			addObject(getBadPW(),map.name,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),map.demonHp,Math.round(Math.random() * map.x),Math.round(Math.random() * map.y),1,"demon",1,"npc");
		}
	};
*/

/*http.createServer(public static void  (request, response) {
	response.setHeader("Access-Control-Allow-Origin", "*")
	//if (request.ip in autoblock) {response.end("Address autoblocked for repeated hacking attempts")}
	
	try {
*/

/*if (request.method == "GET") {
	writeLog(request.method +" request from address:" + request.connection.remoteAddress + " on servicePort: "+request.connection.remotePort+" for path " + request.url)

	sparational.html("starspar.gilgamech.com",public static void (callback) {
		response.end(callback) 
	})

*/

/*} else if (request.method == "POST") {
    if (request.url.indexOf("starspar?") > 0) {
	var inputPacket = request.url.split("starspar?")[1].split("&")
	var user = inputPacket[0].split("=")[1]
	var sessionID = inputPacket[1].split("=")[1]
	var sessionKey = inputPacket[2].split("=")[1]
	sessionID = sessionID.replace(/;/g,"")
	// Receive player keystrokes
	var player = JSON.parse(inputPacket[3].split("=")[1].replace(/~~/g,"#").replace(/%20/g,"").replace(/%22/g,"""))

	//game tick and save
	var now = Date.now();
	var delta = now - then;
	gameSave += delta;
	if (gameSave > saveDelay) {
		System.out.println("Game Save "+gameSave+" delay "+saveDelay)
		gameSave = gameSave % saveDelay;
		gameSave();
	}
	gameTick += delta;
	if (gameTick > tickDelay) {
		gameTick = gameTick % tickDelay;
        gameTick();
	}
	then = now;

	if(gameObjects.filter(o => {return o.objectname == user}).length <=0){
		//If the player isn"t in the gameObjects list, add them.
		System.out.println("Add Player "+user)
		addObject(user,map.name,Math.round(Math.random() * map.x),Math.round(Math.random() * map.x),100,100,0,100,user,1,"player")
	}
	
	if (typeof player.x == "undefined" || typeof player.y == "undefined" ) {
		//If the player doesn"t know their location, throw them randomly on the map somewhere.
		player.x = Math.round(Math.random() * map.x)
		player.y = Math.round(Math.random() * map.y)
		//Send back all player locations, so they can find themselves if they"re in the list.
		returnGameObjects = gameObjects.filter(o => {return o.objecttype == "player"})
	} else {//if player.x and player.y are known
	
		//Keep them within the bounds of the map.
		if (player.x <= 0){player.x = 0}
		if (player.y <= 0){player.y = 0}
		if (player.x >= map.x){player.x = map.x}
		if (player.y >= map.y){player.y = map.y}

		//Add projectiles if  mouse clicked.
		if (player.mouseClicked == true && clickCheck == false){
			clickCheck = true
			addObject("projectile",map.name,player.x+20,player.y+20,100,player.mouseX,player.mouseY,100,user,1,"projectile");
		}else if (player.mouseClicked == false && clickCheck == true){
			//clickCheck prevents click-holding and reliably ensures one-projectile-per-click.
			clickCheck = false
		}//end clickCheck
		
		var object = gameObjects.filter(o => {return o.objectname == user})[0]
		//add objectID if missing
		if (typeof object.id == "undefined"){object.id = (gameObjects.length)}
		
		//Update player location, if it"s not too far away.
		if (player.x <= (object.locx + map.playerMoveSpeed)
		&& object.locx <= (player.x + map.playerMoveSpeed)
		&& player.y <= (object.locy + map.playerMoveSpeed)
		&& object.locy <= (player.y + map.playerMoveSpeed)) {
			object.locx = player.x;
			object.locy = player.y;
			object.updatelocation = player.updatelocation;
		} else {
			object.updatelocation = 1
			//System.out.println("Player at x:"+player.x+" y:"+player.y+" but server has x:"+object.locx+" y:"+object.locy)
		}//end update player location.
		
		//Describe player"s newWindow on the map as centered on their player location.
		var newWin = {};
		//newWindow"s upper left corner (minimum) is the player location minus half the newWindow size.
		newWin.minX = player.x - player.winX/2
		newWin.minY = player.y - player.winY/2
		//newWindow"s lower right corner (maximum) is the player location plus half the newWindow size.
		newWin.maxX = player.x + player.winX/2
		newWin.maxY = player.y + player.winY/2
		
		//Describe player"s oldWindow on the map as centered on their player location.
		var oldWin = {};
		//oldWindow"s upper left corner (minimum) is the object location minus half the oldWindow size.
		oldWin.minX = object.locX - object.winX/2
		oldWin.minY = object.locY - object.winY/2
		//oldWindow"s lower right corner (maximum) is the object location plus half the oldWindow size.
		oldWin.maxX = object.locX + object.winX/2
		oldWin.maxY = object.locY + object.winY/2
		
		var returnGameObjects
		//Send back everything except players inside the player"s newWindow...
		newWinObjects = gameObjects.filter(o => {return o.locx > newWin.minX}).filter(o => {return o.locx < newWin.maxX}).filter(o => {return o.locy > newWin.minY}).filter(o => {return o.locy < newWin.maxY}).filter(o => {return o.objecttype != "player"})
		
		//that was outside of the oldWindow
		returnGameObjects = newWinObjects//.filter(o => {return o.locx < oldWin.minX}).filter(o => {return o.locx > oldWin.maxX}).filter(o => {return o.locy < oldWin.minY}).filter(o => {return o.locy < oldWin.maxY})
		
		//- unless it has updatelocation  == 1
		var upLocObjects = newWinObjects.filter(o => {return o.updatelocation  == 1})
		for (object in upLocObjects){
			returnGameObjects.push({ "objectname":upLocObjects[object].objectname, "mapname":upLocObjects[object].mapname, "locx":upLocObjects[object].locx, "locy":upLocObjects[object].locy, "hp":upLocObjects[object].hp, "ammo":upLocObjects[object].ammo, "score":upLocObjects[object].score, "ticksremaining":upLocObjects[object].ticksremaining, "objectowner":upLocObjects[object].objectowner, "updatelocation":upLocObjects[object].updatelocation, "objecttype":upLocObjects[object].objecttype })
 		}
		
		//Push active players onto whatever we"re returning.
		var playerRow = gameObjects.filter(o => {return o.objecttype == "player"}).filter(o => {return o.ticksremaining > 0}).filter(o => {return o.objectname != user})
			for (playerObject in playerRow){
			returnGameObjects.push({"objectname":playerRow[playerObject].objectname,"mapname":playerRow[playerObject].mapname,"locx":playerRow[playerObject].locx,"locy":playerRow[playerObject].locy,"hp":playerRow[playerObject].hp,"ammo":playerRow[playerObject].ammo,"score":playerRow[playerObject].score,"ticksremaining":playerRow[playerObject].ticksremaining,"objectowner":playerRow[playerObject].objectowner,"updatelocation":playerRow[playerObject].updatelocation,"objecttype":playerRow[playerObject].objecttype})
		}
	
		//Push current player
		var currentPlayer = gameObjects.filter(o => {return o.objectname == user})[0]
		returnGameObjects.push({"objectname":currentPlayer.objectname,"mapname":currentPlayer.mapname,"locx":currentPlayer.locx,"locy":currentPlayer.locy,"hp":currentPlayer.hp,"ammo":currentPlayer.ammo,"score":currentPlayer.score,"ticksremaining":currentPlayer.ticksremaining,"objectowner":currentPlayer.objectowner,"updatelocation":currentPlayer.updatelocation,"objecttype":currentPlayer.objecttype})
		
	} // end if player.x and player.y
	
	var keyCallback = ""+user+":" + sessionID +":" + sessionKey
	response.end(keyCallback+":gameObjects:"+JSON.stringify(returnGameObjects)+":gameData:"+JSON.stringify(gameData))

	} else {
		writeLog("Invalid request."); 
		response.end("Invalid request.")
    }; // end request url indexOf



*/

/*} else {
	response.end("Use GET or POST here.") 
}//end if request.method
	}catch(e){
		writeLog("Invalid starspar attempt: " + e.message + " - from server: " + request.connection.remoteAddress + " for path " + request.url)
		response.end("Invalid starspar attempt.") 
	}//end try
}).listen(servicePort);

*/
}



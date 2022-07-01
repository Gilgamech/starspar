//StarSpar server file.
//(c) 2019 Gilgamech Technologies

using System;
using System.Collections;
using System.Linq;
using System.IO;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using System.Security.Cryptography;


namespace StarsparServer {
    internal class GameServer {
        private static void Main(string[] args) {
            if (!HttpListener.IsSupported) {
                Console.WriteLine("HttpListener class is unsupported.");
                return;
            };
			
 var JSON = new JavaScriptSerializer();
			int servicePort = 5010;
			string hostName = "localhost:"+servicePort;
			
			var gameTick = 0;
			var gameSave = 0;
			var clickCheck = false;

			var hitBox = 32;

			//load gameObjects var.
			object gameObjects;

			var ticksPerSecond = 10;
			var tickDelay = (1000/ticksPerSecond);
			var minutesBetweenSaves = 5;
			var saveDelay = (60*1000*minutesBetweenSaves);
			DateTime then = DateTime.Now;

			GameMap map = new GameMap();
			map.ver = 384;
			map.x = 10000;
			map.y = 10000;
			map.name = "noob";
			map.playermove = 320;
			map.projectilemove = 3;
			map.demonHp = 20;
			map.demonSpawnrate = 20;
			map.blockHp = 50;
			map.blockSpawnrate = 1;
			
			//Describe player's newWindow on the map as centered on their player location.
			Window newWin = new Window();
			Window oldWin = new Window();
			var returnGameObjects;

            // Build prefixes and listener, and add prefixes to listener, then start listening.
            var prefixes = new List<string>() { "http://*:80/","https://"+hostName+"/" };
            HttpListener listener = new HttpListener();
            foreach (string prefix in prefixes) {
                listener.Prefixes.Add(prefix);
            };
            listener.Start();
            Console.WriteLine("StarSpar version "+map.ver+" is running on port " + servicePort);

            while (listener.IsListening) {
				try {
					
					// Note: The GetContext method blocks while waiting for a request, so the code will hang out here between requests.
					HttpListenerContext context = listener.GetContext();

					//Set startTime for timeTaken
					DateTime startTime = DateTime.Now;
					HttpListenerRequest request = context.Request;
					string documentContents;
					using (Stream receiveStream = request.InputStream) {
						using (StreamReader readStream = new StreamReader(receiveStream, Encoding.UTF8)) {
							documentContents = readStream.ReadToEnd();
						};
					};
					//Console.WriteLine("Request: " + request.Url + " - documentContents: " + documentContents);

					
					// Create a response Object.
					HttpListenerResponse response = context.Response;
					IPAddress RemoteAddr = request.RemoteEndPoint.Address;
					// response.Headers.Add("Content-Type","text/html");
					//regexAlphanumeric = '[^a-zA-Z0-9-_]'
					//regexSentence = '[^a-zA-Z0-9-_ ,()]'
					//regexSentence2 = '[^a-zA-Z0-9-_ ,\.()]'
					
					Regex regex = new Regex("[^a-zA-Z0-9-_]");
					string RequestUrl = request.Url.OriginalString.Replace(":80",String.Empty).Replace(":443",String.Empty);
					RequestUrl = regex.Replace(RequestUrl, String.Empty);

					string RequestHost = request.Url.Host;
					//Console.WriteLine("RequestUrl: "+RequestUrl+" RequestHost: "+RequestHost+" site: "+sites[RequestUrl]);
					string Method = request.HttpMethod;
					string UAgent = request.UserAgent;
					CookieCollection Cookies = request.Cookies;
					Uri Reefer = request.UrlReferrer;
					

						if (Method == "GET") {
							writeLog(Method +" request from address:" + request.connection.remoteAddress + " on port: "+request.connection.remotePort+" for path " + request.url);

							// Construct a response.
							string responseString = "<HTML><BODY>Hello world!</BODY></HTML>";
							response.StatusCode = 200;
							Console.WriteLine("RequestUrl: "+RequestUrl+"\tRequestHost: "+RequestHost+"\tdocumentContents: " + documentContents);

						} else if (Method == "POST") {
							if (request.url.indexOf("starspar?") > 0) {
								var inputPacket = request.url.split("starspar?")[1].split("&");
								var user = inputPacket[0].split("=")[1];
								var sessionID = inputPacket[1].split("=")[1];
								var sessionKey = inputPacket[2].split("=")[1];
								sessionID = sessionID.replace(";",String.Empty);
								// Receive player keystrokes
								var player = JSON.parse(inputPacket[3].split("=")[1].replace("~~","#").replace("%20",String.Empty).replace("%22",'"'));

								//game tick and save
								DateTime now = DateTime.Now;
								DateTime delta = now - then;
								gameSave += delta;
								if (gameSave > saveDelay) {
									Console.WriteLine("Game Save "+gameSave+" delay "+saveDelay);
									gameSave = gameSave % saveDelay;
									gameSave();
								};
								gameTick += delta;
								if (gameTick > tickDelay) {
									gameTick = gameTick % tickDelay;
									gameTick();
								};
								then = now;

								if(gameObjects.Where( this.Objectname == user).length <=0){
									//If the player isn't in the gameObjects list, add them.
									Console.WriteLine("Add Player "+user);
									Random rand2 = new Random();
									addObject(user,map.name,Math.Round(rand2 * map.x),Math.Round(rand2.Next() * map.x),100,100,0,100,user,1,"player");
								};
								
								if (player.x.gettype() == "undefined" || player.y.gettype() == "undefined" ) {
									//If the player doesn't know their location, throw them randomly on the map somewhere.
									player.x = Math.Round(rand2.Next() * map.x);
									player.y = Math.Round(rand2.Next() * map.y);
									//Send back all player locations, so they can find themselves if they're in the list.
									returnGameObjects = gameObjects.Where(this.Objecttype == "player");
								} else {//if player.x and player.y are known
								
									//Keep them within the bounds of the map.
									/*
									if (player.x <= 0) {player.x = 0};
									if (player.y <= 0) {player.y = 0};
									if (player.x >= map.x) {player.x = map.x};
									if (player.y >= map.y) {player.y = map.y};
									*/

									//Add projectiles if  mouse clicked.
									if (player.mouseClicked == true & clickCheck == false){
										clickCheck = true;
										addObject("projectile",map.name,player.x+20,player.y+20,100,player.mouseX,player.mouseY,100,user,1,"projectile");
									}else if (player.mouseClicked == false & clickCheck == true){
										//clickCheck prevents click-holding and reliably ensures one-projectile-per-click.
										clickCheck = false;
									}//end clickCheck
									
									var Object = gameObjects.Where( this.Objectname == user)[0];
									//add ObjectID if missing
									if (Object.id.gettype() == "undefined"){Object.id = (gameObjects.length);};
									
									//Update player location, if it's not too far away.
									if (player.x <= (Object.locx + map.playermove)
									& Object.locx <= (player.x + map.playermove)
									& player.y <= (Object.locy + map.playermove)
									& Object.locy <= (player.y + map.playermove)) {
										Object.locx = player.x;
										Object.locy = player.y;
										Object.updatelocation = player.updatelocation;
									} else {
										Object.updatelocation = 1;
										//Console.WriteLine("Player at x:"+player.x+" y:"+player.y+" but server has x:"+Object.locx+" y:"+Object.locy);
									}//end update player location.
									
									//newWindow's upper left corner (minimum) is the player location minus half the newWindow size.
									newWin.minX = player.x - player.winX/2;
									newWin.minY = player.y - player.winY/2;
									//newWindow's lower right corner (maximum) is the player location plus half the newWindow size.
									newWin.maxX = player.x + player.winX/2;
									newWin.maxY = player.y + player.winY/2;
									
									//oldWindow's upper left corner (minimum) is the Object location minus half the oldWindow size.
									oldWin.minX = Object.locX - Object.winX/2;
									oldWin.minY = Object.locY - Object.winY/2;
									//oldWindow's lower right corner (maximum) is the Object location plus half the oldWindow size.
									oldWin.maxX = Object.locX + Object.winX/2;
									oldWin.maxY = Object.locY + Object.winY/2;
									
									//Send back everything except players inside the player's newWindow...
									var newWinObjects = gameObjects.Where( this.locx > newWin.minX).Where( this.locx < newWin.maxX).Where( this.locy > newWin.minY).Where( this.locy < newWin.maxY).Where( this.Objecttype != "player");
									
									//that was outside of the oldWindow
									returnGameObjects = newWinObjects;//.Where( this.locx < oldWin.minX).Where( this.locx > oldWin.maxX).Where( this.locy < oldWin.minY).Where( this.locy < oldWin.maxY);
									
									//- unless it has updatelocation  == 1
									var upLocObjects = newWinObjects.Where( this.updatelocation  == 1);
									/*
									foreach (object Object in upLocObjects){
										return gameObjects.push( "Objectname":upLocObjects[Object].Objectname, "mapname":upLocObjects[Object].mapname, "locx":upLocObjects[Object].locx, "locy":upLocObjects[Object].locy, "hp":upLocObjects[Object].hp, "ammo":upLocObjects[Object].ammo, "score":upLocObjects[Object].score, "ticksremaining":upLocObjects[Object].ticksremaining, "Objectowner":upLocObjects[Object].Objectowner, "updatelocation":upLocObjects[Object].updatelocation, "Objecttype":upLocObjects[Object].Objecttype );
									};
									*/
									
									//Push active players onto whatever we're returning.
									var playerRow = gameObjects.Where( this.Objecttype == "player").Where( this.ticksremaining > 0).Where( this.Objectname != user);
									/*
										for (playerObject in playerRow){
										return gameObjects.push("Objectname":playerRow[playerObject].Objectname,"mapname":playerRow[playerObject].mapname,"locx":playerRow[playerObject].locx,"locy":playerRow[playerObject].locy,"hp":playerRow[playerObject].hp,"ammo":playerRow[playerObject].ammo,"score":playerRow[playerObject].score,"ticksremaining":playerRow[playerObject].ticksremaining,"Objectowner":playerRow[playerObject].Objectowner,"updatelocation":playerRow[playerObject].updatelocation,"Objecttype":playerRow[playerObject].Objecttype);
									};
									*/
								
									//Push current player
									var currentPlayer = gameObjects.Where( this.Objectname == user)[0];
									//return gameObjects.push("Objectname":currentPlayer.Objectname,"mapname":currentPlayer.mapname,"locx":currentPlayer.locx,"locy":currentPlayer.locy,"hp":currentPlayer.hp,"ammo":currentPlayer.ammo,"score":currentPlayer.score,"ticksremaining":currentPlayer.ticksremaining,"Objectowner":currentPlayer.Objectowner,"updatelocation":currentPlayer.updatelocation,"Objecttype":currentPlayer.Objecttype);
									
								}; // end if player.x and player.y
								
								var keyCallback = String.Empty+user+":" + sessionID +":" + sessionKey;
								response.end(keyCallback+":gameObjects:"+JSON.stringify(returnGameObjects)+":gameData:"+JSON.stringify(map));

							} else {
								Console.Write("Invalid request."); 
								response.end("Invalid request.");
							}; // end request url indexOf

						} else {
							response.end("Use GET or POST here.");
						}//end if Method
					}catch(InvalidCastException e){
						writeLog("Invalid starspar attempt: " + e.message + " - from server: " + request.connection.remoteAddress + " for path " + request.url);
						response.end("Invalid starspar attempt.");
					}//end try

            } //end while listener
					gameSave();
					process.exit(0);
			//load IP autoblock
			//var autoblock = sequelize select * from autoblock
        }// end Main
		
		public static void writeError(string inputString){
			Console.Write("error: " +inputString);
		}// end writeLog 
		
		public static void writeLog(IPAddress clientip, string csusername, Uri serveraddr, string csmethod, string uristem, string uriquery, int status, long scbytes, int csbytes, double timetaken, string csversion, string UserAgent, CookieCollection Cookie, Uri Referrer){
			
			//Fields: date time c-ip cs-username s-ip cs-method cs-uri-stem cs-uri-query sc-status sc-bytes cs-bytes time-taken cs-version cs(User-Agent) cs(Cookie) cs(Referrer);
//IPAddress ipaddress = [System.Text.Encoding]::ASCII.GetString((iwr https://checkip.amazonaws.com).content).trim();
			DateTime Now = DateTime.Now;
			
			string sql = "insert into logs (date, time, clientip, csusername, serverip, csmethod, uristem, uriquery, status, scbytes, csbytes, timetaken, csversion, UserAgent, Cookie, Referrer) values ('"+Now.ToString("d")+"', '"+Now.ToString("T")+"','"+clientip+"','"+csusername+"','"+serveraddr+"','"+csmethod+"','"+uristem+"','"+uriquery+"','"+status+"','"+scbytes+"','"+csbytes+"','"+timetaken+"','"+csversion+"','"+UserAgent+"','"+Cookie+"','"+Referrer+"')";
			
			Console.WriteLine(sql);

		}// end writeLog 
		
		public static string getBadPW(int Length = 16) { 
			//http://blog.oddbit.com/2012/11/04/PowerShell-random-passwords/
			//http://www.peterprovost.org/blog/2007/06/22/Quick-n-Dirty-PowerShell-Password-Generator/
			//http://PowerShell.org/wp/2014/02/01/revisited-PowerShell-and-encryption/
			const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_!@//%^&*()";
				// Generate our new 32-byte AES key.  They don't recommend using Get-Random for this; the System.Security.Cryptography namespace offers a much more secure random number generator.
				StringBuilder NewPassword = new StringBuilder();
				using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider()) {
					byte[] uintBuffer = new byte[sizeof(uint)];
				
					while (Length-- > 0) {
						rng.GetBytes(uintBuffer);
						uint num = BitConverter.ToUInt32(uintBuffer, 0);
						NewPassword.Append(chars[(int)(num % (uint)chars.Length)]);
					}
				}
				return NewPassword.ToString();
			}//end RandomString

		public static void addObject(string Objectname,string mapname,int locx,int locy,int hp,int ammo,int score,int ticksremaining,string Objectowner,int updatelocation,string Objecttype, object gameObjects) {
			var id = (gameObjects.length);
			if (Objecttype == "projectile") {
				var shooter = gameObjects.Where( this.Objectname == Objectowner)[0];
				if (shooter.ammo > 0) {
				//If projectile, remove ammo from the owner.
					shooter.ammo--;
					//gameObjects.push("id":id,"Objectname":Objectname,"mapname":mapname,"locx":locx,"locy":locy,"hp":hp,"ammo":ammo,"score":score,"ticksremaining":ticksremaining,"Objectowner":Objectowner,"updatelocation":1,"Objecttype":Objecttype);
				};
			}else{
			//Spawn the Object
				//gameObjects.push("id":id,"Objectname":Objectname,"mapname":mapname,"locx":locx,"locy":locy,"hp":hp,"ammo":ammo,"score":score,"ticksremaining":ticksremaining,"Objectowner":Objectowner,"updatelocation":1,"Objecttype":Objecttype);
			};
		}

		public static void gameSave() { 
					//JSON.stringify(data);
		}
		
		public static void moveObject(Player Object,GameMap map) {
			Object.updatelocation = 1;
			if (Object.locx < Object.ammo) {
				if (Object.locx > Object.ammo-map.projectilemove) {
					Object.ammo = Object.locx;
				};
				Object.locx = Object.locx + map.projectilemove;
			} else if (Object.locx > Object.ammo) { 
				if (Object.locx < Object.ammo+map.projectilemove) {
					Object.ammo = Object.locx;
				};
				Object.locx = Object.locx - map.projectilemove;
			} 
			if (Object.locy < Object.score) { 
				if (Object.locy > Object.score-map.projectilemove) {
					Object.score = Object.locy;
				};
				Object.locy = Object.locy + map.projectilemove;
			} else if (Object.locy > Object.score) { 
				if (Object.locy < Object.score+map.projectilemove) {
					Object.score = Object.locy;
				};
				Object.locy = Object.locy - map.projectilemove;
			} 
		}
		
		public static void gameTick(GameMap map) {
			//Handle all with HP below zero
			var gameObjects;
			Random rand = new Random();

			Player belowZeroHp = gameObjects.Where( this.hp <= 0);
			foreach (Player Object in belowZeroHp) {
				if (Object.Objecttype == "player") { //if player, respawn. 
					Object.locx = Math.Round(rand * map.x);
					Object.locy = Math.Round(rand.Next() * map.y);
					Object.hp = 100;
					Object.ammo = 100;
					Object.score = 0;
					Object.ticksremaining = 100;
					Object.updatelocation = 1;
				}else if (Object.Objecttype == "npc" & Math.Round(rand.Next() *1000) > 250) { //Overall drop rate
					if (Math.Round(rand.Next() *1000) > 750) { //Weighted to drop hp
						addObject("ammodrop",map.name,Object.locx,Object.locy,1000,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),100,"ammodrop",1,"ammodrop", gameObjects);
					}else{
						addObject("hpdrop",map.name,Object.locx,Object.locy,1000,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),100,"hpdrop",1,"hpdrop", gameObjects);
					};
				}else if (Object.Objecttype == "block" & Math.Round(rand.Next() *1000) > 250) { //Overall drop rate
					if (Math.Round(rand.Next() *1000) > 250) { //Weighted to drop ammo
						addObject("ammodrop",map.name,Object.locx,Object.locy,1000,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),100,"ammodrop",1,"ammodrop", gameObjects);
					}else{
						addObject("hpdrop",map.name,Object.locx,Object.locy,1000,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),100,"hpdrop",1,"hpdrop", gameObjects);
					};
				}else { //everyone else
				}	
			};
			
			//Snip all with HP below zero
			gameObjects = gameObjects.Where( this.hp > 0).Where( this.Objecttype);
			
			foreach (object Object in gameObjects) {
			gameObjects[Object].updatelocation = 0;
			if (gameObjects[Object].id.gettype() == "undefined"){gameObjects[Object].id = gameObjects.length;};
			//Handle all with HP above zero
				if (gameObjects[Object].Objecttype == "projectile") { //if projectile
					//If collides with:
						var blockObjects = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "block");
						foreach (object collidingObject in blockObjects){
							try{blockObjects[collidingObject].hp--;}catch(e){};
							gameObjects[Object].hp = 0;
							blockObjects.Where( this.Objectname == gameObjects[Object].Objectowner).score++;
						};
						var npcObjects = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "npc");
						foreach (object collidingObject in npcObjects){
							npcObjects[collidingObject].hp--;
							gameObjects[Object].hp = 0;
							npcObjects.Where( this.Objectname == gameObjects[Object].Objectowner).score++;
						};

					gameObjects[Object].hp--;
					moveObject(gameObjects[Object]);
				}else if (gameObjects[Object].Objecttype == "player") { //if player
					//Keep them from getting too much HP or ammthis.
					if (gameObjects[Object].hp > 100) {gameObjects[Object].hp = 100;};
					if (gameObjects[Object].ammo > 100) {gameObjects[Object].ammo = 100;};
					if (gameObjects[Object].ticksremaining > 0) {gameObjects[Object].ticksremaining--;};
					
					//If collides with:
					var notBlockObjects = from gO in gameObjects where gO < this.locx select gO;
					var notBlockObjects = gameObjects.Where(this.locx <= gameObjects[Object].locx+hitBox).Where(this.locx >= gameObjects[Object].locx-hitBox).Where(this.locy <= gameObjects[Object].locy+hitBox).Where(this.locy >= gameObjects[Object].locy-hitBox).Where(this.Objecttype != "block");
					notBlockObjects = notBlockObjects.Where( this.Objecttype != "hpdrop").Where( this.Objecttype != "projectile").Where( this.Objecttype != "ammodrop");
					//not colliding with itself
					notBlockObjects = notBlockObjects.Where( this.Objectname != gameObjects[Object].Objectname);
					//collide with demons and players - knock them back.
					foreach (object collidingObject in notBlockObjects){
						gameObjects[Object].hp--;
						notBlockObjects[collidingObject].hp--;
						if (gameObjects[Object].locx < notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx += 25;};
						if (gameObjects[Object].locx > notBlockObjects[collidingObject].locx) {notBlockObjects[collidingObject].locx -= 25;};
						if (gameObjects[Object].locy < notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy += 25;};
						if (gameObjects[Object].locy > notBlockObjects[collidingObject].locy) {notBlockObjects[collidingObject].locy -= 25;};
					};
					//Collide with blocks, get knocked back.
					var blockObjects2 = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "block");
					foreach (object collidingObject in blockObjects2){
						gameObjects[Object].hp--;
						blockObjects2[collidingObject].hp--;
						if (gameObjects[Object].locx < blockObjects2[collidingObject].locx) {gameObjects[Object].locx -= 25;};
						if (gameObjects[Object].locx > blockObjects2[collidingObject].locx) {gameObjects[Object].locx += 25;};
						if (gameObjects[Object].locy < blockObjects2[collidingObject].locy) {gameObjects[Object].locy -= 25;};
						if (gameObjects[Object].locy > blockObjects2[collidingObject].locy) {gameObjects[Object].locy += 25;};
					};
					
					
				}else if (gameObjects[Object].Objecttype == "npc") { //if demon 
					//if (gameObjects[Object].Objectname == "demon") {gameObjects[Object].Objectname = getBadPW()};
					//If near target, find a new one.
					if (gameObjects[Object].locx < gameObjects[Object].ammo+5 & gameObjects[Object].locx +5 > gameObjects[Object].ammo) {gameObjects[Object].ammo = Math.Round(rand.Next() * map.x);};
					if (gameObjects[Object].locy < gameObjects[Object].score+5 & gameObjects[Object].locy +5 > gameObjects[Object].score) {gameObjects[Object].score = Math.Round(rand.Next() * map.y);};
					moveObject(gameObjects[Object]);

					//Collide with blocks, mirror target.
					var blockObjectsNPC = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "block");
					foreach (object collidingObject in blockObjectsNPC){
						gameObjects[Object].hp--;
						blockObjectsNPC[collidingObject].hp--;
						gameObjects[Object].ammo = gameObjects[Object].locx-(gameObjects[Object].ammo-gameObjects[Object].locx);
						//if demon's left of block, then it's moving right, so set ammo = demon.x-(ammo-demon.x);
						//demon 3800 ammo 4200 = 3800-(4200-3800) = 3400;
						//if demon's right of block, then it's moving left, so set ammo = demon.x-(ammo-demon.x);
						//demon 4200 ammo 3800 = 4200-(3800-4200) = 4800;
						gameObjects[Object].score = gameObjects[Object].locy-(gameObjects[Object].score-gameObjects[Object].locy);
						//demon 3800 score 4200 = 3400;
						//demon 4200 score 3800 = 4800;
					};
					
					
				}else if (gameObjects[Object].ObjectType == "ammodrop" || gameObjects[Object].Objecttype == "ammodrop") { //if ammodrop 
						var playerObjects = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "player");
						foreach (object collidingObject in playerObjects){
							playerObjects[collidingObject].ammo += 25;
							gameObjects[Object].hp = 0;
						};
					gameObjects[Object].hp--;
					moveObject(gameObjects[Object]);
					
					
				}else if (gameObjects[Object].ObjectType == "hpdrop" || gameObjects[Object].Objecttype == "hpdrop") { //if hpdrop 
						var playerObjects = gameObjects.Where( this.locx <= gameObjects[Object].locx+hitBox).Where( this.locx >= gameObjects[Object].locx -hitBox).Where( this.locy <= gameObjects[Object].locy+hitBox).Where( this.locy >= gameObjects[Object].locy -hitBox).Where( this.Objecttype == "player");
						foreach (object collidingObject in playerObjects){
							playerObjects[collidingObject].hp += 25;
							gameObjects[Object].hp = 0;
						};
					gameObjects[Object].hp--;
					moveObject(gameObjects[Object]);
				}else if (gameObjects[Object].Objecttype == "block") { //if block
				}else { //everyone else
					writeLog("Unhandled Object Type: "+gameObjects[Object].ObjectType+" and type:"+gameObjects[Object].Objecttype);
				}	
			} // end for Object

					
			//Add random block and demon.
			if (Math.Round(rand.Next() *100) > (1-map.blockSpawnrate)) {
				addObject("block",map.name,Math.Round((rand.Next() * 250))*40,Math.Round((rand.Next() * 250))*40,map.blockHp,0,0,100,"block",1,"block", gameObjects);
			};
			if (Math.Round(rand.Next() *100) > (1-map.demonSpawnrate)) {
				addObject(getBadPW(),map.name,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),map.demonHp,Math.Round(rand.Next() * map.x),Math.Round(rand.Next() * map.y),1,"demon",1,"npc", gameObjects);
			};
		}//end gameTick
    }// end GameServer
    class Player {
		public int hp  { get; set; }
		public int locx  { get; set; }
		public int locy  { get; set; }
		public int ammo  { get; set; }
		public int ticksremaining  { get; set; }
		public int score  { get; set; }
		public int updatelocation { get; set; }
		public int Objecttype { get; set; }
    }//end Player
    class GameMap {
//		List<User> listOfUsers = new List<User>()
		public int x { get; set; }
		public int y { get; set; }
		public int ver { get; set; }
		public string name { get; set; }
		public int playermove { get; set; }
		public int projectile { get; set; }
		public int projectilemove { get; set; }
		public int demonHp { get; set; }
		public int demonSpawnrate { get; set; }
		public int blockHp { get; set; }
		public int blockSpawnrate { get; set; }
    }//end GameMap
    class Window {
		public int minX { get; set; }
		public int minY { get; set; }
		public int maxX { get; set; }
		public int maxY { get; set; }
    }//end GameMap
}// end StarsparServer


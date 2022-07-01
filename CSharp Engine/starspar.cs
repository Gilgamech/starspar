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

using System.Collections.Generic;


namespace StarsparServer {
    internal class GameServer {
        private static void Main(string[] args) {
            if (!HttpListener.IsSupported) {
                Console.WriteLine("HttpListener class is unsupported.");
                return;
            }

            // Build prefixes and listener, and add prefixes to listener, then start listening.
            var prefixes = new List<string>() { "http://*:9999/" };
			Dictionary<string, string> sites = new Dictionary<string, string>();

 var JSON = new JavaScriptSerializer();

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

            HttpListener listener = new HttpListener();
            foreach (string prefix in prefixes) {
                listener.Prefixes.Add(prefix);
            }
            listener.Start();
            Console.WriteLine("Listening...");


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
						}
					}
					//Console.WriteLine("Request: " + request.Url + " - documentContents: " + documentContents);
					
					// Create a response object.
					HttpListenerResponse response = context.Response;
					IPAddress RemoteAddr = request.RemoteEndPoint.Address;

					string RequestUrl = request.Url.OriginalString.Replace(":9999","");
//Regex regex = new Regex("[^a-zA-Z0-9-_]");
//string RequestUrl = regex.Replace(RequestUrl, "");
					string RequestHost = request.Url.Host;
					string Method = request.HttpMethod;
					string UAgent = request.UserAgent;
					CookieCollection Cookies = request.Cookies;
					Uri Reefer = request.UrlReferrer;
					
					// Construct a response.
					var serializedResult = JSON.Serialize(map);
					string responseString = serializedResult;
					response.StatusCode = 200;
					Console.WriteLine("\nRequestUrl: "+RequestUrl+"\tRequestHost: "+RequestHost+"\tdocumentContents: " + documentContents);
						//string filename = SiteDirectory + RequestHost +"\\"+ sites[RequestUrl];
						//string text = System.IO.File.ReadAllText(@filename);	

					try {
						//responseString = text;
					}catch (Exception e) {
						writeError(e);
						responseString = "<HTML><body>404 Error not found.</body><HTML>";
						response.StatusCode = 404;
					} // end try 
					
					byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
					byte[] OriginalString = System.Text.Encoding.UTF8.GetBytes(request.Url.OriginalString);
					// Get a response stream and write the response to it.
					response.ContentLength64 = buffer.Length;
					System.IO.Stream output = response.OutputStream;
					output.Write(buffer, 0, buffer.Length);
					// Close the output stream.
					output.Close();
					
					//Calculate timeTaken
					DateTime Now = DateTime.Now;
					double timeTaken = Math.Round((Now - startTime).TotalMilliseconds);
					
					//Logging
					writeLog(RemoteAddr, documentContents, request.Url, Method, request.Url.PathAndQuery, request.Url.Query, response.StatusCode, response.ContentLength64, OriginalString.Length, timeTaken, (request.Url.Scheme+"/"+request.ProtocolVersion), UAgent, Cookies, Reefer);
				} catch (Exception e) {
					//Log errors
						writeError(e);
				} // end try 
            } //end while listener
            listener.Stop();
        }// end Main

		public static void writeSql(string inputString){
					
			Console.Write(inputString);

		}// end writeSql 
		
		public static void writeError(Exception inputString){
			DateTime Now = DateTime.Now;
			string sql = "insert into errors (date, time, error) values ('"+Now.ToString("d")+"', '"+Now.ToString("T")+"','"+inputString+"')";
			writeSql(sql);

		}// end writeError 
		
		public static void writeLog(IPAddress clientip, string csusername, Uri serveraddr, string csmethod, string uristem, string uriquery, int status, long scbytes, int csbytes, double timetaken, string csversion, string UserAgent, CookieCollection Cookie, Uri Referrer){
			
			//Fields: date time c-ip cs-username s-ip cs-method cs-uri-stem cs-uri-query sc-status sc-bytes cs-bytes time-taken cs-version cs(User-Agent) cs(Cookie) cs(Referrer)
//IPAddress ipaddress = [System.Text.Encoding]::ASCII.GetString((iwr https://checkip.amazonaws.com).content).trim()
			DateTime Now = DateTime.Now;
			
			string sql = "insert into logs (date, time, clientip, csusername, serverip, csmethod, uristem, uriquery, status, scbytes, csbytes, timetaken, csversion, UserAgent, Cookie, Referrer) values ('"+Now.ToString("d")+"', '"+Now.ToString("T")+"','"+clientip+"','"+csusername+"','"+serveraddr+"','"+csmethod+"','"+uristem+"','"+uriquery+"','"+status+"','"+scbytes+"','"+csbytes+"','"+timetaken+"','"+csversion+"','"+UserAgent+"','"+Cookie+"','"+Referrer+"')";
			
			writeSql(sql);

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

		public static void gameSave() { 
					//JSON.stringify(data);
		}
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


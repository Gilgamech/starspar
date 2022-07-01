//StarSpar client file.
//(c) 2019 Gilgamech Technologies
var $ver = 235

//{ init
var canvas = document.getElementById('gameWindow');
//var canvas = document.createElement("canvas");
canvas.width = window.innerWidth*0.9;
canvas.height = window.innerHeight*0.85;
var ctx = canvas.getContext("2d");
ctx.font = "24px Helvetica";
ctx.textAlign = "left";
ctx.textBaseline = "top";

var $cumulativeTick = 0;

//How fast the game should update.
var $ticks = 10
var $tickDelay = (20000/$ticks)
var $loginCheck = false

// Game objects
var $objects = ""
var $gameObjects = {};
var $gameData = {};
var $user
try{$user = findCookieByName("username")}catch(e){}

var map = {};
map.x = 10000
map.y = 10000
map.name = 'noob'

var playerImages = [];
var playerImageReady = [];
var heero2 = {};
var heero = {};
heero.updatelocation = 0
heero.speed = 250

//Minimap
var minX = canvas.width-132
var minY = 32
var minW = 100
var minH = 100

//}

//{functions
function xhrRequest($verb,$location,$callback,$JSON,$file,$cached) { 
var xobj = new XMLHttpRequest(); if ($verb == 'POST') { xobj.overrideMimeType('text/plain'); } else if ($verb == 'GET') { xobj.overrideMimeType('application/json'); } else if ($verb == 'PUT') { xobj.overrideMimeType('application/json'); } else { xobj.overrideMimeType('text/plain'); }; xobj.open($verb, $location, true); xobj.onreadystatechange = function () { try { if (xobj.status == '200') { if (xobj.readyState == 4) { var $returnVar = xobj.responseText; if ($JSON) { var $returnVar = JSON.parse($returnVar); }; $callback($returnVar); }; } else { $callback(xobj.status+' Error: '+xobj.statusText); }; } catch {}; }; xobj.send($file); 
};

function getBadPW() { 
	return Math.random().toString(36).slice(-20).slice(2); 
};

function findCookieByName(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function loadRoboHash(playerName) {
	playerImageReady[playerName] = false;
	playerImages[playerName] = new Image();
	playerImages[playerName].onload = function () {
		playerImageReady[playerName] = true;
	};
	playerImages[playerName].src = "https://robohash.org/"+playerName+"?set=set1&size=30x30"; 
};

function displayImage(imageReady,imageObj,boxX,boxY) {
	if (imageReady) {
		if ((boxX) && (boxY)) {
			ctx.drawImage(imageObj,boxX,boxY)
		} else {
			var ImageRatio = imageObj.width / imageObj.height;
			//canvas.height = canvas.width * ImageRatio;
			ctx.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, 0, 0, canvas.width, canvas.height);
		}
	}
};

function addDot(boxX,boxY,BGColor) {
	ctx.fillStyle = BGColor;
	ctx.fillRect(boxX*Math.round(canvas.width/100),boxY*Math.round(canvas.width/100),10,10)
};

function loadRoboHash(playerName) {
	playerImageReady[playerName] = false;
	playerImages[playerName] = new Image();
	playerImages[playerName].onload = function () {
		playerImageReady[playerName] = true;
	};
	playerImages[playerName].src = "https://robohash.org/"+playerName+"?set=set1&size=30x30"; 
};

function addMenu(text,boxX,boxY,font,textAlign,BGColor,boxWidth) {
	ctx.font = font;
	ctx.textAlign = textAlign;
	ctx.fillStyle = BGColor;
	if (boxWidth) {
		width = Math.max(ctx.measureText(text).width,boxWidth);
	} else {
		width = ctx.measureText(text).width 
	} ctx.fillRect(boxX,boxY,width,ctx.font.split("px ")[0]*1+5);
	ctx.fillStyle = "#000000";
	ctx.fillText(text,boxX,boxY+ctx.font.split("px ")[0]*1)
};

function mouseOver(text,mouseX,mouseY) {
	ctx.font = "22px Helvetica";
	var TextBoxHeight = 62;
	var TextWidthMax = ctx.measureText(text[0]).width;
	ctx.font = font12Hel;
	TextWidthMax = Math.max(TextWidthMax,Math.max(ctx.measureText(text[1]).width,Math.max(ctx.measureText(text[2]).width,ctx.measureText(text[3]).width)));
	var textAlign = fontLeft;
	if ((mouseX + TextWidthMax) > canvas.width) {
		textAlign = "right";
		mouseX = mouseX - 6 - TextWidthMax 
	} else {
		textAlign = fontLeft;
		mouseX = mouseX - 6 
	};
	if ((mouseY + TextBoxHeight) > canvas.height) {
		mouseY = mouseY - 16 - TextBoxHeight 
	} else {
		mouseY = mouseY + 16 
	};

	addMenu(text[0], mouseX, mouseY,"22px Helvetica",fontLeft,colorTan,TextWidthMax);
	addMenu(text[1], mouseX, mouseY+24,font12Hel,fontLeft,colorTan,TextWidthMax);
	addMenu(text[2], mouseX, mouseY+40,font12Hel,fontLeft,colorTan,TextWidthMax);
	addMenu(text[3], mouseX, mouseY+56,font12Hel,fontLeft,colorTan,TextWidthMax);

}

function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left, y: evt.clientY - rect.top 
	}
};

function dragClickDrop() {
	if (dragging == 1) {
		dragging = 0;
		if (theThingLastClicked == heeroImage) {
			imagesToDisplay[itemIndex] = {
				"image":heeroImage,"imgX":mousePos.x, "imgY":mousePos.y
			} 
		} else if (theThingLastClicked == demonImage) {
			imagesToDisplay[itemIndex] = {
				"image":demonImage,"imgX":mousePos.x,"imgY":mousePos.y
			} 
		} else if (isInItemIndex < 0) {
			imagesToDisplay[isInItemIndex].imgX = mousePos.x;
			imagesToDisplay[isInItemIndex].imgY = mousePos.y;

		}; 
		itemIndex++;
		isInItemIndex = 0;
		theThingLastClicked = blankImg;

	} else {
		theThingLastClicked = blankImg;
		for (dam in imagesToDisplay) {
			if (imagesToDisplay[dam].imgX-imagesToDisplay[dam].image.width < mousePos.x 
				&& mousePos.x < imagesToDisplay[dam].imgX + imagesToDisplay[dam].image.width 
				&& imagesToDisplay[dam].imgY-imagesToDisplay[dam].image.height < mousePos.y 
				&& mousePos.y < imagesToDisplay[dam].imgY+imagesToDisplay[dam].image.height) {
				dragging = 1;
				theThingLastClicked = imagesToDisplay[dam].image;
				isInItemIndex = dam;
				delete imagesToDisplay[dam];
			}
		}
	}
} 

function addPlayer(obj,locX,locY,BGColor,scoreIndex) {
	if (playerImageReady[obj.objectname]) {
		//Minimap Dot
		ctx.fillStyle = BGColor;
		ctx.fillRect(minX+(minW*obj.locx/map.x), minY+(minH*obj.locy/map.y), 5, 5)
		//HP bar
		ctx.fillStyle = 'green';
		ctx.fillRect(locX, locY-32, 100, 5)
		ctx.fillStyle = 'red';
		ctx.fillRect(locX+obj.hp, locY-32, (100 -obj.hp), 5)
		//player image & name
		ctx.drawImage(playerImages[obj.objectname], locX,locY);
		if (obj.objecttype != 'npc' && typeof obj.objecttype != 'undefined') {
			ctx.fillStyle = 'white';
			ctx.fillText(obj.objectname, locX-16, locY+32);
			//score
			if (scoreIndex>0){
				ctx.fillText(obj.objectname + ": "+obj.score, 32, (32 * scoreIndex));
			}
			//Ammo Bar
			ctx.fillStyle = 'lightblue';
			ctx.fillRect(locX+(100 - obj.ammo), locY-22,obj.ammo, 5)
		}
	}else { 
		loadRoboHash(obj.objectname);
	};
};

function addProjectile(locX,locY) {
	ctx.fillRect(locX,locY,3,3);
};

function addAmmoDrop(locX,locY) {
	ctx.beginPath();
	ctx.fillStyle = "lightblue";
	ctx.arc(locX,locY, 10, 0, 2 * Math.PI, false);
	ctx.fill();
};
		
function addHpDrop(locX,locY) {
	ctx.beginPath();
	ctx.fillStyle = "red";
	ctx.arc(locX,locY, 10, 0, 2 * Math.PI, false);
	ctx.fill();
};
		
function addBlock(locX,locY) {
	ctx.fillRect(locX,locY,39,39);
};
//}

//{ Load Images
// load background
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
  bgReady = true;
};
bgImage.src = "https://gilpublic.s3.amazonaws.com/giltech/images/background.png";

// load heero yuy
loadRoboHash($user);

// Demon image
loadRoboHash('demon');
//demonImage.src = "https://gilpublic.s3.amazonaws.com/giltech/images/demon.png";

//}

//{ controls
// keyboard controls
var keysDown = {};
var mousePos = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);

addEventListener('mousedown', function(evt) {
	mousePos = getMousePos(canvas, evt);
	heero.mouseClicked = true;
	heero.mouseX = mousePos.x - (canvas.width/2) +heero.x;
	heero.mouseY = mousePos.y - (canvas.height/2) +heero.y;
	
}, false);

addEventListener('mouseup', function(evt) {
	heero.mouseClicked = false;
}, false);

// Get mouse position
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

//}

//{ Update game objects
var update = function (modifier) {
	if (38 in keysDown || 87 in keysDown) { // Player holding up or W
		heero.y -= heero.speed * modifier;
	}
	if (40 in keysDown || 83 in keysDown) { // Player holding down or S
		heero.y += heero.speed * modifier;
	}
	if (37 in keysDown || 65 in keysDown) { // Player holding left or A
		heero.x -= heero.speed * modifier;
	}
	if (39 in keysDown || 68 in keysDown) { // Player holding right or D
		heero.x += heero.speed * modifier;
	}
};

//}

//{ draw it all
var render = function () {
	//Player centered in the canvas
	var playerX = canvas.width/2
	var playerY = canvas.height/2
	
	//Adjust the map by the player's location, so everything moves relative to the player.
	var XAdjust = playerX-heero.x
	var YAdjust = playerY-heero.y
	//Map adjust X,Y = center of canvas - player location.
	
	//scoreIndex
	var scoreIndex = 0
	
	
	if (bgReady) {
		ctx.fillStyle = 'white';
		ctx.drawImage(bgImage, XAdjust, YAdjust,map.x,map.y);
		ctx.fillText($ver+":"+$gameData.ver, canvas.width-192,canvas.height-48);
		//Minimap
		ctx.beginPath();
		ctx.fillRect(minX, minY, minW, minH)
	}
	
	//Sort game objects by score, and (supposed to be) alphabetically if tied.
	if ($gameObjects.sort){$gameObjects.sort(function(a,b){return (b.score-a.score)}).sort(function(a,b){return (b.objectName-a.objectName)})}else{}
	for (thisGameObj = 0;thisGameObj<$gameObjects.length;thisGameObj++){
		//score
		ctx.fillStyle = 'white';
		var dmg = 100 - $gameObjects[thisGameObj].hp
		var ammo1 = 100 - $gameObjects[thisGameObj].ammo
		var otherX = $gameObjects[thisGameObj].locx-16+XAdjust
		var otherY = $gameObjects[thisGameObj].locy-16+YAdjust
		//Other game object X,Y = its location - 16 + center of canvas - player location.

		
		if ($gameObjects[thisGameObj].objectname == $user) { //if player
			scoreIndex++
			addPlayer($gameObjects[thisGameObj],playerX, playerY,'green',scoreIndex)
		}else if ($gameObjects[thisGameObj].objecttype == 'npc') { //if demon 
			// projectile dot
			addPlayer($gameObjects[thisGameObj],otherX, otherY,'red',0)
		}else if ($gameObjects[thisGameObj].objecttype == 'projectile') { //if projectile 
			// projectile dot
			addProjectile(otherX, otherY);
		}else if ($gameObjects[thisGameObj].objecttype == 'ammodrop') { //if projectile 
			addAmmoDrop(otherX, otherY) 			
		}else if ($gameObjects[thisGameObj].objecttype == 'hpdrop') { //if projectile 
			addHpDrop(otherX, otherY)
		}else if ($gameObjects[thisGameObj].objecttype == 'block') { //if block
			//Blocks are 20 apart, so make them 19x19 to ensure a border.
			addBlock(otherX, otherY)	
		}else { //everyone else
			scoreIndex++
			addPlayer($gameObjects[thisGameObj],otherX, otherY,'black',scoreIndex)
		}
	}

};

//}

//{ Game loop
var main = function () {
  var now = Date.now();
  var delta = now - then;

  
  update(delta/1000);
  
  then = now;
  $cumulativeTick += delta;
	if ($cumulativeTick > $tickDelay) {
		$cumulativeTick -= $tickDelay;
		if (heero.x <= 0){heero.x = 0}
		if (heero.y <= 0){heero.y = 0}
		if (heero.x >= map.x){heero.x = map.x}
		if (heero.y >= map.y){heero.y = map.y}
		
		xhrRequest("POST", 'https://www.gilgamech.com:9999/starspar?username=' + findCookieByName('username')+ '&SessionID=' + findCookieByName('SessionID')+ '&SessionKey=' + findCookieByName('SessionKey')+'&heero=' + JSON.stringify(heero),function($cb){
			if ($cb.split(':')[0] == findCookieByName('username')){
				$loginCheck = false
				$user = findCookieByName("username")
				document.cookie = 'SessionID='+$cb.split(':')[1];
				document.cookie = 'SessionKey='+$cb.split(':')[2];
				
				$objects = $cb.split('gameObjects:')[1].split(':gameData:')[0]; 
				$gameObjects = JSON.parse($objects)
				heero2 = $gameObjects.filter(o => {return o.objectname==$user})[0]
				
				$objects = $cb.split('gameData:')[1]; 
				$gameData = JSON.parse($objects)
				
				if (typeof heero.x == "undefined" && typeof heero.y == "undefined"){heero.x = heero2.locx;heero.y = heero2.locy}
				if (heero2.updatelocation == 1){
					console.log("update location from server")
					heero.x = heero2.locx;
					heero.y = heero2.locy;
					heero.updatelocation = 0;
					heero2.updatelocation = 0;
				}
				$blockResults = $PagesResults.filter(o => {return o.objectname=="block"})[0]
				for (bl=0;bl<$blockResults.length;bl++) {
					
					// If collision
					if (player.x <= (bl.locx + 20)
						&& bl.locx <= (player.x)
						&& player.y <= (bl.locy + 20)
						&& bl.locy <= (player.y)) {
							// choose & store demon location
						//resetDemon($user);
					};//end collision calculations
				}// end for blockResults

			} else {
				if($loginCheck == false && !document.getElementById("playerLoginWrapper")){
					$loginCheck = true
					var $postArea = { "elements": [{"elementParent":"bodyWrapper","id":"playerLoginWrapper"},{"elementParent":"playerLoginWrapper","elementType":"p2","innerText":"Enter name, press an arrow key, then reload the page."},{"id":"playername","elementParent":"playerLoginWrapper","elementClass":"$_.classes.InputField $_.classes.FullDesktopFullMobile","elementType":"input","attributeType":"type","attributeAction":"text"},{"id":"playerBtnRow","elementParent":"playerLoginWrapper"},{"elementParent":"playerBtnRow","innerText":"Player Name","elementClass":"btn btn-primary","elementType":"button","onClick":"document.cookie = 'username='+readElement('playername');document.cookie = 'SessionID='+'noKey';document.cookie = 'SessionKey='+'noKey';writeElement('playerLoginWrapper','Hello '+findCookieByName('username'));"}] };
					cje("bodyWrapper",$postArea);
				}
			}
		});
	}
  render();
};

//}

//{Play!

var then = Date.now();
setInterval(main, 10);
//}



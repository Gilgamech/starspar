//StarSpar game file.
//(c) 2019 Gilgamech Technologies
var $ver = 307

//{ init
var canvas = document.getElementById('gameWindow');
//var canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight*0.85;
var ctx = canvas.getContext("2d");
ctx.font = "24px Helvetica";
ctx.textAlign = "left";
ctx.textBaseline = "top";

//Mobile controls
var mobileControls = false
var mobileControlCheck = false
var displayMobileControls = true

//Load background
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
  bgReady = true;
};
bgImage.src = "https://gilpublic.s3.amazonaws.com/giltech/images/background.png";

//How fast the game should update.
var $cumulativeTick = 0;
var $ticks = 10
var $tickDelay = (1000/$ticks)
var $loginCheck = false
var openSettingsMenu = false
var openSettingsCheck = false
var displaySettings = false

// Game objects
var $objects = ""
var $gameObjects = [];
var $gameData = {};

var $user
try{$user = findCookieByName("username")}catch(e){}

var map = {};
map.x = 10000
map.y = 10000
map.name = 'noob'

var hitBox = 32;
var playerImages = [];
var playerImageReady = [];
var heero2 = {};
var heero = {};
heero.updatelocation = 1
heero.speed = 250

//Minimap
var minX = canvas.width-132
var minY = 32
var minW = 100
var minH = 100

//default keymap
var forwardButton = 87
var backwardsButton = 83
var leftButton = 65
var rightButton = 68
var settingsButton = 81
var mobileToggleButton = 77

//}

//{functions
function xhrRequest($verb,$location,$callback,$JSON,$file,$cached) { 
	var xobj = new XMLHttpRequest(); 
	if ($verb == 'POST') {
		 xobj.overrideMimeType('text/plain');
	} else if ($verb == 'GET') {
		 xobj.overrideMimeType('application/json');
	} else if ($verb == 'PUT') {
		 xobj.overrideMimeType('application/json');
	} else {
		 xobj.overrideMimeType('text/plain');
	};
	xobj.open($verb, $location, true);
	xobj.onreadystatechange = function () {
	 try {
		 if (xobj.status == '200') {
			 if (xobj.readyState == 4) {
			 var $returnVar = xobj.responseText;
				if ($JSON) {
			 var $returnVar = JSON.parse($returnVar);
				};
			$callback($returnVar);
			};
		} else {
			 $callback(xobj.status+' Error: '+xobj.statusText);
		};
	} catch {};
	};
	xobj.send($file);
};

function getBadPW() { 
	return Math.random().toString(36).slice(-20).slice(2); 
};

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
			//var ImageRatio = imageObj.width / imageObj.height;
			//canvas.height = canvas.width * ImageRatio;
			ctx.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, 0, 0, canvas.width, canvas.height);
		}
	}
};

function loadRoboHash(playerName) {
	playerImageReady[playerName] = false;
	playerImages[playerName] = new Image();
	playerImages[playerName].onload = function () {
		playerImageReady[playerName] = true;
	};
	playerImages[playerName].src = "https://robohash.org/"+playerName+"?set=set1&size=30x30"; 
};

function addMenu(text,boxX,boxY,font="22px Helvetica",textAlign="left",BGColor="#DEB887",boxWidth) {
	ctx.font = font;
	ctx.textAlign = textAlign;
	if (boxWidth) {
		width = Math.max(ctx.measureText(text).width,boxWidth);
	} else {
		width = ctx.measureText(text).width 
	} 
	addShape(boxX,boxY,BGColor,"rectangle",width,ctx.font.split("px ")[0]*1)
	ctx.fillStyle = "#000000";
	ctx.fillText(text,boxX,boxY)
};

function mouseOver(text,mouseX,mouseY) {
	font12Hel = "12px Helvetica";
	font22Hel = "22px Helvetica";
	colorTan = "#DEB887";
	ctx.font = font22Hel;
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

	addMenu(text[0], mouseX, mouseY,font22Hel,fontLeft,colorTan,TextWidthMax);
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

function mouseClick(mousePos) {
	var modifier = .1
	//center of controls 
	var controlX = 60
	var controlY = canvas.height-60
	
	//up arrow 20 above (less y) center
	//ctx.fillRect(controlX,controlY-40,40,40);
	if (mousePos.x >= controlX 
	&& mousePos.x <= controlX + 40
	&& mousePos.y >= controlY -40
	&& mousePos.y <= controlY) {
		heero.mouseClicked = false;
		heero.y -= heero.speed * modifier;
	}

		//down arrow 20 below (more y) center
		//ctx.fillRect(controlX,controlY+40,40,40);
	if (mousePos.x >= controlX 
	&& mousePos.x <= controlX + 40
	&& mousePos.y >= controlY + 40
	&& mousePos.y <= controlY + 80) {
		heero.y += heero.speed * modifier;
		heero.mouseClicked = false;
	}

	//left arrow 20 left (less x) center
	//ctx.fillRect(controlX-40,controlY,40,40);
	if (mousePos.x >= controlX  - 40
	&& mousePos.x <= controlX
	&& mousePos.y >= controlY
	&& mousePos.y <= controlY + 40) {
		heero.x -= heero.speed * modifier;
		heero.mouseClicked = false;
	}
	//right arrow 20 right (more x) center
	//ctx.fillRect(controlX+40,controlY,40,40);
	if (mousePos.x >= controlX  + 40
	&& mousePos.x <= controlX + 80
	&& mousePos.y >= controlY
	&& mousePos.y <= controlY + 40) {
		heero.x += heero.speed * modifier;
		heero.mouseClicked = false;
	}

	//Close button in upper right (more x, less y)
	if (mousePos.x >= controlX +40
	&& mousePos.x <= controlX +60
	&& mousePos.y >= controlY -60
	&& mousePos.y <= controlY -40) {
		heero.mouseClicked = false;
		mobileControls = false
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

function drawPlayer(obj,locX,locY,BGColor,scoreIndex) {
	if (playerImageReady[obj.objectname]) {
		//Minimap Dot
		if (BGColor != "") {
			addShape(minX+(minW*obj.locx/map.x), minY+(minH*obj.locy/map.y),BGColor,"square",5)
		}
		//HP bar
		addShape(locX, locY-32,"green","rectangle",100, 5)
		addShape(locX+obj.hp, locY-32,"red","rectangle",(100 -obj.hp), 5)
		//player image & name
		ctx.drawImage(playerImages[obj.objectname], locX,locY);
		if (obj.objecttype != 'npc' && typeof obj.objecttype != 'undefined') {
			addMenu(obj.objectname,locX-16,locY+32,"Veranda","left","Yellow",obj.objectname.length)
			//ctx.fillStyle = 'white';
			//ctx.fillText(obj.objectname, locX-16, locY+32);
			//score
			if (scoreIndex>0){
				ctx.fillText(obj.objectname + ": "+obj.score, 32, (32 * scoreIndex));
			}
			//Ammo Bar
			addShape(locX+(100 - obj.ammo), locY-22,"lightblue","rectangle",obj.ammo, 5)
		}
	}else { 
		loadRoboHash(obj.objectname);
	};
};

function addShape(locX,locY,BGColor,shape,radius,height) {
	ctx.fillStyle = BGColor;
	if (shape == "square") {
		ctx.fillRect(locX,locY,radius,radius)
	} else if (shape == "block") {
		ctx.fillStyle = "black";
		ctx.fillRect(locX,locY,radius,radius)
		ctx.fillStyle = BGColor;
		ctx.fillRect(locX+1,locY+1,radius-2,radius-2)
	} else if (shape == "rectangle") {
		ctx.fillRect(locX,locY,radius,height)
	} else if (shape == "circle") {
		ctx.beginPath();
		ctx.arc(locX,locY, radius, 0, 2 * Math.PI, false);
		ctx.fill();
	} else {
		ctx.fillRect(locX,locY,radius,radius)
	} 
};

//}

//{ controls
// keyboard controls
var keysDown = {};
var mousePos = {};

addEventListener("keydown", function (e) {
	e.preventDefault();
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	e.preventDefault();
	delete keysDown[e.keyCode];
}, false);

addEventListener('mousedown', function(evt) {
	evt.preventDefault();
	mousePos = getMousePos(canvas, evt);
	heero.mouseClicked = true;
	heero.mouseX = mousePos.x - (canvas.width/2) +heero.x;
	heero.mouseY = mousePos.y - (canvas.height/2) +heero.y;
	mouseClick(mousePos);
}, false);

addEventListener('mouseup', function(evt) {
	evt.preventDefault();
	heero.mouseClicked = false;
}, false);

addEventListener('wheel', function(event) {
	let scale = 1;
	event.preventDefault();
	scale += event.deltaY * -0.01;
	// Restrict scale
	scale = Math.min(Math.max(.125, scale), 4);
	// Apply scale transform
	canvas.style.transform = `scale(${scale})`;
}, false);

// Update player location (client side prediction)
var update = function (modifier) {
	if (forwardButton in keysDown || 38 in keysDown) { // Player holding up or W 
		heero.y -= heero.speed * modifier;
	}
	if (backwardsButton in keysDown || 40 in keysDown) { // Player holding down or S 
		heero.y += heero.speed * modifier;
	}
	if (leftButton in keysDown || 37 in keysDown) { // Player holding left or A 
		heero.x -= heero.speed * modifier;
	}
	if (rightButton in keysDown || 39 in keysDown) { // Player holding right or D 
		heero.x += heero.speed * modifier;
	}
	if (settingsButton in keysDown) { 
		$openSettingsMenu = true
	} else {
		$openSettingsMenu = false
	}
	if (mobileToggleButton in keysDown) { 
		mobileControls = true
	} else {
		mobileControls = false
	}
};

//}

//{ draw it all
var render = function () {
	//Player centered in the canvas
	var playerX = canvas.width/2
	var playerY = canvas.height/2
	
	//Adjust the map by the player's location, so everything moves relative to the player.
	var XAdjust = playerX-heero.x+15
	var YAdjust = playerY-heero.y+15
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
	for (object = 0;object<$gameObjects.length;object++){
		//score
		ctx.fillStyle = 'white';
		var dmg = 100 - $gameObjects[object].hp
		var ammo1 = 100 - $gameObjects[object].ammo
		var otherX = $gameObjects[object].locx-16+XAdjust
		var otherY = $gameObjects[object].locy-16+YAdjust
		//Other game object X,Y = its location - 1/2 the 32x32 image + center of canvas - player location.

		
		if ($gameObjects[object].objectname == $user) { //if player
			scoreIndex++
			drawPlayer($gameObjects[object],playerX, playerY,'green',scoreIndex)
		}else if ($gameObjects[object].objecttype == 'npc') { //if demon 
			drawPlayer($gameObjects[object],otherX, otherY,'',0)
		}else if ($gameObjects[object].objecttype == 'projectile') { 
			// projectile dot
			addShape(otherX, otherY,"white","square",3);
		}else if ($gameObjects[object].objecttype == 'ammodrop') { 
			addShape(otherX, otherY,"lightblue","circle",10) 
		}else if ($gameObjects[object].objecttype == 'hpdrop') { 
			addShape(otherX, otherY,"red","circle",10)
		}else if ($gameObjects[object].objecttype == 'block') { 
			addShape(otherX, otherY,"white","block",40)
		}else { //everyone else
			scoreIndex++
			drawPlayer($gameObjects[object],otherX, otherY,'black',scoreIndex)
		}
	}

	var inventoryX = 200
	var inventoryY = canvas.height-100
	for (i=0;i<8;i++) {
		addShape(inventoryX+(60*i), inventoryY,"white","block",50)
		addShape(inventoryX+(60*i)+10, inventoryY+10,"white","block",30)
	}
	
	// Settings latch
	if ($openSettingsMenu == true && openSettingsCheck == false) {
		openSettingsCheck = true
		if (displaySettings == true ) { displaySettings = false}
		else if (displaySettings == false ) { displaySettings = true}
	}else if ($openSettingsMenu == false && openSettingsCheck == true){
		//Check prevents click-holding and reliably ensures one-projectile-per-click.
		openSettingsCheck = false
	}

	// Settings
	if (displaySettings == true) {
		var settingsX = 200
		var settingsY = 200
		var text = [
			"Settings",
			"Mobile",
			"",
			"",
			"",
			""
		];
		var maxWidth = canvas.width - 400;
		for (i=0;i<text.length;i++) {
			addMenu(text[i],settingsX,settingsY+(24*i))
		}
	}
	
	//Mobile Control latch
	if (mobileControls == true && mobileControlCheck == false) {
		mobileControlCheck = true
		if (displayMobileControls == true ) { displayMobileControls = false}
		else if (displayMobileControls == false ) { displayMobileControls = true}
	}else if (mobileControls == false && mobileControlCheck == true){
		//Check prevents click-holding and reliably ensures one-projectile-per-click.
		mobileControlCheck = false
	}

	//Mobile Controls
	if (displayMobileControls == true) {
		var controlX = 60
		var controlY = canvas.height-60
		//dpad centered at 60,map.y-60
		addShape(controlX, controlY,"white","circle",100);
		//up arrow 20 above (less y) center
		addShape(controlX, controlY-40,"blue","square",40);
		//down arrow 20 below (more y) center
		addShape(controlX, controlY+40,"blue","square",40);
		//left arrow 20 left (less x) center
		addShape(controlX-40, controlY,"blue","square",40);
		//right arrow 20 right (more x) center
		addShape(controlX+40, controlY,"blue","square",40);
		//Close button in upper right (more x, less y)
		addShape(controlX+50,controlY-50,"red","circle",10);
	}

};

//}

//{ Game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;
	var halfCanvasWidth = canvas.width/2
	var halfCanvasHeight = canvas.height/2

  
  update(delta/1000);
  
  then = now;
  $cumulativeTick += delta;
	if ($cumulativeTick > $tickDelay) {
		$cumulativeTick -= $tickDelay;
		if (heero.x <= 0){heero.x = 0}
		if (heero.y <= 0){heero.y = 0}
		if (heero.x >= map.x){heero.x = map.x}
		if (heero.y >= map.y){heero.y = map.y}
		heero.winX = window.innerWidth
		heero.winY = window.innerHeight
		
		xhrRequest("POST", 'http://dev.gilgamech.com/starspar?username=' + findCookieByName('username')+ '&SessionID=' + findCookieByName('SessionID')+ '&SessionKey=' + findCookieByName('SessionKey')+'&heero=' + JSON.stringify(heero),function($cb){
			if ($cb.split(':')[0] == findCookieByName('username')){
				$loginCheck = false
				$user = findCookieByName("username")
				document.cookie = 'SessionID='+$cb.split(':')[1];
				document.cookie = 'SessionKey='+$cb.split(':')[2];
				
				$objects = $cb.split('gameObjects:')[1].split(':gameData:')[0]; 
				$objects = JSON.parse($objects)

				heero2 = $objects.filter(o => {return o.objectname==$user})[0]
				//console.log("heero2: "+heero2.hp)
				
				for (object in $objects) {
					var gObject = $gameObjects.filter(o => {return o.id == $objects[object].id})[0]
					if (gObject) {
						gObject.ammo = $objects[object].ammo
						gObject.hp = $objects[object].hp
						gObject.locx = $objects[object].locx
						gObject.locy = $objects[object].locy
						gObject.mapname = $objects[object].mapname
						gObject.objectname = $objects[object].objectname
						gObject.objectowner = $objects[object].objectowner
						gObject.objecttype = $objects[object].objecttype
						gObject.score = $objects[object].score
						gObject.ticksremaining = $objects[object].ticksremaining
						gObject.updatelocation = $objects[object].updatelocation
					}else{
						$gameObjects.push({'id':$objects[object].id,'objectname':$objects[object].objectname,'mapname':$objects[object].mapname,'locx':$objects[object].locx,'locy':$objects[object].locy,'hp':$objects[object].hp,'ammo':$objects[object].ammo,'score':$objects[object].score,'ticksremaining':$objects[object].ticksremaining,'objectowner':$objects[object].objectowner,'updatelocation':$objects[object].updatelocation,'objecttype':$objects[object].objecttype})
					}
				}
				
				//Remove everything with 0 HP
				$gameObjects = $gameObjects.filter(o => {return o.hp > 0})

				//Filter stuff outside window
				//Describe player's newWindow on the map as centered on their player location.
				var newWin = {};
				//newWindow's upper left corner (minimum) is the heero location minus half the newWindow size.
				newWin.minX = heero.x - halfCanvasWidth
				newWin.minY = heero.y - halfCanvasHeight
				//newWindow's lower right corner (maximum) is the heero location plus half the newWindow size.
				newWin.maxX = heero.x + halfCanvasWidth
				newWin.maxY = heero.y + halfCanvasHeight
				
				$gameObjects = $gameObjects.filter(o => {return o.locx > newWin.minX}).filter(o => {return o.locx < newWin.maxX}).filter(o => {return o.locy > newWin.minY}).filter(o => {return o.locy < newWin.maxY})

				$gameData = $cb.split('gameData:')[1]; 
				$gameData = JSON.parse($gameData)
				
				if (typeof heero.x == "undefined" && typeof heero.y == "undefined"){
						heero.x = heero2.locx;
						heero.y = heero2.locy;
						heero.updatelocation = 1
					}
				if (heero.x == 0 && heero.y == 0){
						heero.x = heero2.locx;
						heero.y = heero2.locy
					}
				if (heero2.updatelocation == 1){
					console.log("update location from server")
					heero.x = heero2.locx;
					heero.y = heero2.locy;
					heero.updatelocation = 0;
					heero2.updatelocation = 0;
				}
				var blockResults = $gameObjects.filter(o => {return o.locx <= heero.x+hitBox}).filter(o => {return o.locx >= heero.x -hitBox}).filter(o => {return o.locy <= heero.y+hitBox}).filter(o => {return o.locy >= heero.y -hitBox}).filter(o => {return o.objecttype == 'block'})
				for (collidingObject in blockResults){
					heero.hp--
					blockResults[collidingObject].hp--
					if (heero.x < blockResults[collidingObject].locx) {heero.x -= 25}
					if (heero.x > blockResults[collidingObject].locx) {heero.x += 25}
					if (heero.y < blockResults[collidingObject].locy) {heero.y -= 25}
					if (heero.y > blockResults[collidingObject].locy) {heero.y += 25}
				}

			} else if ($cb.split(':')[0] == 'undefined'){
				if($loginCheck == false && !document.getElementById("playerLoginWrapper")){
					$loginCheck = true
					heero.updatelocation = 1
					var $postArea = { "elements": [{"elementParent":"bodyWrapper","id":"playerLoginWrapper"},{"elementParent":"playerLoginWrapper","elementType":"p2","innerText":"Enter name, press an arrow key, then reload the page."},{"id":"playername","elementParent":"playerLoginWrapper","elementClass":"$_.classes.InputField $_.classes.FullDesktopFullMobile","elementType":"input","attributeType":"type","attributeAction":"text"},{"id":"playerBtnRow","elementParent":"playerLoginWrapper"},{"elementParent":"playerBtnRow","innerText":"Player Name","elementClass":"btn btn-primary","elementType":"button","onClick":"document.cookie = 'username='+readElement('playername');document.cookie = 'SessionID='+'noKey';document.cookie = 'SessionKey='+'noKey';writeElement('playerLoginWrapper','Hello '+findCookieByName('username'));"}] };
					cje("bodyWrapper",$postArea);
				}
				
				$objects = $cb.split('gameObjects:')[1].split(':gameData:')[0]; 
				$gameObjects = JSON.parse($objects)
				heero2.locx = Math.round(Math.random() * map.x)
				heero2.locy = Math.round(Math.random() * map.y)
				
				$objects = $cb.split('gameData:')[1]; 
				$gameData = JSON.parse($objects)
				
				if (typeof heero.x == "undefined" && typeof heero.y == "undefined"){heero.x = heero2.locx;heero.y = heero2.locy;heero.updatelocation = 1}
				if (heero.x == 0 && heero.y == 0){heero.x = heero2.locx;heero.y = heero2.locy}

			} else {
				console.log("Invalid state")
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



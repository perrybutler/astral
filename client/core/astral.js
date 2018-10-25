console.log("astral.js entry point");

var ASTRAL = (function() {

	console.log("astral.js constructor");

	///////////////////////////////////////
	//
	//	PRIVATE LOCAL VARS
	//
	///////////////////////////////////////

	var gameInfo = [];

	// observer pattern
	var onHandlers = [];

	// graphics stuff
	var sceneData = [];
	var layers = [];
	var images = [];
	var imgMissing;
	var atlases = [];
	var prefabs = [];
	var components = [];

	// timing stuff
	var lastFrameTime = Date.now();
	var pingTime = null;

	// controls
	var moveUp = false;
	var moveDown = false;
	var moveLeft = false;
	var moveRight = false;
	var lastInput = "0,0";
	var finalInput = "0,0";

	///////////////////////////////////////
	//
	//	STARTUP SHUTDOWN
	//
	///////////////////////////////////////

	window.onload = function() {
		ASTRAL.init();
	}

	function init() {
		console.log("astral.js init()");

		loadJson("game.json", function(val) {
			gameInfo = JSON.parse(val);
			console.log("got game info:", gameInfo);
			loadBatch(gameInfo.preload, function() {
				console.log("astral was initialized successfully");
				console.log("###################################");
				ready();
			});
		});
	}

	function ready() {
		console.log("astral.js ready()");

		imgMissing = new Image();
		imgMissing.src = "core/assets/missing.png";

		// create layers
		var gameLayer = createLayer("game", 1, drawGameLayer);

		// prevent accidental drag drop on game canvas
		gameDiv.addEventListener("dragover", function(e) {
			e.preventDefault();
		}, false);

		gameDiv.addEventListener("dragenter", function(e) {
			e.preventDefault();
		}, false);

		gameDiv.addEventListener("drop", function(e) {
			e.preventDefault();
		}, false);

		// handle mousedown
		gameLayer.can.addEventListener("mousedown", function(e) {
			console.log("mousedown: " + e.button);
			shoot();
		});

		// handle keydown
		window.addEventListener("keydown", function(e) {
			//console.log("keydown: " + e.key);
			switch (e.key) {
				case "a":
					moveLeft = true;
					break;
				case "d":
					moveRight = true;
					break;
				case "w":
					moveUp = true;
					break;
				case "s":
					moveDown = true;
					break;
				case "`":
					// TODO: handle state and draw debugs for editor visible
					ASTRAL.editor.toggle();
			}
		});

		// handle keyup
		window.addEventListener("keyup", function(e) {
			console.log("keyup: " + e.key);
			switch (e.key) {
				case "a":
					moveLeft = false;
					break;
				case "d":
					moveRight = false;
					break;
				case "w":
					moveUp = false;
					break;
				case "s":
					moveDown = false;
					break;
			}
		});

		if (ASTRAL.netcode) {
			// TODO: tight coupling here...
			// TODO: put this on a button or background timer, dont halt execution or fail out when connect fails
			ASTRAL.netcode.on("connect", function(){
				console.log("connect handler fired");
				//requestAnimationFrame(gameLoop);
			});

			// try to connect now
			ASTRAL.netcode.connect();
		}

		// load the startup scene
		ASTRAL.loadScene(gameInfo.startup);

		// start the gameloop
		start();

		// fire a window resize once to make editor resolution setting take effect (we can't call this in
		//	editor due to race condition see the TODO there)
		window.dispatchEvent(new Event('resize'));
	}

	function start() {
		enabled = true;
		requestAnimationFrame(gameLoop);
	}

	function stop() {
		enabled = false;
	}

///////////////////////////////////////
//
//	LOADERS
//
///////////////////////////////////////

	function loadGame(callback) {
		// loads the game.js file and fires a callback when game.js is done loading all deps
		console.log("loading game.js");
		var script = document.createElement("SCRIPT");
		script.src = path;
		script.onload = function() {
			console.log("loading game.js fired its onload callback");
			callback();
			script.remove();
		}
		document.body.appendChild(script);
	}

	function loadScript(path, callback) {
		// loads a script file from the given path
		console.log("loading script at path " + path);
		var script = document.createElement("SCRIPT");
		script.src = path;
		script.onload = function() {
			console.log("loading script at path " + path  + " fired its onload callback");
			callback();
			script.remove();
		}
		document.body.appendChild(script);
	}
	
	var loaded = 0;
	var loadcount = 0;
	var finalCallback = null;

	function loadBatch(requires, callback) {
		// loads multiple files

		// if we just started a load chain, save the initial callback as the final callback 
		//	because callback will get overwritten by recursive calls to loadRequirements
		//	for any sub-dependencies
		if (loadcount == 0) {
			finalCallback = callback;
			console.log("load chain started with " + requires.length + " modules pending");
		}
		// keep track of the total number of modules being loaded
		loadcount += requires.length;
		// start the load chain
		requires.forEach(function(r) {
			loadScript(r.path, function() {
				// this file has been loaded
				loaded++;
				console.log(r.name + " module finished loading");
				// we can now grab the module that was loaded and load any of its dependencies too
				var module = ASTRAL[r.name];
				if (module && module.requires) {
					console.log(r.name + " module has " + module.requires.length + " dependencies");
					loadBatch(module.requires, function() {
						if (module.init) {
							module.init();
						}
					});
				}
				else {
					console.log(r.name + " module has 0 dependencies");
					if (module && module.init) {
						module.init();
					}
				}
				console.log("loaded " + loaded + " of " + loadcount + " modules");
				// if all dependencies have been loaded we are done!
				if (loaded == loadcount) {
					finalCallback();
				}
			});
		});
	}

	function loadImage(path, callback) {
		// loads an image dynamically and fires a callback returning the js image object
		console.log("loading image at path " + path);
		var img = new Image();
		img.src = path;
		img.crossOrigin = "Anonymous";
    	img.onload = function() {
    		// TODO: this gets fired a second time if we set img.src from spriter.js...
    		//	switch back to addEventListener()
    		images[path] = img;
    		if (callback) callback(img);
    	}
	    img.onerror = function() {console.log("failed to load image " + path); img = null;}
	}

	function loadJson(name, callback) {
		// loads a json-formatted file (doesn't have to be .json) and fires callback returning a string,
		//	sometimes you just want the string and not the json.parse() object, so we don't parse here,
		//	but you can parse in your callback

	    var req = new XMLHttpRequest();
	    //req.overrideMimeType("application/json");
	    req.open("GET", name, true);
	    req.onreadystatechange = function() {
	    	var statusPassing = "200";
	    	// if working from the filesystem, override statusPassing to "0" since
	    	//	a json file returns req.status == "0" on success
			if (window.location.protocol == "file:") {
				statusPassing = "0";
			}
			if (req.readyState == 4 && req.status == statusPassing) {
				// TODO: we need to load the deps here or in kit.sprite...
				callback(req.responseText);
			}
	    };
	    req.send(null);  
	}

	function loadScene(path) {
		ASTRAL.do("beforesceneload"); // e.g. editor can listen to this and clear its scene list
		sceneData = [];
		loadJson(path, function(data) {
			sceneData = JSON.parse(data);
			ASTRAL.sceneData = sceneData;
			console.log("loaded scene " + path + ", contains " + sceneData.length + " root nodes");
			loadObjects(sceneData);
		});
	}

	function loadObjects(objects, path, level) {
		console.log("LOADING", objects);
		// walks the objects array recursively to get the object path/level and calls loadObject() 
		//	on each object to massage the cold json data into runtime data
		if (!path) path = "";
		if (!level) level = 0;
		level++;
		var levelRoot = path;
		for (var key in objects) {
			var obj = objects[key];
			obj.path = levelRoot + "/" + obj.name;
			obj.level = level;
			loadObject(obj);
			if (obj.objects) {
				loadObjects(obj.objects, obj.path, level);
			}
		}
		level = 1;
	}

	function loadObject(obj) {
		if (!obj.vx) obj.vx = 0;
		if (!obj.vy) obj.vy = 0;
		if (!obj.rot) obj.rot = 0;
		if (!obj.scale) obj.scale = 1;
		obj.speed = 0.088;
		obj.channels = [];
		for (var key in obj.components) {
			var component = obj.components[key];
			if (component.type == "image") {
				// TODO: we don't want to call loadImage() for images already loaded...
				loadImage(component.path);
			}
			else if (component.type == "atlas") {
				loadImage(component.path);
			}
		}
		ASTRAL.do("objectloaded", obj); // e.g. editor can listen to this and create an item in the scene list
	}

///////////////////////////////////////
//
//	INPUT
//
///////////////////////////////////////

// TODO: make it pub/sub and let gamedev control more of this

	function input() {
		var vx = 0
		var vy = 0;
		if (moveUp == true) {
			if (moveDown == true) {
				vy = 0;
			}
			else {
				vy = -1;
			}
		}
		if (moveDown == true) {
			if (moveUp == true) {
				vy = 0;
			}
			else {
				vy = 1;
			}
		}
		if (moveLeft == true) {
			if (moveRight == true) {
				vx = 0;
			}
			else {
				vx = -1;
			}
		}
		if (moveRight == true) {
			if (moveLeft == true) {
				vx = 0;
			}
			else {
				vx = 1;
			}
		}

		// if the input state changed since last time we checked, notify the server
		finalInput = vx + "," + vy;
		if (finalInput != lastInput) {
			lastInput = finalInput;
			//send({event: "move", data: {vx: vx, vy: vy}});
			ASTRAL.netcode.queueSend("*move," + vx + "," + vy + "," + ASTRAL.game.myObject.x + "," + ASTRAL.game.myObject.y);
		}
	}

	function shoot() {

	}

	function tester() {
		var pup = createGameObject(Date.parse(new Date().toUTCString()), "pup", "zone1");
	}

///////////////////////////////////////
//
//	CORE
//
///////////////////////////////////////

	var delta = 0;
	var last = 0;
	var step = 1000 / 60; // * 5 to simulate 5x slower loop

	function gameLoop(timestamp) {
		delta += timestamp - last;
		last = timestamp;
		while (delta >= step) {
			update(step);
			delta -= step;
		}
		draw();
		requestAnimationFrame(gameLoop);
		
		// https://gamedev.stackexchange.com/questions/83786/why-cap-game-loop-delta-time
		// 1) current implementation, works ok (but no server):
		//		https://codeincomplete.com/posts/javascript-game-foundations-the-game-loop/
		// 2) store 2 most recent game states summary (but not server):
		//		https://gamedev.stackexchange.com/questions/132831/what-is-the-point-of-update-independent-rendering-in-a-game-loop
		// 3) highly detailed explanation with graphics:
		//		https://www.cakesolutions.net/teamblogs/how-does-multiplayer-game-sync-their-state-part-2
		// 4) fixed update timestep, variable rendering (but no server):
		//		http://gameprogrammingpatterns.com/game-loop.html
		// 5) red moving square tutorial, spiral of death:
		//		https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing#solution
		// 6) valve netcode explanation:
		//		https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization
		// 7) valve netcode summary:
		//		https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
		// 8) great summary of terms comparing interp to extrap
		//		https://www.reddit.com/r/Overwatch/comments/3u5kfg/everything_you_need_to_know_about_tick_rate/
	}

	function update(delta) {
		// handle messages from the server
		// TODO: tight coupling...
		if (ASTRAL.netcode) ASTRAL.netcode.handleReceiveQueue();

		// update user input state
		input();

		// handle messages to the server
		// TODO: tight coupling...
		if (ASTRAL.netcode) ASTRAL.netcode.handleSendQueue();

		// update the objects by incrementing their state
		for (var key in sceneData) {
			var obj = sceneData[key];
			obj.x += obj.vx * obj.speed * delta;
			obj.y += obj.vy * obj.speed * delta;
		}
	}

	function draw(delta) {
		for (var key in layers) {
			var layer = layers[key];
			if (layer.visible) {
				layer.draw();
			}
		}
	}

	function drawGameLayer() {
		var layer = layers["game"];
		var can = layer.can;
		var ctx = layer.ctx;

		// clear the canvas
		ctx.clearRect(0, 0, can.width, can.height); // alternative not recommended: can.width = can.width;
		ctx.imageSmoothingEnabled = false; // TODO: not sure why we have to call this here but it only works if called here

		// draw the objects
		for (var key in sceneData) {
			var obj = sceneData[key];
			drawObject(obj, ctx);
		}
	}

	function drawObject(obj, ctx, parent) {
		// draw the object using its renderable components
		if (obj.components) {
			for (var i = 0; i < obj.components.length; i++) {
				var component = obj.components[i];
				if (component.type == "image") {
					var img = images[component.path];
					if (!img) img = imgMissing;
					drawImage(img, obj, ctx);
				}
				else if (component.type == "atlas") {
					var img = images[component.path];
					if (!img) img = imgMissing;
					//ctx.drawImage(img, obj.x, obj.y);
					drawImage(img, obj, ctx);
				}
				else {
					var componentBase = components[component.type];
					if (componentBase && componentBase.update) componentBase.update(obj);
				}
				// else if (component.type == "rotate") {
				// 	//obj.rot += parseInt(component.speed);
				// 	var componentBase = components[component.type];
				// 	componentBase.update(obj);
				// }
			}
		}
		else {
			//ctx.drawImage(imgMissing, obj.x, obj.y);
			drawImage(imgMissing, obj, ctx);
		}
		// draw debug/editor hints
		// TODO: tight coupling here...
		if (ASTRAL.editor.enabled) {
			// draw a cross for the object's position
			ctx.beginPath();
			ctx.moveTo(obj.x - 4, obj.y - 4);
			ctx.lineTo(obj.x + 4, obj.y + 4);
			ctx.moveTo(obj.x - 4, obj.y + 4);
			ctx.lineTo(obj.x + 4, obj.y - 4);
			ctx.strokeStyle = "red";
			ctx.stroke();
			ctx.closePath();

			// draw the object name and props
			ctx.font = "12px Arial";
			ctx.fillText(obj.name + " - " + obj.id, obj.x, obj.y - 6);
		}
		// call drawObject() recursively for children
		if (obj.objects) {
			for (var key in obj.objects) {
				var childObj = obj.objects[key];
				drawObject(childObj, ctx, obj);
			}
		}
	}

	function drawImage(img, obj, ctx) {
		// draw the fully transformed image
		ctx.save();
		ctx.translate(obj.x + img.width / 2, obj.y + img.height / 2);
		ctx.rotate(obj.rot * Math.PI/180);
		ctx.scale(obj.scale, obj.scale);
		ctx.translate(-(obj.x + img.width / 2), -(obj.y + img.height / 2));
		ctx.drawImage(img, obj.x, obj.y);

		// draw the editor hints/helpers
		// TODO: tight coupling here...
		if (ASTRAL.editor.enabled) {
			// TODO: move this code to the editor using a pubsub message...then we can check inspectorObject
			//	there and change the rect color
			// draw the outlines and hints
			ctx.beginPath();
			ctx.rect(obj.x - 0.5, obj.y - 0.5, img.width, img.height);
			ctx.strokeStyle = "blue";
			ctx.stroke();
			ctx.closePath();

			//ctx.fillText(obj.id, obj.x, obj.y - 6);
		}
		ctx.restore();
	}

	function loadGameObject(obj) {
		// creates a gameobject in memory based on a game object which was loaded from file/data,
		//	this is necessary because when we load a gameobject we should load its components etc
		obj.x = parseInt(obj.x);
		obj.y = parseInt(obj.y);
		obj.vx = 0;
		obj.vy = 0;
		if (!obj.rot) obj.rot = 0;
		if (!obj.scale) obj.scale = 1;
		obj.speed = 0.088;
		obj.channels = [];
		for (var key in obj.components) {
			var component = obj.components[key];
			if (component.type == "image") {
				// TODO: we don't want to call loadImage() for images already loaded...
				loadImage(component.path);
			}
			else if (component.type == "atlas") {
				loadImage(component.path);
			}
		}
		sceneData[obj.id] = obj;
		console.log("loaded object " + obj.name + " with id " + obj.id, obj);
		return obj;
	}

	function createGameObject(id, name, sector) {
		// creates a game object in memory and immediately returns it for further use
		//	the attributes are supplied by the server because the server creates objects 
		//	and the client mimics
		var obj = {};
		obj.id = id;
		obj.name = name;
		obj.x = 50;
		obj.vx = 0;
		obj.y = 50;
		obj.vy = 0;
		obj.rot = 0;
		obj.scale = 1;
		obj.speed = 0.088;
		obj.channels = [sector, "serverglobal"];
		obj.components = [];
		if (name.includes("player")) {
			obj.imageid = "guy.png";
		}
		else if (name.includes("pup")) {
			obj.imageid = "pup.png";
		}
		sceneData[obj.id] = obj;
		console.log("created object " + obj.name + " with id " + obj.id);
		return obj;
	}

	function createLayer(name, zindex, drawFunc) {
		// creates a canvas layer in the dom
		console.log("creating layer " + name);
		// create the layer in dom
		var body = document.body;
		var layerDiv = document.createElement("DIV");
		var can = document.createElement("CANVAS");
		can.id = name + "Canvas";
		can.width = 720;
		can.height = 480;
		layerDiv.id = name + "Div";
		layerDiv.style.zIndex = zindex; //body.childElementCount;
		layerDiv.appendChild(can);
		body.appendChild(layerDiv);
		// define the layer
		var layer = {};
		layer.name = name;
		layer.draw = drawFunc;
		layer.visible = true;
		layer.div = layerDiv;
		layer.can = can;
		layer.ctx = can.getContext("2d");
		layers[name] = layer;
		return layer;
	}

///////////////////////////////////////
//
//	HELPERS & GENERICS
//
///////////////////////////////////////

	function onHandler(name, func) {
		onHandlers[name] = func;
	}

	function doHandler(name, payload) {
		var func = onHandlers[name];
		if (func) func(payload);
	}

	// function component(name, func) {
	// 	var component = func();
	// 	components[name] = component;
	// }

	function setPanelLayout(panels1, panels2, panels3, panels4) {
		var panels = document.querySelectorAll(".sidebar .panel");
		panels.forEach(function(p) {
			p.style.display = "none";
		});

		panels1.forEach(function(p) {
			var el = document.getElementById(p);
			el.style.display = "block";
			sidebar1.appendChild(el);
		});

		panels2.forEach(function(p) {
			var el = document.getElementById(p);
			el.style.display = "block";
			sidebar2.appendChild(el);
		});

		panels3.forEach(function(p) {
			var el = document.getElementById(p);
			el.style.display = "block";
			sidebar3.appendChild(el);
		});

		panels4.forEach(function(p) {
			var el = document.getElementById(p);
			el.style.display = "block";
			sidebar4.appendChild(el);
		});
	}

	function getFileInfo(path) {
		// gets basic info about a file path
		// TODO: this is also in server.js but paths differ by use of \\
		var info = {};
		info.path = path;
		info.dir = path.substring(0, path.lastIndexOf("/"));
		info.name = path.split("/").pop();
		info.ext = path.split(".").pop().toLowerCase();
		info.nameNoExt = info.name.split(".").slice(0, -1).join(".");
		console.log("got file info for " + info.name + ":", info);
		switch (info.ext) {
			case "png":
			case "jpg":
				info.type = "image";
				break;
			case "js":
				info.type = "script";
				break;
			case "atlas":
				info.type = "atlas";
				break;
			case "scene":
				info.type = "scene";
				break;
			case "prefab":
				info.type = "prefab";
				break;
			case "mp3":
			case "wav":
				info.type = "sound";
				break;
			case "json":
				info.type = "data";
				break;
		}
		return info;
	}

	function getRandomColor() {
		// gets a random hex color value
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	function playSound(path) {
		var snd = new Audio(path);
		snd.play();
	}

	function moveDomElement(el, offsetX, offsetY) {
		// moves a dom element using its top/left style
		var x = parseInt(el.style.left.replace("px", ""));
		var y = parseInt(el.style.top.replace("px", ""));
		x += offsetX;
		y += offsetY;
		el.style.left = x + "px";
		el.style.top = y + "px";
	}

	function formatData(data) {
		// formats a regular js object into a json object
		let tempArr = [];
		Object.keys(data).forEach( (element) => {
		    tempArr.push(data[element]);
		});
		let json = JSON.stringify(tempArr, null, 2);
		return json;
	}

	function downloadData(data, filename) {
		// downloads a regular js object as a json formatted file
		let json = formatData(data);
		var blob = new Blob([json], {type:"application/json"});
		var url = URL.createObjectURL(blob);
		var a = document.createElement("A");
		a.download = filename;
		a.href = url;
		a.click();
	}

	function openDataInNewTab(data) {
		let json = ASTRAL.formatData(data);
		var x = window.open();
	    x.document.open();
	    x.document.write('<html><body><pre>' + json + '</pre></body></html>');
	    x.document.close();
	}

	function error(msg, duration) {
		var el = document.createElement("DIV");
		el.className = "error";
		el.innerHTML = msg;
		document.body.appendChild(el);
		setTimeout(function() {el.classList.add("errorfade")}, duration);
		//setTimeout(function() {el.remove()}, 1000);
	}

	return {
		on:onHandler,
		do:doHandler,
		init:init,
		sceneData:sceneData,
		layers:layers,
		images:images,
		createLayer:createLayer,
		createGameObject:createGameObject,
		loadGameObject:loadGameObject,
		loadImage:loadImage,
		loadScene:loadScene,
		loadBatch:loadBatch,
		playSound:playSound,
		getFileInfo:getFileInfo,
		formatData:formatData,
		downloadData:downloadData,
		openDataInNewTab:openDataInNewTab,
		error:error,
		setPanelLayout:setPanelLayout,
		components:components,
		gameInfo:gameInfo
	}

}());
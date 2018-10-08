console.log("astral.js entry point");

window.onload = window.onresize = function() {
	//resizeWindow();
}

var ASTRAL = new function() {
	// async loader stuff
	var requires = [
		{name: "netcode", path: "core/netcode.js"},
		{name: "entity", path: "core/entity.js"},
		{name: "spriter", path: "core/spriter.js"},
		{name: "editor", path: "core/editor.js"},
		{name: "game", path: "game.js"}
		//{name: "world", path: "world.js"}
	];
	var loaded = 0;
	var loadcount = 0;
	var finalCallback = null;

	// graphics stuff
	var layers = [];
	var images = [];

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

	function init() {
		console.log("astral initializing...");
		loadRequirements(requires, function() {
			console.log("astral was initialized successfully");
			console.log("###################################");
			ready();
		});
	}

	// loads a script file from the given path
	function load(path, callback) {
		console.log("loading " + path);
		var script = document.createElement("SCRIPT");
		script.src = path;
		script.onload = function() {
			callback();
			script.remove();
		}
		document.body.appendChild(script);
	}

	// loads multiple files
	function loadRequirements(requires, callback) {
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
			load(r.path, function() {
				// this file has been loaded
				loaded++;
				console.log(r.name + " module finished loading");
				// we can now grab the module that was loaded and load any of its dependencies too
				var module = ASTRAL[r.name];
				if (module && module.requires) {
					console.log(r.name + " module has " + module.requires.length + " dependencies");
					loadRequirements(module.requires, function() {
						if (module.init) {
							module.init();
						}
					});
				}
				else {
					console.log(r.name + " module has 0 dependencies");
					if (module.init) {
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

	function ready() {
		console.log("astral.js ready()");

		// preload assets (for testing...later we will detect what to load based on proximity to cells)
		loadImage("guy.png");

		// create layers
		var gameLayer = createLayer("game", 1, drawGameLayer);

		// prevent accidental drag drop on game canvas
		gameDiv.addEventListener("dragover", function(e) {
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

		// connect
		// TODO: put this on a background timer, dont halt execution or fail out when connect fails
		ASTRAL.netcode.on("connect", function(){
			console.log("connect handler fired");
			requestAnimationFrame(gameLoop);
		});
		ASTRAL.netcode.connect();

		// open the spriter tool
		//ASTRAL.spriter.activate("0x72_DungeonTilesetII_v1.1.png");
	}

	/*==================
		INPUT
	==================*/

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

	/*==================
		CORE
	==================*/

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
		ASTRAL.netcode.handleReceiveQueue();

		// update user input state
		input();

		// handle messages to the server
		ASTRAL.netcode.handleSendQueue();

		// update the objects by incrementing their state
		for (var key in ASTRAL.game.objects) {
			var obj = ASTRAL.game.objects[key];
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
		ctx.clearRect(0, 0, can.width, can.height);
		//can.width = can.width;

		// draw the visible graphics
		for (var key in ASTRAL.game.objects) {
			var obj = ASTRAL.game.objects[key];
			
			// draw the sprite
			var img = images[obj.imageid];
			ctx.drawImage(img, obj.x, obj.y);

			if (ASTRAL.editor.enabled()) {
				// draw the hitbox
				ctx.beginPath();
				ctx.rect(obj.x, obj.y, img.width, img.height);
				ctx.stroke();
				ctx.closePath();

				// draw the object name and props
				ctx.font = "16px Arial";
				ctx.fillText(obj.name, obj.x, obj.y - 15);
			}
		}
	}

	function createGameObject(id, name, sector) {
		// creates a game object in memory and immediately returns it for further use
		//	the attributes are supplied by the server because the server creates objects 
		//	and the client mimics

		// create the object
		var obj = {};
		obj.id = id;
		obj.name = name;
		obj.x = 50;
		obj.vx = 0;
		obj.y = 50;
		obj.vy = 0;
		obj.speed = 0.088;
		obj.channels = [sector, "serverglobal"];
		if (name.includes("player")) {
			obj.imageid = "guy.png";
		}
		else if (name.includes("pup")) {
			obj.imageid = "pup.png";
		}
		ASTRAL.game.objects[obj.id] = obj;
		console.log("created object " + obj.name + " with id " + obj.id);
		return obj;
	}

	function createLayer(name, zindex, drawFunc) {
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

	/*==================
		HELPERS
	==================*/

	function getRandomColor() {
	  var letters = '0123456789ABCDEF';
	  var color = '#';
	  for (var i = 0; i < 6; i++) {
	    color += letters[Math.floor(Math.random() * 16)];
	  }
	  return color;
	}

	function moveDomElement(el, offsetX, offsetY) {
		var x = parseInt(el.style.left.replace("px", ""));
		var y = parseInt(el.style.top.replace("px", ""));
		x += offsetX;
		y += offsetY;
		console.log(y + "px");
		el.style.left = x + "px";
		el.style.top = y + "px";
	}

	// resizes the canvas layers when the browser resizes:
	function resizeWindow() {
		// TODO: need to determine whether to snap width or height...
		// get viewport ratio and compare to canvas ratio to determine this

		// var zoomFit = window.innerHeight / 480;
		// document.getElementById("gameDiv").style.transform = "scale(" + zoomFit + ")";
		// console.log(zoomFit);
	}

	function loadImages(arr) {
		for (var i = 0; i < arr.length; i++) {
			loadImage(arr[i]);
		}
	}

	function loadImage(url, callback) {
		var img = new Image();
		img.src = "assets/" + url;
		img.crossOrigin = "Anonymous";
	    images[url] = img;
	    img.addEventListener("load", callback); // TODO: this gets fired a second time if we set img.src from spriter.js...
	}

	this.init = init;
	this.layers = layers;
	this.images = images;
	this.tester = tester;
	this.createLayer = createLayer;
	this.createGameObject = createGameObject;
	this.loadImage = loadImage;
}

document.addEventListener("DOMContentLoaded", function() {
	ASTRAL.init();
});
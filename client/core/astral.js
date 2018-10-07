console.log("astral.js entry point");

window.onload = window.onresize = function() {
	//resizeWindow();
}

var ASTRAL = new function() {
	// async loader stuff
	var requires = [
		{name: "entity", path: "core/entity.js"},
		{name: "spriter", path: "core/spriter.js"},
		{name: "editor", path: "core/editor.js"},
		//{name: "world", path: "world.js"}
	];
	var loaded = 0;
	var loadcount = 0;
	var finalCallback = null;

	// graphics stuff
	var layers = [];
	var images = [];

	// objects
	var myName = "";
	var myObjectId = null;
	var myObject = null;
	var objects = [];

	// timing stuff
	var lastFrameTime = Date.now();
	var pingTime = null;

	// netcode stuff
	var receiveQueue = [];
	var sendQueue = [];

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
		connect();

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
			queueSend("*move," + vx + "," + vy + "," + myObject.x + "," + myObject.y);
		}
	}

	function shoot() {

	}

	function tester() {
		var pup = createGameObject(Date.parse(new Date().toUTCString()), "pup", "zone1");
	}

	/*==================
		NETCODE
	==================*/

	function connect() {
		var host = "ws://localhost:33333/echo";
		//var host = "ws://172.89.46.7:33333/echo";
		console.log("connecting to host " + host);
		connection = new WebSocket(host);

		connection.onopen = function() {
			console.log("connected successfully");
			//setInterval(updateLoop, 1000 / 20);
			//drawLoop();
			//gameLoop();
			requestAnimationFrame(gameLoop);
			pingTime = Date.parse(new Date().toUTCString());
			queueSend("*keepalive,ping?," + pingTime);
		}

		connection.onerror = function(error) {
			console.log("connection error: " + error);
		}

		connection.onmessage = function(msg) {
			console.log("-> ", msg.data);
			receive(msg.data);
		}
	}

	function sendNow(payload) {
		console.log("<-", payload);
		connection.send(JSON.stringify(payload));
	}

	function receive(data) {
		receiveQueue.push({data: data});
	}

	function handleReceiveQueue() {
		if (receiveQueue.length > 0) {
			console.log("handling " + receiveQueue.length + " server message(s)");
			receiveQueue.forEach(function(e) {
				handleServerMessage(e.data);
			});
			// clear the queue
			receiveQueue = [];
		}
	}

	function queueSend(payload) {
		sendQueue.push(payload);
	}

	function handleSendQueue() {
		if (sendQueue.length > 0) {
			console.log("sending " + sendQueue.length + " message(s)");
			sendQueue.forEach(function(payload) {
				sendNow(payload);
			});
			// clear the queue
			sendQueue = [];
		}
	}

	function handleServerMessage(payload) {
		console.log("handling", payload);
		var spl = payload.split(",");
		switch (spl[0]) {
			case "*greet": // *greet,name,objectid | *greet,player1,1
				// the server told us what object we have control of
				myObjectId = spl[1];
				myObject = objects[myObjectId];
				myName = spl[2];
				myObject.player = myName;
				console.log("server said my name is " + myName + " and my object id is " + myObjectId);
				break;
			case "*keepalive": // *keepalive,pong!,timestamp | *greet,pong!,12389791414
				// the server responded to our ping
				var pongTime = spl[2];
				var serverDelta = pongTime - pingTime;
				console.log("round trip time (RTT) is " + serverDelta + "ms");
				break;
			case "*create": // *create,id,name,x,vx,y,vy | *create,1,player1,0,0,0,0
				// creates a single object
				var obj = createGameObject(spl[1], spl[2], "zone1");
				obj.x = parseInt(spl[3]);
				obj.vx = parseInt(spl[4]);
				obj.y = parseInt(spl[5]);
				obj.vy = parseInt(spl[6]);
				break;
			case "*createm":
				// the server sent us multiple objects to be created
				// create the first object which is at a unique offset from the rest
				var obj = createGameObject(spl[1], spl[2], "zone1");
				obj.x = parseInt(spl[3]);
				obj.vx = parseInt(spl[4]);
				obj.y = parseInt(spl[5]);
				obj.vy = parseInt(spl[6]);
				// create the rest of the objects
				// example: *createm,player1,50,0,50,0,player2,50,0,50,0,player3,50,0,50,0
				var componentCount = 6;
				for (var i = 1; i < spl.length; i+= componentCount) {
					var obj = createGameObject(spl[i], spl[i + 1], "zone1");
					//obj.name = spl[i + 1];
					obj.x = parseInt(spl[i + 2]);
					obj.vx = parseInt(spl[i + 3]);
					obj.y = parseInt(spl[i + 4]);
					obj.vy = parseInt(spl[i + 5]);
				}
				break;
			case "*move": // *move,objectid,vx,vy | *move,1,0,1
				// the server said an object changed its movement vector
				var obj = objects[spl[1]];
				if (obj) {
					obj.vx = parseInt(spl[2]);
					obj.vy = parseInt(spl[3]);
					obj.x = parseInt(spl[4]);
					obj.y = parseInt(spl[5]);
				}
				else {
					console.log("ERROR: received a server message for non existant object '" + spl[1] + "'");
				}
				break;
			case "*delete": // *delete,objectid | *delete,1
				// the server said we should delete an object
				//var obj = objects[spl[1]];
				delete objects[spl[1]];
				break;
		}
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
		handleReceiveQueue();

		// update user input state
		input();

		// handle messages to the server
		handleSendQueue();

		// update the objects by incrementing their state
		for (var key in objects) {
			var obj = objects[key];
			obj.x += obj.vx * obj.speed * delta;
			obj.y += obj.vy * obj.speed * delta;
		}
	}

	function draw(delta) {
		// var gameLayer = layers["game"];
		// var can = gameLayer.can;
		// var ctx = gameLayer.ctx;

		// for (var key in layers) {
		// 	var layer = layers[key];
			
		// }

		// // clear the canvas
		// ctx.clearRect(0, 0, can.width, can.height);
		// //can.width = can.width;

		// // draw the visible graphics
		// for (var key in objects) {
		// 	var obj = objects[key];
			
		// 	// draw the sprite
		// 	var img = images[obj.imageid];
		// 	ctx.drawImage(img, obj.x, obj.y);

		// 	// draw the hitbox
		// 	ctx.beginPath();
		// 	ctx.rect(obj.x, obj.y, img.width, img.height);
		// 	ctx.stroke();
		// 	ctx.closePath();

		// 	// draw the object name and props
		// 	ctx.font = "16px Arial";
		// 	ctx.fillText(obj.name, obj.x, obj.y - 15);
		// }

		// ctx.beginPath();
		// ctx.rect(rect.left, rect.top, rect.right, rect.bottom);
		// ctx.stroke();
		// ctx.closePath();

		// TODO: what about layer ordering?
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
		for (var key in objects) {
			var obj = objects[key];
			
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

	// creates a game object in memory and immediately returns it for further use
	//	the attributes are supplied by the server because the server creates objects 
	//	and the client mimics
	function createGameObject(id, name, sector) {
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
		objects[obj.id] = obj;
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
	this.objects = objects;
	this.tester = tester;
	this.createLayer = createLayer;
	this.loadImage = loadImage;
}

document.addEventListener("DOMContentLoaded", function() {
	ASTRAL.init();
});
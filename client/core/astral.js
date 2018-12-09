"use strict";
console.log("astral.js entry point");

var ASTRAL = (function() {

	console.log("astral.js constructor");

///////////////////////////////////////
//
//	PRIVATE LOCAL VARS
//
///////////////////////////////////////

	var game = {};
	var enabled = false;
	var gameInfo = [];

	// observer pattern
	var onHandlers = [];

	// graphics stuff
	var currentScene;
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
	var fps = 0;

	// controls
	var mouseX = 0;
	var mouseY = 0;
	var mouseB1 = "nothing";
	var mouseB1Old = "nothing";
	var mouseB1Handled = false;
	var mouseB2 = false;
	var moveUp = false;
	var moveDown = false;
	var moveLeft = false;
	var moveRight = false;
	var lastInput = "0,0";
	var finalInput = "0,0";
	var dragOffsetX = 0;
	var dragOffsetY = 0;

	// 
	// var objectRuntimeProps = ["on", "do"];
	// var componentRuntimeProps = [];

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
				console.log("all modules loaded, initializing based on game.json order");
				for (var i = 0; i < gameInfo.preload.length; i++) {
					var info = gameInfo.preload[i];
					var module = ASTRAL[info.name];
					if (module && module.init) module.init();
				}
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
		window.addEventListener("mousedown", function(e) {
			console.log("~~ mousedown fired for button " + e.button);
			mouseB1Handled = false;
			if (e.button == 0) mouseB1 = "mousedown";
		});

		window.addEventListener("mouseup", function(e) {
			console.log("~~ mouseup fired for button " + e.button);
			if (e.button == 0) mouseB1 = "mouseup";
		});

		window.addEventListener("mousemove", function(e) {
			mouseX = e.offsetX === undefined ? e.layerX : e.offsetX;
			mouseY = e.offsetY === undefined ? e.layerY : e.offsetY;
		});

		// handle keydown
		window.addEventListener("keydown", function(e) {
			console.log("~~ keydown fired for key " + e.key);
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
					// TODO: fix tight coupling (see note in Docs)
					ASTRAL.editor.toggle();
			}
		});

		// handle keyup
		window.addEventListener("keyup", function(e) {
			console.log("~~ keyup fired for key " + e.key);
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

		// try connecting to the server
		// TODO: fix tight coupling (see note in Docs)
		if (ASTRAL.netcode) {
			// TODO: put this on a button or background timer, dont halt execution or fail out when connect fails
			ASTRAL.netcode.on("connect", function(){
				console.log("connect handler fired");
				//requestAnimationFrame(gameLoop);
			});

			// try to connect now
			ASTRAL.netcode.connect();
		}

		// load the startup script that will kick things off
		loadScript(gameInfo.startup, function() {
			// TODO: we shouldn't have to explicitly do this here, we should have main.js
			//	automatically call its own init() function once it has been loaded
			ASTRAL.game.main.init();
		});

		// start the engine aka game loop
		start();

		// fire a window resize event once to make editor resolution setting take effect 
		//	since we can't call this in editor.js due to race condition (see the TODO there)
		window.dispatchEvent(new Event('resize'));
	}

	function start() {
		enabled = true;
		//requestAnimationFrame(gameLoop);
		setInterval(gameLoop, 1);
		//gameLoop();
	}

	function stop() {
		enabled = false;
	}

///////////////////////////////////////
//
//	CORE
//
///////////////////////////////////////

	var delta = 0;
	var last = 0;
	var step = 1000 / 60; // * 5 to simulate 5x slower loop
	var t1;
	var t2 = 0;

	function gameLoop() {
		computeFps();
		update();
		draw();
	}

	// function gameLoop(timestamp) {
	// 	computeFps();
	// 	delta += timestamp - last;
	// 	last = timestamp;
	// 	while (delta >= step) {
	// 		update(step);
	// 		delta -= step;
	// 	}
	// 	draw();
	// 	requestAnimationFrame(gameLoop);
	// }

	var fpsFrames = 0;
	var fps = 0;
	var fpsLastUpdate = Date.now();

	function computeFps() {
		// start count fps:
		fpsFrames++;
		var now = Date.now();
		var diff = now - fpsLastUpdate;
		if (diff > 1000) {
			fps = fpsFrames;
			fpsFrames = 0;
			fpsLastUpdate = Date.now();
			ASTRAL.do("fps", fps);
		}
	}

	function update(delta) {
		// update gets called once or more per frame to simulate the next fragment of game time
		// handle messages from the server
		// TODO: fix tight coupling (see note in Docs)...maybe fire an ASTRAL.do("beforeinput") so other modules can hook in
		if (ASTRAL.netcode) ASTRAL.netcode.handleReceiveQueue();
		// update user input state
		input();
		// handle messages to the server
		// TODO: fix tight coupling (see note in Docs)...maybe fire an ASTRAL.do("afterinput") so other modules can hook in
		if (ASTRAL.netcode) ASTRAL.netcode.handleSendQueue();
		// update the objects by incrementing their state
		for (var key in sceneData) {
			updateObject(sceneData[key]);
		}
	}

	function updateObject(obj) {
		// updates the object state, this gets called every frame for every object
		// update the object transform by applying its physics
		obj.x += obj.vx * obj.speed * delta;
		obj.y += obj.vy * obj.speed * delta;
		// update the object input state
		updateObjectInputState(obj);
		// update this object's child objects recursively
		if (obj.objects) {
			for (var key in obj.objects) {
				var childObj = obj.objects[key];
				updateObject(childObj);
			}
		}
	}

	function updateObjectInputState(obj) {
		// determines input state for the object, this gets called every frame for every object
		// reset the mouse state
		obj.isMouseOver = false;
		// detect the mouse state
		if (ASTRAL.mouseX > obj.x && ASTRAL.mouseX < obj.x + obj.width) {
			if (ASTRAL.mouseY > obj.y && ASTRAL.mouseY < obj.y + obj.height) {
				//console.log(ASTRAL.mouseY, obj.y + obj.height, obj.height);
				obj.isMouseOver = true;

				if (mouseB1 == "mousedown") {
					if (ASTRAL.editor.enabled == true) {
						if (obj == ASTRAL.editor.inspectedObject) {
							obj.isDragging = true;
							dragOffsetX = ASTRAL.mouseX - obj.x;
							dragOffsetY = ASTRAL.mouseY - obj.y;
						}
					}
				}

				if (mouseB1 == "click") {
					if (ASTRAL.editor.enabled == true) {
						obj.isDragging = false;
					}
					else {
						// TODO: maybe here we can determine if the editor is toggled on and then
						//	call something like obj.do("editorclick") and if the editor is off we
						//	can just call obj.do("click")...

						obj.do("click");

						// TODO: or instead of firing do() we could check for an existing onclick prop
						//	and fire that instead, but the problem is that there might be multiple
						//	components with an onclick prop so which one do we use? should we just 
						//	have a single onclick prop handled at the object level? or we can attach
						//	a custom script to the object, which would act as a component, but in this
						//	script we can implement an OnMouseClick() function which gets automatically
						//	called in any and all scripts whenever obj.do("click") is called.

						var co = findComponentByType(obj, "text");
						if (co) {
							var func = co.onclick;
							if (func) eval(func);
							// TODO: find an eval alternative
							//	https://stackoverflow.com/questions/912596/how-to-turn-a-string-into-a-javascript-function-call
						}
					}

				}
			}
		}

		// after determining object-mouse state, if the object is being dragged update its position
		if (obj.isDragging == true) {
			// obj.x = ASTRAL.mouseX - obj.width/2;
			// obj.y = ASTRAL.mouseY - obj.height/2;
			obj.x = ASTRAL.mouseX - dragOffsetX;
			obj.y = ASTRAL.mouseY - dragOffsetY;
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
		ctx.imageSmoothingEnabled = false; // TODO: not sure why we have to call this here but it only works if called here, and this needs to be an option

		// draw the objects
		for (var key in sceneData) {
			var obj = sceneData[key];
			drawObject(obj, ctx);
		}
	}

	function drawObject(obj, ctx, parent) {
		// draw the object using its renderable components
		if (obj.components) {
			var img;
			for (var i = 0; i < obj.components.length; i++) {
				var component = obj.components[i];
				// if the component is an image or atlas, call drawImage(), otherwise call the 
				//	component's update()
				if (component.type == "image") {
					img = images[component.path];
					if (!img) img = imgMissing;
					drawImage(img, obj, ctx);
				}
				// else if (component.type == "atlas") {
				// 	img = images[component.path];
				// 	console.log("ATLAS", images, component.path);
				// 	if (!img) img = imgMissing;
				// 	drawImage(img, obj, ctx);
				// }
				else {
					var componentBase = components[component.type];
					if (componentBase && componentBase.update) componentBase.update(obj, ctx, component);
				}
			}
		}
		else {
			// the object has no components, show a missing image
			drawImage(imgMissing, obj, ctx);
		}

		// draw the editor/debug hints
		drawObjectExtras(obj, ctx);

		// call drawObject() recursively for children
		if (obj.objects) {
			for (var key in obj.objects) {
				var childObj = obj.objects[key];
				drawObject(childObj, ctx, obj);
			}
		}
	}

	var marchOffset = 0;

	function drawObjectExtras(obj, ctx) {
		// draw debug/editor hints
		// TODO: fix tight coupling (see note in Docs)
		if (ASTRAL.editor.enabled) {
			if (ASTRAL.editor.drawObjectOrigin == true) {
				// draw a cross for the object's position
				ctx.beginPath();
				ctx.moveTo(obj.x - 4, obj.y - 4);
				ctx.lineTo(obj.x + 4, obj.y + 4);
				ctx.moveTo(obj.x - 4, obj.y + 4);
				ctx.lineTo(obj.x + 4, obj.y - 4);
				ctx.strokeStyle = "red";
				ctx.stroke();
				ctx.closePath();
			}

			// draw the object info
			ctx.font = "12px Arial";
			var arrtext = [];
			if (ASTRAL.editor.drawObjectName == true) arrtext.push(obj.name);
			if (ASTRAL.editor.drawObjectId == true) arrtext.push(obj.id);
			if (ASTRAL.editor.drawObjectPos == true) arrtext.push(obj.x + "," + obj.y);
			if (ASTRAL.editor.drawObjectSize == true) arrtext.push(obj.width + "x" + obj.height);
			if (ASTRAL.editor.drawObjectRot == true) arrtext.push(obj.rot);
			if (ASTRAL.editor.drawParticleCount == true) {
				// TODO: this should be refactored into a getComponent() func
				for (var i = 0; i < obj.components.length; i++) {
					var c = obj.components[i];
					if (c.type == "particle" && c.runtime) {
						arrtext.push(c.runtime.particles.length);
					}
				}
			}
			ctx.fillText(arrtext.join(" - "), obj.x, obj.y - 6);

			// draw borders
			if (ASTRAL.editor.drawObjectBorders == true) {
				// save the context so we can set up a border style for this obj only
				ctx.save();
				ctx.lineWidth = 2;
				ctx.strokeStyle = "blue"; // default border color

				// if the obj is selected, always show marching ants
				if (obj == ASTRAL.editor.inspectedObject) {
					//ctx.strokeStyle = "yellow";
					marchOffset+= 0.25;
					if (marchOffset > 32) {
					    marchOffset = 0;
					}
					ctx.setLineDash([4, 2]);
					ctx.lineDashOffset = -marchOffset;
				}
				if (obj.isMouseOver == true) {
					ctx.strokeStyle = "white";
				}

				// finally, draw the border and restore the context
				//ctx.strokeRect(obj.x - 0.5, obj.y - 0.5, obj.width, obj.height);
				ctx.strokeRect(obj.x - 1, obj.y - 1, obj.width + 1, obj.height + 1);
				ctx.restore();

				// draw collider border which is separate from the obj border
				// TODO: this is going to cause us to iterate all components for all objects...
				var c = findComponentByType(obj, "collider");
				if (c) {
					ctx.strokeStyle = "red";
					ctx.strokeRect(obj.x, obj.y, c.width, c.height);
				}
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
		ctx.restore();
	}

	function findObject(query) {
		// TODO: need to search recursively
		// text.text would return the first text component on the first object named text in the scene
		for (var key in sceneData) {
			var obj = sceneData[key];
			if (obj.name == query) {
				return obj;
			}
		}
	}

	function findComponentByType(obj, type) {
		for (var i = 0; i < obj.components.length; i++) {
			var component = obj.components[i];
			if (component.type == type) {
				return component;
			}
		}
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
			if (callback) callback();
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
							//module.init();
						}
					});
				}
				else {
					console.log(r.name + " module has 0 dependencies");
					if (module && module.init) {
						//module.init();
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
				callback(req.responseText);
			}
	    };
	    req.send(null);
	}

	function loadScene(path, callback) {
		ASTRAL.do("beforesceneload"); // e.g. editor can listen to this and clear its scene list
		sceneData = [];
		loadJson(path, function(data) {
			// var tempData = JSON.parse(data);
			// for (var i = 0; i < tempData.length; i++) {
			// 	var obj = tempData[i];
			// 	sceneData[obj.id] = obj;
			// }
			//ASTRAL.currentScene = path; // why do we have to set thru the public interface?

			try {
				if (data) {
					sceneData = JSON.parse(data);
				}
				else {
					sceneData = [];
				}
				ASTRAL.currentScene = path;
				ASTRAL.sceneData = sceneData;
				loadObjects(sceneData);
				console.log("loaded scene " + path + ", contains " + sceneData.length + " root nodes");
				if (callback) callback();
			}
			catch (e) {
				ASTRAL.error("Failed to load scene " + path + ". " + e, 3000);
				//console.log("ERROR: failed to load scene " + path, e);
				ASTRAL.sceneData = [];
			}
		});
	}

	// TODO: maybe modify this to accept parent as the first parameter, which would be the
	//	parent object in the recursive relationship, so that we can call obj.parent to get
	//	the object's parent object which would be highly useful
	function loadObjects(objects, path, level, parent) {
		//console.log("LOADING", objects);
		// walks the objects array recursively to get the object path/level and calls loadObject()
		//	on each object to massage the cold json data into runtime data
		if (!path) path = "";
		if (!level) level = 0;
		level++;
		var levelRoot = path;
		for (var key in objects) {
			var obj = objects[key];
			if (parent) obj.parent = parent;
			obj.path = levelRoot + "/" + obj.name;
			obj.level = level;
			createObject(obj);
			if (obj.objects) {
				loadObjects(obj.objects, obj.path, level, obj);
			}
		}
		level = 1;
	}

	function createObject(data, name) {
		// create the object empty or using the data passed in
		var obj;
		if (data) {
			obj = data;
		}
		else {
			obj = {};
			obj.id = Date.parse(new Date().toUTCString());
			obj.name = name;
			//sceneData[obj.id] = obj;
			//sceneData.push(obj); // TODO: why isnt this working
			ASTRAL.sceneData.push(obj);
		}
		// props
		if (!obj.x) obj.x = 0;
		if (!obj.y) obj.y = 0;
		if (!obj.vx) obj.vx = 0;
		if (!obj.vy) obj.vy = 0;
		if (!obj.rot) obj.rot = 0;
		if (!obj.scale) obj.scale = 1;
		if (!obj.speed) obj.speed = 0.088;
		console.log("OBJ", obj);
		obj.channels = [];
		// observer
		obj.onHandlers = [];
		obj.on = function(name, callback) {
			var handlers = this.onHandlers[name];
			if (!handlers) {
				this.onHandlers[name] = [];
				console.log("created custom event handler '" + name + "' for object '" + this.name + "'")
			}
			this.onHandlers[name].push(callback);
			console.log("object '" + this.name + "' subscribed to event '" + name + "'");
		}
		obj.do = function(name) {
			console.log("entity '" + this.name + "' fired event '" + name + "'");
			var handlers = this.onHandlers[name];
			if (handlers != null) {
				for (var i in handlers) {
					var callback = handlers[i];
					callback();
				}
			}
			else {
				console.log("warning", "object.do() failed because no handler exists with the name '" + name + "'");
			}
		}
		// components
		if (!obj.components) {
			obj.components = [];
		}
		else {
			for (var key in obj.components) {
				var component = obj.components[key];
				// if the component uses any required resources, load them now
				if (component.type == "image") {
					// TODO: we don't want to call loadImage() for images already loaded...
					loadImage(component.path, function(img) {
						obj.baseWidth = img.width;
						obj.baseHeight = img.height;
						obj.width = obj.baseWidth * obj.scale;
						obj.height = obj.baseHeight * obj.scale;
					});
				}
				else if (component.type == "atlas") {
					// TODO: this is wrong...we need to load the image referenced by the atlas, not the atlas itself
					loadImage(component.path);
				}
				else {
					// merge the saved component data with the runtime props
					var componentBase = components[component.type];
					//console.log("COMPONENT", component, componentBase, components);
					if (componentBase) {
						if (componentBase.applyRuntimeProps) {
							componentBase.applyRuntimeProps(component);
							console.log("applied component instance runtime props to", component);
						}
					}
					else {
						console.log("WARNING: could not find componentBase '" + component.type + "', this means an object is using a component which hasn't been loaded or does not exist");
					}
				}
			}		
		}
		ASTRAL.do("objectcreated", obj); // e.g. editor can listen to this and create an item in the scene list
		return obj;
	}

	function deleteInspectedObject() {
		deleteObject(ASTRAL.editor.inspectedObject);
	}

	// TODO: this doesnt work for child objects we need to recursively search
	function deleteObject(obj) {
		// iterate the sceneData looking for the matching obj
		// for (var i = 0; i < sceneData.length; i++) {
		// 	if (obj.id == sceneData[i].id) {
		// 		sceneData.splice(i, 1);
		// 		ASTRAL.do("objectdeleted", obj);
		// 	}
		// 	for (var ii = 0; ii < sceneData[i].objects; ii++) {
		// 		deleteObject(sceneData[i].objects[ii]);
		// 	}
		// }

		// TODO: instead implement a parent prop on obj and call obj.parent.objects to iterate
		//	the parent's children and remove the one matching obj
		var collection = sceneData;
		if (obj.parent) collection = obj.parent.objects;
		for (var i = 0; i < collection.length; i++) {
			if (obj.id == collection[i].id) {
				collection.splice(i, 1);
				ASTRAL.do("objectdeleted", obj);
			}
		}

		// if (obj.parent) {

		// }
		// else {
		// 	for (var i = 0; i < sceneData.length; i++) {
		// 		if (obj.id == sceneData[i].id) {
		// 			sceneData.splice(i, 1);
		// 			ASTRAL.do("objectdeleted", obj);
		// 		}
		// 	}
		// }
		// console.log(obj.parent);
	}

	function loadComponentResources() {

	}

///////////////////////////////////////
//
//	INPUT
//
///////////////////////////////////////

// TODO: make it pub/sub and let gamedev control more of this

	function input() {
		//mouseB1Old = mouseB1;
		// if (mouseB1 == "beforemousedown") {
		// 	mouseB1 = "mousedown";
		// 	console.log("mouse button 1 state set to mousedown");
		// }

		// TODO: mousedown event could come in here before we handle it for objects, effectively
		//	skipping over the mousedown event which is undesired...we need to persist the event
		//	by one extra frame

		if (mouseB1 == "mousedown") {
			if (mouseB1Handled) {
				mouseB1 = "aftermousedown";
			}
			else {
				mouseB1Handled = true;
			}
			console.log("mouse button 1 state set to aftermousedown");
		}
		else if (mouseB1 == "mouseup") {
			//mouseB1Old = mouseB1;
			mouseB1 = "click";
			console.log("mouse button 1 state set to click");
		}
		else if (mouseB1 == "click") {
			//mouseB1Old = mouseB1;
			mouseB1 = "nothing";
			console.log("mouse button 1 state set to idle");
		}

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
			// TODO: fix tight coupling (see note in Docs)...this was for testing client/server but should be moved into a game script since it is game specific
			//ASTRAL.netcode.queueSend("*move," + vx + "," + vy + "," + ASTRAL.game.myObject.x + "," + ASTRAL.game.myObject.y);
			console.log("serverside movement code needs reimplementation");
		}
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

	function isFunction(functionToCheck) {
	 return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
	}

	function setPanelLayout(panels1, panels2, panels3, panels4) {
		// accepts four arrays defining which panels should be moved to which of the four sidebars
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
		if (info.name.includes(".")) {
			info.ext = path.split(".").pop().toLowerCase();
			info.nameNoExt = info.name.split(".").slice(0, -1).join(".");
		}
		else {
			info.ext = "";
			info.nameNoExt = info.name;
		}
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
		console.log("got file info for " + info.name + ":", info);
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

	function sceneDataToJson() {
		// returns a json string for the given data, this is the top level function that gets
		//	called when saving a scene to disk
		//var filtered = filterSceneData(sceneData);
		var clone = cloneObject(sceneData, formatObject);
		let json = JSON.stringify(clone, null, 2);
		return json;
	}

	// function filterSceneData(data) {
	// 	// clones and formats the data for saving to disk as json
	// 	let filteredData = [];
	// 	for (let prop in data) {
	// 		if (data.hasOwnProperty(prop)) {
	// 		  filteredData[prop] = data[prop];
	// 		  formatObject(filteredData[prop]);
	// 		}
	// 	}
	// 	return filteredData;
	// 	// https://medium.com/@Farzad_YZ/3-ways-to-clone-objects-in-javascript-f752d148054d
	// }

	function cloneObject(obj, formatter) {
		// clones an object
		let clone = [];
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop)) {
			  clone[prop] = obj[prop];
			  if (formatter) formatter(clone[prop]);
			}
		}
		return clone;
		// https://medium.com/@Farzad_YZ/3-ways-to-clone-objects-in-javascript-f752d148054d
	}

	function formatObject(obj) {
		// formats the gameobject for saving to disk as json by removing any runtime 
		//	props and circular refs
		delete obj.do;
		delete obj.isMouseOver;
		delete obj.isDragging;
		delete obj.level;
		delete obj.on;
		delete obj.onHandlers;
		delete obj.parent;
		if (obj.objects) {
			for (var i = 0; i < obj.objects.length; i ++) {
				formatObject(obj.objects[i]);
			}
		}
	}

	function saveSceneData(data) {
		var json = sceneDataToJson();
		ASTRAL.netcode.sendNow("*savescene," + ASTRAL.currentScene + "," + json);
	}

	function openSceneDataInNewTab() {
		var json = sceneDataToJson();
		openJsonInNewTab(json);
	}

	function downloadSceneData() {
		var json = sceneDataToJson();
		downloadJsonData(json, "newscene.scene");
	}

	function downloadJsonData(json, filename) {
		var blob = new Blob([json], {type:"application/json"});
		var url = URL.createObjectURL(blob);
		var a = document.createElement("A");
		a.download = filename;
		a.href = url;
		a.click();
	}

	function openJsonInNewTab(json) {
		console.log("openJsonInNewTab json:", json);
		var x = window.open();
	    x.document.open();
	    x.document.write('<html><body><pre>' + json + '</pre></body></html>');
	    x.document.close();
	}

	function setEndOfContenteditable(el) {
	    var range,selection;
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(el);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
        // https://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
	}

	function error(msg, duration) {
		var el = document.createElement("DIV");
		el.className = "error";
		el.innerHTML = msg;
		document.body.appendChild(el);
		setTimeout(function() {
			el.classList.add("errorfade");
			setTimeout(function() {
				el.remove();
			}, 1000);
		}, duration);
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
		createObject:createObject,
		cloneObject:cloneObject,
		deleteInspectedObject:deleteInspectedObject,
		/*createGameObject:createGameObject,*/
		/*loadGameObject:loadGameObject,*/
		findObject:findObject,
		loadJson:loadJson,
		loadImage:loadImage,
		loadScene:loadScene,
		loadBatch:loadBatch,
		playSound:playSound,
		getFileInfo:getFileInfo,
		sceneDataToJson:sceneDataToJson,
		saveSceneData:saveSceneData,
		downloadSceneData:downloadSceneData,
		openJsonInNewTab:openJsonInNewTab,
		error:error,
		setPanelLayout:setPanelLayout,
		components:components,
		gameInfo:gameInfo,
		isFunction:isFunction,
		formatObject:formatObject,
		setEndOfContenteditable:setEndOfContenteditable,
		get mouseX() {
			return mouseX;
		},
		get mouseY() {
			return mouseY;
		},
		get game() {
			return game;
		}
	}
}());
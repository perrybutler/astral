console.log("editor.js entry point");

ASTRAL.editor = new function() {
	var isenabled = false;

	var editorLayer;
	var editorDiv;
	var editorCanvas;
	var sidePanel;
	var toolsPanel;
	var scenePanel;
	var inspectorPanel;
	var projectPanel;

	var homeButton;
	var upButton;
	var folderButton;

	var homePath = "../client/assets";
	var currentPath;

	var sceneData;
	var inspectedObject;

///////////////////////////////////////
//
//	STARTUP
//
///////////////////////////////////////
	
	function init() {
		console.log("editor.js init()");

		// create a layer for the sprite tool
		editorLayer = ASTRAL.createLayer("editor", 2, draw);
		editorCanvas = editorLayer.can;
		editorDiv = document.getElementById("editorDiv");
		editorDiv.style.overflow = "auto";
		editorDiv.style.visibility = "hidden";

		// create the drag-drop indicator zone
		var dropPanel = document.createElement("DIV");
		dropPanel.innerHTML = "<div class='droplabel'>DROP HERE</div>";
		dropPanel.className = "droppanel";
		editorDiv.appendChild(dropPanel);

		// create the sidebar
		sidePanel = document.createElement("DIV");
		sidePanel.className = "sidebar";
		editorDiv.appendChild(sidePanel);

		// create the tools panel
		toolsPanel = document.createElement("DIV");
		toolsPanel.className = "panel";
		sidePanel.appendChild(toolsPanel);
		var openImageButton = ctl("button", "tools", "✎ open spriter", null, toolsPanel, function() {
			ASTRAL.spriter.activate("assets/0x72_DungeonTilesetII_v1.1.png");
		});
		var thing = ctl("button buttonicon message", "network", "netcodestuff", "netcodestuff", toolsPanel, null);
		var thing = ctl("dropdown", "resolution", "Dynamic,3840x2160,2560x1440,1920x1080,1366x768,1280x720,720x480,-,2048x1536,1600x1200,1280x1024,1024x768,640x480,320x240,320x200,-,1000x1000,500x500,250x250,100x100", "resolution", toolsPanel, null);
		resolution.onchange = function() {screenResolutionChange()}
		resolution.value = "Dynamic";
		var thing = ctl("dropdown", "scaling", "Stretch,3840x2160,2560x1440,1920x1080,1366x768,1280x720,720x480,-,2048x1536,1600x1200,1280x1024,1024x768,640x480,320x240,320x200,-,1000x1000,500x500,250x250,100x100", "scaling", toolsPanel, null);
		scaling.onchange = function() {screenScalingChange()}
		var thing = ctl("dropdown", "resampling", "Nearest,Bilinear", "resampling", toolsPanel, null);
		resampling.onchange = function() {screenResamplingChange()}

		// create the scene panel
		scenePanel = document.createElement("DIV");
		scenePanel.className = "panel";
		sidePanel.appendChild(scenePanel);
		var thing = ctl("button icon diskette", "scene", "", "scenesave", scenePanel, function() {saveScene()});
		scenesave.dataset.tip = "Save changes to the current scene.";
		var thing = ctl("button icon openexternal", null, "", "sceneopenexternal", scenePanel, function() {viewSceneData()});
		sceneopenexternal.dataset.tip = "View the scene data in a new tab.";
		var thing = ctl("button icon download", null, "", "scenedownload", scenePanel, function() {downloadScene()});
		scenedownload.dataset.tip = "Download the scene data to disk.";
		var thing = ctl("button sceneobjectbutton", null, "scene stuff here", null, scenePanel, null);

		// create the inspector panel
		inspectorPanel = document.createElement("DIV");
		inspectorPanel.className = "panel";
		sidePanel.appendChild(inspectorPanel);
		var thing = ctl("button", "inspector", "(nothing selected)", "inspectoritem", inspectorPanel, null);
		var thing = ctl("input pair", "position", "0", "posx", inspectorPanel, null);
		var thing = ctl("input pair", null, "0", "posy", inspectorPanel, null);
		posx.addEventListener("mousewheel", function(event) {
			posx.innerHTML = parseInt(posx.innerHTML) - event.deltaY / 5;
			posx.dispatchEvent(new Event('input'));
		});
		posy.addEventListener("mousewheel", function(event) {
			posy.innerHTML = parseInt(posy.innerHTML) - event.deltaY / 5;
			posy.dispatchEvent(new Event('input'));
		});
		// var thing = ctl("input pair", "rotation", "0", "rotx", inspectorPanel, null);
		// var thing = ctl("input pair", null, "0", "roty", inspectorPanel, null);
		// var thing = ctl("input pair", "scale", "0", "scalex", inspectorPanel, null);
		// var thing = ctl("input pair", null, "0", "scaley", inspectorPanel, null);
		var thing = ctl("input pair", "rotation / scale", "0", "rot", inspectorPanel, null);
		var thing = ctl("input pair", null, "0", "scale", inspectorPanel, null);
		rot.addEventListener("mousewheel", function(event) {
			rot.innerHTML = (parseFloat(rot.innerHTML) - event.deltaY / 5).toFixed(2);
			rot.dispatchEvent(new Event('input'));
		});
		scale.addEventListener("mousewheel", function(event) {
			scale.innerHTML = (parseFloat(scale.innerHTML) - event.deltaY / 500).toFixed(2);
			scale.dispatchEvent(new Event('input'));
		});

		// TODO: need a container for the object components...might need containers for each type of object

		// create the brush panel
		brushPanel = document.createElement("DIV");
		brushPanel.className = "panel";
		sidePanel.appendChild(brushPanel);
		var thing = ctl("button", "brushes", "brushes here", null, brushPanel, null);

		// create the project panel
		projectPanel = document.createElement("DIV");
		projectPanel.className = "panel";
		sidePanel.appendChild(projectPanel);
		homeButton = ctl("button icon home", "project", "", null, projectPanel, function() {getDir("../client/assets")});
		homeButton.dataset.tip = "Return to the root assets folder";
		upButton = ctl("button icon moveup", null, "", null, projectPanel, function() {});
		upButton.dataset.tip = "Go back to the previous folder";
		folderButton = ctl("button icon folderadd", null, "", null, projectPanel, function() {});
		currentPath = "../client/assets";

		// ??
		editorCanvas.addEventListener("dragover", function(e) {
			e.preventDefault();
		}, false);

		// ??
		editorCanvas.addEventListener("dragenter", function(e) {
			//e.preventDefault();
			event.target.backgroundColor = "red";
		}, false);

		// handle drop event from the PROJECT panel
		editorCanvas.addEventListener("drop", function(e) {
			e.preventDefault();
			var data = event.dataTransfer.getData("text");
			var el = document.getElementById(data);
			console.log("drop event: " + el.id + " -> " + event.target.id);

			var path = el.id.replace("../client/", "");
			console.log("adding file to scene: " + path);
			// TODO: now add a GameObject to the objects array/scene
			//var obj = ASTRAL.createGameObject(Date.parse(new Date().toUTCString()), null, "zone1");
			addProjectFileToScene(path, e);
		}, false);

		// subscribe to netcode dirlist which we use to update the PROJECT panel
		ASTRAL.netcode.on("*dirlist", function(payload) {
			populateProjectPanel(payload);
		});

		ASTRAL.netcode.on("aftersend", function(payload) {
			info = ASTRAL.netcode.getNetcodeInfo();
			if (netcodestuff.innerHTML != info) {
				netcodestuff.innerHTML = info;
				flashDomElement(netcodestuff);
			}
		});

		ASTRAL.netcode.on("afterreceive", function(payload) {
			info = ASTRAL.netcode.getNetcodeInfo();
			if (netcodestuff.innerHTML != info) {
				netcodestuff.innerHTML = info;
				flashDomElement(netcodestuff);
			}
		});

		// subscribe to loadscene which we use to update the SCENE panel
		ASTRAL.on("loadscene", function(scenedata) {
			populateScenePanel(scenedata);
		});

		window.addEventListener("resize", function() {
			if (resolution.value == "Dynamic") {
				scaling.value = "Stretch";
				screenScalingChange();
			}
		});

		// setInterval(function() {
		// 	netcodestuff.innerHTML = ASTRAL.netcode.getNetcodeInfo();
		// }, 1000);

		// TODO: race condition could happen here if eg we call screenScalingChange() which tries
		//	to access the gameCanvas before it has been created, this setTimeout demonstrates it,
		//	with a 10ms timeout, sometimes the code will work fine sometimes the race condition
		//	occurs
		//setTimeout(function() {screenScalingChange()}, 10);
	}

	function saveScene() {

	}

	function viewSceneData() {
		ASTRAL.openDataInNewTab(sceneData);
	}

	function downloadScene() {
		ASTRAL.downloadData(sceneData, "myscene.scene");
	}

///////////////////////////////////////
//
//	TOOLS PANEL
//
///////////////////////////////////////

	function screenResolutionChange() {
		var val = resolution.options[resolution.selectedIndex].value;

		if (resolution.value == "Dynamic") {
			scaling.value = "Stretch";
			gameCanvas.width = window.innerWidth;
			gameCanvas.height = window.innerHeight;
			gameCanvas.style.width = "100%";
			gameCanvas.style.height = "100%";
		}
		else {
			if (val.includes("x")) {
				var spl = val.split("x");
				gameCanvas.width = spl[0];
				gameCanvas.height = spl[1];
			}
		}
	}

	function screenScalingChange() {
		var val = scaling.options[scaling.selectedIndex].value;

		if (resolution.value == "Dynamic") {
			scaling.value = "Stretch";
			gameCanvas.width = window.innerWidth;
			gameCanvas.height = window.innerHeight;
		}

		if (val == "Stretch" || val == "Fit" || val == "Cover") {
			gameCanvas.style.width = "100%";
			gameCanvas.style.height = "100%";
		}

		if (val.includes("x")) {
			var spl = val.split("x");
			gameCanvas.style.width = spl[0];
			gameCanvas.style.height = spl[1];
		}
	}

	function screenResamplingChange() {
		var val = resampling.options[resampling.selectedIndex].value;

		console.log(val);

		if (val == "Nearest") {
			gameCanvas.style.imageRendering = "pixelated";
		}
		else if (val == "Bilinear") {
			gameCanvas.style.imageRendering = "auto";
		}
	}

///////////////////////////////////////
//
//	PROJECT PANEL
//
///////////////////////////////////////

	function populateProjectPanel(payload) {
		// this clears the PROJECT panel and populates it with a new list of items

		var currentList = document.querySelectorAll(".projectfolder, .projectfile");
		for (var i = 0; i < currentList.length; i++) {
			currentList[i].remove();
		}

		// the payload lists folders first, then files, separated by ***
		var spl = payload.join().split("***");

		// list the folders
		if (spl[0]) {
			var folders = spl[0].split(",");
			for (var i = 0; i < folders.length; i++) {
				var folderName = folders[i];
				var label = null;
				var path = currentPath + "/" + folderName;
				(function(path) {
					var assetButton = ctl(
						"button buttonicon folder projectfolder",
						label,
						folderName,
						null,
						projectPanel,
						function() {getDir(path)}
					);
					// https://stackoverflow.com/questions/22438002/dealing-with-loops-in-javascript-only-last-item-gets-affected
				}).call(this, path);
			}
		}

		// list the files
		if (spl[1]) {
			var files = spl[1].split(",");
			for (var i = 0; i < files.length; i++) {
				var fileName = files[i];
				var label = null;
				var path = currentPath + "/" + fileName;
				console.log("PATH", fileName, path);
				//var fi = ASTRAL.getFileInfo(path);
				// TODO: the path we use here is server formatted not url formatted...
				(function(path) {
					var iconName = getIconForFile(path);
					var assetButton = ctl(
						"button file projectfile buttonicon " + iconName,
						label,
						fileName,
						path,
						projectPanel,
						function(event) {openProjectFile(event, path)}
					);
				}).call(this, path);
			}
		}
	}

	function addProjectFileToScene(path, mouseevent) {
		// this handles dragging an asset from the PROJECT panel into the scene/canvas

		// TODO: we need to call loadGameObject() if the asset is a .prefab...

		// create the gameobject and set its position at the mouse position
		var fi = ASTRAL.getFileInfo(path);
		var obj = ASTRAL.createGameObject(Date.parse(new Date().toUTCString()), fi.name, "zone1");
		var cw = gameCanvas.width;
		var ch = gameCanvas.height;
		var rx = cw / window.innerWidth;
		var ry = ch / window.innerHeight;
		obj.x = mouseevent.pageX * rx;
		obj.y = mouseevent.pageY * ry;
		
		// if its an image, add image component to gameobject and center image at the mouse position
		if (fi.type == "image") {
			ASTRAL.loadImage(path, function(img) {
				//console.log(img);
				obj.x -= img.width / 2;
				obj.y -= img.height / 2;
				objectButton.click(); // TODO: this is some magic...is var objectButton being hoisted?
			});
			var component = imageComponent(fi.path);
			obj.components.push(component);
		}

		// add a button for this gameobject to the SCENE panel
		var objectButton = ctl(
			"button sceneobjectbutton level" + 1,
			null,
			fi.nameNoExt,
			null,
			scenePanel,
			function() {populateInspectorPanel(obj)}
		);

		flashDomElement(objectButton);
		
		console.log("added asset to scene as new gameobject:", obj);
	}
	
	function openProjectFile(event, path) {
		// this controls what to do when a file/folder is clicked in the PROJECT panel

		if (event.ctrlKey) {
			window.open(path);
		}
		else {
			//var relpath = path.replace(homePath, "");
			path = path.toLowerCase();
			if (path.includes(".png") || path.includes(".jpg")) {
				ASTRAL.spriter.activate(path);
			}
			else if (path.includes("mp3") || path.includes("wav")) {
				ASTRAL.playSound(path);
			}
			else if (path.includes("scene")) {
				ASTRAL.loadScene(path);
			}
			else if (path.includes("atlas")) {

			}
			else if (path.includes("prefab")) {

			}
		}
	}

	function imageComponent(path) {
		var component = {};
		component.type = "image";
		component.path = path;
		return component;
	}

///////////////////////////////////////
//
//	SCENE PANEL
//
///////////////////////////////////////

	function populateScenePanel(objects, level) {
		// this populates the SCENE panel adding gameobjects and their children recursively
		// TODO: we need to actually create the game objects here too - ASTRAL.createGameObject()
		//	should take an existing object and use/return that one, so that it gets added to the
		//	game.objects collection

		if (!level) {
			var currentList = document.querySelectorAll(".sceneobjectbutton");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
			sceneData = objects;
			flashDomElement(scenePanel);
			level = 0;
		}
		level++;
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			ASTRAL.loadGameObject(obj);
			var objectName = obj.name;
			(function(obj) {
				var objectButton = ctl(
					"button sceneobjectbutton level" + level,
					null,
					objectName,
					null,
					scenePanel,
					function() {populateInspectorPanel(obj)}
				);
			}).call(this, obj);
			
			if (obj.objects) {
				populateScenePanel(obj.objects, level);
			}
		}
		level = 1;
	}

///////////////////////////////////////
//
//	INSPECTOR PANEL
//
///////////////////////////////////////

	function populateInspectorPanel(obj) {
		// this populates the INSPECTOR with the given object's properties

		inspectedObject = obj;
		inspectoritem.innerHTML = obj.name;

		posx.removeEventListener("input", posChange);
		posx.addEventListener("input", posChange);
		posx.removeEventListener("blur", posChange);
		posx.addEventListener("blur", posChange);
		posx.focus();

		posy.removeEventListener("blur", posChange);
		posy.addEventListener("blur", posChange);
		posy.removeEventListener("input", posChange);
		posy.addEventListener("input", posChange);

		rot.removeEventListener("input", rotChange);
		rot.addEventListener("input", rotChange);
		rot.removeEventListener("blur", rotChange);
		rot.addEventListener("blur", rotChange);

		scale.removeEventListener("input", scaleChange);
		scale.addEventListener("input", scaleChange);
		scale.removeEventListener("blur", scaleChange);
		scale.addEventListener("blur", scaleChange);

		if (obj.x) {
			posx.innerHTML = obj.x;
		}
		else {
			posx.innerHTML = "null";
		}
		if (obj.y) { 
			posy.innerHTML = obj.y;
		}
		else {
			posy.innerHTML = "null";
		}

		if (!obj.scale) obj.scale = 1;
		scale.innerHTML = obj.scale;

		if (!obj.rot) obj.rot = 0;
		rot.innerHTML = obj.rot;

		// clear old components from panel
		document.querySelectorAll('.componentDiv').forEach(function(a){
			a.remove()
		});

		// list the components
		for (var i = 0; i < obj.components.length; i++) {
			var component = obj.components[i];
			var componentDiv = document.createElement("DIV");
			componentDiv.className = "componentDiv";
			var componentLabel = document.createElement("DIV");
			componentLabel.innerHTML = component.type + " component";
			componentLabel.className = "componentlabel";
			componentDiv.appendChild(componentLabel);
			inspectorPanel.appendChild(componentDiv);

			// if (component.type == "image") {
			// 	var thing = ctl("button", "path", component.path, null, componentDiv, null);
			// }
			// else if (component.type == "atlas") {
			// 	var thing = ctl("button", "path", component.path, null, componentDiv, null);
			// 	var thing = ctl("button", "state", component.state, null, componentDiv, null);
			// }

			Object.keys(component).forEach(function(key,index) {
				if (key != "type") {
					var thing = ctl("button", key, component[key], null, componentDiv, null);	
				}
			});
		}
		
		flashDomElement(inspectorPanel);

		// clearTimeout(refreshInspector);
		// setTimeout(refreshInspector, 1000);
	}

	function refreshInspector() {
		populateInspectorPanel(inspectedObject);
	}

	function posChange() {
		inspectedObject.x = parseInt(posx.innerHTML);
		inspectedObject.y = parseInt(posy.innerHTML);
	}

	function rotChange() {
		inspectedObject.rot = parseFloat(rot.innerHTML);
	}

	function scaleChange() {
		inspectedObject.scale = parseFloat(scale.innerHTML);
	}

///////////////////////////////////////
//
//	HELPERS & GENERICS
//
///////////////////////////////////////

	function getDir(path) {
		// this requests a directory listing from the server

		var parentPath = path.split("/").slice(0, -1).join("/");
		if (parentPath == "../client") {
			upButton.classList.add("disabled");
		}
		else {
			upButton.classList.remove("disabled");
		}
		upButton.onclick = function() {
			var prev = parentPath;
			getDir(prev);
		}
		ASTRAL.netcode.sendNow("*getdir," + path);
		currentPath = path;
	}

	function getIconForFile(path) {
		// this gets an icon (css classname) to use for the given path

		path = path.toLowerCase();
		if (path.includes("png")) {
			return "png";
		}
		else if (path.includes("jpg")) {
			return "jpg";
		}
		else if (path.includes("prefab")) {
			return "prefab";
		}
		else if (path.includes("scene")) {
			return "scene";
		}
		else if (path.includes("mp3") || path.includes("wav")) {
			return "sound";
		}
		else if (path.includes("atlas")) {
			return "atlas";
		}
	}

	function toggle() {
		// this toggles visibility of the editor

		// TODO: some tight coupling here...but considering spriter is always coupled this might be fine
		console.log("editor.js toggle()");
		if (editorDiv.style.visibility == "hidden") {
			editorDiv.style.visibility = "visible";
			isenabled = true;
			getDir("../client/assets");
		}
		else {
			editorDiv.style.visibility = "hidden";
			spriterDiv.style.visibility = "hidden";
			isenabled = false;
		}
	}

	var lastMouseEvent;

	function ctl(type, label, value, id, parent, click) {
		// this is a universal control factory for making buttons, labels, inputs, etc on a panel
		// TODO: this is also in spriter.js with a different makeup...

		var el = document.createElement("DIV");
		if (value.indexOf("#") != -1) {
			el.innerHTML = "";
		}
		else {
			el.innerHTML = value;	
		}
		if (id) el.id = id;
		el.className = type;

		// store the mouseup event so we can check which button/keys were held in the following onclick event
		el.addEventListener("mousedown", function(event) {
			lastMouseEvent = event;
		});

		el.onclick = function() {
			if (lastMouseEvent && lastMouseEvent.which == 1) {
				if (click) click(lastMouseEvent);
			}
		}

		el.onmouseover = function(event) {
			if (el.dataset && el.dataset.tip) {
				showToolTip(el.dataset.tip, event);
			}
		}

		el.onmouseleave = function(event) {
			hideToolTip();
		}

		// customize based on type
		if (type.indexOf("input") != -1) {
			el.contentEditable = true;
		}
		else if (type.indexOf("projectfile") != -1) {
			el.draggable = true;
			el.addEventListener("dragstart", function(event) {
				event.dataTransfer.setData("text", event.target.id);
				event.target.style.opacity = 0.3;
			});
			el.addEventListener("dragend", function(event) {
				event.target.style.opacity = "";
			});
		}
		else if (type.indexOf("sceneobjectbutton") != -1) {
			el.draggable = true;
		}
		else if (type.indexOf("dropdown") != -1) {
			el.innerHTML = "";
			var dd = document.createElement("SELECT");
			el.id = "";
			dd.id = id;
			// dd.onchange = function() {
			// 	console.log("ONCHANGE");
			// 	click();
			// }
			var spl = value.split(",");
			for (var i = 0; i < spl.length; i++) {
				var val = spl[i];
				var opt = document.createElement("OPTION");
				opt.innerHTML = val;
				opt.value = val;
				dd.appendChild(opt);
			}
			el.appendChild(dd);
		}

		// create a header label
		if (label) {
			var lbl = document.createElement("DIV");
			lbl.className = "label";
			lbl.innerHTML = label;
			parent.appendChild(lbl);
		}

		parent.appendChild(el);
		return el;
	}

	function showToolTip(text, event) {
		console.log(text);
		var tooltip = document.getElementById("tooltip");
		if (tooltip) tooltip.remove();
		var el = document.createElement("DIV");
		el.id = "tooltip";
		el.style.position = "fixed";
		el.innerHTML = text; //.toLowerCase();
		//el.style.left = event.clientX - 160;
		el.style.right = 200;
		var sidebar = document.querySelector("#editorDiv .sidebar");
		sidebar.appendChild(el);
		el.style.top = event.clientY - el.scrollHeight / 2;
		el.style.width = "140px";

		setTimeout(function() {el.style.opacity = 1; el.style.right = 180;}, 10);
	}

	function hideToolTip() {
		// just grab the tooltip by dom id and remove it
		var tooltip = document.getElementById("tooltip");
		if (tooltip) tooltip.remove();
	}

	function flashDomElement(p) {
		p.classList.add("pulsestart");
		setTimeout(function() {
			p.classList.add("pulsing");
			p.classList.remove("pulsestart");
			setTimeout(function() {
				p.classList.remove("pulsing");
			}, 500);
		}, 500);
	}

	function draw() {

	}

	function enabled() {
		// TODO: we have a better pattern for exposing basic variables somewhere dont we?
		return isenabled;
	}

	this.init = init;
	this.toggle = toggle;
	this.enabled = enabled; // TODO: cant make primitive refs so had to make a wrapper func...i dont like this, better way?
}
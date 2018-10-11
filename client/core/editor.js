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
		var openImageButton = ctl("button", "tools", "open spriter", null, toolsPanel, function() {
			ASTRAL.spriter.activate("0x72_DungeonTilesetII_v1.1.png");
		});

		// create the scene panel
		scenePanel = document.createElement("DIV");
		scenePanel.className = "panel";
		sidePanel.appendChild(scenePanel);
		var thing = ctl("button sceneobjectbutton", "scene", "scene stuff here", null, scenePanel, null);

		// create the inspector panel
		inspectorPanel = document.createElement("DIV");
		inspectorPanel.className = "panel";
		sidePanel.appendChild(inspectorPanel);
		var thing = ctl("button", "inspector", "inspector stuff here", null, inspectorPanel, null);

		// create the project panel
		projectPanel = document.createElement("DIV");
		projectPanel.className = "panel";
		sidePanel.appendChild(projectPanel);
		//var thing = ctl("button", "project", "folder list here", null, projectPanel, null);

		homeButton = ctl("button icon home", "project", "", null, projectPanel, function() {getDir("../client/assets")});
		upButton = ctl("button icon moveup", null, "", null, projectPanel, function() {});
		folderButton = ctl("button icon folderadd", null, "", null, projectPanel, function() {});
		currentPath = "../client/assets";

		editorCanvas.addEventListener("dragover", function(e) {
			e.preventDefault();
		}, false);

		editorCanvas.addEventListener("dragenter", function(e) {
			//e.preventDefault();
			event.target.backgroundColor = "red";
		}, false);

		editorCanvas.addEventListener("drop", function(e) {
			e.preventDefault();
			var data = event.dataTransfer.getData("text");
			var el = document.getElementById(data);
			console.log("drop event: " + el.id + " -> " + event.target.id);
			// TODO: now add a GameObject to the objects array/scene
			//var obj = ASTRAL.createGameObject(Date.parse(new Date().toUTCString()), null, "zone1");
			addProjectFileToScene(el.id, e);
		}, false);

		ASTRAL.netcode.on("*dirlist", function(payload) {
			populateProjectPanel(payload);
		});

		ASTRAL.on("loadscene", function(scenedata) {
			populateScenePanel(scenedata);			
		});
	}

	function addProjectFileToScene(path, mouseevent) {
		// create the object
		var obj = ASTRAL.createGameObject(Date.parse(new Date().toUTCString()), "test", "zone1");
		var rx = 720 / window.innerWidth;
		var ry = 480 / window.innerHeight;
		obj.x = mouseevent.pageX * rx;
		obj.y = mouseevent.pageY * ry;

		// create the sceneobjectbutton
		var objectButton = ctl("button sceneobjectbutton level" + 1, null, obj.name, null, scenePanel, function() {inspectGameObjectInScene()});

		console.log(obj);
	}

	function populateProjectPanel(payload) {
		var currentList = document.querySelectorAll(".projectfolder, .projectfile");
		for (var i = 0; i < currentList.length; i++) {
			currentList[i].remove();
		}

		var spl = payload.join().split("***");

		if (spl[0]) {
			var folders = spl[0].split(",");
			for (var i = 0; i < folders.length; i++) {
				var folderName = folders[i];
				var label = null;
				var path = currentPath + "/" + folderName;
				(function(path) {
					var assetButton = ctl("button buttonicon folder projectfolder", label, folderName, null, projectPanel, function() {getDir(path)});
					// https://stackoverflow.com/questions/22438002/dealing-with-loops-in-javascript-only-last-item-gets-affected
				}).call(this, path);
			}
		}

		if (spl[1]) {
			var files = spl[1].split(",");
			for (var i = 0; i < files.length; i++) {
				var fileName = files[i];
				var label = null;
				var path = currentPath + "/" + fileName;
				//var fi = ASTRAL.getFileInfo(path);
				(function(path) {
					var iconName = getIconForFile(path);
					var assetButton = ctl("button file projectfile buttonicon " + iconName, label, fileName, fileName, projectPanel, function(event) {openProjectFile(event, path)});
				}).call(this, path);
			}
		}
	}

	function populateScenePanel(objects, level) {	
		if (!level) {
			var currentList = document.querySelectorAll(".sceneobjectbutton");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
			sceneData = objects;
			pulsePanel(scenePanel);
			level = 0;
		}
		level++;
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			var objectName = obj.name;
			var objectButton = ctl("button sceneobjectbutton level" + level, null, objectName, null, scenePanel, function() {inspectGameObjectInScene()});
			if (obj.objects) {
				populateScenePanel(obj.objects, level);
			}
		}
		level = 1;
	}

	function inspectGameObjectInScene() {
		console.log("INSPECT");
	}

	function pulsePanel(p) {
		p.classList.add("pulsestart");
		setTimeout(function() {
			p.classList.add("pulsing");
			p.classList.remove("pulsestart");
			setTimeout(function() {
				p.classList.remove("pulsing");
			}, 500);
		}, 500);
	}

	function getDir(path) {
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
		else if (path.includes("tilemap")) {
			return "tilemap";
		}
	}

	function openProjectFile(event, path) {
		if (event.ctrlKey) {
			window.open(path);
		}
		else {
			var relpath = path.replace(homePath, "");
			path = path.toLowerCase();
			if (path.includes(".png") || path.includes(".jpg")) {
				ASTRAL.spriter.activate(relpath);
			}
			else if (path.includes("mp3") || path.includes("wav")) {
				ASTRAL.playSound(path);
			}
			else if (path.includes("scene")) {
				ASTRAL.loadScene(path);
			}
			else if (path.includes("tilemap")) {

			}
			else if (path.includes("prefab")) {

			}
		}
	}

	function toggle() {
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

	function ctl(type, label, value, id, parent, click) {
		var el = document.createElement("DIV");
		if (value.indexOf("#") != -1) {
			el.innerHTML = "";
		}
		else {
			el.innerHTML = value;	
		}
		if (id) el.id = id;
		el.className = type;
		//el.onclick = click;
		el.addEventListener("mouseup", function(event) {
			if (event.which == 1) {
				click(event);	
			}
		});
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
		if (label) {
			var lbl = document.createElement("DIV");
			lbl.className = "label";
			lbl.innerHTML = label;
			parent.appendChild(lbl);
		}
		parent.appendChild(el);
		return el;
	}

	function draw() {

	}

	function enabled() {
		return isenabled;
	}

	this.init = init;
	this.toggle = toggle;
	this.enabled = enabled; // TODO: cant make primitive refs so had to make a wrapper func...i dont like this, better way?
}
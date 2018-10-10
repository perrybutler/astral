console.log("editor.js entry point");

ASTRAL.editor = new function() {
	var isenabled = false;

	var editorLayer;
	var editorDiv;
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

	function init() {
		console.log("editor.js init()");

		// create a layer for the sprite tool
		editorLayer = ASTRAL.createLayer("editor", 2, draw);
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

		ASTRAL.netcode.on("*dirlist", function(payload) {
			var currentList = document.querySelectorAll(".projectfolder, .projectfile");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
			populateProjectPanel(payload);
		});

		ASTRAL.on("loadscene", function(scenedata) {
			var currentList = document.querySelectorAll(".sceneobjectbutton");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
			populateScenePanel(scenedata);			
		});
	}

	function populateProjectPanel(payload) {
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
				(function(path) {
					var iconName = getIconForFile(path);
					var assetButton = ctl("button file projectfile buttonicon " + iconName, label, fileName, null, projectPanel, function() {openProjectFile(path)});
				}).call(this, path);
			}
		}
	}

	function populateScenePanel(scenedata) {
		pulsePanel(scenePanel);
		for (var i = 0; i < scenedata.length; i++) {
			var objectName = scenedata[i].name;
			var objectButton = ctl("button sceneobjectbutton", null, objectName, null, scenePanel);
		}
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

	function openProjectFile(path) {
		var relpath = path.replace(homePath, "");
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
		el.onclick = click;
		if (type.indexOf("input") != -1) {
			el.contentEditable = true;
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
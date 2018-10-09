console.log("editor.js entry point");

ASTRAL.editor = new function() {
	var isenabled = false;

	var editorLayer;
	var editorDiv;
	var sidePanel;

	var homeButton;
	var upButton;
	var folderButton;


	var homePath = "../client/assets";
	var currentPath;
	var oldPath;

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
		var thing = ctl("button", "scene", "scene stuff here", null, scenePanel, null);

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
		folderButton = ctl("button icon folder", null, "", null, projectPanel, function() {});
		currentPath = "../client/assets";

		// TODO: do a server request for assets here
		// might need a pub/sub to make a func in this file that hooks into the netcode message
		ASTRAL.netcode.on("*dirlist", function(payload) {
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
					// if (i == 0) {
					// 	label = "project";
					// }
					// else {
					// 	label = null;
					// }
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
					// if (i == 0) {
					// 	label = "project";
					// }
					// else {
					// 	label = null;
					// }
					var assetButton = ctl("button file projectfile", label, fileName, null, projectPanel, null);
				}
			}
		});

		// ASTRAL.netcode.on("*dirlist", function(payload) {
		// 	console.log("DIRLIST", payload);
		// });

		// getDir("../client/assets"); // TODO: this demonstrates race condition/problem with loading multiple modules and firing their init() asap...
	}

	function getDir(path) {
		var parentPath = path.split("/").slice(0, -1).join("/");
		console.log("PREVPATH", parentPath);

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
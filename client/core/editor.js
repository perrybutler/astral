console.log("editor.js entry point");

ASTRAL.editor = new function() {

	var editorLayer;
	var editorDiv;
	var sidePanel;

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
		var thing = ctl("button", "project", "folder list here", null, projectPanel, null);
	}

	function activate() {
		console.log("editor.js activate()");
		if (editorDiv.style.visibility == "hidden") {
			editorDiv.style.visibility = "visible";
		}
		else {
			editorDiv.style.visibility = "hidden";
			spriterDiv.style.visibility = "hidden";
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

	this.init = init;
	this.activate = activate;
}
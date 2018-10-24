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
	var inspectorSection;
	var projectPanel;
	var sceneSection;
	var projectSection;

	var homeButton;
	var upButton;
	var folderButton;

	var homePath = "../client/assets";
	var currentPath;

	//var sceneData;
	var inspectedObject;

///////////////////////////////////////
//
//	STARTUP
//
///////////////////////////////////////
	
	function init() {
		// initializes the editor, this gets called as soon as editor.js is loaded by the browser
		console.log("editor.js init()");

		// create a layer
		// TODO: dont think we need a layer, overhaul this...
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

		// create the sidebars where the panels will live
		var sidebar1Div = document.createElement("DIV");
		sidebar1Div.id = "sidebar1";
		sidebar1Div.className = "sidebar";
		document.body.appendChild(sidebar1Div);
		var sidebar2Div = document.createElement("DIV");
		sidebar2Div.id = "sidebar2";
		sidebar2Div.className = "sidebar";
		document.body.appendChild(sidebar2Div);
		var sidebar3Div = document.createElement("DIV");
		sidebar3Div.id = "sidebar3";
		sidebar3Div.className = "sidebar";
		document.body.appendChild(sidebar3Div);
		var sidebar4Div = document.createElement("DIV");
		sidebar4Div.id = "sidebar4";
		sidebar4Div.className = "sidebar";
		document.body.appendChild(sidebar4Div);

		// create the tools panel
		toolsPanel = ctlPanel("tools", "toolsPanel", "", "sidebar4");
		var toolsSection = ctlSection("", "", "", toolsPanel);
		var openImageButton = ctl("button", null, "✎ open spriter", null, toolsSection, function() {
			ASTRAL.spriter.activate("assets/0x72_DungeonTilesetII_v1.1.png");
		});

		// create the display panel
		displayPanel = ctlPanel("display", "displayPanel", "", "sidebar4");
		var displaySection = ctlSection("", "", "", displayPanel);
		var thing = ctl("dropdown", "resolution", "Dynamic,3840x2160,2560x1440,1920x1080,1366x768,1280x720,720x480,-,2048x1536,1600x1200,1280x1024,1024x768,640x480,320x240,320x200,-,1000x1000,500x500,250x250,100x100", "resolution", displaySection, null);
		resolution.onchange = function() {screenResolutionChange()}
		resolution.value = "Dynamic";
		var thing = ctl("dropdown", "scaling", "Stretch,3840x2160,2560x1440,1920x1080,1366x768,1280x720,720x480,-,2048x1536,1600x1200,1280x1024,1024x768,640x480,320x240,320x200,-,1000x1000,500x500,250x250,100x100", "scaling", displaySection, null);
		scaling.onchange = function() {screenScalingChange()}
		var thing = ctl("dropdown", "resampling", "Nearest,Bilinear", "resampling", displaySection, null);
		resampling.onchange = function() {screenResamplingChange()}

		// create the diagnostics panel
		diagnosticsPanel = ctlPanel("diagnostics", "diagnosticsPanel", "", "sidebar4");
		var diagnosticsSection = ctlSection("", "", "", diagnosticsPanel);
		var thing = ctl("button buttonicon message", "network", "netcodestuff", "netcodestuff", diagnosticsSection, null);
		var thing = ctl("button buttonicon message", "memory", "memorystuff", "memorystuff", diagnosticsSection, null);

		// create the scene panel
		scenePanel = ctlPanel("scene", "scenePanel", "", "sidebar1");
		sceneSection = ctlSection("", "sceneSection", "", scenePanel);
		var thing = ctl("button icon diskette", null, "", "scenesave", sceneSection, function() {saveScene()});
		scenesave.dataset.tip = "Save changes to the current scene.";
		var thing = ctl("button icon openexternal", null, "", "sceneopenexternal", sceneSection, function() {viewSceneData()});
		sceneopenexternal.dataset.tip = "View the scene data in a new tab.";
		var thing = ctl("button icon download", null, "", "scenedownload", sceneSection, function() {downloadScene()});
		scenedownload.dataset.tip = "Download the scene data to disk.";
		var thing = ctl("button sceneobjectbutton", null, "scene stuff here", null, sceneSection, null);
		
		// // create the brush panel
		// brushPanel = document.createElement("DIV");
		// brushPanel.className = "panel";
		// sidebar1Div.appendChild(brushPanel);
		// var thing = ctl("button", "brushes", "brushes here", null, brushPanel, null);

		// create the inspector panel
		inspectorPanel = ctlPanel("inspector", "inspectorPanel", "", "sidebar4");
		inspectorSection = ctlSection("", "", "", inspectorPanel);
		var thing = ctl("button", null, "(nothing selected)", "inspectoritem", inspectorSection, null);
		var thing = ctl("input pair", "position", "0", "posx", inspectorSection, null);
		var thing = ctl("input pair", null, "0", "posy", inspectorSection, null);
		posx.addEventListener("mousewheel", function(event) {
			event.preventDefault();
			posx.innerHTML = parseInt(posx.innerHTML) - event.deltaY / 5;
			posx.dispatchEvent(new Event('input'));
		});
		posy.addEventListener("mousewheel", function(event) {
			event.preventDefault();
			posy.innerHTML = parseInt(posy.innerHTML) - event.deltaY / 5;
			posy.dispatchEvent(new Event('input'));
		});
		var thing = ctl("input pair", "rotation / scale", "0", "rot", inspectorSection, null);
		var thing = ctl("input pair", null, "0", "scale", inspectorSection, null);
		rot.addEventListener("mousewheel", function(event) {
			event.preventDefault();
			rot.innerHTML = (parseFloat(rot.innerHTML) - event.deltaY / 5).toFixed(2);
			rot.dispatchEvent(new Event('input'));
		});
		scale.addEventListener("mousewheel", function(event) {
			event.preventDefault();
			scale.innerHTML = (parseFloat(scale.innerHTML) - event.deltaY / 500).toFixed(2);
			scale.dispatchEvent(new Event('input'));
		});
		var componentsTitle = document.createElement("DIV");
		componentsTitle.className = "label";
		componentsTitle.innerHTML = "components";
		inspectorSection.appendChild(componentsTitle);

		// create the project panel
		projectPanel = ctlPanel("project", "projectPanel", "", "sidebar1");
		var connectionSection = ctlSection("", "connectionSection", "", projectPanel);
		connectionSection.className = "connectionmsg";
		connectionSection.innerHTML = "Establish a connection to the server to use this feature, or use Windows Explorer as an alternative.";
		projectSection = ctlSection("", "projectSection", "", projectPanel);
		projectSection.classList.add("connectionreq");
		homeButton = ctl("button icon home", null, "", null, projectSection, function() {getDir("../client/assets")});
		homeButton.dataset.tip = "Return to the root assets folder";
		upButton = ctl("button icon moveup", null, "", null, projectSection, function() {});
		upButton.dataset.tip = "Go back to the previous folder";
		//folderButton = ctl("button icon folderadd", null, "", null, projectSection, function() {});
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

		ASTRAL.netcode.on("connect", function() {
			// document.querySelectorAll(".connectionRequired").forEach(function(el) {
			// 	el.display = "block";
			// });
			console.log("GETDIR");
			getDir("../client/assets");
		});

		ASTRAL.netcode.on("close", function() {
			// document.querySelectorAll(".connectionRequired").forEach(function(el) {
			// 	el.display = "none";
			// });
			//getDir("../client/assets");
		});

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

		// // subscribe to loadscene which we use to update the SCENE panel
		// ASTRAL.on("loadscene", function(scenedata) {
		// 	populateScenePanel(scenedata);
		// });

		window.addEventListener("resize", function() {
			if (resolution.value == "Dynamic") {
				scaling.value = "Stretch";
				screenScalingChange();
			}
		});

		ASTRAL.on("beforesceneload", function() {
			// clear the scene panel object list
			var currentList = document.querySelectorAll(".sceneobjectbutton");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
		});

		ASTRAL.on("objectloaded", function(obj) {
			addGameObjectToScenePanel(obj);
		});

		// setInterval(function() {
		// 	netcodestuff.innerHTML = ASTRAL.netcode.getNetcodeInfo();
		// }, 1000);

		// TODO: race condition could happen here if eg we call screenScalingChange() which tries
		//	to access the gameCanvas before it has been created, this setTimeout demonstrates it,
		//	with a 10ms timeout, sometimes the code will work fine sometimes the race condition
		//	occurs
		//setTimeout(function() {screenScalingChange()}, 10);
		
		//console.log("ASTRAL", ASTRAL);
	}

	function saveScene() {

	}

	function viewSceneData() {
		// TODO: this is not carrying over new objects...only initial objects and their changed data
		//ASTRAL.openDataInNewTab(ASTRAL.sceneData);
		console.log(ASTRAL.sceneData);
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

		// clear the panel
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
						projectSection,
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
						projectSection,
						function(event) {openProjectFile(event, path)}
					);
				}).call(this, path);
			}
		}
	}

	function addGameObjectToScenePanel(obj) {
		// add a button for this gameobject to the SCENE panel
		var objectButton = ctl(
			"button sceneobjectbutton level" + obj.level,
			null,
			obj.name,
			null,
			sceneSection,
			function() {populateInspectorPanel(obj)}
		);

		// visual feedback
		flashDomElement(objectButton);
		
		console.log("created scenegraph node:", obj);
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
			sceneSection,
			function() {populateInspectorPanel(obj)}
		);

		// visual feedback
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

	// TODO: this should be somewhere else
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
					sceneSection,
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

		// set a global to track the object being inspected
		inspectedObject = obj;

		// since the inspector reuses some controls, we need to rebind their listeners
		// TODO: do we really need to do this??
		// TODO: or we can add these props here too, so that we can show an empty inspector until it gets
		//	populated
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

		// populate some basic props
		inspectoritem.innerHTML = obj.name;
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

		// redo the drop event
		// TODO: this selector could get sloppy since it uses a class which might get used more than once
		//	so just make a #inspectorTitle element
		var inspectorTitle = document.querySelector("#inspectorPanel .title");
		inspectorTitle.removeEventListener("drop", titleDrop);
		inspectorTitle.addEventListener("drop", titleDrop);

		// list the components
		for (var i = 0; i < obj.components.length; i++) {
			var component = obj.components[i];
			ctlComponent(component);
		}
		
		// refresh the inspector if the object properties have changed
		// clearTimeout(refreshInspector);
		// setTimeout(refreshInspector, 1000);

		// visual feedback
		flashDomElement(inspectorPanel);
	}

	function titleDrop(e) {
		// TODO: determine what was dropped and handle it
		//	e.g. png file was dropped on title, create an image component
		//	e.g. atlas file was dropped on title, create an atlas component

		//inspectedObject.components[key] = val;

		var path = e.dataTransfer.getData("text").replace("../client/", "");
		addComponentToGameObject(inspectedObject, path);

	}

	function addComponentToGameObject(obj, path) {
		var fi = ASTRAL.getFileInfo(path);
		var componentDiv;
		switch (fi.type) {
			case "image":
				var component = {};
				component.type = "image";
				component.path = path;
				inspectedObject.components.push(component);
				componentDiv = ctlComponent(component);
				break;
			case "atlas":
				var component = {};
				component.type = "atlas";
				component.path = path;
				inspectedObject.components.push(component);
				componentDiv = ctlComponent(component);
				break;
			case "script":
				var component = {};
				component.type = fi.nameNoExt;
				component.path = path;
				// TODO: here we need to expose any public props/vals in the custom script component
				//	e.g. the script might have a global "speed" prop and we want to be able to modify
				//	that value in the editor here
				inspectedObject.components.push(component);
				componentDiv = ctlComponent(component);
				break;
		}
		flashDomElement(componentDiv);
	}

	function removeComponent() {

	}

	function refreshInspector() {
		// TODO: this forcefully refreshes and flashes the whole panel, it should take a diff and only 
		//	refresh changed fields, then fire a flash on the changed fields only
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
//	UI BUILDERS
//
///////////////////////////////////////

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
				showOverlays(["#inspectorPanel .title", "#inspectorPanel .filetarget"]);
			}, false);
			el.addEventListener("dragend", function(event) {
				event.target.style.opacity = "";
				hideOverlays();
			}, false);
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

	function ctlPanel(title, id, extraClassNames, sidebarId) {
		var panelDiv = document.createElement("DIV");
		panelDiv.id = id;
		panelDiv.className = "panel " + extraClassNames;
		if (title) {
			var titleDiv = document.createElement("DIV");
			titleDiv.className = "title";
			titleDiv.innerHTML = title;
			titleDiv.onclick = function() {
				var secs = document.querySelectorAll("#" + id + " .section");
				secs.forEach(function(sec) {
					if (sec.style.display == "none") {
						sec.style.display = "block";
					}
					else {
						sec.style.display = "none";
					}
					// if (sec.style.display == "block") {
					// 	sec.style.display = "none";
					// }
					// else {
					// 	sec.style.display = "block";
					// }
				});
				//document.querySelector("#" + id + " .section").style.display = "none";
			}
			panelDiv.appendChild(titleDiv);
		}
		document.getElementById(sidebarId).appendChild(panelDiv);
		return panelDiv;
	}

	function ctlSection(title, id, extraClassNames, panel) {
		var sectionDiv = document.createElement("DIV");
		sectionDiv.id = id;
		sectionDiv.className = "section " + extraClassNames;
		if (title) {
			var titleDiv = document.createElement("DIV");
			titleDiv.className = "sectiontitle";
			titleDiv.innerHTML = title;
			panel.appendChild(titleDiv);
		}
		panel.appendChild(sectionDiv);
		return sectionDiv;
	}

	function ctlComponent(component) {
		// create the wrapper div and label
		var componentDiv = document.createElement("DIV");
		componentDiv.className = "componentDiv";
		inspectorSection.appendChild(componentDiv);

		var componentButton = document.createElement("DIV");
		componentButton.className = "componentButton component button icon expander";
		componentButton.style.cssFloat = "left";
		componentDiv.appendChild(componentButton);

		var componentButton = document.createElement("DIV");
		componentButton.className = "componentButton component button icon remove";
		componentDiv.appendChild(componentButton);

		// var componentButton = document.createElement("DIV");
		// componentButton.className = "componentButton component button icon menu";
		// componentDiv.appendChild(componentButton);

		var componentButton = document.createElement("DIV");
		componentButton.className = "componentButton component button icon movedown";
		componentDiv.appendChild(componentButton);

		var componentButton = document.createElement("DIV");
		componentButton.className = "componentButton component button icon moveup";
		componentDiv.appendChild(componentButton);

		var componentLabel = document.createElement("DIV");
		componentLabel.innerHTML = component.type; // + " component";
		componentLabel.className = "componentlabel";
		componentDiv.appendChild(componentLabel);

		// create a control for each prop
		Object.keys(component).forEach(function(key,index) {
			if (key != "type") {
				if (key == "path") {
					var thing = ctl("button filetarget", key, component[key], null, componentDiv, null);
					thing.addEventListener("drop", function(e) {
						var path = e.dataTransfer.getData("text").replace("../client/", "");
						component[key] = path;
						thing.innerHTML = path;
						ASTRAL.loadImage(path);
					});
				}
				else {
					var thing = ctl("button", key, component[key], null, componentDiv, null);
				}
			}
		});

		return componentDiv;
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
			document.querySelectorAll(".sidebar").forEach(function(el) {
				el.style.display = "block";
			});
			ASTRAL.setPanelLayout([], [], ["scenePanel", "inspectorPanel"], ["toolsPanel", "diagnosticsPanel", "displayPanel", "projectPanel"]);
			editorDiv.style.visibility = "visible";
			isenabled = true;
			//getDir("../client/assets");
		}
		else {
			document.querySelectorAll(".sidebar").forEach(function(el) {
				el.style.display = "none";
			});
			editorDiv.style.visibility = "hidden";
			spriterDiv.style.visibility = "hidden";
			isenabled = false;
		}
	}

	var lastMouseEvent;

	function showOverlays(elementArray) {
		elementArray.forEach(function(id) {
			//var el = document.getElementById(id);
			var el = document.querySelector(id);
			if (el) {
				var overlay = document.createElement("DIV");
				overlay.className = "overlay";
				overlay.addEventListener("dragover", function(e) {
					e.preventDefault();
				}, false);
				overlay.addEventListener("dragenter", function(e) {
					e.preventDefault();
					this.classList.add("dragenter");
				}, false);
				overlay.addEventListener("dragleave", function(e) {
					e.preventDefault();
					this.classList.remove("dragenter");
				}, false);
				overlay.addEventListener("drop", function(e) {
					e.preventDefault();
					var data = event.dataTransfer.getData("text");
					// TODO: we need to know what to do and when...
					//	e.g. if its a project file being dropped on the inspector title, add new component
					//	e.g. if its a project file being dropped on a path button, set the new path
					// 	should we set up the path controls onchange() or blur() to update the object like
					//		we did for all the other controls?
					//	e.g. var thing = ctl(); thing.blur = function() {...}
					//  we also need an easy path to the object and/or component being changed
					//	we have the inspectedObject global, but we don't track components yet
					//	we could stuff the el with extra props that let us get to the object components

					//el.innerHTML = data; // silly brute force kinda works but not really



					console.log("drop event:", data, "->", el);
				}, false);
				el.appendChild(overlay);
			}
		});
	}

	function hideOverlays() {
		document.querySelectorAll(".overlay").forEach(function(el) {
			el.remove();
		});
	}

	function showToolTip(text, event) {
		// remove any existing tooltip
		hideToolTip();

		// get the hovered object's screen position
		var panelPos = event.fromElement.getBoundingClientRect();
		var t = event.target.getBoundingClientRect();

		// create the tooltip
		var el = document.createElement("DIV");
		el.id = "tooltip";
		el.style.position = "fixed";
		el.innerHTML = text; //.toLowerCase();
		//el.style.left = event.clientX - 160;
		el.style.left = t.left - 170; //panelPos.left - 160;
		//el.style.top = event.clientY - el.scrollHeight / 2;
		el.style.width = "140px";
		document.body.appendChild(el);
		el.style.top = (t.top + (t.bottom - t.top) / 2) - (el.offsetHeight / 2); //(srcpos.top + ((srcpos.bottom - srcpos.top) / 2));

		setTimeout(function() {
			el.style.opacity = 1;
			el.style.left = t.left - 160;
		}, 50);
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
	this.ctlPanel = ctlPanel;
	this.ctlSection = ctlSection;
}
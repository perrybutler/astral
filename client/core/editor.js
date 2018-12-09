"use strict";
console.log("editor.js entry point");

ASTRAL.editor = (function() {

	console.log("editor.js constructor");

///////////////////////////////////////
//
//	PRIVATE LOCAL VARS
//
///////////////////////////////////////

	var enabled = false;

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
	var displayPanel;
	var diagnosticsPanel;
	var componentsPlaceholder;

	var homeButton;
	var upButton;
	var folderButton;
	var fileButton;

	var homePath = "../client/assets";
	var currentPath;

	//var sceneData;
	var inspectedObject;

	var drawObjectName = true;
	var drawObjectId = true;
	var drawObjectPos = false;
	var drawObjectSize = false;
	var drawObjectRot = false;
	var drawObjectOrigin = true;
	var drawObjectBorders = true;
	var drawParticleCount = false;

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
		var openImageButton = ctl("button buttonicon edit", null, "open spriter", null, toolsSection, function() {
			ASTRAL.spriter.activate("assets/0x72_DungeonTilesetII_v1.1.png");
		});
		var connectButton = ctl("button buttonicon connect", null, "connect to server", null, toolsSection, function() {
			// TODO: hard coupling here...
			if (ASTRAL.netcode) {
				ASTRAL.netcode.connect();
			}
			else {
				ASTRAL.error("Netcode module not loaded. To use it, add it to 'modules' section in game.json.", 3000);
			}
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
		var thing = ctl("button pill toggle on", "draw object info", "name", null, diagnosticsSection, function() {toggleDrawObjectName()});
		var thing = ctl("button pill toggle on", "", "id", null, diagnosticsSection, function() {toggleDrawObjectId()});
		var thing = ctl("button pill toggle", "", "pos", null, diagnosticsSection, function() {toggleDrawObjectPos()});
		var thing = ctl("button pill toggle", "", "size", null, diagnosticsSection, function() {toggleDrawObjectSize()});
		var thing = ctl("button pill toggle", "", "rot", null, diagnosticsSection, function() {toggleDrawObjectRot()});
		var thing = ctl("button pill toggle on", "", "origin", null, diagnosticsSection, function() {toggleDrawObjectOrigin()});
		var thing = ctl("button pill toggle on", "", "borders", null, diagnosticsSection, function() {toggleDrawObjectBorders()});
		var thing = ctl("button pill", "", "frameid", null, diagnosticsSection, function() {});
		var thing = ctl("button pill toggle", "", "pcount", null, diagnosticsSection, function() {toggleDrawParticleCount()});

		// create the scene panel
		scenePanel = ctlPanel("scene", "scenePanel", "", "sidebar1");
		sceneSection = ctlSection("", "sceneSection", "", scenePanel);
		var thing = ctl("button icon add", null, "", "inspectorCreateObject", sceneSection, function() {ASTRAL.createObject(null, "new object");});
		inspectorCreateObject.dataset.tip = "Create a new empty object in the scene.";
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
		var noSelectionSection = ctlSection("", "noSelectionSection", "", inspectorPanel);
		noSelectionSection.className = "selectionmsg";
		noSelectionSection.innerHTML = "Select an object in the SCENE panel to view or modify its properties here.";
		inspectorSection = ctlSection("", "", "", inspectorPanel);
		var thing = ctl("button icon basic", null, "", "inspectorShowBasic", inspectorSection, function() {});
		inspectorShowBasic.dataset.tip = "Show commonly used object properties.";
		var thing = ctl("button icon advanced", null, "", "inspectorShowAdvanced", inspectorSection, function() {});
		inspectorShowAdvanced.dataset.tip = "Show all object properties.";
		var thing = ctl("button icon remove", null, "", "inspectorDeleteObject", inspectorSection, function() {ASTRAL.deleteInspectedObject();});
		inspectorDeleteObject.dataset.tip = "Delete this object from the scene.";
		var thing = ctl("input", null, "(nothing selected)", "inspectoritem", inspectorSection, null);
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
		componentsPlaceholder = document.createElement("DIV");
		componentsPlaceholder.className = "componentText";
		componentsPlaceholder.innerHTML = "None";
		inspectorSection.appendChild(componentsPlaceholder);
		populateInspectorPanel(null);

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
		folderButton = ctl("button icon folderadd", null, "", null, projectSection, function() {createFolder()});
		folderButton.dataset.tip = "Create a new folder in the current directory.";
		fileButton = ctl("button icon fileadd", null, "", "projectPanelNewItem", projectSection, function() {createFile()});
		fileButton.dataset.tip = "Create a new file in the current directory.";
		currentPath = "../client/assets";

		// create fps counter
		var fpsDiv = document.createElement("DIV");
		fpsDiv.id = "fps";
		document.body.appendChild(fpsDiv);

		ASTRAL.on("fps", function(fps) {
			fpsDiv.innerHTML = fps;
		});

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

		if (ASTRAL.netcode) {
			// TODO: we have several hard couplings by calling ASTRAL.netcode here...probably should move
			//	all events into ASTRAL and use it as the message bus so ASTRAL.on("connect")
			ASTRAL.netcode.on("connect", function() {
				// document.querySelectorAll(".connectionRequired").forEach(function(el) {
				// 	el.display = "block";
				// });
				//console.log("GETDIR");
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
				var info = ASTRAL.netcode.getNetcodeInfo();
				if (netcodestuff.innerHTML != info) {
					netcodestuff.innerHTML = info;
					flashDomElement(netcodestuff);
				}
			});

			ASTRAL.netcode.on("afterreceive", function(payload) {
				var info = ASTRAL.netcode.getNetcodeInfo();
				if (netcodestuff.innerHTML != info) {
					netcodestuff.innerHTML = info;
					flashDomElement(netcodestuff);
				}
			});

			ASTRAL.netcode.on("*createfileresult", function(payload) {
				// pop the file into the PROJECT panel with contenteditable true
				var fi = ASTRAL.getFileInfo(payload[0]);
				createdProjectNode.remove();
				var node = createProjectNode(fi.name);
				flashDomElement(node);
			});

			ASTRAL.netcode.on("*renamefileresult", function(payload) {
				// var fi = ASTRAL.getFileInfo(payload[0]);
				// createdProjectNode.innerHTML = fi.name;
				// flashDomElement(createdProjectNode);
				var fi = ASTRAL.getFileInfo(payload[0]);
				createdProjectNode.remove();
				createdProjectNode = createProjectNode(fi.name);
				flashDomElement(createdProjectNode);
			});

			ASTRAL.netcode.on("*deletefileresult", function(payload) {
				var fi = ASTRAL.getFileInfo(payload[0]);
				if (fi.name) {
					// file was deleted
					deletedProjectNode.remove();
				}
				else {
					// file was not deleted
				}
			});
		}

		window.addEventListener("resize", function() {
			//console.log("RESIZE");
			if (resolution.value == "Dynamic") {
				scaling.value = "Stretch";
				screenScalingChange();
			}
		});

		window.addEventListener("click", function() {
			var menu = document.getElementById("contextmenu");
			if (menu) menu.remove();
		});

		ASTRAL.on("beforesceneload", function() {
			// clear the scene panel object list
			var currentList = document.querySelectorAll(".sceneobjectbutton");
			for (var i = 0; i < currentList.length; i++) {
				currentList[i].remove();
			}
			// clear the inspector
			inspectedObject = null;
		});

		ASTRAL.on("objectcreated", function(obj) {
			addGameObjectToScenePanel(obj);
		});

		ASTRAL.on("objectdeleted", function(obj) {
			// TODO
			deleteGameObjectFromScenePanel(obj);
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

		setInterval(function() {
			refreshInspectorPanel(inspectedObject);
		}, 100);
	}

	function saveScene() {
		ASTRAL.saveSceneData(ASTRAL.sceneData);
	}

	function viewSceneData() {
		// TODO: this is not carrying over new objects...only initial objects and their changed data
		let json = ASTRAL.sceneDataToJson();
		ASTRAL.openJsonInNewTab(json);
	}

	function downloadScene() {
		ASTRAL.downloadSceneData("newscene.scene");
	}

	function createFolder() {

	}

	function createFile() {
		//ASTRAL.netcode.sendNow("*createfile," + currentPath);
		var node = createProjectNode();
		beginRenameProjectNode(node, true);
	}

	function renameFile() {

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
//	DIAGNOSTICS PANEL
//
///////////////////////////////////////

	function toggleDrawObjectName() {
		if (drawObjectName == false) {
			drawObjectName = true;
		}
		else {
			drawObjectName = false;
		}
	}

	function toggleDrawObjectId() {
		if (drawObjectId == false) {
			drawObjectId = true;
		}
		else {
			drawObjectId = false;
		}
	}

	function toggleDrawObjectPos() {
		if (drawObjectPos == false) {
			drawObjectPos = true;
		}
		else {
			drawObjectPos = false;
		}
	}

	function toggleDrawObjectSize() {
		if (drawObjectSize == false) {
			drawObjectSize = true;
		}
		else {
			drawObjectSize = false;
		}
	}

	function toggleDrawObjectRot() {
		if (drawObjectRot == false) {
			drawObjectRot = true;
		}
		else {
			drawObjectRot = false;
		}
	}

	function toggleDrawObjectOrigin() {
		if (drawObjectOrigin == false) {
			drawObjectOrigin = true;
		}
		else {
			drawObjectOrigin = false;
		}
	}

	function toggleDrawObjectBorders() {
		if (drawObjectBorders == false) {
			drawObjectBorders = true;
		}
		else {
			drawObjectBorders = false;
		}
	}

	function toggleDrawParticleCount() {
		if (drawParticleCount == false) {
			drawParticleCount = true;
		}
		else {
			drawParticleCount = false;
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
					assetButton.addEventListener("contextmenu", function(e) {
						e.preventDefault();
						ctxProject(assetButton, e);
					});
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
				//console.log("PATH", fileName, path);
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
					assetButton.addEventListener("contextmenu", function(e) {
						e.preventDefault();
						ctxProject(assetButton, e);
					});
				}).call(this, path);
			}
		}
	}

	var createdProjectNode;

	function createProjectNode(name) {
		if (!name) name = "newfile";
		var path = currentPath + "/" + name;
		var iconName = getIconForFile(path);
		var node = ctl(
			"button file projectfile buttonicon " + iconName,
			null,
			name,
			path,
			projectSection,
			function(event) {openProjectFile(event, path)}
		);
		node.addEventListener("contextmenu", function(e) {
			e.preventDefault();
			ctxProject(node, e);
		});
		return node;
	}

	var deletedProjectNode;

	function deleteProjectNode(node) {
		deletedProjectNode = node;
		var path = currentPath + "/" + node.innerHTML;
		ASTRAL.netcode.sendNow("*deletefile," + path);
	}

	function copyFile(node) {
		var path = currentPath + "/" + node.innerHTML;
		ASTRAL.netcode.sendNow("*copyfile," + path);
	}

	function copyObject(obj) {
		var newobj;
		newobj = JSON.parse(JSON.stringify(obj));
		ASTRAL.formatObject(newobj);
		newobj.id = Date.parse(new Date().toUTCString());
		ASTRAL.sceneData.push(newobj);
		ASTRAL.do("objectcreated", newobj);
	}

	function deleteObject(node) {

	}

	function renameObject(node) {

	}

	function beginRenameProjectNode(node, isNew) {
		var oldpath = currentPath + "/" + node.innerHTML;
		var oldonclick = node.onclick;
		node.onclick = null;
		node.draggable = false;
		node.setAttribute("contenteditable", true);
		node.focus();
		ASTRAL.setEndOfContenteditable(node);
		node.addEventListener("keydown", function(e) {
			if (e.which == 13) {
				e.preventDefault();
				//doneRenaming();
				node.blur();
			}
		});
		node.addEventListener("blur", function() {
			doneRenaming();
		});
		function doneRenaming() {
			node.onclick = oldonclick;
			node.draggable = true;
			createdProjectNode = node;
			node.setAttribute("contenteditable", false);
			// TODO: maybe send a second param with the old filename if this is a rename operation
			if (isNew) {
				var newpath = currentPath + "/" + node.innerHTML;
				ASTRAL.netcode.sendNow("*createfile," + newpath);
			}
			else {
				var newpath = currentPath + "/" + node.innerHTML;
				ASTRAL.netcode.sendNow("*renamefile," + oldpath + "," + newpath);
				// TODO: i think maybe we need to remove and readd a node so it gets the right props
			}
			//createProjectNode()
		}
	}

	function ctxScene(node, obj, e) {
		// if a menu is already open remove that one
		var menu = document.getElementById("contextmenu");
		if (menu) menu.remove();

		// create the context
		menu = document.createElement("DIV");
		document.body.appendChild(menu);
		menu.id = "contextmenu";
		menu.style.left = e.pageX;
		menu.style.top = e.pageY;

		var btn;

		btn = document.createElement("DIV");
		btn.innerHTML = "Make a Copy";
		btn.className = "item";
		btn.onclick = function() {
			copyObject(obj);
		}
		menu.appendChild(btn);

		// btn = document.createElement("DIV");
		// btn.innerHTML = "Rename";
		// btn.className = "item";
		// btn.onclick = function() {
		// 	renameObject(node);
		// }
		// menu.appendChild(btn);

		// btn = document.createElement("DIV");
		// btn.innerHTML = "Delete";
		// btn.className = "item";
		// btn.onclick = function() {
		// 	deleteObject(node);
		// }
		// menu.appendChild(btn);
	}

	function ctxProject(node, e) {
		// if a menu is already open remove that one
		var menu = document.getElementById("contextmenu");
		if (menu) menu.remove();

		// create the context
		menu = document.createElement("DIV");
		menu.id = "contextmenu";
		menu.style.left = e.pageX;
		menu.style.top = e.pageY;

		var btn;

		// // COPY creates a deep copy of the object, resulting in a brand new object
		// btn = document.createElement("DIV");
		// btn.innerHTML = "Copy";
		// btn.className = "item";
		// btn.onclick = function() {
			
		// }
		// menu.appendChild(btn);

		// // CUT
		// btn = document.createElement("DIV");
		// btn.innerHTML = "Cut";
		// btn.className = "item";
		// btn.onclick = function() {
			
		// }
		// menu.appendChild(btn);

		// // PASTE
		// btn = document.createElement("DIV");
		// btn.innerHTML = "Paste";
		// btn.className = "item";
		// btn.onclick = function() {
			
		// }
		// menu.appendChild(btn);

		// =======

		btn = document.createElement("DIV");
		btn.innerHTML = "Make a Copy";
		btn.className = "item";
		btn.onclick = function() {
			copyFile(node);
		}
		menu.appendChild(btn);


		// =======

		// RENAME
		btn = document.createElement("DIV");
		btn.innerHTML = "Rename";
		btn.className = "item";
		btn.onclick = function(e) {
			//console.log(node);
			beginRenameProjectNode(node, false);
		}
		menu.appendChild(btn);

		// DELETE
		btn = document.createElement("DIV");
		btn.className = "item";
		btn.innerHTML = "Delete";
		btn.onclick = function() {
			deleteProjectNode(node);
		}
		menu.appendChild(btn);

		// // PROPERTIES
		// btn = document.createElement("DIV");
		// btn.className = "item";
		// btn.innerHTML = "Properties";
		// btn.onclick = function() {
			
		// }
		// menu.appendChild(btn);

		document.body.appendChild(menu);

		// https://design.tutsplus.com/tutorials/quick-tip-duplicate-clone-or-copy-and-paste--cms-19969
	}

	function addGameObjectToScenePanel(obj) {
		// this normally gets called via ASTRAL.do("objectloaded") when a gameobject is created 
		//	so it can be added to the SCENE panel
		var level = 1;
		if (obj.level) level = obj.level;
		// add a button for this gameobject to the SCENE panel
		var node = ctl( // arguments: type (css classnames), label (separate heading div), value, id, section, onclick
			"button sceneobjectbutton level" + level,
			null,
			obj.name,
			"objid" + obj.id,
			sceneSection,
			function() {populateInspectorPanel(obj)}
		);
		node.addEventListener("contextmenu", function(e) {
			e.preventDefault();
			ctxScene(node, obj, e);
		});
		// visual feedback
		flashDomElement(node);
		console.log("created node for object:", obj);
	}

	function deleteGameObjectFromScenePanel(obj) {
		// get the node in the SCENE panel matching this gameobject
		var node = document.querySelector("#objid" + obj.id);
		node.remove();
		// call this recursively to remove child nodes since removing an object removes all its 
		//	children
		if (obj.objects) {
			for (var i = 0; i < obj.objects.length; i++) {
				deleteGameObjectFromScenePanel(obj.objects[i]);
			}
		}
		inspectedObject = null;
	}

	function addProjectFileToScene(path, mouseevent) {
		// // gets called when a file is dropped on the game canvas
		// // create the gameobject and set its position at the mouse position
		// console.log("creating object from project file:", path);
		// var fi = ASTRAL.getFileInfo(path);
		// var obj = ASTRAL.createObject(null, fi.nameNoExt); // this triggers addGameObjectToScenePanel()
		// var cw = gameCanvas.width;
		// var ch = gameCanvas.height;
		// var rx = cw / window.innerWidth;
		// var ry = ch / window.innerHeight;
		// obj.x = mouseevent.pageX * rx;
		// obj.y = mouseevent.pageY * ry;
		// // TODO: we don't always want to call addComponentToGameObject() since the file might not be
		// //	 component...
		// addComponentToGameObject(obj, path);
		// populateInspectorPanel(obj);


		// gets called when a file is dropped on the game canvas
		var fi = ASTRAL.getFileInfo(path);

		if (fi.ext == "scene") {

		}
		else {
			// create the gameobject and set its position at the mouse position
			console.log("creating object from file ", path);
			
			var obj = ASTRAL.createObject(null, fi.nameNoExt); // this triggers addGameObjectToScenePanel()
			obj.x = mouseevent.pageX * getScaleX();
			obj.y = mouseevent.pageY * getScaleY();

			addComponentToGameObject(obj, path);
			
			if (fi.ext == "atlas") {
				// load the atlas data
				// load the image
				// populate component props
			}

			populateInspectorPanel(obj);
		}


	}

	function getScaleX() {
		var cw = gameCanvas.width;
		var rx = cw / window.innerWidth;
		return rx;
	}

	function getScaleY() {
		var ch = gameCanvas.height;
		var ry = ch / window.innerHeight;
		return ry;
	}

	function openProjectFile(event, path) {
		// this controls what to do when a file/folder is clicked in the PROJECT panel
		if (event.ctrlKey) {
			// CTRL + Click should open the file in a new browser tab
			window.open(path);
		}
		else if (event.shiftKey) {
			// Shift + Click should open the file in its associated native app
			ASTRAL.netcode.sendNow("*exec," + path);
		}
		else {
			// plain Click should handle the file in Astral
			//var relpath = path.replace(homePath, "");
			path = path.toLowerCase();
			// TODO: use getFileInfo() here for better handling and accuracy
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
				ASTRAL.spriter.activate(path);
			}
			else if (path.includes("prefab")) {

			}
		}
	}

///////////////////////////////////////
//
//	SCENE PANEL
//
///////////////////////////////////////

///////////////////////////////////////
//
//	INSPECTOR PANEL
//
///////////////////////////////////////

	function refreshInspectorPanel(obj) {
		// this populates the INSPECTOR with the given object's properties
		if (obj) {
			noSelectionSection.style.display = "none";
			inspectorSection.style.display = "block";
			// populate some basic props
			if (document.activeElement != inspectoritem) inspectoritem.innerHTML = obj.name;
			if (document.activeElement != posx) posx.innerHTML = obj.x;
			if (document.activeElement != posy) posy.innerHTML = obj.y;
			if (!obj.scale) obj.scale = 1;
			if (document.activeElement != scale) scale.innerHTML = obj.scale;
			if (!obj.rot) obj.rot = 0;
			if (document.activeElement != rot) rot.innerHTML = obj.rot;
		}
		else {
			noSelectionSection.style.display = "block";
			inspectorSection.style.display = "none";
			inspectoritem.innerHTML = "";
			posx.innerHTML = "";
			posy.innerHTML = "";
			rot.innerHTML = "";
			scale.innerHTML = "";
		}
	}

	function populateInspectorPanel(obj) {
		// this populates the INSPECTOR with the given object's properties
		if (obj) {
			noSelectionSection.style.display = "none";
			inspectorSection.style.display = "block";
			
			// set a global to track the object being inspected
			inspectedObject = obj;

			// since the inspector reuses some controls, we need to rebind their listeners
			// TODO: do we really need to do this??
			// TODO: or we can add these props here too, so that we can show an empty inspector until it gets
			//	populated
			inspectoritem.removeEventListener("blur", nameChange);
			inspectoritem.addEventListener("blur", nameChange);
			inspectoritem.focus();

			posx.removeEventListener("input", posChange);
			posx.addEventListener("input", posChange);
			posx.removeEventListener("blur", posChange);
			posx.addEventListener("blur", posChange);
			//posx.focus();
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
			posx.innerHTML = obj.x;
			posy.innerHTML = obj.y;
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
			if (obj.components.length > 0) {
				componentsPlaceholder.style.display = "none";
				for (var i = 0; i < obj.components.length; i++) {
					var component = obj.components[i];
					ctlComponent(component, obj);
				}
			}
			else {
				componentsPlaceholder.style.display = "block";
			}
		}
		else {
			// TODO: show notice and hide props
			noSelectionSection.style.display = "block";
			inspectorSection.style.display = "none";

			inspectoritem.innerHTML = "";
			posx.innerHTML = "";
			posy.innerHTML = "";
			rot.innerHTML = "";
			scale.innerHTML = "";
		}

		// visual feedback
		flashDomElement(inspectorPanel);
	}

	function titleDrop(e) {
		var path = e.dataTransfer.getData("text").replace("../client/", "");
		addComponentToGameObject(inspectedObject, path);
	}

	function addComponentToGameObject(obj, path) {
		console.log("adding " + path + " to gameobject " + obj.name);
		
		// adds an instance of a component.js to a gameobject
		var fi = ASTRAL.getFileInfo(path);
		var componentDiv;
		//var componentBase = ASTRAL.components[fi.nameNoExt];
		var componentBase = ASTRAL.components[fi.ext];
		var component; // the instance

		// check if componentBase is set which will tell us if the component is a .js file or img
		if (componentBase) {
			// the component js file is already loaded, create an instance for the object to use
			if (componentBase.instance) {
				component = componentBase.instance();
				if (fi.ext == "atlas") {
					ASTRAL.loadJson(path, function(strdata) {
						var data = JSON.parse(strdata);
						component.path = data.image;
						component.runtime.frames = data.frames;
						component.runtime.framesets = data.framesets;
						component.frameset = Object.keys(data.framesets)[0];
					});
				}
			}
			else {
				console.log("WARNING: componentBase had no instance method, therefore the component is void");
			}
		}
		else {
			// component not loaded/registered, this currently only happens if an image file 
			//	was dropped, so we create the component dynamically instead of from file
			if (fi.type == "image") {
				ASTRAL.loadImage(path, function(img) {
					obj.baseWidth = img.width;
					obj.baseHeight = img.height;
					obj.width = obj.baseWidth * obj.scale;
					obj.height = obj.baseHeight * obj.scale;
				});
				var component = {};
				component.type = "image";
				component.path = path;
			}
		}

		obj.components.push(component);
		componentDiv = ctlComponent(component, obj);
		console.log("added '" + fi.nameNoExt + "' component to gameobject '" + obj.name + "'");
		flashDomElement(componentDiv);
	}

	function removeComponent() {

	}

	function refreshInspector() {
		// TODO: this forcefully refreshes and flashes the whole panel, it should take a diff and only
		//	refresh changed fields, then `fire a flash on the changed fields only
		populateInspectorPanel(inspectedObject);
	}

	function getObjectNode(obj) {
		var node = document.getElementById("objid" + obj.id);
		return node;
	}

	function nameChange() {
		inspectedObject.name = inspectoritem.innerHTML;
		getObjectNode(inspectedObject).innerHTML = inspectedObject.name;
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
		// TODO: not sure what this was for...its interfering with color hex codes tho
		// if (value.toString().indexOf("#") != -1) {
		// 	el.innerHTML = "";
		// }
		// else {
		// 	el.innerHTML = value;
		// }
		el.innerHTML = value;
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
		else if (type.indexOf("toggle") != -1) {
			el.addEventListener("click", function() {
				if (this.classList.contains("on")) {
					this.classList.remove("on");
				}
				else {
					this.classList.add("on");
				}
			});
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
				});
			}
			panelDiv.appendChild(titleDiv);
		}
		document.getElementById(sidebarId).appendChild(panelDiv);
		return panelDiv;
	}

	function ctlText(text, panel) {
		var textDiv = document.createElement("DIV");
		textDiv.className = "text";
		panel.appendChild(textDiv);
		return textDiv;
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

	function ctlComponent(component, obj) {
		// create the wrapper div and label
		var componentDiv = document.createElement("DIV");
		componentDiv.className = "componentDiv";
		inspectorSection.appendChild(componentDiv);

		// var btnShowHideComponent = document.createElement("DIV");
		// btnShowHideComponent.className = "componentButton component button icon expanded";
		// btnShowHideComponent.style.cssFloat = "left";
		// componentDiv.appendChild(btnShowHideComponent);

		var btnRemoveComponent = document.createElement("DIV");
		btnRemoveComponent.className = "componentButton component button icon remove";
		componentDiv.appendChild(btnRemoveComponent);

		// var componentButton = document.createElement("DIV");
		// componentButton.className = "componentButton component button icon menu";
		// componentDiv.appendChild(componentButton);

		var btnMoveComponentDown = document.createElement("DIV");
		btnMoveComponentDown.className = "componentButton component button icon movedown";
		componentDiv.appendChild(btnMoveComponentDown);

		var btnMoveComponentUp = document.createElement("DIV");
		btnMoveComponentUp.className = "componentButton component button icon moveup";
		componentDiv.appendChild(btnMoveComponentUp);

		var componentLabel = document.createElement("DIV");
		componentLabel.innerHTML = component.type; // + " component";
		componentLabel.className = "componentLabel collapsed";
		componentDiv.appendChild(componentLabel);

		var componentSection = document.createElement("DIV");
		componentSection.className = "componentSection";
		componentSection.style.display = "none";
		componentDiv.appendChild(componentSection);

		componentLabel.onclick = function() {
			if (componentLabel.className.includes("expanded")) {
				componentLabel.classList.remove("expanded");
				componentLabel.classList.add("collapsed");
				componentSection.style.display = "none";
			}
			else {
				componentLabel.classList.remove("collapsed");
				componentLabel.classList.add("expanded");
				componentSection.style.display = "block";
			}
		}

		btnRemoveComponent.onclick = function() {
			// remove the component from the object
			var index = obj.components.indexOf(component);
			if (index > -1) obj.components.splice(index, 1);
			// remove the component from the inspector panel
			var overlay = document.createElement("DIV");
			overlay.className = "overlay";
			overlay.style.backgroundColor = "#ff0000";
			componentDiv.appendChild(overlay);
			componentDiv.classList.add("fadeout");
			setTimeout(function() {
				componentDiv.remove();
			}, 800);
		}

		// create a control for each prop
		Object.keys(component).forEach(function(key,index) {
			//console.log(key, index);
			if (key != "type" && key != "runtime") {
				if (key == "path") {
					var thing = ctl("button filetarget", key, component[key], null, componentSection, null);
					thing.addEventListener("drop", function(e) {
						var path = e.dataTransfer.getData("text").replace("../client/", "");
						component[key] = path;
						thing.innerHTML = path;
						ASTRAL.loadImage(path);
					});
				}
				else {
					var thing = ctl("input", key, component[key], null, componentSection, null);
					thing.addEventListener("input", function() {
						component[key] = this.innerHTML;
					});
					thing.addEventListener("blur", function() {
						component[key] = this.innerHTML;
					});
					thing.addEventListener("mousewheel", function() {
						event.preventDefault();
						if (event.deltaY > 0) {
							thing.innerHTML = parseInt(thing.innerHTML) - 1;
						}
						else if (event.deltaY < 0) {
							thing.innerHTML = parseInt(thing.innerHTML) + 1;
						}
						thing.dispatchEvent(new Event('input'));
					});
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

		// TODO: fix tight coupling (see note in Docs)...but considering spriter is always coupled this might be fine
		console.log("editor.js toggle()");
		if (editorDiv.style.visibility == "hidden") {
			document.querySelectorAll(".sidebar").forEach(function(el) {
				el.style.display = "block";
			});
			ASTRAL.setPanelLayout([], [], ["scenePanel", "inspectorPanel"], ["toolsPanel", "diagnosticsPanel", "displayPanel", "projectPanel"]);
			editorDiv.style.visibility = "visible";
			enabled = true;
			//getDir("../client/assets");
		}
		else {
			document.querySelectorAll(".sidebar").forEach(function(el) {
				el.style.display = "none";
			});
			editorDiv.style.visibility = "hidden";
			spriterDiv.style.visibility = "hidden"; // TODO: fix tight coupling (see note in Docs)...gets an error if spriter module not loaded
			enabled = false;
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
		//var panel = event.fromElement;
		//var panelPos = event.fromElement.getBoundingClientRect();
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

	return {
		init: init,
		toggle: toggle,
		ctlPanel: ctlPanel,
		ctlSection: ctlSection,
		showToolTip:showToolTip,
		hideToolTip:hideToolTip,
		set enabled(val) {
			enabled = val;
		},
		get enabled() {
			return enabled;
		},
		get inspectedObject() {
			return inspectedObject;
		},
		get drawObjectName() {
			return drawObjectName;
		},
		get drawObjectId() {
			return drawObjectId;
		},
		get drawObjectPos() {
			return drawObjectPos;
		},
		get drawObjectRot() {
			return drawObjectRot;
		},
		get drawObjectSize() {
			return drawObjectSize;
		},
		get drawObjectOrigin() {
			return drawObjectOrigin;
		},
		get drawObjectBorders() {
			return drawObjectBorders;
		},
		get drawParticleCount() {
			return drawParticleCount;
		}
	}
}());
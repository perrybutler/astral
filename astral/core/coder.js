"use strict";
console.log("spriter.js entry point");

ASTRAL.spriter = (function() {

	console.log("spriter.js constructor");

///////////////////////////////////////
//
//	PRIVATE LOCAL VARS
//
///////////////////////////////////////

	var enabled = false;

	// the image we'll be working on
	var img;
	var imgLoading = false;

	// the data that will get saved
	var openFile = "";
	var atlasData = {};
	atlasData.frames = {};
	atlasData.framesets = {};

	// basic props
	var zoom = 1;
	// var gridx = 32;
	// var gridy = 32;
	var snapToGrid = true;
	//var mode = "";
	var selecting = false;
	var framesetCount = 0;
	
	// animation preview stuff
	var animationTimer;
	var fid = 0;

	// panels, canvas, layers
	var padding = 32; // padding around canvas to assist with selecting
	var spriterLayer;
	var spriterDiv;
	var sidePanel;
	var atlasPanel;
	var atlasSection;
	var propsPanel;
	var controlsPanel;
	var previewPanel;
	var previewCanvas;
	var spriterToolsPanel;
	var framesSection;
	var framesetsSection;

	// input boxes
	//var nameInput;
	var rowsInput;
	var colsInput;
	var selectedAreaInput;

	// frameset selection stuff
	var rect = {};
	var selectedArea = {};
	var selectedId;
	var selectedFrame;
	var selectedFrameset;
	var selectedNode;

///////////////////////////////////////
//
//	STARTUP SHUTDOWN
//
///////////////////////////////////////

	function init() {
		console.log("spriter.js init()");

		// create a layer for the sprite tool
		spriterLayer = ASTRAL.createLayer("spriter", 3, draw);
		spriterDiv = document.getElementById("spriterDiv");
		spriterDiv.style.overflow = "auto";
		spriterDiv.style.visibility = "hidden";

		// create the drag-drop indicator zone
		var dropPanel = document.createElement("DIV");
		dropPanel.innerHTML = "<div class='droplabel'>DROP HERE</div>";
		dropPanel.className = "droppanel";
		spriterDiv.appendChild(dropPanel);

		// create the tools panel
		// TODO: this hard couple (ASTRAL.editor.ctlPanel) can fail if spriter.js manages to load first
		spriterToolsPanel = ASTRAL.editor.ctlPanel("tools", "spriterToolsPanel", "", "sidebar4");
		var spriterToolsSection = ASTRAL.editor.ctlSection("", "", "", spriterToolsPanel);
		var openImageButton = ctl("button", null, "open image", null, spriterToolsSection, openImage);
		var openDataButton = ctl("button", null, "open data", null, spriterToolsSection, openData);
		var gridInputX = ctl("input pair", "grid", "16", "gridx", spriterToolsSection, setGrid);
		var gridInputY = ctl("input pair", null, "16", "gridy", spriterToolsSection, setGrid);
		var zoomButton = ctl("button pill", "zoom", "1x", null, spriterToolsSection, function() {setZoom(0)});
		var zoomButton = ctl("button pill", null, "2x", null, spriterToolsSection, function() {setZoom(1)});
		var zoomButton = ctl("button pill", null, "3x", null, spriterToolsSection, function() {setZoom(2)});
		var zoomButton = ctl("button pill", null, "4x", null, spriterToolsSection, function() {setZoom(3)});
		var bgButton = ctl("button pill bgaqua", "background", "-", null, spriterToolsSection, function() {setBackground("#00FFFF")});
		var bgButton = ctl("button pill bgfuchsia", null, "-", null, spriterToolsSection, function() {setBackground("#FF00FF")});
		var bgButton = ctl("button pill bggray", null, "-", null, spriterToolsSection, function() {setBackground("#808080")});
		var bgButton = ctl("button pill bgblack", null, "-", null, spriterToolsSection, function() {setBackground("#000")});
		var bgButton = ctl("button pill bgwhite", null, "-", null, spriterToolsSection, function() {setBackground("#FFF")});

		// create the atlas panel
		atlasPanel = ASTRAL.editor.ctlPanel("atlas", "atlasPanel", "", "sidebar4");
		atlasSection = ASTRAL.editor.ctlSection("", "", "", atlasPanel);
		var newButton = ctl("button icon fileadd", null, "", "atlasPanelNewButton", atlasSection, function() {newAtlas();});
		newButton.dataset.tip = "Create a new empty atlas.";
		var saveButton = ctl("button icon diskette", null, "", null, atlasSection, saveAtlas);
		saveButton.dataset.tip = "Save changes to the current atlas file.";
		var viewButton = ctl("button icon openexternal", null, "", null, atlasSection, viewAtlasData);
		viewButton.dataset.tip = "View the atlas data in a new tab.";
		var downloadButton = ctl("button icon download", null, "", null, atlasSection, downloadAtlas);
		downloadButton.dataset.tip = "Download the atlas data to disk.";
		// frames section
		var thing = ctl("button icon remove", "frames", "", null, atlasSection, function() {});
		thing.dataset.tip = "Delete selected frame from this atlas.";
		framesSection = document.createElement("DIV");
		atlasSection.appendChild(framesSection);
		// framesets section
		var thing = ctl("button icon add", "framesets", "", null, atlasSection, function() {createFrameset();});
		thing.dataset.tip = "Create a new empty frameset in this atlas.";
		var thing = ctl("button icon remove", null, "", null, atlasSection, function() {deleteFrameset();});
		thing.dataset.tip = "Delete selected frameset from this atlas.";
		framesetsSection = document.createElement("DIV");
		atlasSection.appendChild(framesetsSection);
		// TODO: the datasets are correct on div elements, but tooltips wont appear

		// create the selection panel
		propsPanel = ASTRAL.editor.ctlPanel("selected area", "propsPanel", "", "sidebar4");
		var propsSection = ASTRAL.editor.ctlSection("", "", "", propsPanel);
		// var framesetLabel = document.createElement("DIV");
		// framesetLabel.className = "label";
		// framesetLabel.innerHTML = "selected area";
		// propsSection.appendChild(framesetLabel);
		selectedAreaInput = document.createElement("DIV");
		selectedAreaInput.innerHTML = "none";
		selectedAreaInput.className = "input";
		selectedAreaInput.style.color = "#999";
		selectedAreaInput.id = "props-frameset";
		propsSection.appendChild(selectedAreaInput);
		colsInput = ctl("input", "sliceX", "1", "props-cols", propsSection, null);
		rowsInput = ctl("input", "sliceY", "1", "props-rows", propsSection, null);
		var moveleftButton = ctl("button icon moveleft", "adjust", "", null, propsSection, function() {moveSelection(-1, 0)});
		var moverightButton = ctl("button icon moveright", null, "", null, propsSection, function() {moveSelection(1, 0)});
		var shrinkleftButton = ctl("button icon shrinkleft", null, "", null, propsSection, function() {resizeSelection(-1, 0, 0, 0)});
		var shrinkrightButton = ctl("button icon shrinkright", null, "", null, propsSection, function() {resizeSelection(0, 0, -1, 0)});
		var growleftButton = ctl("button icon growleft", null, "", null, propsSection, function() {resizeSelection(1, 0, 0, 0)});
		var growrightButton = ctl("button icon growright", null, "", null, propsSection, function() {resizeSelection(0, 0, 1, 0)});
		propsSection.appendChild(document.createElement("BR"));
		var moveupButton = ctl("button icon moveup", null, "", null, propsSection, function() {moveSelection(0, -1)});
		var movedownButton = ctl("button icon movedown", null, "", null, propsSection, function() {moveSelection(0, 1)});
		var shrinktopButton = ctl("button icon shrinktop", null, "", null, propsSection, function() {resizeSelection(0, -1, 0, 0)});
		var shrinkbottomButton = ctl("button icon shrinkbottom", null, "", null, propsSection, function() {resizeSelection(0, 0, 0, -1)});
		var growtopButton = ctl("button icon growtop", null, "", null, propsSection, function() {resizeSelection(0, 1, 0, 0)});
		var growbottomButton = ctl("button icon growbottom", null, "", null, propsSection, function() {resizeSelection(0, 0, 0, 1)});
		//nameInput = ctl("input", "name", "new", "props-name", propsSection, null);
		var btnAddFrames = ctl("button", "function", "add as frames", null, propsSection, function() {addFrames();});
		btnAddFrames.dataset.tip = "Add the selected area as frames to the atlas.";
		var btnAddFrameset = ctl("button", null, "add as frameset", null, propsSection, function() {addFrameset();});
		btnAddFrameset.dataset.tip = "Add the selected area as frames, and add a frameset which uses these frames.";
		var btnAddToFrameset = ctl("button", null, "add to current frameset", null, propsSection, function() {addToFrameset();});
		btnAddToFrameset.dataset.tip = "Add the selected area as frames to the currently selected frameset.";

		// create the preview panel
		previewPanel = ASTRAL.editor.ctlPanel("preview", "previewPanel", "", "sidebar4");
		var previewSection = ASTRAL.editor.ctlSection("", "", "", previewPanel);
		previewCanvas = document.createElement("CANVAS");
		previewCanvas.id = "previewCanvas";
		previewCanvas.width = 128;
		previewCanvas.height = 128;
		previewSection.appendChild(previewCanvas);
		var thing = ctl("dropdown", "show what", "selected area,selected frame,selected frameset", "previewwhat", previewSection, null);
		var speedButton = ctl("button pill", "speed", "1x", null, previewSection, function() {setSpeed(1)});
		var speedButton = ctl("button pill", null, "2x", null, previewSection, function() {setSpeed(2)});
		var speedButton = ctl("button pill", null, "3x", null, previewSection, function() {setSpeed(3)});
		var speedButton = ctl("button pill", null, "4x", null, previewSection, function() {setSpeed(4)});
		var speedButton = ctl("button pill", null, "8x", null, previewSection, function() {setSpeed(8)});
		spriterLayer.can.style.width = "auto";
		spriterLayer.can.style.height = "auto";
		spriterLayer.can.style.border = padding + "px solid";

		// event handlers
		spriterLayer.can.addEventListener("mousedown", function(e) {
			//console.log("mousedown " + e.button + " in spriter layer");
			startSelect(e.offsetX, e.offsetY);
		});

		spriterLayer.can.addEventListener("mousemove", function(e) {
			//console.log("mousemove in spriter layer");
			if (selecting) adjustSelect(e.offsetX, e.offsetY);
		});

		spriterLayer.can.addEventListener("mouseup", function(e) {
			//console.log("mouseup " + e.button + " in spriter layer");
			endSelect();
		});

		spriterDiv.addEventListener("dragover", function(e) {
			e.preventDefault();
			this.setAttribute("class", "dragover");
		}, false);

		spriterDiv.addEventListener("dragleave", function(e) {
			e.preventDefault();
			this.removeAttribute("class");
		}, false);

		spriterDiv.addEventListener("drop", function(e) {
			e.preventDefault();
			var files = e.dataTransfer.files;
			var file = files[0];
			//var reader = new FileReader();
			this.removeAttribute("class");
			setImage(file.name);
		});

		// start the animation preview at normal speed
		setSpeed(1);
	}

	function activate(filename) {
		// shows the spriter tool and loads an image or atlas too
		console.log("activating spriter for " + filename);
		spriterDiv.style.visibility = "visible";
		enabled = true;
		clearAtlas();
		rect = {};
		selectedArea = {};

		var fi = ASTRAL.getFileInfo(filename);
		if (fi.ext == "atlas") {
			// if its an atlas, load it and the image too
			ASTRAL.loadJson(filename, function(strdata) {
				var data = JSON.parse(strdata);
				// load the atlas image
				if (data.image) {
					console.log("ATLASIMAGE", data.image);
					ASTRAL.loadImage(data.image, function() {
						// set the current image
						img = ASTRAL.images[data.image];
						spriterLayer.can.width = img.width;
						spriterLayer.can.height = img.height;
					});
				}
				// TODO: the following should probably be inside the ASTRAL.loadImage callback above
				// load the atlas frames/framesets
				atlasData.frames = data.frames;
				atlasData.framesets = data.framesets;
				for (var key in data.frames) {
					var frame = data.frames[key];
					addFrameNode(key);
				}
				for (var key in data.framesets) {
					var frameset = data.framesets[key];
					addFramesetNode(key);	
				}
				// set the currentFile used by the save button
				openFile = filename;
			});
		}
		else if (fi.type == "image") {
			// if its an image load it
			ASTRAL.loadImage(filename, function() {
				// set the current image
				img = ASTRAL.images[filename];
				spriterLayer.can.width = img.width;
				spriterLayer.can.height = img.height;
			});
		}
		else {
			// unsupported type
		}

		ASTRAL.setPanelLayout([], [], ["atlasPanel", "propsPanel"], ["previewPanel", "spriterToolsPanel", "projectPanel"]);
	}

	function deactivate() {
		spriterDiv.style.visibility = "hidden";
		enabled = false;
	}

	function setImage(filename) {
		atlasData = [];
		var btns = document.querySelectorAll(".button.frameset");
		btns.forEach(function(btn) {
			btn.remove();
		});

		var can = spriterCanvas; // TODO: this is implicitly referring to the dom element id...might need to enable option strict
		var ctx = can.getContext("2d");
		ctx.clearRect(0, 0, can.width, can.height);
		imgLoading = true; // TODO: document why we need this...
		ASTRAL.loadImage(filename, function() {
			// load completed, grab a ref to the image and set the canvas size to the image size
			img = ASTRAL.images[filename];
			can.width = img.width;
			can.height = img.height;
			imgLoading = false;
		});
	}

///////////////////////////////////////
//
//	ATLAS PANEL
//
///////////////////////////////////////

	function newAtlas() {
		clearAtlas();
	}

	function clearAtlas() {
		openFile = "";
		atlasData.frames = {};
		atlasData.framesets = {};
		var frameNodes = document.querySelectorAll(".button.frame");
		frameNodes.forEach(function(el) {
			el.remove();
		});
		var framesetNodes = document.querySelectorAll(".button.frameset");
		framesetNodes.forEach(function(el) {
			el.remove();
		});
	}

	function addFrameNode(name) {
		// create a button for the frameset in the framesets list
		var node = document.createElement("DIV");
		node.className = "button pill frame";
		node.innerHTML = name;
		node.id = "frameid" + name;
		//node.onclick = function() {populateInspectorPanel(node.id);}
		node.onclick = function() {
			// selectedFrame = atlasData.frames[name];
			// selectedNode = node;
			// highlightNode(selectedNode);
			// //populateInspectorPanel();

			// single click to select frame and deselect everything else
			selectFrame(name);

			// ctrl click to toggle frame to selected frameset

		}
		framesSection.appendChild(node);
		// selectedNode = node;
		// highlightNode(selectedNode);
	}

	function addFramesetNode(name) {
		// create a button for the frameset in the framesets list
		var node = document.createElement("DIV");
		node.className = "button frameset";
		node.innerHTML = name;
		node.id = name;
		//node.onclick = function() {populateInspectorPanel(node.id);}
		node.onclick = function() {
			// selectedFrameset = atlasData.framesets[name];
			// selectedNode = node;
			// highlightNode(selectedNode);
			// //populateInspectorPanel();
			selectFrameset(node.id);
		}
		node.addEventListener("contextmenu", function(e) {
			e.preventDefault();
			ctxFrameset(node, e);
		});
		framesetsSection.appendChild(node);
		// selectedNode = node;
		// highlightNode(selectedNode);
		selectFrameset(name);
	}

	function selectFrame(name) {
		clearNodeSelection();
		previewwhat.value = "selected frame";
		selectedFrameset = null;
		selectedFrame = atlasData.frames[name];
		selectedNode = document.getElementById("frameid" + name);
		highlightNode(selectedNode);
	}

	function selectFrameset(name) {
		clearNodeSelection();
		previewwhat.value = "selected frameset";

		selectedFrameset = name; //atlasData.framesets[name];
		selectedNode = document.getElementById(name);
		highlightNode(selectedNode);

		var selectedFramesetValue = atlasData.framesets[selectedFrameset];
		var spl = selectedFramesetValue.split(",");
		spl.forEach(function(frameid) {
			var selectedFrameNode = document.getElementById("frameid" + frameid);
			highlightNode(selectedFrameNode);
		});
	}

	function clearNodeSelection() {
		var selectedNodes = document.querySelectorAll(".frame.selected, .frameset.selected");
		selectedNodes.forEach(function(node) {
			node.classList.remove("selected");
		});
	}

	function deleteFrameset() {
		//var el = document.getElementById(selectedId);
		var el = document.getElementById(selectedFrameset);
		if (el) {
			var prev = el.previousSibling;
			var next = el.nextSibling;
			el.remove();
			//atlasData.framesets.splice(selectedFrameset, 1);
			delete atlasData.framesets[selectedFrameset];
			if (next && next.className.indexOf("frameset") != -1) {
				populateInspectorPanel(next.id);
			}
			else if (prev && prev.className.indexOf("frameset") != -1) {
				populateInspectorPanel(prev.id);
			}
		}
	}

	function beginRenameFramesetNode(node, isNew) {
		var oldname = node.innerHTML;
		var oldframeset = atlasData.framesets[oldname];
		var oldonclick = node.onclick;
		node.onclick = null;
		node.draggable = false;
		node.setAttribute("contenteditable", true);
		node.focus();
		ASTRAL.setEndOfContenteditable(node);
		node.addEventListener("keydown", function(e) {
			if (e.which == 13) {
				e.preventDefault();
				node.blur();
			}
		});
		node.addEventListener("blur", function() {
			doneRenaming();
		});
		function doneRenaming() {
			var newname = node.innerHTML;
			node.onclick = oldonclick;
			node.draggable = true;
			node.id = newname;
			delete atlasData.framesets[oldname];
			atlasData.framesets[newname] = oldframeset;
			node.setAttribute("contenteditable", false);
			selectFrameset(newname);
			//selectFrameset(selectedFrameset);
		}
	}

	function ctxFrameset(node, e) {
		// if a menu is already open remove that one
		var menu = document.getElementById("contextmenu");
		if (menu) menu.remove();

		// create the context
		menu = document.createElement("DIV");
		menu.id = "contextmenu";
		menu.style.left = e.pageX;
		menu.style.top = e.pageY;

		var btn;

		// MAKE A COPY
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
			beginRenameFramesetNode(node, false);
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

		document.body.appendChild(menu);
	}


	// function loadAtlas(filename) {
	// 	ASTRAL.loadJson(filename, function() {
			
	// 	});
	// 	setImage();
	// }

///////////////////////////////////////
//
//  SELECTED AREA PANEL
//
///////////////////////////////////////

	function startSelect(offsetX, offsetY) {
		// fires on mousedown
		selecting = true; // we need to track this so that endSelect doesnt fire on every mouseup, only if we were selecting to begin with
		selectedAreaInput.innerHTML = "none";
		selectedArea = {};
		var ox = offsetX;// - padding;
		var oy = offsetY;// - padding;
		if (ox < 0) ox = 0;
		if (oy < 0) oy = 0;
		if (ox > img.width) ox = img.width;
		if (oy > img.height) oy = img.height;
		if (snapToGrid == true) {
			var gridx = parseInt(document.getElementById("gridx").innerHTML);
			var gridy = parseInt(document.getElementById("gridy").innerHTML);
			ox = parseInt(ox / gridx) * gridx;
			oy = parseInt(oy / gridy) * gridy;
		}
		rect.left = ox; //e.offsetX * (img.width / spriterDiv.offsetWidth);
		rect.top = oy; //e.offsetY * (img.height / spriterDiv.offsetHeight);
		rect.width = 0;
		rect.height = 0;
		// 0.5 offset explained here: https://stackoverflow.com/questions/23612000/why-is-my-strokestyle-transparent
	}

	function adjustSelect(offsetX, offsetY) {
		// fires on mousedown + mousemove (drag)
		selectedAreaInput.innerHTML = rect.left + ", " + rect.top + ", " + rect.width + ", " + rect.height;
		var ox = offsetX;// - padding;
		var oy = offsetY;// - padding;
		if (ox < 0) ox = 0;
		if (oy < 0) oy = 0;
		if (ox > img.width) ox = img.width;
		if (oy > img.height) oy = img.height;
		ox = ox - rect.left;
		oy = oy - rect.top;
		if (snapToGrid == true) {
			var gridx = parseInt(document.getElementById("gridx").innerHTML);
			var gridy = parseInt(document.getElementById("gridy").innerHTML);
			// ox = parseInt(ox / gridx) * gridx;
			// oy = parseInt(oy / gridy) * gridy;
			ox = gridx + parseInt(ox / gridx) * gridx;
			oy = gridy + parseInt(oy / gridy) * gridy;
		}
		rect.width = ox;// - padding; //e.offsetX * (img.width / spriterDiv.offsetWidth) - rect.left;
		rect.height = oy;// - padding; //e.offsetY * (img.height / spriterDiv.offsetHeight) - rect.top;
		// 0.5 offset explained here: https://stackoverflow.com/questions/23612000/why-is-my-strokestyle-transparent
	}

	function endSelect() {
		// fires on mouseup
		if (selecting == true) {
			selecting = false;
			selectedArea = JSON.parse(JSON.stringify(rect));
			rect = {};
			applySelectionToFrameset();
			previewwhat.value = "selected area";
		}
	}

	function createSelect(x, y, w, h) {
		// creates a selection, fires when clicking a frameset node
		selecting = true;
		rect.left = x;
		rect.top = y;
		rect.width = w;
		rect.height = h;
		endSelect();
	}

	function addFrames(callback) {
		// add selected area to atlas frames list
		var frames = getFrames();
		frames.forEach(function(frame) {
			addFrame(frame, callback);
		});
	}

	function getFrames() {
		// convert the selected area to an array of frames
		var frames = [];
		var sliceX = parseInt(colsInput.innerHTML);
		var sliceY = parseInt(rowsInput.innerHTML);
		var frameWidth = selectedArea.width / sliceX;
		var frameHeight = selectedArea.height / sliceY;
		for (var y = 0; y < sliceY; y++) {
			for (var x = 0; x < sliceX; x++) {
				var fx = selectedArea.left + x * frameWidth;
				var fy = selectedArea.top + y * frameHeight;
				var frame = fx + "," + fy + "," + frameWidth + "," + frameHeight;
				frames.push(frame);
			}
		}
		return frames;
	}

	function addFrame(frame, callback) {
		var frameid = getNextFrameId();
		atlasData.frames[frameid] = frame;
		addFrameNode(frameid);
		// fire the callback so frameset can obtain frameid's
		if (callback) callback(frameid);
	}

	function addFrameset() {
		// add the selected area as frames to the atlas, and create a frameset with those frames
		var name = uniqueFramesetName();
		var frames = ""
		addFrames(function(frameid) {
			if (frames != "") {
				frames += ",";
			}
			frames += frameid;
		});
		atlasData.framesets[name] = frames;
		addFramesetNode(name);
	}

	function addToFrameset() {
		// add the selected area as frames to the current frameset
		var frames = "";
		addFrames(function(frameid) {
			if (frames != "") {
				frames += ",";
			}
			frames += frameid;
		});
		atlasData.framesets[selectedFrameset] += "," + frames;
		selectFrameset(selectedFrameset);
	}

	function getNextFrameId() {
		var max = 0;
		for (var key in atlasData.frames) {
			var keyval = parseInt(key);
			if (keyval > max) max = keyval;
		}
		return max + 1;
	}

	function uniqueFramesetName() {
		var c = 1;
		var name = "frameset";
		do {
			name = "frameset" + c;
			c++;
		} while(atlasData.framesets[name]);
		return name;
	}

///////////////////////////////////////
//
//	TOOLS PANEL
//
///////////////////////////////////////

	function openImage() {
		// var inp = document.createElement("INPUT");
		// inp.type = "file";
		// inp.addEventListener("change", handleFiles, false);
		// inp.click();
	}

	function openData() {
		var inp = document.createElement("INPUT");
		inp.type = "file";
		inp.addEventListener("change", handleOpenData, false);
		inp.click();
	}

	function downloadAtlas() {
		ASTRAL.downloadData(atlasData, "myatlas.atlas");
	}

	function saveAtlas() {
		// make a call to the server and let the server save it to disk
		// hot reload the file on the client/server
		var json = ASTRAL.formatData(atlasData);
		console.log("save not implemented");
	}

	function viewAtlasData() {
		var json = atlasDataToJson();
	    ASTRAL.openJsonInNewTab(json);
	}

	function atlasDataToJson() {
		// var clone = ASTRAL.cloneObject(atlasData);
		// console.log("atlasDataToJson clone:", clone);
		// var json = JSON.stringify(clone, null, 2);
		// console.log("atlasDataToJson json:", json);
		var json = JSON.stringify(atlasData, null, 2);
		console.log("atlasDataToJson json:", json);
		return json;
	}

	function setGrid() {

	}

	function handleOpenData() {
		var file = this.files[0];
		var path = "assets/" + file.name;
		ASTRAL.loadJson(path, function(txt) {
			var framesets = JSON.parse(txt);
			for (var i = 0; i < framesets.length; i++) {
				var frameset = framesets[i];
				createFrameset(frameset);
			}
		});
	}

	function setZoom(val) {
		var layer = ASTRAL.layers["spriter"];
		var can = layer.can;
		var ctx = layer.ctx;
		var tran = 0; //1024 / 2 / 2 + 32 / 2 * val; // if zoom is 1 this should equal tran of 0px
		can.style.transform = "scale(" + (val + 1) + "," + (val + 1) + ") translate(" + tran + "px," + tran + "px)";
		zoom = val;
	}

	function setBackground(color) {
		var layer = ASTRAL.layers["spriter"];
		var can = layer.can;
		can.style.background = color;

		var can = previewCanvas;
		can.style.background = color;
	}

	function moveSelection(x, y) {
		selectedArea.left += x;
		selectedArea.top += y;
		applySelectionToFrameset();
	}

	function resizeSelection(left, top, right, bottom) {
		if (left != 0) {
			selectedArea.left -= left;
			selectedArea.width += left;
		}
		if (top != 0) {
			selectedArea.top -= top;
			selectedArea.height += top;
		}
		if (right != 0) {
			selectedArea.width += right;
		}
		if (bottom != 0) {
			selectedArea.height += bottom;
		}
		applySelectionToFrameset();
	}

///////////////////////////////////////
//
//	PREVIEW PANEL
//
///////////////////////////////////////

	function animate() {
		var cols = colsInput.innerHTML;
		if (cols > 0) {
			fid += 1;
			if (fid >= cols) {fid = 0;}
		}
		else {
			fid = 0;
		}
	}

	function setSpeed(val) {
		// setInterval(function() {animate();}, 300);
		clearInterval(animationTimer);
		animationTimer = setInterval(function() {animate();}, 200 / val);
	}





	function highlightNode(node) {
		// // set the selected class on the frameset button
		// var prevNode = document.querySelector(".button.frameset.selected");
		// if (prevNode) prevNode.className = prevNode.className.replace(" selected", "");
		// //var node = document.getElementById("framesetid" + id);
		// node.className += " selected";
		node.classList.add("selected");
	}

///////////////////////////////////////
//
//	PROPERTIES PANEL
//
///////////////////////////////////////

	function findFrameset(id) {
		var frameset;
		for (var i = 0; i < atlasData.length; i++) {
			frameset = atlasData[i];
			if (frameset.id == id) {
				return frameset;
			}
		}
	}

	// TODO: why dont we simply have a selectedFrameset?

	// function nameChange() {
	// 	var newName = nameInput.innerHTML;
	// 	selectedFrameset.name = newName;
	// 	selectedNode.innerHTML = newName;
	// }

	// function rowsChange() {
	// 	var newval = parseInt(rowsInput.innerHTML);
	// 	selectedFrameset.rows = newval;
	// }

	// function colsChange() {
	// 	var newval = parseInt(colsInput.innerHTML);
	// 	selectedFrameset.cols = newval;
	// }

	function applySelectionToFrameset() {
		// TODO: this has been replaced by function buttons...
		// // sets the props for the selectedFrameset using the selectedRect
		// if (selectedFrameset) {
		// 	selectedFrameset.x = selectedArea.left;
		// 	selectedFrameset.y = selectedArea.top;
		// 	selectedFrameset.width = selectedArea.width;
		// 	selectedFrameset.height = selectedArea.height;
		// }
		selectedAreaInput.innerHTML = selectedArea.left + ", " + selectedArea.top + ", " + selectedArea.width + ", " + selectedArea.height;
	}

///////////////////////////////////////
//
//	CORE
//
///////////////////////////////////////

	function loadSpriteSheet() {
		console.log("todo load sprite sheet");
	}

	var marchOffset = 0;

	function draw() {
		var layer = ASTRAL.layers["spriter"];
		var can = layer.can;
		var ctx = layer.ctx;
		//can = document.getElementById("spriterCanvas"); // ?? we already set this above
		ctx = can.getContext("2d");

		// clear the canvas
		ctx.clearRect(0, 0, can.width, can.height);

		if (imgLoading || !img) return;

		// draw the spritesheet
		//if (!imgLoading && img) {
		// draw the image
		ctx.drawImage(img, 0, 0);

		// draw the grid
		// var gridx = document.getElementById("gridx").innerHTML;
		// var gridy = document.getElementById("gridy").innerHTML;
		// if (!gridx) gridx = 0;
		// if (!gridy) gridy = 0;
		// if (parseInt(gridx) <= 0) {
		// 	gridx = 0;
		// }
		// if (parseInt(gridy) <= 0) {
		// 	gridy = 0;
		// }
		// if (gridx > 1 && gridy > 1) {
		// 	var gridcols = img.width / gridx;
		// 	var gridrows = img.height / gridy;
		// 	for (var x = 0; x < gridcols + 1; x++) {
		// 		ctx.beginPath();
		// 		ctx.strokeStyle = "#555";
		// 		ctx.moveTo(x * gridx + 0.5, 0);
		// 		ctx.lineTo(x * gridx + 0.5, img.height);
		// 		ctx.stroke();
		// 	}
		// 	for (var y = 0; y < gridrows + 1; y++) {
		// 		ctx.beginPath();
		// 		ctx.strokeStyle = "#555";
		// 		ctx.moveTo(0, y * gridy + 0.5);
		// 		ctx.lineTo(img.width, y * gridy + 0.5);
		// 		ctx.stroke();
		// 	}
		// }

		// ctx.save();

		// ctx.lineWidth = 1;

		// marchOffset+= 0.1;
		// if (marchOffset > 32) {
		//     marchOffset = 0;
		// }
		// ctx.setLineDash([4, 2]);
		// ctx.lineDashOffset = -marchOffset;

		// ctx.beginPath();
		// ctx.strokeStyle = "red";
		// ctx.rect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);
		// ctx.stroke();
		// ctx.closePath();

		// // draw the selectedArea rect
		// ctx.beginPath();
		// ctx.strokeStyle = "blue";
		// ctx.rect(selectedArea.left + 0.5, selectedArea.top + 0.5, selectedArea.width, selectedArea.height);
		// ctx.stroke();
		// ctx.closePath();

		// ctx.restore();

		// ctx.fillStyle = "rgba(255,0,0, 0.7)";
		// ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

		// ctx.fillStyle = "rgba(255,255,0, 0.7)";
		// ctx.fillRect(selectedArea.left, selectedArea.top, selectedArea.width, selectedArea.height);

		var color1;
		var color2;
		var color;

		ctx.fillStyle = "black";

		var c;
		var r;
		var cols = colsInput.innerHTML;
		var rows = rowsInput.innerHTML;
		var cellw = 0;
		var cellh = 0;

		// SELECTING AREA (RED)
		r = rect;
		color1 = "rgba(255,0,0, 0.7)";
		color2 = "rgba(220,0,0, 0.7)";
		cellw = r.width / cols;
		cellh = r.height / rows;
		for (var y = 0; y < rows; y++) {
			for (var x = 0; x < cols; x++) {
				ctx.fillStyle = color1;
				var l = r.left + x * cellw;
				var t = r.top + y * cellh;
				ctx.fillRect(l, t, cellw, cellh);
			}
		}

		// SELECTED AREA (RED)
		r = selectedArea;
		color1 = "rgba(255,0,0, 0.7)";
		color2 = "rgba(220,0,0, 0.7)";
		cellw = r.width / cols;
		cellh = r.height / rows;
		for (var y = 0; y < rows; y++) {
			for (var x = 0; x < cols; x++) {
				ctx.fillStyle = color1;
				var l = r.left + x * cellw;
				var t = r.top + y * cellh;
				ctx.fillRect(l, t, cellw, cellh);
			}
		}

		// SELECTED FRAMESET (YELLOW)
		color1 = "rgba(255,255,0, 0.7)";
		color2 = "rgba(220,220,0, 0.7)";
		if (selectedFrameset) {
			var spl = atlasData.framesets[selectedFrameset].split(",");
			for (var i = 0; i < spl.length; i++) {
				var frameid = spl[i];
				var frame = atlasData.frames[frameid];
				var coords = frame.split(",");
				ctx.fillStyle = color1;
				var l = coords[0];
				var t = coords[1];
				var w = coords[2];
				var h = coords[3];
				//console.log(l, t, w, h);
				//ctx.fillRect(l, t, cellw, cellh);
				//ctx.fillRect(l, t, r.width, r.height);
				ctx.fillRect(l, t, w, h);
			}
		}

		ctx.closePath();

		// show the selected frames in the PREVIEW panel
		var previewctx = previewCanvas.getContext("2d");
		previewctx.clearRect(0, 0, can.width, can.height);
		var fwidth = selectedArea.width / cols;
		var fheight = selectedArea.height / rows;
		previewctx.drawImage(img,
			selectedArea.left + fwidth * fid, selectedArea.top,
			fwidth,	fheight,
			0, 0,
			fwidth,	fheight
		);
	}

	function isEven(num) {
		return !(num & 1);
	}

	function isOdd(num) {
		return num & 1;
	}



	function populateInspectorPanel() {
		// populates the INSPECTOR panel with the selected frameset's props, occurs after user 
		//	clicks a frameset in the ATLAS panel
		var frameset = selectedFrameset;
		nameInput.innerHTML = frameset.name;
		rowsInput.innerHTML = frameset.rows;
		colsInput.innerHTML = frameset.cols;
		selectedAreaInput.innerHTML = frameset.x + ", " + frameset.y + ", " + frameset.width + ", " + frameset.height;
		createSelect(frameset.x, frameset.y, frameset.width, frameset.height);
		highlightNode(selectedNode);
	}

///////////////////////////////////////
//
//	UI BUILDERS
//
///////////////////////////////////////

	function ctl(type, label, value, id, parent, click) {
		// TODO: we have a more extensive version of this function in editor.js we should be using...

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

		el.onmouseover = function(event) {
			if (el.dataset && el.dataset.tip) {
				ASTRAL.editor.showToolTip(el.dataset.tip, event);
			}
		}
		el.onmouseleave = function(event) {
			ASTRAL.editor.hideToolTip();
		}

		if (type.indexOf("input") != -1) {
			el.contentEditable = true;
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
		if (label) {
			var lbl = document.createElement("DIV");
			lbl.className = "label";
			lbl.innerHTML = label;
			parent.appendChild(lbl);
		}
		parent.appendChild(el);
		return el;
	}

	return {
		init:init,
		activate:activate,
		zoom:zoom,
		set enabled(val) {
			enabled = val;
		},
		get enabled() {
			return enabled;
		},
	}
}());
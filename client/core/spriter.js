"use strict";
console.log("spriter.js entry point");

ASTRAL.spriter = (function() {

	console.log("editor.js constructor");

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
	var atlasData = [];

	// basic props
	var zoom = 1;
	// var gridx = 32;
	// var gridy = 32;
	var snapToGrid = true;
	//var mode = "";
	var selecting = false;
	var regionCount = 0;
	
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

	// input boxes
	var nameInput;
	var rowsInput;
	var colsInput;
	var regionInput;

	// region selection stuff
	var rect = {};
	var selected = {};
	var selectedId;
	var selectedRegion;
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
		var saveButton = ctl("button icon diskette", null, "", null, spriterToolsSection, saveAtlas);
		saveButton.dataset.tip = "Save changes to the current atlas file.";
		var viewButton = ctl("button icon openexternal", null, "", null, spriterToolsSection, viewAtlasData);
		viewButton.dataset.tip = "View the atlas data in a new tab.";
		var downloadButton = ctl("button icon download", null, "", null, spriterToolsSection, downloadAtlas);
		downloadButton.dataset.tip = "Download the atlas data to disk.";
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
		var thing = ctl("button icon remove", "frames", "", null, atlasSection, function() {});
		thing.dataset.tip = "Delete selected frame from this atlas.";
		var thing = ctl("button icon add", "framesets", "", null, atlasSection, function() {createRegion();});
		thing.dataset.tip = "Create a new empty frameset in this atlas.";
		var thing = ctl("button icon remove", null, "", null, atlasSection, function() {deleteAnimation();});
		thing.dataset.tip = "Delete selected frameset from this atlas.";
		// TODO: the datasets are correct on div elements, but tooltips wont appear

		// create the selection panel
		propsPanel = ASTRAL.editor.ctlPanel("selection", "propsPanel", "", "sidebar4");
		var propsSection = ASTRAL.editor.ctlSection("", "", "", propsPanel);
		var moveleftButton = ctl("button icon moveleft", "adjust", "", null, propsSection, function() {moveSelection(-1, 0)});
		var moverightButton = ctl("button icon moveright", null, "", null, propsSection, function() {moveSelection(1, 0)});
		var moveupButton = ctl("button icon moveup", null, "", null, propsSection, function() {moveSelection(0, -1)});
		var movedownButton = ctl("button icon movedown", null, "", null, propsSection, function() {moveSelection(0, 1)});
		var shrinkleftButton = ctl("button icon shrinkleft", null, "", null, propsSection, function() {resizeSelection(-1, 0, 0, 0)});
		var shrinkrightButton = ctl("button icon shrinkright", null, "", null, propsSection, function() {resizeSelection(0, 0, -1, 0)});
		var shrinktopButton = ctl("button icon shrinktop", null, "", null, propsSection, function() {resizeSelection(0, -1, 0, 0)});
		var shrinkbottomButton = ctl("button icon shrinkbottom", null, "", null, propsSection, function() {resizeSelection(0, 0, 0, -1)});
		var growleftButton = ctl("button icon growleft", null, "", null, propsSection, function() {resizeSelection(1, 0, 0, 0)});
		var growrightButton = ctl("button icon growright", null, "", null, propsSection, function() {resizeSelection(0, 0, 1, 0)});
		var growtopButton = ctl("button icon growtop", null, "", null, propsSection, function() {resizeSelection(0, 1, 0, 0)});
		var growbottomButton = ctl("button icon growbottom", null, "", null, propsSection, function() {resizeSelection(0, 0, 0, 1)});
		nameInput = ctl("input", "name", "new", "props-name", propsSection, null);
		colsInput = ctl("input", "sliceX", "1", "props-cols", propsSection, null);
		rowsInput = ctl("input", "sliceY", "1", "props-rows", propsSection, null);
		var regionLabel = document.createElement("DIV");
		regionLabel.className = "label";
		regionLabel.innerHTML = "region";
		propsSection.appendChild(regionLabel);
		regionInput = document.createElement("DIV");
		regionInput.innerHTML = "selecting...";
		regionInput.className = "input";
		regionInput.style.color = "#999";
		regionInput.id = "props-region";
		propsSection.appendChild(regionInput);
		var btnAddFrames = ctl("button", "add selection", "as new frames", null, propsSection, function() {});
		var btnAddFrameset = ctl("button", null, "as new frameset", null, propsSection, function() {});
		var btnAddToFrameset = ctl("button", null, "to current frameset", null, propsSection, function() {});

		// create the preview panel
		previewPanel = ASTRAL.editor.ctlPanel("preview", "previewPanel", "", "sidebar4");
		var previewSection = ASTRAL.editor.ctlSection("", "", "", previewPanel);
		previewCanvas = document.createElement("CANVAS");
		previewCanvas.id = "previewCanvas";
		previewCanvas.width = 128;
		previewCanvas.height = 128;
		previewSection.appendChild(previewCanvas);
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
			adjustSelect(e.offsetX, e.offsetY);
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
		console.log("activating spriter for " + filename);
		spriterDiv.style.visibility = "visible";
		enabled = true;
		ASTRAL.loadImage(filename, function() {
			// set the current image
			img = ASTRAL.images[filename];
			spriterLayer.can.width = img.width;
			spriterLayer.can.height = img.height;
		});
		ASTRAL.setPanelLayout([], [], ["previewPanel", "atlasPanel", "propsPanel"], ["spriterToolsPanel", "projectPanel"]);
	}

	function deactivate() {
		spriterDiv.style.visibility = "hidden";
		isenabled = false;
	}

	function setImage(filename) {
		atlasData = [];
		var btns = document.querySelectorAll(".button.region");
		btns.forEach(function(btn) {
			btn.remove();
		});

		var can = spriterCanvas; // TODO: this is implicitly referring to the dom element id...might need to enable option strict
		var ctx = can.getContext("2d");
		ctx.clearRect(0, 0, can.width, can.height);
		imgLoading = true;
		ASTRAL.loadImage(filename, function() {
			img = ASTRAL.images[filename];
			can.width = img.width;
			can.height = img.height;
			imgLoading = false;
		});
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
		var clone = ASTRAL.cloneObject(atlasData);
		console.log("atlasDataToJson clone:", clone);
		var json = JSON.stringify(clone, null, 2);
		console.log("atlasDataToJson json:", json);
		return json;
	}

	function setGrid() {

	}

	function handleOpenData() {
		var file = this.files[0];
		var path = "assets/" + file.name;
		ASTRAL.loadJson(path, function(txt) {
			var regions = JSON.parse(txt);
			for (var i = 0; i < regions.length; i++) {
				var region = regions[i];
				createRegion(region);
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
		selected.left += x;
		selected.top += y;
		applySelectionToRegion();
	}

	function resizeSelection(left, top, right, bottom) {
		if (left != 0) {
			selected.left -= left;
			selected.width += left;
		}
		if (top != 0) {
			selected.top -= top;
			selected.height += top;
		}
		if (right != 0) {
			selected.width += right;
		}
		if (bottom != 0) {
			selected.height += bottom;
		}
		applySelectionToRegion();
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

///////////////////////////////////////
//
//	ATLAS PANEL
//
///////////////////////////////////////

	function createRegion(region) {
		// reset the selected region to null
		selected = {};

		//regionCount += 1;
		//selectedId = regionCount - 1;

		// generate a new id for this region
		var newid = performance.now(); //Date.parse(new Date().toUTCString());

		selectedId = newid;

		if (!region) {
			region = {};
			region.id = newid;
			region.name = "region";
			region.rows = 1;
			region.cols = 1;
			region.x = 0;
			region.y = 0;
			region.width = 0;
			region.height = 0;
		}

		selectedRegion = region;

		// create a button for the region in the regions list
		var node = document.createElement("DIV");
		node.className = "button region";
		node.innerHTML = region.name;
		node.id = "regionid" + newid;
		//node.onclick = function() {populateInspectorPanel(node.id);}
		node.onclick = function() {
			selectedRegion = region;
			selectedNode = node;
			highlightNode(selectedNode);
			populateInspectorPanel();
		}
		atlasSection.appendChild(node);
		
		selectedNode = node;
		highlightNode(selectedNode);

		// populate the name prop with the new region name and set events on it
		nameInput.innerHTML = region.name;
		nameInput.removeEventListener("blur", nameChange);
		nameInput.addEventListener("blur", nameChange);
		nameInput.focus();

		rowsInput.innerHTML = region.rows;
		rowsInput.removeEventListener("blur", rowsChange);
		rowsInput.addEventListener("blur", rowsChange);

		colsInput.innerHTML = region.cols;
		colsInput.removeEventListener("blur", colsChange);
		colsInput.addEventListener("blur", colsChange);

		regionInput.innerHTML = "0, 0, 0, 0";

		// store the region in an array
		atlasData.push(region);
	}

	function deleteAnimation() {
		var el = document.getElementById(selectedId);
		if (el) {
			var prev = el.previousSibling;
			var next = el.nextSibling;
			el.remove();
			atlasData.splice(selectedId, 1);
			if (next && next.className.indexOf("region") != -1) {
				populateInspectorPanel(next.id);
			}
			else if (prev && prev.className.indexOf("region") != -1) {
				populateInspectorPanel(prev.id);
			}
		}
	}

	function populateInspectorPanel() {
		// populates the INSPECTOR panel with the selected region's props, occurs after user 
		//	clicks a region in the ATLAS panel
		var region = selectedRegion;
		nameInput.innerHTML = region.name;
		rowsInput.innerHTML = region.rows;
		colsInput.innerHTML = region.cols;
		regionInput.innerHTML = region.x + ", " + region.y + ", " + region.width + ", " + region.height;
		createSelect(region.x, region.y, region.width, region.height);
		highlightNode(selectedNode);
	}

	function highlightNode(node) {
		// set the selected class on the region button
		var prevNode = document.querySelector(".button.region.selected");
		if (prevNode) prevNode.className = prevNode.className.replace(" selected", "");
		//var node = document.getElementById("regionid" + id);
		node.className += " selected";
	}

///////////////////////////////////////
//
//	PROPERTIES PANEL
//
///////////////////////////////////////

	function findRegion(id) {
		var region;
		for (var i = 0; i < atlasData.length; i++) {
			region = atlasData[i];
			if (region.id == id) {
				return region;
			}
		}
	}

	// TODO: why dont we simply have a selectedRegion?

	function nameChange() {
		var newName = nameInput.innerHTML;
		selectedRegion.name = newName;
		selectedNode.innerHTML = newName;
	}

	function rowsChange() {
		var newval = parseInt(rowsInput.innerHTML);
		selectedRegion.rows = newval;
	}

	function colsChange() {
		var newval = parseInt(colsInput.innerHTML);
		selectedRegion.cols = newval;
	}

	function applySelectionToRegion() {
		// sets the props for the selectedRegion using the selectedRect
		if (selectedRegion) {
			selectedRegion.x = selected.left;
			selectedRegion.y = selected.top;
			selectedRegion.width = selected.width;
			selectedRegion.height = selected.height;
			regionInput.innerHTML = (selected.left) + ", " + (selected.top) + ", " + selected.width + ", " + selected.height;
		}
	}

///////////////////////////////////////
//
//	CORE
//
///////////////////////////////////////

	function loadSpriteSheet() {
		console.log("todo load sprite sheet");
	}

	function startSelect(offsetX, offsetY) {
		// fires on mousedown
		selecting = true; // we need to track this so that endSelect doesnt fire on every mouseup, only if we were selecting to begin with
		regionInput.innerHTML = "selecting...";
		selected = {};
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
			ox = parseInt(ox / gridx) * gridx;
			oy = parseInt(oy / gridy) * gridy;
		}
		rect.width = ox;// - padding; //e.offsetX * (img.width / spriterDiv.offsetWidth) - rect.left;
		rect.height = oy;// - padding; //e.offsetY * (img.height / spriterDiv.offsetHeight) - rect.top;
		// 0.5 offset explained here: https://stackoverflow.com/questions/23612000/why-is-my-strokestyle-transparent
	}

	function endSelect() {
		// fires on mouseup
		if (selecting == true) {
			selecting = false;
			selected = JSON.parse(JSON.stringify(rect));
			rect = {};
			applySelectionToRegion();
		}
	}

	function createSelect(x, y, w, h) {
		// creates a selection, fires when clicking a region node
		selecting = true;
		rect.left = x;
		rect.top = y;
		rect.width = w;
		rect.height = h;
		endSelect();
	}

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
			var gridx = document.getElementById("gridx").innerHTML;
			var gridy = document.getElementById("gridy").innerHTML;
			if (!gridx) gridx = 0;
			if (!gridy) gridy = 0;
			if (parseInt(gridx) <= 0) {
				gridx = 0;
			}
			if (parseInt(gridy) <= 0) {
				gridy = 0;
			}
			if (gridx > 1 && gridy > 1) {
				var gridcols = img.width / gridx;
				var gridrows = img.height / gridy;
				for (var x = 1; x < gridcols; x++) {
					ctx.beginPath();
					ctx.strokeStyle = "#555";
					ctx.moveTo(x * gridx + 0.5, 0);
					ctx.lineTo(x * gridx + 0.5, img.height);
					ctx.stroke();
				}
				for (var y = 1; y < gridrows; y++) {
					ctx.beginPath();
					ctx.strokeStyle = "#555";
					ctx.moveTo(0, y * gridy + 0.5);
					ctx.lineTo(img.width, y * gridy + 0.5);
					ctx.stroke();
				}
			}
		//}

		// draw the selecting rect
		// var x, y, w, h;
		// x = parseInt(rect.left / snap) * snap;
		// y = parseInt(rect.top / snap) * snap;
		// w = parseInt(rect.width / snap) * snap;
		// h = parseInt(rect.height / snap) * snap;
		ctx.beginPath();
		ctx.strokeStyle = "red";
		ctx.rect(rect.left + 0.5, rect.top + 0.5, rect.width, rect.height);
		ctx.stroke();
		ctx.closePath();

		// draw the selected rect
		ctx.beginPath();
		ctx.strokeStyle = "blue";
		ctx.rect(selected.left + 0.5, selected.top + 0.5, selected.width, selected.height);
		ctx.stroke();
		ctx.closePath();

		// draw row divisions for selecting rect
		var rows = rowsInput.innerHTML;
		if (rows != "") {
			for (var i = 1; i < rows; i++) {
				ctx.beginPath();
				ctx.strokeStyle = "red";
				ctx.moveTo(rect.left + 0.5, rect.top + (rect.height / rows) * i);
				ctx.lineTo(rect.left + 0.5 + rect.width,rect.top + (rect.height / rows) * i);
				ctx.stroke();
			}
		}

		// draw col divisions for selecting rect
		var cols = colsInput.innerHTML;
		if (cols != "") {
			for (var i = 1; i < cols; i++) {
				ctx.beginPath();
				ctx.strokeStyle = "red";
				ctx.moveTo(rect.left + 0.5 + (rect.width / cols) * i, rect.top);
				ctx.lineTo(rect.left + 0.5 + (rect.width / cols) * i, rect.top + rect.height);
				ctx.stroke();
			}
		}

		// draw row divisions for selected rect
		var rows = rowsInput.innerHTML;
		if (rows != "") {
			for (var i = 1; i < rows; i++) {
				ctx.beginPath();
				ctx.strokeStyle = "blue";
				ctx.moveTo(selected.left + 0.5, selected.top + (selected.height / rows) * i);
				ctx.lineTo(selected.left + 0.5 + selected.width, selected.top + (selected.height / rows) * i);
				ctx.stroke();
			}
		}

		// draw col divisions for selected rect
		var cols = colsInput.innerHTML;
		if (cols != "") {
			for (var i = 1; i < cols; i++) {
				ctx.beginPath();
				ctx.strokeStyle = "blue";
				ctx.moveTo(selected.left + 0.5 + (selected.width / cols) * i, selected.top);
				ctx.lineTo(selected.left + 0.5 + (selected.width / cols) * i, selected.top + selected.height);
				ctx.stroke();
			}
		}

		ctx.closePath();

		ctx.font = "12px Courier";
		ctx.fillStyle = "white";
		ctx.fillText((rect.left) + ", " + (rect.top), rect.left, rect.top - 4);
		ctx.fillText((rect.left + rect.width) + ", " + (rect.top + rect.height), rect.left + rect.width + 2, rect.top + rect.height);
		ctx.fillText("w " + rect.width, rect.left + rect.width / 2, rect.top + 14);
		ctx.fillText("h " + rect.height, rect.left + 10, rect.top + rect.height / 2);

		// now draw the animation sim's current frame in the sim window
		var previewctx = previewCanvas.getContext("2d");
		previewctx.clearRect(0, 0, can.width, can.height);
		var fwidth = selected.width / cols;
		var fheight = selected.height / rows;
		previewctx.drawImage(img,
			selected.left + fwidth * fid, selected.top,
			fwidth,	fheight,
			0, 0,
			fwidth,	fheight
		);
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
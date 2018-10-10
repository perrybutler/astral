console.log("spriter.js entry point");

ASTRAL.spriter = new function() {
	var isenabled = false;

	// the image we'll be working on
	var img;
	var imgLoading = false;

	// the data that will get saved
	//var anims = [];
	var data = {};
	data.anims = [];

	// basic props
	var zoom = 1;
	// var gridx = 32;
	// var gridy = 32;
	var snapToGrid = true;
	//var mode = "";
	
	// animation preview stuff
	var animationTimer;
	var animCount = 0;
	var fid = 0;

	// panels, canvas, layers
	var padding = 32; // padding around canvas to assist with selecting
	var spriterLayer;
	var spriterDiv;
	var sidePanel;
	var animsPanel;
	var propsPanel;
	var controlsPanel;
	var previewPanel;
	var previewCanvas;

	// input boxes
	var nameInput;
	var rowsInput;
	var colsInput;
	var regionInput;

	// region selection stuff
	var rect = {};
	var selected = {};
	var selectedId;

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

		// create the sidebar
		sidePanel = document.createElement("DIV");
		sidePanel.className = "sidebar";
		spriterDiv.appendChild(sidePanel);

		// spriter controls
		var closeButton = document.createElement("DIV");
		closeButton.innerHTML = "&times;";
		closeButton.className = "mainControl";
		closeButton.onclick = function() {deactivate();}
		sidePanel.appendChild(closeButton);

		// create the tools panel
		toolsPanel = document.createElement("DIV");
		toolsPanel.className = "panel";
		sidePanel.appendChild(toolsPanel);
		var openImageButton = ctl("button", "file", "open image", null, toolsPanel, openImage);
		var openDataButton = ctl("button", null, "open data", null, toolsPanel, openData);
		var viewButton = ctl("button", "data", "view", null, toolsPanel, viewData);
		var downloadButton = ctl("button", null, "download", null, toolsPanel, downloadData);
		var saveButton = ctl("button", null, "save", null, toolsPanel, saveData);
		var gridInputX = ctl("input pair", "grid", "16", "gridx", toolsPanel, setGrid);
		var gridInputY = ctl("input pair", null, "16", "gridy", toolsPanel, setGrid);
		// var snapButton = ctl("button pill", "snap", "1", null, toolsPanel, function() {});
		// var snapButton = ctl("button pill", null, "4", null, toolsPanel, function() {});
		// var snapButton = ctl("button pill", null, "8", null, toolsPanel, function() {});
		// var snapButton = ctl("button pill", null, "16", null, toolsPanel, function() {});
		// var snapButton = ctl("button pill", null, "32", null, toolsPanel, function() {});
		var zoomButton = ctl("button pill", "zoom", "1x", null, toolsPanel, function() {setZoom(0)});
		var zoomButton = ctl("button pill", null, "2x", null, toolsPanel, function() {setZoom(1)});
		var zoomButton = ctl("button pill", null, "3x", null, toolsPanel, function() {setZoom(2)});
		var zoomButton = ctl("button pill", null, "4x", null, toolsPanel, function() {setZoom(3)});
		var bgButton = ctl("button pill bgaqua", "background", "-", null, toolsPanel, function() {setBackground("#00FFFF")});
		var bgButton = ctl("button pill bgfuchsia", null, "-", null, toolsPanel, function() {setBackground("#FF00FF")});
		var bgButton = ctl("button pill bggray", null, "-", null, toolsPanel, function() {setBackground("#808080")});
		var bgButton = ctl("button pill bgblack", null, "-", null, toolsPanel, function() {setBackground("#000")});
		var bgButton = ctl("button pill bgwhite", null, "-", null, toolsPanel, function() {setBackground("#FFF")});
		var moveleftButton = ctl("button icon moveleft", "adjust selection", "", null, toolsPanel, function() {moveSelection(-1, 0)});
		var moverightButton = ctl("button icon moveright", null, "", null, toolsPanel, function() {moveSelection(1, 0)});
		var moveupButton = ctl("button icon moveup", null, "", null, toolsPanel, function() {moveSelection(0, -1)});
		var movedownButton = ctl("button icon movedown", null, "", null, toolsPanel, function() {moveSelection(0, 1)});
		var shrinkleftButton = ctl("button icon shrinkleft", null, "", null, toolsPanel, function() {resizeSelection(-1, 0, 0, 0)});
		var shrinkrightButton = ctl("button icon shrinkright", null, "", null, toolsPanel, function() {resizeSelection(0, 0, -1, 0)});
		var shrinktopButton = ctl("button icon shrinktop", null, "", null, toolsPanel, function() {resizeSelection(0, -1, 0, 0)});
		var shrinkbottomButton = ctl("button icon shrinkbottom", null, "", null, toolsPanel, function() {resizeSelection(0, 0, 0, -1)});
		var growleftButton = ctl("button icon growleft", null, "", null, toolsPanel, function() {resizeSelection(1, 0, 0, 0)});
		var growrightButton = ctl("button icon growright", null, "", null, toolsPanel, function() {resizeSelection(0, 0, 1, 0)});
		var growtopButton = ctl("button icon growtop", null, "", null, toolsPanel, function() {resizeSelection(0, 1, 0, 0)});
		var growbottomButton = ctl("button icon growbottom", null, "", null, toolsPanel, function() {resizeSelection(0, 0, 0, 1)});

		// create the animations panel
		animsPanel = document.createElement("DIV");
		animsPanel.className = "panel";
		sidePanel.appendChild(animsPanel);
		var newButton = ctl("button pill", "anims", "(new)", null, animsPanel, function() {newAnimation();});
		var deleteButton = ctl("button pill", null, "(delete)", null, animsPanel, function() {deleteAnimation();});

		// create the properties panel
		propsPanel = document.createElement("DIV");
		propsPanel.className = "panel";
		sidePanel.appendChild(propsPanel);
		nameInput = ctl("input", "name", "new", "props-name", propsPanel, null);
		rowsInput = ctl("input", "rows", "1", "props-rows", propsPanel, null);
		colsInput = ctl("input", "cols", "1", "props-cols", propsPanel, null);

		var regionLabel = document.createElement("DIV");
		regionLabel.className = "label";
		regionLabel.innerHTML = "region";
		propsPanel.appendChild(regionLabel);

		regionInput = document.createElement("DIV");
		regionInput.className = "input";
		regionInput.style.color = "#999";
		regionInput.id = "props-region";
		propsPanel.appendChild(regionInput);

		// create the preview panel
		previewPanel = document.createElement("DIV");
		previewPanel.className = "panel";
		sidePanel.appendChild(previewPanel);

		var previewLabel = document.createElement("DIV");
		previewLabel.className = "label";
		previewLabel.innerHTML = "preview";
		previewPanel.appendChild(previewLabel);

		previewCanvas = document.createElement("CANVAS");
		previewCanvas.id = "previewCanvas";
		previewCanvas.width = 128;
		previewCanvas.height = 128;
		previewPanel.appendChild(previewCanvas);

		var speedButton = ctl("button pill", "speed", "1x", null, previewPanel, function() {setSpeed(1)});
		var speedButton = ctl("button pill", null, "2x", null, previewPanel, function() {setSpeed(2)});
		var speedButton = ctl("button pill", null, "3x", null, previewPanel, function() {setSpeed(3)});
		var speedButton = ctl("button pill", null, "4x", null, previewPanel, function() {setSpeed(4)});
		var speedButton = ctl("button pill", null, "8x", null, previewPanel, function() {setSpeed(8)});

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
		spriterDiv.style.visibility = "visible";
		isenabled = true;
		ASTRAL.loadImage(filename, function() {
			// set the current image
			img = ASTRAL.images[filename];
			spriterLayer.can.width = img.width;
			spriterLayer.can.height = img.height;
		});
	}

	function deactivate() {
		spriterDiv.style.visibility = "hidden";
		isenabled = false;
	}

	function enabled() {
		return isenabled;
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

	function setGrid() {

	}

	function openImage() {
		// var inp = document.createElement("INPUT");
		// inp.type = "file";
		// inp.addEventListener("change", handleFiles, false);
		// inp.click();
	}

	function openData() {
		var inp = document.createElement("INPUT");
		inp.type = "file";
		inp.addEventListener("change", handleFileSelect, false);
		inp.click();
	}

	function handleFileSelect() {
		var file = this.files[0];
		var path = "assets/" + file.name;
		loadJson(path, function(txt) {
			var anims = JSON.parse(txt);
			for (var i = 0; i < anims.length; i++) {
				var anim = anims[i];
				newAnimation(anim);
			}
		});
	}

	function loadJson(name, callback) {
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
				// TODO: we need to load the deps here or in kit.sprite...
				callback(req.responseText);
			}
	    };
	    req.send(null);  
	}

	function moveSelection(x, y) {
		selected.left += x;
		selected.top += y;
		setRegion();
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
		setRegion();
	}

	function setImage(filename) {
		data.anims = [];
		var animButtons = document.querySelectorAll(".button.anim");
		console.log(animButtons);
		animButtons.forEach(function(item) {
			item.remove();
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

	function setBackground(color) {
		var layer = ASTRAL.layers["spriter"];
		var can = layer.can;
		can.style.background = color;

		var can = previewCanvas;
		can.style.background = color;
	}

	function loadSpriteSheet() {
		console.log("todo load sprite sheet");
	}

	function getDataJson() {
		let tempArr = [];
		Object.keys(data.anims).forEach( (element) => {
		    tempArr.push(data.anims[element]);
		});
		let json = JSON.stringify(tempArr, null, 2);
		return json;
	}

	function downloadData() {
		let json = getDataJson();
		var blob = new Blob([json], {type:"application/json"});
		var url = URL.createObjectURL(blob);
		var a = document.createElement("A");
		a.download = "sprite.json";
		a.href = url;
		a.click();
	}

	function saveData() {
		let json = getDataJson();
		// make a call to the server and let the server save it to disk
		// hot reload the file on the client/server
	}

	function viewData() {
		let json = getDataJson();
		var x = window.open();
	    x.document.open();
	    x.document.write('<html><body><pre>' + json + '</pre></body></html>');
	    x.document.close();
	}

	function startSelect(offsetX, offsetY) {
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
		selected = JSON.parse(JSON.stringify(rect));
		rect = {};
		setRegion();
	}

	function createSelect(x, y, w, h) {
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

	function setZoom(val) {
		var layer = ASTRAL.layers["spriter"];
		var can = layer.can;
		var ctx = layer.ctx;
		var tran = 0; //1024 / 2 / 2 + 32 / 2 * val; // if zoom is 1 this should equal tran of 0px
		can.style.transform = "scale(" + (val + 1) + "," + (val + 1) + ") translate(" + tran + "px," + tran + "px)";
		zoom = val;
	}

	function setSpeed(val) {
		// setInterval(function() {animate();}, 300);
		clearInterval(animationTimer);
		animationTimer = setInterval(function() {animate();}, 200 / val);
	}

	function newAnimation(anim) {
		// adds a new anim button to the anims list and populate the props list with values
		selected = {};

		//mode = "new";
		animCount += 1;
		selectedId = "anim" + animCount;

		if (!anim) {
			anim = {};
			anim.name = "animation " + animCount;
			anim.rows = 1;
			anim.cols = 1;
			anim.x = 0;
			anim.y = 0;
			anim.width = 0;
			anim.height = 0;
		}

		// create a button for the anim in the anims list
		var animButton = document.createElement("DIV");
		animButton.className = "button anim";
		animButton.innerHTML = anim.name;
		animButton.id = selectedId;
		animButton.onclick = function() {selectAnimation(animButton.id);}
		animsPanel.appendChild(animButton);
		highlightAnimationButton(selectedId);

		// populate the name prop with the new animation name and set events on it
		nameInput.innerHTML = anim.name;
		nameInput.removeEventListener("blur", nameChange);
		nameInput.addEventListener("blur", nameChange);
		nameInput.focus();

		rowsInput.innerHTML = anim.rows;
		rowsInput.removeEventListener("blur", rowsChange);
		rowsInput.addEventListener("blur", rowsChange);

		colsInput.innerHTML = anim.cols;
		colsInput.removeEventListener("blur", colsChange);
		colsInput.addEventListener("blur", colsChange);

		regionInput.innerHTML = "0, 0, 0, 0";

		// store the animation in an array
		data.anims[selectedId] = anim;
	}

	function deleteAnimation() {
		var el = document.getElementById(selectedId);
		if (el) {
			var prev = el.previousSibling;
			var next = el.nextSibling;
			el.remove();
			delete data.anims[selectedId];
			if (next && next.className.indexOf("anim") != -1) {
				selectAnimation(next.id);
			}
			else if (prev && prev.className.indexOf("anim") != -1) {
				selectAnimation(prev.id);
			}
		}
	}

	function selectAnimation(id) {
		console.log("selecting animation " + id);
		// occurs after user clicks an animation in the anims list
		selectedId = id;
		var anim = data.anims[id];
		nameInput.innerHTML = anim.name;
		rowsInput.innerHTML = anim.rows;
		colsInput.innerHTML = anim.cols;
		regionInput.innerHTML = anim.x + ", " + anim.y + ", " + anim.width + ", " + anim.height;
		createSelect(anim.x, anim.y, anim.width, anim.height);
		highlightAnimationButton(id);
	}

	function highlightAnimationButton(id) {
		// set the selected class on the animation button
		var prevButton = document.querySelector(".button.anim.selected");
		if (prevButton) prevButton.className = prevButton.className.replace(" selected", "");
		var animButton = document.getElementById(id);
		animButton.className += " selected";
	}

	function nameChange() {
		var newName = nameInput.innerHTML;
		var anim = data.anims[selectedId];
		anim.name = newName;
		var animButton = document.getElementById(selectedId);
		animButton.innerHTML = newName;
	}

	function rowsChange() {
		var newval = parseInt(rowsInput.innerHTML);
		var anim = data.anims[selectedId];
		anim.rows = newval;
	}

	function colsChange() {
		var newval = parseInt(colsInput.innerHTML);
		var anim = data.anims[selectedId];
		anim.cols = newval;
	}

	function setRegion() {
		// occurs after user selected a region on the sprite sheet by drawing a rect
		if (selectedId) {
			var anim = data.anims[selectedId];
			anim.x = selected.left;
			anim.y = selected.top;
			anim.width = selected.width;
			anim.height = selected.height;
			regionInput.innerHTML = (selected.left) + ", " + (selected.top) + ", " + selected.width + ", " + selected.height;
		}
	}

	this.init = init;
	this.activate = activate;
	this.zoom = zoom;
	this.enabled = enabled;
}
window.onload = function() {

	// PANELS

	var btnMenu = document.getElementById("menubutton");
	var btnEdit = document.getElementById("editbutton");

	btnMenu.addEventListener("click", function() {
		showPanel("menupanel");
	});

	btnEdit.addEventListener("click", function() {
		showPanel("editpanel");
	});

	// MODIFY

	var btnMoveUp = document.getElementById("moveupbutton");
	var btnMoveDown = document.getElementById("movedownbutton");

	btnMoveUp.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var el = RAPID.editTarget;
		if (el.previousElementSibling) {
			el.parentNode.insertBefore(el, el.previousElementSibling);
			el.focus();
		}
	});
	btnMoveDown.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var el = RAPID.editTarget;
		if (el.nextElementSibling) {
			//el.parentNode.insertBefore(el.nextElementSibling, el);
			el.parentNode.insertBefore(el, el.nextElementSibling.nextElementSibling);
			el.focus();
		}
	});

	// setInterval(function() {
	// 	//console.log(document.activeElement);
	// 	if (document.activeElement.className.includes("rapid-overlay")) {
	// 		RAPID.editTarget = document.activeElement;
	// 	}
	// }, 100);

	// FORMAT

	var btnBold = document.getElementById("boldbutton");
	var btnItalic = document.getElementById("italicbutton");

	btnBold.addEventListener("mousedown", function(event) {
		event.preventDefault();
		document.execCommand('bold');
	});
	btnItalic.addEventListener("mousedown", function(event) {
		event.preventDefault();
		document.execCommand('italic');
	});

	// INSERT

	var btnSection = document.getElementById("sectionbutton");
	var btnHeading = document.getElementById("headingbutton");
	var btnParagraph = document.getElementById("paragraphbutton");
	var btnList = document.getElementById("listbutton");
	var btnBlock = document.getElementById("blockbutton");
	var btnOption = document.getElementById("optionbutton");
	var btnExpander = document.getElementById("expanderbutton");
	var btnLayout = document.getElementById("layoutbutton");
	var btnCellCalc = document.getElementById("cellcalcbutton");

	// btnSection.addEventListener("mousedown", function(event) {
	// 	event.preventDefault();
	// 	var section = document.createElement("SECTION");
	// 	section.innerHTML = "<h2>Section Heading</h2><p>First section paragraph...</p>";
	// 	appendCustomElement(section);
	// });
	btnHeading.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var h1 = document.createElement("H1");
		h1.setAttribute("contenteditable", "true");
		h1.innerHTML = "Heading";
		appendCustomElement(h1); // TODO: probably put the stuff below into this function...
		placeCaretAtEnd(h1);
		enableEditingForCustomElement(h1); // activate edit mode for this new element
		h1.focus(); // move into setEditTarget if document.activeElement != p then p.focus()
		setEditTarget(h1);
	});
	btnParagraph.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var p = document.createElement("P");
		p.setAttribute("contenteditable", "true");
		//p.classList.add("para");
		p.innerHTML = "Click here to enter some text...";
		appendCustomElement(p);
		placeCaretAtEnd(p);
		enableEditingForCustomElement(p); // activate edit mode for this new element
		p.focus(); // move into setEditTarget if document.activeElement != p then p.focus()
		setEditTarget(p);
	});
	btnList.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var ul = document.createElement("UL");
		var li = document.createElement("LI");
		ul.appendChild(li);
		ul.setAttribute("contenteditable", "true");
		//p.classList.add("para");
		ul.innerHTML = "<li></li>";
		appendCustomElement(ul);
		placeCaretAtEnd(li);
		enableEditingForCustomElement(ul); // activate edit mode for this new element
		ul.focus(); // move into setEditTarget if document.activeElement != p then p.focus()
		setEditTarget(ul);
	});
	btnOption.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var div = document.createElement("DIV");
		div.dataset.rapidOption = "1,2,3,4";
		div.classList.add("rapid-option");
		appendCustomElement(div);
	});
	btnExpander.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var div = document.createElement("DIV");
		div.dataset.rapidExpander = "TEST";
		div.classList.add("rapid-expander");
		div.innerHTML = "Some text...";
		appendCustomElement(div);				
	});
	btnCellCalc.addEventListener("mousedown", function(event) {
		event.preventDefault();
		var el = document.createElement("TABLE");
		el.dataset.cellCalc = "";
		el.classList.add("rapid-cellcalc");
		appendCustomElement(el);
	});
}

function showPanel(id) {
	var el = document.getElementById(id);
	addClass(el, "open");
}

function hidePanel(id) {
	var el = document.getElementById(id);
	removeClass(el, "open");
}

function triggerMouseEvent (node, eventType) {
    var clickEvent = document.createEvent ('MouseEvents');
    clickEvent.initEvent (eventType, true, true);
    node.dispatchEvent (clickEvent);
} // from StackOverflow

function appendCustomElement(el) {
	// if (document.activeElement === document.body) {
	// 	var article = document.getElementById("article1");
	// 	article.appendChild(el);
	// }
	// else {
	// 	//document.activeElement.parentNode.insertBefore(el, document.activeElement);
	// 	document.activeElement.parentNode.insertBefore(el, document.activeElement.nextSibling);
	// }

	RAPID.editTarget.parentNode.insertBefore(el, RAPID.editTarget.nextElementSibling);
}	

function toggleEditing() {
	// need to somehow toggle showing an edit button below the menu on the wiki...so just toggle a 
	// class on body element that cascades down and displays the button
	if (document.body.className.includes("editing")) {
		removeClass(document.body, "editing");
	}
	else{
		addClass(document.body, "editing");
	}

	var overlays = document.querySelectorAll(".rapid-element-overlay");
	if (overlays.length > 0) {
		// DISABLE editing features for all editable elements
		for (var i = 0; i < overlays.length; i++) {
			removeClass(overlays[i].parentNode, "rapid-overlay");
			overlays[i].parentNode.removeAttribute("draggable");
			overlays[i].parentNode.removeAttribute("contenteditable");
			overlays[i].remove();
		}

		// destroy the diagnostics info
		var diag = document.querySelector(".rapid-diag");
		diag.remove();
	}
	else {
		// ENABLE editing features for editable custom elements
		var customelements = RAPID.selectAllCustomElementsByData(document.body); //document.querySelectorAll(allElementsSelector);
		for (var i = 0; i < customelements.length; i++) {
			enableEditingForCustomElement(customelements[i]);
		}

		// ENABLE editing features for editable basic elements
		var basicelements = document.querySelectorAll("P,H1,H2,H3");
		for (var i = 0; i < basicelements.length; i++) {
			enableEditingForBasicElement(basicelements[i]);
		}

		// create the diagnostics info
		var diag = document.createElement("DIV");
		diag.innerHTML = "Total elements: " + customelements.length + " custom " + basicelements.length + " basic";
		addClass(diag, "rapid-diag");
		document.body.appendChild(diag);
	}
}

function enableEditingForCustomElement(el) {
	addClass(el, "rapid-overlay");
	//el.style.position = "relative";
	var domOverlay = document.createElement("DIV");
	domOverlay.className = "rapid-element-overlay on";
	//el.setAttribute("draggable", "true");
	el.appendChild(domOverlay);

	el.addEventListener("focusin", function() {
		// todo remove "editing" from all other rapid-overlay
		setEditTarget(this);
	});
	// el.addEventListener("focusout", function() {
	// 	removeClass(this, "editing");
	// });
}

function enableEditingForBasicElement(el) {
	addClass(el, "rapid-overlay");
	var domOverlay = document.createElement("DIV");
	domOverlay.className = "rapid-element-overlay on";
	domOverlay.setAttribute("contenteditable", "false");
	//el.setAttribute("draggable", "true");
	el.setAttribute("contenteditable", "true");
	el.appendChild(domOverlay);

	el.addEventListener("focusin", function() {
		setEditTarget(this);
	});
	// el.addEventListener("focusout", function() {
	// 	removeClass(this, "editing");
	// });
}

document.addEventListener("keydown", function(e) {
	if (e.key == "`") {
		toggleEditing();
	}
});

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
    }
}

function clearClass(classname) {
	var els = document.querySelectorAll(".rapid-overlay." + classname);
	for (var i = 0; i < els.length; i++) {
		removeClass(els[i], classname);
	}
}

function setEditTarget(el) {
	clearClass("editing");
	addClass(el, "editing");
	RAPID.editTarget = el;
	var label = document.getElementById("edittarget");
	label.innerHTML = "&lt" + el.tagName + "&gt" + " " + el.innerHTML.substring(0,15) + "...";
}
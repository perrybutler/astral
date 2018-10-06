/*
	RAPID PAGE OUTLINE

	Generates an outline of the HTML page based on the present heading elements <h1> <h2> etc, with 
	optional navigation menu support.

	Example:

		<div data-rapid-pageoutline="1,2"></div>

		This would generate an outline with a depth of <h1> to <h2>.
*/

RAPID.element({
	name: "pageoutline",
	state: {
	},
	init: function() {
		var domContainer = this.dom["container"];
		addClass(domContainer, "rapid-pageoutline"); // here we add the master style class, i think rapid.js should do this

		var ul = document.createElement("UL");
		domContainer.appendChild(ul);

		var atts = domContainer.dataset.rapidPageoutline.split(",");
		var targetid = atts[0];
		var start = parseInt(atts[1]);
		var end = parseInt(atts[2]);

		var sourceElement = document.getElementById(targetid);

		processOutlinesRecursive(domContainer, sourceElement, null, start, end);

		function processOutlinesRecursive(tocElement, sourceElement, nodes, levelNum, maxLevelNum) {
			//console.log("processTocsRecursive", tocElement, sourceElement, nodes, levelNum, maxLevelNum);
			var level = "h" + levelNum;
			if (!nodes) {
				nodes = sourceElement.getElementsByTagName(level);
			}
			for (var i = 0; i < nodes.length; i++) {
				var h = nodes[i];
				var hText = h.innerText.split(" - ")[0];
				
				// here we determine if the heading comes before/after a parent heading, then use
				// 	insertAfter instead of appendChild below...

				// first query the parent headings using levelNum - 1, then iterate them and find out
				//	where our current h belongs using DOMElement.compareDocumentPosition

				var parentLevelNum = levelNum - 1
				var parentLevel = "h" + parentLevelNum;
				var parentNodes = sourceElement.getElementsByTagName(parentLevel);
				var afterNode = null;
				for (var ii = 0; ii < parentNodes.length; ii++) {
					var parentNode = parentNodes[ii];
					var nextParentNode = parentNodes[ii + 1];
					var pos = parentNode.compareDocumentPosition(h);
					if (pos == 4) {
						afterNode = parentNode;
					}
					//console.log("compare ", h, parentNode, pos);
				}

				var afterNodeText = "";
				if (afterNode) {
					afterNodeText = afterNode.innerText.split(" - ")[0];
				}

				//console.log("after ", h, afterNode);

				var tocNode = document.createElement("li");
				tocNode.innerHTML = "<a href=#" + h.id + ">" + hText + "</a>";
				tocNode.className = "rapid-pageoutline-node level-" + levelNum;
				tocNode.dataset.rapidTocText = hText;

				// var isFirstLevel = false;
				// var ull = ul.getElementsByTagName("ul");
				// console.log("ulll", ull, ul);
				// if (ull.length == 0) {
				// 	isFirstLevel = true;
				// }

				// now get the matching parent li from the toc so we can append a child li
				if (levelNum == start) {
					var tocUl = tocElement.getElementsByTagName("UL")[0];
					tocUl.appendChild(tocNode);
					var nextLevelNum = levelNum + 1;
					var nextLevel = "h" + nextLevelNum;
					var nextNodes = sourceElement.getElementsByTagName(nextLevel);
					//console.log(nextLevel, nextNodes);
				}
				else {
					//console.log("sublevel", levelNum, hText, afterNodeText);
					var parentTocNodes = tocElement.querySelectorAll(".level-" + parentLevelNum);
					//console.log("tocnodes", parentTocNodes);
					for (var ii = 0; ii < parentTocNodes.length; ii++) {
						var li = parentTocNodes[ii];
						var liText = li.dataset.rapidTocText;
						//console.log("tocnode", hText, liText, afterNodeText);
						if (liText == afterNodeText) {
							var tocUl = li.getElementsByTagName("ul")[0];
							//console.log("tocul", tocUl);
							if (!tocUl) {
								tocUl = document.createElement("UL");
								li.appendChild(tocUl);
							}
							tocUl.appendChild(tocNode);
						}
					}
				}
				
			}
			if (nextNodes && nextLevelNum <= maxLevelNum) {
				//console.log("nodes ", nextNodes, nextLevelNum, maxLevelNum);
				processOutlinesRecursive(tocElement, sourceElement, nextNodes, nextLevelNum, maxLevelNum);
			}
		}
	}
});
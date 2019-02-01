"use strict";
console.log("atlas.js entry point");

ASTRAL.components.atlas = (function() {

	console.log("atlas.js constructor");

	function instance(obj) {
		var component = {};
		component.type = "atlas";
		component.path = "";
		component.frameset = "";
		component.frameSequence = "*";
		component.frameIndex = 0;
		component.frameDuration = 100; // each frame will last 100ms aka 10 fps
		component.loop = false;
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(instance) {
		instance.runtime = {};
		//instance.runtime.frames = {};
		//instance.runtime.framesets = {};
		instance.runtime.lastFrameTime = 0;
	}

	function update(obj, instance) {
		// update frame every N milliseconds
		var timeNow = performance.now();
		if (timeNow - instance.runtime.lastFrameTime >= instance.frameDuration) { // >= instance.frameDuration
			instance.frameIndex++;
			//console.log(instance.frameIndex);
			var complete = false;

			var framesToDraw = getFramesToDraw(instance);

			if (instance.frameIndex >= framesToDraw.length) {
				if (instance.loop == true) {
					instance.frameIndex = 0;
				}
				else {
					instance.frameIndex = 0;
					complete = true;
				}
			}
			instance.runtime.lastFrameTime = performance.now();
			if (complete) {
				obj.do("animationcomplete");
			}
			else {
				obj.do("animationupdate");
			}
		}
	}

	function draw(obj, ctx, instance) {
		// if the image specified by path isnt loaded load it now
		if (!ASTRAL.images[instance.path]) {
			ASTRAL.loadImage(instance.path);
		}

		// grab the image used by this instance
		var img = ASTRAL.images[instance.path];

		// get the frame sequence, if * then sequence is all frames, pull frame to draw using frameindex
		// build a 1000ms timer in astral and we can just check with that to see where we're at so we
		//	dont have several timers all over the place slowing us down

		// grab the frameset, which is a comma delimited string
		

		var framesToDraw = getFramesToDraw(instance);

		if (framesToDraw) {
			// var splFrameset = fs.split(",");
			// // determine whether to use the entire frameset sequence, or a custom sequence
			// var framesToDraw = [];
			// if (instance.frameSequence == "*") {
			// 	framesToDraw = splFrameset;
			// }
			// else {
			// 	framesToDraw = instance.frameSequence.split(",");
			// }

			

			// get the frame to draw
			//var fname = fs[instance.frameIndex]; //fs[0];
			var fname = framesToDraw[instance.frameIndex];
			var f = instance.frames[fname].split(",");
			var x = f[0];
			var y = f[1];
			var w = f[2];
			var h = f[3];

			obj.baseWidth = w;
			obj.baseHeight = h;
			obj.width = obj.baseWidth * obj.scale;
			obj.height = obj.baseHeight * obj.scale;

			// draw the frame
			if (img) ctx.drawImage(img, x, y, w, h, obj.x, obj.y, w, h);
		}
	}

	function getFramesToDraw(instance) {
		// determine whether to use the entire frameset sequence, or a custom sequence
		// TODO: should we really call this every update??? maybe just call it once on init(), but
		//	then it wouldnt update if it the value changes in the editor since the editor directly
		//	changes the instance.frameSequence without a setter that also recalcs the framesToDraw
		var fs = instance.framesets[instance.frameset];
		var splFrameset = fs.split(",");
		var framesToDraw;
		if (fs) {
			if (instance.frameSequence == "*") {
				framesToDraw = splFrameset;
			}
			else {
				framesToDraw = instance.frameSequence.split(",");
			}
		}
		return framesToDraw;
	}

	function play() {

	}

	function stop() {

	}

	return {
		instance:instance,
		update:update,
		draw:draw,
		applyRuntimeProps:applyRuntimeProps,
		play:play,
		stop:stop
	}
}());
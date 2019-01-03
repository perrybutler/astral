ASTRAL.components.atlas = (function() {
	function instance(obj) {
		var component = {};
		component.type = "atlas";
		component.path = "";
		component.frameset = "";
		component.frameSequence = "*";
		component.frameIndex = 0;
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(instance) {
		instance.runtime = {};
		instance.runtime.frames = {};
		instance.runtime.framesets = {};
		instance.runtime.lastFrameTime = 0;
	}

	function update(obj, ctx, instance) {
		// if the image specified by path isnt loaded load it now
		if (!ASTRAL.images[instance.path]) {
			ASTRAL.loadImage(instance.path);
		}

		var img = ASTRAL.images[instance.path];

		// get the frame sequence, if * then sequence is all frames, pull frame to draw using frameindex
		// build a 1000ms timer in astral and we can just check with that to see where we're at so we
		//	dont have several timers all over the place slowing us down

		// grab the frameset, which is a comma delimited string
		var fs = instance.runtime.framesets[instance.frameset].split(",");

		// determine whether to use the entire frameset sequence, or a custom sequence
		var framesToDraw = [];
		if (instance.frameSequence == "*") {
			framesToDraw = fs;
		}
		else {
			framesToDraw = instance.frameSequence.split(",");
		}

		// get the frame to draw
		//var fname = fs[instance.frameIndex]; //fs[0];
		var fname = framesToDraw[instance.frameIndex];
		var f = instance.runtime.frames[fname].split(",");
		var x = f[0];
		var y = f[1];
		var w = f[2];
		var h = f[3];

		obj.baseWidth = w;
		obj.baseHeight = h;
		obj.width = obj.baseWidth * obj.scale;
		obj.height = obj.baseHeight * obj.scale;



		// console.log(framesToDraw);

		// draw the frame
		if (img) ctx.drawImage(img, x, y, w, h, obj.x, obj.y, w, h);

		if (performance.now() - instance.runtime.lastFrameTime >= 40) {
			instance.frameIndex++;
			if (instance.frameIndex >= framesToDraw.length) {
				instance.frameIndex = 0;
			}
			instance.runtime.lastFrameTime = performance.now();
		}
	}

	function play() {

	}

	function stop() {

	}

	return {
		instance:instance,
		update:update,
		play:play,
		stop:stop
	}
}());
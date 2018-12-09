ASTRAL.components.atlas = (function() {
	function instance(obj) {
		var component = {};
		component.type = "atlas";
		component.path = "";
		component.frameset = "";
		component.frameIndex = 0;
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(instance) {
		instance.runtime = {};
		instance.runtime.frames = {};
		instance.runtime.framesets = {};
	}

	function update(obj, ctx, instance) {
		// if the image specified by path isnt loaded load it now
		if (!ASTRAL.images[instance.path]) {
			ASTRAL.loadImage(instance.path);
		}

		// get the frame to draw
		var fs = instance.runtime.framesets[instance.frameset].split(",");
		var fid = fs[0];
		var f = instance.runtime.frames[fid].split(",");
		var x = f[0];
		var y = f[1];
		var w = f[2];
		var h = f[3];

		obj.baseWidth = w;
		obj.baseHeight = h;
		obj.width = obj.baseWidth * obj.scale;
		obj.height = obj.baseHeight * obj.scale;

		// draw the frame
		ctx.drawImage(ASTRAL.images[instance.path], x, y, w, h, obj.x, obj.y, w, h);
	}
	return {
		instance:instance,
		update:update
	}
}());
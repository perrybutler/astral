ASTRAL.components.atlas = (function() {
	function instance(obj) {
		var component = {};
		component.type = "atlas";
		component.path = "";
		component.frameset = "";
		component.frameIndex = 0;
		return component;
	}
	function update(obj, ctx, instance) {

	}
	return {
		instance:instance,
		update:update
	}
}());
ASTRAL.components.collider = (function() {
	function instance(obj) {
		var component = {};
		component.type = "collider";
		return component;
	}
	function update(obj, ctx, instance) {
		
	}
	return {
		instance:instance,
		update:update
	}
}());
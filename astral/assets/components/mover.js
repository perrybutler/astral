ASTRAL.components.mover = (function() {
	function instance(obj) {
		var component = {};
		component.type = "mover";
		component.speed = 1;
		return component;
	}
	function update(obj, ctx, instance) {
		obj.x += instance.speed;
	}
	return {
		instance:instance,
		update:update
	}
}());
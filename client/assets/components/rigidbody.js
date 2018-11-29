ASTRAL.components.rigidbody = (function() {
	function instance(obj) {
		var component = {};
		component.type = "rigidbody";
		return component;
	}
	function update(obj, ctx, instance) {
		//obj.x += instance.speed;
	}
	return {
		instance:instance,
		update:update
	}
}());
ASTRAL.components.rotate = (function() {
	function instance(obj) {
		var component = {};
		component.type = "rotate";
		component.speed = 1;
		return component;
	}
	function update(obj, ctx, instance) {
		obj.rot += parseInt(instance.speed);
		if (obj.rot >= 360) obj.rot = 0;
	}
	return {
		instance:instance,
		update:update
	}
}());

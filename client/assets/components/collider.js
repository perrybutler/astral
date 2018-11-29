ASTRAL.components.collider = (function() {
	function instance(obj) {
		var component = {};
		component.type = "collider";
		component.shape = "rectangle";
		component.width = 64;
		component.height = 64;
		component.isTrigger = false;
		component.collideDirection = "nsew";
		component.whitelist = "";
		component.blacklist = "";
		return component;
	}
	function update(obj, ctx, instance) {
		
	}
	return {
		instance:instance,
		update:update
	}
}());
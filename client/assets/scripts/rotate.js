ASTRAL.component("rotate", function() {
	var component = {};
	component.speed = 1;
	component.update = function(obj) {
		obj.rot += component.speed;
	}
	return component;
});
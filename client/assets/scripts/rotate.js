ASTRAL.components.rotate = (function() {
	var speed = 1;
	function update(obj) {
		obj.rot += speed;
	}
	return {
		set speed(val) {
			speed = val;
		},
		get speed() {
			return speed;
		},
		update:update
	}
}());
ASTRAL.components.mover = (function() {
	var speed = 1;
	function update(obj) {
		obj.x += speed;
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
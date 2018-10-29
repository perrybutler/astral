ASTRAL.components.particle = (function() {
	var speed = 2;
	var particles = [];

	var density = 5000;			// particle cloud density
	var size = 30; 				// particle size in pixels
	var sizeRandomize = 0.5;		// particle size randomness (0.5 is +/- 50% of original size)
	var gravity = 1;			// from -1 (float up) to 1 (fall down)

	function update(obj, ctx) {
		if (particles.length < density) {
			particles.push(newParticle());
		}

		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			p.x += p.vx * speed;
			p.y += p.vy * speed;
			p.age += 1;
			p.opacity -= parseFloat(rnd(0, 100) / 20000);

			ctx.save();
			ctx.fillStyle = "rgba(100,100,100," + p.opacity + ")";
			ctx.fillRect(obj.x + p.x, obj.y + p.y, p.size, p.size);
			ctx.restore();
			
			if (p.opacity <= 0) {
				particles.splice(i, 1);
			}
		}
	}

	function newParticle() {
		var p = {};
		p.x = 0;
		p.y = 0;
		p.speed = 1;
		p.opacity = 1;
		p.vx = parseFloat((rnd(0, 100) / 100));
		p.vy = parseFloat((rnd(0, 100) / 100));
		p.age = 0;

		var fza = size * sizeRandomize;
		var fzb = size + (size * sizeRandomize);
		var fz = parseInt(rnd(fza * 100, fzb * 100) / 100);
		p.size = fz;

		return p;
	}

	function rnd(min, max) {
	    return Math.floor(Math.random() * (max - min) ) + min;
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
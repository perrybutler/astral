ASTRAL.components.particle = (function() {
	function instance(obj) {
		var component = {};
		component.type = "particle";
		component.speed = 2;
		component.density = 5000;
		component.size = 30;
		component.sizeRandomize = 0.5;
		component.gravity = 1;
		component.colorR = 0;
		component.colorG = 0;
		component.colorB = 0;
		// apply some runtime props which are not saved to disk
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(component) {
		component.runtime = {};
		component.runtime.particles = [];
	}

	function update(obj, ctx, component) {
		var particles = component.runtime.particles;
		// TODO: we can probably get some performance by refactoring some stuff here such as
		//	reusing particles instead of splicing array and creating new ones, as well as
		//	only setting context props when absolutely necessary, and generating a list of
		//	random numbers to use instead of generating one every time
		//console.log("PARTICLE", obj, ctx, component, particles);
		if (particles.length < component.density) {
			particles.push(newParticle(component));
		}

		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			p.x += p.vx * component.speed;
			p.y += p.vy * component.speed;
			p.age += 1;
			p.opacity -= parseFloat(rnd(0, 100) / 20000); // TODO: this determines particle lifetime so dynamically adjust this according to desired density etc

			ctx.save();
			ctx.translate(obj.x, obj.y);
			ctx.rotate(obj.rot * Math.PI/180);
			ctx.fillStyle = "rgba(" + 
				component.colorR + "," + 
				component.colorG + "," + 
				component.colorB + "," + 
				p.opacity + ")"
			;
			//ctx.fillRect(obj.x + p.x, obj.y + p.y, p.size, p.size);
			ctx.fillRect(p.x, p.y, p.size, p.size);
			ctx.restore();

			if (p.opacity <= 0) {
				particles.splice(i, 1);
			}
		}
	}

	function newParticle(component) {
		var p = {};
		p.x = 0;
		p.y = 0;
		p.speed = 1;
		p.opacity = 1;
		p.vx = parseFloat((rnd(0, 100) / 100));
		p.vy = parseFloat((rnd(0, 100) / 100));
		p.age = 0;

		var fza = component.size * component.sizeRandomize;
		var fzb = component.size + (component.size * component.sizeRandomize);
		var fz = parseInt(rnd(fza * 100, fzb * 100) / 100);
		p.size = fz;

		return p;
	}

	function rnd(min, max) {
	    return Math.floor(Math.random() * (max - min)) + min;
	}

	return {
		instance:instance,
		applyRuntimeProps:applyRuntimeProps,
		update:update
	}
}());

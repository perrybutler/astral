ASTRAL.components.particle = (function() {
	function instance(obj) {
		var component = {};
		component.type = "particle";
		//component.loop = true;
		component.arc = 90;
		component.speed = 2;
		component.numParticles = 50;
		component.fadeMult = 1;
		//component.radius = 50;
		//component.gravity = 1;
		component.color1 = "#ff0000";
		component.color2 = "#bb0000";
		component.color3 = "#660000";
		component.sizeMin = 30;		// minimum size a particle can be
		component.sizeMax = 100;	// maximum size a particle can be
		//component.sizeChange = 2;
		//component.colorFrom = "#333333";
		//component.colorTo = "#999999";
		component.path = "assets/packs/public domain alphas/PDAlpha_075_fix_sm.png"; // TODO: path is not a good name, imgpath is better, but we have to use path because editor converts it into a dragdrop
		// apply some runtime props which are not saved to disk
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(instance) {
		instance.runtime = {};
		instance.runtime.lastImg = null;
		instance.runtime.particles = [];
	}

	function update(obj, ctx, instance) {
		var particles = instance.runtime.particles;

		// if at any point the path is set, it means the system should use an image for the
		//	particle, so we need to load that image now
		if (!ASTRAL.images[instance.path]) {
			ASTRAL.loadImage(instance.path);
		}

		// get the image, this will be null if image not set or still loading
		var img = ASTRAL.images[instance.path];

		generateColorAtlas(instance, img);

		// if (img != instance.runtime.lastImg) {
		// 	console.log("generating color atlas for particle component using " + instance.path);
		// 	generateColorAtlas(instance, img);
		// 	instance.runtime.lastImg = img;
		// }

		// if the system hasn't reached its numParticles, generate a particle now
		if (particles.length < instance.numParticles) {
			particles.push(newParticle(instance));
		}
		else if (particles.length > instance.numParticles) {
			instance.runtime.particles = [];
		}

		//ctx.save();

		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			if (p.opacity <= 0) {
				particles[i] = newParticle(instance);
			}

			// decrease opacity a random amount but do not go below 0 or opacity will reverse the 
			//	effect and particles will pop in everywhere
			p.opacity -= parseFloat(rnd(0, 100) / 20000) * instance.fadeMult; // TODO: this determines particle lifetime so dynamically adjust this according to desired numParticles etc
			//p.opacity = Number(p.opacity.toFixed(4)); // snap to 4 decimal places (probably does not improve performance)
			if (p.opacity <= 0) {
				p.opacity = 0; // snap to 0 if below 0
			}
			else {
				p.x += p.vx * instance.speed;
				p.y += p.vy * instance.speed;
				p.age += 1;
				p.rot += 1;

				ctx.save();
				ctx.translate(obj.x, obj.y);
				ctx.rotate(obj.rot * Math.PI/180);

				if (img) {
					ctx.globalAlpha = p.opacity;
					//ctx.drawImage(img, p.x, p.y, p.size, p.size);
					ctx.drawImage(instance.runtime.colorAtlas.can, p.colorIndex * img.width, 0, img.width, img.height, p.x, p.y, p.size, p.size);
				}
				else {
					// this particle system does not use an image
					// ctx.fillStyle = "rgba(" + 
					// 	component.colorR + "," + 
					// 	component.colorG + "," + 
					// 	component.colorB + "," + 
					// 	p.opacity + ")"
					// ;
					ctx.fillRect(p.x, p.y, p.size, p.size);
				}

				// restore context before iterating next particle
				ctx.restore();				
			}
		}
	}

	function newParticle(instance) {
		var p = {};
		p.x = 0;
		p.y = 0;
		p.speed = 1;
		p.opacity = 1;
		p.rot = 0;
		p.vx = parseFloat((rnd(0, 100) / 100));
		p.vy = parseFloat((rnd(0, 100) / 100));
		p.age = 0;
		p.size = Math.round(rnd(instance.sizeMin * 100, instance.sizeMax * 100) / 100);
		// select frame 1, 2 or 3 from the colorAtlas
		var randomColors = [];
		if (instance.color1) randomColors.push(instance.color1);
		if (instance.color2) randomColors.push(instance.color2);
		if (instance.color3) randomColors.push(instance.color3);
		//var rand = Math.floor(Math.random() * randomColors.length - 1) + 0;
		var rand = Math.floor(Math.random()*(2-0+1)+0);
		p.colorIndex = rand;
		return p;
	}

	function generateColorAtlas(instance, img) {
		// build the color atlas if it hasn't been built yet
		// TODO: generate an atlas with 3 copies/frames of the particle image drawn in the 3 colors
		//	defined above, so we can use this when drawing the colored particle and we won't have 
		//	to do compositing at runtime which is mega slow
		// TODO: doing this every frame is not ideal...we should do it once when the instance
		//	is created and also when color1, color2, color3, or path changes at runtime, then
		//	dynamically regenerate the atlas

		if (img) {
			instance.runtime.colorAtlas = {};
			instance.runtime.colorAtlas.can = document.createElement("CANVAS");
			instance.runtime.colorAtlas.ctx = instance.runtime.colorAtlas.can.getContext("2d");

			var can2 = instance.runtime.colorAtlas.can;
			var ctx2 = instance.runtime.colorAtlas.ctx;
			can2.width = img.width * 3;
			can2.height = img.height;

			var canTemp = document.createElement("CANVAS");
			var ctxTemp = canTemp.getContext("2d");

			ctxTemp.globalCompositeOperation = "source-over";
			ctxTemp.fillStyle = instance.color1;
			ctxTemp.fillRect(0, 0, img.width, img.height);
			ctxTemp.globalCompositeOperation = "destination-in";
			ctxTemp.drawImage(img, 0, 0);
			ctx2.drawImage(canTemp, 0 * img.width, 0);

			ctxTemp.clearRect(0, 0, img.width, img.height);

			ctxTemp.globalCompositeOperation = "source-over";
			ctxTemp.fillStyle = instance.color2;
			ctxTemp.fillRect(0, 0, img.width, img.height);
			ctxTemp.globalCompositeOperation = "destination-in";
			ctxTemp.drawImage(img, 0, 0);
			ctx2.drawImage(canTemp, 1 * img.width, 0);

			ctxTemp.clearRect(0, 0, img.width, img.height);

			ctxTemp.globalCompositeOperation = "source-over";
			ctxTemp.fillStyle = instance.color3;
			ctxTemp.fillRect(0, 0, img.width, img.height);
			ctxTemp.globalCompositeOperation = "destination-in";
			ctxTemp.drawImage(img, 0, 0);
			ctx2.drawImage(canTemp, 2 * img.width, 0);
		}
	}

	function rnd(min, max) {
	    return Math.floor(Math.random() * (max - min)) + min;
	}

	function hexToRgb(string){
	    return string.match(/\w\w/g).map(function(b){ return parseInt(b,16) })
	}

	function rndHex(h1, h2) {
		var rgb1 = hexToRgb(h1);
		var rgb2 = hexToRgb(h2);
		var rgb3 = [];
		for (var i=0; i<3; i++) rgb3[i] = rgb1[i]+Math.random()*(rgb2[i]-rgb1[i])|0;
		// var newColor = '#' + rgb3
		//    .map(function(n){ return n.toString(16) })
		//    .map(function(s){ return "00".slice(s.length)+s}).join('');
		//return newColor;
		return rgb3;
	}



	return {
		instance:instance,
		applyRuntimeProps:applyRuntimeProps,
		update:update
	}
}());

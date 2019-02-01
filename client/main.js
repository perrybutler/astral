ASTRAL.game.main = (function() {
	function init() {
		// astra.js calls this on load
		// usually we load intro.scene, but we're testing level1 as if this is its script file
		ASTRAL.loadScene("assets/level1.scene", function() {
			ready();
		});
	}

	function ready() {
		//ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerdown.mp3"); // TODO: why wont this work?
		var timer = ASTRAL.findObject("timer");
		timer.on("animationupdate", function() {
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/countdownBlip.mp3");
		});
		timer.on("animationcomplete", function() {
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerup.mp3");
			ASTRAL.deleteObject(timer);
			startRound();
		});



		var ball = ASTRAL.findObject("ball");
		ball.vx = ASTRAL.getRandomNumber(-1000, 1000, true) / 1000;
		ball.vy = -1;
		ball.on("collision", function(sobj) {
			//ASTRAL.deleteObject(ball);
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/brickDeath.mp3");
			// if (sobj.name.includes("brick")) {
			// 	// destroy the brick
			// 	ASTRAL.deleteObject(sobj);
			// }
			// if (sobj.name.includes("wall_south")) {
			// 	// stop the ball
			// 	// TODO: this causes the collision to fire constantly...call init instead
			// 	ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerdown.mp3");
			// 	// TODO: we need an ASTRAL.timer() so we can safely delay this by 1 second...
			// 	//	otherwise the round starts over too fast and you don't hear the death sound
			// 	init();
			// }
		});
	}

	function startRound() {
		var paddle = ASTRAL.findObject("paddle");
		ASTRAL.on("mousemove", function(e) {
			paddle.x = ASTRAL.mouseX - paddle.width/2; // TODO: we need an origin system so we dont have to do this math
		});

		// var ball = ASTRAL.findObject("ball");
		// ball.vx = ASTRAL.getRandomNumber(-1000, 1000, true) / 1000;
		// ball.vy = -1;
	}

	return {
		init:init,
		ready:ready
	}
}());
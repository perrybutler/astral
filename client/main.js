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

		// set up the 3 second countdown timer
		var timer = ASTRAL.findObject("timer");
		timer.on("animationupdate", function() {
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/countdownBlip.mp3");
		});
		timer.on("animationcomplete", function() {
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerup.mp3");
			ASTRAL.deleteObject(timer);
			startRound();
		});
		timer.play("timer", 1);

		// get the ball
		var ball = ASTRAL.findObject("ball");

		// randomize the ball direction
		// we set this here instead of startRound() so we can see the chosen movement vector in
		//	the editor without having to start the game
		ball.vx = ASTRAL.getRandomNumber(-1000, 1000, true) / 1000; // from -1 to 1
		ball.vy = -1;
		ball.speed = 0;

		// set up a listener to handle ball collisions
		ball.on("collision", function(sobj) {
			//ASTRAL.deleteObject(ball);
			ASTRAL.playSound("assets/packs/jsbreakouts/sfx/brickDeath.mp3");
			if (sobj.name.includes("brick")) {
				// destroy the brick
				// TODO: play animation then destroy on callback
				sobj.play("brick_blue", 1, function() {
					// TODO: this needs to callback on animation complete, currently it calls immediately
					//	due to play() implementation
					ASTRAL.deleteObject(sobj);
				});
			}
			if (sobj.name.includes("wall_south")) {
				// stop the ball
				// TODO: this causes the collision to fire constantly...call init instead
				ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerdown.mp3");
				// TODO: we need an ASTRAL.timer() so we can safely delay this by 1 second...
				//	otherwise the round starts over too fast and you don't hear the death sound
				init();
			}
		});
	}

	function startRound() {
		// bind the paddle to the mouse movement
		var paddle = ASTRAL.findObject("paddle");
		ASTRAL.on("mousemove", function(e) {
			paddle.x = ASTRAL.mouseX - paddle.width/2; // TODO: we need an origin system so we dont have to do this math
		});

		// get the ball moving
		var ball = ASTRAL.findObject("ball");
		ball.speed = 0.4;
	}

	return {
		init:init,
		ready:ready
	}
}());
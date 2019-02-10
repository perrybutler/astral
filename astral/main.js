ASTRAL.game.main = (function() {
	var lives = 3;
	var speedMult = 1.0;

	function init() {
		// astral.js calls this on load
		// first thing we will do is load our intro scene, it is a static scene that needs no further
		//  code or preparation, it simply waits for the player to click start (clicking start will 
		//	call level1() below...)
		ASTRAL.loadScene("assets/intro.scene");

		// if we want to skip to a certain level on startup
		// ASTRAL.loadScene("assets/level2.scene", function() {
		// 	level2();
		// });
	}

	function level1() {
		// play sound to indicate the player is starting a level
		ASTRAL.playSound("assets/packs/jsbreakouts/sfx/recover.mp3");
		// load level1, use the callback to further prepare the scene when level1 has loaded
		ASTRAL.loadScene("assets/level1.scene", function() {
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
			// start the timer
			timer.play("timer", 1);

			// randomize the ball direction
			var ball = ASTRAL.findObject("ball");
			// we set this here instead of startRound() so we can see the chosen movement vector in
			//	the editor without having to start the game
			ball.vx = ASTRAL.getRandomNumber(-1000, 1000, true) / 1000; // from -1 to 1
			ball.vy = -1;
			ball.speed = 0;
			// set up a listener to handle ball collisions
			ball.on("collision", function(sobj) {
				ASTRAL.playSound("assets/packs/jsbreakouts/sfx/brickDeath.mp3");
				if (sobj.name.includes("brick")) {
					// ball hit brick, destroy the brick
					// first, remove the collider so the ball cant collide with the brick again 
					//	while its still playing the death animation
					var collider = ASTRAL.findComponentByType(sobj, "collider");
					collider = null;
					// play the death animation one time
					sobj.play(sobj.name, 1, function() { // e.g. sobj.name = "brick_blue"
						// the animation is done, delete the object from the scene
						ASTRAL.deleteObject(sobj);
					});
					// TODO: check if any bricks are remaining, if not proceed to next level
					var bricks = ASTRAL.find("#brick_blue");
					console.log("BRICKS", bricks);
					//level2();
				}
				if (sobj.name.includes("wall_south")) {
					// ball went out of bounds
					// TODO: deduct a life and play a death sound
					ASTRAL.playSound("assets/packs/jsbreakouts/sfx/powerdown.mp3");
					// TODO: stop the ball and wait about 1 second before reloading the level so that
					// 	the ball death sound can play through...will need an ASTRAL.timer() for this
					//	that works like setInterval, but within (and controlled by) the gameLoop.
					// TODO: reload the level or end game if lifes = 0
					level1();
				}
			});
		});
	}

	function level2() {
		ASTRAL.loadScene("assets/level2.scene", function() {

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
		ball.speed = 0.7 * speedMult;
	}

	return {
		init:init,
		level1:level1,
		level2:level2
	}
}());
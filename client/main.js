ASTRAL.game.main = (function() {
	function init() {
		ASTRAL.loadScene("assets/intro.scene", function() {
			ready();
		});
	}

	function ready() {
		// var btn = ASTRAL.findObject("guy");
		// btn.on("click", function() {
		// 	ASTRAL.playSound("assets/sounds/Breaker-1.mp3");
		// });
	}

	return {
		init:init
	}
}());
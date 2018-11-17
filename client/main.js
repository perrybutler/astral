// TODO: these are globals...i should have some kind of script module wrapper so we can have
//	private/public interfaces

ASTRAL.startGame = function() {
	ASTRAL.loadScene("assets/scenes/zone1.scene", function() {
		ready();
	});
}

function ready() {
	var btn = ASTRAL.findObject("guy");
	btn.on("click", function() {
		foo();
	});
}

function foo() {
	ASTRAL.playSound("assets/sounds/Breaker-1.mp3");
}
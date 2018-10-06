console.log("editor.js entry point");

ASTRAL.editor = {
	requires: [
		{name: "test", path: "core/test.js"}
	],

	init() {
		console.log("editor.js init()");
	}
}
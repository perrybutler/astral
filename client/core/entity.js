console.log("entity.js entry point");

ASTRAL.entity = function(name) {
	var ent = {};
	ent.name = name;
	ent.onHandlers = {};
	ent.on = function(eventName, callback) {
		var handlers = ent.onHandlers[name];
		if (handlers == null) {
			handlers = [];
		}
		handlers.push(callback);
	}
	return ent;
}
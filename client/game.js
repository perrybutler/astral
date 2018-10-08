console.log("game.js entry point");

ASTRAL.game = new function() {
	// objects
	var myName = "";
	var myObjectId = null;
	var myObject = null;
	var objects = [];

	function init() {
		console.log("game.js init()");
		attachNetcodeHandlers();
	}

	function attachNetcodeHandlers() {

		ASTRAL.netcode.on("*greet", function(payload) {
			// *greet,name,objectid | *greet,player1,1
			// the server told us what object we have control of
			myObjectId = payload[0];
			myObject = ASTRAL.game.objects[myObjectId];
			myName = payload[1];
			myObject.player = myName;
			console.log("server said my name is " + myName + " and my object id is " + myObjectId);
		});

		ASTRAL.netcode.on("*keepalive", function(payload) {
			// the server responded to our ping
			var pongTime = payload[1];
			var serverDelta = pongTime - pingTime;
			console.log("round trip time (RTT) is " + serverDelta + "ms");
		});

		ASTRAL.netcode.on("*create", function(payload) {
			// *create,id,name,x,vx,y,vy | *create,1,player1,0,0,0,0
			// creates a single object
			var obj = ASTRAL.createGameObject(payload[0], payload[1], "zone1");
			obj.x = parseInt(payload[2]);
			obj.vx = parseInt(payload[3]);
			obj.y = parseInt(payload[4]);
			obj.vy = parseInt(payload[5]);
		});

		ASTRAL.netcode.on("*createm", function(payload) {
			// the server sent us multiple objects to be created
			// create the first object which is at a unique offset from the rest
			var obj = ASTRAL.createGameObject(payload[0], payload[1], "zone1");
			obj.x = parseInt(payload[2]);
			obj.vx = parseInt(payload[3]);
			obj.y = parseInt(payload[4]);
			obj.vy = parseInt(payload[5]);
			// create the rest of the objects
			// example: *createm,player1,50,0,50,0,player2,50,0,50,0,player3,50,0,50,0
			var componentCount = 6;
			for (var i = 0; i < payload.length; i+= componentCount) {
				var obj = ASTRAL.createGameObject(payload[i], payload[i + 1], "zone1");
				//obj.name = spl[i + 1];
				obj.x = parseInt(payload[i + 2]);
				obj.vx = parseInt(payload[i + 3]);
				obj.y = parseInt(payload[i + 4]);
				obj.vy = parseInt(payload[i + 5]);
			}
		});

		ASTRAL.netcode.on("*move", function(payload) {
			// *move,objectid,vx,vy | *move,1,0,1
			// the server said an object changed its movement vector
			var obj = ASTRAL.game.objects[payload[0]];
			if (obj) {
				obj.vx = parseInt(payload[1]);
				obj.vy = parseInt(payload[2]);
				obj.x = parseInt(payload[3]);
				obj.y = parseInt(payload[4]);
			}
			else {
				console.log("ERROR: received a server message for non existant object '" + payload[1] + "'");
			}
		});

		ASTRAL.netcode.on("*delete", function(payload) {
			// *delete,objectid | *delete,1
			// the server said we should delete an object
			delete ASTRAL.game.objects[payload[0]];
		});
	}

	this.init = init;
	this.myName = function() {return myName;}
	this.myObjectId = function() {return myObjectId;}
	this.myObject = function() {return myObject;}
	this.objects = function() {return objects;}
}
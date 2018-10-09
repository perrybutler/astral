var Server = require('ws').Server;
var port = process.env.PORT || 33333;
var ws = new Server({port: port});

var fs = require('fs');

var objectCount = 0;
var playerCount = 0;
var players = [];		// connected players
var objects = [];		// game objects
var topics = [];		// send queue topics
var sendQueue = [];		// send queue (unused see topics)
var sendCount = 0;			// send count
var receiveQueue = [];		// receive queue

/*==================
	STARTUP
==================*/

init();

function init() {
	createTopic("zone1");
	createTopic("serverglobal");
	setInterval(serverLoop, 1000 / 30);
}

/*==================
	NETCODE
==================*/

ws.on('connection', function(client, req) {
	// client connected, add a player for this client
	var cid = req.headers['sec-websocket-key']; // unique client id from the socket
	var player = addPlayer(cid, client);
	var name = player.name;

	// handle messages from client
	client.on('message', function(rawmsg){
		// look up the player who sent this message using the unique client id from the socket
		var cid = req.headers['sec-websocket-key'];
		var player = players[cid];
		// receive the message
		var msg = rawmsg.slice(1, -1); // trims off the quotes
		console.log("-> " + name + " :: " + msg);
		queueReceive(player, msg);
	});

	// handle client disconnect
	client.on('close', function() {
		// look up the player who disconnected using the unique client id from the socket
		var cid = req.headers['sec-websocket-key'];
		var player = players[cid];
		var oid = player.object.id;
		// remove the player and notify other players
		console.log("client disconnected :: " + player.name);
		removePlayer(player);
		queueSend("zone1", "*delete," + oid);
	});

	// // send the assets folder contents for editor mode where non-async methods are ok
	
	// var files = getFiles('../client/assets/');
	// var folders = getDirectories('../client/assets/');
	// //var final = folders.concat(['***']).concat(files);
	// var final = folders.join() + "***" + files.join();
	// console.log("FINAL", final);
	// queueSend(name, "*dirlist," + final);

	// greet the client that just connected
	queueSend(name, "*createm," + getObjectsByTopic("zone1"));
	queueSend(name, "*greet," + player.object.id + "," + name);
});

function getFiles(path) {
	return fs.readdirSync(path).filter(function (file) {
		return fs.statSync(path+'/'+file).isFile();
	});
	// https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs/24594123
}

function getDirectories(path) {
	return fs.readdirSync(path).filter(function (file) {
		return fs.statSync(path+'/'+file).isDirectory();
	});
	// https://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs/24594123
}

function sendNow(id, payload) {
	var player = players[id];
	var name = player.name;
	console.log("<- " + name + " :: " + payload);
	if (player) {
		if (player.client.readyState == 1) {
			player.client.send(payload);
		}
		else {
			console.log(name + " dropped");
			removePlayer(player);
		}
	}
	else {
		console.log("tried to sendNow to " + name + " but that player does not exist");
	}
}

function queueSend(topic, payload) {
	sendCount += 1;
	topics[topic].push(payload);
}

function handleSendQueue() {
	if (sendCount > 0) {
		console.log("sending " + sendCount + " message(s)");
		for (var key in objects) {
			var obj = objects[key];
			if (obj != null) {
				//console.log("sending for object " + obj.name);
				// if the object is a player, send pending messages
				if (obj.player) {
					//console.log("sending for player " + obj.player.name);
					obj.topics.forEach(function(key) {
						//console.log("sending for topic " + key);
						var topic = topics[key];
						for (var u = 0; u < topic.length; u++) {
							sendNow(obj.player.id, topic[u]);
						}
					});
				}
			}
		}
		// for (var i = 0; i < objects.length; i++) {
		// 	var obj = objects[i];

		// }
		// clear the queue
		sendCount = 0;
		//topics["zone1"] = [];
		// TODO: need to clear all channels not just zone1!
		for (var key in topics) {
			topics[key] = [];
		};
	}
}

function queueReceive(player, msg) {
	receiveQueue.push({player: player, msg: msg});
}

function handleReceiveQueue() {
	if (receiveQueue.length > 0) {
		console.log("handling " + receiveQueue.length + " client message(s)");
		receiveQueue.forEach(function(e) {
			handleMessage(e.player, e.msg);
		});
		// clear the queue
		receiveQueue = [];
	}
}

function handleMessage(player, payload) {
	console.log("handling " + payload + " for " + player.name);

	var task;
	var spl = payload.split(",");
	if (spl.length == 0) {
		task = payload;
	}
	else {
		task = spl[0];
	}
	
	switch (task) {
		case "*keepalive":
			var zone = player.name;
			queueSend(zone, "*keepalive,pong!," + Date.parse(new Date().toUTCString()));
			break;
		case "*move":
			// player doesnt hold the vx and vy...its parent gameobject does...
			var obj = player.object;
			obj.vx = parseInt(spl[1]);
			obj.vy = parseInt(spl[2]);
			var zone = "zone1";
			queueSend(zone, "*move," + obj.id + "," + obj.vx + "," + obj.vy + "," + obj.x + "," + obj.y);
			break;
		case "*getdir":
			var zone = player.name;
			queueSend(zone, "*dirlist," + getDir(spl[1]));
			break;
	}
}

function getDir(path) {
	var files = getFiles(path);
	var folders = getDirectories(path);
	//var final = folders.concat(['***']).concat(files);
	var final = folders.join() + '***' + files.join();
	return final;
}

/*==================
	CORE
==================*/

function serverLoop() {
	var now = new Date();
	handleReceiveQueue();
	updateObjects();
	handleSendQueue();
	var elapsed = Math.abs(new Date() - now);
	//console.log("--- " + elapsed + "ms " + outcount + " events in queue");
}

function updateObjects() {
	for (var key in objects) {
		var obj = objects[key];
		if (obj != null) {
			obj.x = obj.x + (obj.vx * obj.speed);
			obj.y = obj.y + (obj.vy * obj.speed);
		}
		// TODO: as an optimization we could build a list of objects who have pending
		//	messages in the queue so that handleSendQueue() can iterate a smaller list
	}
	// for (var i = 0; i < objects.length; i++) {

	// }
}

function createTopic(name) {
	topics[name] = [];
	//ref: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
}

function removeTopic(name) {
	delete topics[name];
}

function getObjectsByTopic(topic) {
	var topicObjects = [];
	var topicObjectsString = "";
	for (var key in objects) {
		var obj = objects[key];
		if (obj != null) {
			if (obj.topics.includes(topic) ) {
				topicObjects.push(obj);
				if (topicObjectsString != "") {topicObjectsString += ",";}
				topicObjectsString += obj.id + "," + obj.name + "," + obj.x + "," + obj.vx + "," + obj.y + "," + obj.vy;
			}
		}
	}
	// for (var i = 0; i < objects.length; i++) {
	// 	var obj = objects[i];

	// }
	return topicObjectsString;
}

function addPlayer(id, client) {
	playerCount++;
	var name = "player" + playerCount;
	console.log(name + " connected");

	// create the player and attach the client info to it
	var player = {};
	player.id = id;
	player.name = name;
	player.client = client;

	// store the player
	players[player.id] = player;

	// create a gameobject for the player
	var obj = createGameObject(name, "zone1");
	obj.player = player;
	player.object = obj;

	// create a topic for this player to receive messages
	createTopic(player.name);

	return player;
}

function removePlayer(player) {
	var name = player.name;
	var cid = player.client.id;
	var oid = player.object.id;
	removeTopic(name);
	//delete objects[oid];
	//objects = objects.splice(oid, 1);
	delete objects[oid];
	delete player.parent;
	delete player.client;
	delete players[name];
	//players = players.splice(players.indexOf(name), 1);
	player = null;
	console.log("removed object " + name);
	// ref: https://stackoverflow.com/questions/742623/deleting-objects-in-javascript
}

function createGameObject(name, sector) {
	objectCount++;

	// create the object
	var obj = {};
	obj.id = "o" + objectCount;
	obj.name = name;
	obj.x = 50;
	obj.vx = 0;
	obj.y = 50;
	obj.vy = 0;
	obj.speed = 3;
	obj.topics = [name, sector, "serverglobal"];
	objects[obj.id] = obj;

	// queue a message to notify others in this sector about the new object
	queueSend(sector, "*create," + obj.id + "," + obj.name + "," + obj.x + "," + obj.vx + "," + obj.y + "," + obj.vy);

	// return the object to the calling function so we can further manipulate it there
	console.log("created object " + obj.name + " with id " + obj.id);
	return obj;
}

/*==================
	HELPERS
==================*/

function isObjectEmpty(obj) {
	if (Object.keys(obj).length === 0 && obj.constructor === Object) {
		return true;
	}
	else {
		return false;
	}
}

/*==================
	API
==================*/

// finally, since nodejs treats these files as commonjs modules, we should define
//	a public api for accessing the objects and variables within this file from
//	the console, cli, or debugger by attaching locals to the global object

global.game = {};
global.game.objects = objects;
global.game.players = players;
global.game.createGameObject = createGameObject;

/*==================*/

// end of file, all funcs/vars should be registered, initialize server


console.log("netcode.js entry point");

ASTRAL.netcode = new function() {
	var connection;
	var onHandlers = [];
	var receiveQueue = [];
	var sendQueue = [];
	var totalIn = 0;
	var totalOut = 0;
	var totalMessages = 0;

	function init() {
		console.log("netcode.js init()");

	}	

	function onHandler(name, func) {
		onHandlers[name] = func;
	}

	function doHandler(name, payload) {
		var func = onHandlers[name];
		if (func) func(payload);
	}

	function connect() {
		var host = "ws://localhost:33333/echo";
		//var host = "ws://172.89.46.7:33333/echo";

		console.log("connecting to host " + host);

		connection = new WebSocket(host);

		connection.onclose = function() {
			ASTRAL.error("Connection to " + host + " failed. Make sure the NodeJS server is running, then reload this page.");
			connection = null;
		}

		connection.onopen = function() {
			console.log("connected successfully");
			doHandler("connect");
			pingTime = Date.parse(new Date().toUTCString());
			queueSend("*keepalive,ping?," + pingTime);
		}

		connection.onerror = function(error) {
			console.log("connection error: " + error);
		}

		connection.onmessage = function(msg) {
			console.log("-> ", msg.data);
			receive(msg.data);
		}
	}

	function sendNow(payload) {
		doHandler("beforesend");
		totalOut++;
		totalMessages++;
		console.log("<-", payload);
		connection.send(JSON.stringify(payload));
		doHandler("aftersend");
	}

	function receive(data) {
		doHandler("beforeReceive");
		totalIn++;
		totalMessages++;
		console.log(totalMessages);
		receiveQueue.push({data: data});
		doHandler("afterreceive");
	}

	function handleReceiveQueue() {
		if (receiveQueue.length > 0) {
			console.log("handling " + receiveQueue.length + " server message(s)");
			receiveQueue.forEach(function(e) {
				handleServerMessage(e.data);
			});
			// clear the queue
			receiveQueue = [];
		}
	}

	function queueSend(payload) {
		sendQueue.push(payload);
	}

	function handleSendQueue() {
		if (sendQueue.length > 0) {
			console.log("sending " + sendQueue.length + " message(s)");
			sendQueue.forEach(function(payload) {
				sendNow(payload);
			});
			// clear the queue
			sendQueue = [];
		}
	}

	function handleServerMessage(payload) {
		console.log("handling", payload);
		var spl = payload.split(",");
		var msgname = spl[0];
		doHandler(msgname, spl.splice(1));
	}

	function getreceiveQueue() {
		return receiveQueue;
	}

	function getNetcodeInfo() {
		var info = "";
		info += totalIn + " in ";
		info += totalOut + " out ";
		info += totalMessages + " tot";
		return info;
	}

	this.init = init;
	this.connect = connect;
	this.sendNow = sendNow;
	this.receive = receive;
	this.getNetcodeInfo = getNetcodeInfo;
	this.handleReceiveQueue = handleReceiveQueue;
	this.queueSend = queueSend;
	this.handleSendQueue = handleSendQueue;
	this.on = onHandler;
	this.do = doHandler;
}
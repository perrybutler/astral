"use strict";
console.log("collider.js entry point");

ASTRAL.components.collider = (function() {

	console.log("collider.js constructor");

	var staticObjects = [];
	var physicsObjects = [];

	function init() {
		// initializes the collider module, this gets called as soon as collider.js is loaded by the browser
		console.log("collider.js init()");

		// hook into the gameLoop to add our functionality
		ASTRAL.on("beforeupdate", function() {
			//console.log("BEFOREUPDATE");
			clearPhysicsObjects();
		});
		ASTRAL.on("afterupdate", function() {
			//console.log("AFTERUPDATE");
			updatePhysicsObjects();
		});
	}

	function instance(obj) {
		var component = {};
		component.type = "collider";
		component.shape = "rectangle";
		component.width = 64;
		component.height = 64;
		//component.preset = // breakout ball, brick, rifle bullet, smg bullet, pistol bullet, sniper bullet, shotput, cannon ball, tennis ball, ping pong ball, basketball, pool ball, crow
		component.static = true // is it a non-moving, impassible wall?
		component.trigger = ""; // should we trigger a custom function on collision?
		component.physics = false; // should the object use a physics simulation?
		component.mass = 60; // a tennis ball is 60 grams, but you can also use arbitrary numbers/units here
		component.stiffness = 10; // how resistant the collider is to buckling under pressure
		component.elasticity = 100; // how easily an object returns to its original shape after buckling under pressure
		component.restitution = 1; // how much the object should slow down each time it collides
		component.maxDeformation = "0.5" // raises an event when this threshold is passed, usually to cause damage to or destroy the object
		component.passableSides = "nsew"; // should the region allow passing thru from a certain side without blocking the object
		component.whitelist = ""; // list of tags this object will collide with, a blank value will collide with everything
		component.blacklist = ""; // list of tags this object will ignore collisions with, a blank value will not ignore anything
		applyRuntimeProps(component);
		return component;
	}

	function applyRuntimeProps(instance) {
		instance.runtime = {};
		instance.runtime.versionMatch = false;
	}

	function update(obj, instance) {
		// gets called every frame, for every gameobject with a collider
		if (instance.static == true || instance.static == "true") {
			staticObjects.push(obj);
		}
		if (instance.physics == true || instance.physics == "true") {
			physicsObjects.push(obj);
		}
	}

	function clearPhysicsObjects() {
		// gets called once after each gameLoop() update()
		staticObjects = [];
		physicsObjects = [];
	}

	function updatePhysicsObjects() {
		// gets called once after each gameLoop() update()
		// update the physics objects
		for (var key in physicsObjects) {
			updatePhysicsObject(physicsObjects[key]);
		}
	}

	function updatePhysicsObject(obj) {
		// see if this physics object intersects any of the static objects
		for (var key in staticObjects) {
			//console.log(key);
			var sobj = staticObjects[key];
			var cLeft = false;
			var cRight = false;
			var cTop = false;
			var cBottom = false;
			var bCollision = false;
			var collision = objectsCollide(obj, sobj);
			if (collision.horz && collision.vert) {
				obj.vx *= collision.reflectX;
				obj.vy *= collision.reflectY;
				console.log("collision", collision);
				ASTRAL.pauseUpdate();
			}
		}
		obj.x += obj.vx * obj.speed // * delta;
		obj.y += obj.vy * obj.speed // * delta;
		obj.runtime.movementUpdated = true;
	}

	function objectsCollide(obj1, obj2) {
		// TODO: finding components and parsing int is just too much crap we dont need to be doing
		//	if we optimize elsewhere
		var c1 = ASTRAL.findComponentByType(obj1, "collider");
		var c2 = ASTRAL.findComponentByType(obj2, "collider");

		var r1 = {
			left: obj1.x,
			top: obj1.y,
			right: obj1.x + parseInt(c1.width),
			bottom: obj1.y + parseInt(c1.height),
			width: parseInt(c1.width),
			height: parseInt(c1.height),
			midX: obj1.x + (parseInt(c1.width) / 2),
			midY: obj1.y + (parseInt(c1.height) / 2),
		}
		var r2 = {
			left: obj2.x,
			top: obj2.y,
			right: obj2.x + parseInt(c2.width),
			bottom: obj2.y + parseInt(c2.height),
			width: parseInt(c2.width),
			height: parseInt(c2.height),
			midX: obj2.x + (parseInt(c2.width) / 2),
			midY: obj2.y + (parseInt(c2.height) / 2),
		}
		//return ASTRAL.intersectRect(r1, r2);
		return ASTRAL.intersectRect2(r1, r2);
	}

	return {
		init:init,
		instance:instance,
		applyRuntimeProps:applyRuntimeProps,
		update:update,
		objectsCollide:objectsCollide,
		updatePhysicsObjects:updatePhysicsObjects,
		updatePhysicsObject:updatePhysicsObject
	}
}());
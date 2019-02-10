ASTRAL.components.text = (function() {
	function instance(obj) {
		var component = {};
		component.type = "text";
		component.text = "Hello World!";
		component.fontSize = 30;
		component.fontFamily = "Arial";
		component.color = "#000";
		component.hoverColor = "#ff0000";
		component.onclick = "";
		return component;
	}
	function update(obj, instance) {
		
	}
	function draw(obj, ctx, instance) {
		ctx.save(); // TODO: save/restore per text object might slow things down later
		ctx.font = instance.fontSize + "px " + instance.fontFamily; 
		var h1 = ctx.measureText("M").width; //parseInt(instance.fontSize); // TODO: computing this every update() is not optimum
		var h2 = parseInt(instance.fontSize);
		obj.width = ctx.measureText(instance.text).width; // TODO: computing this every update() is not optimum...we should keep track of the object's old state since last frame and compare with this frame and detect if text changed and only then compute width
		obj.height = h2;
		if (obj.isMouseOver == true) {
			ctx.fillStyle = instance.hoverColor;
		}
		else {
			ctx.fillStyle = instance.color;
		}
		ctx.fillText(instance.text, obj.x, obj.y + h1);
		ctx.restore();
	}
	return {
		instance:instance,
		update:update,
		draw:draw
	}
}());
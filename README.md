# ASTRAL

A game framework in vanilla JavaScript.

- 2d canvas layers
- Realtime editing
- Lightweight and very fast
- Load resources at runtime with the custom async loader
- Everything is dynamic, no build/compile, minimal tooling
- Minimal runtime dependencies (client: none, server: nodejs, ws)
- Works offline from file:///, embedded on a web page, or Chromium wrapper (included)
- Tiler tool for building tilemaps and animations right in your browser!
- Custom netcode using Nodejs, WebSockets and ws lib, client/server MMORPG zone architecture
- Pub/sub for server topics - system, chat, pm, updates, etc
- Pub/sub for gameobjects - myobj.on("something", handler), myobj.do("something")

![alt text](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/The_Astral_Sleep_-_by_Jeroen_van_Valkenburg.PNG/300px-The_Astral_Sleep_-_by_Jeroen_van_Valkenburg.PNG)

## Tips

- Early development, broken stuff, WIP!
- Load index.html in a web browser to run game/framework
- For Chrome, close all windows then launch w/ chrome.exe --allow-access-from-files
- For Chromium wrapper, make shortcut to RapidNative.exe and include in shortcut: -path [full path to index.html]
- Game will immediately connect to server, make sure to have the server running
- Press tilde/backtick key to toggle realtime editor mode

## Core Design

### The Main Modules

client:

- astral.js - boots everything, handles game loop and canvas layers
- netcode.js - client implementation for the game server
- editor.js - realtime in-game/in-browser game development ide
- spriter.js - sprite animation/tilemap maker

server:

- server.js - tcp pub/sub game server for nodejs, enables full editor functionality

### Async Loader / Modules

When a module (code file) is loaded it gets attached to the global ASTRAL object (window.ASTRAL) which keeps all of our code in one logical spot from which we can access any of the loaded modules, and any properties/methods within those modules which have been set to public. This loader/module design incorporates the bare minimum for speed purposes and it does not conform to CJS or AMD patterns.

Barebones module example:

	ASTRAL.mymodule = new function() {
		var requires = [
			{name: "othermodule", path: "core/othermodule.js"}
		];
		function init() {
			console.log("mymodule.js init()");
		}
		this.init = init;
	}
	
Load the module by calling ASTRAL.load("mymodule.js") or by requiring it in another module's requires array.

What the above module will do when loaded is:

- Call init() as soon as the script gets created in the dom
- Signal to the loader that it should also load othermodule.js
- The loader will load othermodule.js and call init() there if it exists
- We can now access ASTRAL.mymodule and ASTRAL.othermodule from any other module

When all the required modules for astral.js have loaded, astral.js::ready() is called to kickstart the engine.

As stated earlier, this does not conform to CJS or AMD patterns simply because ASTRAL and its components are designed to work in unison rather than be universal tools for any type of project. It simply allows us to break out code into different files for separation of concerns, avoids pollution of the global JS namespace, facilitates non-blocking game resource loading, and cuts down on the number of dependencies. This doesn't mean you can't use CJS or AMD in your ASTRAL projects though.

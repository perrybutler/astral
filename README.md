# ASTRAL

A game framework in vanilla JavaScript.

- 2d canvas layers
- Lightweight and very fast
- Load resources at run-time with the custom async loader
- Everything is dynamic, no build/compile, minimal tooling
- Minimal runtime dependencies (client: none, server: nodejs, ws)
- Works offline from file:///, embedded on a web page, or Chromium wrapper (included)
- Tiler tool for building tilemaps and animations right in your browser!
- Custom netcode using Nodejs, WebSockets and ws lib, client/server MMORPG zone architecture
- Pub/sub for server topics - system, chat, pm, updates, etc
- Pub/sub for gameobjects - myobj.on("something", handler), myobj.do("something")

![alt text](https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/The_Astral_Sleep_-_by_Jeroen_van_Valkenburg.PNG/300px-The_Astral_Sleep_-_by_Jeroen_van_Valkenburg.PNG)

Tips:

- Early development, broken stuff
- Load index.html in a web browser to run it
- For Chrome close all windows then launch w/ --allow-access-from-files
- For Chromium wrapper, make shortcut to RapidNative.exe and include a -path [full path to index.html]

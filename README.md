# ASTRAL

Astral is a combination of my previous game engine projects and UI designs.

Usage:

* Build 2d canvas-based cross-platform HTML5 games
* Design your game with the in-browser editor, or by writing JS code
* Create scenes, prefabs, texture atlases, sprites, animations and more without leaving the browser
* Quickly prototype game ideas, or even apps and diagrams

Architecture:

* Vanilla JavaScript, zero client dependencies
* Modular core with built-in/optional physics, editor, netcode
* Super lightweight and fully dynamic, no build, no transpile, no toolchain
* Entity component system, works similar to Unity
* Components include atlas, image, collider, particle, rigidbody, text, input, custom

*What makes Astral unique?* It comes with a built-in editor. Oh, Unreal had that 20 years ago you say? Not quite :D Imagine starting a game of Unreal, then opening UnrealEd and modifying the game as you're playing it. You can't do that, not even today, 20 years later with Unreal Engine 4. But that's what Astral can do. A single keyboard shortcut will switch between play and edit modes in real-time. This is possible because we are using JavaScript as it was designed - a fully dynamic scripting language - rather than treating JS like a compiled assembly language, which is what most JS game engines and even modern JS frameworks attempt to do. Some engines fractal out into hundreds of files and roll them together with a build process, other engines have all their code in one file. Both methods have their pros and cons. Astral is somewhere in the middle, aiming for a good balance. So that's what sets Astral apart from nearly all other game engines.

**Warning:** this code is pre-alpha and nowhere near production ready. Use at your own risk.

**Disclaimer:** the graphics depicted on this page (in the screen captures) are for demonstration purposes only and remain copyrighted by their respective owners/publishers. Specifically Gravity/Ragnarok Online and Gamesys/Here Be Monsters.

## Updates

### October 6th, 2018

![](https://thumbs.gfycat.com/ShorttermEducatedApisdorsatalaboriosa-size_restricted.gif)

^ Realtime inspector/editor functionality. This is the framework in its most recent state. The graphics used here are CC0/public domain.

### October 5th, 2018

![](https://thumbs.gfycat.com/FocusedEnormousAnemone-size_restricted.gif)

^ Netcode is coming along well. This also shows a Chromium wrapper being used to launch the game like a native Windows app. The wrapper is a custom .NET app with Chromium embedded via CEFsharp lib which will have its own repo and can optionally be bundled with the finished game for a turn-key product, depending on the open-source license constraints.

# History

Building a game engine has been an ongoing learning experiment and hobby project of mine since around the year 2002. My first few engines were done in VB6/VB.NET with DirectX 7/8/9. Here is a quick tour of the whole timeline.

## "Astral" (2018)

After a long hiatus, I returned to this project to continue where I left off, but I wanted to rewrite the code from the ground up and apply what I learned from the previous prototypes. This time around, I tackled the netcode first, so that a client/server model would be part of the core from the very beginning, without having to overhaul a single player engine into a multiplayer one later.

![](https://thumbs.gfycat.com/PreciousMiniatureCorydorascatfish-size_restricted.gif)

^ Multiple clients with a NodeJS socket server sending/receiving messages.

## "vbengine" (2018)

I got burnt out on Rapid Engine and I was sad that I no longer had the old code for my 3d engines, so I decided to fill that gap with a little side project. Here's iosys Engine reborn.

![](https://thumbs.gfycat.com/CoarseFocusedGadwall-small.gif)

^ Yep that's the tiger.x model from the DirectX SDK.

![](https://thumbs.gfycat.com/IndelibleCheeryAdeliepenguin-max-1mb.gif)

^ I never created a terrain system before so here's one! You can load any heightmap image and specify a cell count, then the engine will load that heightmap and chunk it into cells for easy culling later. It was great fun loading heightmaps from other games, or NASA Moon/Mars images, and seeing them as wireframes in my engine that I could explore. WASD + mouse look was functional.

![](https://thumbs.gfycat.com/HilariousCandidEskimodog-size_restricted.gif)

^ Very rudimentary editor inspired by modding Skyrim with Creation Kit. My ideas grew into a 70 page overhaul that couldn't be done in CK :)

Unfortunately gfycat made some of those gifs really bad quality.

## "Rapid Engine" (2013, JavaScript)

Once I had a prototype canvas engine working with Adventure Toolkit, I decided to take things to the next level by doing the Breakouts project and carrying over the inspector/editor ideas from the previous work. And of course, a new name for the engine, this time borrowing its name from a related but not yet integrated project of mine (RapidJS). The last image shows the custom async loader/modules. The graphics used here are public domain.

![](https://thumbs.gfycat.com/CalmReflectingCamel-size_restricted.gif)

^ Showing more of the editor.

![](https://thumbs.gfycat.com/InsidiousLeadingBighorn-size_restricted.gif)

^ Showing some of the editor.

![](https://thumbs.gfycat.com/GrossAgileHippopotamus-size_restricted.gif)

^ Console output of the asynchronous file loader. Not AMD or CommonJS.

## "Adventure Toolkit" (2011, JavaScript)

Very early prototype testing out sprite animations, roaming AI, shadows/opacity, object sorting, collisions and push physics to see what's possible with HTML5 canvas. The inspector/editor thing was an early incantation. (See graphics disclaimer at top of this page)

![](https://thumbs.gfycat.com/HopefulGlaringEeve-size_restricted.gif)

![](https://thumbs.gfycat.com/RequiredAlarmedBanteng-size_restricted.gif)

![](https://thumbs.gfycat.com/YellowishKindheartedCopperhead-size_restricted.gif)

## "Nokia Adventure Game" (2008, Java MIDP 2.0)

It turns out I've been making and scrapping game engines for a while. What can I say? It's fun. This was made many years ago when Nokia phones were the hot ticket. It had a scrolling tiled background and animated sprite character, and ran smoothly on my Nokia 6230. (See graphics disclaimer at top of this page)

![](https://thumbs.gfycat.com/SentimentalNeedyArctichare-size_restricted.gif)

## "iosys Engine" (2001, VB6 / VB.NET)

I used a lot of map editors back in the day to modify and make new content for games, such as Build (Duke Nukem 3D), qeradiant (Quake II), UnrealEd (Unreal) and Hammer (Half-Life), but one particular editor called QuArK is the one that stood out, and that was the inspiration for my first editor.

![](https://thumbs.gfycat.com/ThankfulFastAmericanavocet-small.gif)

^ An in-game screenshot showing what the engine could do. Textures, lighting, fog, transparency, collision detection. You could walk around on the terrain.

![](https://thumbs.gfycat.com/UnlinedGiganticImpala-small.gif)

![](https://thumbs.gfycat.com/ShockingBonyCoelacanth-small.gif)

![](https://thumbs.gfycat.com/PlushOrganicIndianskimmer-small.gif)

![](https://thumbs.gfycat.com/AssuredUnsungAfricanmolesnake-small.gif)

# ASTRAL

Astral is a combination of my previous game engine projects and UI designs.

Usage:

* Build 2d canvas based cross-platform HTML5 games
* Design a game with the in-browser editor, or by writing JS code
* Create scenes, prefabs, texture atlases, sprites, animations and more
* Quickly prototype game ideas, or even apps and diagrams

Architecture:

* Vanilla JavaScript, zero client dependencies
* Modular core with built-in/optional physics, editor, netcode
* Super lightweight and fully dynamic, no build, no transpile, no toolchain
* Entity component system, works similar to Unity
* Components include atlas, image, collider, particle, rigidbody, text, input, custom

**Disclaimer:** the graphics depicted on this page (in the screen captures) are for demonstration purposes only and remain copyrighted by their respective owners/publishers. Specifically Gravity/Ragnarok Online and Gamesys/Here Be Monsters.

## Updates

![](https://thumbs.gfycat.com/ShorttermEducatedApisdorsatalaboriosa-size_restricted.gif)
Realtime inspector/editor functionality. This is the framework in its most recent state. The graphics used here are CC0/public domain.

![](https://thumbs.gfycat.com/FocusedEnormousAnemone-size_restricted.gif)
Netcode is coming along well. This also shows a Chromium wrapper being used to launch the game like a native Windows app. The wrapper is a custom .NET app with Chromium embedded via CEFsharp lib which will have its own repo and can optionally be bundled with the finished game for a turn-key product, depending on the open-source license constraints.

# History

Building a game engine has been an ongoing learning experiment and hobby project of mine since around the year 2002. My first few engines were done in VB6/VB.NET with DirectX 7/8/9. Here is a quick tour of the whole timeline.

## "Astral"

![](https://thumbs.gfycat.com/PreciousMiniatureCorydorascatfish-size_restricted.gif)

After a long hiatus, I returned to this project to continue where I left off, but I wanted to rewrite the code from the ground up and apply what I learned from the previous prototypes. This time around, I tackled the netcode first, so that a client/server model would be part of the core from the very beginning, without having to overhaul a single player engine into a multiplayer one later.

## "vbengine"

I got burnt out on Rapid Engine, and I was sad that I no longer had the old code for my 3d engines, so I decided to fill that gap with a little side project. Here's iosys Engine reborn.

![](https://thumbs.gfycat.com/CoarseFocusedGadwall-small.gif)

![](https://thumbs.gfycat.com/IndelibleCheeryAdeliepenguin-max-1mb.gif)

![](https://thumbs.gfycat.com/HilariousCandidEskimodog-size_restricted.gif)

Unfortunately gfycat made some of those gifs really bad quality.

## "Rapid Engine"

![](https://thumbs.gfycat.com/CalmReflectingCamel-size_restricted.gif)

![](https://thumbs.gfycat.com/InsidiousLeadingBighorn-size_restricted.gif)

![](https://thumbs.gfycat.com/GrossAgileHippopotamus-size_restricted.gif)

Once I had a prototype canvas engine working with Adventure Toolkit, I decided to take things to the next level by doing the Breakouts project and carrying over the inspector/editor ideas from the previous work. And of course, a new name for the engine, this time borrowing its name from a related but not yet integrated project of mine (RapidJS). The last image shows the custom async loader/modules. The graphics used here are public domain.

## "Adventure Toolkit"

![](https://thumbs.gfycat.com/HopefulGlaringEeve-size_restricted.gif)

![](https://thumbs.gfycat.com/RequiredAlarmedBanteng-size_restricted.gif)

![](https://thumbs.gfycat.com/YellowishKindheartedCopperhead-size_restricted.gif)

Very early prototype testing out sprite animations, roaming AI, shadows/opacity, object sorting, collisions and push physics to see what's possible with HTML5 canvas. The inspector/editor thing was an early incantation. (See graphics disclaimer at top of this page)

## "Nokia Adventure Game"

![](https://thumbs.gfycat.com/SentimentalNeedyArctichare-size_restricted.gif)

It turns out I've been making and scrapping game engines for a while. What can I say? It's fun. This was made many years ago when Nokia phones were the hot ticket. It had a scrolling tiled background and animated sprite character, and ran smoothly on my Nokia 6230. (See graphics disclaimer at top of this page)

## "iosys Engine"

I used a lot of map editors back in the day to modify and make new content for games, such as Build (Duke Nukem 3D), qeradiant (Quake II), UnrealEd (Unreal) and Hammer (Half-Life), but one particular editor called QuArK is the one that stood out, and that was the inspiration for my first editor.

![](https://thumbs.gfycat.com/ThankfulFastAmericanavocet-small.gif)

An in-game screenshot showing what the engine could do. Textures, lighting, fog, transparency, collision detection. You could walk around on the terrain.

![](https://thumbs.gfycat.com/UnlinedGiganticImpala-small.gif)

![](https://thumbs.gfycat.com/ShockingBonyCoelacanth-small.gif)

![](https://thumbs.gfycat.com/PlushOrganicIndianskimmer-small.gif)

![](https://thumbs.gfycat.com/AssuredUnsungAfricanmolesnake-small.gif)

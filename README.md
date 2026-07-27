# Multiplayer Fighter (Prototype)

This repository contains a small prototype of a two-player multiplayer fighting game using Phaser 3 for the client and Node.js + socket.io for the server.

Features
- Two-player real-time multiplayer (via socket.io)
- Simple movement, jump, and attack
- Health bars and round end/reset
- Works across devices on the same LAN or on the same computer (two browser windows)

How to run locally
1. Install dependencies

   npm install

2. Start the server

   npm start

3. Open the game in a browser

   http://localhost:3000

To play with another device on your LAN, find the host machine's LAN IP (e.g., 192.168.1.10) and open `http://<HOST_IP>:3000` on the other device. Both clients will be placed into the same match automatically.

Controls
- Move: A / D  (or Arrow Left / Arrow Right)
- Jump: W (or Arrow Up)
- Attack: F (or /)

Notes and next steps
- This is a prototype meant to be simple and easy to run. It uses a trusting model for attacks (clients report collisions). A more robust authoritative server would validate positions and collisions.
- Improvements you can ask for:
  - Better art/sprites and animations
  - Gamepad support
  - Online matchmaking / custom rooms
  - Improved server-side reconciliation and lag compensation
  - Sound effects and music

If you want, I can:
- Add polished pixel-art sprites and animations
- Make the server authoritative to reduce cheating/desyncs
- Add a simple matchmaking UI so you can create/join rooms manually

Enjoy — let me know which improvements you'd like next.

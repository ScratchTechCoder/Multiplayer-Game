// public/game.js
(() => {
  const socket = io();
  let playerIndex = null;
  let roomId = null;

  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    backgroundColor: '#1a1a1a',
    parent: 'game-container',
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 1000 }, debug: false }
    },
    scene: { preload, create, update }
  };

  let game, selfSprite, oppSprite, cursors, keys;
  let canJump = false;
  let sendStateTimer = 0;
  let myHealth = 100, oppHealth = 100;

  socket.on('init', (data) => {
    playerIndex = data.playerIndex;
    roomId = data.roomId;
    document.getElementById('status').innerText = `Connected as player ${playerIndex + 1} in ${roomId}`;
    game = new Phaser.Game(config);
  });

  socket.on('opponent-state', (data) => {
    // data contains playerIndex and pos/flip
    const idx = data.playerIndex;
    // only update opponent (the other index)
    if (game && oppSprite && idx !== playerIndex) {
      // smooth update
      oppSprite.x = data.x;
      oppSprite.y = data.y;
      oppSprite.flipX = !!data.flipX;
    }
  });

  socket.on('health-update', (data) => {
    const hs = data.healths || [100,100];
    myHealth = hs[playerIndex];
    oppHealth = hs[playerIndex === 0 ? 1 : 0];
    updateHealthBars();
  });

  socket.on('round-end', (data) => {
    const winner = data.winner;
    const text = (winner === playerIndex) ? 'You win!' : 'You lose!';
    document.getElementById('status').innerText = `${text} Waiting to reset...`;
  });

  socket.on('player-left', (data) => {
    document.getElementById('status').innerText = 'Opponent left. Waiting for player...';
  });

  function preload() {}

  function create() {
    const scene = this;

    // ground
    const ground = this.add.rectangle(400, 460, 1600, 40, 0x3d3d3d);
    this.physics.add.existing(ground, true);

    // players
    const startX = playerIndex === 0 ? 200 : 600;
    const oppX = playerIndex === 0 ? 600 : 200;

    selfSprite = this.add.rectangle(startX, 380, 40, 64, 0x00aaff);
    oppSprite = this.add.rectangle(oppX, 380, 40, 64, 0xff9933);

    this.physics.add.existing(selfSprite);
    this.physics.add.existing(oppSprite);
    selfSprite.body.setCollideWorldBounds(true);
    oppSprite.body.setCollideWorldBounds(true);

    // make opponent immovable from physics perspective; we'll control its position
    oppSprite.body.setAllowGravity(false);
    oppSprite.body.setImmovable(true);

    this.physics.add.collider(selfSprite, ground);

    // controls
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      F: Phaser.Input.Keyboard.KeyCodes.F,
      SLASH: Phaser.Input.Keyboard.KeyCodes.SLASH
    });

    // simple camera
    this.cameras.main.setBackgroundColor('#222');

    // send periodic state to server
    scene.time.addEvent({ delay: 50, loop: true, callback: () => {
      if (!selfSprite) return;
      socket.emit('state', { x: selfSprite.x, y: selfSprite.y, flipX: selfSprite.flipX });
    }});

    updateHealthBars();
  }

  function updateHealthBars() {
    const myBar = document.getElementById('myBar');
    const oppBar = document.getElementById('oppBar');
    myBar.style.width = Math.max(0, (myHealth / 100) * 100) + '%';
    oppBar.style.width = Math.max(0, (oppHealth / 100) * 100) + '%';
  }

  function update(time, delta) {
    if (!selfSprite) return;
    const body = selfSprite.body;

    // input mapping: both key sets supported. Player on a device controls their own client instance.
    let left = keys.A.isDown || cursors.left.isDown;
    let right = keys.D.isDown || cursors.right.isDown;
    let jump = keys.W.isDown || cursors.up.isDown;
    let attackPressed = Phaser.Input.Keyboard.JustDown(keys.F) || Phaser.Input.Keyboard.JustDown(keys.SLASH);

    if (left) {
      body.setVelocityX(-220);
      selfSprite.flipX = true;
    } else if (right) {
      body.setVelocityX(220);
      selfSprite.flipX = false;
    } else {
      body.setVelocityX(0);
    }

    if (jump && body.onFloor()) {
      body.setVelocityY(-420);
    }

    if (attackPressed) {
      // check overlap with opponent
      const sRect = selfSprite.getBounds();
      const oRect = oppSprite.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(sRect, oRect)) {
        socket.emit('attack');
      }
    }

    // Smoothly interpolate opponent Y if needed (server updates set it directly)
    // (No extra code needed here since we set oppSprite.x/y on incoming messages.)
  }
})();

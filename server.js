const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
let nextRoomId = 1;
const rooms = {}; // roomId -> { players: [socketId...], healths: [100,100] }

function findOrCreateRoom() {
  for (const id in rooms) {
    if (rooms[id].players.length < 2) return id;
  }
  const id = 'room' + (nextRoomId++);
  rooms[id] = { players: [], healths: [100, 100] };
  return id;
}

io.on('connection', (socket) => {
  const roomId = findOrCreateRoom();
  const room = rooms[roomId];
  room.players.push(socket.id);
  const playerIndex = room.players.indexOf(socket.id);
  socket.join(roomId);

  socket.emit('init', { playerIndex, roomId, health: room.healths[playerIndex] });
  socket.to(roomId).emit('player-joined', { playerIndex });

  console.log('socket connected', socket.id, '->', roomId, 'as', playerIndex);

  socket.on('state', (data) => {
    // relay this player's state to the other player in the same room
    socket.to(roomId).emit('opponent-state', { playerIndex, ...data });
  });

  socket.on('attack', () => {
    // naive server-side health management: apply damage to opponent
    const targetIndex = playerIndex === 0 ? 1 : 0;
    if (!room) return;
    room.healths[targetIndex] -= 10;
    if (room.healths[targetIndex] < 0) room.healths[targetIndex] = 0;

    io.to(roomId).emit('health-update', { healths: room.healths });

    if (room.healths[targetIndex] === 0) {
      io.to(roomId).emit('round-end', { winner: playerIndex });
      // reset after a short delay
      setTimeout(() => {
        if (!rooms[roomId]) return;
        rooms[roomId].healths = [100, 100];
        io.to(roomId).emit('health-update', { healths: rooms[roomId].healths });
      }, 3000);
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnect', socket.id);
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
      socket.to(roomId).emit('player-left', { playerIndex });
      if (rooms[roomId].players.length === 0) delete rooms[roomId];
    }
  });
});

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

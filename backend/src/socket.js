// Shared Socket.IO setup — used for both chat messages and live notifications.
// Pulled out of server.js so routes (e.g. orders) can push events to a user
// without needing access to the raw `io`/`onlineUsers` internals.

let ioInstance = null;
const onlineUsers = {}; // userId -> socketId

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('user_online', (userId) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on('send_message', (data) => {
      // data = { senderId, receiverId, message }
      const receiverSocketId = onlineUsers[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', data);
      }
    });

    socket.on('disconnect', () => {
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          break;
        }
      }
    });
  });
}

// Push a real-time event to one user, if they're currently connected.
// Safe to call even if the user is offline — it just won't emit anything;
// they'll still see it next time they load their notifications from the API.
function emitToUser(userId, event, payload) {
  const socketId = onlineUsers[userId];
  if (ioInstance && socketId) {
    ioInstance.to(socketId).emit(event, payload);
  }
}

// Push a real-time event to every currently connected client — used for
// things like stock changes, where any shopkeeper browsing the catalog
// (not just one specific user) needs to see the update live.
function broadcast(event, payload) {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
}

module.exports = { initSocket, emitToUser, broadcast };

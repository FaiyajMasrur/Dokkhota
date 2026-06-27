// Socket.IO event handler for Dokkhota real-time features
module.exports = (io, socket) => {
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};

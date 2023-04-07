const io = require('socket.io');

const socketConnections = [];

function initSocket(server) {
    const socketServer = new io.Server(server);

    socketServer.on('connection', (socket) => {
        socket.on('enterSocket', userId => {
            const socketInstance = { socket: socket, _id: userId };

            const connection = socketConnections.find(si => si._id === userId);

            if (connection !== null) {
                socketConnections.splice(socketConnections.indexOf(connection));
            }

            socketConnections.push(socketInstance);

            emitEvent(userId, "socketEntered", { isSuccess: true})
        });
    });
}

function emitEvent(userId, eventName, data) {
    const socketConnection = socketConnections.find(connection => connection._id === userId);

    if (!socketConnection) {
        return;
    }

    socketConnection.socket.emit(eventName, data);
}

module.exports = {
    initSocket, emitEvent
}

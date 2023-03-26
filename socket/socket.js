const express = require('express');
const http = require('http');
const server = http.createServer(express());
const io = require('socket.io')(server);

let socketConnections = []

function init(callback) {
    io.on('connection', (socket) => {
        socket.on('enterSocket', userId => {
            callback(userId)
            const socketInstance = {socket: socket, _id: userId}

            const connection = socketConnections.find(si => si._id === userId)
            if (connection != null) {
                socketConnections.splice(socketConnections.indexOf(connection))
            }

            socketConnections.push(socketInstance);
            addListeners(socketInstance)
        });
    });
}

function addListeners(socketInstance) {
    const socket = socketInstance.socket
    socket.on('test', (data) => {
        emitEvent(socketInstance._id, 'newTripRequested', "sadf");
    });
}

function emitEvent(userId, eventName, data) {
    const socket = socketConnections.find(connection => connection._id === userId).socket;
    socket.emit(eventName, data);
}

module.exports = {
    init, emitEvent
}

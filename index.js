const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors'); // Import cors module
const PORT = process.env.PORT || 5000
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connect', (socket) => {
    console.log(socket.id)
    socket.on('join', ({ name, room }, callback) => {
        console.log(name)
        console.log(room)
        const { error, user } = addUser({ id: socket.id, name, room });
        
        if(error) return callback(error);
        
        socket.join(user.room);
        
        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });
        
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        
        callback();
    });
    
    socket.on('sendMessage', (message, callback) => {
        console.log('ID DOS',socket.id)
        const user = getUser(socket.id);
        console.log('SHOW ME THE GUY',user)
  
      io.to(user.room).emit('message', { user: user.name, text: message });
  
      callback();
    });
  
    socket.on('disconnect', () => {
      const user = removeUser(socket.id);
  
      if(user) {
        io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
      }
    })
  });

io.engine.on('headers', (headers) => {
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST';
    headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
});

app.use(cors()); // Enable CORS for all routes
app.use(router);

server.listen(PORT, ()=> console.log(`server has started on port ${PORT}`));
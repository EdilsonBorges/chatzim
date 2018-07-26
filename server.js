const express = require('express');
const path = require('path');
const mongo = require('mongodb').MongoClient;

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
  res.render('index.html');
});

let numUsers = 0;
let messages = [];
let arUsuariosConectados = [];
let sync = false;
let socketObj;

mongo.connect('mongodb://127.0.0.1:27017', { useNewUrlParser: true }, (err, db) => {
  handleError(err);
  let dbo = db.db('chat-socket-io');
  let dbChat = dbo.collection('chats', (err) => handleError(err));
  io.on('connection', socket => {
    numUsers++;
    console.log(`Socket conectado:  ${socket.id} (${numUsers})`);
    getPreviousMessages(messages, dbChat);
    socket.emit('previousMessages', messages);
    socket.on('userConnected', e => handleUserConnected(e, socket));
    socket.on('sendMessage', data => handleSendMessage(data, dbChat, socket));
    socket.on('disconnect', () => handleUserDisconnected(socket));
  });
});

function getPreviousMessages(messages, dbChat) {
  if (!sync) {
    dbChat.find({}).sort({_id:-1}).limit(150).toArray((err, res) => {
      handleError(err);
        res.reverse();
        res.forEach(data => {
          messages.push(data);
        });
        sync = true;
    });
  }
}

function handleError(err) {
  if (err) {
    throw err;
  }
}

function handleUserConnected(user, socket) {
  let boSynced = false;
  socketObj = {
    ...user,
    socketId: socket.id,
    numUsers: numUsers,
  }
  arUsuariosConectados.forEach(value => {
    if (value.idPessoa === socketObj.idPessoa) {
      boSynced = true;
    }
  });
  if (boSynced === false) {
    arUsuariosConectados.push(socketObj);
  }
  socket.emit('users', arUsuariosConectados);
  socket.broadcast.emit('users', arUsuariosConectados);
  socket.emit('numUsers', numUsers);
  socket.broadcast.emit('numUsers', numUsers);
}

function findIdPessoaBySocket(socketId) {
  let idPessoa;
  arUsuariosConectados.forEach(value => {
    if (socketId === value.socketId) {
      idPessoa = value.idPessoa;
    }
  });
  return idPessoa;
}

function handleUserDisconnected(socket) {
  numUsers--;
  idPessoa = findIdPessoaBySocket(socket.id);
  arUsuariosConectados.forEach((value, key) => {
    if (value.idPessoa === idPessoa) {
      arUsuariosConectados.splice(key,1);
    }
  });
  socket.broadcast.emit('users', arUsuariosConectados);
  socket.broadcast.emit('numUsers', numUsers);
}

function handleSendMessage(data, dbChat, socket) {
  let messageObj = {
    socketId: socket.id,
    author: data.author,
    message: data.message,
    color: data.color,
    idPessoa: data.idPessoa,
    date: data.date,
  };
  messages.push(messageObj);
  dbChat.insert(messageObj, (err) => {
    if (err) throw err;
  });
  socket.broadcast.emit('receivedMessage', data);
}

server.listen(3000);
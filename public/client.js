var socket = io();
let username;
let arUsuarios = [];
var COLORS = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];
var USERNAMES = [
  { idPessoa: '40283', name: 'Allan', color: '#5cd423' },
  { idPessoa: '12328', name: 'João', color: '#e21400' },
  { idPessoa: '23234', name: 'Pedro', color: '#91580f' },
  { idPessoa: '34234', name: 'Marcos', color: '#f8a700' },
  { idPessoa: '52462', name: 'Otávio', color: '#f78b00' },
  { idPessoa: '46645', name: 'Rogério', color: '#58dc00' },
  { idPessoa: '67567', name: 'Arthur', color: '#287b00' },
  { idPessoa: '84563', name: 'Carlos', color: '#a8f07a' },
  { idPessoa: '37334', name: 'Ricardo', color: '#4ae8c4' },
  { idPessoa: '96756', name: 'Roberto', color: '#3b88eb' },
  { idPessoa: '35735', name: 'Matheus', color: '#3824aa' },
  { idPessoa: '13466', name: 'Rubens', color: '#a700ff' },
  { idPessoa: '23624', name: 'Igor', color: '#d300e7' }
];

const setUserWorkspace = () => {
  username = getRandomUsername();
  if (username) {
    color = username.color;
    $('input[name=username]').val(username.name).attr('disabled','disabled');
    $('input[id=id_pessoa]').val(username.idPessoa);
    socket.emit('userConnected', username);
  } else {
    color = getRandomColor();
  }
}

const getRandomUsername = () => {
  return USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
}

const getRandomColor = () => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const getUsernameColor = () => {
  var hash = 7;
  for (var i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + (hash << 5) - hash;
  }
  var index = Math.abs(hash % COLORS.length);
  return COLORS[index];
}

function renderMessage(message) {
  time = moment(message.date).format('HH:mm');
  date = moment(message.date).format('L');
  message.message = message.message.replace(/<iframe(.*)<\/iframe>/gm,"-");
  //  message.message = message.message.replace(/(<([^>]+)>)/ig,"");
  $('.messages')
    .append('<div class="message">' +
              '<div class="avatar-author" style="background-color: ' + message.color + '">'+ message.author.charAt(0) + '</div>' +
              '<div style="width:97%">' +
                '<div class="message-author">' +
                  '<strong style="color: ' + message.color + '">' + message.author + '</strong> ' +
                  '<div class="tooltip">' + time + '<span class="tooltiptext">'+time+', em '+date+'</span></div><span class="date-formatted"></span>' +
                '</div>' +
                '<div class="message-content"><p style="word-wrap: break-word;width: 99%;text-align: justify;">' + message.message + '</p></div>' +
              '</div>' +
          '</div>');
  $('.messages').scrollTop($('.messages').height()*100);
}

socket.on('receivedMessage', messages => {
  renderMessage(messages);
});

socket.on('previousMessages', messages => {
  for (message of messages) {
    renderMessage(message);
  }
});

socket.on('numUsers', numUsers => {
  $('.header span').text(numUsers);
});

socket.on('users', data => {
  $('.list-users ul').html('');
  USERNAMES.forEach(u => {
    boOnline = false;
    data.forEach(user => {
      if (user.idPessoa === u.idPessoa) {
        boOnline = true;
        $('.list-users ul').append(`<li><div class="status-online"></div>${u.name}</li>`);
      }
    });
    if (!boOnline) {
      $('.list-users ul').append(`<li><div class="status-offline"></div>${u.name}</li>`);
    }
  });
});

$("#chat").submit((e) => {
  e.preventDefault();
  var author = $('input[name=username]').val();
  var message = $('input[name=message]').val();
  var idPessoa = $('input[id=id_pessoa]').val();

  if (author.length && message.length && message.length <= 4000) {
    var messageObject = {
      author: author,
      message: message,
      color: color,
      idPessoa: idPessoa,
      date: new Date(),
    };
    renderMessage(messageObject);
    socket.emit('sendMessage', messageObject);
    $('input[name=message]').val('');
  }
});

setUserWorkspace();
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


var rooms = {};
var users = {};

io.on('connection', function (socket) {

	
	socket.on("login",function (username){
		if(!users[username]){
			socket.username=username;
			users[username]=socket;
			socket.emit("logedin");
			console.log(socket.username +"登录服务器");
		}
	});
	
	socket.on('joinRoom', function (roomName) {

		if (!rooms[roomName]) {
		  rooms[roomName] = [];
		}
		// if(rooms[roomName].length > 1){
			// socket.emit("roomFull",roomName);
		// }else{
			if(rooms[roomName].indexOf(socket.username)==-1){
				rooms[roomName].push(socket.username);
				socket.join(roomName); 
				io.sockets.in(roomName).emit('joinedRoom', socket.username, roomName, rooms[roomName]);  
				console.log(socket.username +"加入了"+ roomName+",房间用户："+ rooms[roomName]);
			}
			
		//}

	});

  socket.on('leaveRoom', function (roomName) {
	if (rooms[roomName]){
		var index = rooms[roomName].indexOf(socket.username);
		if ( index !== -1) {
			rooms[roomName].splice(index, 1);
			socket.leave(roomName);
			io.sockets.in(roomName).emit('leftRoom', socket.username, roomName, rooms[roomName]); 
			console.log(socket.username +"离开了"+ roomName+",剩余用户："+ rooms[roomName]);
		}
	}
  });
  
  socket.on('messageToRoom', function (roomName, content) {
	if (rooms[roomName]){
		var index = rooms[roomName].indexOf(socket.username);
		if ( index !== -1) {
			io.sockets.in(roomName).emit('gotMessageToRoom', socket.username, roomName, content); 
			console.log(socket.username +"对"+ roomName+"中人说："+ content);
		}
	}
  });
  
  socket.on('messageToAll', function (content) {

		io.sockets.emit('gotMessageToAll', socket.username, content); 
		console.log(socket.username +"对所有人说："+ content);

  });
  
   socket.on('messageToUser', function (user, content) {
		if(users[user]){
			io.to(users[user].id).emit('gotMessageToMe', socket.username, content); 
			console.log(user +"对"+socket.username +"说："+ content);
		}else{
			socket.emit("err","no such user");
		}
		

  });

  socket.on('disconnect', function () {
	Object.keys(rooms).forEach(function(key){
		var index = rooms[key].indexOf(socket.username);
		if (index !== -1) {
			rooms[key].splice(index, 1);
			socket.leave(key);
			io.sockets.in(key).emit('leftRoom', socket.username, key, rooms[key]);
		}
	});
	delete users[socket.username];
	//io.sockets.emit('disconnect');
	console.log(socket.username + '断开连接');
   
   
  });



});
http.listen(port, function(){
  console.log('listening on *:' + port);
});
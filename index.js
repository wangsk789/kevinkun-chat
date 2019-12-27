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
			var data ={}
			data.username = socket.username;
			socket.emit("logedin",data);
			console.log(socket.username +"登录服务器");
		}
	});
	
	socket.on('joinRoom', function (roomName) {

		if (!rooms[roomName]) {
		  rooms[roomName] = [];
		}
		 if(rooms[roomName].length > 1){
			 var data ={}
				data.roomname = roomName;
			 socket.emit("roomFull",data);
		 }else{
			if(rooms[roomName].indexOf(socket.username)==-1){
				rooms[roomName].push(socket.username);
				socket.join(roomName); 
				var data ={}
				data.username = socket.username;
				data.roomname = roomName;
				data.userlist = rooms[roomName];
				io.sockets.in(roomName).emit('joinedRoom', data);  
				console.log(socket.username +"加入了"+ roomName+",房间用户："+ rooms[roomName]);
			}
			
		}

	});

  socket.on('leaveRoom', function (roomName) {
	if (rooms[roomName]){
		var index = rooms[roomName].indexOf(socket.username);
		if ( index !== -1) {
			rooms[roomName].splice(index, 1);
			socket.leave(roomName);
			var data ={}
				data.username = socket.username;
				data.roomname = roomName;
				data.userlist = rooms[roomName];
			io.sockets.in(roomName).emit('leftRoom', data); 
			console.log(socket.username +"离开了"+ roomName+",剩余用户："+ rooms[roomName]);
		}
	}
  });
  
  socket.on('messageToRoom', function (roomName, content) {
	if (rooms[roomName]){
		var index = rooms[roomName].indexOf(socket.username);
		if ( index !== -1) {
			var data ={}
				data.username = socket.username;
				data.roomname = roomName;
				data.content = content;
			io.sockets.in(roomName).emit('gotMessageToRoom', data); 
			console.log(socket.username +"对"+ roomName+"中人说："+ content);
		}
	}
  });
  
  socket.on('messageToAll', function (content) {
		var data ={}
				data.username = socket.username;
				data.content = content;
		io.sockets.emit('gotMessageToAll', data); 
		console.log(socket.username +"对所有人说："+ content);

  });
  
   socket.on('messageToUser', function (user, content) {
		if(users[user]){
			var data ={}
				data.username = socket.username;
				data.content = content;
			io.to(users[user].id).emit('gotMessageToMe', data); 
			console.log(user +"对"+socket.username +"说："+ content);
		}else{
			var data ={}
				data.error = "no such user";

			socket.emit("err",data);
		}
		

  });

  socket.on('disconnect', function () {
	Object.keys(rooms).forEach(function(key){
		var index = rooms[key].indexOf(socket.username);
		if (index !== -1) {
			rooms[key].splice(index, 1);
			socket.leave(key);
			var data ={}
				data.username = socket.username;
				data.roomname = roomName;
				data.userlist = rooms[key];
			io.sockets.in(key).emit('leftRoom',data);
		}
	});
	
	console.log(socket.username + '断开连接');
	delete users[socket.username];
	//io.sockets.emit('disconnect');
	
   
   
  });



});
http.listen(port, '192.168.0.103',function(){
  console.log('listening on *:' + port);
});
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 5050;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


var rooms = {};
var users = {};
var numUsers=0;

io.on('connection', function (socket) {

	
	socket.on("login",function (username){
		if(!users[username]){
			socket.username=username;
			users[username]=socket;
			++numUsers;
			var data ={};
			data.username = socket.username;
			data.numusers=numUsers;
			socket.emit("logedin",data);
			socket.broadcast.emit("otherLogedin",data);
			console.log(socket.username +"登录服务器,人数"+numUsers);
		}else{
				socket.emit("err","duplicate username");
			}
	});
	
	socket.on('joinRoom', function (roomName) {

		if (!rooms[roomName]) {
		  rooms[roomName] = [];
		}
		 // if(rooms[roomName].length > 1){
			 // var data ={}
				// data.roomname = roomName;
			 // socket.emit("roomFull",data);
		 // }else{
			if(rooms[roomName].indexOf(socket.username)==-1){
				rooms[roomName].push(socket.username);
				socket.join(roomName); 
				var data ={};
				data.username = socket.username;
				data.roomname = roomName;
				data.userlist = rooms[roomName];
				socket.emit("joinedRoom",data);
				socket.broadcast.in(roomName).emit('otherJoinedRoom', data);  
				
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
			var data ={};
			data.username = socket.username;
			data.roomname = roomName;
			data.userlist = rooms[roomName];
			io.sockets.in(roomName).emit('otherLeftRoom', data); 
			console.log(socket.username +"离开了"+ roomName+",剩余用户："+ rooms[roomName]);
		}else{
			socket.emit("err","no such room or not in it");
		}
	}else{
			socket.emit("err","no such room or not in it");
	}
  });
  
  socket.on('roomMessage', function (roomName, content) {
	if (rooms[roomName]){
		var index = rooms[roomName].indexOf(socket.username);
		if ( index !== -1) {
			var data ={};
			data.username = socket.username;
			data.roomname = roomName;
			data.content = content;
			socket.broadcast.in(roomName).emit('gotRoomMessage', data); 
			console.log(socket.username +"对"+ roomName+"中人说："+ content);
		}else{
			socket.emit("err","no such room or not in it");
		}
	}else{
			socket.emit("err","no such room or not in it");
	}
  });
  
  socket.on('publicMessage', function (content) {
		var data ={};
		data.username = socket.username;
		data.content = content;
		socket.broadcast.emit('gotPublicMessage', data); 
		console.log(socket.username +"对所有人说："+ content);

  });
  
   socket.on('privateMessage', function (user, content) {
		if(users[user]){
			var data ={};
			data.username = socket.username;
			data.content = content;
			io.to(users[user].id).emit('gotPrivateMessage', data); 
			console.log(user +"对"+socket.username +"说："+ content);
		}else{
			socket.emit("err","no such user");
		}
		

  });

  socket.on('disconnect', function () {
	if(!socket.username){return;}
	Object.keys(rooms).forEach(function(key){
		var index = rooms[key].indexOf(socket.username);
		if (index !== -1) {
			rooms[key].splice(index, 1);
			socket.leave(key);
			var data ={};
			data.username = socket.username;
			data.roomname = key;
			data.userlist = rooms[key];
			io.sockets.in(key).emit('otherLeftRoom',data);
		}
	});
	--numUsers;
	var data ={};
	data.username = socket.username;
	data.numusers=numUsers;
	socket.broadcast.emit('otherLogedout',data);
	console.log(socket.username + '断开连接,剩余人数'+numUsers,);
	delete users[socket.username];
   
   
  });



});
http.listen(port, function(){
  console.log('listening on *:' + port);
});
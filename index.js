var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


var roomInfo = {};


io.on('connection', function (socket) {

  var roomID = '';   
  var user = '';
	var isInRoom = false;
  socket.on('join', function (roomName, userName) {
    user = userName;
	roomID = roomName;
	
    // 将用户昵称加入房间名单中
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = [];
    }
	if(roomInfo[roomID].length > 1){
		socket.emit("roomFull",roomID);
	}else{
		roomInfo[roomID].push(user);
		socket.join(roomID); 
		isInRoom = true;
		
		socket.emit("joinedRoom",roomInfo[roomID]);
		socket.broadcast.to(roomID).emit('otherJoinedRoom', user, roomInfo[roomID]);  
		console.log(user + '加入了' + roomID);
	}
    
  });

  socket.on('leave', function () {
     // 从房间名单中移除
	if(!isInRoom){
		 return false;
	}
    var index = -1;
	if (roomInfo[roomID]){
		var index = roomInfo[roomID].indexOf(user);
	}

    if (index !== -1) {
      roomInfo[roomID].splice(index, 1);
    }
	isInRoom =false;
    socket.leave(roomID);    // 退出房间
    socket.broadcast.to(roomID).emit('otherLeftRoom', user, roomInfo[roomID]); 
    console.log(user + '退出了' + roomID);
  });

  socket.on('disconnect', function () {
    // 从房间名单中移除
	if(!isInRoom){
		 return false;
	}
    var index = -1;
	if (roomInfo[roomID]){
		var index = roomInfo[roomID].indexOf(user);
	}

    if (index !== -1) {
      roomInfo[roomID].splice(index, 1);
    }
	isInRoom =false;
    socket.leave(roomID);    // 退出房间
    socket.broadcast.to(roomID).emit('otherLeftRoom', user, roomInfo[roomID]); 
    console.log(user + '退出了' + roomID);
  });


  socket.on('message', function (eventName, eventMessage) {
	if(!isInRoom){
		 return false;
	}
    // 验证如果用户不在房间内则不给发送
    if (roomInfo[roomID].indexOf(user) === -1) {  
      return false;
    }
    io.to(roomID).emit('message', user, eventName, eventMessage);
  });

});
http.listen(port, function(){
  console.log('listening on *:' + port);
});
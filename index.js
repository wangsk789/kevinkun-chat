
var io = require('socket.io')(3000);

var roomInfo = {};

io.on('connection', function (socket) {

  var roomID = '';   
  var user = '';

  socket.on('join', function (roomName, userName) {
    user = userName;
	roomID = roomName;
	
    // 将用户昵称加入房间名单中
    if (!roomInfo[roomID]) {
      roomInfo[roomID] = [];
    }
    roomInfo[roomID].push(user);
    socket.join(roomID);    // 加入房间
	
    // 通知用户已经加入
	socket.emit("joinedRoom",roomInfo[roomID]);
    // 通知房间内其它人员
    socket.broadcast.to(roomID).emit('otherJoinedRoom', user, roomInfo[roomID]);  
    console.log(user + '加入了' + roomID);
  });

  socket.on('leave', function () {
     // 从房间名单中移除
    var index = -1;
	if (roomInfo[roomID]){
		var index = roomInfo[roomID].indexOf(user);
	}

    if (index !== -1) {
      roomInfo[roomID].splice(index, 1);
    }

    socket.leave(roomID);    // 退出房间
    socket.broadcast.to(roomID).emit('otherLeftRoom', user, roomInfo[roomID]); 
    console.log(user + '退出了' + roomID);
  });

  socket.on('disconnect', function () {
    // 从房间名单中移除
    var index = -1;
	if (roomInfo[roomID]){
		var index = roomInfo[roomID].indexOf(user);
	}

    if (index !== -1) {
      roomInfo[roomID].splice(index, 1);
    }

    socket.leave(roomID);    // 退出房间
    socket.broadcast.to(roomID).emit('otherLeftRoom', user, roomInfo[roomID]); 
    console.log(user + '退出了' + roomID);
  });


  socket.on('message', function (eventName, eventMessage) {
    // 验证如果用户不在房间内则不给发送
    if (roomInfo[roomID].indexOf(user) === -1) {  
      return false;
    }
    io.to(roomID).emit('message', user, eventName, eventMessage);
  });

});

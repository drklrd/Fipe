var app = require('http').createServer();
var io = require('socket.io')(app);

app.listen(8080,function(){
	console.log('Socket server running graciously at 8080 port')
});

io.on('connection', function (socket) {
  socket.on('newUrl',function(data){
  	socket.broadcast.emit('tryDownloadingThis',{data:data});
  })
});
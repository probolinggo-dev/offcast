const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app).listen(3001);
const io = require('socket.io').listen(server);
const os = require('os');
let broadcasterExist = false;
const ifaces = os.networkInterfaces();


app.use(express.static(__dirname + '/build'));

app.get('*', function(req, res){
  res.sendFile(__dirname + '/build/index.html');
});

io.on('connection', function(socket){
  socket.on('stream', function(event) {
    io.emit('stream', event);
  })

  socket.on('caston', () => broadcasterExist = true);
  socket.on('castoff', () => broadcasterExist = false);
  socket.on('isAbleToBroadcast', () => {
    io.emit('isAbleToBroadcast', !broadcasterExist);
  });

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;
  
    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
  
      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log(ifname + ':' + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        io.emit('joinurl', (iface.address || '').concat(':3001'))
      }
      ++alias;
    });
  });
});
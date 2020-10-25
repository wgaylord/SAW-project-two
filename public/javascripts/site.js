//var socket = io.connect('/');

//socket.on('message', function(data) {
//  console.log('Message received: ' + data);
//});

var namespace = io.connect('/' + NAMESPACE);
namespace.on('message', function(data) {
  console.log('Message recieved: ' + data);
});

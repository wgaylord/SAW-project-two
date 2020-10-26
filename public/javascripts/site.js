//var socket = io.connect('/');

//socket.on('message', function(data) {
//  console.log('Message received: ' + data);
//});

var namespace = io.connect('/' + NAMESPACE);
namespace.on('message', function(data) {
  console.log('Message recieved: ' + data);
});

// Placing the red + black pieces on the checkerboard
// This is only a beta test function for now
var board = {
  red: ['A1','A3','B2','B4'],
  black: ['C2','C4','D1', 'D3'],
}

// This is how we keep track of which checker pieces have been removed from the checkerboard
// var score = {
// 
// }

board.freeze();
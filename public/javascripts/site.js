
var namespace = io.connect('/' + NAMESPACE);
sc.on('message', function(data) {
  console.log('Message recieved: ' + data);
});

// Track client states
var clientIs = {
  makingOffer: false,
  ignoringOffer: false,
  polite: false
}

var rtc_config = null;
var pc = new RTCPeerConnection(rtc_config);

// Let's handle video streams...
// Set up simple media_constraints
var media_constraints = { video: true, audio: false };
// Handle self video
var selfVideo = document.querySelector('#self-video');
var selfStream = new MediaStream();
selfVideo.srcObject = selfStream;
// Handle peer video
var peerVideo = document.querySelector('#peer-video');
var peerStream = new MediaStream();
peerVideo.srcObject = peerStream;

// Handle the start of media streaming
async function startStream() {
  try {
    var stream = await navigator.mediaDevices.getUserMedia(media_constraints);
    for (var track of stream.getTracks()) {
      pc.addTrack(track);
      // Future improvement (I think)
      // selfStream.addTrack(track);
    }
    // TODO: Use the tracks here
    selfVideo.srcObject = stream;
  } catch(error) {
    console.error(error);
  }
}

// Listen for and attach any peer tracks
pc.ontrack = function(track) {
  peerStream.addTrack(track.track);
}

// Call/answer button
var callButton = document.querySelector('#call-button');
callButton.addEventListener('click', startCall);

function startCall() {
  console.log('This is the calling side of the connection...');
  callButton.hidden = true;
  clientIs.polite = true;
  sc.emit('calling');
  startStream();
}

// Handle the 'calling' event on the receiving peer (the callee)
sc.on('calling', function() {
  console.log('This is the receiving side of the connection...');
  callButton.innerText = "Answer Call";
  callButton.id = "answer-button";
  callButton.removeEventListener('click', startCall);
  callButton.addEventListener('click', function() {
    callButton.hidden = true;
    startStream();
  });
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

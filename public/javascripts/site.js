'use strict';
// Referance: https://blog.crowdbotics.com/build-chat-app-with-nodejs-socket-io/
// Load the socket.io-client
const socket = io();

const messageContainer = document.querySelector("#message-container");
const chat = document.querySelector("#chat-form");
const Input = document.querySelector("#chat-input");
// Function to get chat message event
socket.on('chat-message', function(data) {
  appendMessage(`${data.message}`);
});
// Function to print out the chat message event
chat.addEventListener('submit', function(e) {
  e.preventDefault();
  const message = Input.value;
  if (message){
    appendMessage(`You: ${message}`);
    socket.emit('send-message', message);
    Input.value = "";

  } else {
    alert("Please enter a message!");
  }
});
// Append msgs to li element
function appendMessage(message) {
  const li = document.createElement("li");
  li.innerText = message;
  messageContainer.append(li);
};


var sc = io.connect('/' + NAMESPACE);
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
  negotiateConnection();
}

// Handle the 'calling' event on the receiving peer (the callee)
sc.on('calling', function() {
  console.log('This is the receiving side of the connection...');
  negotiateConnection();
  callButton.innerText = "Answer Call";
  callButton.id = "answer-button";
  callButton.removeEventListener('click', startCall);
  callButton.addEventListener('click', function() {
    callButton.hidden = true;
    startStream();
  });
});

// Setting up the peer connection.
async function negotiateConnection() {
  pc.onnegotiationneeded = async function() {
    try {
      console.log('Making an offer...');
      clientIs.makingOffer = true;
      try {
        // Very latest browsers are totally cool with an
        // argument-less call to setLocalDescription:
        await pc.setLocalDescription();
      } catch(error) {
        // Older (and not even all that old) browsers
        // are NOT cool. So because we're making an
        // offer, we need to prepare an offer:
        var offer = await pc.createOffer();
        await pc.setLocalDescription(new RTCSessionDescription(offer));
      } finally {
        sc.emit('signal', { description: pc.localDescription });
      }
    } catch(error) {
        console.error(error);
    } finally {
        clientIs.makingOffer = false;
    }
  }
}

sc.on('signal', async function({ candidate, description }) {
  try {
    if (description) {
      console.log('Received a decription...');
      var offerCollision  = (description.type == 'offer') &&
                            (clientIs.makingOffer || pc.signalingState != 'stable')
      clientIs.ignoringOffer = !clientIs.polite && offerCollision;

      if (clientIs.ignoringOffer) {
        return; // Just leave if we're ignoring offers
      }

      // Set the remote description...
      await pc.setRemoteDescription(description);

      // ...if it's an offer, we need to answer it:
      if (description.type == 'offer') {
        console.log('Specifically, an offer description...');
          try {
            // Very latest browsers are totally cool with an
            // argument-less call to setLocalDescription:
            await pc.setLocalDescription();
          } catch(error) {
            // Older (and not even all that old) browsers
            // are NOT cool. So because we're handling an
            // offer, we need to prepare an answer:
            var answer = await pc.createAnswer();
            await pc.setLocalDescription(new RTCSessionDescription(answer));
          } finally {
            sc.emit('signal', { description: pc.localDescription });
          }
      }

    } else if (candidate) {
        console.log('Received a candidate:');
        console.log(candidate);
        // Save Safari and other browsers that can't handle an
        // empty string for the `candidate.candidate` value:
        if (candidate.candidate.length > 1) {
          await pc.addIceCandidate(candidate);
        }
    }
  } catch(error) {
    console.error(error);
  }

});

// Logic to send candidate
pc.onicecandidate = function({candidate}) {
  sc.emit('signal', { candidate: candidate });
}

checkersGame = Checkers()

function sendCheckersUpdate(oldLoc,newLoc){
	sc.emit("checkers",{type:"update",oldLocation:oldLoc,newLocation:newLoc})
}
function sendCheckersCapture(loc1){
	console.log(loc1);
	sc.emit("checkers",{type:"capture",loc:loc1})
}


function startGame(){
	checkersGame.addClickHandlers();
	checkersGame.initGame("black",sendCheckersUpdate,sendCheckersCapture);
	sc.emit("checkers",{type:"start"});
}


sc.on("checkers",function(data){
	if(data.type == "start"){
	checkersGame.addClickHandlers();
	checkersGame.initGame("red",sendCheckersUpdate,sendCheckersCapture);
	}
	if(data.type == "update"){
		checkersGame.processUpdate(data.oldLocation,data.newLocation);
	}
	if(data.type == "capture"){
		checkersGame.processCapture(data.loc);
	}
	
})

// Use 'sc' for the signlaing channel...
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
  polite: false,
  isSettingRemoteAnswerPending: false
}

// Trying Mozilla's public STUN server stun.services.mozilla.org
var rtc_config = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
    }
  ]
};
var pc = new RTCPeerConnection(rtc_config);

// Set a placeholder for the data channel
var dc = null;

// Add the data channel-backed DOM elements for the chat box
var chatBox = document.querySelector('aside.chat');
var chatLog = document.querySelector('#chat-log');
var chatForm = document.querySelector('#chat-form');
var chatInput = document.querySelector('#message');
var chatButton = document.querySelector('#send-button');

// Creating a function that will append the message to the chat log
function appendMessageToChatLog(log, msg, who) 
{
  var li = document.createElement('li');
  var msg = document.createTextNode(msg);
  li.className = who;
  li.appendChild(msg);
  log.appendChild(li);
  if (chatBox.scrollTo) 
  {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: 'smooth'
    });
  } else 
  {
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Adding a function that will 'listen' to the data channel
function addDataChannelEventListeners(datachannel) {
  datachannel.onmessage = function() {
    appendMessageToChatLog(chatLog, e.data, 'peer');
  }
  // When opening the data channel
  datachannel.onopen = function() {
    chatButton.disabled = false; // enable the chat button
    chatInput.disabled = false; // enable the chat input box
  }
  // When closing the data channel
  datachannel.onclose = function() {
    chatButton.disabled = true; // disable the chat button
    chatInput.disabled = true; // disable the chat input box

  }
  // Submitting the chat form and appending the chat log
  chatForm.addEventListener('Submit', function(e) {
    e.preventDefault()
    var msg = chatInput.value;
    appendMessageToChatLog(chatLog, msg, 'self')
    datachannel.send(msg);
    chatInput.value = '';
  });
}

// This will ONLY work on the receiving end of the data channel connection
// Listen for the data channel on the peer conenction
pc.ondatachannel = function(e) {
  console.log('Heard the data channel open');
  dc = e.channel;
  addDataChannelEventListeners(dc);
};

// Whence the RTCPeerConnection has reached a connection,
// the polite peer will open the data channel
pc.onconnectionstatechange = function(e) {
  console.log('Connection state:\n, pc.connectionState');
  if (pc.connectionState == 'connected') {
    if (clientIs.polite) {
      console.log('Creating a data channel on the initiation side');
      dc = pc.createDataChannel('text chat');
      addDataChannelEventListeners(dc);
    }
  }
};

// Let's handle video streams...
// Set up simple media_constraints
// We are disabling the audio of the video streams
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
      /*
      console.log('Received a decription...');
      var offerCollision  = (description.type == 'offer') &&
                            (clientIs.makingOffer || pc.signalingState != 'stable')
      clientIs.ignoringOffer = !clientIs.polite && offerCollision;
      */

      // WebRTC Specification Perfect Negotiation Pattern
      var readyForOffer = !clientIs.makingOffer && (pc.signalingState == "stable" || clientIs.isSettingRemoteAnswerPending);

      var offerCollision = description.type == "answer" && !readyForOffer; 

      clientIs.ignoringOffer = !clientIs.polite && offerCollision;

      if (clientIs.ignoringOffer) {
        return; // Just leave if we're ignoring offers
      }

      // Set the remote description...
      try {
        console.log('Trying to set a remote description:\n', description);
        clientIs.SettingRemoteAnswerPending = description.type == "answer";
        await pc.setRemoteDescription(description);
        clientIs.SettingRemoteAnswerPending = false;
      } catch(error) {
        console.error('Error from setting local description', error);
      }

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
            console.log('Falling back to older setLocalDescription method when receiving an offer...');
            if (pc.signalingState == 'have-remote-offer') {
              // create a answer, if that's what's needed...
              console.log('Trying to prepare an answer:');
              var offer = await pc.createAnswer();
            } else {
              // otherwise, create an offer
              console.log('Trying to prepare an offer:');
              var offer = await pc.createOffer();
            }
            await pc.setLocalDescription(offer);
          } finally {
            console.log('Sending a response:\n', pc.localDescription);
            sc.emit('signal', { description: pc.localDescription });
          }
      }

    } else if (candidate) {
        console.log('Received a candidate:');
        console.log(candidate);
        // Save Safari and other browsers that can't handle an
        // empty string for the `candidate.candidate` value:
        try {
          if (candidate.candidate.length > 1) {
            await pc.addIceCandidate(candidate);
          }
        } catch(error) {
        if (!clientIs.ignoringOffer) {
          throw error;
          }
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

var checkersGame = Checkers();

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
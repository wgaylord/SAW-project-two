// Use 'sc' for the signlaing channel...
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

// Eventually, we will set up STUN servers here
var rtc_config = null;
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
  if (pc.connectionState == 'connected') {
    if (clientIs.polite) {
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
      console.log('Received a decription...');
      var offerCollision  = (description.type == 'offer') &&
                            (clientIs.makingOffer || pc.signalingState != 'stable')
      clientIs.ignoringOffer = !clientIs.polite && offerCollision;

      if (clientIs.ignoringOffer) {
        return; // Just leave if we're ignoring offers
      }

      // Set the remote description...
      try {
        console.log('Trying to set a remote description:\n', description);
        await pc.setRemoteDescription(description);
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
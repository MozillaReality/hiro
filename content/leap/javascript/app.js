// Plugin order is critical:
Leap.loop()
  .use('transform', {
    vr: true
  })
  .use('boneHand', {
    scene: null, // this tells boneHand to use defer scene usage/creation.
    opacity: 0.7,
    jointColor: new THREE.Color(0x222222),
    arm: true
  })
  .use('proximity')
  .use('pinchEvent')
  .use('playback', {
    pauseOnHand: true,
    loop: false,
    overlay: false,
    resumeOnHandLost: false,
    autoPlay: false
  })
  .use('twoHandRecognizer');


// This is fairly important - it prevents the framerate from dropping while there are no hands in the frame.
// Should probably default to true in LeapJS.
Leap.loopController.loopWhileDisconnected = true;

Leap.loopController.on('streamingStarted', function(){
  console.log('Leap Motion Controller streaming');
  ga('send', 'event', 'Leap', 'streaming');

  var connection = this.connection;
  this.connection.on('focus', function(){
    if (!VRClientReady) return;

    connection.reportFocus(VRClientFocused);
  });

});


var VRClientReady = false;
var VRClientFocused = true;
VRClient.onFocus = function(){
  VRClientFocused = true;

  cursor.enable();

  var connection = Leap.loopController.connection;
  if (!connection) return;

  connection.reportFocus(true);
};

VRClient.onBlur = function(){
  VRClientFocused = false;

  cursor.disable();

  var connection = Leap.loopController.connection;
  if (!connection) return;

  connection.reportFocus(false);
};


angular.module('index', ['directives']);



// Trying to figure out where to go next?
// Check out directives/scene.js
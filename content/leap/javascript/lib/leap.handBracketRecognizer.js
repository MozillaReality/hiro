// this should get a new name, now that it includes grabEvent.
Leap.plugin('handBracket', function(scope){


  this.emit('handBracket.start');

  var controller = this;

  return {

    frame: function(frame){

      if (frame.hands.length !== 2) return;
      controller.emit('handBracket.update',
        frame.hands.map(function(hand) {
          var pos = hand.palmPosition;
          return new THREE.Vector3(pos[0], pos[1], pos[2]);
        })
      );
    }
  };
});

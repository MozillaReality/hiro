// Port from unity by @dplemmons
// this should get a new name, now that it includes grabEvent.
// Uses handQueue from singleHandRecognizer for always using the two oldest hands.
Leap.plugin('twoHandRecognizer', function(scope){

  this.use('singleHandRecognizer');

  var controller = this;

  var gestureState = "INACTIVE";

  function calcHandOutAndOpenAmount(hand) {
    var flattenedYComponent = hand.direction[2] > 0 ? 0 : hand.direction[2];
    var inverseYComponent = 1 - Math.abs(flattenedYComponent);
    var inverseGrabStrength = 1 - hand.grabStrength;

    return inverseYComponent * inverseGrabStrength;
  }

  function outOpenComponent() {
    if ( controller.handQueue !== undefined && controller.handQueue.length >= 2 ) {
      var comp1 = calcHandOutAndOpenAmount(controller.handQueue[0]);
      var comp2 = calcHandOutAndOpenAmount(controller.handQueue[1]);
      return [comp1, comp2];
    }
    else {
      return 0;
    }
  }

  return {
    frame: function(frame){
      var outOpen = outOpenComponent();
      var outOpenMin = Math.min(outOpen[0], outOpen[1]);

      if ( gestureState == "INACTIVE" ) {
        if ( controller.handQueue !== undefined && controller.handQueue.length >= 2 && outOpenMin >= 0.7) {
          controller.emit("twoHand.start", controller.handQueue[0], controller.handQueue[1], outOpen[0], outOpen[1]);
          gestureState = "ACTIVE";
        }
      }
      else if( gestureState == "ACTIVE" ) {
        if ( controller.handQueue === undefined || controller.handQueue.length < 2 || outOpenMin < 0.6) {
          controller.emit("twoHand.end", outOpen[0], outOpen[1]);
          gestureState = "INACTIVE";
        }
        else {
          controller.emit("twoHand.update", controller.handQueue[0], controller.handQueue[1], outOpen[0], outOpen[1]);
        }
      }
    }
  };
});

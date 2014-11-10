// Port from unity by @dplemmons
// this should get a new name, now that it includes grabEvent.
Leap.plugin('singleHandRecognizer', function(scope){

  var controller = this;
  controller.handQueue = [];
  var m_lastHands = [];

  // Depending on the comparitor, true or false, will perform an intersection or difference respectfully
  function HandDiffOrIntersection(list1, list2, comparitor) {
    var retArr = [];

    for ( var i=0; i<list1.length; i++ ) {
      var listOneHand = list1[i];
      var found = false;

      for( var j=0; j<list2.length; j++ ) {
        var listTwoHand = list2[j];
        if ( listOneHand.id == listTwoHand.id ) {
          found = true;
          break;
        }
      }

      if ( found  == comparitor ) {
        retArr.push(listOneHand);
      }
    }

    return retArr;
  }

  // Perform a difference opperation on the two arrays ( List1 - List2 )
  function DifferenceHandModelLists(list1, list2) {
    return HandDiffOrIntersection(list1, list2, false);
  }

  // Perform an intersection opperation on the two hand lists.
  function IntersectionHandModelLists(list1, list2) {
    return HandDiffOrIntersection(list1, list2, true);
  }

  return {

    frame: function(frame){
      var latestHands = frame.hands;
      var newHands = DifferenceHandModelLists(latestHands, m_lastHands);
      var recurringHands = IntersectionHandModelLists(m_lastHands, latestHands);
      var lostHands = DifferenceHandModelLists(m_lastHands, latestHands);

      for(var i=0;i<newHands.length;i++) {
        controller.emit("hand.start", newHands[i]);
        controller.handQueue.push(newHands[i]);
      }

      for(var i=0;i<recurringHands.length;i++) {
        controller.emit("hand.update", recurringHands[i]);
        for( var j=0;j<controller.handQueue.length;j++ ) {
          if ( controller.handQueue[j].id == recurringHands[i].id ) {
            controller.handQueue[j] = recurringHands[i];
          }
        }
      }

      for(var i=0;i<lostHands.length;i++) {
        controller.emit("hand.end", lostHands[i]);

        for( var j=0;j<controller.handQueue.length;j++ ) {
          if ( controller.handQueue[j].id == lostHands[i].id ) {
            controller.handQueue.splice(j,1);
          }
        }
      }

      m_lastHands = latestHands;
    }
  };
});

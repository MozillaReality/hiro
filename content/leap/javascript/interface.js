(function() {

  var onkey = function(event) {
    if (event.key === 'z') {
      vrControls.zeroSensor();
    }
    if (event.key === 'f') {
      return vrEffect.setFullScreen(true);
    }
  };

  window.addEventListener("keypress", onkey, true);

}).call(this);
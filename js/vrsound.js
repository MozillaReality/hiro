function VRSound( sources, radius, volume ) {
    var audio = document.createElement( 'audio' );
    for ( var i = 0; i < sources.length; i ++ ) {
      var source = document.createElement( 'source' );
      source.src = sources[ i ];
      audio.appendChild( source );
    }
    this.position = new THREE.Vector3();
    this.audio = audio;
}

VRSound.prototype.play = function() {
  this.audio.play();
};

VRSound.prototype.update = function(camera) {
  var distance = this.position.distanceTo( camera.position );
  if ( distance <= radius ) {
    audio.volume = volume * ( 1 - distance / radius );
  } else {
    audio.volume = 0;
  }
}

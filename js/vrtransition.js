function VRTransition() {

  var self = this;
  this.visible = false;

  //create object
  self.object = new THREE.Object3D();
  self.object.visible = this.visible;
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 1, wireframe: true, side: THREE.DoubleSide } );

  var loader = new THREE.ObjectLoader();
  loader.load( 'models/test-4.json', function ( object ) {

    rings = object.children[0].children;
    rings.reverse();

    for ( var i = 0; i < rings.length; i++ ){
      
      rings[i].children[0].material = material;

    }

    object.scale.set( 10, 10, 10 )
    self.object.add( object );

  })

}

VRTransition.prototype.update = function() {
  // update loop
}

VRTransition.prototype.fadeOut = function () {
  var self = this;

  return new Promise( function(resolve, reject) {

    self.object.visible = true;
    self.visible = true;
    var rings = self.object.children[0].children[0].children;
   
    console.log( "--------" )
    console.log( rings )

    for ( i = 0; i < rings.length; i++ ){
      
      var r = rings[i].children[0];
      var delay = i * 180;

      /*
      r.scale.set( 0.01, 0.01, 0.01 );
      new TWEEN.Tween( r.scale )
        .to ( { x:1, y:1, z:1 }, 2000 )
        .delay( delay )
        .start();

      r.rotation.set( 0, 0, 1.57 );
      new TWEEN.Tween( r.rotation )
        .to ( { x:0, y:0, z:0 }, 2000 )
        .delay( delay )
        .start();
      */

    }
  

    /*
    var pieces = self.object.children[0];

    for ( var i = 0; i < pieces.children.length; i ++ ) {

      var object = pieces.children[i];
      var delay = i * 18;

      var destZ = object.position.z;
      object.position.setZ( destZ - 5 );
      new TWEEN.Tween( object.position )
        .to( { z: destZ  }, 600 )
        .delay( delay )
        //.easing( TWEEN.Easing.Cubic.Out )
        .start();

      object.scale.set( 0.001, 0.001, 0.001 )
      new TWEEN.Tween( object.scale )
        .to( { x:0.99, y:0.99, z:0.99  }, 600 )
        .delay( delay )
        //.easing( TWEEN.Easing.Cubic.Out )
        .start();

    }
    */

    //set this long enough to allow for the full number of pieces to play, with their delays
    setTimeout(function() {
      resolve();
    },5000)

  });
};

VRTransition.prototype.fadeIn = function () {
  var self = this;

  /*
  var pieces = self.object.children[0];

  for ( var i = 0; i < pieces.children.length; i ++ ) {

    var object = pieces.children[i];
    //var delay = i * 0.15;
    //var destY = object.position.y + 100;

    new TWEEN.Tween( object.scale )
      .to( { x:0.001, y:0.001, z:0.001  }, 500 )
      .easing( TWEEN.Easing.Cubic.In )
      //.delay(50)
      .start();

      setTimeout(function() {
        self.object.visible = false;
        self.visible = false;
      },1200)

  }
  */

};



function VRTransition() {

  var self = this;
  this.visible = false;

  //create object
  self.object = new THREE.Object3D();
  self.object.visible = this.visible;

  var geometry = new THREE.IcosahedronGeometry( 25, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: false, transparent: true, opacity: 1, side: THREE.DoubleSide } );

  //fragment function: returns a group of meshes created from the faces of the geometry that is passed in
  function fragment( geometry, material ) {

    var group = new THREE.Group();

    for ( var i = 0; i < geometry.faces.length; i ++ ) {

      var face = geometry.faces[ i ];

      var vertexA = geometry.vertices[ face.a ].clone();
      var vertexB = geometry.vertices[ face.b ].clone();
      var vertexC = geometry.vertices[ face.c ].clone();

      var geometry2 = new THREE.Geometry();
      geometry2.vertices.push( vertexA, vertexB, vertexC );
      geometry2.faces.push( new THREE.Face3( 0, 1, 2 ) );

      var mesh = new THREE.Mesh( geometry2, material );
      mesh.position.sub( geometry2.center() );

      var wireframe = new THREE.Mesh(
        geometry2,
        new THREE.MeshBasicMaterial( { color: 0xCCCCCC, wireframe: true, wireframeLinewidth: 3 } )
      )
      wireframe.position.sub( geometry2.center() );

      mesh.add( wireframe );
      group.add( mesh );

    }
    return group;
  }

  //fragment the geometry
  var pieces = fragment( geometry, material );

  //sort the pieces
  pieces.children.sort( function ( a, b ) {

    return a.position.z - b.position.z;
    //return a.position.x - b.position.x;     // sort x
    //return b.position.y - a.position.y;   // sort y

  } );

  pieces.rotation.set( 0, 0, 0 )

  //add pieces to holder object
  self.object.add( pieces );

}

VRTransition.prototype.init = function() {
  return this.object;
}

VRTransition.prototype.update = function() {
  // update loop
}

VRTransition.prototype.fadeOut = function () {
  var self = this;

  return new Promise( function(resolve, reject) {

    self.object.visible = true;
    self.visible = true;

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

      /*
      object.rotation.set( 0, 0, 0.5 );
      new TWEEN.Tween( object.rotation )
        .to( { z:0  }, 800 )
        .delay( delay )
        //.easing( TWEEN.Easing.Cubic.Out )
        .start();
      */

      object.scale.set( 0.001, 0.001, 0.001 )
      new TWEEN.Tween( object.scale )
        .to( { x:0.99, y:0.99, z:0.99  }, 600 )
        .delay( delay )
        //.easing( TWEEN.Easing.Cubic.Out )
        .start();

    }

    //set this long enough to allow for the full number of pieces to play, with their delays
    setTimeout(function() {
      resolve();
    },2250)

  });
};

VRTransition.prototype.fadeIn = function () {
  var self = this;

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

};



function VRTransition() {
  var self = this;
  this.visible = false;
  //create object
  self.object = new THREE.Object3D();

  var geometry = new THREE.IcosahedronGeometry( 400, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true, side: THREE.DoubleSide } );
  mesh = new THREE.Mesh( geometry, material );
  self.object.visible = this.visible;
  self.object.add(mesh);
/*  
  todo: explode animation needs to be enabled.

  function explode( geometry, material ) {
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
      group.add( mesh );

    }
    return group;
  }

  //break object into pieces
  var pieces = explode( geometry, material );

  //set initial state of pieces
  for ( var i = 0; i < pieces.children.length; i ++ ) {

    var object = pieces.children[ i ];
    var destY = object.position.y;

    object.position.setY( destY - 100 );
    object.material.opacity = 0;
    object.scale.set( 0.1, 0.1, 0.1 )

  }
*/
  
  //mesh.material.opacity = 0;
}

VRTransition.prototype.init = function() {
  return this.object;
}

VRTransition.prototype.update = function() {
  // update loop
}

VRTransition.prototype.fadeIn = function () {
  var self = this;

  // temporary set opacity to 0 after some time.
  // todo: replace with animation
  setTimeout(function() {
    self.object.visible = false;
    self.visible = false;
  }, 1000);
  
  // new TWEEN.Tween( this.object.children[0].material )
  //   .to( { opacity: 0 }, 1000 )
  //   .start();

};

VRTransition.prototype.fadeOut = function () {
  var self = this;

  // temporary set opacity to 1, resolve promise after some time.
  // todo: replace with animation
  return new Promise( function(resolve, reject) {
    console.log(self);
    self.object.visible = true;
    self.visible = true;
    
    setTimeout(function() {
      resolve();
    },1000)
    
    // new TWEEN.Tween( this.object.children[0].material )
    //   .to( { opacity: 1 }, 1000 )
    //   .onComplete(function() {
    //     resolve();
    //   })
    //   .start();
  });
};


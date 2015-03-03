function VRTransition() {

  this.visible = false;

  //create eyelids
  this.object3d = new THREE.Object3D();
  this.object3d.visible = this.visible;

  var geometry = new THREE.SphereGeometry( 199, 20, 20, 0, 360 * Math.PI/180, 0, 90 * Math.PI/180 );
  var material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true,  opacity: 1 });

  // load texture
  new THREE.TextureLoader().load("images/transition/eyelid-gradient.png", function(texture) {
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set( 1, 1 );
    texture.offset.set( 0, -1 );
    material.map = texture; // assign texture to material
    material.needsUpdate = true;
  });

  // load alphamap
  new THREE.TextureLoader().load("images/transition/alpha-2pxblack-topbottom.png", function(alphamap) {
    material.alphaMap = alphamap;
    material.needsUpdate = true;
  });

  var top = new THREE.Mesh(geometry, material);
  var bottom = new THREE.Mesh(geometry, material);
  bottom.rotation.set(0, 0, 1 * Math.PI)

  this.object3d.add(top);
  this.object3d.add(bottom);
  this.material = material;
  return this;
}

//fadeOut: closes the "eyelids" and completely darkens the background
VRTransition.prototype.fadeOut = function(noTransition) { // hide content
  var self = this;
  var mesh = self.object3d;

  self.noTransition = noTransition || false;

  return new Promise( function(resolve, reject) {
    if (noTransition) {
      resolve();
      return false;
    };

    mesh.visible = self.visible = true;

    new TWEEN.Tween( self.material.map.offset ) // 
      .to( { y: 0 }, 800 )
      .easing( TWEEN.Easing.Sinusoidal.Out )
      .onComplete(function() {
        resolve();
      })
      .start();

  });
};

//fadeOut: opens the "eyelids" and reveals the new site
VRTransition.prototype.fadeIn = function () {
  var self = this;

  new TWEEN.Tween( self.material.map.offset )
    .to( { y: -1 }, 800 )
    .easing( TWEEN.Easing.Sinusoidal.Out )
    .onComplete(function() {
      self.object3d.visible = self.visible = false;
    })
    .start();
};



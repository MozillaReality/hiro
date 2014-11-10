//
window.THREEDialog = function(options){
  options || (options = {});
  this.options = options;

  this.clicked = false;

  this.map = THREE.ImageUtils.loadTexture(this.options.bg, null, this.setAspect.bind(this));

  // loadTexture: function ( url, mapping, onLoad, onError ) {
  if (this.options.hover){
    this.hoverMap = THREE.ImageUtils.loadTexture(this.options.hover ); // is bind necessary here?
  }

  if (this.options.click){
    this.clickMap = THREE.ImageUtils.loadTexture(this.options.click);
  }


  var mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: this.map,
    transparent: true,
    specular: 0x000000
  });

  this.mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(this.options.height, this.options.height),
    mat
  );

  if (this.options.name){
    this.mesh.name = this.options.name;
  }

  this.mesh.addEventListener('click', function(event){
    // return early if clicked?

    console.log('click', arguments);

    if (this.clickMap) {
      this.setMap(this.clickMap);
    }

    this.clicked = true;

    if (this.options.onClick){
      this.options.onClick(event);
    }

  }.bind(this));

  this.mesh.addEventListener('mouseover', function(event){

    if (this.clicked) return;

    if (this.hoverMap){
      this.setMap(this.hoverMap);
    }

    if (this.options.onMouseover){
      this.options.onMouseover(event);
    }

  }.bind(this) );

  this.mesh.addEventListener('mouseout', function(event){

    if (this.clicked) return;

    if (this.hoverMap){
      this.setMap(this.map);
    }

    if (this.options.onMouseout){
      this.options.onMouseout(event);
    }

  }.bind(this) );

};

window.THREEDialog.prototype = {
  
  setMap: function(map){
    this.mesh.material.map = map;
    this.mesh.material.needsUpdate = true;
  },

  // we scale, rather than changing parameter size
  // allows us to change textures back and forth
  // hopefully works with raycaster -.-
  setAspect: function(texture){

    var aspect = texture.image.height / texture.image.width; // this may need to be inverted.

    console.log(this.options.name, aspect);

    this.mesh.scale.setY(aspect)

  }
  
};
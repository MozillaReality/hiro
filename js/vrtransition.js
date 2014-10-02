function VRTransition(containerEl, contentEl, config) {

  //enable START_WITH_HUD
  //disable START_WITH_INTRO
  
  //it starts with HUD
  //open cubes scene
  //it cross fades

  //assign el variable to containerEl
  //create a canvas element inside el
  //setup three.js scene for that canvas
  //including VR controllers

  var object;
  var el = containerEl;
  var camera, scene, renderer;
  var controls, effect;
  var geometry, material, cube;


  //explode objects function, from MrDoob
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


  function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.autoClear = false;
    renderer.setClearColor( 0x000000 );
    el.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

    //parse url parameter and set appropriate rendering effect
    controls = new THREE.VRControls( camera );
    effect = new THREE.VREffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    //create object
    object = new THREE.Object3D();
    var geometry = new THREE.IcosahedronGeometry( 400, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true, side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( geometry, material );
    
    /*
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

    object.add( mesh );
    scene.add( object );

  }

  function animate() {

    requestAnimationFrame( animate );
    render();
    TWEEN.update();
  }

  function render() {
    controls.update();
    effect.render( scene, camera );
  }

  init();
  animate();

  /*
  var el =  contentEl || document.createElement('div');
  el.classList.add("transition");
  el.classList.add("threed");
  el.width = "1200";
  el.height = "900";
  this.el = el;
  containerEl.appendChild(el);
  config = config || {};
  this.duration = config.duration || 1200;
  this.z = config.z || -1;
  */

};

VRTransition.prototype.fadeIn = function (render) {

  console.log( 'fadeIn' );



  /*
  var self = this;
  this.renderFadeIn = render || this.renderFadeIn;
  if (this.fadeOutInProgress) {
    this.fadeInPending = true;
    return;
  }
  this.fadeInInProgress = true;
  this.renderFadeIn(this.el);
  setTimeout(fadeInFinished, this.duration);
  function fadeInFinished() {
    self.fadeInInProgress = false;
    if (self.fadeOutPending) {
      self.fadeOut();
      self.fadeOutPending = false;
    }
  }
  */
};

VRTransition.prototype.fadeOut = function (render) {

  console.log( 'fadeOut' );




  /*
  var self = this;
  return new Promise( function(resolve, reject) {
    self.renderFadeOut = render || self.renderFadeOut;
    if (self.fadeInInProgress) {
      self.fadeOutPending = true;
      return;
    }
    self.fadeOutInProgress = true;
    self.renderFadeOut(self.el);
    setTimeout(fadeOutFinished, self.duration);
    function fadeOutFinished() {
      console.log('fade out finished');
      self.fadeOutInProgress = false;
      if (self.fadeInPending) {
        self.fadeIn();
        self.fadeInPending = false;
      }
      resolve();
    }
  });
  */
};

VRTransition.prototype.renderFadeIn = function (el) {


  //el.classList.add('fadeIn');
};

VRTransition.prototype.renderFadeOut = function (el) {
  


  //el.classList.remove('fadeIn');
  //el.classList.add('fadeOut');
};

VRTransition.prototype.update = function () {
  

  //this.el.style.transform = 'translate(-50%, -50%) translate3d(0, 0, ' + this.z  + 'rem) rotateY(0) rotateX(0)';
};
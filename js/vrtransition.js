function VRTransition(containerEl) {

  //enable START_WITH_HUD
  //disable START_WITH_INTRO
  
  //it starts with HUD
  //open cubes scene
  //it cross fades

  //assign el variable to containerEl
  //create a canvas element inside el
  //setup three.js scene for that canvas
  //including VR controllers
  var self = this;
  self.object = null;

  var el = containerEl;
  var camera, scene, renderer;
  var controls, effect;
  var geometry, material, mesh;


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
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true  } );
    renderer.autoClear = false;
    renderer.setClearColor( 0x000000, 0 );
    el.appendChild( renderer.domElement );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

    //parse url parameter and set appropriate rendering effect
    controls = new THREE.VRControls( camera );
    effect = new THREE.VREffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    //create object
    self.object = new THREE.Object3D();

    var geometry = new THREE.IcosahedronGeometry( 400, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true, side: THREE.DoubleSide } );
    mesh = new THREE.Mesh( geometry, material );
    
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


    mesh.material.opacity = 0;

    self.object.add( mesh );
    scene.add( self.object );

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

VRTransition.prototype.fadeIn = function () {
  console.log('fadein');
  var self = this;
  setTimeout(function() {
    self.object.children[0].material.opacity = 0;  
  }, 1000);
  // new TWEEN.Tween( this.object.children[0].material )
  //   .to( { opacity: 0 }, 1000 )
  //   .start();

};

VRTransition.prototype.fadeOut = function () {
  var self = this;
  return new Promise( function(resolve, reject) {
    console.log('fadeout');

    self.object.children[0].material.opacity = 1;

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


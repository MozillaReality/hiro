(function() {
	var container = document.querySelector('#launch-background');

	var renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.autoClear = false;
	renderer.setClearColor( 0x000000 );

	container.appendChild( renderer.domElement );

	var scene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

	var worldGeo = new THREE.SphereGeometry( 490, 60, 40 );
	worldGeo.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
	var worldMat = new THREE.MeshBasicMaterial( { transparent: true, opacity: 1, map: THREE.ImageUtils.loadTexture( 'images/bg.jpg' ) } );
	var world = new THREE.Mesh( worldGeo, worldMat );

	var controls = new THREE.VRControls( camera );

	scene.add( world );

	animate();

	function animate() {
		requestAnimationFrame( animate );
		render();
	}

	function render() {
		controls.update();
		renderer.render( scene, camera );
	}
})();
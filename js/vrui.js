/*
VRUi
- Provides a three.js context for various UI components: hud, titling, loading and transitions.
- Hosts inputs: cursor, keyboard and VR headset orientation.
- Manages different rendering modes.
	- VREffect handles the camera stereo effects while VRManager is responsible for calling full-screen.
*/

'use strict';

function VRUi(container) {
	var self = this;


	this.homeUrl = 'content/construct';
	this.landingUrl = 'content/landing'; // launch: make sure set to landing
	this.container = container;
	this.hud = new VRHud();
	this.mode = this.modes.mono;
	this.cursor = new VRCursor('mono');
	this.loading = new VRLoading();
	this.title = new VRTitle();
	this.transition = new VRTransition();

	// three.js
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;

	this.initRenderer();

	// This needs to be called before init leap, so that it can stop events before they get picked up and sent to the Leap Service
	this.rerouteFocusEvents();

	this.initLeapInteraction();

	//self.scene.add(self.gridlines());

	this.ready = Promise.all([this.hud.ready, this.title.ready, this.cursor.ready])
		.then(function() {

			// hud background
			self.scene.add(self.background());

			// add transition mesh to scene
			self.scene.add(self.transition.object);

			// title
			self.scene.add(self.title.mesh);
			var titleRadius = 0.4;

			// Bending one seems to bend them all -.-
			setTimeout(function(){ // This quick setTimeout hack seems to fix tile bending weirdly/parabolically
				self.title.mesh.children[0].bend( titleRadius );
				self.title.mesh.positionRadially( titleRadius, 0, 0 );
			});

			self.scene.add(self.hud.layout);

			// loading progress
			self.scene.add(self.loading.mesh);

			// add cursor to scene
			self.scene.add(self.cursor.layout);

			self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);
			self.cursor.enable();
			self.cursor.cursor.position.z = -0.22;
			self.cursor.cursor.scale.multiplyScalar(0.2);

			// Once all this is loaded, kick off start from VR
			// self.start();
		});

	return this;
};


VRUi.prototype.load = function(url, opts) {
	console.log('loading url: ' + url);

	var self = this;

	var opts = opts || {};

	// hides loading progress animation
	var noLoading = opts.noLoading || false;

	// hides title frame
	var noTitle = opts.noTitle || false;

	// hides transition
	var noTransition = opts.noTransition || false;

	self.cursor.disable();

	self.transition.fadeOut(noTransition)
		.then(function() {

			self.backgroundShow();

			// set title URL
			self.title.setTitle('');
			self.title.setCredits('');
			self.title.setUrl(url);

			if (noTitle) {
				self.backgroundHide();
			} else {
				self.title.show();
			}

			self.currentUrl = url;

			self.isHome = (url == self.homeUrl ? true : false );

			if (self.isHome) {
				self.hud.enable();
			}

			if (!noLoading) {
				self.loading.show();
			}

			function onPageMeta(tab) {
				var title = tab.siteInfo.title;
				var credits = tab.siteInfo.description;

				if (title) {
					self.title.setTitle(title);
				}
				if (credits) {
					self.title.setCredits(credits);
				}
			}

			function onTabReady() {
				var holdTitleTime = 5000; // how long to hold title for before fading out.

				self.backgroundHide(holdTitleTime);

				self.loading.hide();

				self.transition.fadeIn();

				// hide title after set amount of time
				setTimeout(function() {
					if (!self.hud.visible) {
						self.title.hide();
					}
				}, holdTitleTime);
			}

			VRManager.onPageMeta = onPageMeta;

			VRManager.onTabReady = onTabReady;

			VRManager.load(url);

			//VRManager.currentDemo.focus();

		});

};

// This function, somewhat experimentally, allows only one context to have focus state at a time (either the iframe, or the hud)
// This is necessary, even with backgrounding, so that clicking out and back doesn't change LeapMotion's "foreground" connection.
VRUi.prototype.rerouteFocusEvents = function() {

	window.addEventListener('focus', function (e) {
		if (!( this.hud.visible && this.hud.enabled )) {
			e.stopImmediatePropagation();
			VRManager.currentDemo && VRManager.currentDemo.focus();
		}
		return false;
	}.bind(this));

	window.addEventListener('blur', function (e) {
		if (!( this.hud.visible && this.hud.enabled )) {
			e.stopImmediatePropagation();
			VRManager.currentDemo && VRManager.currentDemo.blur();
		}
		return false;
	}.bind(this));
}


VRUi.prototype.toggleHud = function() {
	if (!this.hud.visible && this.hud.enabled) {
		// show
		this.background.visible = true;
		this.backgroundShow();
		this.hud.show();
		this.title.show(1000);
		this.updateCursorState();
		VRManager.currentDemo.blur();


	} else if (this.hud.visible && this.hud.enabled) {
		// hide
		this.backgroundHide(1000);
		this.cursor.disable();
		this.hud.hide().then( function(){
			// Disable a second time, in case the LMC began streaming during animation.
			this.cursor.disable();
		}.bind(this) );
		this.title.hide(1000);
		VRManager.currentDemo.focus();
	} else {
		this.hud.hide();
	}
};

VRUi.prototype.updateCursorState = function(){

	if (this.hud.visible && !Leap.loopController.streaming() ){
		this.cursor.enable();
		this.cursor.show();
	} else {
		this.cursor.disable();
	}

}


VRUi.prototype.start = function(mode) {
	var self = this;

	this.ready.then(function() {

		// start with hud
		// self.toggleHud();

		// start to home
		self.goHome(true);

		// start with landing
		// VRManager.load(self.landingUrl);

		// kick off animation loop
		self.animate();
	});
};


VRUi.prototype.goHome = function(noTransition) {
	var self = this;

	self.cursor.disable();

	this.load(this.homeUrl, {
		noTransition: noTransition,
		noTitle: true,
		noLoading: true
	});
}

VRUi.prototype.reset = function() {
	var self = this;
	self.currentUrl = null;
	self.backgroundHide();
	self.title.hide();
	self.cursor.disable();
	self.hud.hide()
		.then(function() {
			self.start();
		});
	self.hud.disable();
};

// Sets position at radius and angle
// Sets the rotation to face the origin.
// In z radians from <0,0,-1>
THREE.Object3D.prototype.positionRadially = function(radius, angle, height){
	height || (height = this.position.y);

	this.position.set(
		 radius * Math.sin(angle),
		height,
		-radius * Math.cos(angle)
	);

	this.lookAt(
		new THREE.Vector3(0,height,0)
	);

};


THREE.Object3D.prototype.bend = function(radius ){
	var geometry = this.geometry;
	var vertices = geometry.vertices;
	this.updateMatrixWorld();

	for (var i = 0; i < vertices.length; i++) {
		var vertex = vertices[i];
		var worldVertex = this.localToWorld(vertex);

		vertex.set(
			Math.sin( worldVertex.x / radius) * radius,
			worldVertex.y,
			- Math.cos( worldVertex.x / radius ) * radius
		);
		vertex.z += radius;
		this.worldToLocal(vertex);
	}

	geometry.computeBoundingSphere();
	geometry.verticesNeedUpdate = true;
}



/*
todo: move backgrounds off to seperate module
*/
VRUi.prototype.background = function() {
	/*
	create a sphere that wraps the user.   This should sit in-between the
	HUD and the loaded content
	*/
	//var geometry = new THREE.CylinderGeometry( 3, 3, 3, 40, 1 );
	var geometry = new THREE.SphereGeometry( 1400 );

	var material = new THREE.MeshBasicMaterial({
		color: 0x000000,
		side: THREE.BackSide,
		opacity: 0.5
	});

	var background = new THREE.Mesh( geometry, material );
	background.visible = false;

	this.background = background;

	return background;
}

VRUi.prototype.backgroundHide = function(delay) {
	var background = this.background;

	var tween = new TWEEN.Tween( background.material )
		.to({ opacity: 0 }, 500 )
		.easing(TWEEN.Easing.Exponential.Out)
		.onComplete(function() {
			background.visible = false;
		})

	if (delay) {
		tween.delay(delay);
	}

	tween.start();
};

VRUi.prototype.backgroundShow = function() {
	var background = this.background;
	background.visible = true;

	var tween = new TWEEN.Tween( background.material )
		.to({ opacity: 0.6 }, 800 )
		.easing(TWEEN.Easing.Exponential.Out)
		.onComplete(function() {

		})
		.start();
};


// temporary wireframe lines for context alignment
VRUi.prototype.gridlines = function() {
	var geometry = new THREE.BoxGeometry(1,1,1,5,5,5);
	var material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	var cube = new THREE.Mesh( geometry, material );
	cube.scale.set( 50, 50, 50);
	return cube;
}


VRUi.prototype.initRenderer = function() {
	this.renderer = new THREE.WebGLRenderer({ alpha: true });
	this.renderer.sortObjects = false;
	this.renderer.shadowMapEnabled = true;
	this.renderer.shadowMapType = THREE.PCFSoftShadowMap;
  this.renderer.setClearColor( 0x000000, 0 );
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 10000 );
	this.scene.add(this.camera);

	if (THREE.OrbitControls) window.orbitControls = new THREE.OrbitControls( this.camera );
	//if (THREE.OrbitControls) this.camera.position.set( 0, 0, 0.1 );
	if (THREE.OrbitControls) this.camera.position.set( 2.3, 13.8, 6.2).divideScalar(16);
	if (THREE.OrbitControls) this.camera.rotation.set( -1.1506, 0.15609, 0.3348 );

	this.setRenderMode(this.mode);

  this.effect.setSize( window.innerWidth, window.innerHeight );

  this.container.appendChild(this.renderer.domElement);

  this.initResizeHandler();
};


// note: either need to hide this when in background.. unless HUD is shown in another app, in which case focus is given back
// This should be called after the scene is initializer
// But before animate (#start), so that the Leap animation frame callbacks get registered before the render ones.
VRUi.prototype.initLeapInteraction = function() {

	Leap.loop({background: true});

	// Add a certain default lightness, even in low-light situations
	Leap.loopController.on('handMeshCreated', function(handMesh){

		handMesh.traverse(function(mesh){
			// mesh is a joint or a bone
			if (mesh.material){
				mesh.material.emissive.copy(mesh.material.color).multiplyScalar(0.75);
			}
		})

	});

	Leap.loopController.use('transform', {
			vr: true,
			effectiveParent: this.camera
		})
		.use('boneHand', {
			scene: this.scene,
			arm: true
		});

	Leap.loopController.setMaxListeners(100);  // Don't overload with many interactable planes


	Leap.loopController.on('streamingStarted', this.updateCursorState.bind(this) );
	Leap.loopController.on('streamingStopped', this.updateCursorState.bind(this) );

	// Set initial Leap focus state. See LeapJS's browser.js L64
	Leap.loopController.connection.windowVisible = this.hud.visible && this.hud.enabled;

	Leap.loopController.on('hand', function(hand){

		hand.data('handMesh').setVisibility( this.hud.visible );

	}.bind(this) );


	var light = new THREE.SpotLight(0xffffff, 0.25);
	light.castShadow = true;
	light.shadowCameraVisible = false;
	light.shadowCameraNear = 0.01;
	light.shadowCameraFar = 3;
	light.shadowDarkness = 0.8;
	light.shadowMapWidth = 1024; // default is 512
	light.shadowMapHeight = 1024; // default is 512

	light.position.set(0,1,1);
	light.target.position.set(0,0,-1);
	this.camera.add(light.target);

	var dolly = new THREE.Object3D;
	dolly.position.set(0,0.2,0.8);

	this.scene.add(dolly);
	this.camera.add(light);

	Leap.loopController.on('frame', function(frame){

		if (frame.hands.length > 1){

			if (!this.hud.visible){

				this.toggleHud();
				this.hud.leapActivated = true;

			}

		}

		if ( frame.hands.length === 0 ) {

			if ( this.hud.visible && this.hud.leapActivated ) {

				this.toggleHud();

			}

		}

	}.bind(this) );


}

// todo: needs to be put somewhere else.  duplicated in vrcursor and vrclient.
VRUi.modes = VRUi.prototype.modes = {
  mono: 1,
  stereo: 2,
  vr: 3
};

VRUi.prototype.setRenderMode = function(mode) {
	this.mode = mode;

	if (mode == VRUi.modes.mono) {
		console.log('Mono render mode');
		this.effect = this.renderer;
		// apply vr controls anyways.
		this.controls = new THREE.VRControls( this.camera );
		this.cursor.setMode('mono');
		this.cursor.hide();

	} else if (mode == VRUi.modes.vr) {
		console.log('VR render mode');
		this.effect = new THREE.VREffect( this.renderer );
		this.controls = new THREE.VRControls( this.camera );
		this.cursor.setMode('centered');

	} else if (mode == VRUi.modes.stereo) {
		console.log('Stereo render mode');
		this.effect = new THREE.StereoEffect( this.renderer );
		this.controls = null;
		this.cursor.setMode('centered');
		this.cursor.disable();
	}

	this.effect.setSize( window.innerWidth, window.innerHeight );
}



VRUi.prototype.animate = function() {
	var controls = this.controls;

	// apply headset orientation and position to camera
	if (controls && !THREE.OrbitControls) {
		this.controls.update();
	}

	this.transition.update();

	this.loading.update();

	this.cursor.update();

	if (THREE.OrbitControls) window.orbitControls.update();

	// run any animation tweens
	TWEEN.update();

	// three.js renderer and effects.
	//console.time('render');
	this.effect.render(this.scene, this.camera);
	//console.timeEnd('render');

	// By rendering the layout once outside of the camera frustum, we cut the HUD first-render time down from
	// ~800ms to 200-300.
	// This could be further taken down by:
	//  - Sprited-texture-reuse in dom2three, as currently hud/index.png is loaded in to the GPU ~10 times.
	//  - Possibly moving the layout to be viewable on-camera before hiding
	if (this.hud.layout.visible && !this.hud.layout.userData.preloaded){

		this.hud.layout.userData.preloaded = true;
		this.hud.hide(true);

	}

	requestAnimationFrame(this.animate.bind(this));
}


VRUi.prototype.initResizeHandler = function() {
	var effect = this.effect;
	var camera = this.camera;

	function onWindowResize() {
		var innerWidth = window.innerWidth;
		var innweHeight =  window.innerHeight;
		camera.aspect = innerWidth / innweHeight;
		camera.updateProjectionMatrix();
		effect.setSize( innerWidth, innweHeight );
	}
	window.addEventListener( 'resize', onWindowResize, false );
};

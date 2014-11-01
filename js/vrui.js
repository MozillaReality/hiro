/*
VRUi
- Provides a three.js context for various UI components: hud, titling, loading and transitions.
- Hosts inputs: cursor, keyboard and VR headset orientation.
- Manages different rendering modes.
*/

'use strict';

function VRUi(container) {
	var self = this;

	this.homeUrl = '../content/construct/index.html';
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

	this.initKeyboardControls();

	//self.scene.add(self.gridlines());

	this.ready = Promise.all([this.hud.ready, this.title.ready, this.cursor.ready])
		.then(function() {
			// add hud layout to scene
			self.scene.add(self.hud.layout);

			// add transition mesh to scene
			self.scene.add(self.transition.object);

			// loading progress
			self.scene.add(self.loading.mesh);

			// add cursor to scene
			self.scene.add(self.cursor.layout);
			self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);

			// title
			self.scene.add(self.title.mesh);

			// Once all this is loaded, kick off start from VR
			// self.start();
		});

	return this;
};

// temporary wireframe lines for context alignment
VRUi.prototype.gridlines = function() {
	var geometry = new THREE.BoxGeometry(1,1,1,5,5,5);
	var material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	var cube = new THREE.Mesh( geometry, material );
	cube.scale.set( 50, 50, 50);
	return cube;
}

VRUi.prototype.load = function(url, opts) {
	var self = this;
	var opts = opts || {};
	var hideLoading = opts.hideLoading || false;
	this.hud.hide()
		.then(function() {

			self.cursor.disable();

			self.transition.fadeOut()
				.then(function() {

					if (opts.title || opts.authors) {
						self.title.setTitle(opts.title);
						self.title.setAuthor(opts.author);
					} else {
						self.title.setTitle('');
						self.title.setAuthor(url);
					}

					self.title.show();

					self.currentUrl = url;

					self.isHome = (url == self.homeUrl ? true : false );

					VRManager.load(url);

					if (!hideLoading) {
						self.loading.show();
					}

					function onTabReady() {
						self.loading.hide();

						self.transition.fadeIn();

						// hide title after set amount of time
						setTimeout(function() {
							if (!self.hud.visible) {
								self.title.hide().then(function() {
									// console.log('hiding container');
									// self.container.style.display = 'none';
								})
							}
						}, 3000);
					}

					VRManager.readyCallback = onTabReady;

				});
		});
};


VRUi.prototype.toggleHud = function() {
	if (!this.hud.visible) {
		this.hud.show();
		this.title.show();
		this.cursor.enable();
		console.log('showing HUD');
		VRManager.currentDemo.blur();
	} else {
		this.hud.hide();
		this.title.hide();
		this.cursor.disable();
		console.log('hiding HUD');
		VRManager.currentDemo.focus();
	}
};


/*
todo: need to normalize these settings with the same ones that are in cursor
*/
VRUi.modes = VRUi.prototype.modes = {
  mono: 1,
  stereo: 2,
  vr: 3
};

VRUi.prototype.initRenderer = function() {
	this.renderer = new THREE.WebGLRenderer( { alpha: true } );
  this.renderer.setClearColor( 0x000000, 0 );
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

	this.setRenderMode(this.mode);

  this.effect.setSize( window.innerWidth, window.innerHeight );

  this.container.appendChild(this.renderer.domElement);

  this.initResizeHandler();
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
		this.cursor.show();

	} else if (mode == VRUi.modes.stereo) {
		console.log('Stereo render mode');
		this.effect = new THREE.StereoEffect( this.renderer );
		this.controls = null;
		this.cursor.setMode('centered');
		this.cursor.disable();
	}

	this.effect.setSize( window.innerWidth, window.innerHeight );
}




VRUi.prototype.start = function(mode) {
	var self = this;

	this.ready.then(function() {
		// start hud
		//self.toggleHud();

		// start to home
		self.goHome(true);

		// kick off animation loop
		self.animate();
	});
};

VRUi.prototype.goHome = function(noTransition) {
	var self = this;
	var home = this.home;

	var opts = {
		title: 'HOME',
		author: '',
		hideLoading: true
	}

	this.isHome = true;

	if (noTransition) {
		// skip transitions and titles, load content directly.
		this.title.setTitle(opts.title);
		this.title.setAuthor(opts.author);

		VRManager.load(this.homeUrl);
	} else {

		this.load(this.homeUrl, opts);
	}
}

VRUi.prototype.reset = function() {
	var self = this;
	self.currentUrl = null;
	self.title.hide();
	self.cursor.disable();
	self.hud.hide()
		.then(function() {
			self.start();
		});
};

VRUi.prototype.animate = function() {
	var self = this;
	var controls = self.controls;
	var headQuat;

	// apply headset orientation and position to camera
	if (controls) {
		self.controls.update();

		if (typeof controls.getVRState === 'function') {
			headQuat = controls.getVRState().hmd.rotation;
		}
	}

	self.transition.update();

	self.loading.update();

	self.title.update();

	self.cursor.update(headQuat);

	// run any animation tweens
	TWEEN.update();

	// three.js renderer and effects.
	this.effect.render(this.scene, this.camera);

	requestAnimationFrame(this.animate.bind(this));
}


VRUi.prototype.initKeyboardControls = function() {
 	var self = this;

  function onkey(event) {
    if (!(event.metaKey || event.altKey || event.ctrlKey)) {
      event.preventDefault();
    }

    //console.log(event.keyCode)

    switch (event.keyCode) {
      case 70: // f
        VRManager.enableVR();
        break;
      case 90: // z
        VRManager.zeroSensor();
      	break;
      case 83: // s
      	self.setRenderMode(self.modes.stereo);
      	break;
      case 32: // space
        self.toggleHud();
        break;
    }
  }

  window.addEventListener("keydown", onkey, true);
};

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

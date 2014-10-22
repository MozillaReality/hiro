'use strict';

function VRUi(container) {
	var self = this;

	this.homeUrl = '../content/construct/index.html';
	this.container = container;
	this.hud = new VRHud();
	this.cursor = new VRCursor('hides');
	this.loading = new VRLoading();
	this.title = new VRTitle();
	this.transition = new VRTransition();

	// three.js
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;

	this.initRenderer();

	this.initKeyboardControls();

	this.initLaunchButton();

	//self.scene.add(self.gridlines());

	this.ready = Promise.all([this.hud.ready, this.title.ready])
		.then(function() {
			// add hud layout to scene
			self.scene.add(self.hud.layout);

			// add transition mesh to scene
			self.scene.add(self.transition.object);

			// loading progress
			self.scene.add(self.loading.mesh);

			// cursor
			var cursorLayout = self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);

			self.scene.add(cursorLayout);

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
	var hideLoading = opts.hideLoading || false;
	this.hud.hide()
		.then(function() {

			self.cursor.disable();

			self.transition.fadeOut()
				.then(function() {

					if (opts.title || opts.authors) {
						self.title.setTitle(opts.title);
						self.title.setAuthor(opts.author);
					}

					self.currentUrl = url;

					self.isHome = (url == self.homeUrl ? true : false );

					VRManager.load(url);

					if (!hideLoading) {
						self.loading.show();
					}

					VRManager.readyCallback = function() {
						self.loading.hide();

						self.transition.fadeIn();

						// hide title after set amount of time
						setTimeout(function() {
							if (!self.hud.visible) {
								self.title.hide();
							}
						}, 3000);
					}

				});
		});
};


VRUi.prototype.toggleHud = function() {
	if (!this.hud.visible) {
		this.hud.show();
		this.title.show();
		this.cursor.enable();
	} else {
		this.hud.hide();
		this.title.hide();
		this.cursor.disable();
	}
};

VRUi.prototype.initRenderer = function() {
	this.renderer = new THREE.WebGLRenderer( { alpha: true } );
  this.renderer.setClearColor( 0x000000, 0 );

  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	//this.camera.position.z = 1;
  //this.controls = new THREE.OrbitControls( this.camera );


  this.controls = new THREE.VRControls( this.camera );
  this.effect = new THREE.VREffect( this.renderer );

  this.effect.setSize( window.innerWidth, window.innerHeight );
  this.container.appendChild(this.renderer.domElement);
  this.initResizeHandler();
};

VRUi.prototype.start = function(mode) {

	var self = this;

	this.ready.then(function() {
		if (mode) {
			self.setRenderMode(mode);
		}

		// start hud
		self.toggleHud();

		// start to home
		self.goHome(true);

		// kick off animation loop
		self.animate();
	});
};

VRUi.prototype.setRenderMode = function(mode) {
	if (mode == VRManager.modes.normal) {
		console.log('normal 2d');
		this.effect = this.renderer;
	} else if (mode == VRManager.modes.vr) {
		console.log('vr');
		this.effect = new THREE.VREffect( this.renderer );
	} else if (mode == VRManager.modes.stereo) {
		console.log('stereo');
		//this.effect = new THREE.StereoEffect( this.renderer );
	}
	this.effect.setSize( window.innerWidth, window.innerHeight );
}

VRUi.prototype.goHome = function(noTransition) {
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

	if (VRManager.mode == VRManager.modes.vr) {
		var headQuat = controls.getVRState().hmd.rotation;
	}

	self.controls.update();

	self.transition.update();
	self.loading.update();
	self.title.update();
	self.cursor.update(headQuat);

	// tween
	TWEEN.update();

	// three.js render
	this.effect.render(this.scene, this.camera);

	requestAnimationFrame(this.animate.bind(this));
}

VRUi.prototype.initLaunchButton = function() {
	var button = document.querySelector('.launch-button');

	button.addEventListener('click', function() {
		VRManager.enableVR();
	});

};

VRUi.prototype.initKeyboardControls = function() {
 	/*
 	todo: Entering VR mode should be done with a button and not a
 	keyboard key.  This could be part of the startup scene.
 	*/
 	var self = this;

  function onkey(event) {
    if (!(event.metaKey || event.altKey || event.ctrlKey)) {
      event.preventDefault();
    }

    switch (event.keyCode) {
      case 70: // f
        VRManager.enableVR();
        break;
      case 90: // z
        VRManager.zeroSensor();
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

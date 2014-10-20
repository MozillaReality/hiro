'use strict';

function VRUi(container) {
	var self = this;

	this.homeUrl = '../content/construct/index.html';
	this.container = container;
	this.active = false;
	this.hud = new VRHud();
	this.cursor = new VRCursor('inFOV');
	this.loading = new VRLoading();
	this.title = null;
	this.transition = new VRTransition();
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;

	// main
	this.initRenderer();

	this.hud.ready.then(function() {
		self.scene.add(self.hud.layout);

		self.scene.add(self.transition.init());

		// loading progress
		self.scene.add(self.loading.mesh);

		// cursor & title needs some positional information from HUD before init.
		var title = new VRTitle();
		title.ready.then(function() {
			self.scene.add(title.mesh);
		});
		self.title = title;

		var cursorLayout = self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);
		self.scene.add(cursorLayout);
	})

	//self.scene.add(self.gridlines());

	this.initKeyboardControls();

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
	if (!this.active) {
		return false;
	}

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

  this.controls = new THREE.VRControls( this.camera );
  this.effect = new THREE.VREffect( this.renderer );
  this.effect.setSize( window.innerWidth, window.innerHeight );
  this.container.appendChild(this.renderer.domElement);
  this.initResizeHandler();
};

VRUi.prototype.start = function() {
	this.active = true;

	this.goHome(true);

	// kick off animation loop
	this.animate();
};

VRUi.prototype.goHome = function(noTransition) {
	var home = this.home;
	var opts = {
		title: 'HOME',
		author: '',
		hideLoading: true
	}

	this.isHome = true;

	if (noTransition) {
		this.title.setTitle(opts.title);
		this.title.setAuthor(opts.author);
		VRManager.load(this.homeUrl);
	} else {
		this.load(this.homeUrl, opts);
	}


}

VRUi.prototype.stop = function() {
	this.active = false;
};

VRUi.prototype.reset = function() {
	var self = this;
	self.currentUrl = null;
	self.title.hide();
	self.cursor.disable();
	self.hud.hide().then(function() {
		self.stop();
	})
};

VRUi.prototype.animate = function() {
	var self = this;
	var controls = self.controls;
	var headQuat = controls.getVRState().hmd.rotation;

	self.controls.update();
	self.transition.update();
	self.loading.update();
	self.title.update();
	self.cursor.update(headQuat);

	// tween
	TWEEN.update();

	// three.js render
	this.effect.render(this.scene, this.camera);

	if (this.active) {
		requestAnimationFrame(this.animate.bind(this));
	}
}

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
      case 83: // s
      	VRManager.enableStereo();
      	break;
      case 32: // space
        self.toggleHud();
        break;
    }
  }

  window.addEventListener("keydown", onkey, true);

  document.getElementById('launch-button').addEventListener('click', function() {
		VRManager.enableVR();
  });
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

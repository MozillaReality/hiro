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
	this.landingUrl = 'content/landing';
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

			// hud background
			self.scene.add(self.background());

			// add transition mesh to scene
			self.scene.add(self.transition.object);

			// title
			self.bend(self.title.mesh, 2.5, true)
			self.scene.add(self.title.mesh);

			// add hud layout to scene
			self.bend(self.hud.layout, 2, false)
			self.scene.add(self.hud.layout);

			// loading progress
			self.scene.add(self.loading.mesh);

			// add cursor to scene
			self.scene.add(self.cursor.layout);
			self.cursor.enable();

			self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);

			// Once all this is loaded, kick off start from VR
			// self.start();
		});

	return this;
};


VRUi.prototype.load = function(url, opts) {
	var self = this;

	var opts = opts || {};

	// hides loading progress animation
	var hideLoading = opts.hideLoading || false;

	// hides title frame
	var noTitle = opts.noTitle || false;

	// title frame title.
	var title = opts.title || '';

	// title frame url
	var titleUrl = opts.titleUrl || url;

	// title frame credits
	var titleCredits = opts.titleCredits || '';

	this.hud.hide()
		.then(function() {
			self.cursor.disable();

			self.transition.fadeOut()
				.then(function() {

					self.backgroundShow();

					// title
					self.title.setTitle(title);
					self.title.setUrl(titleUrl);
					self.title.setCredits(titleCredits);

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

					VRManager.load(url);

					if (!hideLoading) {
						self.loading.show();
					}

					function onTabReady() {
						var holdTitleTime = 3000;

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

					VRManager.readyCallback = onTabReady;

				});
		});
};


VRUi.prototype.toggleHud = function() {
	if (!this.hud.visible && this.hud.enabled) {
		// hide
		this.background.visible = true;
		this.backgroundShow();
		this.hud.show();
		this.title.show(1000);
		this.cursor.enable();
		console.log('showing HUD');
		VRManager.currentDemo.blur();


	} else if (this.hud.visible && this.hud.enabled) {
		// show
		this.backgroundHide(1000);
		this.hud.hide();
		this.title.hide(1000);
		this.cursor.disable();
		console.log('hiding HUD');
		VRManager.currentDemo.focus();

	} else {
		this.hud.hide();
	}
};


VRUi.prototype.start = function(mode) {
	var self = this;

	this.ready.then(function() {

		// start with hud
		// self.toggleHud();

		// start to home
		// self.goHome(true);

		// start with landing
		VRManager.load(self.landingUrl);

		// kick off animation loop
		self.animate();
	});
};


VRUi.prototype.goHome = function(noTransition) {
	var self = this;
	var home = this.home;

	var opts = {
		title: 'Home',
		credits: 'mozvr.com',
		hideLoading: true
	}

	this.isHome = true;

	if (noTransition) {
		// skip transitions and titles, load content directly.
		this.title.setTitle(opts.title);
		this.title.setCredits(opts.author);
		this.title.setUrl(this.homeUrl);
		self.cursor.disable();
		VRManager.load(this.homeUrl);
	} else {
		this.load(this.homeUrl, opts);
	}
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


VRUi.prototype.bend = function( group, amount, multiMaterialObject ) {
	function bendVertices( mesh, amount, parent ) {
		var vertices = mesh.geometry.vertices;

		if (!parent) {
			parent = mesh;
		}

		for (var i = 0; i < vertices.length; i++) {
			var vertex = vertices[i];

			// apply bend calculations on vertexes from world coordinates
			parent.updateMatrixWorld();

			var worldVertex = parent.localToWorld(vertex);

			var worldX = Math.sin( worldVertex.x / amount) * amount;
			var worldZ = - Math.cos( worldVertex.x / amount ) * amount;
			var worldY = worldVertex.y 	;

			// convert world coordinates back into local object coordinates.
			var localVertex = parent.worldToLocal(new THREE.Vector3(worldX, worldY, worldZ));
			vertex.x = localVertex.x;
			vertex.z = localVertex.z;
			vertex.y = localVertex.y;
		};

		mesh.geometry.computeBoundingSphere();
		mesh.geometry.verticesNeedUpdate = true;
	}


	for ( var i = 0; i < group.children.length; i ++ ) {
		var element = group.children[ i ];

		if (element.geometry.vertices) {
			if (multiMaterialObject) {
				bendVertices( element, amount, group);
			} else {
				bendVertices( element, amount);
			}
		}

		// if (element.userData.position) {
		// 	element.position.x = Math.sin( element.userData.position.x / amount ) * amount;
		// 	element.position.z = - Math.cos( element.userData.position.x / amount ) * amount;
		// 	element.lookAt( vector.set( 0, element.position.y, 0 ) );
		// }
	}
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
	var geometry = new THREE.SphereGeometry( 800 );

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
  this.renderer.setClearColor( 0x000000, 0 );
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );

	this.setRenderMode(this.mode);

  this.effect.setSize( window.innerWidth, window.innerHeight );

  this.container.appendChild(this.renderer.domElement);

  this.initResizeHandler();
};

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

	self.cursor.update(headQuat);

	// run any animation tweens
	TWEEN.update();

	// three.js renderer and effects.
	this.effect.render(this.scene, this.camera);

	requestAnimationFrame(this.animate.bind(this));
}

// todo: move off to main index.html?  perhaps dedicated controls module.
VRUi.prototype.initKeyboardControls = function() {
 	var self = this;

  function onkey(event) {
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

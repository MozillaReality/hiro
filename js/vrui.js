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

	this.landingUrl = 'content/sechelt';
	this.homeUrl = 'content/construct';
	this.homeUrlDelay = 5000; // delay before loading home from landing page when entering VR mode.

	this.container = container;
	this.hud = new VRHud();
	this.mode = this.modes.mono;
	this.cursor = new VRCursor('mono');
	// this.loading = new VRLoading();
	this.title = new VRTitle();
	this.instructions = new VRInstructions();
	this.transition = new VRTransition();

	// three.js
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;

	this.initRenderer();

	//self.scene.add(self.gridlines());

	this.ready = Promise.all([this.hud.ready, this.cursor.ready])
		.then(function() {

			// hud background
			self.scene.add(self.background());

			// add transition mesh to scene
			self.scene.add(self.transition.object3d);

			// title
			self.scene.add(self.title.object3d);

			// loading
			//self.scene.add(self.loading.object3d);

			// instructions
			self.scene.add(self.instructions.object3d);

			// add hud layout to scene
			self.bend(self.hud.layout, 2, false)
			self.hud.layout.scale.set(0.5, 0.5, 0.5);
			self.hud.enable();
			self.scene.add(self.hud.layout);

			// add cursor to scene
			self.scene.add(self.cursor.layout);

			self.cursor.init(self.renderer.domElement, self.camera, self.hud.layout);

			// Once all this is loaded, kick off start from VR
			// self.start();

		});

	return this;
};


VRUi.prototype.load = function(url, opts) {
	console.log('loading url: ' + url, opts);

	var self = this;

	var opts = opts || {};

	var instructions = opts.instructions || false;

	// hides loading progress animation
	var disableLoading = opts.noLoading || false;

	// hides titling and instructions
	var disableTitle = opts.noTitle || false;

	// hides transition
	var noTransition = opts.noTransition || false;

	var hideHud = self.hud.hide();


	var coverContentTransition = function() { self.transition.fadeOut(noTransition) }
	var showContentTransition = function() { self.transition.fadeIn() }
	var fadeContentToBlack = function() { self.backgroundShow(1) }
	var fadeInContent = function() { self.backgroundHide() }
	var showTitle = function() { self.title.show() }
	var hideTitle = function() { self.title.hide() }
	var disableCursor = function() { self.cursor.disable() }
	var unloadCurrentDemo = function() {  VRManager.unloadCurrent() }
	var showInstructions = function() {
			var delay = 1000;	// time before showing instructions
			var duration = 4000;
			return self.instructions.show(instructions, duration, delay);
		}
	var hideInstructions = function() {
		self.instructions.hide();
	}
	var onPageMeta = function(tab) {
			var title = tab.siteInfo.title;
			var description = tab.siteInfo.description;

			self.title.setTitle(title);
			self.title.setDescription(description);
		}
	var loadContent = function() {
			return new Promise(function(resolve, reject) {
				VRManager.load(url);
				// disabled onPageMeta for GDC demos.   meta loads only when page loads, so that happens too late for the demos.
				//VRManager.onPageMeta = onPageMeta;
				VRManager.onTabReady = function() {
					resolve()
				};
			});
		}



	// main loading sequence
	self.currentUrl = url;
	self.isHome = (url == self.homeUrl ? true : false );
	disableCursor();

	if (opts.hasOwnProperty('description')) self.title.setDescription(opts.description);
	if (opts.hasOwnProperty('title')) self.title.setTitle(opts.title);
	if (opts.hasOwnProperty('niceurl')) self.title.setUrl(opts.niceurl);

	hideHud
		.then(function() {
				coverContentTransition();
				fadeContentToBlack();
			})
		.then(function() {
			setTimeout(function() { unloadCurrentDemo() }, 1000);

			if (disableTitle) { // don't show titling or instructions.
				fadeInContent();
				loadContent();
			} else {
				showTitle();
				showInstructions()
					.then(loadContent)
					.then(function() {
						hideTitle();
						hideInstructions();
						setTimeout(function() {
							fadeInContent();
							showContentTransition();
						}, 1000)
					})
			}

		})

};

VRUi.prototype.showHud = function() {
	this.background.visible = true;
	this.backgroundShow();
	this.hud.show();
	this.title.show();
	this.cursor.enable();
	this.cursor.show();
	VRManager.currentDemo.blur();
};

VRUi.prototype.hideHud = function() {
	this.backgroundHide();
	this.hud.hide();
	this.title.hide();
	this.cursor.disable();
	VRManager.currentDemo.focus();
}

VRUi.prototype.toggleHud = function() {
	if (!this.hud.visible && this.hud.enabled) {
		// show
		this.showHud();
	} else if (this.hud.visible && this.hud.enabled) {
		// hide
		this.hideHud();
	} else {
		this.hud.hide();
	}
};


VRUi.prototype.start = function(mode) {
	var self = this;

	this.ready.then(function() {
		// start with hud
		self.cursor.disable();

		// start with landing
		// VRManager.load(self.landingUrl);
		// self.isLanding = true;
		self.goHome(true);

		// kick off animation loop
		self.animate();
	});
};


VRUi.prototype.goHome = function(noTransition) {
	var self = this;

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

VRUi.prototype.backgroundHide = function(delay, opacity) {
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

VRUi.prototype.backgroundShow = function(opacity) {
	if (!opacity) opacity = 0.6;

	var background = this.background;
	background.visible = true;

	var tween = new TWEEN.Tween( background.material )
		.to({ opacity: opacity }, 800 )
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
  this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 10000 );

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
	var self = this;
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

		//load from landing onto home
		if (this.isLanding && !QueryString.demo) {
			setTimeout(function() {
				self.load(self.homeUrl);
			}, self.homeUrlDelay)
		}

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
	if (controls) {
		this.controls.update();
	}

	//this.loading.update();

	this.cursor.update();

	// run any animation tweens
	TWEEN.update();

	// three.js renderer and effects.
	this.effect.render(this.scene, this.camera);

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

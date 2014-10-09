'use strict';

function VRUi(container) {
	var self = this;
	this.container = container;	
	this.active = false;
	this.settings = null;
	this.rafFunctions = []; 
	this.hud = new VRHud();
	this.cursor = new VRCursor();
	this.transition = new VRTransition();
	this.scene = this.camera = this.controls = this.renderer = this.effect = null;
	
	// main
	this.initRenderer();
	this.initSettings();
	this.initKeyboardControls();
	return this;
};

// temporary wireframe lines for testing purposes.
/*
todo: bug: the gridlines from the UI renderer to not match content.
*/
VRUi.prototype.gridlines = function() {
	var geometry = new THREE.BoxGeometry(1,1,1,5,5,5);
	var material = new THREE.MeshBasicMaterial( { color: 0x0000ff, wireframe: true } );
	var cube = new THREE.Mesh( geometry, material );
	cube.scale.set( 50, 50, 50);

	return cube;
}

VRUi.prototype.load = function(url) {
	var self = this;
	
	this.hud.hide()
		.then(function() {
			self.cursor.disable();
			self.transition.fadeOut()
			.then(function() {
				VRManager.load(url);
				self.transition.fadeIn();
			})
		});
};

VRUi.prototype.toggleHud = function() {
	if (!this.active) {
		return false;
	}

	if (!this.hud.visible) {
		this.hud.show();
		this.cursor.enable();
	} else {
		this.hud.hide();
		this.cursor.disable();
	}
};

VRUi.prototype.initSettings = function() {
	var self = this;

	function getJson(url) {
		return new Promise( function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			
			xhr.onload = function() {
				resolve(JSON.parse(xhr.response));
			}
			
			xhr.onerror = function() {
				reject(new Error('Some kind of network error, XHR failed.'))
			}

			xhr.open('GET', url);
			xhr.send();
		});
	}

	// combine settings exported from UI templates and match them up with the corresponding favorites.
	function parseSettings(values) {
		var user = values[0];
		var ui = values[1];

		// hash function
		var djb2Code = function(str){
	    var i, char, hash = 5381;
	    for (i = 0; i < str.length; i++) {
	        char = str.charCodeAt(i);
	        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
	    }
	    return hash;
		}

		// map ui to user favorites
		user.favorites = user.favorites.map(function(fav) {
			fav.id = djb2Code(fav.url);
			for (var i = 0; i < ui.length; i++) {
				if (ui[i].id == fav.id) {
					fav.ui = ui[i];
					break;
				}
			}
			return fav;
		});

		return user;
	}

	// main
	var userSettingsP = getJson('./data/settings.json');
	var uiSettingsP = getJson('./data/ui/index.json');

	Promise.all([userSettingsP, uiSettingsP]).then(function(values) {
		self.settings = parseSettings(values);

		/*
		todo: these initialization steps should happen elsewhere
		this is not well placed.
		*/
		var hudLayout = self.hud.init(self.settings.favorites);
		var cursorLayout = self.cursor.init(self.renderer.domElement, self.camera, hudLayout);
		var transitionLayout = self.transition.init();
		
		self.hudLayout = hudLayout;
		
		self.scene.add(hudLayout);
		self.scene.add(cursorLayout);
		self.scene.add(transitionLayout);
		//self.scene.add(self.gridlines());
	});
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
};

VRUi.prototype.start = function() {
	this.active = true;
	this.animate();
};

VRUi.prototype.stop = function() {
	this.active = false;
};

VRUi.prototype.reset = function() {
	var self = this;
	
	self.cursor.disable();
	self.hud.hide().then(function() {
		self.stop();	
	})
};

VRUi.prototype.animate = function() {
	var self = this;
	
	self.controls.update();
	self.transition.update();
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

    switch (event.key) {
      case 'f': // f
        VRManager.enableVR();
        break;
      case 'z': // z
        VRManager.zeroSensor();
        break;
      case ' ':
        self.toggleHud();
        break;
    }
  }

  window.addEventListener("keypress", onkey, true);
}

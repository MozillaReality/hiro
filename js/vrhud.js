'use strict';

function VRHud() {
	var self = this;

	this.visible = false;
	this.hudItems = [];
	this.layout = new THREE.Group();
	this.layout.name = "hud.layout";
	this.layout.visible = this.visible;
	this.homeButtonMesh = null;
	this.d23 = null;
	this.enabled = false;
	this.leapActivated = false;
	this.activeTweens = [];

	function loadJson(url) {
		return new Promise( function(resolve, reject) {
			var xhr = new XMLHttpRequest();

			xhr.onload = function() {
				resolve(xhr.response);
			}

			xhr.onerror = function() {
				reject(new Error('Some kind of network error, XHR failed.'))
			}

			xhr.open('GET', url);
			xhr.send();
		})
	};

	var jsonLoaded = loadJson('json/favorites.json')
		.then( function(response) {
			return JSON.parse(response)
		}, function(err) {
			reject(new Error('Error parsing JSON ' + err));
		})
		.then ( function(parsed) {
			return parsed;
		})

	var d23 = new DOM2three.load('d23/hud', {
		makeMeshes: true,
		pixelScale: 0.003
	});
	this.d23 = d23;

	this.ready = Promise.all([d23.loaded, jsonLoaded]).then(function(result) {
		var meshNodes = result[0];
		var favorites = result[1].favorites;

		self.makeLayout.call(self, meshNodes);
		self.attachEvents.call(self, favorites);

		self.show();
	});

	return this;
};

VRHud.prototype.disable = function() {
	this.hide();
	this.enabled = false;
};

VRHud.prototype.enable = function() {
	this.enabled = true;
};

VRHud.prototype.show = function() {
	var self = this;

	return new Promise( function(resolve, reject) {
		if (!self.visible) {
			self.layout.visible = true;
			self.visible = true;
			var countCompleted = 0;

			var buttonPlungers = self.d23.getNodesByClass('fav').map( function(node){return node.mesh;} );

			for (var i = 0; i < buttonPlungers.length; i++) {
				var button = buttonPlungers[i];
				var holder = button.parent;

				// this offsets appear to do.. nothing..
				holder.position.set(holder.userData.position.x, holder.userData.position.y - 1, holder.userData.position.z + 1);

				var tween = new TWEEN.Tween( holder.position )
					//.to( mesh.userData.position, 700 ) // For some reason, this seems to append NaN to the .position constructor method source. https://github.com/sole/tween.js/issues/175
					.to( { x: holder.userData.position.x, y: holder.userData.position.y, z: holder.userData.position.z}, 700 )
					.easing(TWEEN.Easing.Exponential.Out)
					.delay( i * 80 )
					.onComplete(function(){
						countCompleted++;
						if (countCompleted === buttonPlungers.length) self.setInteractable(true);
					})
					.start();

				self.activeTweens.push(tween);

				//mesh.scale.set(mesh.userData.scale.x * 0.75, mesh.userData.scale.y * 0.75, mesh.userData.scale.z);
				holder.scale.copy(holder.userData.scale).multiplyScalar(0.75); // z scale should be no-op (unless used by bend?)

				tween = new TWEEN.Tween( holder.scale )
					.to( { x: holder.userData.scale.x, y: holder.userData.scale.y, z: holder.userData.scale.z} , 500 )
					.easing(TWEEN.Easing.Exponential.Out)
					.delay( i * 80 )
					.start();

				self.activeTweens.push(tween);

				button.material.opacity = 0;

				tween = new TWEEN.Tween( button.material )
					.to({ opacity: 1 }, 300 )
					.easing(TWEEN.Easing.Exponential.Out)
					.delay( i * 80 )
					.start();

				self.activeTweens.push(tween);
			}

			self.layout.visible = true;
			self.visible = true;

			resolve();
		}
	});
};

VRHud.prototype.hide = function(instantaneous) {
	instantaneous === undefined && (instantaneous = false);

	var self = this;
	return new Promise( function(resolve, reject) {
		if (self.visible) {

			for (var i = 0; i < self.activeTweens.length; i++){
				self.activeTweens[i].stop();
			}

			self.activeTweens = [];

			var onComplete =  function() {
				self.layout.visible = false;
				self.visible = false;
				self.setInteractable(false);
				resolve();
			};

			if (instantaneous) return onComplete();

			var countCompleted = 0;
			var nodes = self.d23.getNodesByClass('fav');

			nodes.reverse();

			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				var mesh = node.mesh;

				mesh.material.opacity = 1;

				// should set interactable to false here

				new TWEEN.Tween( mesh.material )
					.to({ opacity: 0 }, 500 )
					.easing(TWEEN.Easing.Exponential.Out)
					.delay( i * 80 )
					.onComplete(function(){
						countCompleted++;
						if (countCompleted === nodes.length) onComplete();
					})
					.start();
			}

			self.leapActivated = false;


		} else {
			// already hidden, so resolve.
			resolve();
		}
	});
};

VRHud.prototype.attachEvents = function(favorites) {
	var self = this;
	var d23 = this.d23;

	favorites.forEach(function(favorite) {
		var node = d23.getNodeById(favorite.id);

		if (!node) {
			console.error('No node with id ' + favorite.id);
			return false;
		}

		var mesh = node.mesh;

		mesh.userData.url = favorite.url;

		mesh.addEventListener('mouseover', function(e) {
			var mesh = e.target;

			for (var i = 0; i < favorites.length; i++) {
				var m = d23.getNodeById(favorites[i].id).mesh;

				if (m !== mesh) {
					var material = m.material;
					var tween = new TWEEN.Tween( material.color )
						.to({ r: 0.6, g: 0.6, b: 0.6 }, 500 )
						.easing(TWEEN.Easing.Exponential.Out)
						.start();
				}
			}
		});

		mesh.addEventListener('mouseout', function(e) {
			var mesh = e.target;
			for (var i = 0; i < favorites.length; i++) {
				var m = d23.getNodeById(favorites[i].id).mesh;

				if (m !== mesh) {
					var material = m.material;
					var tween = new TWEEN.Tween( material.color )
						.to({ r: 1, g: 1, b: 1 }, 500 )
						.easing(TWEEN.Easing.Exponential.Out)
						.start();
				}
			}
		});

		// button should trigger click event
		mesh.addEventListener('click', function(e) {
			var target = e.target;

			if (self.enabled) {
				VRManager.ui.load(target.userData.url);
			}
		});


		if (Leap.loopController){
			var button = mesh.userData.button = new PushButton(
				new InteractablePlane( mesh, Leap.loopController, {moveX: false, moveY: false} ),
				{ locking: false }
			);

			mesh.receiveShadow = true;
			button.plane.interactable = false;

			button.on('press', function(){

				if ( !self.visible ) return;

				mesh.dispatchEvent({type: 'click'});

			} );

			var box = new THREE.Mesh(
				new THREE.BoxGeometry(mesh.geometry.parameters.width, mesh.geometry.parameters.height, button.options.longThrow),
				new THREE.MeshPhongMaterial({transparent: true, opacity: 0.3, color: 0xccccff})
			);
			box.scale.copy(mesh.scale);
			box.name = mesh.name + '-box';

			box.border(new THREE.LineBasicMaterial({
		    color: 0xffffff,
		    linewidth: 2
		  }));

			var scaleBox = function( plane, mesh ){

				// we can only change z by adjusting scale.
				// base * scale = newZ
				// newZ = base - travel
				// base * scale = base - travel
				// scale = (base - travel) / base
				// scale = 1 - travel / base

				box.scale.z = ( 1 - mesh.position.z / button.options.longThrow );
				if (box.scale.z === 0) box.scale.z = 1e-7; // Prevent matrix inverse warning on 0-scale.

				box.position.z = (button.options.longThrow + mesh.position.z) / 2;

			};

			scaleBox(button.plane, mesh);
			button.plane.on('travel', scaleBox);

			mesh.parent.add(box);

		}


	});
};

// This is simply a wrapper method for contained buttons.  It would be better served by a selector engine.
VRHud.prototype.setInteractable = function(state){
	var meshes = this.layout.children;
	var button;

	for (var i = 0; i < meshes.length; i++){
		button = meshes[i].children[0].userData.button;
		if (!button) continue;

		console.log('s', state);
		button.plane.safeSetInteractable(state)

	}

};

VRHud.prototype.makeLayout = function(nodes) {
	var hudScale = 0.15;
	var self = this;
	var hudRadius = 2 * hudScale;

	var layout = self.layout;

	this.favorites = [];

	return new Promise( function(resolve, reject) {
		nodes.forEach( function(node) {
			var mesh = node.mesh;

			var holder = new THREE.Object3D();

			mesh.scale.multiplyScalar(hudScale);
			mesh.position.multiplyScalar(hudScale);
			holder.positionRadially( hudRadius, mesh.position.x / hudRadius, mesh.position.y );
			mesh.position.set(0,0,0);  // Remove initial positioning from d23

			mesh.geometry.bend( hudRadius, mesh );

			holder.add( mesh );
			layout.add( holder );

			holder.userData.position = holder.position.clone();
			holder.userData.scale    = holder.scale.clone();

			// here turn these in to interactable planes/buttons
			// make them initially uninteractable
		});


		resolve();
	});
}
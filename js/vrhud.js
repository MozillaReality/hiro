'use strict';

function VRHud() {

	var self = this;

	this.layout = new THREE.Group();
	this.meshes = null;
	this.visible = false;
	this.homeButtonMesh = null;
	this.enabled = false;

	this.layout.visible = this.visible;

	// sketch
	function loadSketch(url, opts) {
		var xOffset = -(opts.artboardWidth / 2 * opts.pixelScale);
		var yOffset = (opts.artboardHeight / 2 * opts.pixelScale);

		return Sketch2three.load(url, opts)

		.then(function(meshes) {
			self.meshes = meshes;
			meshes.forEach(function(mesh) {
				mesh.position.x += xOffset;
				mesh.position.y += yOffset;
				mesh.position.z = -opts.depth;

				self.layout.add(mesh);
			});

		}, function(err) {
			console.log(err);
		})
	};


	var opts = {
		pixelScale: 0.0035,
		artboardWidth: 3600,
		artboardHeight: 900,
		depth: 1
	}

	this.ready = Promise.all([loadSketch('s23/images/index.json', opts), Utils.loadJson('json/favorites.json')]).then(function(result) {
		var meshes = result[0];
		var favorites = result[1].favorites;
		self.favorites = favorites;
		self.attachEvents.call(self, favorites);
	});


	function makeSelectionBox() {
		var size = 0.1;
		var geometry = new THREE.BoxGeometry(0.8,1.2,0.1);
		var material = new THREE.MeshBasicMaterial( { color: 0xffff00, wireframe: true } );
		var selection = new THREE.Mesh( geometry, material );
		self.layout.add(selection);
		selection.position.z = -0.5;
		selection.position.y = -0.12;
		self.selection = selection;
	}

	//makeSelectionBox();

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
			var offsetTime = 50; // time between each element being animated.

			self.layout.visible = self.visible = true

			var meshes = self.meshes.filter(function(mesh) { return mesh.name.indexOf('fav') !== -1 });

			meshes.sort(function(a, b) {
				return a.position.x > b.position.x;
			})

			meshes.forEach(function(mesh, i) {
        mesh.position.setY( mesh.position.y-1 );
        var tween = new TWEEN.Tween( mesh.position )
          .to( { y: -0.1 }, 200 )
          .easing(TWEEN.Easing.Cubic.Out)
          .delay(offsetTime * i)
          .start();

				mesh.material.opacity = 0;

				var tween = new TWEEN.Tween( mesh.material )
          .to( { opacity: 1 }, 200 )
          .easing(TWEEN.Easing.Cubic.Out)
          .delay(offsetTime * i)
          .onComplete(function() {
          	// animation done
          	resolve();
          })
          .start();
			});
		}
	});
};

VRHud.prototype.hide = function() {
	var self = this;

	return new Promise( function(resolve, reject) {
		if (self.visible) {
			var offsetTime = 50; // time between each element being animated.

			var meshes = self.meshes.filter(function(mesh) { return mesh.name.indexOf('fav') !== -1 });

			meshes.sort(function(a, b) {
				return a.position.x > b.position.x;
			})

			meshes.forEach(function(mesh, i) {
        var tween = new TWEEN.Tween( mesh.material )
          .to( { opacity: 0 }, 200 )
          .easing(TWEEN.Easing.Cubic.Out)
          .delay(offsetTime * i)
          .onComplete(function() {
          	resolve();
          	self.layout.visible = self.visible = false;
          })
          .start();
      })

		} else {
			// already hidden, so resolve.
			resolve();
		}
	});
};

VRHud.prototype.attachEvents = function(favorites) {
	var self = this;

	favorites.forEach(function(favorite) {
		var mesh = self.meshes.find(function(mesh) { return mesh.name === favorite.id })

		if (mesh) {
			mesh.userData = favorite;


			mesh.addEventListener('mouseover', function(e) {
				var target = e.target;

				//console.log(target);
			});
			// 	mesh.addEventListener('mouseover', function(e) {
			// 		var mesh = e.target;

			// 		for (var i = 0; i < favorites.length; i++) {
			// 			var m = d23.getNodeById(favorites[i].id).mesh;

			// 			if (m !== mesh) {
			// 				var material = m.material;
			// 				var tween = new TWEEN.Tween( material.color )
			// 					.to({ r: 0.6, g: 0.6, b: 0.6 }, 500 )
			// 					.easing(TWEEN.Easing.Exponential.Out)
			// 					.start();
			// 			}
			// 		}
			// 	});

			// 	mesh.addEventListener('mouseout', function(e) {
			// 		var mesh = e.target;
			// 		for (var i = 0; i < favorites.length; i++) {
			// 			var m = d23.getNodeById(favorites[i].id).mesh;

			// 			if (m !== mesh) {
			// 				var material = m.material;
			// 				var tween = new TWEEN.Tween( material.color )
			// 					.to({ r: 1, g: 1, b: 1 }, 500 )
			// 					.easing(TWEEN.Easing.Exponential.Out)
			// 					.start();
			// 			}
			// 		}
			// 	});


			mesh.addEventListener('click', function(e) {

				var target = e.target;

				if (self.enabled) {
					VRManager.ui.load(target.userData.url, target.userData);
				}
			});

			//favorite.mesh = mesh;
		}
	});
}


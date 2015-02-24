'use strict';

function VRHud() {
	var self = this;

	this.layout = new THREE.Group();
	this.meshes = null;
	this.visible = false;
	this.homeButtonMesh = null;
	this.enabled = false;

	this.layout.visible = this.visible;

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

	var objects = [];

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

				objects.push(mesh);
			});   
		}, function(err) {
			console.log(err);
		})


	};

	var opts = { pixelScale: 0.003, artboardWidth: 3600, artboardHeight: 900, depth: 1, exclude: ['frame.png'] }
	
	this.ready = Promise.all([loadSketch('s23/images/index.json', opts), jsonLoaded]).then(function(result) {
		var meshes = result[0];
		var favorites = result[1].favorites;
		self.favorites = favorites;

		self.attachEvents.call(self, favorites);
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
			self.layout.visible = self.visible = true
			
			// this is where you add your animation.
			var ar = Sketch2three.getMeshes('fav');
			console.log(ar);

			resolve();
		}
	});
};

VRHud.prototype.hide = function() {
	var self = this;
	return new Promise( function(resolve, reject) {
		if (self.visible) {
			self.layout.visible = self.visible = false;

			// this is wher eyou add your animation

			resolve();
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
			mesh.userData.url = favorite.url;

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
					VRManager.ui.load(target.userData.url);
				}
			});

			//favorite.mesh = mesh;
		}
	});
}


'use strict';

function VRHud() {
	var self = this;

	this.visible = false;
	this.hudItems = [];
	this.layout = new THREE.Group();
	this.layout.visible = this.visible;
	this.homeButtonMesh = null;
	this.d23 = null;

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

	var jsonLoaded = loadJson('../json/favorites.json')
		.then( function(response) {
			return JSON.parse(response)
		}, function(err) {
			reject(new Error('Error parsing JSON ' + err));
		})
		.then ( function(parsed) {
			return parsed;
		})

	var d23 = new DOM2three.load('../d23/hud', {
		makeMeshes: true
	});
	this.d23 = d23;

	this.ready = Promise.all([d23.loaded, jsonLoaded]).then(function(result) {
		var meshNodes = result[0];
		var favorites = result[1].favorites;

		self.attachEvents.call(self, favorites);
		self.makeLayout.call(self, meshNodes);
	});

	return this;
};

// VRHud.prototype.makeHomeButtonMesh = function() {
// 	var geometry = new THREE.IcosahedronGeometry( 30, 1 );
//   var material = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 1, side: THREE.DoubleSide } );
//   var mesh = new THREE.Mesh( geometry, material );
//   mesh.position.y = -150;
//   mesh.position.z = -600;

//   mesh.addEventListener('mouseover', function(e) {
// 		var material = e.target.material;
// 		if (material) {
// 			material.color.set( 0xffff00 );
// 			material.needsUpdate = true;
// 		}
// 	});

// 	mesh.addEventListener('mouseout', function(e) {
// 		var material = e.target.material;
// 		if (material) {
// 			material.color.set( 0x00ffff );
// 			material.needsUpdate = true;
// 		}
// 	});

// 	mesh.addEventListener('click', function(e) {
// 		VRManager.ui.goHome();
// 	});

// 	this.homeButtonMesh = mesh;

//   this.layout.add(mesh);
// }

VRHud.prototype.setInitial = function() {
	var items = this.hudItems;
	if (!this.visible) {
		// set scale of items to near 0 so that transitions playback properly from start.
		for (var i = 0; i < items.length; i++) {
			var mesh = items[i].mesh;
			mesh.scale.set(0.00001, 0.00001, 1);
		}
	}
};

VRHud.prototype.show = function() {
	var self = this;
	return new Promise( function(resolve, reject) {
		if (!self.visible) {
			self.layout.visible = true;
			self.visible = true;

			// if (VRManager.ui.isHome) {
			// 	self.homeButtonMesh.visible = false;
			// } else {
			// 	self.homeButtonMesh.visible = true;
			// }

			// self.animateScaleIn(self.hudItems).then(function() {
			// 	resolve();
			// });

			self.layout.visible = true;
			self.visible = true;

			resolve();
		}
	});
};

VRHud.prototype.hide = function() {
	var self = this;
	return new Promise( function(resolve, reject) {
		if (self.visible) {
			// self.homeButtonMesh.visible = false;

			// self.animateScaleOut(self.hudItems).then(function() {
			// 	self.layout.visible = false;
			// 	self.visible = false;
			// 	resolve();
			// });

			self.layout.visible = false;
			self.visible = false;

			resolve();
		} else {
			resolve();
		}
	});
};

VRHud.prototype.animateScaleOut = function(items) {
	return new Promise( function(resolve, reject) {
		for (var i = 0; i < items.length; i++) {
			var mesh = items[i].mesh;
			var tween = new TWEEN.Tween( mesh.scale )
				.to({ x: 0.00001, y: 0.00001 }, 500 )
				.easing(TWEEN.Easing.Exponential.Out)
				.onComplete(function() {
					resolve();
				})
				.start();
		}
	});
};

VRHud.prototype.animateScaleIn = function(items) {
	return new Promise( function(resolve, reject) {
		for (var i = 0; i < items.length; i++) {
			var mesh = items[i].mesh;
			var tween = new TWEEN.Tween( mesh.scale )
				.to(mesh.userData.scale, 500)
				.easing(TWEEN.Easing.Quintic.Out)
				.onComplete(function() {
					resolve();
				})
				.start();
		}
	})
};

VRHud.prototype.attachEvents = function(favorites) {
	var d23 = this.d23;
	favorites.forEach(function(favorite) {
		var node = d23.getNodeById(favorite.id);

		if (!node) {
			console.error('No node with id ' + favorite.id);
			return false;
		}

		var mesh = node.mesh;

		mesh.addEventListener('mouseover', function(e) {
			var material = e.target.material;
			if (material) {
				material.color.set(0x1796da);
				material.needsUpdate = true;
			}
		});

		mesh.addEventListener('mouseout', function(e) {
			var material = e.target.material;
			if (material) {
				material.color.set(0xffffff);
				material.needsUpdate = true;
			}
		});

		(function(n, f) {
			var mesh = n.mesh;
			mesh.addEventListener('click', function(e) {
				VRManager.ui.load(f.url, {
					author: f.credits,
					title: f.title
				});
			})
		})(node, favorite);


	});
}

VRHud.prototype.makeLayout = function(nodes) {
	var self = this;

	var layout = self.layout;

	return new Promise( function(resolve, reject) {
		nodes.forEach( function(node) {
			var mesh = node.mesh;

			layout.add( mesh );
		});

		layout.position.set(0, -0.15, 0);

		resolve();
	});
}
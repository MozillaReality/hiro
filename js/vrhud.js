'use strict';

function VRHud() {
	var self = this;
	this.visible = false;
	this.hudItems = [];
	this.layout = new THREE.Group();
	this.layout.visible = this.visible;
	this.constructNavMesh = null;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {
		var d23 = new DOM2three('../data/hud/index.json', {
			centerLayoutTo: '#site-location'
		});

		d23.onload = function() {
			self.d23 = this;

			self.setBackground();

			self.makeConstructNav();

			self.makeLayout().then(function() {
				// var date = new Date;
				// self.d23.setText('.clock-time', date.getHours() + ':' + date.getMinutes());
				self.setInitial();
				resolve();
			});


		};
	});

	return this;
};

VRHud.prototype.makeConstructNav = function() {
	var geometry = new THREE.IcosahedronGeometry( 30, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity: 1, side: THREE.DoubleSide } );
  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = -150;
  mesh.position.z = -600;

  mesh.addEventListener('mouseover', function(e) {
		var material = e.target.material;
		if (material) {
			material.color.set( 0xffff00 );
			material.needsUpdate = true;
		}
	});

	mesh.addEventListener('mouseout', function(e) {
		var material = e.target.material;
		if (material) {
			material.color.set( 0x00ffff );
			material.needsUpdate = true;
		}
	});

	mesh.addEventListener('click', function(e) {
		VRManager.ui.goHome();
	});

	this.constructNavMesh = mesh;

  this.layout.add(mesh);
}

VRHud.prototype.setBackground = function() {
	var geometry = new THREE.SphereGeometry( 700 );
	var material = new THREE.MeshBasicMaterial( {color: 0x00000, side: THREE.BackSide, transparent: true, opacity: 0.5 } );
	var cylinder = new THREE.Mesh( geometry, material );
	cylinder.renderDepth = 1;
	this.layout.add( cylinder );
}

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
	return new Promise(function(resolve, reject) {
		if (!self.visible) {
			self.layout.visible = true;
			self.visible = true;

			if (VRManager.ui.isHome) {
				self.constructNavMesh.visible = false;
			} else {
				self.constructNavMesh.visible = true;
			}

			self.animateScaleIn(self.hudItems).then(function() {
				resolve();
			});
		}
	});
};

VRHud.prototype.hide = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (self.visible) {
			self.constructNavMesh.visible = false;

			self.animateScaleOut(self.hudItems).then(function() {
				self.layout.visible = false;
				self.visible = false;
				resolve();
			});
		} else {
			resolve();
		}
	});
};

VRHud.prototype.animateScaleOut = function(items) {
	return new Promise(function(resolve, reject) {
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
	return new Promise(function(resolve, reject) {
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


VRHud.prototype.makeLayout = function() {
	var self = this;

	return new Promise( function(resolve, reject) {
		var layout = self.layout;
		var items = self.d23.getAllDisplayItems();

		self.hudItems = self.hudItems.concat(self.hudItems, items);

		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			item.sound = new VRSound(['/sounds/click.mp3'],  275, 1);
			var mesh = self.d23.makeMesh(item);

			// make interactable if item has userData.url
			if (item.userData && item.userData.url) {
				mesh.addEventListener('mouseover', function(e) {
					var material = e.target.material;
					if (material) {
						material.color.set( 0x1796da );
						material.needsUpdate = true;
					}
				});

				mesh.addEventListener('mouseout', function(e) {
					var material = e.target.material;
					if (material) {
						material.color.set( 0xffffff );
						material.needsUpdate = true;
					}
				});

				mesh.addEventListener('click', function(e) {
					var item = e.target.userData.item;
					item.sound.play();
					VRManager.ui.load(item.userData.url, {
						author: item.userData.author,
						title: item.userData.title
					});
				});
			};

			layout.add( mesh );
		};

		function bend( group, amount ) {
			var vector = new THREE.Vector3();
			for ( var i = 0; i < group.children.length; i ++ ) {
				var element = group.children[ i ];
				//element.position.z = -800;
				if (element.userData.position) {
					element.position.x = Math.sin( element.userData.position.x / amount ) * amount;
					element.position.z = - Math.cos( element.userData.position.x / amount ) * amount;
					element.lookAt( vector.set( 0, element.position.y, 0 ) );
				}
			}
		}

		bend( layout, 600 );

		resolve();
	});
}
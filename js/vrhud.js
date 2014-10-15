'use strict';

function VRHud() {
	var self = this;
	this.visible = false;
	this.hudItems = [];
	this.layout = new THREE.Group();
	this.layout.visible = this.visible;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {
		var d23 = new DOM2three('../data/hud/index.json', {
			centerLayoutTo: '#site-location'
		});

		d23.onload = function() {
			self.d23 = this;
			//self.setBackground();
			self.makeLayout().then(function() {
				var date = new Date;
				self.d23.setText('.clock-time', date.getHours() + ':' + date.getMinutes());
				self.setInitial();
				resolve();
			});
		};
	});

	return this;
};

VRHud.prototype.setBackground = function() {
	console.log('setting background');
	var geometry = new THREE.CylinderGeometry( 800, 650, 500, 64, 1, true );
	var material = new THREE.MeshBasicMaterial( {color: 0x00000, side:THREE.DoubleSide, transparent: true, opacity: 0.5 } );
	var cylinder = new THREE.Mesh( geometry, material );
	cylinder.renderDepth = 1;
	this.layout.add( cylinder );
}

VRHud.prototype.setInitial = function() {
	var items = this.hudItems;
	if (!this.visible) {
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
			self.animateScaleOut(self.hudItems).then(function() {
				self.layout.visible = false;
				self.visible = false;
				resolve();
			});
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
					VRManager.ui.load(item.userData.url, item);
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
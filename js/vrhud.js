'use strict';

function VRHud() {
	var self = this;
	this.visible = false;
	this.layout = new THREE.Group();
	this.layout.visible = this.visible;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {
		var d23 = new DOM2three('../data/hud/index.json');

		d23.onload = function() {
			self.d23 = this;

			self.makeLayout().then(function() {
				var date = new Date;
				self.d23.setText('.clock-time', date.getHours() + ':' + date.getMinutes());
				resolve();
			});
		};
	});

	return this;
};

VRHud.prototype.show = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (!self.visible) {
			self.layout.visible = true;
			self.visible = true;
			// transition in
			// todo: replace with animation
			setTimeout(function() {
				resolve();
			}, 500);
		}
	});
};

VRHud.prototype.hide = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (self.visible) {
			// transition out
			// todo: replace with animation
			setTimeout(function() {
				self.layout.visible = false;
				self.visible = false;
				resolve();
			}, 500);
		}
	});
};


VRHud.prototype.makeLayout = function() {
	var self = this;
	return new Promise( function(resolve, reject) {
		var layout = self.layout;
		var items = self.d23.getAllDisplayItems();

		for (var i = 0; i < items.length; i++) {
			var item = items[i];

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
				element.position.x = Math.sin( element.userData.position.x / amount ) * amount;
				element.position.z = - Math.cos( element.userData.position.x / amount ) * amount;
				element.lookAt( vector.set( 0, element.position.y, 0 ) );
			}
		}

		bend( layout, 600 );

		resolve();
	});
}
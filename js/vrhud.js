'use strict';

function VRHud() {
	var self = this;
	this.visible = false;
	this.layout = new THREE.Group();
	this.layout.visible = this.visible;
	this.data = null;
	this.texture = null;

	this.ready = new Promise(function(resolve, reject) {
		var loadData = new Promise(function(resolve, reject) {
			var d23 = new DOM2three('../data/ui/index.json','hud');
			d23.onload = function() {
				resolve(this.root);
			};
		});

		var loadTexture = new Promise(function(resolve, reject) {
			var texture = THREE.ImageUtils.loadTexture('../data/ui/index.png', undefined, function() {
				resolve(texture);
			});
		});

		Promise.all([loadData, loadTexture])
			.then( function(data) {
				self.makeLayout(data[0], data[1])
					.then( function() {
						resolve();
					})
			});
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

VRHud.prototype.makeLayout = function(data, texture) {
	var self = this;
	return new Promise( function(resolve, reject) {
		var items = data.items;
		var layout = self.layout;
		var geometry = new THREE.PlaneGeometry( 1, 1 );

		items.forEach(function(item) {
			if (item.display) {
				var tex = texture.clone();
				var rect = item.rectangle;

				tex.repeat.x = rect.width / tex.image.width;
				tex.repeat.y = rect.height / tex.image.height;
				tex.offset.x = rect.x / tex.image.width;
				tex.offset.y = 1 - ((rect.y + rect.height) / tex.image.height );
				tex.needsUpdate = true;

				var material = new THREE.MeshBasicMaterial({ map : tex });

				var centerOffsetX = tex.image.width / 2;
				var centerOffsetY = tex.image.height / 2;
				var x = rect.x + (rect.width / 2) - centerOffsetX;
				var y = rect.y + (rect.height / 2) - centerOffsetY;

				var button = new THREE.Mesh( geometry, material );
				button.position.set( x, - y, 0 );

				button.scale.set( rect.width, rect.height, 1 );
				button.userData.position = new THREE.Vector2( x, y );

				if (item.userData && item.userData.url) {
					button.addEventListener('mouseover', function(e) {
						if (material) {
							material.color.set( 0x0f0ff );
							material.needsUpdate = true;
						}
					});

					button.addEventListener('mouseout', function(e) {
						if (material) {
							material.color.set( 0xffffff );
							material.needsUpdate = true;
						}
					});

					button.addEventListener('click', function(e) {
						VRManager.ui.load(item.userData.url);
					});
				}

				layout.add(button);
			}

		});

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
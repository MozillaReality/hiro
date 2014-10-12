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
			var d23 = new DOM2three('../data/hud/index.json','hud');
			d23.onload = function() {
				resolve(this.root);
			};
		});

		var loadTexture = new Promise(function(resolve, reject) {
			var texture = THREE.ImageUtils.loadTexture('../data/hud/index.png', undefined, function() {
				resolve(texture);
			});
		});

		Promise.all([loadData, loadTexture])
			.then( function(data) {
				var uiData = data[0]
				self.makeLayout(uiData, data[1])
					.then( function() {

						self.updateLive(uiData, '.authors', 'TEST AUTHOR');
						self.updateLive(uiData, '.title h1', 'TEST TITLE OF SITE');

						var date = new Date;
						self.updateLive(uiData, '.clock-time', date.getHours() + ':' + date.getMinutes());

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


VRHud.prototype.updateLive = function(data, selector, text) {
	var items = data.items;

	items.forEach(function(item) {
		if (item.content) {
			item.content.forEach(function(content) {
				if (content.hasOwnProperty('canvas') && content.selector == selector) {
					var context = content.canvas.context;

					// clear existing text
					context.clearRect(content.canvas.clearRect.x,
						content.canvas.clearRect.y,
						content.canvas.clearRect.width,
						content.canvas.clearRect.height);

					context.fillText(text,
						content.canvas.x,
						content.canvas.y
					);
				}
			})
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
			// render anyhting that has display flag set
			if (item.display) {
				var rect = item.rectangle;

				// texture positioning
				var tex = texture.clone();
				tex.repeat.x = rect.width / tex.image.width;
				tex.repeat.y = rect.height / tex.image.height;
				tex.offset.x = rect.x / tex.image.width;
				tex.offset.y = 1 - ((rect.y + rect.height) / tex.image.height );
				tex.needsUpdate = true;

				// object positioning
				var centerOffsetX = tex.image.width / 2;
				var centerOffsetY = tex.image.height / 2;
				var x = rect.x + (rect.width / 2) - centerOffsetX;
				var y = rect.y + (rect.height / 2) - centerOffsetY;

				// material

				var materials = [new THREE.MeshBasicMaterial({ map : tex })];

				if (item.content) {
					item.content.forEach( function(content) {

						if (content.hasOwnProperty('canvas')) {
							// create a canvas element for canvas enabled selector
							var canvas = document.createElement('canvas');
							// set to parent element width/height
							canvas.width = rect.width;
							canvas.height = rect.height;

							var context = canvas.getContext('2d');
							// set canvas text styles
							context.font = content.font;
							context.fillStyle = content.fillStyle;

							// persist values for use later when we want to change contents
							content.canvas = {};
							content.canvas.context = context;
							content.canvas.x = content.rectangle.x - rect.x;
							content.canvas.y = content.rectangle.y - rect.y + content.rectangle.height;
							content.canvas.width = content.rectangle.width;
							content.canvas.height = content.rectangle.height;
							content.canvas.clearRect = {
								x: content.rectangle.x - rect.x,
								y: content.rectangle.y - rect.y,
								width: content.rectangle.width,
								height: content.rectangle.height
							};

							// create new material from canvas
							var ctexture = new THREE.Texture(canvas);
							ctexture.needsUpdate = true;

							var cmaterial = new THREE.MeshBasicMaterial( { map: ctexture, side:THREE.DoubleSide } );
    					cmaterial.transparent = true;

    					materials.push(cmaterial);
						}
					});
				}

				var button;
				if (materials.length > 1) {
					button = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
				} else {
					button = new THREE.Mesh( geometry, materials[0] );
				}
				button.position.set( x, - y, 0 );
				button.scale.set( rect.width, rect.height, 1 );
				// cache button position to be used later for animation/positioning.
				button.userData.position = new THREE.Vector2( x, y );

				// make interactable if button has userData.url
				if (item.userData && item.userData.url) {
					var material = materials[0];	// assume first material
					button.addEventListener('mouseover', function(e) {
						if (material) {
							material.color.set( 0x1796da );
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
				};

				item.object = button;

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
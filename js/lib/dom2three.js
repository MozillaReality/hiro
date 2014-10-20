'use strict';

function DOM2three(uiJson, opts) {
	var self = this;
	self.path = null;
	self.data = null;
	self.onload = null;
	self.texture = null;
	self.mesh = null;
	self.item = null;
	self.centerOffsetX = null;
	self.centerOffsetY = null;

	// options
	self.opts = opts || {};
	self.centerLayoutTo = self.opts.centerLayoutTo || null;

	function callonloadcallback() {
		if (typeof self.onload == 'function') {
			self.onload.call(self);
		}
	}

	self.loadJson(uiJson)
		.then( function(response) {
				return JSON.parse(response)
			}, function(err) {
				console.error('Error parsing JSON ', err);
			})
		.then( function(response) {
			self.data = response;
			if (self.data.texture) {
				self.loadTexture(self.data.texture)
					.then(function() {
						// data loaded
						// texture loaded
						self.calculateCenterOffset();
						callonloadcallback();
					})
					.catch(function(err) {
						console.warn(err);
						callonloadcallback();
					})
					;
			}
		})
		.catch(function(err) {
			console.error('Error loading JSON ', err);
		});

	return this;
}

/*
bits for three.js layouts
-----------------------
*/
DOM2three.prototype.loadTexture = function(src) {
	var self = this;
	return new Promise(function(resolve, reject) {
		var path = self.path + src;
		var texture = THREE.ImageUtils.loadTexture(path, undefined,
			function() {
				self.texture = texture;
				resolve(texture);
			}, function() {
				reject('texture not loaded: ' + path);
			});
	})
}

DOM2three.prototype.setText = function(selector, text) {
	var select = this.getNode(selector);

	if (!select) {
		console.warn('Nothing found for ',select);
		return false;
	};

	var context = select.canvasMaterial.context;

	context.clearRect(0,0,
		select.canvasMaterial.canvas.width,
		select.canvasMaterial.canvas.height);

	var x, y;
	if (select.textAlign == 'center') {
		x = select.rectangle.width / 2;
	}
	y = select.canvasMaterial.y;

	context.fillText(text, x, y);

	select.canvasMaterial.texture.needsUpdate = true;

}

DOM2three.prototype.getAllDisplayItems = function() {
	var items = this.data.items;
	var collection = [];
	for (var i = 0; i < items.length; i++) {
		var item = items[i];

		if (item.display) {
			collection.push(item);
		}
	};

	return collection;
}

DOM2three.prototype.calculateCenterOffset = function() {
	var	centerOffsetX, centerOffsetY;

	var centerItem = this.opts.centerLayoutTo;
	var texture = this.texture;

	if (centerItem) {
		var node = this.getNode(centerItem);
		centerOffsetX = node.rectangle.x + (node.rectangle.width / 2);
		centerOffsetY = node.rectangle.y + (node.rectangle.height / 2);
	} else {
		centerOffsetX = texture.image.width / 2;
		centerOffsetY = texture.image.height / 2;
	}

	this.centerOffsetY = centerOffsetY;
	this.centerOffsetX = centerOffsetX;
};

DOM2three.prototype.makeMesh = function(item) {
	if (!item) {
		console.error('no item specified');
		return false;
	}
	var self = this;

	// geometry
	var geometry = new THREE.PlaneBufferGeometry( 1, 1 );

	// texture positioning
	var rect = item.rectangle;
	var tex = self.texture.clone();
	tex.repeat.x = rect.width / tex.image.width;
	tex.repeat.y = rect.height / tex.image.height;
	tex.offset.x = rect.x / tex.image.width;
	tex.offset.y = 1 - ((rect.y + rect.height) / tex.image.height );
	tex.needsUpdate = true;
	item.texture = tex;

	// item positioning
	var x = rect.x + (rect.width / 2) - self.centerOffsetX;
	var y = rect.y + (rect.height / 2) - self.centerOffsetY;
	item.position = {
		x: x,
		y: y
	};

	var material = new THREE.MeshBasicMaterial({ map: tex, transparent: true });

	var materials = [];

	if(item.display) {
		materials.push(material);
	}


	// create additional materials for each replaceable piece of content.
	if (item.content) {
		var canvasMaterials = this.createCanvasMaterials(item);
		materials = materials.concat(canvasMaterials);
	}

	// mesh
	var mesh;
	if (materials.length > 1) {
		mesh = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
	} else {
		mesh = new THREE.Mesh( geometry, materials[0] );
	}

	mesh.position.set( x, -y, 0);
	mesh.scale.set( rect.width, rect.height, 1 );
	mesh.userData.position = new THREE.Vector2( x, y );
	mesh.userData.scale = new THREE.Vector2( rect.width, rect.height );
	mesh.userData.item = item;

	item.mesh = mesh;

	self.item = item;

	return mesh;
}

DOM2three.prototype.getMesh = function(selector) {
	var self = this;
	var item = this.getNode(selector);

	return self.makeMesh(item);
}

DOM2three.prototype.createCanvasMaterials = function(item) {
	var materials = [];

	item.content.forEach(function(content) {
		if (content.hasOwnProperty('canvas')) {
			var rect = item.rectangle;
			// create a canvas element for canvas enabled selector
			var canvas = document.createElement('canvas');
			// set to parent element width/height
			canvas.width = rect.width;
			canvas.height = rect.height;

			var context = canvas.getContext('2d');
			context.font = content.font;
			context.fillStyle = content.fillStyle;
			context.textAlign = content.textAlign;
			content.canvasMaterial = {};
			content.canvasMaterial.canvas = canvas;
			content.canvasMaterial.context = context;
			content.canvasMaterial.x = content.rectangle.x - rect.x;
			content.canvasMaterial.y = content.rectangle.y - rect.y + content.rectangle.height;

			var texture = new THREE.Texture(canvas);
			texture.needsUpdate = true;

			var material = new THREE.MeshBasicMaterial( { map: texture, side:THREE.FrontSide } );
			material.transparent = true;

			content.canvasMaterial.texture = texture;

			materials.push(material);
		}
	});

	return materials;
}

DOM2three.prototype.getNode = function(selector) {
	var items = this.data.items;
	for (var i = 0; i < items.length; i++) {
		var item = items[i];

		if (item.hasOwnProperty('selector')) {
			if (item.selector == selector) {
				return item;
				break;
			}
		};

		if (item.content) {
			for (var j = 0; j < item.content.length; j++) {
				var content = item.content[j];
				if (content.hasOwnProperty('selector')) {
					if (content.selector == selector) {
						return content;
						break;
					}
				}
			}
		}
	}
	return false;
}


/*
bits for HTML templates
-----------------------
*/

/*
get placement on page
*/
DOM2three.prototype.getRectangle = function(el) {
	var rect = el.getBoundingClientRect();
	return {
		x: rect.x,
		y: rect.y,
		width: el.offsetWidth,
		height: el.offsetHeight
	};
}

/*
applies to any item with content property.
*/
DOM2three.prototype.applyContent = function(dom) {
	var self = this;
	var items = self.data.items;

	items.forEach(function(item) {
		var select = dom.querySelector(item.selector);

		var el;

		// clone the item that is being selected.
		if (item.clone) {
			el = select.cloneNode(true);
			el.id = '';	// clear ID so that we don't collide with cloned element.
			select.parentNode.appendChild(el);
		} else {
			el = select;
		}

		// project content into element.
		if (item.content) {
			item.content.forEach(function(content) {
				if (content.selector) {
					var cel = el.querySelector(content.selector)
					if (cel) {
						// content with canvas property will be overwritten using canvas text.
						if (content.canvas) {
							cel.innerHTML = '&nbsp;';
						} else {
							cel.innerHTML = content.content;
						}

						content.el = cel;
					} else {
						console.error(content.selector + " not found");
					}
				}
			});
		};
		item.el = el;
	});

	return items;
}

DOM2three.prototype.getItemsRectangles = function() {
	var self = this;
	var items = self.data.items;

	items.forEach(function(item) {
		item.rectangle = self.getRectangle(item.el);
		if (item.content) {
			item.content.forEach(function(content) {
				content.rectangle = self.getRectangle(content.el);
			});
		}
	});
}


/*
utils
-----------------------
*/
DOM2three.prototype.loadJson = function(url) {
	var a = document.createElement('a');
	a.href = url;
	var path = a.pathname.substring(0, a.pathname.lastIndexOf('/')) + '/';
	this.path = path;

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
	});
};

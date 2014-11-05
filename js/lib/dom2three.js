'use strict';

var DOM2three = (function() {
	function DOM2three() {
	}

	DOM2three.prototype.save = function() {

		function getElRectangle(el) {
			var rect = el.getBoundingClientRect();

			return {
				x: rect.x,
				y: rect.y,
				width: el.offsetWidth,
				height: el.offsetHeight
			}
		};

		function saveElsData(nodes, textNodes) {
			var elsData = [];

			for (var i = 0; i < nodes.length; i++) {
				var nodeData = {}

				var node = nodes[i];

				var nodeRect = getElRectangle(node);
				nodeData.rectangle = nodeRect;

				nodeData.classList = node.classList;

				nodeData.id = node.id;

				if (textNodes) {
					/*
					save computed css font styles for applying to canvas text.
					format: normal 700 24.5px Montserrat
					*/

					var style = window.getComputedStyle(node, null);

					var cssText = style.fontVariant + ' ' +
						style.fontWeight + ' ' +
						style.fontSize + ' ' +
						style.fontFamily;
						// color
						// alignment

					// clear text from node so that it doesn't rasterize to texture.
					node.innerHTML = '&nbsp;';

					nodeData.cssText = cssText;

					if (!node.dataset.hostmesh) {
						console.error('Must specify a host mesh which text node will be part of.', node);
					};
					nodeData.hostMesh = node.dataset.hostmesh;

					nodeData.textNode = true;
				}

				elsData.push(nodeData);
			}

			return elsData;

		};

		function saveToTag(contents) {
			var script = document.createElement('script');
			script.id = 'dom2three';
			script.type = 'application/json';
			script.innerHTML = JSON.stringify(contents);

			document.body.appendChild(script);

			console.log(script);
		};

		/*
		grab dom2three elements and save all the required data we need to rebuild into three.js meshes and textareas.
		*/
		var textNodes = saveElsData(document.querySelectorAll('[data-textarea]'), true);
		var meshNodes = saveElsData(document.querySelectorAll('[data-mesh]'), false);
		var nodes = textNodes.concat(meshNodes);

		var nodesData = {
			nodes: nodes
		};

		/*
		save all data into script tag so we can pick it up with the scraper
		*/

		saveToTag(nodesData);
	};




	DOM2three.prototype.load = function(path, opts) {
		var self = this;

		self.opts = opts || {};

		// if set to true, create meshes for all nodes.
		self.makeMeshes = self.opts.makeMeshes || false;

		if (!path) {
			console.error('must specify path to dom2three data');
			return false;
		}

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

		function loadTexture(url) {
			return new Promise( function(resolve, reject) {
				var texture = THREE.ImageUtils.loadTexture(url, undefined,
					function() {
						self.texture = texture;
						resolve(texture);
					}, function() {
						reject('texture not loaded: ' + path);
					});
			})
		};

		function getTextnodes(hostmeshId) {
			var textNodes = [];

			self.nodes.forEach(function(node) {
				if (node.hostMesh == hostmeshId) {
					textNodes.push(node);
				}
			});

			return textNodes;
		};

		function createCanvasMaterials(textNodes, hostNode) {
			var materials = [];

			textNodes.forEach(function(textNode) {
				var rectangle = textNode.rectangle;
				var canvas = document.createElement('canvas');
				canvas.width = hostNode.rectangle.width;
				canvas.height = hostNode.rectangle.height;

				var context = canvas.getContext('2d');

				context.font = textNode.cssText;

				var x = hostNode.rectangle.x - rectangle.x;
				var y = hostNode.rectangle.y - rectangle.y + hostNode.rectangle.height;

				context.fillText('Test TEXT', x, y);

				var texture = new THREE.Texture(canvas);
				texture.needsUpdate = true;

				var material = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true
				});

				materials.push(material);
			});

			return materials;
		};


		function makeMesh(node) {
			if (node.textNode) {
				return false;
			}

			// var geometry = new THREE.PlaneBufferGeometry( 1, 1, 5, 5 );
			var geometry = new THREE.PlaneGeometry( 1, 1, 10, 0 );

			var rectangle = node.rectangle;

			var texture = self.texture.clone();
			texture.repeat.x = rectangle.width / texture.image.width;
			texture.repeat.y = rectangle.height / texture.image.height;
			texture.offset.x = rectangle.x / texture.image.width;
			texture.offset.y = 1 - ((rectangle.y + rectangle.height) / texture.image.height);
			texture.needsUpdate = true;

			// adjusts the pixel to three.js units ratio.
			var scale = 0.0035;

			var centerOffsetX = texture.image.width / 2;
			var centerOffsetY = texture.image.height / 2;

			var x = (rectangle.x + (rectangle.width / 2) - centerOffsetX) * scale;
			var y = (rectangle.y + (rectangle.height / 2) - centerOffsetY) * scale;

			var materials = [];

			// create base texture material
			var material = new THREE.MeshBasicMaterial({
				map : texture,
				transparent: true,
				// depthTest: false,
				// depthWrite: true
				alphaTest: 0.1
			});

			materials.push(material);

			// add canvas text materials if we have them
			var textNodes = getTextnodes(node.id);

			if (textNodes.length > 0) {
				var canvasMaterials;
				canvasMaterials = createCanvasMaterials(textNodes, node);
				materials = materials.concat(canvasMaterials);
			}

			// make mesh
			var mesh;
			if (materials.length > 1) {
				mesh = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
			} else {
				mesh = new THREE.Mesh( geometry, materials[0] );
			}

			mesh.position.set( x, -y, 0);

			mesh.scale.set( rectangle.width * scale, rectangle.height * scale, 1 );
			mesh.userData.position = new THREE.Vector2( x , y );
			mesh.userData.scale = new THREE.Vector2( rectangle.width * scale, rectangle.height * scale);

			node.mesh = mesh;

			return node;
		}


		var jsonLoaded = loadJson(path + '/index.json')
			.then( function(response) {
					return JSON.parse(response)
				}, function(err) {
					reject(new Error('Error parsing JSON ' + err));
				})
			.then( function(parsed) {
					return parsed;
				})

		var textureLoaded = loadTexture(path + '/index.png')
			.then( function(texture) {
					return texture;
				})
			.catch( function(err) {
					console.error(err);
				})

		this.getNodeById = function(id, createMesh) {
			var nodes = this.nodes;
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.id == id) {
					if (createMesh && !node.mesh) {
						node = makeMesh(node);
					};
					return node;
				}
			}
			return false;
		};

		this.loaded = Promise.all([jsonLoaded, textureLoaded])
			.then( function(results) {
				self.nodes = results[0].nodes;
				self.texture = results[1];

				return self.nodes;
			}).then( function(nodes) {
				if (self.makeMeshes) {
					var meshNodes = [];
					nodes.forEach( function(node) {
						var mesh = makeMesh(node);
						if (mesh) {
							meshNodes.push(mesh);
						}
					});

					return meshNodes;
				} else {
					return self.nodes;
				}
			});

		return this;
	};


	return new DOM2three();
})();





// function DOM2three(uiJson, opts) {
// 	var self = this;
// 	self.path = null;
// 	self.data = null;
// 	self.onload = null;
// 	self.texture = null;
// 	self.mesh = null;
// 	self.item = null;
// 	self.centerOffsetX = null;
// 	self.centerOffsetY = null;

// 	// options
// 	self.opts = opts || {};
// 	self.centerLayoutTo = self.opts.centerLayoutTo || null;

// 	function callonloadcallback() {
// 		if (typeof self.onload == 'function') {
// 			self.onload.call(self);
// 		}
// 	}

// 	self.loadJson(uiJson)
// 		.then( function(response) {
// 				return JSON.parse(response)
// 			}, function(err) {
// 				console.error('Error parsing JSON ', err);
// 			})
// 		.then( function(response) {
// 			self.data = response;
// 			if (self.data.texture) {
// 				self.loadTexture(self.data.texture)
// 					.then(function() {
// 						// data loaded
// 						// texture loaded
// 						self.calculateCenterOffset();
// 						callonloadcallback();
// 					})
// 					.catch(function(err) {
// 						console.warn(err);
// 						callonloadcallback();
// 					})
// 					;
// 			}
// 		})
// 		.catch(function(err) {
// 			console.error('Error loading JSON ', err);
// 		});

// 	return this;
// }

// /*
// bits for three.js layouts
// -----------------------
// */
// DOM2three.prototype.loadTexture = function(src) {
// 	var self = this;
// 	return new Promise(function(resolve, reject) {
// 		var path = self.path + src;
// 		var texture = THREE.ImageUtils.loadTexture(path, undefined,
// 			function() {
// 				self.texture = texture;
// 				resolve(texture);
// 			}, function() {
// 				reject('texture not loaded: ' + path);
// 			});
// 	})
// }

// DOM2three.prototype.setText = function(selector, text) {
// 	var select = this.getNode(selector);

// 	if (!select) {
// 		console.warn('Nothing found for ',select);
// 		return false;
// 	};

// 	var context = select.canvasMaterial.context;

// 	context.clearRect(0,0,
// 		select.canvasMaterial.canvas.width,
// 		select.canvasMaterial.canvas.height);

// 	var x, y;
// 	if (select.textAlign == 'center') {
// 		x = select.rectangle.width / 2;
// 	} else {
// 		x =  select.canvasMaterial.x;
// 	}

// 	y = select.canvasMaterial.y;

// 	context.fillText(text, x, y);

// 	select.canvasMaterial.texture.needsUpdate = true;

// }

// DOM2three.prototype.getAllDisplayItems = function() {
// 	var items = this.data.items;
// 	var collection = [];
// 	for (var i = 0; i < items.length; i++) {
// 		var item = items[i];

// 		if (item.display) {
// 			collection.push(item);
// 		}
// 	};

// 	return collection;
// }

// DOM2three.prototype.calculateCenterOffset = function() {
// 	var	centerOffsetX, centerOffsetY;

// 	var centerItem = this.opts.centerLayoutTo;
// 	var texture = this.texture;

// 	if (centerItem) {
// 		var node = this.getNode(centerItem);
// 		centerOffsetX = node.rectangle.x + (node.rectangle.width / 2);
// 		centerOffsetY = node.rectangle.y + (node.rectangle.height / 2);
// 	} else {
// 		centerOffsetX = texture.image.width / 2;
// 		centerOffsetY = texture.image.height / 2;
// 	}

// 	this.centerOffsetY = centerOffsetY;
// 	this.centerOffsetX = centerOffsetX;
// };

// DOM2three.prototype.makeMesh = function(item) {
// 	if (!item) {
// 		console.error('no item specified');
// 		return false;
// 	}
// 	var self = this;

// 	// geometry
// 	var geometry = new THREE.PlaneBufferGeometry( 1, 1 );

// 	// texture positioning
// 	var rect = item.rectangle;
// 	var tex = self.texture.clone();
// 	tex.repeat.x = rect.width / tex.image.width;
// 	tex.repeat.y = rect.height / tex.image.height;
// 	tex.offset.x = rect.x / tex.image.width;
// 	tex.offset.y = 1 - ((rect.y + rect.height) / tex.image.height );
// 	tex.needsUpdate = true;
// 	item.texture = tex;

// 	// item positioning
// 	var x = rect.x + (rect.width / 2) - self.centerOffsetX;
// 	var y = rect.y + (rect.height / 2) - self.centerOffsetY;
// 	item.position = {
// 		x: x,
// 		y: y
// 	};

// 	var material = new THREE.MeshBasicMaterial({ map : tex, transparent: true });

// 	var materials = [];

// 	if(item.display) {
// 		materials.push(material);
// 	}


// 	// create additional materials for each replaceable piece of content.
// 	if (item.content) {
// 		var canvasMaterials = this.createCanvasMaterials(item);
// 		materials = materials.concat(canvasMaterials);
// 	}

// 	// mesh
// 	var mesh;
// 	if (materials.length > 1) {
// 		mesh = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
// 	} else {
// 		mesh = new THREE.Mesh( geometry, materials[0] );
// 	}

// 	mesh.position.set( x, -y, 0);
// 	mesh.scale.set( rect.width, rect.height, 1 );
// 	mesh.userData.position = new THREE.Vector2( x, y );
// 	mesh.userData.scale = new THREE.Vector2( rect.width, rect.height );
// 	mesh.userData.item = item;

// 	item.mesh = mesh;

// 	self.item = item;

// 	return mesh;
// }

// DOM2three.prototype.getMesh = function(selector) {
// 	var self = this;
// 	var item = this.getNode(selector);

// 	return self.makeMesh(item);
// }

// DOM2three.prototype.createCanvasMaterials = function(item) {
// 	var materials = [];

// 	item.content.forEach(function(content) {
// 		if (content.hasOwnProperty('canvas')) {
// 			var rect = item.rectangle;
// 			// create a canvas element for canvas enabled selector
// 			var canvas = document.createElement('canvas');
// 			// set to parent element width/height
// 			canvas.width = rect.width;
// 			canvas.height = rect.height;

// 			var context = canvas.getContext('2d');
// 			context.font = content.font;
// 			content.textBaseline = 'bottom';
// 			context.fillStyle = content.fillStyle;
// 			context.textAlign = content.textAlign;
// 			content.canvasMaterial = {};
// 			content.canvasMaterial.canvas = canvas;
// 			content.canvasMaterial.context = context;
// 			content.canvasMaterial.x = content.rectangle.x - rect.x;
// 			content.canvasMaterial.y = content.rectangle.y - rect.y + content.rectangle.height;

// 			var texture = new THREE.Texture(canvas);
// 			texture.needsUpdate = true;

// 			var material = new THREE.MeshBasicMaterial( { map: texture, transparent: true } );
// 			material.transparent = true;

// 			content.canvasMaterial.texture = texture;

// 			materials.push(material);
// 		}
// 	});

// 	return materials;
// }

// DOM2three.prototype.getNode = function(selector) {
// 	var items = this.data.items;
// 	for (var i = 0; i < items.length; i++) {
// 		var item = items[i];

// 		if (item.hasOwnProperty('selector')) {
// 			if (item.selector == selector) {
// 				return item;
// 				break;
// 			}
// 		};

// 		if (item.content) {
// 			for (var j = 0; j < item.content.length; j++) {
// 				var content = item.content[j];
// 				if (content.hasOwnProperty('selector')) {
// 					if (content.selector == selector) {
// 						return content;
// 						break;
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return false;
// }


// /*
// bits for HTML templates
// -----------------------
// */

// /*
// get placement on page
// */
// DOM2three.prototype.getRectangle = function(el) {
// 	var rect = el.getBoundingClientRect();
// 	return {
// 		x: rect.x,
// 		y: rect.y,
// 		width: el.offsetWidth,
// 		height: el.offsetHeight
// 	};
// }

// /*
// applies to any item with content property.
// */
// DOM2three.prototype.applyContent = function(dom) {
// 	var self = this;
// 	var items = self.data.items;

// 	items.forEach(function(item) {
// 		var select = dom.querySelector(item.selector);
// 		console.log(select);

// 		var el;

// 		// clone the item that is being selected.
// 		if (item.clone) {
// 			el = select.cloneNode(true);
// 			el.id = '';	// clear ID so that we don't collide with cloned element.
// 			select.parentNode.appendChild(el);
// 		} else {
// 			el = select;
// 		}

// 		// project content into element.
// 		if (item.content) {
// 			item.content.forEach(function(content) {
// 				if (content.selector) {
// 					var cel = el.querySelector(content.selector)
// 					console.log(cel);

// 					if (cel) {
// 						// content with canvas property will be overwritten using canvas text.
// 						if (content.canvas) {
// 							cel.innerHTML = '&nbsp;';
// 						} else {
// 							cel.innerHTML = content.content;
// 						}

// 						content.el = cel;
// 					} else {
// 						console.error(content.selector + " not found");
// 					}
// 				}
// 			});
// 		};
// 		item.el = el;
// 	});

// 	return items;
// }

// DOM2three.prototype.getItemsRectangles = function() {
// 	var self = this;
// 	var items = self.data.items;

// 	items.forEach(function(item) {
// 		item.rectangle = self.getRectangle(item.el);
// 		if (item.content) {
// 			item.content.forEach(function(content) {
// 				content.rectangle = self.getRectangle(content.el);
// 			});
// 		}
// 	});
// }


// /*
// utils
// -----------------------
// */
// DOM2three.prototype.loadJson = function(url) {
// 	var a = document.createElement('a');
// 	a.href = url;
// 	var path = a.pathname.substring(0, a.pathname.lastIndexOf('/')) + '/';
// 	this.path = path;

// 	return new Promise( function(resolve, reject) {
// 		var xhr = new XMLHttpRequest();

// 		xhr.onload = function() {
// 			resolve(xhr.response);
// 		}

// 		xhr.onerror = function() {
// 			reject(new Error('Some kind of network error, XHR failed.'))
// 		}

// 		xhr.open('GET', url);
// 		xhr.send();
// 	});
// };

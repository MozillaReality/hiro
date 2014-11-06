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

					var textStyle = style.fontVariant + ' ' +
						style.fontWeight + ' ' +
						style.fontSize + ' ' +
						style.fontFamily;
						// alignment
						// Formal syntax: [ [ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? <‘font-size’> [ / <‘line-height’> ]? <‘font-family’> ] | caption | icon | menu | message-box | small-caption | status-bar

					// clear text from node so that it doesn't rasterize to texture.
					node.innerHTML = '&nbsp;';

					nodeData.font = textStyle;

					nodeData.color = style.color;

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
				context.font = textNode.font;
				context.fillStyle = textNode.color;

				var x = rectangle.x - hostNode.rectangle.x;
				var y = rectangle.y - hostNode.rectangle.y + rectangle.height;

				textNode.fontPosition = new THREE.Vector2(x, y);

				// context.fillText(textNode.id + ' TEST abcjyz', x, y);

				var texture = new THREE.Texture(canvas);
				texture.needsUpdate = true;

				var material = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true,
					alphaTest: 0.1
				});

				textNode.texture = texture;

				materials.push(material);
			});

			return materials;
		};

		function makeMesh(node) {
			if (node.textNode) {
				return false;
			}

			//var geometry = new THREE.PlaneBufferGeometry( 1, 1, 10, 5 );
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
				alphaTest: 0.1
				// wireframe: true,
				// color: Math.random()*0xffffff,
				// depthTest: false,
				// depthWrite: true

			});

			materials.push(material);

			// create canvas text materials
			var textNodes = getTextnodes(node.id);

			if (textNodes.length > 0) {
				var canvasMaterials;
				canvasMaterials = createCanvasMaterials(textNodes, node);
				materials = materials.concat(canvasMaterials);
			}

			materials.reverse();

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
				});

		var textureLoaded = loadTexture(path + '/index.png')
			.then( function(texture) {
					return texture;
				})
			.catch( function(err) {
					console.error(err);
				});

		this.getNodesByClass = function(className) {
			var nodes = this.nodes;
			var collection = [];
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];

				if (node.classList && node.classList[0] == className) {
					collection.push(node);
				}
			}

			return collection;
		};

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

		this.setText = function(id, text) {
			var node = self.getNodeById(id);

			if (!node) {
				console.error('no node found with the id ' + id);
				return false;
			}

			var canvas = node.texture.image;
			var context = canvas.getContext('2d');

			context.clearRect(0, 0, canvas.width, canvas.height);

			context.fillText(text, node.fontPosition.x, node.fontPosition.y);

			node.texture.needsUpdate = true;
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

function VRUi(container) {
	this.container = container;
	this.renderer = null;
	this.scene = null;
	this.settings = null;
	this.hud = null;

	this.initRenderer();
	this.initSettings('./data/settings.json').then(function(data) {
		this.settings = data;
		this.hud = new VRHud(this.settings.favorites);
	});

	return this;
};

VRUi.prototype.initSettings = function(url) {
	var self = this;
	return new Promise(function(resolve, reject) {
		makeRequest(url).then( function(data) {
			resolve( JSON.parse(data) );
		});

		function makeRequest(url) {
			return new Promise(function(resolve, reject) {
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
		}
	});
}

VRUi.prototype.initRenderer = function() {
	var renderer = new THREE.WebGLRenderer( { alpha: true } );
  renderer.setClearColor( 0x000000, 0 );
  this.scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
  var controls = new THREE.VRControls( this.camera );
  var effect = new THREE.VREffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );
  this.container.appendChild(renderer.domElement);
}



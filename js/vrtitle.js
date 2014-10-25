function VRTitle() {
	var self = this;
	this.mesh = null;
	this.siteMesh = null;
	this.visible = false;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {
		self.d23 = new DOM2three('../data/title/index.json');
		var d23 = self.d23;

		d23.onload = function() {
			var mesh = new THREE.Group();

			// title
			var titleMesh = d23.getMesh('#site-title');
			mesh.add( titleMesh );

			// site mesh
			var siteMesh = self.makeSiteMesh();
			self.siteMesh = siteMesh;
			mesh.add( siteMesh );


			// get location in the HUD for where title should fit.
			//var hudd23 = VRManager.ui.hud.d23;
			//var hudRect = hudd23.getNode('#site-location').rectangle;
			//var y = hudRect.y + (titleMesh.userData.item.rectangle.height / 2) - hudd23.centerOffsetY;

			// loading indicator
			//var loading = VRManager.ui.loading.mesh;
			//loading.position.set(0, 0, -500);

			// position
			mesh.position.set(0, 0, -550);
			mesh.scale.set(0.00001, 0.00001, 1);
			mesh.userData.scale = new THREE.Vector2(1,1);
			mesh.visible = self.visible;

			self.mesh = mesh;

			if (self.visible) {
				self.show();
			}

			resolve();
		};
	});

	return this;
}


VRTitle.prototype.update = function() {
	if (this.visible) {
		this.siteMesh.rotation.y+=0.01;
	}
}

VRTitle.prototype.makeSiteMesh = function() {
	var geometry = new THREE.IcosahedronGeometry( 70, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ffff, wireframe: true, transparent: true, opacity: 1, side: THREE.DoubleSide } );
  var mesh = new THREE.Mesh( geometry, material );
  return mesh;
}


VRTitle.prototype.show = function() {
	var self = this;
	if (!self.visible) {
		self.visible = true;
		self.mesh.visible = true;

		self.animateIn(self.mesh);
	}
}

VRTitle.prototype.hide = function() {
	self = this;
	self.animateOut(self.mesh).then(function() {
		self.visible = false;
		self.mesh.visible = false;
		self.setAuthor('');
	});
};

VRTitle.prototype.setAuthor = function(value) {
	this.d23.setText('.authors', value);
};

VRTitle.prototype.setTitle = function(value) {
	this.d23.setText('.title h1', value);
}

VRTitle.prototype.animateOut = function(mesh) {
	return new Promise(function(resolve, reject) {
		var tween = new TWEEN.Tween( mesh.scale )
			.to({ x: 0.00001, y: 0.00001 }, 500 )
			.easing(TWEEN.Easing.Exponential.Out)
			.onComplete(function() {
				resolve();
			})
			.start();
	});
};

VRTitle.prototype.animateIn = function(mesh) {
	return new Promise(function(resolve, reject) {
		var tween = new TWEEN.Tween( mesh.scale )
			.to(mesh.userData.scale, 1000 )
			.easing(TWEEN.Easing.Exponential.Out)
			.onComplete(function() {
				resolve();
			})
			.start();
	});
};

function VRTitle() {
	var self = this;
	this.mesh = null;
	this.siteMesh = null;
	this.visible = false;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {

		var d23 = new DOM2three.load('../d23/title');

		d23.loaded
			.then( function() {
				//var mesh = new THREE.Group();

				// current site frame
				var node = d23.getNodeById('current', true);
				var mesh = node.mesh;


				d23.setText('current-title', 'TITLE OF SITE');

				d23.setText('current-url', 'MOZVR.COM/TEST-URL');

				d23.setText('current-credits', 'MR. DOOB, JOSH CARPENTER');

				//mesh.add(node.mesh);

				// loaded site globe geo
				// var siteMesh = self.makeSiteMesh();
				// self.siteMesh = siteMesh;
				// mesh.add( siteMesh );

				// function curve(mesh) {
				// 	console.log(mesh);
				// }


				//console.log(mesh);
				//bend(mesh, 2);

				// position
				//mesh.position.set(0, 0.2, -2.5);
				// mesh.scale.set(0.00001, 0.00001, 1);
				// mesh.userData.scale = new THREE.Vector2(1,1);
				mesh.visible = self.visible;

				self.mesh = mesh;

				if (self.visible) {
					self.show();
				}

				self.d23 = d23;

				resolve();
			});


		// d23.onload = function() {
		// 	var mesh = new THREE.Group();

		// 	// title
		// 	var titleMesh = d23.getMesh('#site-title');
		// 	mesh.add( titleMesh );

		// 	// currently loaded site mesh
		// 	var siteMesh = self.makeSiteMesh();
		// 	self.siteMesh = siteMesh;
		// 	mesh.add( siteMesh );


		// 	// get location in the HUD for where title should fit.
		// 	//var hudd23 = VRManager.ui.hud.d23;
		// 	//var hudRect = hudd23.getNode('#site-location').rectangle;
		// 	//var y = hudRect.y + (titleMesh.userData.item.rectangle.height / 2) - hudd23.centerOffsetY;

		// 	// loading indicator
		// 	//var loading = VRManager.ui.loading.mesh;
		// 	//loading.position.set(0, 0, -500);

		// 	// position
		// 	mesh.position.set(0, 0, -550);
		// 	mesh.scale.set(0.00001, 0.00001, 1);
		// 	mesh.userData.scale = new THREE.Vector2(1,1);
		// 	mesh.visible = self.visible;

		// 	self.mesh = mesh;

		// 	if (self.visible) {
		// 		self.show();
		// 	}

		// 	resolve();
		// };
	});

	return this;
}


VRTitle.prototype.update = function() {
	// if (this.visible) {
	// 	this.siteMesh.rotation.y+=0.01;
	// }
}

/*
mesh that represents the currently loaded site.
This could be used as the 'favicon'
*/
// VRTitle.prototype.makeSiteMesh = function() {
// 	var geometry = new THREE.IcosahedronGeometry( 70, 1 );
//   var material = new THREE.MeshBasicMaterial( { color: 0x00ffff, wireframe: true, transparent: true, opacity: 1, side: THREE.DoubleSide } );
//   var mesh = new THREE.Mesh( geometry, material );
//   return mesh;
// }


VRTitle.prototype.show = function() {
	var self = this;
	if (!self.visible) {
		self.visible = true;
		self.mesh.visible = true;

		//self.animateIn(self.mesh);
	}
}

VRTitle.prototype.hide = function() {
	self = this;

	return new Promise(function(resolve) {
		self.visible = false;
		self.mesh.visible = false;

		resolve();
	});

	// var animDone = self.animateOut(self.mesh);

	// animDone.then(function() {
	// 	self.visible = false;
	// 	self.mesh.visible = false;
	// 	self.setAuthor('');
	// });


	// return animDone;
};

VRTitle.prototype.setCredits = function(value) {
	this.d23.setText('current-credits', value);
};

VRTitle.prototype.setTitle = function(value) {
	this.d23.setText('current-title', value);
};

VRTitle.prototype.setUrl = function(value) {
	this.d23.setText('current-url', value);
};


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

function VRLoading() {
	var self = this;
	self.visible = false;

	var geometry = new THREE.SphereGeometry( 25, 5, 5 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ffff, side: THREE.DoubleSide, wireframe: true } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.visible = self.visible;

	self.mesh = mesh;

  return this;
};

VRLoading.prototype.show = function() {
	if (!this.visible) {
		this.visible = true;
		this.mesh.visible = true;
	}
};

VRLoading.prototype.hide = function() {
	if (this.visible) {
		this.visible = false;
		this.mesh.visible = false;
	}
};

VRLoading.prototype.update = function() {
	if (this.visible) {
		this.mesh.rotation.y += 0.1;
	}
}

VRLoading.prototype.animateOut = function(mesh) {
	// return new Promise(function(resolve, reject) {
	// 	var tween = new TWEEN.Tween( mesh.scale )
	// 		.to({ x: 0.00001, y: 0.00001 }, 500 )
	// 		.easing(TWEEN.Easing.Exponential.Out)
	// 		.onComplete(function() {
	// 			resolve();
	// 		})
	// 		.start();
	// });
};

VRLoading.prototype.animateIn = function(mesh) {
	// return new Promise(function(resolve, reject) {
	// 	var tween = new TWEEN.Tween( mesh.scale )
	// 		.to(mesh.userData.scale, 1000 )
	// 		.easing(TWEEN.Easing.Exponential.Out)
	// 		.onComplete(function() {
	// 			resolve();
	// 		})
	// 		.start();
	// });
};


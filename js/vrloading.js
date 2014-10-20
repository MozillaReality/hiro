function VRLoading() {
	var self = this;
	self.visible = false;

	var mesh = new THREE.Group();

	var particles = [];
	var particleCount = 10;

	for (var i = 0; i < particleCount; i++) {
		var p = self.makeParticle();
		particles.push(p);
		mesh.add(p);
	}

	self.particles = particles;

	mesh.visible = self.visible;

	self.mesh = mesh;

  return this;
};

VRLoading.prototype.makeParticle = function() {
	var geometry = new THREE.SphereGeometry(5, 3, 2);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, -80 ) );

	var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );

	var particle = new THREE.Mesh( geometry, material );

	particle.userData.rotation = {};
	particle.userData.rotation.x = Math.random() * (360 - 0);
	particle.userData.rotation.y = Math.random() * (360 - 0);

	return particle;
}


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
		for (var i = 0; i < this.particles.length; i++) {
			var particle = this.particles[i];

			var rotation = new THREE.Euler(particle.userData.rotation.x - 0.05, particle.userData.rotation.y -= 0.05, 0);

  		var quat = new THREE.Quaternion().setFromEuler(rotation, true);
  		var pivotQuat = new THREE.Quaternion();
  		pivotQuat.multiply(quat).normalize();
			particle.setRotationFromQuaternion(quat);
		}
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


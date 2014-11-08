function VRLoading() {
	var self = this;
	self.visible = false;

	var mesh = new THREE.Group();
	mesh.position.z = -1;

	var particles = [];
	var particleCount = 60;

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
	function randomBetween(min, max) {
	    if (min < 0) {
	        return min + Math.random() * (Math.abs(min)+max);
	    }else {
	        return min + Math.random() * max;
	    }
	}

	var geometry = new THREE.SphereGeometry(0.02, 3, 2);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, randomBetween(-4, -0.5) ) );

	var material = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide } );

	// var material =  new THREE.MeshPhongMaterial({
	// 	ambient: 0xffffff,
	// 	color: 0x282000,
	// 	specular: 0xffb400,
	// 	shininess: 30,
	// 	shading: THREE.FlatShading
	// })

	var particle = new THREE.Mesh( geometry, material );

	// material.opacity = 0.5;

	// var tween = new TWEEN.Tween( particle.material )
	// 	.to({ opacity: 1 }, 500 )
	// 	.easing(TWEEN.Easing.Exponential.Out)
	// 	.delay(1000)
	// 	.start();

	particle.userData.rotation = {};
	particle.userData.rotation.x = randomBetween(0, 360);
	particle.userData.rotation.y = randomBetween(0, 360);

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

			var rotation = new THREE.Euler(particle.userData.rotation.x - 0.05, particle.userData.rotation.y -= 0.001, 0);
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


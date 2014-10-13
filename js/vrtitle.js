function VRTitle() {
	var self = this;
	this.mesh = null;
	this.visible = false;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {
		self.d23 = new DOM2three('../data/title/index.json');
		var d23 = self.d23;

		d23.onload = function() {
			var mesh = d23.getMesh('#site-title');
			mesh.position.set(0, 0, -500);
			mesh.scale.set(0.00001, 0.00001, 1);
			mesh.visible = self.visible;
			self.mesh = mesh;
			resolve();
		};
	});

	return this;
}

VRTitle.prototype.show = function(item) {
	var self = this;

	self.d23.setText('.authors', item.userData.author);
	self.d23.setText('.title h1', item.userData.title);

	self.visible = true;
	// todo: replace with animation

	setTimeout(animate, 3000);

	function animate() {
		self.mesh.visible = true;

		self.animateIn(self.mesh).then(function() {
			setTimeout(function() {
				self.hide();
			}, 3000);
		});
	}
}

VRTitle.prototype.hide = function() {
	self = this;
	self.visible = false;
	self.animateOut(self.mesh).then(function() {
		self.mesh.visible = false;
	});
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

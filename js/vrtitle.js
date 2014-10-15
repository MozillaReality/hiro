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

			// get location in the HUD for where title should fit.
			var hudd23 = VRManager.ui.hud.d23;
			var hudRect = hudd23.getNode('#site-location').rectangle;
			var y = hudRect.y + (mesh.userData.item.rectangle.height / 2) - hudd23.centerOffsetY;

			// set mesh scale and position
			mesh.position.set(0, -y, -550);
			mesh.scale.set(0.00001, 0.00001, 1);
			mesh.visible = self.visible;

			if (self.visible) {
				self.show();
			}
			self.mesh = mesh;

			resolve();
		};
	});

	return this;
}

VRTitle.prototype.show = function() {
	var self = this;

	self.visible = true;
	self.mesh.visible = true;

	self.animateIn(self.mesh);
}

VRTitle.prototype.hide = function() {
	self = this;
	self.animateOut(self.mesh).then(function() {
		self.visible = false;
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


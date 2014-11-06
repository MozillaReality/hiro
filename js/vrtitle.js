function VRTitle() {
	var self = this;
	this.mesh = null;
	this.siteMesh = null;
	this.visible = false;
	this.d23 = null;

	this.ready = new Promise(function(resolve, reject) {

		var d23 = new DOM2three.load('d23/title', {
			pixelScale: 0.0030
		});

		d23.loaded
			.then( function() {
				// current site frame
				var node = d23.getNodeById('current', true);
				var mesh = node.mesh;

				d23.setText('current-title', 'TITLE OF SITE');

				d23.setText('current-url', 'MOZVR.COM/TEST-URL');

				d23.setText('current-credits', 'MR. DOOB, JOSH CARPENTER');

				mesh.visible = self.visible;

				self.mesh = mesh;

				if (self.visible) {
					self.show();
				}

				self.d23 = d23;

				resolve();
			});
	});

	return this;
}


VRTitle.prototype.update = function() {

}


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

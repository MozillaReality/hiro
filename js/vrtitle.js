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
			mesh.visible = self.visible;
			self.mesh = mesh;

			resolve();
		};
	});

	return this;
}

VRTitle.prototype.show = function(userData) {
	var self = this;

	console.log(self.d23);
	self.d23.setText('.authors', userData.author);
	self.d23.setText('.title h1', userData.title);

	self.visible = true;
	// todo: replace with animation
	setTimeout(function() {
		self.mesh.visible = true;
		self.hide();
	}, 3000);
}

VRTitle.prototype.hide = function() {
	self = this;
	self.visible = false;
	setTimeout(function() {
		self.mesh.visible = false;
	}, 3000)
}
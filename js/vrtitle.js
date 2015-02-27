function VRTitle() {
	this.visible = false;

	this.object3d = new THREE.Object3D();

	return this;
}


VRTitle.prototype.show = function() {
	console.log('SHOW TITLE');
	if (!this.visible) {
		this.object3d.visible = this.visible = true;
	}
}

VRTitle.prototype.hide = function() {
	console.log('HIDE TITLE');
	this.object3d.visible = self.visible = false;
};


// var titleUrl = value;

// // strip uggly porotocal lines
// var strip = ['HTTP://', 'HTTPS://'];

// strip.forEach(function(str) {
// 	titleUrl = titleUrl.replace(str, '');
// });

// // get rid of trailing slashes
// 	if (titleUrl.substr(-1) == '/') {
//  	titleUrl = titleUrl.substr(0, titleUrl.length - 1);
//  };

//  // set url text
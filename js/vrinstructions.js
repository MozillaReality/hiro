function VRInstructions() {
	this.visible = false;

	this.object3d = new THREE.Object3D();

	this.object3d.visible = this.visible;

	var layout = this.makeLayout();

	this.object3d.add(layout);

	return this;
}


VRInstructions.prototype.makeLayout = function() {
	var holder = new THREE.Object3D();

	// Setup size variables that will be used for most HUD elements

	var radius = 0.6;
	var leftEdge = 215;


	// Make instructions

	var r = 2.5;
	var C = 2 * Math.PI * r;

	this.instructionsPanel = VRUIKit.makeCurvedPlane( C/2, 2.5, r, 0xffffff);
	this.instructionsPanel.material.wireframe = true;
	this.instructionsPanel.material.transparent = true;
	this.instructionsPanel.rotation.y = Math.PI/2;
	holder.add(this.instructionsPanel);

	//var instructionsMesh = VRUIKit.makeCurvedPlane( opts.width, opts.height, opts.radius, 0x333333);
	var b = VRUIKit.makeBorder( 3, 1.5, 0.01, 270, 180, 0, 0xFFFFFF, 0.2 );
	b.position.set( 0, 0, 0 );
	holder.add( b );

	
	// Make loading animation details

	var b1Pivot = new THREE.Object3D();
	var b1 = VRUIKit.makeFrame( 0.1, 0.1, 0.1, false, false, true, 0.0015 );
	Utils.shuffleArray( b1.children );
	b1.position.set( 0, 0, 0-radius );
	b1Pivot.add( b1 );
	// bracketPivot.rotation.set( 0, -20*Math.PI/180, 0 );
	// holder.add( b1Pivot );

	var b2Pivot = new THREE.Object3D();
	var b2 = VRUIKit.makeFrame( 2, 1, 0.1, false, false, true, 0.0015 );
	Utils.shuffleArray( b2.children );
	b2.position.set( 0, 0, 0-radius );
	b2Pivot.add( b2 );
	// bracketPivot.rotation.set( 0, -20*Math.PI/180, 0 );
	holder.add( b2Pivot );


	// Make progress bar

	var progress = VRUIKit.makeBand( radius, 0.0075, leftEdge, 30, 0, null, 0.5 );
	progress.material.map = THREE.ImageUtils.loadTexture( 'images/instructions/progressbar-1.png', THREE.UVMapping, function( tex )
		{
	      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	      tex.repeat.set( 5, 0.1 );
	      tex.offset.set( 0, 0 );
		});
	// holder.add( progress );


	// Make loading indicator frame

	var loading_pivot = new THREE.Object3D();
	var loading = VRUIKit.makeFrame( 0.15, 0.15, 0.15, true, true, true, 0.0015 );
	// shuffle( loading.children ); // shuffles order in which the frame pieces draw in
	loading.position.set( 0, -0.15, 0-radius );
	loading_pivot.add( loading );
	loading_pivot.rotation.set( 0, -30*Math.PI/180, 0 );
	holder.add( loading_pivot );


	// Make loading indicator sphere

	var geometry = new THREE.SphereGeometry( 0.065, 20, 10 );
	var material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true } );
	var loading_indicator = new THREE.Mesh( geometry, material );
	loading.add( loading_indicator );


	// var geo = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
	// var mat = new THREE.MeshBasicMaterial( {color: 0xff0000} );
	// var cube = new THREE.Mesh( geo, mat );
	// cube.position.z = -2;
	// holder.add( cube );

	return holder;
}

VRInstructions.prototype.show = function( instructionsImage, duration, delay ) {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (!self.visible) {
			var texture = THREE.ImageUtils.loadTexture( instructionsImage, THREE.UVMapping);
			self.instructionsPanel.material.wireframe = false;
			self.instructionsPanel.material.map = texture;

			function makeVisible() {
				self.object3d.visible = self.visible = true;
			}

			if (delay) {
				setTimeout(makeVisible, delay);
				setTimeout(function() {
					resolve();
				}, delay+duration)
			} else {
				makeVisible();
				resolve();
			}
		}
	})
}

VRInstructions.prototype.hide = function() {
	this.object3d.visible = this.visible = false;
};

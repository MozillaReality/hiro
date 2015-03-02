function VRTitle() {
	this.visible = false;

	this.object3d = new THREE.Object3D();

	this.object3d.visible = this.visible;

	var layout = this.makeLayout();

	this.object3d.add(layout);

	return this;
}


VRTitle.prototype.makeLayout = function() {
	var holder = new THREE.Object3D();

	// setup size variables that will be used for most HUD elements
	var radius = 0.6;

	// make loading animation frames
	// var b1Pivot = new THREE.Object3D();
	// var b1 = VRUIKit.makeFrame( 0.1, 0.1, 0.1, false, false, true, 0.0015 );
	// Utils.shuffleArray( b1.children );
	// b1.position.set( 0, 0, 0-radius );
	// b1Pivot.add( b1 );
	// // bracketPivot.rotation.set( 0, -20*Math.PI/180, 0 );
	// holder.add( b1Pivot );

	// var b2Pivot = new THREE.Object3D();
	// var b2 = VRUIKit.makeFrame( 2, 1, 0.1, false, false, true, 0.0015 );
	// Utils.shuffleArray( b2.children );
	// b2.position.set( 0, 0, 0-radius );
	// b2Pivot.add( b2 );
	// // bracketPivot.rotation.set( 0, -20*Math.PI/180, 0 );
	// holder.add( b2Pivot );


	// make one band for each creator
	// var creator1 = VRUIKit.makeBand( radius, 0.025, leftEdge, 20, 0.2, 0xFFFFFF, 0.25 );
	// holder.add( creator1 );
//--------



	// make progress bar
	// var progress = VRUIKit.makeBand( radius, 0.0075, leftEdge, 30, 0, null, 0.5 );
	// progress.material.map = THREE.ImageUtils.loadTexture( 'images/title/progressbar-1.png', THREE.UVMapping, function( tex )
	// 	{
	//       tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	//       tex.repeat.set( 5, 0.1 );
	//       tex.offset.set( 0, 0 );
	// 	});
	// holder.add( progress );


	// make site name holder



	// VRUIKit.scaleMesh(this.titleLabel.mesh, 0.001);
	// this.titleLabel.mesh.position.z = -0.5;
	// holder.add(this.titleLabel.mesh);

	// this.descriptionLabel = new VRUIKit.TextLabel('Site Description', {
	// 	width: 400, height: 50,
	// 	fillStyle: 'black',
	// 	showBounds: true
	// });
	// VRUIKit.scaleMesh(this.descriptionLabel.mesh, 0.001);
	// this.descriptionLabel.mesh.position.z = -0.5;
	// this.descriptionLabel.mesh.position.y = -0.05;
	// holder.add(this.descriptionLabel.mesh);









	//var name = VRUIKit.makeBand( radius, 0.15, 215, 50, -0.1, 0xFFFFFF, 1, true );
	//holder.add( name );


	function makeCurvedLabel(text, opts) {
		var label = new VRUIKit.TextLabel('Site Name', opts);
		var shapeMesh = VRUIKit.makeCurvedPlane( opts.width, opts.height, opts.radius, 0xffffff);
		// map label texture to shape
		shapeMesh.material.map = label.mesh.material.map;
		// reassign label mesh
		label.mesh = shapeMesh;
		return label;
	}

	this.descriptionLabel = makeCurvedLabel('Site Description\nNew Line', {
		width: 0.3, height: 0.08, radius: 0.8,
		background: 'black',
		color: 'white',
		fontPosition: { x: 10, y: 0 },
		font: 'normal 24px montserrat',
		lineHeight: 22,
		verticalAlign: 'top'
	})
	this.descriptionLabel.mesh.position.y = 0.2;
	this.descriptionLabel.mesh.rotation.y = Utils.toRad(28);
	// holder.add(this.descriptionLabel.mesh);

	var titleGroup = new THREE.Group();
	var r = 0.8;
	var w = 0.7;
	this.titleLabel = makeCurvedLabel('MOZVR.COM', {
		width: w, height: 0.12, radius: r,
		fontPosition: { x: 15, y: 15 },
		font: 'normal 32px montserrat',
		background: 'white',
		color: 'black'
	})
	titleGroup.add(this.titleLabel.mesh);

	this.urlLabel = makeCurvedLabel('www.mozilla.com', {
		width: w, height: 0.07, radius: r,
		fontPosition: { x: 15, y: 12 },
		font: 'normal 24px montserrat',
		background: 'black',
		color: 'white'
	})

	this.urlLabel.mesh.position.y = -0.10;
	titleGroup.add(this.urlLabel.mesh);

	titleGroup.position.y = -0.28;
	titleGroup.rotation.y = Utils.toRad(28);
	holder.add(titleGroup);




	//mesh.material.map.repeat.x = 2;

	// make loading indicator frame

	// var loading_pivot = new THREE.Object3D();
	// var loading = VRUIKit.makeFrame( 0.15, 0.15, 0.15, true, true, true, 0.0015 );
	// // shuffle( loading.children ); // shuffles order in which the frame pieces draw in
	// loading.position.set( 0, -0.15, 0-radius );
	// loading_pivot.add( loading );
	// loading_pivot.rotation.set( 0, -30*Math.PI/180, 0 );
	// holder.add( loading_pivot );


	// make loading indicator sphere

	// var geometry = new THREE.SphereGeometry( 0.065, 20, 10 );
	// var material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, wireframe: true } );
	// var loading_indicator = new THREE.Mesh( geometry, material );
	// loading.add( loading_indicator );


	// var geo = new THREE.BoxGeometry( 1, 1, 1 );
	// var mat = new THREE.MeshBasicMaterial( {color: 0x000000, wireframe: true} );
	// var cube = new THREE.Mesh( geo, mat );
	// cube.rotation.y = 0 * (Math.PI/180);
	// cube.position.z = -2;

	// holder.add( cube );

	return holder;
}

VRTitle.prototype.show = function() {
	if (!this.visible) {
		this.object3d.visible = this.visible = true;
	}
}

VRTitle.prototype.hide = function() {
	this.object3d.visible = this.visible = false;
};

VRTitle.prototype.setTitle = function(title) {
	this.titleLabel.set(title.toUpperCase());
}

VRTitle.prototype.setDescription = function(description) {
	this.descriptionLabel.set(description);
}

VRTitle.prototype.setUrl = function(url) {
	this.urlLabel.set(url.toUpperCase());
}

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
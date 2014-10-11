function startup() {

	var cage;
	var worldGeo;

	//background sphere
	worldGeo = new THREE.SphereGeometry( 490, 60, 40 );
	worldGeo.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
	var worldMat = new THREE.MeshBasicMaterial( { transparent: true, opacity: 0, map: THREE.ImageUtils.loadTexture( 'images/sechelt-360-2.png' ) } );
	var world = new THREE.Mesh( worldGeo, worldMat );
	scene.add( world );


	/*
	todo: test geometry to match up VRUi scene to content (this).  See VRUi bug: for more info.
	*/
	// var geometry = new THREE.BoxGeometry(1,1,1,5,5,5);
	// var material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
	// var cube = new THREE.Mesh( geometry, material );
	// cube.scale.set( 50, 50, 50);
	// scene.add(cube);


	//function for exploding objects, from MrDoob
	function explode( geometry, material ) {

		var group = new THREE.Group();

		for ( var i = 0; i < geometry.faces.length; i ++ ) {

			var face = geometry.faces[ i ];

			var vertexA = geometry.vertices[ face.a ].clone();
			var vertexB = geometry.vertices[ face.b ].clone();
			var vertexC = geometry.vertices[ face.c ].clone();

			var geometry2 = new THREE.Geometry();
			geometry2.vertices.push( vertexA, vertexB, vertexC );
			geometry2.faces.push( new THREE.Face3( 0, 1, 2 ) );

			var mesh = new THREE.Mesh( geometry2, material );
			mesh.position.sub( geometry2.center() );
			group.add( mesh );

		}

		return group;

	}


	//load the logo.
	//once loading is complete, trigger landing() to set up the scene
	var logo;
	var tagline;
	var loader = new THREE.ObjectLoader();

	loader.load( 'images/hiro-logo-3.json', function ( object ) {

		logo = object;
		scene.add( logo );

	});

	loader.load( 'images/hiro-tagline.json', function ( object ) {

		tagline = object;
		scene.add( tagline );
		landing();

	});


	//------------- LANDING PAGE -------------//

	function landing() {

		//animate in the tagline

		tagline.position.set( 0, 0, -200 );
		tagline.scale.set( 1, 1, 1 );
		tagline.rotation.set( 0, 0, 0 );

		//animate in the individual letters of the HIRO logo

		logo.position.set( 0, 0, -8 );

		for ( var i = 0; i < logo.children.length; i++ ) {

			var piece = logo.children[i];
			piece.rotation.set( 0, 0.5, 0 )
			piece.children[0].material.transparent = true;
			piece.children[0].material.opacity = 0;

			new TWEEN.Tween( piece.rotation )
				.to( { y: 0 }, 3000 )
				.easing( TWEEN.Easing.Sinusoidal.InOut )
				//.delay( 400 * i )
				.start();

			new TWEEN.Tween( piece.children[0].material )
				.to( { opacity: 1 }, 3000 )
				.start();

		}

		new TWEEN.Tween( logo.position )
			.to( { z: -10 }, 3000 )
			.easing( TWEEN.Easing.Sinusoidal.InOut )
			.start();

	}

	//------------- LOGO -------------//

	function one() {

		//create mozilla logo
		var logo = new THREE.Mesh(
			new THREE.PlaneGeometry( 3.8, 1, 1, 1 ),
			new THREE.MeshBasicMaterial( { transparent: true, opacity: 0, map: THREE.ImageUtils.loadTexture( 'images/mozilla.png' ) } )
		);
		logo.position.set( 0, 0, -15 );
		scene.add( logo );

		var duration = 2000;

		new TWEEN.Tween( logo.material )
			.to( { opacity: 1 }, duration )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.start();

		new TWEEN.Tween( logo.position )
			.to( { z: -8 }, duration )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onComplete( function() {

				console.log( 'logo transition complete' )

				//I want to add logic that listens for "f" press, and advances to next
				//scene. But this does not work inside JAVRIS, presumably due to
				//nested iframe issues.

				function next( event ) {

					if (!(event.metaKey || event.altKey || event.ctrlKey)) {
						event.preventDefault();
					}

					if ( event.charCode == 'o'.charCodeAt(0) ) {

						console.log("rrrrrr")

						new TWEEN.Tween( logo.material )
							.to( { opacity: 0 }, duration/2 )
							.easing( TWEEN.Easing.Quadratic.InOut )
							.start();

						two();

					}

				}

				window.addEventListener( 'keypress', next, true);


			})
			.start();

	}

	//------------- CAGE -------------//

	function two() {

		var duration = 5000;

		//create holder
		cage = new THREE.Object3D();
		var geometry = new THREE.IcosahedronGeometry( 400, 1 );
		var material = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe: true, transparent: true, side: THREE.DoubleSide } );

		// explode geometry into objects
		var group = explode( geometry, material );

		// animate objects
		for ( var i = 0; i < group.children.length; i ++ ) {

			var object = group.children[ i ];
			var destY = object.position.y;

			object.position.setY( destY - 100 );
			object.material.opacity = 0;
			object.scale.set( 0.1, 0.1, 0.1 )

			var delay = - ( object.position.x / 400 ) + ( object.position.y + 200 ) / 400;

			new TWEEN.Tween( object.position )
				.to( { y: destY }, duration )
				.delay( ( 1 - delay ) * 200 )
				.easing( TWEEN.Easing.Sinusoidal.InOut )
				.start();

			new TWEEN.Tween( object.scale )
				.to( { x:1, y:1, z:1 }, duration )
				.delay( ( 1 - delay ) * 200 )
				.easing( TWEEN.Easing.Sinusoidal.InOut )
				.start();

			new TWEEN.Tween( object.material )
				.to( { opacity: 1 }, duration )
				.easing( TWEEN.Easing.Sinusoidal.InOut )
				.start();

		}

		new TWEEN.Tween( cage.rotation )
			.to( { x: 1 }, duration )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onComplete( function () {

				three();
				//console.log( "completed first phase" );

			})
			.start();

		cage.add( group )
		scene.add( cage );

	}


	//------------- HALLWAY -------------//

	function three() {

		//background sphere
		worldGeo = new THREE.SphereGeometry( 490, 60, 40 );
		worldGeo.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
		var worldMat = new THREE.MeshBasicMaterial( { transparent: true, opacity: 0, map: THREE.ImageUtils.loadTexture( 'images/sechelt-360-2.png' ) } );
		var world = new THREE.Mesh( worldGeo, worldMat );
		scene.add( world );

		//warp vars
		var warp = new THREE.Object3D();
		var quantity = 25;
		var gateSize = 10;
		var spread = 10;
		var zVal;
		var coreSize = gateSize * 10;
		var duration = 15000;
		var travelDistance = 1000;

		//gate vars
		var height = 10;
		var width = 20;
		var gateMat = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.DoubleSide,  } );
		var top = new THREE.PlaneGeometry( width, gateSize, 1, 1 );
		var sides = new THREE.PlaneGeometry( height, gateSize, 1, 1 );

		//gate object
		var Gate = function(  ) {

			var self = this;

			self.gate = new THREE.Object3D();

			//top
			var p1 = new THREE.Mesh(
				top,
				gateMat
			);
			p1.rotation.set( 90 * Math.PI / 180, 0, 0 );
			p1.position.set( 0, height / 2, 0 );

			//side
			var p2 = new THREE.Mesh(
				sides,
				gateMat
			);
			p2.rotation.set( 0, 90 * Math.PI / 180, 0 );
			p2.position.set( width / 2, 0, 0 );

			//bottom
			var p3 = new THREE.Mesh(
				top,
				gateMat
			);
			p3.rotation.set( 90 * Math.PI / 180, 0, 0 );
			p3.position.set( 0, 0 - height / 2, 0 );

			//side
			var p4 = new THREE.Mesh(
				sides,
				gateMat
			);
			p4.rotation.set( 0, 90 * Math.PI / 180, 0 );
			p4.position.set( 0 - width / 2, 0, 0 );

			zVal = i * spread + ( Math.pow( 1.3,i ) ) + coreSize;

			self.gate.add( p1, p2, p3, p4 );

			return self.gate;

		}

		//create core
		var core = new Gate();
		core.position.set( 0, 0, 0 );
		core.scale.set( 1, 1, 22 );
		warp.add( core );

		//create gates
		for ( var i = 0; i < quantity; i++ ) {

			zVal = i * spread + ( Math.pow( 1.3,i ) ) + coreSize;

			var g1 = new Gate;
			g1.position.set( 0, 0, zVal );

			var g2 = new Gate;
			g2.position.set( 0, 0, 0 - zVal );

			warp.add( g1, g2 );

		}

		warp.position.set( 0, 0, 0 - travelDistance )

		//first half of warp
		new TWEEN.Tween( warp.position )
			.to( { z: 0 }, duration/2 )
			.onComplete( function() {

				scene.remove( cage );

				//second half of warp
				new TWEEN.Tween( warp.position )
					.to( { z: travelDistance }, duration/2 )
					.onComplete( function() {

						four();

					} )
					.start();

			})
			.start();

		new TWEEN.Tween( world.material )
			.to( { opacity: 1 }, 2000 )
			.delay( duration/2 )
			.easing( TWEEN.Easing.Quadratic.InOut )

			.onComplete( function() {



			})
			.start();

		new TWEEN.Tween( world.material )
			.to( { opacity: 1 }, 2000 )
			.delay( duration/2 )
			.easing( TWEEN.Easing.Quadratic.InOut )
			.onComplete( function() {

				//test

			})
			.start();


		scene.add( warp );

	}


	//------------- SITE LOADED -------------//

	function four() {



		//VRClient.ended();

		/*
		var siteloaded = new THREE.Mesh(

			//create logo
			var title = new THREE.Mesh(
				new THREE.PlaneGeometry( 10.2, 5.66, 1, 1 ),
				new THREE.MeshBasicMaterial( { transparent: true, opacity: 1, map: THREE.ImageUtils.loadTexture( 'images/siteloaded-1.png' ) } )
			);
			title.scale.set( 0.5, 0.5, 0.5 )
			title.position.set( 0, 0, -10 );
			scene.add( title );

			new TWEEN.Tween( title.material )
				to.( { opacity: 1 }, 1000 )
				.onComplete( function(){



				})
				.start();

		)
		*/

	}

}
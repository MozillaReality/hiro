/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.C4DLineLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.C4DLineLoader.prototype = {

	constructor: THREE.C4DLineLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		} );

	},

	parse: function ( text ) {

		var Line = function ( points ) {

			var pointA = new THREE.Vector3();
			var pointB = new THREE.Vector3();

			var length = ( points.length / 3 ) - 1;

			return {

				getPointAt: function ( t ) {

					if ( t <= 0 ) return new THREE.Vector3( points[ 0 ], points[ 1 ], points[ 2 ] );
					if ( t >= 1 ) return new THREE.Vector3( points[ points.length - 3 ], points[ points.length - 2 ], points[ points.length - 1 ] );

					var key = t * length;
					var keyFloor = Math.floor( key );

					var keyA = keyFloor * 3;
					var keyB = keyA + 3;

					pointA.set( points[ keyA + 0 ], points[ keyA + 1 ], points[ keyA + 2 ] );
					pointB.set( points[ keyB + 0 ], points[ keyB + 1 ], points[ keyB + 2 ] );

					return new THREE.Vector3().copy( pointA ).lerp( pointB, key - keyFloor );

				}

			}

		};

		var points = [];

		var lines = text.split( '\r' );

		for ( var i = 1; i < lines.length - 1; i ++ ) {

			var parts = lines[ i ].split( '\t' );
			points.push( parseFloat( parts[ 1 ] ), parseFloat( parts[ 2 ] ), parseFloat( parts[ 3 ] ) );

		}

		return new Line( points );

	}

};
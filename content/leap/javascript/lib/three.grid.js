// Adds a basic 3d grid to a scene

THREEGrid = function() {

  var grid = new THREE.Object3D;

  var linesZ = new THREE.Object3D;
  var linesX = new THREE.Object3D;


  var material = new THREE.LineBasicMaterial( { color: 0x81d41d, linewidth: 2, opacity: 0.15, transparent: true } );


  // these three vals should be mathematically related.
  var length = 20;
  var halfLen = length / 2;

  var increment = 0.2;

  var gridCount = 8;

  var negativeMargin = (gridCount / 2 * increment);

  // prevents being top dead center when starting at zero
  // todo - make an odd number of grid lines
  var yOffset = increment * 0.5;
  var xOffset = increment * 0.5;


  for (var i = 0; i < gridCount; i++){

    var geometry = new THREE.Geometry();
    geometry.vertices.push( new THREE.Vector3(0, 0, - halfLen ) );
    geometry.vertices.push( new THREE.Vector3(0, 0,   halfLen ) );

    var line = new THREE.Line( geometry, material );
    line.position.set( (i * increment) - negativeMargin - xOffset, 0, 0 );
    linesZ.add( line );
  }

  for (i = 0; i < gridCount; i++){

    var lines = linesZ.clone();

    lines.position.set( 0, (i * increment) - negativeMargin - yOffset, 0.5 );

    grid.add(lines)


  }

  var fog = new THREE.Fog(0xff0000, 1, 10);
  grid.add(fog);

  return grid;

};
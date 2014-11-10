(function() {

window.createText = function(text, options) {

  options || (options = {});

  var color = options.color || 0x81d41d;

  options.size || (options.size = 0.03); // scale?
  options.height || (options.height = 0.005); // z-dpeth
  options.curveSegments || (options.curveSegments = 4);
  options.bevelThickness || (options.bevelThickness = 0.015);
  options.bevelSize || (options.bevelSize = 0.015);
  options.bevelEnabled || (options.bevelEnabled = false);

  var material = new THREE.MeshFaceMaterial( [
    new THREE.MeshPhongMaterial( { color: color, shading: THREE.FlatShading } ), // front
    new THREE.MeshPhongMaterial( { color: color, shading: THREE.SmoothShading } ) // side
  ] );

  var textGeo = new THREE.TextGeometry( text, options );

  textGeo.computeBoundingBox();
  textGeo.computeVertexNormals();

  var mesh = new THREE.Mesh( textGeo, material );
  mesh.name = "text";

  mesh.position.x = -0.5 * ( textGeo.boundingBox.max.x - textGeo.boundingBox.min.x );

  return mesh;
}



}).call(this);
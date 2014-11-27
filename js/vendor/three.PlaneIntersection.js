// Adds a method to a PlaneGeometry which figures out if a line segment intersects it.



// http://en.wikipedia.org/wiki/Line-plane_intersection
// - calculate d (intersection point)
// - see if point is on line segment (add vectors A B C)
//   http://stackoverflow.com/questions/328107/how-can-you-determine-a-point-is-between-two-other-points-on-a-line-segment
// - see if point is on plane segment (dot product of vectors to corners should be positive)
//   http://stackoverflow.com/questions/9638064/check-if-a-point-is-inside-a-plane-segment
//   Sort of like ^^, we transform our four corners to a flat x,y space with the bottom left at 0,0,
//   and compare components of the point d (intersectionPoint)

// Returns the intersectionPoint is it is intersecting, in world space
// Returns false otherwise.
// Accepts an optional third parameter worldPosition, which should be used for nested objects.
// This is not calculated here for performance reasons.
THREE.Mesh.prototype.intersectedByLine = function(lineStart, lineEnd, worldPosition){

  if ( ! (this.geometry instanceof THREE.PlaneGeometry ) ) {
    throw "Not sure if geometry is supported"
  }

  this.lastIntersectionPoint || (this.lastIntersectionPoint = new THREE.Vector3);
  this.lastIntersectionPoint = this.intersectionPoint; // reference copy if object, value copy if null.

  var p0 = worldPosition || this.position; // note that this is local, which would be buggy for nested objects (!)
  var l0 = lineStart;
  // the normal of any face will be the normal of the plane.
  var n  = this.getWorldDirection();
  var l = lineEnd.clone().sub(lineStart);  // order shouldn't matter here.  And they didn't SAY normalize.

  var numerator = p0.clone().sub(l0).dot(n);
  var denominator = l.dot(n);

  if (numerator === 0){
    // no intersection or intersects everywhere.
    this.intersectionPoint = null;
    return false;
  }

  if (denominator === 0){
    // parallel
    this.intersectionPoint = null;
    return false;
  }

  var intersectionPoint = l.clone().multiplyScalar(numerator / denominator).add(l0);

  // see if point is on line segment (add vectors A B C)

  // a,b = lineEnds 1,2
  // c = interSectionPoint

  var dot = lineEnd.clone().sub(lineStart).dot(
    intersectionPoint.clone().sub(lineStart)
  );

  if (dot < 0) {
    this.intersectionPoint = null;
    return false;
  }

  var lengthSq = lineEnd.clone().sub(lineStart).lengthSq();

  if (dot > lengthSq) {
    this.intersectionPoint = null;
    return false;
  }

  // we're on the line!



  // store intersection point for later use, whether it's on the segment or not.
  // This will be useful for frame travel of farther than a plane half.
  this.intersectionPoint = intersectionPoint;





  // see if point is on the plane segment.

  var inverseMatrix = (new THREE.Matrix4).getInverse(this.matrixWorld);

  // mesh.corners() does not (currently) memoize values
  var cornerPositions = this.corners();

  for (var i = 0; i < cornerPositions.length; i++){

//    cornerSpheres[i].position.copy(cornerPositions[i]);
//    console.assert(cornerPositions[i].z < 0.0001);

  }


  // convert point by multiplying by the inverse of the plane's transformation matrix. hope.
  var intersectionPoint2d = intersectionPoint.clone().applyMatrix4(inverseMatrix); // clone may be unnecessary here.

//  cornerSpheres[4].position.copy(intersectionPoint2d);
//  console.assert(intersectionPoint2d.z < 0.0001);

  // check y bottom up, then x left rightwards
  if ( cornerPositions[3].y < intersectionPoint2d.y &&
       intersectionPoint2d.y < cornerPositions[0].y &&
       cornerPositions[3].x < intersectionPoint2d.x &&
       intersectionPoint2d.x < cornerPositions[2].x ){

    return intersectionPoint;

  }


  return false;

};
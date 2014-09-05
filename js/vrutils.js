//used by camera and head-tracking elements

// helper function to convert a quaternion into a matrix, optionally
// inverting the quaternion along the way
function matrixFromOrientation(q, inverse) {
  var m = Array(16);

  var x = q.x, y = q.y, z = q.z, w = q.w;

  // if inverse is given, invert the quaternion first
  if (inverse) {
    x = x; y = -y; z = z;
    var l = Math.sqrt(x*x + y*y + z*z + w*w);
    if (l == 0) {
      x = y = z = 0;
      w = 1;
    } else {
      l = 1/l;
      x *= l; y *= l; z *= l; w *= l;
    }
  }

  var x2 = x + x, y2 = y + y, z2 = z + z;
  var xx = x * x2, xy = x * y2, xz = x * z2;
  var yy = y * y2, yz = y * z2, zz = z * z2;
  var wx = w * x2, wy = w * y2, wz = w * z2;

  m[0] = 1 - (yy + zz);
  m[4] = xy - wz;
  m[8] = xz + wy;

  m[1] = xy + wz;
  m[5] = 1 - (xx + zz);
  m[9] = yz - wx;

  m[2] = xz - wy;
  m[6] = yz + wx;
  m[10] = 1 - (xx + yy);

  m[3] = m[7] = m[11] = 0;
  m[12] = m[13] = m[14] = 0;
  m[15] = 1;

  return m;
}

function cssMatrixFromElements(e) {
  return "matrix3d(" + e.join(",") + ")";
}

function cssMatrixFromOrientation(q, inverse) {
  return cssMatrixFromElements(matrixFromOrientation(q, inverse));
}


function FovToNDCScaleOffset(fov)
{
  var pxscale = 2.0 / (fov.leftTan + fov.rightTan);
  var pxoffset = (fov.leftTan - fov.rightTan) * pxscale * 0.5;
  var pyscale = 2.0 / (fov.upTan + fov.downTan);
  var pyoffset = (fov.upTan - fov.downTan) * pyscale * 0.5;

  return { scale: [pxscale, pyscale], offset: [pxoffset, pyoffset] };
}

function FovPortToProjection(fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */)
{
  rightHanded = rightHanded === undefined ? true : rightHanded;
  zNear = zNear === undefined ? 0.01 : zNear;
  zFar = zFar === undefined ? 10000.0 : zFar;

  var handednessScale = rightHanded ? -1.0 : 1.0;

  // start with an identity matrix
  var mobj = new THREE.Matrix4();
  var m = mobj.elements;

  // and with scale/offset info for normalized device coords
  var scaleAndOffset = FovToNDCScaleOffset(fov);

  // X result, map clip edges to [-w,+w]
  m[0*4+0] = scaleAndOffset.scale[0];
  m[0*4+1] = 0.0;
  m[0*4+2] = scaleAndOffset.offset[0] * handednessScale;
  m[0*4+3] = 0.0;

  // Y result, map clip edges to [-w,+w]
  // Y offset is negated because this proj matrix transforms from world coords with Y=up,
  // but the NDC scaling has Y=down (thanks D3D?)
  m[1*4+0] = 0.0;
  m[1*4+1] = scaleAndOffset.scale[1];
  m[1*4+2] = -scaleAndOffset.offset[1] * handednessScale;
  m[1*4+3] = 0.0;

  // Z result (up to the app)
  m[2*4+0] = 0.0;
  m[2*4+1] = 0.0;
  m[2*4+2] = zFar / (zNear - zFar) * -handednessScale;
  m[2*4+3] = (zFar * zNear) / (zNear - zFar);

  // W result (= Z in)
  m[3*4+0] = 0.0;
  m[3*4+1] = 0.0;
  m[3*4+2] = handednessScale;
  m[3*4+3] = 0.0;

  mobj.transpose();

  return mobj;
}

function FovToProjection(fov, rightHanded /* = true */, zNear /* = 0.01 */, zFar /* = 10000.0 */)
{
  var fovPort = { upTan: Math.tan(fov.upDegrees * Math.PI / 180.0),
                  downTan: Math.tan(fov.downDegrees * Math.PI / 180.0),
                  leftTan: Math.tan(fov.leftDegrees * Math.PI / 180.0),
                  rightTan: Math.tan(fov.rightDegrees * Math.PI / 180.0) };
  return FovPortToProjection(fovPort, rightHanded, zNear, zFar);
}

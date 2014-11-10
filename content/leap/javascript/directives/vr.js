// This creates one animation loop, for every element to update its styles.  Shouldn't be a problem, but should confirm.

(function() {

// these functions from https://github.com/brianpeiris/RiftSketch/blob/master/js/RiftSandbox.js - thanks !
function matrixFromOrientation(q, inverse) {
  var m = Array(16);

  var x = q.x, y = q.y, z = q.z, w = q.w;

  // if inverse is given, invert the quaternion first
  if (inverse) {
    x = -x; y = -y; z = -z;
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

  // invert y so that up-down is correct
  m[1] = -m[1];
  m[5] = -m[5];
  m[9] = -m[9];
  m[13] = -m[13];
  m[4] = -m[4];
  m[5] = -m[5];
  m[6] = -m[6];
  m[7] = -m[7];

  return m;
}

function cssMatrixFromElements(e) {
  return "matrix3d(" + e.join(",") + ")";
}


function cssMatrixFromOrientation(q, inverse) {
  return cssMatrixFromElements(matrixFromOrientation(q, inverse));
}

var cssCameraPositionTransform = (
   "translate3d(0, 0, -1000px)");


angular.module('directives')
  // Attempts to use CSS3 transforms to position the image in VR space
  .directive('vr', function(vrControls) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs){

        element[0].style.position = 'absolute';
        element[0].style.top = 0;
        element[0].style.left = 0;
        element[0].style.zIndex = 1;
        element[0].style.transformStyle = 'preserve-3d';

        var update = function() {

          if (vrControls._vrInput){
            element[0].style.transform = cssMatrixFromOrientation(
              // not sure why getState isin't exposed w/o the _
              vrControls._vrInput.getState().orientation,
              true
            ) + cssCameraPositionTransform;
          }

          requestAnimationFrame(update);

        };

        update();

      }
    };
  });

}).call(this);
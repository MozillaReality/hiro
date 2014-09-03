window.VRManager = (function() {

  //used by camera and head-tracking elements
  var baseTransform = "translate3d(0, 0, 0) rotateZ(180deg) rotateY(180deg)";

  // helper function to convert a quaternion into a matrix, optionally
  // inverting the quaternion along the way
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

    return m;
  }

  function cssMatrixFromElements(e) {
    return "matrix3d(" + e.join(",") + ")";
  }

  function cssMatrixFromOrientation(q, inverse) {
    return cssMatrixFromElements(matrixFromOrientation(q, inverse));
  }

  function VRManager(container) {
    var self = this;
    self.container = document.querySelector(container);
    self.camera = self.container.querySelector('.camera');
    self.loader = self.container.querySelector('.loader');
    self.hud = self.container.querySelector('.hud');

    // this promise resolves when VR devices are detected.
    self.vrReady = new Promise(function (resolve, reject) {
      if (navigator.getVRDevices) {
        navigator.getVRDevices().then(function (devices) {
          console.log(devices);
          for (var i = 0; i < devices.length; ++i) {
            if (devices[i] instanceof HMDVRDevice && !self.hmdDevice) {
              self.hmdDevice = devices[i];
            }
            if (devices[i] instanceof PositionSensorVRDevice &&
                devices[i].hardwareUnitId == self.hmdDevice.hardwareUnitId &&
                !self.positionDevice) {
              self.positionDevice = devices[i];
              break;
            }
          }
          if (self.hmdDevice && self.positionDevice) {
            console.log('VR devices detected');
            resolve();
            return;
          }
          reject('no VR devices found!');
        }).catch(reject);
      } else {
        reject('no VR implementation found!');
      }
    });

    window.addEventListener("message", function (e) {
      var msg = e.data;
      if (!msg.type) {
        return;
      }
      switch (msg.type) {
        case 'load':
          self.load(msg.data);
          break;
      }
    }, false);

    self.vrReady.then(function () {
      self.startStage();
    });
  }

  VRManager.prototype.load = function (url) {
    var self = this;
    var iframe = document.createElement('iframe');
    self.loader.innerHTML = '';
    self.loader.appendChild(iframe);
    iframe.addEventListener('load', function () {
      self.stopStage();
      self.camera.style.display = 'none';
    });
    iframe.src = url;
  };

  VRManager.prototype.enableVR = function () {
    var self = this;
    self.vrReady.then(function () {
      self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
    }).catch(function () {
      self.container.mozRequestFullScreen();
    });
  };

  VRManager.prototype.zeroSensor = function () {
    var self = this;
    self.vrReady.then(function () {
      self.positionDevice.zeroSensor();
    });
  };

  VRManager.prototype.startStage = function () {
    var self = this;
    self.stageRunning = true;
    requestAnimationFrame(self.stageFrame.bind(self));
  };

  VRManager.prototype.stopStage = function () {
    self.stageRunning = false;
  };

  VRManager.prototype.stageFrame = function () {
    var self = this;
    var state = self.positionDevice.getState();
    var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);

    self.camera.style.transform = cssOrientationMatrix + " " + baseTransform;

    if (self.stageRunning) {
      requestAnimationFrame(self.stageFrame.bind(self));
    }
  };

  return new VRManager('#container');

})();

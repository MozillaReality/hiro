// requires VRCursor

window.VRManager = (function() {
  var baseTransform = "translate3d(0, 0, 0)";

  function VRManager(container) {
    var self = this;
    self.container = document.querySelector(container);
    self.cameras = self.container.querySelectorAll('.camera');
    self.stage = self.container.querySelector('#stage');
    self.loader = self.container.querySelector('.loader');
    self.hud = self.container.querySelector('#hud');
    self.cursor = new Cursor(self.container.querySelector('#hud .camera'));

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
      self.startHud();
    });
  }

  VRManager.prototype.load = function (url) {
    var self = this;

    // wrest fullscreen back from the demo if necessary
    // self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
    var iframe = document.createElement('iframe');

    iframe.style.display = 'none';
    iframe.setAttribute('allowfullscreen', '');
    self.loader.appendChild(iframe);

    iframe.addEventListener('load', function () {
      self.stopStage();
      self.stage.style.display = 'none';

      console.log('cleaning up old demo');
      if (self.currentDemo) {
        self.currentDemo.remove();
      }
      self.currentDemo = iframe;
      iframe.style.display = 'block';
    });
    iframe.src = url + '?timestamp=' + Date.now();
  };

  VRManager.prototype.enableVR = function () {
    var self = this;
    self.vrReady.then(function () {
      self.cursor.enable();
      self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
      self.cursor.enable();
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
    this.cursor.updatePosition(state.orientation);
    for (var i = 0; i < self.cameras.length; i++) {
      self.cameras[i].style.transform = cssOrientationMatrix + " " + baseTransform;
    }

    self.cursor.updateHits();

    if (self.stageRunning || self.hudRunning) {
      requestAnimationFrame(self.stageFrame.bind(self));
    }
  };

  VRManager.prototype.startHud = function() {
    var self = this;
    self.hudRunning = false;
    requestAnimationFrame(self.stageFrame.bind(self));
  };

  VRManager.prototype.startHud = function() {
    this.hud.style.display = 'initial';
    this.hudRunning = true;
  };

  VRManager.prototype.stopHud = function() {
    this.hud.style.display = 'none';
    this.hudRunning = false;
  };


  return new VRManager('#container');

})();

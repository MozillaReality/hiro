// requires VRCursor

window.VRManager = (function() {
  var baseTransform = "translate3d(0, 0, 0)";

  function VRManager(container) {
    var self = this;
    self.container = document.querySelector(container);
    self.transition = new VRTransition(self.container);
    self.cameras = self.container.querySelectorAll('.camera');
    self.stage = self.container.querySelector('#stage');
    self.loader = self.container.querySelector('.loader');
    self.hud = self.container.querySelector('#hud');
    self.cursor = new Cursor(self.hud);
    self.currentCursor = self.cursor;

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
            self.vrIsReady = true;
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
        case 'ready':
          if (self.readyCallback) {
            self.readyCallback();
          }
          break;
        case 'progress':
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
    var newTab = new VRTab(url);

    newTab.hide();
    this.transition.fadeOut();
    newTab.mount(self.loader);

    newTab.ready.then(function () {
      self.stopStage();
      self.stage.style.display = 'none';

      console.log('cleaning up old demo');
      if (self.currentDemo) {
        self.currentDemo.destroy();
      }
      self.currentDemo = newTab;

      newTab.show();

      // We'll do this elsewhere eventually
      newTab.start();
      self.transition.fadeIn();
    });

    newTab.load();
  };

  VRManager.prototype.enableVR = function () {
    var self = this;
    if (self.vrIsReady) {
      self.cursor.enable();
      self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
      document.body.mozRequestPointerLock();
      self.cursor.enable();
    }
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
    self.cursor.updatePosition(state.orientation);
    // updates transition object
    self.transition.update();

    for (var i = 0; i < self.cameras.length; i++) {
      self.cameras[i].style.transform = cssOrientationMatrix + " " + baseTransform;
    }

    self.cursor.updateHits();

    if (self.stageRunning || self.hudRunning) {
      requestAnimationFrame(self.stageFrame.bind(self));
    }
  };

  VRManager.prototype.startHud = function() {
    var currentDemo = this.currentDemo;
    this.hud.style.display = 'initial';
    this.hudRunning = true;
    if (currentDemo) { currentDemo.sendMessage('disablecursor'); }
    this.cursor.enable();
  };

  VRManager.prototype.stopHud = function() {
    this.hud.style.display = 'none';
    this.hudRunning = false;
  };

  return new VRManager('#container');

})();

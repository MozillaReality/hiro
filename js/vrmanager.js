window.VRManager = (function() {
  // options
  var START_WITH_INTRO = false;

  /**
  * @param {string} dom container to load JAVRIS experience into.
  **/
  function VRManager(container) {
    var self = this;
    self.container = document.querySelector(container);


    self.loader = self.container.querySelector('#loader');
    self.ui = new VRUi(self.container.querySelector('#ui'));
    self.sequence = new VRSequence();

    // this promise resolves when VR devices are detected.
    self.vrReady = new Promise(function (resolve, reject) {
      if (navigator.getVRDevices) {
        console.log('looking for virtual reality hardware...');
        navigator.getVRDevices().then(function (devices) {
          console.log('found ' + devices.length + ' devices');
          for (var i = 0; i < devices.length; ++i) {
            if (devices[i] instanceof HMDVRDevice && !self.hmdDevice) {
              self.hmdDevice = devices[i];
              console.log('found head mounted display device');
            }
            if (devices[i] instanceof PositionSensorVRDevice &&
                devices[i].hardwareUnitId == self.hmdDevice.hardwareUnitId &&
                !self.positionDevice) {
              self.positionDevice = devices[i];
              console.log('found motion tracking devices');
              break;
            }
          }
          if (self.hmdDevice && self.positionDevice) {
            console.log('VR devices found.');
            self.vrIsReady = true;
            resolve();
            return;
          }
          reject('no VR devices found!');
        }).catch(reject);
      } else {
        reject('no VR implementation found!');
      }
    }).catch(function (err) {
      console.log('Error locating VR devices: ' + err);
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
        case 'ended':
          self.sequence.next();
          break;
        case 'progress':
          break;
      }
    }, false);

    document.addEventListener('mozfullscreenchange', function(e) {
      if (document.mozFullScreenElement == null) {
        self.exitVR();
      }
    });

    self.vrReady.then(function () {
      if (self.vrIsReady) {
        console.log('VR Ready');

        self.startup();
      }
    });
  }

  VRManager.prototype.startup = function() {
    this.load('../content/startup/index.html');
  };

  VRManager.prototype.log = function (msg) {
    this.console.innerHTML += '<div>' + msg + '</div>';
  };

  VRManager.prototype.unloadCurrent = function() {
    var self = this;

    console.log('cleaning up old demo');
    if (self.currentDemo) {
      self.currentDemo.destroy();
    }
  };

  VRManager.prototype.load = function (url, opts) {
    var self = this;

    console.log('loading url: ' + url);
    var newTab = new VRTab(url);
    newTab.hide();
    newTab.mount(self.loader);

    if (self.loadingTab) {
      self.loadingTab.destroy();
    }
    self.loadingTab = newTab;

    newTab.ready.then(function () {
      self.unloadCurrent();
      self.loadingTab = null;
      self.currentDemo = newTab;

      newTab.show();

      // We'll do this elsewhere eventually
      newTab.start();
    });
    newTab.load();
  };


  /*
  This runs when user enters VR mode.
  */
  VRManager.prototype.enableVR = function () {
    var self = this;
    if (self.vrIsReady) {
      self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });

      // reserve pointer lock for the cursor.
      document.body.mozRequestPointerLock();

      if (START_WITH_INTRO) {
        this.sequence.start();
      }

      this.ui.start();
    }
  };

  VRManager.prototype.exitVR = function() {
    console.log('Exiting VR mode');
    this.unloadCurrent();
    this.ui.reset();
    this.startup();
  };

  VRManager.prototype.zeroSensor = function () {
    var self = this;
    self.vrReady.then(function () {
      self.positionDevice.zeroSensor();
    });
  };

  return new VRManager('#container');

})();

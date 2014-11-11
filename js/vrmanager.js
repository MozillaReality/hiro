/*
VRManger
- Juggles VRtab/content iframe loading, switching and unloading.
- Fullscreen switching.
- Detection of VR hardware.
*/

window.VRManager = (function() {
  function VRManager(container) {
    var self = this;

    // container is where the whole experience lives.  Fullscreen VR mode is activated on this container.
    self.container = document.querySelector(container);

    // The loader is loads in external content.
    self.loader = self.container.querySelector('#loader');

    // start a UI into it's own web GL context.
    self.ui = new VRUi(self.container.querySelector('#ui'));

    // this promise resolves when VR devices are detected.
    self.vrReady = new Promise(function (resolve, reject) {
      if (navigator.getVRDevices) {
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
            self.vrIsReady = true;
            resolve();
            return;
          }

          reject('no VR devices found!');

        })
      } else {
        reject('no VR implementation found!');
      }
    })

    // post message handler.
    window.addEventListener("message", function (e) {
      var msg = e.data;
      if (!msg.type) {
        return;
      }
      switch (msg.type) {
        case 'load':
          self.ui.load(msg.data.url, msg.data.opts);
          break;
        case 'ready':
          if (self.readyCallback) {
            self.readyCallback();
          }
          break;
        case 'ended':
          // self.sequence.next();
          break;
        case 'progress':
          break;
      }
    }, false);


    // listen for fullscreen event changes.
    document.addEventListener('mozfullscreenchange',handleFsChange);

    document.addEventListener('webkitfullscreenchange',handleFsChange)

    function handleFsChange(e) {
      var fullscreenElement = document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement;

      if (fullscreenElement == null) {
        // launch:
        // this needs to be turned back on so we can reset the user back to the 2d landing page.
        self.exitVR();
      }
    };

    self.vrReady
      .then(function() {
          //self.VRstart();
        }, function(){
          console.log('*** VR Not ready')
          //self.NoVRstart();
        });

    self.ui.start();

  }

  // VRManager.prototype.VRstart = function() {
  //   this.ui.start();
  // }
  // VRManager.prototype.NoVRstart = function() {
  //   this.ui.start();
  // }

  VRManager.prototype.unloadCurrent = function() {
    var self = this;

    if (self.currentDemo) {
      self.currentDemo.destroy();
    }
  };

  VRManager.prototype.load = function (url) {
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

      // set render mode of new demo to current UI mode.
      newTab.setRenderMode(self.ui.mode);

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
      // start fullscreen on the container element.
      var fs = self.container;

      // debug: true launches into HMD distortion mode.
      var launchFullScreen = true;

      if (launchFullScreen) {
        if (fs.requestFullscreen) {
          fs.requestFullscreen({ vrDisplay: self.hmdDevice });
        } else if (fs.mozRequestFullScreen) {
          fs.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
        } else if (fs.webkitRequestFullscreen) {
          fs.webkitRequestFullscreen({ vrDisplay: self.hmdDevice });
        }
      }

      // reserve pointer lock for the cursor.
      var bodyEl = document.body;

      bodyEl.requestPointerLock = bodyEl.requestPointerLock ||
        bodyEl.mozRequestPointerLock ||
        bodyEl.webkitRequestPointerLock;

      bodyEl.requestPointerLock();

      self.ui.setRenderMode(self.ui.modes.vr);

      // tell loaded content that we are changing render modes.
      if (self.currentDemo) {
       self.currentDemo.setRenderMode(self.ui.mode);
      }
    } else {
      console.log('no vr mode available');
    }
  };


  VRManager.prototype.exitVR = function() {
    console.log('Exiting VR mode');

    // put UI back into mono mode
    this.ui.setRenderMode(this.ui.modes.mono);

    // tell content that we have changed render modes.
    // if (this.currentDemo) {
    //   this.currentDemo.setRenderMode(this.ui.mode);
    // }

    this.ui.reset();
  };

  VRManager.prototype.zeroSensor = function () {
    var self = this;
    self.vrReady.then(function () {
      console.log('zeroing sensor');

      // reset sensor on UI
      self.ui.controls.zeroSensor();

      // reset sensor on vrtab content
      if (self.currentDemo) {
        self.currentDemo.zeroSensor();
      }

    });
  };

  return new VRManager('#container');
})();

window.t = (function() {
  function t() {
    this.ui = VRManager.ui;
  }

  t.prototype.ui = function() {
    return this.ui;
  }

  t.prototype.transition = function() {
    var self = this;
    this.ui.transition.fadeOut().then(function() {
      self.ui.transition.fadeIn();
    })
  }
  t.prototype.loading = function() {
    this.ui.transition.fadeOut();
    this.ui.loading.show();
  }

  t.prototype.title = function() {
    this.ui.backgroundShow();
    this.ui.title.show();
  }
  t.prototype.enableHud = function() {
    this.ui.hud.enable();
  }

  return new t();
})();
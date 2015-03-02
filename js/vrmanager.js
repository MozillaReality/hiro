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


    //self.ui.start();
  }

  VRManager.prototype.unloadCurrent = function() {
    var self = this;

    if (self.currentDemo) {
      self.currentDemo.destroy();
    }
  };

  // load another demo
  VRManager.prototype.load = function(url) {
    var self = this;

    var newTab = new VRTab(url);
    newTab.hide();
    newTab.mount(self.loader);

    if (self.loadingTab) {
      self.loadingTab.destroy();
    }
    self.loadingTab = newTab;

    newTab.getPageMeta.then(function(pageMeta) {
      var description, title;

      if (pageMeta) {
        description = pageMeta.data.description;
        title = pageMeta.data.title;
      } else {
        description = "";
        title = "";
      }

      newTab.siteInfo = {};
      newTab.siteInfo.description = description;
      newTab.siteInfo.title = title;

      // call callback
      if (self.onPageMeta) {
        self.onPageMeta(newTab);
      }
    });

    newTab.ready.then(function() {
      self.unloadCurrent();
      self.loadingTab = null;
      self.currentDemo = newTab;

      // set render mode of new demo to current UI mode.
      newTab.setRenderMode(self.ui.mode);

      newTab.show();

      newTab.start();

      if (self.onTabReady) {
        self.onTabReady();
      }
    });

    newTab.load();
  };

  /*
  This runs when user enters VR mode.
  */
  VRManager.prototype.enableVR = function(opts) {
    var self = this;

    self.opts = opts || {};

    // enables fullscreen distortion
    self.opts.fullscreen = self.opts.fullscreen == undefined ? true : false;

    if (self.vrIsReady) {
      // start fullscreen on the container element.
      var container = self.container;

      if (self.opts.fullscreen) {
        if (container.requestFullscreen) {
          container.requestFullscreen({ vrDisplay: self.hmdDevice });
        } else if (container.mozRequestFullScreen) {
          container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
        } else if (container.webkitRequestFullscreen) {
          container.webkitRequestFullscreen({ vrDisplay: self.hmdDevice });
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
      };

      if(Utils.querystring.demo) {
        VRDemo.start();
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
    if (this.currentDemo) {
      this.currentDemo.setRenderMode(this.ui.mode);
    }

    this.ui.reset();
  };

  VRManager.prototype.zeroSensor = function () {
    var self = this;
    self.vrReady.then(function () {
      console.log('zeroing sensor');

      // reset sensor on UI
      self.positionDevice.zeroSensor();

      // reset sensor on vrtab content
      if (self.currentDemo) {
        self.currentDemo.zeroSensor();
      }

    });
  };

  return new VRManager('#container');
})();



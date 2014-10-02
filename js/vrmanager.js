// requires VRCursor
window.VRManager = (function() {
  var baseTransform = "translate3d(0, 0, 0)";
  // options
  var START_WITH_HUD = true;
  var START_WITH_INTRO = false;
  

  function VRManager(container, console) {
    var self = this;
    self.container = document.querySelector(container);
    self.console = document.querySelector(console);

    self.log('\n\nStarting JS-DOS...');
    self.log('\n\nHIMEM is testing virtual memory...done.');
    self.log('Javascript Advanced VR Interaction System, Version 0.5\n\n');
    self.log('Initializing Mozilla HIRO demo application v1');

    var transitionCanvas = document.createElement('canvas');
    self.transition = new VRTransition(self.container.querySelector('#transition'), transitionCanvas);
    self.cameras = self.container.querySelectorAll('.camera');
    self.loader = self.container.querySelector('#loader');
    self.hud = self.container.querySelector('#hud');
    self.interstitial = self.container.querySelectorAll('#interstitial');
    self.title = self.container.querySelector('#title');
    self.sequence = new VRSequence();
    self.cursor = new Cursor(self.hud);
    self.currentCursor = self.cursor;

    self.renderFadeOut = function(canvas, opacity) {
      opacity = opacity || 0;
      var context = canvas.getContext("2d");
      var width = canvas.width;
      var height = canvas.height;
      if (opacity >= 1) {
        return;
      }
      context.clearRect(0, 0, width , height);
      context.globalAlpha = opacity;
      context.fillStyle="rgb(0, 0, 0)";
      context.fillRect(0, 0, width, height);
      requestAnimationFrame(render);
      function render() {
        self.renderFadeOut(canvas, opacity + 0.1);
      }
    };

    self.renderFadeIn = function(canvas, opacity) {
      opacity = typeof opacity === "undefined"? 1 : opacity;
      var context = canvas.getContext("2d");
      var width = canvas.width;
      var height = canvas.height;
      if (opacity <= 0) {
        return;
      }
      context.clearRect(0, 0, width , height);
      context.globalAlpha = opacity;
      context.fillStyle="rgb(0, 0, 0)";
      context.fillRect(0, 0, width, height);
      requestAnimationFrame(render);
      function render() {
        self.renderFadeIn(canvas, opacity - 0.1);
      }
    };

    // this promise resolves when VR devices are detected.
    self.vrReady = new Promise(function (resolve, reject) {
      if (navigator.getVRDevices) {
        self.log('looking for virtual reality hardware...');
        navigator.getVRDevices().then(function (devices) {
          self.log('found ' + devices.length + ' devices');
          for (var i = 0; i < devices.length; ++i) {
            if (devices[i] instanceof HMDVRDevice && !self.hmdDevice) {
              self.hmdDevice = devices[i];
              self.log('found head mounted display device');
            }
            if (devices[i] instanceof PositionSensorVRDevice &&
                devices[i].hardwareUnitId == self.hmdDevice.hardwareUnitId &&
                !self.positionDevice) {
              self.positionDevice = devices[i];
              self.log('found motion tracking devices');
              break;
            }
          }
          if (self.hmdDevice && self.positionDevice) {
            self.log('VR devices found.');
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
      self.log('Error locating VR devices: ' + err);
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

    self.vrReady.then(function () {
      if (self.vrIsReady) {
        self.log('\npress `f` to enter VR');
      }
    });
  }


  VRManager.prototype.log = function (msg) {
    this.console.innerHTML += '<div>' + msg + '</div>';
  };

  VRManager.prototype.load = function (url, opts) {
    var self = this;
    
    if (opts.transition == undefined) {
      transition = true;
    } else {
      transition = opts.transition
    }      

    if (transition) {
      self.transition.fadeOut( self.renderFadeOut ).then( loadTab );
    } else {
      loadTab();
    }

    function loadTab() {
      self.log('loading url: ' + url);
      var newTab = new VRTab(url);

      newTab.hide();
      
      newTab.mount(self.loader);
      if (self.loadingTab) {
        self.loadingTab.destroy();
      }
      self.loadingTab = newTab;

      newTab.ready.then(function () {
        self.log('cleaning up old demo');
        if (self.currentDemo) {
          self.currentDemo.destroy();
        }
        self.loadingTab = null;
        self.currentDemo = newTab;

        newTab.show();

        // We'll do this elsewhere eventually
        newTab.start();

        if (transition) {
          self.transition.fadeIn(self.renderFadeIn);
        }
        
        if (opts.showTitle && opts.siteInfo) {
          console.log(opts.siteInfo);
          var title = new VRTitle(self.title, self.title.querySelector('template'), opts.siteInfo);
        }

      });

      newTab.load();
    }
  };

  VRManager.prototype.enableVR = function () {
    var self = this;
    if (self.vrIsReady) {
      self.cursor.enable();
      self.container.mozRequestFullScreen({ vrDisplay: self.hmdDevice });
      document.body.mozRequestPointerLock();
      requestAnimationFrame(self.stageFrame.bind(self));
      
      if (START_WITH_HUD) {
        VRHud.start();
      }
      if (START_WITH_INTRO) {
        this.sequence.start();
      }
    }
  };

  VRManager.prototype.zeroSensor = function () {
    var self = this;
    self.vrReady.then(function () {
      self.positionDevice.zeroSensor();
    });
  };

  VRManager.prototype.stageFrame = function () {
    var self = this;
    var state = self.positionDevice.getState();
    var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);
    self.cursor.updatePosition(state.orientation);
    self.transition.update();
    for (var i = 0; i < self.cameras.length; i++) {
      // only apply transforms to cameras that have display
      if (self.cameras[i].style.display !== 'none') {
        self.cameras[i].style.transform = cssOrientationMatrix + " " + baseTransform;
      }
    }
    self.cursor.updateHits();
    requestAnimationFrame(self.stageFrame.bind(self));
  };

  return new VRManager('#container', '.launch .console');

})();

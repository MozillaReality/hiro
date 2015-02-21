function VRTab(url) {
  var self = this;
  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('frameBorder', '0');
  self.handlers = [];

  self.iframe = iframe;
  
  var prefix = (url.indexOf('?') > -1) ? '&' : '?';
  self.url = url + prefix + 'timestamp=' + Date.now();

  self.getPageMeta = new Promise(function(resolve, reject) {
    /*
    Let's give some time for the incoming tab to announce that it has VRClient.

    If the VRClient hasn't announced itself with 'loading' message, we will assume its not present
    */
    var id = setTimeout(function() {
      // resolve without page meta
      resolve();
    }, 5000);

    self.listenFor('loading', function(pageMeta) {
      /*
      VRClient has announced itself
      */
      clearTimeout(id);

      // resole with page meta data
      resolve(pageMeta);
    });
  });


  // listen for tab to tell us it's ready
  self.ready = new Promise(function(resolve, reject) {
    /*
    listen for ready message from VRClient
    */
    
    self.listenFor('ready', function() {
      resolve();
    });

    // if ready does not come, resolve anyways after some time.
    setTimeout(function() {
      console.log('----- resolving anwyays');
      resolve();
    }, 5000)
  });


  // listen for tab to tell us it's safe to shut down.
  self.ended = new Promise(function (resolve, reject) {
    self.listenFor('ended', resolve);
  });

  self.loaded = new Promise(function (resolve, reject) {
    iframe.addEventListener('load', function() {
      resolve(iframe)
    });
    iframe.addEventListener('error', reject);
  });

  window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
}

// sends post message to content.
VRTab.prototype.sendMessage = function (type, data) {
  if ('contentWindow' in this.iframe) {
    this.iframe.contentWindow.postMessage({
      type: type,
      data: data
    }, '*');
  }
};

// listen for post message incoming from tab.
VRTab.prototype.listenFor = function (type, handler) {
  var self = this;

  function handle(e) {
    /*
    ideally the iframe href and event source href match, but because
    we only have a single content iframe, we should be able to make the
    assumption that the current iframe loaded is the one that is dispatching
    the events.

    because of cross domain security, we cannot reliably access the iframe href.
    */

    // var href = self.iframe.contentWindow.location.href;
    // if (e.source.location.href === href &&
    //     e.data.type === type) {

    if (self.iframe.contentWindow === e.source &&
        e.data.type === type) {

      console.log('message received: ' + e.data.type);
      handler(e.data);
    }
  }
  self.handlers.push(handle);
  window.addEventListener('message', handle);
};

VRTab.prototype.hide = function () {
  this.iframe.style = 'none';
};

VRTab.prototype.show = function () {
  this.iframe.style = 'block';
};

VRTab.prototype.mount = function (el) {
  el.appendChild(this.iframe);
};

VRTab.prototype.destroy = function () {
  this.iframe.remove();
  while (this.handlers.length) {
    window.removeEventListener('message', this.handlers.pop());
  }
};

VRTab.prototype.load = function () {
  this.iframe.src = this.url;
};

VRTab.prototype.start = function () {
  var self = this;

  self.loaded.then(function () {
    self.sendMessage('start');
  });
};

// tell content that we have switched render modes.
VRTab.prototype.setRenderMode = function(mode) {
  var self = this;
  self.loaded.then(function() {
    self.sendMessage('renderMode',mode);
  })
};

// tell content that we have switched in or away.
VRTab.prototype.blur = function() {
  var self = this;
  this.loaded.then(function() {
    self.sendMessage('onBlur');
  });
};

VRTab.prototype.focus = function() {
  var self = this;
  this.loaded.then(function() {
    self.sendMessage('onFocus');
  });
};

VRTab.prototype.zeroSensor = function() {
  var self = this;
  this.loaded.then(function() {
    self.sendMessage('onZeroSensor');
  });
}

VRTab.prototype.onWindowResize = function () {
  // This triggers the resize event within the iframe when the parent window resizes
  var iframe = this.iframe;
  iframe.height = window.innerHeight;
  iframe.height = window.innerWidth;
};
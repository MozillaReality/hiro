
function VRTab(url) {
  var self = this;
  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', '');

  self.handlers = [];

  self.iframe = iframe;
  self.url = url + '?timestamp=' + Date.now();

  self.ready = new Promise(function (resolve, reject) {
    self.listenFor('ready', resolve);
  });

  self.loaded = new Promise(function (resolve, reject) {
    iframe.addEventListener('load', resolve);
    iframe.addEventListener('error', reject);
  });
}

VRTab.prototype.sendMessage = function (type, data) {
  if ('contentWindow' in this.iframe) {
    this.iframe.contentWindow.postMessage({
      type: type,
      data: data
    }, '*');
  }
};

VRTab.prototype.listenFor = function (type, handler) {
  var self = this;

  function handle(e) {
    var href = self.iframe.contentWindow.location.href;
    console.log('saw message', href, e.source.location.href, e);
    if (e.source.location.href ===  href &&
        e.data.type === type) {
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

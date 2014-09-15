function VRTransition(containerEl, config) {
  var el =  document.createElement('div');
  el.classList.add("transition");
  el.classList.add("threed");
  containerEl.appendChild(el);
  this.el = el;
  config = config || {};
  this.duration = config.duration || 1200;
  this.z = config.z || -1;
};

VRTransition.prototype.fadeIn = function () {
  if (this.fadeOutInProgress) {
    this.fadeInPending = true;
    return;
  }
  //this.transition.classList.remove('fadeOut');
  this.el.classList.add('fadeIn');
  this.transitionRunning = false;
}

VRTransition.prototype.fadeOut = function () {
  var self = this;
  this.fadeOutInProgress = true;
  this.transitionRunning = true;
  this.el.classList.remove('fadeIn');
  this.el.classList.add('fadeOut');
  setTimeout(fadeOutFinished, this.duration);
  function fadeOutFinished() {
    self.fadeOutInProgress = false;
    if (self.fadeInPending) {
      self.fadeIn();
    }
  }
};

VRTransition.prototype.update = function () {
  this.el.style.transform = 'translate(-50%, -50%) translate3d(0, 0, ' + this.z  + 'rem) rotateY(0) rotateX(0)';
};

function VRCard() {
  var self = this;
  var container = document.createElement('div');
  self.container = container;
  self.scene = new THREE.Scene();
}

// Just a helper for VRCard.scene.
VRCard.prototype.getScene = function () {

};

// Returns Quaternion of HMD's orientation
VRCard.prototype.getOrientation = function () {

};

// takes 0..1, for voluntarily reporting load progress.
// if this is never called, a spinner is shown instead of progress.
VRCard.prototype.progress = function () {

};

// Call this to notify the VRManager that your card is ready.
VRCard.prototype.ready = function () {

};

// Provide a list of JavaScript URLs needed by your scene. Returns a Promise
// object that resolves when all scripts are loaded, and rejects if any load
// returns an error.
VRCard.prototype.loadScripts = function () {

};

// API for launchers. Used by landing pages.
VRCard.prototype.loadCard = function (url) {

};


// Callbacks for card dev. Maybe these should be events? Callbacks for now for
// perf reasons.

// An optional game loop callback. Feel free to use your own.
VRCard.prototype.onTick = function () { /* user assigned */ };

// Called before each render cycle of the scene.
// Prefer `ontick` for game loop functions for perf reasons.
VRCard.prototype.onRender = function () { /* user assigned */ };

// Called when user unloads a scene.
// If you want to perform a closing animation or transition, return a Promise
// object that is resolved when the teardown animation is complete.
VRCard.prototype.onTeardown = function () { /* user assigned */ };

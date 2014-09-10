function VRScene() {
	var self = this;
	self.vr = {};
	self.running = false;

	VRClient.getVR.then(function (vr) {
		self.vr.tracker = vr.position;
		VRClient.ready().then(function () {
			self.start();
		});
	});
}

VRScene.prototype.start = function() {
	var self = this;
	self.running = true;
	function tick() {
		if ('tick' in self) {
			self.tick();
		}
		if (self.running) {
			requestAnimationFrame(tick);
		}
	}
	requestAnimationFrame(tick);
};


// main

var camera = document.getElementById("camera");
var cssCameraPositionTransform = "translate3d(0, 0, 0)";
var v = new VRScene();

v.tick = function() {
	var self = this;
	var tracker = self.vr.tracker;
	var state = tracker.getState();
	var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);
	camera.style.transform = cssOrientationMatrix+ " " + cssCameraPositionTransform;
};

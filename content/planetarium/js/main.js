var stars = [];
var cursor;
var container = document.querySelector('#container');

var starColors = [
  "#8DA0E5",
  "#9BAFEA",
  "#BCCAEF",
  "#F6F5FD"
];

function generateStars(numStars) {
  var skyElement = document.querySelector('#sky');
  var moonElement = document.createElement('div');
  var moonLabelElement = document.createElement('div');
  var polarisElement = document.createElement('div');

  for (i=0; i < numStars; ++i) {
    skyElement.appendChild(generateStar(i));
  }

  polarisElement.classList.add('threed');
  polarisElement.classList.add('star');
  polarisElement.classList.add('polaris');
  skyElement.appendChild(polarisElement);

  moonElement.classList.add('threed');
  moonElement.classList.add('moon');

  moonLabelElement.classList.add('threed');
  moonLabelElement.classList.add('star-label');
  moonLabelElement.textContent = 'Moon';
  moonElement.appendChild(moonLabelElement);
  cursor.addHitElement(moonElement);
  moonElement.addEventListener('mouseover', function(e) {
    e.target.classList.add('highlighted');
  });
  moonElement.addEventListener('mouseout', function(e) {
    e.target.classList.remove('highlighted');
  });
  stars.push({
    'el': moonElement,
    'ra': 0,
    'dec': 30
  });
  skyElement.appendChild(moonElement);
}

function generateStar(id) {
  var starElement = document.createElement('div');
  var starLabelElement = document.createElement('div');
  var ra = getRandomInt(0, 360);
  var dec = getRandomInt(-180, 180);
  var transform =
    'rotateY(' + ra +  'deg) ' +
    'rotateX(' + dec + 'deg) ' +
    'translate3d(0, 0, 500px) ' +
    'rotateY(180deg)';
  starElement.setAttribute('id', 'star-' + id);
  starElement.classList.add('star');
  starElement.classList.add('threed');
  starElement.style.transform = transform;
  starElement.style.backgroundColor = starColors[getRandomInt(0,3)];

  starLabelElement.classList.add('threed');
  starLabelElement.classList.add('star-label');
  starLabelElement.textContent = 'star ' + id;
  starElement.appendChild(starLabelElement);

  stars.push({
    "el": starElement,
    "ra": ra,
    "dec": dec
  });
  cursor.addHitElement(starElement);
  starElement.addEventListener('mouseover', function(e) {
    e.target.classList.add('highlighted');
  });
  starElement.addEventListener('mouseout', function(e) {
    e.target.classList.remove('highlighted');
  });
  return starElement;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function rotateSky() {
  var skyElement = document.querySelector('#sky');
  skyElement.classList.add('rotateSky');
}

function VRScene() {
  var self = this;
  var cursorStyle =
    "width: 50px;" +
    "height: 50px;" +
    "background-color: transparent;" +
    "border: 3px solid green;" +
    "border-radius: 50%;";
  self.vr = {};
  self.running = false;
  cursor = new Cursor(container, cursorStyle);
  generateStars(100);

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
var cssCameraPositionTransform = "translate3d(0, 0, 0) rotateY(180deg)";

window.addEventListener("load", init, false);
function init() {
  v = new VRScene();
  v.tick = function() {
    var self = this;
    var tracker = self.vr.tracker;
    var state = tracker.getState();
    var cameras = container.querySelectorAll('.camera');
    var cssOrientationMatrix = cssMatrixFromOrientation(state.orientation, true);
    cursor.updatePosition();
    cursor.updateHits();
    for (var i = 0; i < cameras.length; i++) {
      cameras[i].style.transform = cssOrientationMatrix + " " + cssCameraPositionTransform;
    }
  };
}

// Leap.loop(function(frame) {
//   var hand = frame.hands[0];
//   if (!hand) {
//     return;
//   }
//   var handRotationX = (hand._rotation[2]*90);
//   var handRotationY = (hand._rotation[1]*90);
//   var handRotationZ = (hand._rotation[0]*90);
//   var cssHandOrientation =
//     'rotateX(' + handRotationY +  'deg)';
//     //'rotateY(' + -handRotationX +  'deg)';
//   var transform = cssHandOrientation + " " + cssCameraPositionTransform;
//   cssCamera.style.transform = transform;
// })

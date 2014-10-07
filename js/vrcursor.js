function VRCursor() {
}

// requires three.js dom and camera to initialize cursor.
VRCursor.prototype.init = function( dom, camera, context ) {
  this.dom = dom;
  this.camera = camera;
  this.context = context;
  var layout = new THREE.Group();
  var raycaster = new THREE.Raycaster();
  var cursorPivot = new THREE.Object3D();
  var cursor = new THREE.Mesh(
    new THREE.PlaneGeometry( 1, 1 ),
    new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } )
  );

  // set the depth of cursor
  cursor.position.z = -28;
  
  this.raycaster = raycaster;
  this.cursorPivot = cursorPivot;
  this.cursor = cursor;
  
  cursorPivot.add(cursor);
  layout.add(cursorPivot);
  
  // set origin VR cursor positioning
  this.position = {
    x: 0,
    y: 0
  }
  this.objectMouseOver = null;
  
  // bind "real" mouse events.
  this.bindEvents(); 
  
  return layout;
}

// VR Cursor events
VRCursor.prototype.events = {
  clickEvent : { type: 'click'},
  mouseMoveEvent : { type: 'mousemove' },
  mouseOverEvent : { type: 'mouseover' },
  mouseOutEvent : { type: 'mouseout' },
  mouseDownEvent : { type: 'mousedown' }
}

// binds mouse events
VRCursor.prototype.bindEvents = function() {
  var body = window && window.parent? window.parent.document.body : document.body;
  var onMouseMoved = this.onMouseMoved.bind(this);
  var onMouseClicked = this.onMouseClicked.bind(this);

  body.addEventListener("mousemove", onMouseMoved, false);
  body.addEventListener("click", onMouseClicked, false); 
}

// set context for cursor to be active in.
VRCursor.prototype.setContext = function(context) {
  this.context = context;
}

// VR Cursor events
VRCursor.prototype.onMouseMoved = function(e) {
  e.preventDefault();

  // move VR cursor
  var pixelsToDegreesFactor = 0.00025;
  var x = (this.position.x * pixelsToDegreesFactor) % 360;
  var y = (this.position.y * pixelsToDegreesFactor) % 360;
  var cursorPivot = this.cursorPivot;
  var cursor = this.cursor;
  cursorPivot.rotation.x = 2 * Math.PI * -y;
  cursorPivot.rotation.y = 2 * Math.PI * -x;

  var movementX = e.mozMovementX || 0;
  var movementY = e.mozMovementY || 0;
  // var elHalfWidth = this.elWidth / 2;
  // var elHalfHeight = this.elHeight / 2;
  // var minX = -elHalfWidth;
  // var maxX = elHalfWidth;
  // var minY = -elHalfHeight;
  // var maxY = elHalfHeight;
  var x = this.position.x;
  var y = this.position.y;
  x += movementX;
  y += movementY;

  this.position = {
    x: x,
    y: y
  };

  this.updateCursorIntersection();
};

VRCursor.prototype.onMouseClicked = function(e) {
  e.preventDefault();
  if (this.objectMouseOver) {
    this.objectMouseOver.dispatchEvent(this.events.clickEvent);
  }
}

// Detect intersections with three.js scene objects (context) and dispatch mouseover and mouseout events.
VRCursor.prototype.updateCursorIntersection = function() {
  var camera = this.camera;
  var raycaster = this.raycaster;
  var cursor = this.cursor;

  var x = this.position.x / (window.innerWidth/2);
  var y = -(this.position.y / (window.innerHeight/2));
  var vector = new THREE.Vector3(x, y, 1).unproject( camera );

  raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
  
  var intersects = raycaster.intersectObjects( this.context.children );
  var intersected;
  var i;
  
  var objectMouseOver = this.objectMouseOver;
  var events = this.events;
  
  if (intersects.length == 0 && objectMouseOver !== null) {
    this.objectMouseOver.dispatchEvent(events.mouseOutEvent);
    this.objectMouseOver = null;
  }

  for (i = 0; i < intersects.length; ++i) {
    intersected = intersects[0].object;

    if (intersected !== objectMouseOver) {
      if (objectMouseOver !== null) {
        objectMouseOver.dispatchEvent(events.mouseOutEvent);
      }
      if (intersected !== null) {
        intersected.dispatchEvent(events.mouseOverEvent);
      }
      
      this.objectMouseOver = intersected;
    }
  } 
};






// window.Cursor = (function() {

//   function clamp(val, min, max) {
//     if (val < min) {
//       return min;
//     }
//     if (val > max) {
//       return max;
//     }
//     return val;
//   };

//   function Cursor(containerEl, style) {
//     this.onMouseMoved = this.updateCoordinates.bind(this);
//     this.onMouseDown = this.emitClickEvents.bind(this);
//     this.onMessage = this.onMessage.bind(this);
//     this.cursor = {
//       x: 0,
//       y: 0
//     };
//     this.hitEls = [];
//     this.hits = [];
//     this.style = style || this.style;
//     this.el = this.createCursor();
//     this.elWidth = this.el.clientWidth;
//     this.elHeight = this.el.clientHeight;
//     this.pointerLocked = false;
//     containerEl.appendChild(this.el);
//     // Binds event listeners
//     window.addEventListener('message', this.onMessage);
//     var cursor = this;
//     this.enable();
//   }

//   Cursor.prototype.onMessage = function(e) {
//     var msg = e.data;
//     if (msg.type === "disablecursor") {
//       this.disable();
//     }
//     if (msg.type === "enablecursor") {
//       this.enable();
//     }
//   };

//   Cursor.prototype.createCursor = function() {
//     var cursorContainer = this.render();
//     var cursorEl = cursorContainer.querySelector('.cursor');
//     cursorEl.style = this.style;
//     cursorEl.style.transform = 'translate(-50%, -50%) translate3d(0, 0, -28rem) rotateY(0) rotateX(0)';
//     this.cursorEl = cursorEl;
//     return cursorContainer;
//   };

//   Cursor.prototype.enable = function() {
//     if (window.VRClient) {
//       VRClient.sendMessage('disablecursor');
//     }
//     this.el.style.display = 'block';
//     this.attachEvents();
//   };

//   Cursor.prototype.disable = function() {
//     this.removeEvents();
//     this.el.style.display = 'none';
//   };

//   Cursor.prototype.attachEvents = function() {
//     var body = window && window.parent? window.parent.document.body : document.body;
//     body.addEventListener("mousemove", this.onMouseMoved, false);
//     body.addEventListener("mousedown", this.onMouseDown, false);
//   };

//   Cursor.prototype.removeEvents = function() {
//     var body = window && window.parent? window.parent.document.body : document.body;
//     body.removeEventListener("mousemove", this.onMouseMoved, false);
//     body.removeEventListener("mousedown", this.onMouseDown, false);
//   };

//   Cursor.prototype.addHitElement = function(el) {
//     // We only deal with DOM elements
//     if (el instanceof HTMLElement) {
//       this.hitEls.push(el);
//     }
//   };

//   Cursor.prototype.updateHits = function() {
//     var hits = [];
//     var self = this;
//     // mouseover events
//     this.hitEls.forEach(function(el){
//       if(self.hit(el)) {
//         self.emit(el, 'mouseover');
//         hits.push(el);
//       }
//     });
//     // mouseout events
//     this.hits.forEach(function(el) {
//       if(!self.hit(el)) {
//         self.emit(el, 'mouseout');
//       }
//     });
//     this.hits = hits;
//   };

//   Cursor.prototype.emitClickEvents = function() {
//     var self = this;
//     this.hits.forEach(function(el) {
//       self.emit(el, 'click');
//     })
//   };

//   Cursor.prototype.emit = function(el, event) {
//     var event = new MouseEvent(event ,{
//       'view': window,
//       'bubbles': true,
//       'cancelable': true
//     });
//     el.dispatchEvent(event);
//   };

//   Cursor.prototype.hit = function(el) {
//     var cursorBox = this.cursorEl.getBoundingClientRect();
//     var elBox = el.getBoundingClientRect();
//     if (elBox.right < cursorBox.left ||
//         elBox.bottom < cursorBox.top ||
//         elBox.left > cursorBox.right ||
//         elBox.top > cursorBox.bottom) {
//       return false;
//     }
//     // if (cursorBox.right < elBox.left ||
//     //     cursorBox.bottom < elBox.top ||
//     //     cursorBox.left > elBox.right ||
//     //     cursorBox.top > elBox.bottom) {
//     //   return false;
//     // }
//     return true;
//   };

//   Cursor.prototype.updateCoordinates = function(e) {
//     var movementX = e.mozMovementX || 0;
//     var movementY = e.mozMovementY || 0;
//     var elHalfWidth = this.elWidth / 2;
//     var elHalfHeight = this.elHeight / 2;
//     var minX = -elHalfWidth;
//     var maxX = elHalfWidth;
//     var minY = -elHalfHeight;
//     var maxY = elHalfHeight;
//     var x = this.cursor.x;
//     var y = this.cursor.y;
//     var padding = 50;
//     x += movementX;
//     y += movementY;
//     this.cursor = {
//       x: x,
//       y: y
//     };
//   };

//   Cursor.prototype.updatePosition = function(q) {
//     var cursorEl = this.cursorEl;
//     //var cssOrientationMatrix = cssMatrixFromOrientation(q);
//     var pixelsToDegreesFactor = 0.1;
//     var x = (this.cursor.x * pixelsToDegreesFactor) % 360;
//     var y = (this.cursor.y * pixelsToDegreesFactor) % 360;
//     //x = clamp(x, -20, 20);
//     //y = clamp(y, -20, 20);
//     cursorEl.style.transform = 'rotateY(' + -x +'deg) rotateX('+ y +'deg) translate3d(0, 0, -28rem)';
//   };

//   Cursor.prototype.style =
//     "background-color: transparent; " +
//     "border-left: 5px solid transparent; " +
//     "border-right: 5px solid transparent; " +
//     "border-top: 10px solid red;";

//   Cursor.prototype.render = function() {
//     var container = document.createElement('div');
//     container.classList.add('threed');
//     container.style.backgroundColor = "transparent";
//     container.style.width = "10px";
//     container.style.height = "10px";
//     container.style.transform = 'translate(-50%, -50%) translate3d(0, 0, 0) rotateY(0) rotateX(0)';
//     container.innerHTML =
//     //'<!-- The cursor gets clipped without this dummy element -->' +
//     //'<div class="threed" style="width: 1px; height: 1px"></div>' +
//     '<div class="threed cursor "' + this.style +'></div>';
//     return container;
//   };

//   return Cursor;

// })();

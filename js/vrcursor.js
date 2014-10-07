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

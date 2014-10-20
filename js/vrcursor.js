function VRCursor(mode) {
  this.enabled = false;
  this.context = null;
  this.layout = null;
  this.rotation = {
    x: 0,
    y: 0
  };
  this.mode = this.modes[mode] || this.modes.centered;
}

VRCursor.modes = VRCursor.prototype.modes = {
  centered: 1,
  mouseSync: 2,
  inFOV: 3
};

// enable cursor with context, otherwise pick last
VRCursor.prototype.enable = function(context) {
  if (context) {
    this.context = context;
  }
  if (!this.enabled) {
    this.enabled = true;
    this.layout.visible = true;
  }
};

VRCursor.prototype.disable = function() {
  if (this.enabled) {
    this.enabled = false;
    this.layout.visible = false;
  }
}
// requires three.js dom and camera to initialize cursor.
VRCursor.prototype.init = function( dom, camera, context ) {
  this.dom = dom;
  this.camera = camera;
  this.context = context;
  var layout = this.layout = new THREE.Group();
  layout.visible = this.enabled;
  var raycaster = new THREE.Raycaster();
  var cursorPivot = new THREE.Object3D();
  var cursor = new THREE.Mesh(
    new THREE.SphereGeometry( 0.5, 5, 5 ),
    new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } )
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

VRCursor.prototype.clampAngleTo = function(angle, boundary) {
  if (angle < -boundary) {
    return -boundary;
  }
  if (angle > boundary) {
    return boundary;
  }
  return angle;
};

// VR Cursor events
VRCursor.prototype.onMouseMoved = function(e) {
  e.preventDefault();
  if (!this.enabled) {
    return false;
  }

  var movementX = e.movementX ||
      e.mozMovementX ||
      e.webkitMovementX || 0;

  var movementY = e.movementY ||
      e.mozMovementY ||
      e.webkitMovementY || 0;

  // var elHalfWidth = this.elWidth / 2;
  // var elHalfHeight = this.elHeight / 2;
  // var minX = -elHalfWidth;
  // var maxX = elHalfWidth;
  // var minY = -elHalfHeight;
  // var maxY = elHalfHeight;
  var pixelsToDegreesFactor = 0.00025;
  // Rotation in degrees
  var x = (movementX * pixelsToDegreesFactor) % 360;
  var y = (movementY * pixelsToDegreesFactor) % 360;
  // To Radians
  this.rotation.x -= y * 2 * Math.PI;
  this.rotation.y -= x * 2 * Math.PI;
  // this.rotation.x = this.clampAngleTo(this.rotation.x, Math.PI / 6);
  // this.rotation.y = this.clampAngleTo(this.rotation.y, Math.PI / 6);

  this.updateCursorIntersection();
};

VRCursor.prototype.onMouseClicked = function(e) {
  e.preventDefault();
  if (!this.enabled) {
    return false;
  }
  if (this.objectMouseOver) {
    this.objectMouseOver.dispatchEvent(this.events.clickEvent);
  }
}

VRCursor.prototype.update = function(headQuat) {
  var cursorPivot = this.cursorPivot;
  // Quaternion expressing the mouse orientation
  var rotation = new THREE.Euler(this.rotation.x, this.rotation.y, 0);
  var mouseQuat = new THREE.Quaternion().setFromEuler(rotation, true);
  var headQuat = this.camera.quaternion;
  // // If head quaternion is null we make the identity so
  // // it doesn't affect the rotation composition
  // if (headQuat[0] === 0 &&
  //     headQuat[1] === 0 &&
  //     headQuat[2] === 0) {
  //   headQuat[3] = 1;
  // }
  // Multiplies head and mouse rotation to calculate the final
  // position of the cursor
  var pivotQuat = new THREE.Quaternion();
  var cameraCursorAngle = this.cameraCursorAngle();

  if (this.mode !== this.modes.inFOV ||
      (this.mode === this.modes.inFOV && cameraCursorAngle >= (Math.PI / 4))) {
    pivotQuat.multiply(headQuat);
    //pivotQuat.fromArray(headQuat);
  }

  if (this.mode !== this.modes.centered) {
    pivotQuat.multiply(mouseQuat).normalize();
  }

  cursorPivot.setRotationFromQuaternion(pivotQuat);

  // It updates hits
  this.updateCursorIntersection();
};

VRCursor.prototype.cameraCursorAngle = function() {
  var cursor = this.cursorPivot;
  var camera = this.camera;
  var cameraVector = new THREE.Vector3( 0, 0, -1 );
  var cursorVector = new THREE.Vector3( 0, 0, -1 );
  cameraVector.applyQuaternion(camera.quaternion);
  cursorVector.applyQuaternion(cursor.quaternion);
  return Math.abs(cursorVector.angleTo(cameraVector));
};


// Detect intersections with three.js scene objects (context) and dispatch mouseover and mouseout events.
VRCursor.prototype.updateCursorIntersection = function() {
  var camera = this.camera;
  var raycaster = this.raycaster;
  var cursor = this.cursor;

  var cursorPosition = cursor.matrixWorld;
  vector = new THREE.Vector3().setFromMatrixPosition(cursorPosition);

  // Draws RAY
  // var geometry = new THREE.Geometry();
  // geometry.vertices.push( camera.position );
  // geometry.vertices.push( vector.sub( camera.position ).normalize().multiplyScalar(5000) );
  // this.scene.remove(this.line);
  // this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xFF0000}));
  // this.scene.add(this.line);

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

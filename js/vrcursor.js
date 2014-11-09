function VRCursor(mode) {
  var self = this;

  this.enabled = false;

  // current scene context in which the cursor is operating
  this.context = null;

  // Object 3d for cursor
  this.layout = null;

  // system mouse vector
  this.mouse = null;

  // body el
  this.body = window && window.parent? window.parent.document.body : document.body;

  this.rotation = {
    x: 0,
    y: 0,
    xInc: 0,
    yInc: 0
  };

  // VR cursor position
  this.position = {
    x: 0,
    y: 0
  }

  // object which cursor currently intersects
  this.objectMouseOver = null;

  // cursor operating mode
  this.mode = mode || 'centered';

  this.setMode(this.mode);

  //  return promise when all the necessary three cursor components are ready.
  this.ready = new Promise(function(resolve) {
      self.layout = new THREE.Group();
      self.raycaster = new THREE.Raycaster();
      self.cursorPivot = new THREE.Object3D();
      self.projector = new THREE.Projector();

      // cursor mesh
      self.cursor = new THREE.Mesh(
        new THREE.SphereGeometry( 0.05, 5, 5 ),
        new THREE.MeshBasicMaterial( { color: Math.random() * 0xffffff, side: THREE.DoubleSide } )
      );

      self.layout.visible = self.enabled;

      // set the depth of cursor
      self.cursor.position.z = -2;

      self.cursorPivot.add(self.cursor);

      self.layout.add(self.cursorPivot);

      resolve();
  });

  // bind "real" mouse events.
  if (this.enabled) {
    this.bindEvents();
  }
}

VRCursor.modes = VRCursor.prototype.modes = {
  centered: 1,
  mouseSync: 2,
  inFOV: 3,
  hides: 4,
  mono: 5
};

VRCursor.prototype.setMode = function(mode) {
  console.log('setting cursor: ' + mode);

  this.mode = this.modes[mode];

  switch (this.mode) {
    case this.modes.centered:
      this.updatePosition = this.updatePositionCentered;
      break;
    case this.modes.mouseSync:
      this.updatePosition = this.updatePositionMouseSync;
      break;
    case this.modes.inFOV:
      this.updatePosition = this.updatePositionInFOV;
      break;
    case this.modes.hides:
      this.updatePosition = this.updatePositionHides;
      break;
    case this.modes.mono:
      this.updatePosition = function() {};
      break;
  }
}

// enable cursor with context, otherwise pick last
VRCursor.prototype.enable = function(context) {
  if (context) {
    this.context = context;
  };

  if (!this.enabled) {
    this.bindEvents();
    this.enabled = true;
    this.layout.visible = true;
  };
};

VRCursor.prototype.disable = function() {
  if (this.enabled) {
    this.unbindEvents();
    this.enabled = false;
    this.layout.visible = false;
  }
}
// requires three.js dom and camera to initialize cursor.
VRCursor.prototype.init = function( dom, camera, context ) {
  this.dom = dom;
  this.camera = camera;
  this.context = context;
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
  var body = this.body;
  var onMouseMoved = this.onMouseMoved.bind(this);
  var onMouseClicked = this.onMouseClicked.bind(this);

  body.addEventListener("mousemove", onMouseMoved, false);
  body.addEventListener("click", onMouseClicked, false);
};

VRCursor.prototype.unbindEvents = function() {
  var body = this.body;

  body.removeEventListener("mousemove", this.onMouseMoved, false);
  body.removeEventListener("click", this.onMouseClicked, false);
};

VRCursor.prototype.clampAngleTo = function(angle, boundary) {
  if (angle < -boundary) {
    return -boundary;
  }
  if (angle > boundary) {
    return boundary;
  }
  return angle;
};

VRCursor.prototype.hide = function(delay, hidden) {
  var self = this;
  clearTimeout(this.hideCursorTimeout);
  this.hideCursorTimeout = setTimeout(hideCursor, delay);
  function hideCursor() {
    self.cursor.visible = false;
    if (hidden) { hidden(); }
  }
};

VRCursor.prototype.show = function() {
  this.cursor.visible = true;
};

VRCursor.prototype.headQuat = function() {
  var headQuat = this.camera.quaternion;
  // // If head quaternion is null we make the identity so
  // it doesn't affect the rotation composition
  if (headQuat.x === 0 &&
      headQuat.y === 0 &&
      headQuat.z === 0) {
    headQuat.w = 1;
  }
  return headQuat;
};

// VR Cursor events
VRCursor.prototype.onMouseMoved = function(e) {
  e.preventDefault();

  if (!this.enabled) {
    return false;
  }

  // get vectors for 2d mono mouse
  if (this.mode == this.modes.mono) {
    var mouse = new THREE.Vector3( ( e.clientX / window.innerWidth ) * 2 - 1,   //x
      -( e.clientY / window.innerHeight ) * 2 + 1,  //y
      0.5 );
    mouse.unproject(this.camera)
    mouse.sub(this.camera.position);
    mouse.normalize();
    this.mouse = mouse;
  }

  // everything below assumes pointerlock
  if (this.mode === this.modes.hides) {
    if (!this.cursor.visible) {
      this.showQuat = new THREE.Quaternion().copy(this.headQuat());
      this.rotation.x = 0;
      this.rotation.y = 0;
      this.show();
    }
    this.hide(3000);
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

};

VRCursor.prototype.onMouseClicked = function(e) {
  console.log('vrcuror click');
  var target = e.target;

  if (!this.enabled) {
    return false;
  };

  if (target.tagName == 'BODY' ||
    target.tagName == 'CANVAS') {

    if (this.objectMouseOver) {
      this.objectMouseOver.dispatchEvent(this.events.clickEvent);
    }

  };
}

VRCursor.prototype.updatePositionMouseSync = function(headQuat) {
  var headQuat = this.headQuat();
  this.rotation.x = this.clampAngleTo(this.rotation.x, Math.PI / 6);
  this.rotation.y = this.clampAngleTo(this.rotation.y, Math.PI / 6);
  var rotation = new THREE.Euler(this.rotation.x, this.rotation.y, 0);
  var mouseQuat = new THREE.Quaternion().setFromEuler(rotation, true);
  var cursorPivot = this.cursorPivot;
  var pivotQuat = new THREE.Quaternion();
  pivotQuat
    .multiply(headQuat)
    .multiply(mouseQuat)
    .normalize();
  cursorPivot.setRotationFromQuaternion(pivotQuat);
};

VRCursor.prototype.updatePositionCentered = function(headQuat) {
  var headQuat = this.headQuat();
  var cursorPivot = this.cursorPivot;
  var pivotQuat = new THREE.Quaternion();
  pivotQuat.multiply(headQuat);
  cursorPivot.setRotationFromQuaternion(pivotQuat);
  cursorPivot.position.copy( this.camera.position )
};

// VRCursor.prototype.updatePositionInFOV = function(headQuat) {
//   var headQuat = this.headQuat();
//   var mouseQuat = this.mouseQuat();
//   var cursorPivot = this.cursorPivot;
//   var pivotQuat = new THREE.Quaternion();
//   var cameraCursorEuler;
//   var cursorQuat;
//   //var newPivotQuat = new THREE.Quaternion();
//   //THREE.Quaternion.slerp(cursorPivot.quaternion, cursorQuat, newPivotQuat);
//   var cameraCursorAngle;
//   if (this.cameraCursorAngle >= (Math.PI / 5)) {
//     cursorQuat = new THREE.Quaternion().multiply(headQuat).multiply(mouseQuat);
//     cameraCursorAngle = this.quaternionsAngle(headQuat, cursorQuat);
//     console.log("CURSOR ANGLE NEW " + cameraCursorAngle);
//     console.log("CURSOR ANGLE " + this.cameraCursorAngle);
//     pivotQuat.multiply(headQuat).normalize();
//     this.lockQuat = this.lockQuat || this.cameraCursorQuat(cursorPivot.quaternion);
//     //if ( cameraCursorAngle >= (Math.PI / 5)) {
//       cameraCursorEuler = new THREE.Euler().setFromQuaternion(this.lockQuat);
//       this.rotation.x = cameraCursorEuler.x;
//       this.rotation.y = cameraCursorEuler.y;
//     // if (cameraCursorAngle < (Math.PI / 5) && this.lockQuat) {
//     //   cameraCursorEuler = new THREE.Euler().setFromQuaternion(cursorQuat);
//     //   console.log("OLD X " + this.rotation.x);
//     //   this.rotation.x = cameraCursorEuler.x;
//     //   this.rotation.y = cameraCursorEuler.y;
//     //   console.log("NEW X " + this.rotation.x);
//     //   console.log("CACA");
//     //   this.lockQuat = undefined;
//     // }
//     mouseQuat = this.mouseQuat();
//     // } else {
//     //   cameraCursorEuler = new THREE.Euler().setFromQuaternion(cursorQuat);
//     //   this.rotation.x = cameraCursorEuler.x;
//     //   this.rotation.y = cameraCursorEuler.y;
//     //   mouseQuat = this.mouseQuat();
//     //   this.lockQuat = undefined;
//     // }
//     //} else {
//     // this.lockQuat = undefined;
//     //}
//   }
//   pivotQuat.multiply(mouseQuat);
//   cursorPivot.setRotationFromQuaternion(pivotQuat);
//   this.cameraCursorAngle = this.quaternionsAngle(headQuat, cursorPivot.quaternion);
// };

VRCursor.prototype.updatePositionInFOV = function(headQuat) {
  var headQuat = this.headQuat();
  var headQuatInv = new THREE.Quaternion().copy(headQuat).inverse();
  var cursorPivot = this.cursorPivot;
  var pivotQuat = new THREE.Quaternion();
  var mouseQuat = this.mouseQuat();
  if (this.cameraCursorAngle >= (Math.PI / 5)) {
    this.lockQuat = this.lockQuat || this.validCameraCursorQuat;
    // cameraCursorEuler =  new THREE.Euler().setFromQuaternion(this.lockQuat);
    // console.log("CAMERA CURSOR " + this.cameraCursorAngle);
    // console.log("ANGLE " + JSON.stringify(cameraCursorEuler.x));
    // console.log("MOUSE " + JSON.stringify(this.rotation.x));
    // this.rotation.x = cameraCursorEuler.x;
    // this.rotation.y = cameraCursorEuler.y;
    pivotQuat.multiply(headQuat).normalize().multiply(this.lockQuat);
  } else {
    this.lockQuat = undefined;
    pivotQuat.multiply(headQuat).multiply(mouseQuat).multiply(headQuatInv);
  }
  // if (this.quaternionsAngle(headQuat, pivotQuat) >= (Math.PI / 5)) {
  //   pivotQuat.multiply(this.mouseQuat.inverse());
  // }
  cursorPivot.quaternion.copy(pivotQuat);
  this.validCameraCursorQuat = this.cameraCursorQuat(cursorPivot.quaternion || new THREE.Quaternion());
  this.cameraCursorAngle = this.quaternionsAngle(headQuat, cursorPivot.quaternion);
};

// VRCursor.prototype.updatePositionInFOV = function(headQuat) {
//   var headQuat = this.headQuat();
//   var mouseQuat = this.mouseQuat();
//   var cursorPivot = this.cursorPivot;
//   var pivotQuat = new THREE.Quaternion();
//   var cameraCursorEuler;
//   if (this.cameraCursorAngle >= (Math.PI / 5)) {
//     pivotQuat.multiply(headQuat).normalize();
//     this.lockQuat = this.lockQuat || this.cameraCursorQuat(cursorPivot.quaternion);
//     cameraCursorEuler =  new THREE.Euler().setFromQuaternion(this.lockQuat);
//     //console.log("CAMERA CURSOR " + this.cameraCursorAngle);
//     console.log("ANGLE " + JSON.stringify(cameraCursorEuler.x));
//     console.log("MOUSE " + JSON.stringify(this.rotation.x));
//     this.rotation.x = cameraCursorEuler.x;
//     this.rotation.y = cameraCursorEuler.y;
//     mouseQuat = this.mouseQuat();
//   } else {
//     this.lockQuat = undefined;
//   }
//   pivotQuat.multiply(mouseQuat);
//   cursorPivot.setRotationFromQuaternion(pivotQuat);
//   this.cameraCursorAngle = this.quaternionsAngle(headQuat, cursorPivot.quaternion);
// };


VRCursor.prototype.mouseQuat = function() {
  //this.rotation.x = this.clampAngleTo(this.rotation.x, Math.PI / 5);
  //this.rotation.y = this.clampAngleTo(this.rotation.y, Math.PI / 5);
  var rotation = new THREE.Euler(this.rotation.x, this.rotation.y, 0);
  return new THREE.Quaternion().setFromEuler(rotation, true);
};

VRCursor.prototype.updatePositionHides = function(headQuat) {
  var self = this;
  var rotation = new THREE.Euler(this.rotation.x, this.rotation.y, 0);
  var mouseQuat = new THREE.Quaternion().setFromEuler(rotation, true);
  var cursorPivot = this.cursorPivot;
  var headQuat = this.headQuat();
  var pivotQuat = new THREE.Quaternion();
  var showQuat = this.showQuat || new THREE.Quaternion();
  var cameraCursorAngle;
  pivotQuat.multiply(showQuat);
  pivotQuat.multiply(mouseQuat).normalize();
  cursorPivot.quaternion.copy(pivotQuat);
  cameraCursorAngle = this.quaternionsAngle(headQuat, cursorPivot.quaternion);
  // if the cursor lives the FOV it hides
  if (cameraCursorAngle >= Math.PI / 3) {
    this.hide(0);
  }
};

VRCursor.prototype.update = function(headQuat) {
  this.updatePosition();
  // It updates hits
  this.updateCursorIntersection();
};

VRCursor.prototype.quaternionsAngle = function(q1, q2) {
  var v1 = new THREE.Vector3( 0, 0, -1 );
  var v2 = new THREE.Vector3( 0, 0, -1 );
  v1.applyQuaternion(q1);
  v2.applyQuaternion(q2);
  return Math.abs(v1.angleTo(v2));
};

VRCursor.prototype.quaternionsQuat = function(q1, q2) {
  var v1 = new THREE.Vector3( 0, 0, -1 );
  var v2 = new THREE.Vector3( 0, 0, -1 );
  v1.applyQuaternion(q1);
  v2.applyQuaternion(q2);
  return new THREE.Quaternion().setFromUnitVectors( v1, v2 );
};

VRCursor.prototype.cameraCursorQuat = function(mouseQuat) {
  var cameraQuat = this.headQuat();
  var cameraVector = new THREE.Vector3( 0, 0, -1 );
  var cursorPivotVector = new THREE.Vector3( 0, 0, -1 );
  cameraVector.applyQuaternion(cameraQuat).normalize();
  cursorPivotVector.applyQuaternion(mouseQuat).normalize();
  //var resultQuat = new THREE.Quaternion();
  //THREE.Quaternion.slerp(cameraQuat, mouseQuat, resultQuat);
  //return resultQuat;
  return new THREE.Quaternion().setFromUnitVectors( cameraVector, cursorPivotVector );
};

VRCursor.prototype.cameraCursorAngle = function() {
  var cameraQuat = this.headQuat();
  var cameraVector = new THREE.Vector3( 0, 0, -1 );
  var cursorPivot = this.cursorPivot;
  var cursorPivotVector = new THREE.Vector3( 0, 0, -1 );
  cameraVector.applyQuaternion(cameraQuat);
  cursorPivotVector.applyQuaternion(cursorPivot.quaternion);
  return Math.abs(cursorPivotVector.angleTo(cameraVector));
};


// Detect intersections with three.js scene objects (context) and dispatch mouseover and mouseout events.
VRCursor.prototype.updateCursorIntersection = function() {
  var camera = this.camera;
  var raycaster = this.raycaster;
  var cursor = this.cursor;
  var mouse = this.mouse;

  if (!camera) {
    // no camera available yet.
    return false;
  }

  if (mouse && this.mode == this.modes.mono) {
    raycaster.set( camera.position, mouse );
  } else {
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
  }


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

window.Cursor = (function() {

  function clamp(val, min, max) {
    if (val < min) {
      return min;
    }
    if (val > max) {
      return max;
    }
    return val;
  };

  function invertYAxis(q) {
    var x = q.x, y = q.y, z = q.z, w = q.w;
    x = -x; y = y; z = -z;
    var l = Math.sqrt(x*x + y*y + z*z + w*w);
    if (l == 0) {
      x = y = z = 0;
      w = 1;
    } else {
      l = 1/l;
      x *= l; y *= l; z *= l; w *= l;
    }
    return {
      x: x,
      y: y,
      z: z,
      w: w
    };
  }

  function Cursor(el) {
    var onPointerLockChanged = this.onPointerLockChanged.bind(this);
    this.onMouseMoved = this.updateCoordinates.bind(this);
    this.onMouseDown = this.emitClickEvents.bind(this);
    this.el = el;
    this.elWidth = el.clientWidth;
    this.elHeight = el.clientHeight;
    this.cursor = {
      x: 0,
      y: 0
    };
    this.hitEls = [];
    this.hits = [];
    this.cursorEl = this.createCursor();
    this.el.appendChild(this.cursorEl);

    // Binds event listeners
    document.addEventListener('mozpointerlockchange', onPointerLockChanged, false);
  };

  Cursor.prototype.createCursor = function() {
    var cursorEl = document.createElement('div');
    cursorEl.id = 'cursor';
    cursorEl.style.backgroundColor = 'transparent';
    cursorEl.style.borderLeft = '5px solid transparent';
    cursorEl.style.borderRight = '5px solid transparent';
    cursorEl.style.borderTop = '10px solid red';
    cursorEl.style.transform = 'rotateY(0) rotateX(0) translate3d(0, 0, -18rem)';
    cursorEl.classList.add('threed');
    return cursorEl;
  };

  Cursor.prototype.enable = function() {
    this.el.mozRequestPointerLock();
  };

  Cursor.prototype.disable = function() {
    document.mozExitPointerLock();
  };

  Cursor.prototype.addHitElement = function(el) {
    // We only deal with DOM elements
    if (el instanceof HTMLElement) {
      this.hitEls.push(el);
    }
  };

  Cursor.prototype.updateHits = function() {
    var hits = [];
    var self = this;
    // mouseover events
    this.hitEls.forEach(function(el){
      if(self.hit(el)) {
        self.emit(el, 'mouseover');
        hits.push(el);
      }
    });
    // mouseout events
    this.hits.forEach(function(el) {
      if(!self.hit(el)) {
        self.emit(el, 'mouseout');
      }
    });
    this.hits = hits;
  };

  Cursor.prototype.emitClickEvents = function() {
    var self = this;
    this.hits.forEach(function(el) {
      self.emit(el, 'click');
    })
  };

  Cursor.prototype.emit = function(el, event) {
    var event = new MouseEvent(event ,{
      'view': window,
      'bubbles': true,
      'cancelable': true
    });
    el.dispatchEvent(event);
  };

  Cursor.prototype.hit = function(el) {
    var cursorBox = this.cursorEl.getBoundingClientRect();
    var elBox = el.getBoundingClientRect();
    if (elBox.right < cursorBox.left ||
        elBox.bottom < cursorBox.top ||
        elBox.left > cursorBox.right ||
        elBox.top > cursorBox.bottom) {
      return false;
    }
    return true;
  };

  Cursor.prototype.updateCoordinates = function(e) {
    var movementX = e.mozMovementX || 0;
    var movementY = e.mozMovementY || 0;
    var elHalfWidth = this.elWidth / 2;
    var elHalfHeight = this.elHeight / 2;
    var minX = -elHalfWidth;
    var maxX = elHalfWidth;
    var minY = -elHalfHeight;
    var maxY = elHalfHeight;
    var x = this.cursor.x;
    var y = this.cursor.y;
    var padding = 50;
    x += movementX;
    y += movementY;
    this.cursor = {
      x: x,
      y: y
    };
  };

  Cursor.prototype.updatePosition = function(q) {
    var cursorEl = this.cursorEl;
    var cssOrientationMatrix = cssMatrixFromOrientation(invertYAxis(q));
    var pixelsToDegreesFactor = 0.1;
    var x = (this.cursor.x * pixelsToDegreesFactor) % 360;
    var y = (this.cursor.y * pixelsToDegreesFactor) % 360;
    //x = clamp(x, -20, 20);
    //y = clamp(y, -20, 20);
    cursorEl.style.transform = cssOrientationMatrix + ' rotateY(' + -x +'deg) rotateX('+ y +'deg) translate3d(0, 0, -18rem)';
  };

  Cursor.prototype.onPointerLockChanged = function() {
    var el = this.el;
    if(document.mozPointerLockElement === el) {
      document.addEventListener("mousemove", this.onMouseMoved, false);
      document.body.addEventListener("mousedown", this.onMouseDown, false);
    } else {
      document.removeEventListener("mousemove", this.onMouseMoved, false);
      document.body.addEventListener("mousedown", this.onMouseDown, false);
    }
  };

  return Cursor;

})();

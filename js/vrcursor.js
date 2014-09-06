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

  evt(Cursor.prototype);

  function Cursor(el, beforeEl) {
    var onPointerLockChanged = this.onPointerLockChanged.bind(this);
    var onMouseMoved = this.updateCursorCoordinates.bind(this);
    this.el = el;
    this.elWidth = el.clientWidth;
    this.elHeight = el.clientHeight;
    this.cursor = {
      x: 0,
      y: 0
    };
    this.hitEls = [];
    this.cursorEl = this.createCursor();
    this.el.appendChild(this.cursorEl);

    // Binds event listeners
    document.addEventListener('mozpointerlockchange', onPointerLockChanged, false);
  };

  Cursor.prototype.createCursor = function() {
    var cursorEl = document.createElement('div');
    cursorEl.id = 'cursor';
    cursorEl.style.backgroundColor = 'transparent';
    cursorEl.style.width = '50px';
    cursorEl.style.height = '50px';
    cursorEl.style.border = '3px solid red';
    cursorEl.style.borderRadius = '50%';
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
    this.hitEls.push(el);
  };

  Cursor.prototype.hits = function() {
    var hits = [];
    var self = this;
    this.hitEls.forEach(function(el){
      if(self.hit(el)) {
        hits.push(el);
      }
    });
    if (hits.length !== 0) {
      this.emit('hit', hits);
    }
    return hits;
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

  Cursor.prototype.updateCursorCoordinates = function() {
    var movementX = e.mozMovementX || 0;
    var movementY = e.movementY || 0;
    var elHalfWidth = this.elWidth / 2;
    var elHalfHeight = this.elHeight / 2;
    var minX = -elHalfWidth;
    var maxX = elHalfWidth;
    var minY = -elHalfHeight;
    var maxY = elHalfHeight;
    var x;
    var y;
    var paddding = 300;
    x += movementX;
    y += movementY;

    this.cursor = {
      x: clamp(x, minX + padding, maxX - padding),
      y: clamp(y, minY + padding, maxY - padding)
    };
  };

  Cursor.prototype.updateOrientation = function(orientationMatrix) {
    // var cursorEl = this.cursorEl;
    // var x = this.cursor.x;
    // var y = this.cursor.y;
    // var positionTransform = 'rotateY(0) rotateX(0) translate3d(0, 0, 500px) translate(' + -x + 'px, ' + y + 'px)';
    // cursorEl.style.transform = orientationMatrix + ' ' + positionTransform;
  }

  Cursor.prototype.onPointerLockChanged = function() {
    var el = this.el;
    if(document.mozPointerLockElement === el) {
      document.addEventListener("mousemove", this.onMouseMoved, false);
    } else {
      document.removeEventListener("mousemove", this.onMouseMoved, false);
    }
  };

  return Cursor;

})();

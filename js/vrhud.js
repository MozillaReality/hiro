var Tile = function (name, url, cords) {
  var self = this;

  self.name = name;
  self.url = url;
  self.cords = cords;
  self.gridEl = createGridTile();
  self.titleEl = createTitle();

  function createTitle() {
    var div = document.createElement('div');
    return div;
  }

  function createGridTile() {
    var div = document.createElement('div');
    var label = null;

    // create a link for label if present
    if (self.url !== undefined) {
      label = document.createElement('a');
      label.href = self.url;
      label.appendChild(document.createTextNode(self.name));
    } else {
      label = document.createTextNode(self.name);
    }

    div.appendChild(label);
    div.classList.add('fav','threed');
    div.addEventListener('click', function(e) {
      if (VRManager.hudRunning) {
        Hud.load(self);
      }
    });

    VRManager.cursor.addHitElement(div);
    return div;
  }
  return self;
};


// requires Velocity
var Grid = function (opts) {
  var self = this;
  self.opts = opts;
  self.tiles = [];
  self.cols = self.rows = 0;                // max grid extents
  self.container = opts.container;          // container where this grid will be injected into.
  self.el = document.createElement('div');  // element for grid contents
  return self;
};

// add nested content
Grid.prototype.addTile = function (tile) {
  // size extents of grid
  if (tile.cords.x + tile.cords.w > this.cols) {
    this.cols = tile.cords.x + tile.cords.w;
  }

  if (tile.cords.y + tile.cords.h > this.rows) {
    this.rows = tile.cords.y + tile.cords.h;
  }

  this.tiles.push(tile);
};

// render grid out to DOM
Grid.prototype.render = function () {
  var self = this;
  var opts  = self.opts, tiles = self.tiles;
  var rotPerTile = self.rotPerTile = Math.sin((opts.tileWidth + opts.tileGutter) / opts.radius) * (180 / Math.PI);
  var i, tile;

  function addToContainer(tile) {
    var col = tile.cords.x,
      row = tile.cords.y;

    // calculate correct positioning of tile
    var rotOffset = (rotPerTile * self.cols) / 2,
      transYOffset = (self.rows * opts.tileHeight) / 2,
      rotY = (col * rotPerTile - rotOffset) * -1,
      transY = (row * (opts.tileHeight + opts.tileGutter) - transYOffset),
      transZ = opts.radius * -1;

    // add those to tile object
    tile.cords.rotateY = rotY + 'deg';
    tile.cords.translateY = transY + 'rem';
    tile.cords.translateZ = transZ + 'rem';

    // use velocity hook to place element
    Velocity.hook(tile.gridEl, 'rotateY', tile.cords.rotateY);
    Velocity.hook(tile.gridEl, 'translateY', tile.cords.translateY);
    Velocity.hook(tile.gridEl, 'translateZ', tile.cords.translateZ);

    // set element dimensions
    tile.gridEl.style.width = (tile.cords.w * opts.tileWidth) + ((tile.cords.w - 1) * opts.tileGutter) + 'rem';
    tile.gridEl.style.height = (tile.cords.h * opts.tileHeight) + ((tile.cords.h - 1) * opts.tileGutter) + 'rem';

    self.container.appendChild(tile.gridEl);
  }

  for (i = 0; i < tiles.length; i++) {
    tile = tiles[i];
    addToContainer(tile);
  }
};

// requires VRManager, Grid, Velocity
window.Hud = (function() {
  var self = this;

  function Hud() {
    var self = this;
    self.currentSelection = null;
    self.transitioning = false;
    self.grid = null;

    // create new main HUD grid
    var hudGrid = new Grid({
      tileWidth: 3.5,           //  tile width and height.
      tileHeight: 3.5,
      radius: 30,               //  how far out to place the HUD from user.
      tileGutter: 0.10,         //  space between tiles.
      tileTransitionDepth: 5,    //  relative depth of tile when highlighted or selected.
      container: document.getElementById('grid')
    });

    self.grid = hudGrid;

    hudGrid.addTile(
      new Tile('Three.js cubes', './content/cubes/index.html', { x: 0, y: 0, w: 2, h: 2 })
    );
    hudGrid.addTile(
      new Tile('Theater demo', './content/theater/theater.html', { x: 2, y: 0, w: 2, h: 2 })
    );
    hudGrid.addTile(
      new Tile('Skybox', './content/skybox/index.html', { x: 4, y: 0, w: 2, h: 2 })
    );
    hudGrid.addTile(
      new Tile('Planetarium', './content/planetarium/index.html', { x: 4, y: 2, w: 2, h: 2 })
    );
    hudGrid.addTile(
      new Tile('Sechelt', './content/sechelt/index.html', { x: 6, y: 2, w: 2, h: 2 })
    );
    hudGrid.addTile(
      new Tile('Interstitial', './Interstitial/spatial/index.html', { x: 0, y: 3, w: 1, h: 1 })
    );

    hudGrid.render();
  }

  Hud.prototype.load = function(tile) {
    if (this.currentSelection) {
      this.currentSelection.gridEl.classList.remove('fav-selected');
    }

    this.currentSelection = tile;
    tile.gridEl.classList.add('fav-selected');

    if (tile.url) {
      this.animationOut().then(function() {
        VRManager.stopHud();
        VRManager.transition.fadeOut(VRManager.renderFadeOut)
          .then( VRManager.load(tile.url) );
      }, function(err) {
        console.log(err);
      });
    }
  };

  Hud.prototype.animationOut = function() {
    var self = this;
    var i, count = 0;
    var el, transZ, shuffledTiles;
    var p = new Promise(function(resolve, reject) {
      if (self.transitioning) {
        reject('Already a transition in progress.');
      } else {
        self.transitioning = true;
      }

      shuffledTiles = shuffle(self.grid.tiles);
      for (i = 0; i < shuffledTiles.length; i++) {
        el = shuffledTiles[i].gridEl;
        transZ = [(self.grid.opts.radius + self.grid.opts.tileTransitionDepth) * -1 + 'rem',
          self.grid.opts.radius * -1 + 'rem'];
        Velocity(el, { scaleX: 0, scaleY: 0, translateZ: transZ },
          { easing: 'easeInQuad', duration: 1000, delay: i * 20 })
          .then( function() {
            count++;
            if (count == shuffledTiles.length) {
              self.transitioning = false;
              resolve();
            }
          });        
      }
    });
    return p;
  };

  Hud.prototype.animationIn = function() {
    var self = this;
    var i, count = 0;
    var el, transZ, shuffledTiles;
    var p = new Promise(function(resolve, reject) {
      if (self.transitioning) {
        reject('Already a transition in progress.');
      } else {
        self.transitioning = true;
      }

      shuffledTiles = shuffle(self.grid.tiles);
      for (i = 0; i < shuffledTiles.length; i++) {
        el = shuffledTiles[i].gridEl;
        transZ = [self.grid.opts.radius * -1 + 'rem',
          (self.grid.opts.radius + self.grid.opts.tileTransitionDepth) * -1 + 'rem']
        Velocity(el, { scaleX: 1, scaleY: 1, translateZ: transZ },
          { easing: 'easeOutCubic', duration: 200 + (i * 40), delay: i * 10, })
          .then( function() {
            count++;
            if (count == shuffledTiles.length) {
              self.transitioning = false;
              resolve();
            }
          });
        }
    });
    return p;
  };

  Hud.prototype.animationTitle = function(tile) {
    var self = this;
    var clone, toX, toY, toRotY;
    var p = new Promise(function(resolve, reject) {
      // clone tile for animating, original tile is kept in tact and animated out of site by animateOut.
      clone = tile.gridEl.cloneNode(true);
      tile.gridEl.parentNode.appendChild(clone);

      toX = (tile.cords.w * self.grid.opts.tileWidth) / 2 * -1 + 'rem';
      toY = (tile.cords.h * self.grid.opts.tileHeight) / 2 * -1 + 'rem';
      toRotY = (tile.cords.w * self.grid.rotPerTile) / 2 + 'deg';

      Velocity(clone, {
        translateY: [toY, tile.cords.translateY],
        rotateY: [toRotY, tile.cords.rotateY],
        translateZ: [tile.cords.translateZ, tile.cords.translateZ]
        },{ duration: 3000 })
          .then( function() {
            clone.parentNode.removeChild(clone);
            resolve();
          });
    });
    return p;
  };

  Hud.prototype.toggle = function() {
    var self = this;
    if (self.transitioning) {
      return false;
    }

    if (VRManager.hudRunning) {
      self.animationOut().then( function() {
        VRManager.stopHud();
      });
    } else {
      VRManager.startHud();
      self.animationIn();
    }
  };

  Hud.prototype.highlight = function(el, highlight) {
    if (highlight) {
      el.classList.add('fav-highlighted');
    } else {
      el.classList.remove('fav-highlighted');
    }
  };

  Hud.prototype.changeSelection = function(el) {
    if (this.currentSelection) {
      this.currentSelection.classList.remove('fav-selected');
    }
    this.currentSelection = el;
    el.classList.add('fav-selected');
  };

  return new Hud();
})();

// shuffle array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex ;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

var Tile = function (name, url, cords, siteInfo) {
  var self = this;

  self.name = name;
  self.url = url;
  self.cords = cords;
  self.gridEl = createGridTile();
  self.titleEl = createTitle();
  self.siteInfo = siteInfo;

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
      if (VRHud.running) {
        VRHud.load(self);
      }
    });

    VRManager.cursor.addHitElement(div);
    return div;
  }

  self.getSiteInfo = function() {
    var info = { 
      '.title': this.name,
      '.url': this.url
    }
    for (var key in self.siteInfo) {
      info[key] = self.siteInfo[key];
    }
    return info;
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
  self.underlay = null;
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
    Velocity.hook(tile.gridEl, 'scaleX', 0);
    Velocity.hook(tile.gridEl, 'scaleY', 0);

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


window.VRHud = (function() {
  function VRHud() {
    var self = this;
    self.container = VRManager.hud;
    self.running = false;
    self.currentSelection = null;
    self.transitioning = false; // true if animation is running

    self.grid = new Grid({
      units: 'rem', // units to use for grid
      tileWidth: 3.5, //  tile width and height.
      tileHeight: 3.5,
      tileGutter: 0.10, //  space between tiles.
      tileTransitionDepth: 5, //  relative depth of tile when highlighted or selected.
      radius: 30, //  how far out to place the HUD from user.
      container: self.container.querySelector('#grid')
    });

    self.grid.addTile(
      new Tile('Three.js cubes', './content/cubes/index.html', { x: 0, y: 0, w: 2, h: 2 }, { '.author': 'Mr Cube', '.tech': 'three.js, tween.js'})
    );
    self.grid.addTile(
      new Tile('Theater demo', './content/theater/theater.html', { x: 2, y: 0, w: 2, h: 2 }, { '.author': 'Potch', '.tech': 'VR Dom'})
    );
    self.grid.addTile(
      new Tile('Skybox', './content/skybox/index.html', { x: 4, y: 0, w: 2, h: 2 }, { '.author': 'Casey', '.tech': 'VR Dom'})
    );
    self.grid.addTile(
      new Tile('Planetarium', './content/planetarium/index.html', { x: 4, y: 2, w: 2, h: 2 }, { '.author': 'Diego Marcos', '.tech': 'VR Dom'})
    );
    self.grid.addTile(
      new Tile('Sechelt', './content/sechelt/index.html', { x: 6, y: 2, w: 2, h: 2 }, { '.author': 'Mr Doob', '.tech': 'three.js, tween.js'})
    );
    self.grid.addTile(
      new Tile('Interstitial', './Interstitial/spatial/index.html', { x: 0, y: 3, w: 1, h: 1 }, { '.author': 'Josh Carpenter', '.tech': 'Cinema 4D, VR Dom'})
    );
    self.grid.addTile(
      new Tile('Startup', './content/startup/index.html', { x: 1, y: 3, w: 1, h: 1 }, { '.author': 'Josh Carpenter', '.tech': 'Three.js, tween.js'})
    );
    
    self.grid.render();

    return self;
  };

  VRHud.prototype.start = function() {
    if (this.transitioning) {
      return false;
    };

    if (!this.running) {
      this.container.style.display = 'block';
      this.animationIn();
      VRManager.cursor.enable();
      this.running = true;
    }

    var currentDemo = VRManager.currentDemo;
    if (currentDemo) { currentDemo.sendMessage('disablecursor'); }
  };

  VRHud.prototype.stop = function() {
    var self = this;
    if (self.transitioning) {
      return false;
    }
    if (self.running) {
      self.animationOut().then( function() {
        self.container.style.display = 'none';
      });
      VRManager.cursor.disable();
      var currentDemo = VRManager.currentDemo;
      if (currentDemo) { currentDemo.sendMessage('enablecursor'); }
    }
    self.running = false;
  };

  VRHud.prototype.toggle = function() {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  };

  VRHud.prototype.load = function(tile) {
    var self = this;
    if (self.currentSelection) {
      self.currentSelection.gridEl.classList.remove('fav-selected');
    }

    self.currentSelection = tile;
    tile.gridEl.classList.add('fav-selected');

    if (!tile.url) {
      return false;
    }

    self.animationOut()
      .then( function() {
        self.stop();
        VRManager.load(tile.url, {
          showTitle: true,
          siteInfo: tile.getSiteInfo()
        });
    });
  }

  VRHud.prototype.changeSelection = function(el) {
    if (this.currentSelection) {
      this.currentSelection.classList.remove('fav-selected');
    }
    this.currentSelection = el;
    el.classList.add('fav-selected');
  };


  VRHud.prototype.underlayIn = function() {
    var underlay = document.createElement('div');
    underlay.id = 'underlay';

    var numPanels = 35;
    var rotPerPanel = 360 / numPanels;
    var radius = this.grid.opts.radius + 5;
    var i, div;
    
    for ( i = 0; i < numPanels; i++ ) {
      div = document.createElement('div');
      
      var rotY = i * rotPerPanel + 'deg';
      var transZ = radius * -1 + 'rem';
      var transY = (this.grid.rows + 1) * this.grid.opts.tileHeight / 2 * -1 + 'rem';
      var height = (this.grid.rows + 1) * this.grid.opts.tileHeight + 'rem';
      var width = (radius * Math.tan(rotPerPanel * Math.PI/180))-0.06 + 'rem';  // micro adjust gap between panels.
      
      div.style.width = width;
      div.style.height = height;
      div.style.transform = 'translateZ(' + transZ + ') rotateY(' + rotY + ')';
      div.classList.add('threed', 'underlay');

      Velocity.hook(div, 'rotateY', rotY);
      Velocity.hook(div, 'translateY', transY);
      Velocity.hook(div, 'translateZ', transZ);

      underlay.appendChild(div);
    }
    this.grid.container.appendChild(underlay);
  };

  VRHud.prototype.underlayOut = function() {
    var myNode = document.getElementById("underlay");
    if (!myNode)
      return false;

    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
    myNode.parentNode.removeChild(myNode);
  };

  VRHud.prototype.animationIn = function() {
    var self = this;
    var i, count = 0;
    var el, transZ, shuffledTiles;
    
    return new Promise(function(resolve, reject) {
      if (self.transitioning) {
        reject('Already a transition in progress.');
      } else {
        self.transitioning = true;
      }
      
      self.underlayIn();

      // shuffle tiles so we get randomized transition in.
      shuffledTiles = shuffle(self.grid.tiles);

      for (i = 0; i < shuffledTiles.length; i++) {
        el = shuffledTiles[i].gridEl;
        transZ = [self.grid.opts.radius * -1 + 'rem',
          (self.grid.opts.radius + self.grid.opts.tileTransitionDepth) * -1 + 'rem']
        
        Velocity(el, { scaleX: [1, 0], scaleY: [1, 0], translateZ: transZ },
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
  };

  VRHud.prototype.animationOut = function() {
    var self = this;
    var i, count = 0;
    var el, transZ, shuffledTiles;
    return new Promise(function(resolve, reject) {
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
              self.underlayOut();
            }
          });        
      }
    });
  };

  return new VRHud();
})();


// Hud.prototype.highlight = function(el, highlight) {
//   if (highlight) {
//     el.classList.add('fav-highlighted');
//   } else {
//     el.classList.remove('fav-highlighted');
//   }
// };

// Hud.prototype.animationTitle = function(tile) {
//   var self = this;
//   var clone, toX, toY, toRotY;
//   var p = new Promise(function(resolve, reject) {
//     // clone tile for animating, original tile is kept in tact and animated out of site by animateOut.
//     clone = tile.gridEl.cloneNode(true);
//     tile.gridEl.parentNode.appendChild(clone);

//     toX = (tile.cords.w * self.grid.opts.tileWidth) / 2 * -1 + 'rem';
//     toY = (tile.cords.h * self.grid.opts.tileHeight) / 2 * -1 + 'rem';
//     toRotY = (tile.cords.w * self.grid.rotPerTile) / 2 + 'deg';

//     Velocity(clone, {
//       translateY: [toY, tile.cords.translateY],
//       rotateY: [toRotY, tile.cords.rotateY],
//       translateZ: [tile.cords.translateZ, tile.cords.translateZ]
//       },{ duration: 3000 })
//         .then( function() {
//           clone.parentNode.removeChild(clone);
//           resolve();
//         });
//   });
//   return p;
// };

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

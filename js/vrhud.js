// requires Velocity
var Grid = function(opts) {
  var self = this;
  self.opts = opts || (opts = {});
  self.el = document.createElement('div');
  self.tiles = [];
  self.cols = self.rows = 0;
  return self;
};

// add nested content
Grid.prototype.addTile = function(tile) {
  if (tile.x > this.cols) this.cols = tile.x;
  if (tile.y > this.rows) this.rows = tile.y;
  this.tiles.push(tile);
};

Grid.prototype.render = function(container) {
  var self = this;
  var opts  = self.opts;
  var tiles = self.tiles;
  var rotPerTile = Math.sin((opts.tileWidth+opts.tileGutter)/opts.radius) * (180/Math.PI);

  for (var i = 0; i < tiles.length; i++) {
    var tile = tiles[i];
    var col = tile.x,
      row = tile.y;
    var rotOffset = (rotPerTile*(self.cols+1))/2,
      transYOffset = (self.rows+1)*opts.tileHeight/2,
      rotY = (col * rotPerTile - rotOffset)*-1,
      transY = (row * (opts.tileHeight+opts.tileGutter) - transYOffset);

    // use velocity hook to place element
    Velocity.hook(tile.el, 'rotateY', rotY+'deg');
    Velocity.hook(tile.el, 'translateX', '0rem');
    Velocity.hook(tile.el, 'translateY', transY+'rem');
    Velocity.hook(tile.el, 'translateZ', opts.radius*-1+'rem');
    tile.el.style.width = (tile.w*opts.tileWidth)+((tile.w-1)*opts.tileGutter)+'rem';
    tile.el.style.height = (tile.h*opts.tileHeight)+((tile.h-1)*opts.tileGutter)+'rem';

    container.appendChild(tile.el);
  }
  return container;
};

// requires VRManager, Grid, Velocity
window.Hud = (function() {
  var self = this;

  function Hud() {
    var self = this;
    self.currentSelection = null;
    self.transitioning = false;
    self.grid = null;

    function createFavorite(name, url) {
      var div = document.createElement('div');
      var label = null;
      if (url != undefined) {
        label = document.createElement('a');
        label.href = url;
        label.appendChild(document.createTextNode(name));
      } else {
        label = document.createTextNode(name);
      }
      div.appendChild(label);

      div.addEventListener('mouseover', function(e) {
        self.highlight(e.target, true);
      });
      div.addEventListener('mouseout', function(e) {
        self.highlight(e.target, false);
      });
      div.addEventListener('click', function(e) {
        var el = e.target;
        var url = el.querySelector('a').href;
        self.changeSelection(el);
        if (url)
          VRManager.load(url);
          setTimeout(self.toggle(), 1000);
      });

      VRManager.cursor.addHitElement(div);

      div.classList.add('fav','threed');
      return div;
    }

    // create new main HUD grid
    var hudGrid = new Grid({
      tileWidth: 3.5,           //  tile width and height.
      tileHeight: 3.5,
      radius: 30,               //  how far out to place the HUD from user.
      tileGutter: 0.10,         //  space between tiles.
      tileTransitionDepth: 5    //  relative depth of tile when highlighted or selected.
    });

    self.grid = hudGrid;

    // widgets left
    hudGrid.addTile({
      el: createFavorite('Widget 1'), x: 0, y: 1, w: 2, h: 2
    });

    hudGrid.addTile({
      el: createFavorite('Widget 2'), x: 2, y: 1, w: 2, h: 2
    });

    hudGrid.addTile({
      el: createFavorite('Widget 3'), x: 4, y: 1, w: 2, h: 1
    });

    hudGrid.addTile({
      el: createFavorite('Widget 4'), x: 4, y: 2, w: 2, h: 1
    });

    hudGrid.addTile({
      el: createFavorite('Widget 5'), x: 4, y: 3, w: 2, h: 1
    });

    // fav row 1
    hudGrid.addTile({
      el: createFavorite('Three.js cubes', './content/cubes/index.html'), x: 7, y: 0, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('VR DOM Skybox', './content/skybox/index.html'), x: 8, y: 0, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('VR DOM Theatre', './content/theater/theater.html'), x: 10, y: 0, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('VR Planetarium', './content/planetarium/index.html'), x: 11, y: 0, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('Favorite'), x: 12, y: 0, w: 1, h: 1
    });

    // fav row 2
    for (var i = 7; i < 12; i++) {
      hudGrid.addTile({
        el: createFavorite('Favorite'), x: i, y: 1, w: 1, h: 1
      });
    }

    // fav row 3
    for (var i = 7; i < 13; i++) {
      hudGrid.addTile({
        el: createFavorite('Favorite'), x: i, y: 2, w: 1, h: 1
      });
    }

    // fav row 4
    hudGrid.addTile({
      el: createFavorite('Favorite'), x: 8, y: 3, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('Favorite'), x: 9, y: 3, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('Favorite'), x: 11, y: 3, w: 1, h: 1
    });
    hudGrid.addTile({
      el: createFavorite('Favorite'), x: 12, y: 3, w: 1, h: 1
    });

    // widgets right
    hudGrid.addTile({
      el: createFavorite('Widget'), x: 14, y: 1, w: 2, h: 2
    });
    hudGrid.addTile({
      el: createFavorite('Widget'), x: 16, y: 1, w: 2, h: 2
    });

    hudGrid.render(document.querySelector('#grid'));
  };


  Hud.prototype.animationOut = function() {
    var self = this;
    var p = new Promise(function(resolve, reject) {
      if (self.transitioning) {
        reject('Already a transition in progress.');
      } else {
        self.transitioning = true;
      }
      var shuffledTiles = shuffle(self.grid.tiles);
      var count = 0;
      for (var i = 0; i < shuffledTiles.length; i++) {
        var el = shuffledTiles[i].el;
        Velocity(el, {
            scaleX: 0, scaleY: 0,
            translateZ: [(self.grid.opts.radius+self.grid.opts.tileTransitionDepth)*-1+'rem', self.grid.opts.radius*-1+'rem']
          },{
            easing: 'easeInQuad', duration: 1000, delay: i*20
          }).then(function() {
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
    var p = new Promise(function(resolve, reject) {
    if (self.transitioning) {
      reject('Already a transition in progress.');
    } else {
      self.transitioning = true;
    }
    var shuffledTiles = shuffle(self.grid.tiles);
    var count = 0;
    for (var i = 0; i < shuffledTiles.length; i++) {
      var el = shuffledTiles[i].el;
      Velocity(el, {
          scaleX: 1, scaleY: 1,
          translateZ: [self.grid.opts.radius*-1+'rem', (self.grid.opts.radius+self.grid.opts.tileTransitionDepth)*-1+'rem']
        },{
          easing: 'easeOutCubic', duration: 200+(i*40), delay: i*10,
        }).then(function() {
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

  Hud.prototype.toggle = function() {
    var self = this;
    if (self.transitioning)
      return false;

    if (VRManager.hudRunning) {
      self.animationOut().then(function() {
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
  }

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

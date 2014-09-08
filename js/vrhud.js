// requires VRManager

window.Hud = (function() {
  var self = this;
  var favorites = [{
      name: 'Three.js cubes',
      url: './content/cubes/index.html'
    },
    {
      name: 'VR DOM Skybox',
      url: './content/skybox/index.html'
    },
    {
      name: 'VR DOM Theatre',
      url: './content/theater/theater.html'
    },
    {
      name: 'VR Planetarium',
      url: './content/planetarium/index.html'
    }
    ];

  var panelWidth = 5.2; // all in rems
  var hudRadius = 20;   // rems

  function Hud() {
    var self = this;
    self.currentSelection = 0;

    self.loadFavorites(favorites, document.getElementById('favorites'));
  };

  Hud.prototype.loadFavorites = function(favorites, container) {
    var self = this;

    // find out angle that each favorite given width will ocupy
    var rotPerPanel = Math.sin(panelWidth/hudRadius) * (180/Math.PI);
    var offsetLayout = rotPerPanel*(favorites.length/2);  // offset all panels so that the layout is centered to user.

    for (var i = 0; i < favorites.length; i++) {
      var div = document.createElement('div');
      var rotY = (i * rotPerPanel);

      div.setAttribute('id', i);
      div.style.transform = 'rotateY('+ (offsetLayout-rotY) +'deg) translate3D(0,0,'+hudRadius*-1+'rem)';
      div.appendChild(document.createTextNode(favorites[i].name));
      div.addEventListener('mouseover', function(e) {
        self.highlight(e.target, true);
      });
      div.addEventListener('mouseout', function(e) {
        self.highlight(e.target, false);
      });
      div.addEventListener('click', function(e) {
        self.changeSelection(e.target.id);
      });
      div.classList.add('fav','threed');
      favorites[i].el = div;
      container.appendChild(div);
      VRManager.cursor.addHitElement(div);

    }
    self.favorites = favorites;
    self.changeSelection(0);
  };

  Hud.prototype.toggle = function() {
    var self = this;
    if (VRManager.hudRunning) {
      VRManager.stopHud();
      var f = favorites[self.currentSelection];
      if (f.url !== undefined) {
        VRManager.load(f.url);
      }
    } else {
      VRManager.startHud();
    }
  };

  Hud.prototype.cursorLeft = function() {
    var self = this;
    if (self.currentSelection-1 > -1) {
      self.changeSelection(self.currentSelection-1);
    }
  };

  Hud.prototype.cursorRight = function() {
    var self = this;
    if (self.currentSelection+1 < favorites.length) {
      self.changeSelection(self.currentSelection+1);
    }
  };

  Hud.prototype.highlight = function(el, highlight) {
    if (highlight) {
      el.classList.add('fav-highlighted');
    } else {
      el.classList.remove('fav-highlighted');
    }
  };

  Hud.prototype.changeSelection = function(id) {
    console.log('changeselection', id);
    var self = this;

    favorites[self.currentSelection].el.classList.remove('fav-selected');

    favorites[id].el.classList.add('fav-selected');

    self.currentSelection = id;
  }

  return new Hud();
})();

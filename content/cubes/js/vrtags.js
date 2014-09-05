(function () {

  var attr = {
    coords: function (name, propName) {
      return function (oldVal, newVal) {
        var obj = newVal.split(/[\s,]+/);
        obj.x = parseInt(obj[0], 10);
        obj.y = parseInt(obj[1], 10);
        obj.z = parseInt(obj[2], 10);
        if (isNaN(obj.x) || isNaN(obj.y) || isNaN(obj.z)) {
          return;
        }
        this[name || propName] = obj;
      };
    },
    number: function (name, propName) {
      return function (oldVal, newVal) {
        var val = parseInt(newVal, 10);
        if (isNaN(val)) {
          return;
        }
        this[name || propName] = val;
      };
    }
  };


  var VRSceneProto = Object.create(HTMLElement.prototype);

  VRSceneProto.createdCallback = function () {
    var self = this;
    self.scene = new THREE.Scene();
  };

  VRSceneProto.attachedCallback = function () {
    var children = this.children;
    for (var i = 0; i < children.length; i++) {
      if ('mesh' in children[i]) {
        console.log(this.children[i]);
        this.scene.add(children[i].mesh);
      }
    }
  };

  VRSceneProto.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };


  var attrs = {
    'width': attr.number('width'),
    'height': attr.number('height')
  };

  window.VRScene = document.registerElement('vr-scene', {
    prototype: VRSceneProto
  });

  (function () {

    var VRCubeProto = Object.create(HTMLElement.prototype);

    // Lifecycle methods
    VRCubeProto.createdCallback = function () {

    };

    VRCubeProto.attachedCallback = function () {
      var size = this.size || 1;
      this.geometry = new THREE.BoxGeometry( size, size, size );
      this.material = new THREE.MeshBasicMaterial( {color: 0xAAAAAA} );
      this.mesh = new THREE.Mesh( this.geometry, this.material );
    };

    VRCubeProto.detachedCallback = function () {
    };

    VRCubeProto.attributeChangedCallback = function (attr, oldVal, newVal) {
      if (attr in attrs) {
        attrs[attr].call(this, oldVal, newVal);
      }
    };

    // Attribute handlers
    var attrs = {
      'position': attr.coords('position'),
      'size': attr.number('size')
    };

    // Property handlers
    Object.defineProperties(VRCubeProto, {
      'prop': {
        get : function () {
        },
        set : function (newVal) {
        }
      }
    });

    // Register the element
    window.VRCube = document.registerElement('vr-cube', {
      prototype: VRCubeProto
    });

  })();

})();

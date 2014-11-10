(function() {

  window.HandArrow = function(parent) {
    this.followRadius = 0.08;
    this.parent = parent;
    this.mesh = undefined;

    new THREE.ObjectLoader().load("meshes/MozillaVR-3D-arrow-01.json", function(mesh) {
      this.mesh = mesh;
      this.mesh.position.set(0,0,-0.2);
      this.mesh.material = new THREE.MeshPhongMaterial( { color: 0x00FF00, shading: THREE.SmoothShading } );
      this.mesh.scale.set(0.03,0.03,0.03);
      this.mesh.visible = false;
      //this.mesh.visible = false;
      this.parent.add(this.mesh);
    }.bind(this));
  };

  window.HandArrow.prototype = {
    update: function(toFollow, toPointTo) {

      var follow = (new THREE.Vector3).fromArray(toFollow);

      var pointTo = (new THREE.Vector3).fromArray(toPointTo);

      if ( this.mesh !== undefined ) {
        var diff = new THREE.Vector3().copy(pointTo).sub(follow);

        var direction = new THREE.Vector3().copy(diff).normalize();
        this.mesh.position.copy(new  THREE.Vector3().copy(follow).add(new THREE.Vector3().copy(direction).multiplyScalar(this.followRadius)));
        this.mesh.lookAt(pointTo);
        this.mesh.rotateOnAxis (new THREE.Vector3(1,0,0), -Math.PI/2.0);
        this.mesh.rotateOnAxis (new THREE.Vector3(0,1,0), Math.PI/2.0);
      }

    }
  };
}).call(this);
// Helps plot arrows in 3d on a scene
// API
// Arrows.scene = myScene;
// Arrows.show(p1, p2);
// Arrows.show(p1, p3)'
// Arrows.update();
// usage of the `new` keyword is not necessary.
//
// This class handles:
// - Adding or removing ArrowHelpers from the scene
// - Styling
// - Positioning

(function() {

var makeVector3 = function(p){

  if (p instanceof THREE.Vector3){
    return p;
  } else {
    return (new THREE.Vector3).fromArray(p)
  }

}

window.Arrows = {
  arrows: [],

  arrowRequests: [],

  scene: null,

  // Accepts either THREE.Vector3s or GLMatrix vec3s
  show: function(p1, p2){
    this.arrowRequests.push([
      makeVector3(p1),
      makeVector3(p2)
    ])
  },

  // Can this automatically be called in a pre update hook by the renderer?
  update: function(){
    var arrow, arrowRequest,
      direction = new THREE.Vector3;

    for (var i = 0; i < this.arrowRequests.length; i++){

      arrow = this.arrows[i];
      arrowRequest = this.arrowRequests[i];

      // init
      if ( !arrow ){
        arrow = new THREE.ArrowHelper(
          new THREE.Vector3,
          new THREE.Vector3,
          1,
          0xff0000
        );
        this.arrows.push(arrow);
        this.scene.add(arrow);
      }

      arrow.cone.visible = true;
      arrow.line.visible = true;

      // position
      arrow.position.copy(arrowRequest[0]);

      // There's no ArrowHelper.setTarget (but there should be?)
      direction.subVectors(arrowRequest[1], arrowRequest[0]);
      arrow.setLength( direction.length() );

      arrow.setDirection(
        direction.normalize()
      );

    }

    for (; i < this.arrows.length; i++){
      arrow = this.arrows[i];

      arrow.cone.visible = false;
      arrow.line.visible = false;

    }

    this.arrowRequests = [];
  }
}

}).call(this);
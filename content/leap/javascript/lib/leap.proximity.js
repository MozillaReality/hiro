// Accepts a point in 3d space and a radius length

Leap.plugin('proximity', function(scope){

  var proximities = [];

  var makeVector3 = function(p){
    if (p instanceof THREE.Vector3){
      return p;
    } else {
      return (new THREE.Vector3).fromArray(p)
    }
  };

  // accepts one option: mode
  // mode: 'points', the default, will be "in" when any of the points are within the mesh.
  //   Expects points to be vec3s from the origin.
  // mode:

  var Proximity = function(mesh, handPoints, options){
    options || (options = {});
    this.options = options;

    this.mesh = mesh;
    this.handPoints = handPoints;
    this.inCallbacks  = [];
    this.outCallbacks = [];

    // These are both keyed by the string: hand.id + handPointIndex
    this.states = {};
    this.intersectionPoints = {}; // checkLines: one for each handPoint.  Position in world space.
    this.distances = {}; // checkPoints: one for each handPoint
    this.lengths = {}; // checkPoints: one for each handPoint
  };

  Proximity.prototype = {

    intersectionCount: function() {
      var intersectionCount = 0, key;

      for ( key in this.intersectionPoints ){
        if( this.intersectionPoints.hasOwnProperty(key) ){
          intersectionCount++;
        }
      }

      return intersectionCount;
    },

    // unlike "over" events, we emit when "in" an object.
    in: function(callback){
      this.inCallbacks.push(callback);
      return this
    },

    out: function(callback){
      this.outCallbacks.push(callback);
      return this
    },

    emit: function(eventName, data1, data2, data3, data4, data5){

      // note: not ie-compatible indexOf:
      if (['in', 'out'].indexOf(eventName) === -1) {
        console.error("Invalid event name:", eventName);
        return
      }

      var callbacks = this[eventName + "Callbacks"];
      for (var i = 0; i < callbacks.length; i++){

        // could use arguments.slice here.
        callbacks[i].call(this, data1, data2, data3, data4, data5);

      }

    },

    check: function(hand){

      // Handles Spheres. Planes. Boxes? other shapes? custom shapes?

      var handPoints = this.handPoints(hand);

      // this class is designed to either checkLines or checkPoints, but not both
      // This should perhaps be split in to two classes, LineProximity and PointProximity.
      if (handPoints[0] instanceof Array){

        this.checkLines(hand, handPoints);

      }else {

        this.checkPoints(hand, handPoints);

      }

    },

    // There is an issue here where handPoints is not indexed per hand
    // check where index is used, refactor. oops.
    // test pictures and resizing.
    checkLines: function(hand, lines){
      var mesh = this.mesh, state, intersectionPoint, key;


      // this could support box as well, if we could decide which face to check.
      if (! ( mesh.geometry instanceof THREE.PlaneGeometry ) ){
        console.error("Unsupported geometry", this.mesh.geometry);
        return
      }

      var worldPosition = (new THREE.Vector3).setFromMatrixPosition( this.mesh.matrixWorld );

      // j because this is inside a loop for every hand
      for (var j = 0; j < lines.length; j++){

        key = hand.id + '-' + j;

        intersectionPoint = mesh.intersectedByLine(lines[j][0], lines[j][1], worldPosition);

        // if there already was an intersection point,
        // And the new one is good in z but off in x and y,
        // don't emit an out event.
        if ( !intersectionPoint && this.intersectionPoints[key] && mesh.intersectionPoint ) {

//          console.log('found newly lost intersection point');
          intersectionPoint = mesh.intersectionPoint

        }

        if (intersectionPoint){

          this.intersectionPoints[key] = intersectionPoint;

        } else if (this.intersectionPoints[key]) {
          delete this.intersectionPoints[key];
        }

        state = intersectionPoint ? 'in' : 'out';

        if ( (state == 'in' && this.states[key] !== 'in') || (state == 'out' && this.states[key] === 'in')){ // this logic prevents initial `out` events.
          this.emit(state, hand, intersectionPoint, key, j); // todo - could include intersection displacement vector here (!)
          this.states[key] = state;
        }

      }

    },

    checkPoints: function(hand, handPoints){
      var mesh = this.mesh, length, state,
        handPoint, meshWorldPosition = new THREE.Vector3,
        distance = new THREE.Vector3, key;

      if (! ( mesh.geometry instanceof THREE.SphereGeometry  ) ){
        console.error("Unsupported geometry", this.mesh.geometry);
        return
      }

      meshWorldPosition.setFromMatrixPosition( mesh.matrixWorld ); // note - this is last frame's position. Should be no problem.
//      console.assert(!isNaN(meshWorldPosition.x));
//      console.assert(!isNaN(meshWorldPosition.y));
//      console.assert(!isNaN(meshWorldPosition.z));

      for (var j = 0; j < handPoints.length; j++){

        key = hand.id + '-' + j;

        handPoint = makeVector3( handPoints[j] );
//        console.assert(!isNaN(handPoint.x));
//        console.assert(!isNaN(handPoint.y));
//        console.assert(!isNaN(handPoint.z));

        // subtract position from handpoint, compare to radius
        // optimization - could square lengths here.
        distance.subVectors(handPoint, meshWorldPosition);
        length = distance.length();
        this.distances[key] = distance;
        this.lengths[key]   = length;

        state = (length < mesh.geometry.parameters.radius) ? 'in' : 'out';

        if (state !== this.states[key]){
          this.emit(state, hand, distance, key, j);
          this.states[key] = state;
        }

      }

    },

    // loop through existing "in" states and emit "out" events.
    clear: function(hand){

      for ( var key in this.states ){
        if( this.states.hasOwnProperty(key) ){

          delete  this.states[key];
          delete  this.intersectionPoints[key];
          delete  this.lengths[key];
          delete  this.distances[key];
          this.emit('out', hand, null, key, parseInt(key.split('-')[1],10) );

        }
      }

    }

  };

  // can be a sphere or a plane.  Here we'll use an invisible sphere first
  // ideally, we would then emit events off of the object
  // Expects a THREE.js mesh
  // and a function which receives a hand and returns an array of points to check against
  // Returns an object which will emit events.
  // the in event is emitted for a handpoint entering the region
  // the out event is emitted for a handpoint exiting the region
  // note: this architecture is brittle to changing numbers of handPoints.
  this.watch = function(mesh, handPoints){
    console.assert(mesh);
    console.assert(handPoints);
    console.assert(typeof handPoints === 'function');

    var proximity = new Proximity(mesh, handPoints);

    proximities.push(proximity);

    return proximity;
  };

  this.on('handLost', function(hand){

    for (var i = 0; i < proximities.length; i++){
      proximities[i].clear(hand);
    }

  });

  // After setting up a proximity to watch, you can watch for events like so:
  // controller
  //   .watch(myMesh, myPointGetterFunction)
  //   .in(function(index, displacement, fraction){
  //
  //   });
  // Where
  //  - index is the index of the point returned by myPointGetterFunction for which we are responding
  //  - displacement is the THREE.Vector3 from hand point to the mesh.  (Testing a new convention - always send arrows out of the hand, as that expresses intention.)
  //  - fraction is distanceToMeshCenter / meshRadius.


  return {

    // we call this on frame explicitly, rather than hand, so that calculations are done before 'frame' and 'hand' events
    // bound to elsewhere in the app.
    frame: function(frame){

      for (var i = 0; i < frame.hands.length; i++){

        for (var j = 0; j < proximities.length; j++){

          proximities[j].check(frame.hands[i]);

        }

      }

    }

  }
});
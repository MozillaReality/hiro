// This is a 3d box, or 2d immersed surface
// This takes in a Leap Controller and is added to a scene, or
// Would be great to use RequireJS, but that's not set up for this project currently.
// This is an experimental class
// it does:
// - Handle resizing
// -  with visual affordances made from DOM
// - Moving
// - Mesh deformations
// - etc?
// there's very nothing in this class which cares if it is a box or a plane.

(function() {


window.InteractablePlane = function(planeMesh, controller, options){
  this.options = options || {};
  this.options.cornerInteractionRadius || (this.options.cornerInteractionRadius = 20);
  this.options.resize !== undefined    || (this.options.resize  = false);
  this.options.moveX  !== undefined    || (this.options.moveX   = true );
  this.options.moveY  !== undefined    || (this.options.moveY   = true );
  this.options.moveZ  !== undefined    || (this.options.moveZ   = false );
  this.options.highlight  !== undefined|| (this.options.highlight = true); // this can be configured through this.highlightMesh

  this.mesh = planeMesh;
  this.controller = controller;
  this.lastPosition = null;

  // set this to false to disable inertia and any hand interactions.
  this.interactable = true;

  // holds the difference (offset) between the intersection point in world space and the local position,
  // at the time of intersection.
  this.intersections = {}; //keyed by the string: hand.id + handPointIndex

  // Maybe should replace these with some meta-programming to do the same.
  this.travelCallbacks  = [];
  this.touchCallbacks  = [];
  this.releaseCallbacks  = [];
  this.touched = false;

  // Usage: pass in an options hash of function(s) keyed x,y,and/or z
  // Functions will be called on every frame when the plane touched, with the new target coordinate in that dimension
  // The return value of the function will replace the coordinate passed in
  // e.g. plane.constrainMovement({y: function(y){ if (y > 0.04) return 0.04; return y; } });
  // Todo - it would be great to have a "bouncy constraint" option, which would act like the scroll limits on OSX
  this.movementConstraints = {};

  // If this is ever increased above one, that initial finger can not be counted when averaging position
  // otherwise, it causes jumpyness.
  this.fingersRequiredForMove = 1;

  this.tempVec3 = new THREE.Vector3;

  this.drag = 1 - 0.12;
  this.density = 1;
  this.mass = this.mesh.geometry.parameters.width * this.mesh.geometry.parameters.height * this.density;

  // Spring constant of a restoring force
  this.returnSpring = null;

  this.lastPosition = new THREE.Vector3;
  this.originalPosition = new THREE.Vector3;
  this.resetPosition();

  // keyed by handId-fingerIndex
  // 1 or -1 to indicate which side of the mesh a finger is "on"
  this.physicalFingerSides = {};


  this.rayCaster = new THREE.Raycaster;
  this.rayCasterDirection = new THREE.Vector3();

  if (this.options.resize){
    this.bindResize();
  }

  this.bindMove();

  if (this.options.highlight) this.bindHighlight();

};

window.InteractablePlane.prototype = {

  resetPosition: function(){

    this.lastPosition.copy(this.mesh.position);
    this.originalPosition.copy(this.mesh.position);

  },

  // todo - gut these in favor of eventEmitter
  emit: function(eventName, data1, data2, data3, data4, data5){

    // note: not ie-compatible indexOf:
    if (['travel', 'touch', 'release'].indexOf(eventName) === -1) {
      console.error("Invalid event name:", eventName);
      return;
    }

    var callbacks = this[eventName + "Callbacks"];
    for (var i = 0; i < callbacks.length; i++){

      // could use arguments.slice here.
      callbacks[i].call(this, data1, data2, data3, data4, data5);

    }

  },

  unbind: function(eventName, callback) {
    var callbacks = this[eventName + "Callbacks"];

    for (var i = 0; i < callbacks.length; i++){

      if (callbacks[i] == callback){

        callbacks.splice(i,1);
        console.log('unbound', callback);
        return true

      }

    }

  },

  // This is analagous to your typical scroll event.
  travel: function(callback){
    this.travelCallbacks.push(callback);
    return this;
  },

  // Toggles highlight on and off
  highlight: function(highlight) {
    if ( highlight !== undefined ) {
      this.highlightMesh.visible = highlight;
    }
    else {
      return this.highlightMesh.visible;
    }
  },

  bindHighlight: function(){

    this.highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.mesh.geometry.parameters.width+0.005, this.mesh.geometry.parameters.height+0.005),
      new THREE.MeshBasicMaterial({
        color: 0x81d41d
      })
    );
    this.mesh.add(this.highlightMesh);
    // todo - this should subtract the normal
    this.highlightMesh.position.set(0,0,-0.0001);
    this.highlightMesh.visible = false;

    this.touch(function(){
      if (!this.interactable) return;

      this.highlight(true);
    }.bind(this));

    this.release(function(){
      this.highlight(false);
    }.bind(this));

  },

  // This is analagous to your typical scroll event.
  touch: function(callback){
    this.touchCallbacks.push(callback);
    return this
  },

  // This is analagous to your typical scroll event.
  release: function(callback){
    this.releaseCallbacks.push(callback);
    return this
  },

  clearMovementConstraints: function(){
    this.movementConstraints = {};
  },

  // todo - handle rotations as well
  changeParent: function(newParent){
    var key;

    // Clean up so no jump
    for (key in this.intersections){
      delete this.intersections[key];
    }

    this.mesh.position.add( this.mesh.parent.position ); // should be the diff between the old and new parent world positions
    this.lastPosition.copy(this.mesh.position);  // reset velocity (!)
    this.originalPosition.copy(this.mesh.position);

    this.mesh.parent.remove(this.mesh);
    newParent.add(this.mesh);

    console.assert(this.mesh.position); // would fail if this is called with no intersections.
  },

  // Returns the position of the mesh intersected
  // If position is passed in, sets it.
  getPosition: function(position){
    var newPosition = position || new THREE.Vector3, intersectionCount = 0;

    for ( var intersectionKey in this.intersections ){
      if( this.intersections.hasOwnProperty(intersectionKey) ){

        intersectionCount++;

        newPosition.add(
          this.moveProximity.intersectionPoints[intersectionKey].clone().sub(
            this.intersections[intersectionKey]
          )
        )

      }
    }

    // todo - experiment with spring physics, like what's seen in beer-pong
    if ( intersectionCount < this.fingersRequiredForMove) {

      newPosition.copy(this.mesh.position);

    } else {

      newPosition.divideScalar(intersectionCount);

    }


    return newPosition;
  },


  // not as good design as proximity - we'll first build in-place raycasting for finger tip z-depth
  // not sure what the final factoring should be.
  getZReposition: function(hands){
    var rayCaster = this.rayCaster;
    var rayCasterDirection = this.rayCasterDirection;
    var hand, finger, key, overlap, fingerTipOffset;
    this.mesh.matrixWorld.needsUpdate = true; // this is a bit of an unnecessary security.

    var averageDistance = 0;
    var overlappingFingers = 0;

    // For storage later.  If spring return movement is more than this, use this as constraint (set to this)
    var averageDistanceRetreated = 0;
    var overlappingFingersRetreated = 0;

    rayCasterDirection.set(0,0,-1).applyMatrix4(this.mesh.matrixWorld).normalize(); // normalize may not be necessary here?

    // todo IIRC, this is pretty important for histeresis
    // Ofcourse, this means that it's not great for high-speed application
    // should revisit.
    fingerTipOffset = rayCasterDirection.clone().setLength(0.01);

    for (var i =0; i < hands.length; i++){
      hand = hands[i];


      // for each finger tip
      // if there's no side yet, ray cast both ways until it gets a side
      // if these is a side, average the distances which have crossed.
      // later, we should apply moments and get rotations.
      // there should be a simpler way of doing this
      // whereby instead of raycasting, we just look to see if the point has cross the plane between this frame and the last.
      // may be more performant as well.
      // or, do like proximity
      // rotate the whole damn thing flat, and then check the x and y of finger points, just like plane intersection
      // that way, we could check more points for less.
      for (var j = 0; j < 5; j++){

        finger = hand.fingers[j];
        key = hand.id + "-" + j;

        rayCaster.set(
          (new THREE.Vector3).fromArray(finger.tipPosition).add( fingerTipOffset ), // 1cm in front of  fingertip
          rayCasterDirection
        );

        if ( this.physicalFingerSides[key] ){
          // hand in front of plane

          // we always multiply the opposite direction, to figure out how much across we are
          rayCaster.ray.direction.multiplyScalar( this.physicalFingerSides[key] * -1 );
          // having some distance between the origin point here prevents low-speed passthrough
          rayCaster.ray.origin.fromArray(finger.tipPosition).add( fingerTipOffset.clone().multiplyScalar(this.physicalFingerSides[key]) );

          overlap = rayCaster.intersectObject(this.mesh)[0];

          // planes only have one intersection
          if (overlap){

            // Might want to replace averageDistance with Max distance..

            overlappingFingers++;
            averageDistance += overlap.distance * this.physicalFingerSides[key] * -1;

          } else {
            // hand behind (or pulled back from) plane

            // presumably there's a bug in raycasting
            // where when the origin point is close enough to the object, it doesn't notice
            // unsure what would cause this, compensating:
            //rayCaster.ray.origin.fromArray(finger.tipPosition);

            // check that we're still overlapping.  If not, blow everything up.
            rayCaster.ray.direction.multiplyScalar( -1 );
            overlap = rayCaster.intersectObject(this.mesh)[0];

            // could it be that for shared positions, there's no overlap distance either way?
            if ( overlap ) {

              overlappingFingersRetreated++;
              averageDistanceRetreated += overlap.distance * this.physicalFingerSides[key];

            } else {
              // no overlap either way, and it's going to nullify it
              // this is where the bug occours at low speed.
              // probably due to fingerTipOffset.

              console.log('null', this.mesh.name);
              this.physicalFingerSides[key] = null;

            }

          }

        } else {

          overlap = rayCaster.intersectObject(this.mesh)[0];

          if (overlap){

            this.physicalFingerSides[key] = 1;
            console.log('side1', this.mesh.name);

          } else {

            rayCaster.ray.direction.multiplyScalar( -1 );
            rayCaster.ray.origin.fromArray(finger.tipPosition).sub( fingerTipOffset );

            overlap = rayCaster.intersectObject(this.mesh)[0];

            if (overlap){

              this.physicalFingerSides[key] = -1;
              console.log('side -1', this.mesh.name);

            }

          }

        }


      }

    }

    this.averageDistanceRetreated = averageDistanceRetreated;

    return overlappingFingers > 0 ? averageDistance / overlappingFingers : 0;

  },

  // On a frame where there's no interaction, run the physics engine
  // does spring return and velocity
  stepPhysics: function(newPosition){

    // inertia
    // simple verlet integration
    newPosition.subVectors(this.mesh.position, this.lastPosition);

    // Add a force. f = ma = kx, a = dv/dt -> change in velocity during a time-step. -> kx/m
    if (this.returnSpring){

      var offset = this.mesh.position.clone().sub(this.originalPosition);

      newPosition.add( offset.multiplyScalar( - this.returnSpring / this.mass ) );

    }

    newPosition.multiplyScalar(this.drag);

    // Currently, this is offset
    // Compare to max allowable:
    // note - this doesn't do shit.
    if (newPosition.z > this.averageDistanceRetreated){
      newPosition.z = this.averageDistanceRetreated;
    }


    newPosition.add(this.mesh.position);

  },

  // 1: count fingertips past zplace
  // 2: when more than 4, scroll
  // 3: when more than 5, move
  // 4: test/optimize with HMD.
  // note: this is begging for its own class (see all the local methods defined in the constructor??)
  bindMove: function(){

    // for every 2 index, we want to add (4 - 2).  That will equal the boneMesh index.
    // not sure if there is a clever formula for the following array:
    var indexToBoneMeshIndex = [0,1,2,3, 0,1,2,3, 0,1,2,3, 0,1,2,3, 0,1,2,3];

    var setBoneMeshColor = function(hand, index, color){

      // In `index / 2`, `2` is the number of joints per hand we're looking at.
      var meshes = hand.fingers[ Math.floor(index / 4) ].data('boneMeshes');

      if (!meshes) return;

      meshes[
        indexToBoneMeshIndex[index]
      ].material.color.setHex(color)

    };

    // we use proximity for x and y, raycasting for z
    // determine if line and place intersect
    // todo - rename to something that's not a mozilla method
    var proximity = this.moveProximity = this.controller.watch(
      this.mesh,
      this.interactiveEndBones
    );

    // this ties InteractablePlane to boneHand plugin - probably should have callbacks pushed out to scene.
    // happens on every frame before the 'frame' event handler below
    proximity.in( function(hand, intersectionPoint, key, index){
      console.log('in', key);

      // Let's try out a one-way state machine
      // This doesn't allow intersections to count if I'm already pinching
      // So if they want to move after a pinch, they have to take hand out of picture and re-place.
      if (hand.data('resizing')) return;
      setBoneMeshColor(hand, index, 0xffffff);

      this.intersections[key] = intersectionPoint.clone().sub(this.mesh.position);

      if (!this.touched) {
        this.touched = true;
//        console.log('touch', this.mesh.name);
        this.emit('touch', this);
      }

    }.bind(this) );

    proximity.out( function(hand, intersectionPoint, key, index){
      console.log('out', key);

//      setBoneMeshColor(hand, index, 0x222222);
      setBoneMeshColor(hand, index, 0xffffff);

      for ( var intersectionKey in this.intersections ){

        if (intersectionKey === key){
          delete this.intersections[intersectionKey];
          break;
        }

      }

      // not sure why, but sometimes getting multiple 0 proximity release events
      if (proximity.intersectionCount() == 0 && this.touched) {
        this.touched = false;
//        console.log('release', this.mesh.name, proximity.intersectionCount());
        this.emit('release', this);
      }

    }.bind(this) );

    this.controller.on('frame', function(frame){
      if (!this.interactable) return false;

      this.tempVec3.set(0,0,0)
      var i, moveX = false, moveY = false, moveZ = false, newPosition = this.tempVec3;

      if (this.options.moveX || this.options.moveY){

        this.getPosition( newPosition );

      } else {

        newPosition.copy(this.mesh.position)

      }

      if (this.options.moveZ){

        newPosition.z += this.getZReposition(frame.hands);

      }

      if ( newPosition.equals( this.mesh.position ) ) {

        // there's been no change, give it up to inertia and springs
        this.stepPhysics(newPosition);

      }

      this.lastPosition.copy(this.mesh.position);

      // constrain movement to...
      // for now, let's discard z.
      // better:
      // Always move perpendicular to image normal
      // Then set normal equal to average of intersecting line normals
      // (Note: this will require some thought with grab.  Perhaps get carpal intersection, stop re-adjusting angle.)
      // (Note: can't pick just any face normal, so that we can distort the mesh later on.
      // This will allow (but hopefully not require?) expertise to use.

      if (this.options.moveX ){
        
        if (this.movementConstraints.x){
          newPosition.x = this.movementConstraints.x(newPosition.x);
        }
        
        if (newPosition.x != this.mesh.position.x){
          this.mesh.position.x = newPosition.x;
          moveX = true;
        }
        
      }
      
      if (this.options.moveY ){
        
        if (this.movementConstraints.y){
          newPosition.y = this.movementConstraints.y(newPosition.y);
        }
        
        if (newPosition.y != this.mesh.position.y){
          this.mesh.position.y = newPosition.y;
          moveY = true;
        }
        
      }
      
      if (this.options.moveZ ){
        
        if (this.movementConstraints.z){
          newPosition.z = this.movementConstraints.z(newPosition.z);
        }
        
        if (newPosition.z != this.mesh.position.z){
          this.mesh.position.z = newPosition.z;
          moveZ = true;
        }
        
      }


      // note - include moveZ here when implemented.
      if ( moveX || moveY || moveZ ) this.emit( 'travel', this, this.mesh );


    }.bind(this) );

  },

  bindResize: function(){

    var corners = this.mesh.geometry.corners();
    this.cornerMeshes = [];
    this.cornerProximities = [];
    var mesh, proximity;

    for (var i = 0; i < corners.length; i++) {

      this.cornerMeshes[i] = mesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.options.cornerInteractionRadius, 32, 32),
        new THREE.MeshPhongMaterial({color: 0xffffff})
      );

      mesh.visible = false;
      mesh.name = "corner-" + i; // convenience

      var cornerXY = corners[i];
      mesh.position.set(cornerXY.x, cornerXY.y, 0); // hard coded for PlaneGeometry.. :-/

      this.mesh.add(mesh);

      this.cornerProximities[i] = proximity = this.controller.watch(
        mesh,
        this.cursorPoints
      ).in(
        function(hand, displacement, key, index){
          // test - this could be the context of the proximity.
          this.mesh.material.color.setHex(0x33ee22);
        }
      ).out(
        function(){
          this.mesh.material.color.setHex(0xffffff);
        }
      );

    }

    this.controller.on('hand',
      this.checkResizeProximity.bind(this)
    );

    // todo - make sure pinching on multiple corners is well-defined.  Should always take the closest one.
    // Right now it will always prefer the first-added Plane.
    this.controller.on('pinch', function(hand){

      var activeProximity, key = hand.id + '-0';

      for (var i = 0; i < this.cornerProximities.length; i++) {

        if (this.cornerProximities[i].states[key] === 'in') {
          activeProximity = this.cornerProximities[i];
          break;
        }

      }

      if (!activeProximity) return;

      if ( hand.data('resizing') ) return;

      hand.data('resizing', activeProximity);

    }.bind(this));

    this.controller.on('unpinch', function(hand){
      if (!hand.data('resizing')) return;

      hand.data('resizing', false);
    }.bind(this));
  },

  // Returns coordinates for the last two bones of every finger
  // Format: An array of tuples of ends
  // Order matters for our own use in this class
  // returns a collection of lines to be tested against
  // could be optimized to reuse vectors between frames
  interactiveEndBones: function(hand){
    var out = [], finger;

    for (var i = 0; i < 5; i++){
      finger = hand.fingers[i];

      if (i > 0){ // no thumb proximal
        out.push(
          [
            (new THREE.Vector3).fromArray(finger.proximal.nextJoint),
            (new THREE.Vector3).fromArray(finger.proximal.prevJoint)
          ]
        );
      }

      out.push(
        [
          (new THREE.Vector3).fromArray(finger.medial.nextJoint),
          (new THREE.Vector3).fromArray(finger.medial.prevJoint)
        ],
        [
          (new THREE.Vector3).fromArray(finger.distal.nextJoint),
          (new THREE.Vector3).fromArray(finger.distal.prevJoint)
        ]
      );

    }

    return out;
  },

  intersectionCount: function(){
    var i = 0;
    for (var key in this.intersections){
      i++
    }
    return i;
  },

  // This checks for intersection points before making self interactable
  // If there are any, it will wait for the plane to be untouched before becoming live again.
  // Note that this may need a little more tuning.  As it is right now, a touch/release may flicker, causing this to be not safe enough.
  // Thus leaving in console.logs for now.
  safeSetInteractable: function(interactable){

    if (!interactable) { this.interactable = false; return }

    if ( this.touched ){

      var callback = function(){

        this.interactable = true;
        this.unbind('release', callback);

      }.bind(this);

      this.release(callback);

    } else {

      this.interactable = true;

    }

  },

  // could be optimized to reuse vectors between frames
  // used for resizing
  cursorPoints: function(hand){
    return [
      (new THREE.Vector3).fromArray(hand.palmPosition)
    ]
  },

  checkResizeProximity: function(hand){
    var targetProximity = hand.data('resizing'), inverseScale;

    if (!targetProximity) return;

    var cursorPosition = this.cursorPoints( hand )[0];

    for (var i = 0; i < this.cornerProximities.length; i++) {

      if ( targetProximity === this.cornerProximities[i] ){

        if (hand.data('pinchEvent.pinching')) {

          this.mesh.setCorner(i, cursorPosition);

          inverseScale = (new THREE.Vector3(1,1,1)).divide(this.mesh.scale);

          for (var j = 0; j < this.cornerProximities.length; j++){
            this.cornerMeshes[j].scale.copy(inverseScale);
          }


        } else {

          hand.data('resizing', false);

        }

      }

    }

  }

}

}).call(this);
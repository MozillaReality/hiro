// SortedLayout Container
// Original Author: Daniel Plemmons
// Created: Nov. 3, 2014
//
// This is a container for InteractablePlanes that:
// - Allows the planes to be interactively layed out on screen
//   (via sorting) by given properties
// - Allows users to determine the behavior of the on-screen
//   sorting based on the position of their hands
// - Allows the user to manually layout the items in the
//   container and persists that layout in application state
//   (for the duration of the application runtime)
//
// For the moment, the container will make all calculations for
// the plane locations in world space. Eventually this class
// should be modified to give each container it's own local
// coordinate space.
//
// The container currently handles it's own list of child planes.
// This means that multiple containers could reasonably contain
// the same plane. This class should eventually be refactored to
// have the plane's parent determine its container. ( this goes along
// with the proposed coordinate space refactor. )

(function () {
  //The list of valid states for the manner of sorting.
  var validSortStates = [
    "USER_SORTED",
    "DYNAMIC_SORTED"
  ];
  // SortedLayoutContainer Constructor
  // Optional argument "planeList" is a list of InteractivePlanes to be added to the container on creation
  // Optional argument "sortState" is a string given one of the validSortStates listed above.
  window.SortedLayoutContainer = function(planeList, sortState){
    this.planeList = planeList || [];
    this.userLayout = [];

    if (sortState !== undefined && validSortStates.indexOf(sortState) != -1) {
      this.changeSortState(sortState);
    }
    else {
      this.changeSortState("USER_SORTED");
    }
  };

  // Pubic Methods
  window.SortedLayoutContainer.prototype = {
    // Takes two hand positions
    // if the container's current state allows programatic layout (as opposed to manual user layout )
    // will sort the InteractablePlane(s) in the container accordingly (and return true).
    // Update will return false if the current container state does not support
    // programatic layout
    update: function(hand1, hand2) {
      var hand1Position = new THREE.Vector3().copy(hand1);
      var hand2Position = new THREE.Vector3().copy(hand2);
      var fromTwoToOne = new THREE.Vector3().copy(hand2Position).sub(hand1Position);

      var leftmost = hand1Position.x < hand2Position.x ? hand1Position : hand2Position;
      var rightmost = hand1Position.x < hand2Position.x ? hand2Position : hand1Position;
      var topmost = hand1Position.y < hand2Position.y ? hand1Position : hand2Position;
      var bottommost = hand1Position.y < hand2Position.y ? hand2Position : hand1Position;

      if ( this.sortState == "DYNAMIC_SORTED" ) {
        // Figure out the weighting of each layout
        var diff = new THREE.Vector3().copy(rightmost).sub(leftmost);
        var weightX = diff.x / (diff.x + diff.y);
        var weightY = diff.y / (diff.x + diff.y);

        var alphabeticalLayout = listLayout(this.planeList, leftmost, new THREE.Vector3(rightmost.x, leftmost.y, leftmost.z)).alphabetical();
        var chronologicalLayout = listLayout(this.planeList, bottommost, new THREE.Vector3(bottommost.x, topmost.y, bottommost.z)).alphabetical();
        var blendedLayout = blendLayouts([alphabeticalLayout, chronologicalLayout], [weightX, weightY]);
        applyLayoutList(blendedLayout);
        return true;
      }
      else {
        return false;
      }
    },

    changeSortState: function(newSortState) {
      if (validSortStates.indexOf(newSortState) == -1 || newSortState == this.sortState) {
        return false;
      }

      if ( newSortState == "DYNAMIC_SORTED" ) {
        for(var i=0; i<this.planeList.length; i++) {
          this.planeList[i].interactable = false;
        }
      }
      else if ( newSortState == "USER_SORTED" ) {
        for(var i=0; i<this.planeList.length; i++) {
          this.planeList[i].interactable = true;
        }
      }

      this.sortState = newSortState;
    },

    // Adds the given plane to list of planes managed by the container.
    // Returns true if the plane is successfully added.
    // Returns false if the plane is a duplicate and cannot be added.
    addPlane: function(newPlane) {
      if ( this.planeList.indexOf(newPlane) == -1 ) {
        if ( this.sortState == "DYNAMIC_SORTED" ) {
          newPlane.interactable = false;
        }

        this.userLayout.push(LayoutNode(newPlane, newPlane.mesh.position));

        this.planeList.push(newPlane);
        return true;
      }
      else {
        return false;
      }
    },

    // Removes the given plane from the list of planes.
    // Returns true if the plane was successfully removed.
    // Returns false if the plane could not be found and was not removed.
    removePlane: function(toRemove) {
      var planeIndex;
      if ( (planeIndex = this.planeList.indexOf(toRemove)) != -1 ) {
        toRemove.interactable = true;
        this.planeList.splice(planeIndex, 1);

        var userIndex;
        if ( (userIndex = this.userLayout.indexOf(toRemove)) != -1 ) {
          this.userLayout.splice(userIndex, 1);
        }

        return true;
      }
      else {
        return false;
      }
    },

    // Save the current layout as the new cannonical "user defined layout"
    persistLayout: function() {
      userLayout = [];
      for (var i=0; i<this.planeList.length; i++) {
        userLayout.push(LayoutNode(this.planeList[i], this.planeList[i].mesh.position));
      }
    }
  };

  // Generates a LayoutNode object which is just a
  // simple structure to hold a plane and the position
  // generated for it.
  function LayoutNode(plane, position) {
    var returnNode = {
      "plane": plane,
      "position": position
    };
    return returnNode;
  }

  // If called with a sort comparitor, returns an array of layoutNodes specifying the InteractivePlane and the
  // location in space according to the supplied sort comparitor function.
  //
  // if called with just start and end position, returns an object that containts the relevant
  // calls to generate the layout with different sorting properties.
  function listLayout(planeList, start, end, sortComparitor) {
    var startPosition = new THREE.Vector3().copy(start);
    var endPosition = new THREE.Vector3().copy(end);

    // If only start and end position are given, utilize partial evaluation
    // to allow a call formated like: listLayout(startPosition, endPosition).alphabetical();
    if (arguments.length == 3) {
      return {
        alphabetical: (function() {
          return listLayout(planeList, startPosition, endPosition, function(a,b) {
            if ( a.mesh.name <= b.mesh.name ) { return -1; }
            else { return 1; }
          });
        }),
        chronological: (function() {
          return listLayout(planeList, startPosition, endPosition, function(a,b) {
            if ( a.uid <= b.uid ) { return -1; }
            else { return 1; }
          });
        })
      };
    }
    else if (arguments.length == 4) {
      var layoutList = [];

      // Sort the planelist alphabetically by "plane.mesh.name"
      planeList.sort(sortComparitor);

      // Generate the layout list full of layout nodes
      for (var i=0; i<planeList.length; i++) {
        var plane = planeList[i];
        var listPercentage = (i*1.0) / (planeList.length*1.0); // force double division
        listPercentage = Math.min(1.0, Math.max(0.0, listPercentage));
        var position = new THREE.Vector3().copy(startPosition).lerp(endPosition, listPercentage);

        layoutList.push(LayoutNode(plane, position));
      }

      return layoutList;
    }
    else {
      return false;
    }
  }

  // - Retruns a weighted mean of the given layout node lists as an array of layout nodes
  // - Assumes that each index of each list in layout lists referes to the
  //   same node.
  // - The length of the weightList and the layoutList must be equal.
  function blendLayouts(layoutLists, weightList) {
    var ittr = 0;
    var weightSumList = [];
    var vectorSumList = [];
    var blendedLayoutList = [];

    // Confirm arguments are valid(ish)
    if( layoutLists === undefined || weightList === undefined) { return false; }
    else if ( !(Array.isArray(layoutLists)) || !(Array.isArray(layoutLists))) { return false; }
    else if ( layoutLists.length != weightList.length ) { return false; }
    else if ( layoutLists.length === 0 ) { return false; }

    // For each node, calculate the weighted sum of vectors
    // along with the sum of weights.
    for( var i=0; i < layoutLists.length; i++ ) {
      var layoutList = layoutLists[i];
      var weight = weightList[i];
      for ( var j=0; j<layoutList.length; j++ ) {
        var layoutNode = layoutList[j];
        if (vectorSumList[j] === undefined) { vectorSumList[j] = new THREE.Vector3().copy(layoutNode.position).multiplyScalar(weight); }
        else { vectorSumList[j].add(new THREE.Vector3().copy(layoutNode.position).multiplyScalar(weight)); }

        if (weightSumList[j] === undefined) { weightSumList[j] = weight; }
        else { weightSumList[j] += weight; }
      }
    }

    //Calculate the weighted mean for each node
    for ( var i=0; i < vectorSumList.length; i++) {
      vecSum = vectorSumList[i];
      var plane = layoutLists[0][i].plane;
      var weightSum = weightSumList[i];
      blendedLayoutList[i] = LayoutNode(plane, new THREE.Vector3().copy(vecSum).divideScalar(weightSum));
    }

    return blendedLayoutList;
  }

  // Itterate through a layout list and move the given elements to the
  // given positions.
  function applyLayoutList(layoutList) {
    for(var i=0; i<layoutList.length; i++) {
      var node = layoutList[i];
      var plane = node.plane;
      plane.mesh.position.copy(node.position);
    }
  }
}).call(this);
angular.module('factories', []).
  factory('vrControls', function(){
    return new THREE.VRControls(null); // instantiate camera later.
  });
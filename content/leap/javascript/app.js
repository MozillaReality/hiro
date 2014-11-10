// Plugin order is critical:
Leap.loop()
  .use('transform', {
    vr: true
  })
  .use('boneHand', {
    scene: null, // this tells boneHand to use defer scene usage/creation.
    opacity: 0.7,
    jointColor: new THREE.Color(0x222222),
    arm: true
  })
  .use('proximity')
  .use('pinchEvent')
  .use('handBracket');

Leap.loopController.setBackground(true);


angular.module('index', ['factories', 'directives']);


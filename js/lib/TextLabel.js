
// var label = TextLabel('Test Text', {
//  width: 300,
//  height: 50
// });
// label.scale.set(0.5, 0.5, 0.5);
// label.position.z = -200;

// scene.add(label);



function TextLabel(text, opts) {
  if (!opts) opts = {};
  var width = opts.hasOwnProperty('width') ? opts.width : 100;
  var height = opts.hasOwnProperty('height') ? opts.height : 100;

  var font = opts.hasOwnProperty('font') ? opts.font : 'normal 30px helvetica';
  // CSS Text format
  // Formal syntax: [ [ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? <‘font-size’> [ / <‘line-height’> ]? <‘font-family’> ] | caption | icon | menu | message-box | small-caption | status-bar
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font

  var fontPosition = opts.hasOwnProperty('fontPosition') ? opts['fontPosition'] : { x: 0, y: 0 };
  var textBaseline = opts.hasOwnProperty('textBaseline') ? opts['textBaseline'] : 'middle';
  var textAlign = opts.hasOwnProperty('textAlign') ? opts['textAlign'] : 'start';
  var fillStyle = opts.hasOwnProperty('fillStyle') ? opts['fillStyle'] : 'rgba(255,255,255,255)';
  var showBounds = opts.hasOwnProperty('showBounds') ? opts['showBounds'] : false;
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  var context = canvas.getContext('2d');
  context.font = font;

  if (showBounds) {
    context.fillStyle = 'red';
    context.fillRect(0, 0, width, height);
  }

  context.textBaseline = textBaseline;
  if (textBaseline == 'middle') {
    fontPosition.y = height/2;
  }

  context.textAlign = textAlign;
  if (textAlign == 'center') {
    fontPosition.x += width/2;
  }

  context.fillStyle = fillStyle;
  context.fillText(text, fontPosition.x, fontPosition.y);


  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });


  var geometry = new THREE.PlaneGeometry( width, height, 10, 10 );


  // ---------------

  var group = new THREE.Group();

  // var geo = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
  // var mat = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true });
  // var cube = new THREE.Mesh( geo, mat );
  // group.add(cube);

  var label = new THREE.Mesh( geometry, material );

  group.add(label)

  return group;

}
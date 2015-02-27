


var VRUIKit = {};

VRUIKit.TextLabel = function(text, opts) {

// var label = VRUI.TextLabel('Test Text', {
//        width: 300,
//        height: 50
//       });
//       label.scale.set(0.5, 0.5, 0.5);
//       label.position.z = -200;

//       self.scene.add(label);

  if (!opts) opts = {};
  var width = opts.hasOwnProperty('width') ? opts.width : 100;
  var height = opts.hasOwnProperty('height') ? opts.height : 100;

  var font = opts.hasOwnProperty('font') ? opts.font : 'normal 30px helvetica';
  // CSS Text format
  // Formal syntax: [ [ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? <‘font-size’> [ / <‘line-height’> ]? <‘font-family’> ] | caption | icon | menu | message-box | small-caption | status-bar
  // https://developer.mozilla.org/en-US/docs/Web/CSS/font

  var fontPosition = opts.hasOwnProperty('fontPosition') ? opts['fontPosition'] : { x: 0, y: 0 };
  var textBaseline = opts.hasOwnProperty('textBaseline') ? opts['textBaseline'] : 'alphabetic';
  var textAlign = opts.hasOwnProperty('textAlign') ? opts['textAlign'] : 'start';
  var verticalAlign = opts.hasOwnProperty('verticalAlign') ? opts['verticalAlign'] : 'top';
  var lineHeight = opts.hasOwnProperty('lineHeight') ? opts['lineHeight'] : 30;
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

  context.textAlign = textAlign;

  if (textAlign == 'center') {
    fontPosition.x += width/2;
  }

  context.fillStyle = fillStyle;

  var textLines = text.split('\n');

  if (verticalAlign === 'top') {
    fontPosition.y = lineHeight;
  } else if (verticalAlign === 'middle') {
    fontPosition.y = (height/2) - ((lineHeight * textLines.length) / 2) + lineHeight;
  }

  context.textBaseline = textBaseline;

  textLines.forEach(function(textLine, i) {
    context.fillText(textLine, fontPosition.x, fontPosition.y + (lineHeight * i));
  })

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true
  });

  var geometry = new THREE.PlaneGeometry( width, height, 10, 10 );

  return new THREE.Mesh( geometry, material );
}



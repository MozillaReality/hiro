var vrDetected = false;

var interval; // interval timer for gamepad

var permissionInstructions = document.querySelector('#fsPrompt');

var enterVRButton = document.querySelector('#launch');

var statusDialogue = document.querySelector('#vrEnabled');

function show(el) {
  el.classList.remove('is-hidden');
};

function hide(el) {
  el.classList.add('is-hidden');
};

function requestFullscreen(el) {
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
};

function requestPointerlock(el) {
  el.requestPointerLock = el.requestPointerLock ||
    el.mozRequestPointerLock ||
    el.webkitRequestPointerLock;

  el.requestPointerLock();
}

function onFschange() {
  var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

  if (!fullscreenElement) {
    hide(permissionInstructions);
    show(enterVRButton);
  }
};

function setPermissionPromptedCookie() {
  document.cookie = "fsPrompted=true; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
}

function hasBeenPermissionPrompted() {
  if (document.cookie.indexOf('fsPrompted=true') !== -1) {
    return true;
  } else {
    return false;
  }
}

function enterVr(useFullscreen) {
  if (useFullscreen === false) {
    hide(enterVRButton)
    VRManager.enableVR({
      fullscreen: false
    });
  } else {
    if (hasBeenPermissionPrompted()) {
      VRManager.enableVR();
    } else {
      setPermissionPromptedCookie();

      show(permissionInstructions)

      requestFullscreen(document.body);

      requestPointerlock(document.body)

      hide(enterVRButton)
    }
  }
};

function onkey(event) {
  console.log(event.keyCode);
  switch (event.keyCode) {
    case 70: // f
      enterVr(true);
      break;
    case 83: // s
      enterVr(false);
      break;
    case 37: // <- arrow
      VRDemo.prev();
      break;
    case 39: // -> arrow
      VRDemo.next();
      break;
    case 90: // z
      VRManager.zeroSensor();
      break;
    case 32: // space
      VRManager.ui.toggleHud();
      break;
  }
}

window.addEventListener("keydown", onkey, true);

document.addEventListener('mozfullscreenchange', onFschange);
document.addEventListener('webkitfullscreenchange', onFschange);
document.addEventListener('fullscreenchange', onFschange);


xBoxPad.on('pressed', function(buttons) {
  if (buttons.length === 2) {
    if (buttons[0] === 'LT' && buttons[1] === 'RT' ||
        buttons[0] === 'RT' && buttons[1] === 'LT' ) {
      VRManager.ui.toggleHud();
    }
    return;
  }
  if (buttons.length === 1 && buttons[0] === 'A') {
    document.body.dispatchEvent(
      new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
    }));
    return;
  }
  if (buttons.length === 1 && buttons[0] === 'Start') {
    VRManager.zeroSensor();
    return;
  };
});

VRManager.vrReady.then(function() {
  // VR detected
  vrDetected = 'true';

  show(enterVRButton);

  show(statusDialogue);
}, function() {
  // VR NOT detected
  vrDetected = 'false';
});

enterVRButton.addEventListener('click', function() {
  enterVr(true);
})
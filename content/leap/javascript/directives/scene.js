(function() {


var images = [
   "3d-abstract_hdwallpaper_steam-engine_50474.jpg                   ",
   "52_8134_Hoentrop_2012-09-16.jpg                   ",
   "steam-engine-4.png                          ",
   "steam-engine-wallpaper-9.jpg                            ",
   "LARGE-3-175 UP3618 mallet 1929.tif.jpg                   ",
   "LARGE-3-420 oiling 9000.Tif.jpg                          ",
   "LARGE-6 sideview 9000.Tif.jpg                            ",
   "LARGE-7-40 depot Omaha Stimson.Tif.jpg                   ",
   "LARGE-7-67 coach shop.tif.jpg                            ",
   "LARGE-7-160 Durant FD 1910.tif.jpg                       ",
   "LARGE-68-13 UP3703 mallet 1918.tif.jpg                   ",
   "LARGE-68-80 Council Bluffs no date.jpg.jpg               ",
   "LARGE-001347H tour buses-1.psd.jpg                       ",
   "LARGE-1791A M10000 overhead.Tif.jpg                      ",
   "LARGE-1802 poster BW M10000 progress.Tif.jpg             ",
   "LARGE-5127A LA Ltd SPA semaphores.Tif.jpg                ",
   "LARGE-10233 through the pipe.tif.jpg                     ",
   "LARGE-14618 UP9026 Archer.tif.jpg                        ",
   "LARGE-73069 Lane cutoff.tif.jpg                          ",
   "LARGE-73209 4-4-2 SFA 97.tif.jpg                         ",
   "LARGE-74688  Children's Book of Yellowstone Bears.jpg.jpg",
   "LARGE-74690 poster Zion.tif.jpg                          ",
   "LARGE-74694 ad Grand Canyon.Tif.jpg                      ",
   "LARGE-504590 Joseph ag train.jpg.jpg                     ",
   "LARGE-ag train Pilot Rock OWRN.jpg.jpg                   ",
   "LARGE-CoP Rochester NY .tif.jpg                          ",
   "LARGE-EHHarriman Sale of UP.tif.jpg                      ",
   "LARGE-H7-74 Omaha Shop emp 1908.tif.jpg                  ",
   "LARGE-LA Ltd SPA crew 3413.Tif.jpg                       ",
   "LARGE-Lane cutoff fill .tif.jpg                          ",
   "LARGE-lane cutoff.jpg.jpg                                ",
   "LARGE-Mountain type 4-8-2.tif.jpg                        ",
   "LARGE-Omaha Shop ext air 1907.tif.jpg                    ",
   "LARGE-Omaha stores dept 1912.tif.jpg                     ",
   "LARGE-Papio trestle construction.tif.jpg                 ",
   "LARGE-PFE cars ice dock.tif.jpg                          ",
   "LARGE-PFE Las Vegas 1931.tif.jpg                         ",
   "LARGE-SPLAandSL num504.tif.jpg                           ",
   "LARGE-Streamliner 3 locos.Tif.jpg                        ",
   "LARGE-UP SP office KC.tif.jpg                            ",
   "LARGE-X1729 No 4038 near Truckee.tif.jpg                 ",
   "LARGE-X2313 Excursion Midlake.tif.jpg                    ",
   "LARGE-Zoin Lodge opening 04-15-25.tif.jpg                "
];



angular.module('directives', [])
  .directive('scene', function() {
    return {
      restrict: 'E',
      template: '<canvas></canvas>',
      link: function(scope, element, attrs){

        window.plotter = new LeapDataPlotter();

        var scene = new THREE.Scene();
        Arrows.scene = scene;

        var camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          10000
        );
        scene.add( camera ); // so that we can add things to it later.

        //we don't actually want the leap hand as child of the camera, as we want the data itself properly transformed.
        // on every frame, we combine the base transformation with the camera transformation to the leap data
        // this is used in grab, proximity, etc.
        boneHand = Leap.loopController.plugins.boneHand;
        boneHand.scene = scene;
        // preload two hands in to the scene
        boneHand.HandMesh.create();
        boneHand.HandMesh.create();

        Leap.loopController.plugins.transform.effectiveParent = camera;
        window.camera = camera;


        var canvas = element.find('canvas')[0];
        canvas.style.position = 'absolute';
        canvas.style.top = 0;
        canvas.style.left = 0;

        var renderer = new THREE.WebGLRenderer({
          antialias: true,
          canvas: canvas
        });
        renderer.shadowMapEnabled = false;
        renderer.setClearColor(0x000000, 0);

        renderer.setSize(window.innerWidth, window.innerHeight);


        // these would be better off directed as services.  But for now, we use window for message passing.
        window.vrEffect = new THREE.VREffect(renderer);
        window.vrControls = new THREE.VRControls(camera);


        onResize = function() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);

          // expicit render call as:
          // user may not have leap
          // if they do, they probably won't have hand in frame, causing render
          render()
        };

        window.addEventListener('resize', onResize, false);

        // idea - it would be ideal to have a 3d infinite grid - that would be much cooler
        // for now we suffice to a boring old floor.


        var light = new THREE.PointLight(0xffffff, 1, 1000);
        scene.add(light);


        var dockWidth = 1;
        var dockHeight = dockWidth * 0.15;


        var dockMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(dockWidth, dockHeight),
          new THREE.MeshPhongMaterial({
            color: 0xffffff,
            map: THREE.ImageUtils.loadTexture("images/foto-viewer-dark.png"),
            side: THREE.DoubleSide, // allow reverse raycasting.
            transparent: true,
            opacity: 1
          })
        );
        dockMesh.name = "dock";

        var zDepth = -0.39;

        dockMesh.position.set(0.1, -0.16, zDepth);

        // for now, we don't create a scrollable object, but just let it be moved in the view
        var dock = new Dock(scene, dockMesh, Leap.loopController, {
          resize: false,
          moveZ: false,
          moveY: false,
          moveX: false,
          highlight: false
        });

//        dock.pushImage("images/trains/" + images[0]);
//        dock.pushImage("images/trains/" + images[1]);
//        dock.pushImage("images/trains/" + images[2]);
//        dock.pushImage("images/trains/" + images[3]);
        dock.pushImage("images/landscapes/landscape1.jpg");
        dock.pushImage("images/landscapes/landscape2.jpg");
        dock.pushImage("images/landscapes/landscape3.jpg");
        dock.pushImage("images/landscapes/landscape4.jpg");

        dock.setInteractable(false);

        window.dock = dock;

        var sortedLayoutContainer = window.sortedLayoutContainer = new PlaneStack("collage");

        sortedLayoutContainer.position.setZ(zDepth);

        // When an image is removed from the doc, add it to the container.
        dock.imageRemoveCallbacks.push(function(data) {
          sortedLayoutContainer.addPlane(data[0]);
        });

        Leap.loopController.on('twoHand.start', function(hand1, hand2){
          if ( sortedLayoutContainer.planeCount() < 1) return;
          sortedLayoutContainer.begin(
            (new THREE.Vector3).fromArray(hand1.palmPosition),
            (new THREE.Vector3).fromArray(hand2.palmPosition)
          );
        });

        Leap.loopController.on('twoHand.update', function(hand1, hand2){
          if ( sortedLayoutContainer.planeCount() < 1) return;
          sortedLayoutContainer.update(
            (new THREE.Vector3).fromArray(hand1.palmPosition),
            (new THREE.Vector3).fromArray(hand2.palmPosition)
          );
        });

        Leap.loopController.on('twoHand.end', function(){
          if ( sortedLayoutContainer.planeCount() < 1) return;
          sortedLayoutContainer.release();
        });

        sortedLayoutContainer.on('mode', function(mode){
          ga('send', 'event', 'Mode', mode);
        });

// leap proximity does not at all do well with angled objects:
//        dockMesh.position.set(-90, 130 - dockHeight / 2, -300);
//        dockMesh.rotation.set(0, Math.PI / 4, 0, 0);
//        camera.add(dockMesh);

        scene.add(dockMesh);

//        var text = createText('Move images up..');
//        text.position.setZ(-250);
//        text.position.setY(120);
//        scene.add(text);


        // these should be on a plane covering everything up...

        var zOffset = 0.01;
        var backdropDepth = zDepth + zOffset;
        var dialogHeight = 0.09;

        var backdrop = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.MeshPhongMaterial({
            color: 0x000000,
            specular: 0x000000
          })
        );
        backdrop.name = "backdrop";
//        backdrop.visible = false;
        scene.add(backdrop);

        // we use this for checking intersections later.
        window.backdrop = backdrop;

        backdrop.position.set(0, 0, backdropDepth);


        var pluginLeap = new THREEDialog({
          name: 'pluginLeap-ui',
          height: 0.36,
          bg:    'images/intro/plug-in-leap.png',
          onClick: function(){
            console.log('pluginLeap click');
            ga('send', 'event', 'Click', 'pluginLeap');
          }
        });
        pluginLeap.mesh.position.set(-0.2, dialogHeight, zOffset);
        backdrop.add(pluginLeap.mesh);
//        scene.add(pluginLeap.mesh);


        var playback = new THREEDialog({
          name: 'playback-ui',
          height: 0.18,
          bg:    'images/intro/auto-play.png',
          hover: 'images/intro/auto-play-ok.png',
          click: 'images/intro/auto-play-ok.png',
          onClick: function(){
            console.log('playback click');
            backdrop.visible = false;
            cursor.cursor.visible = false;

            useDesktopMode();
            player.setRecording(recordings.p1);
            player.play();
            ga('send', 'event', 'Click', 'autoplay');
          }
        });
        playback.mesh.position.set(0.2, dialogHeight, zOffset);
        backdrop.add(playback.mesh);


        var HMDMode = new THREEDialog({
          name: 'HMDMode-ui',
          height: 0.2,
          bg:    'images/intro/hmd.png',
          hover: 'images/intro/hmd-ok.png',
          click: 'images/intro/hmd-ok.png',
          onClick: function(){
            console.log('hmd click');
            backdrop.visible = false;
            cursor.cursor.visible = false;
            window.useHMDMode();
            ga('send', 'event', 'Click', 'HMDMode');
          }
        });
        HMDMode.mesh.position.set(-0.15, dialogHeight, zOffset);
        HMDMode.mesh.visible = false;
        backdrop.add(HMDMode.mesh);


        var desktopMode = new THREEDialog({
          name: 'DesktopMode-ui',
          height: 0.2,
          bg:    'images/intro/desktop.png',
          hover: 'images/intro/desktop-ok.png',
          click: 'images/intro/desktop-ok.png',
          onClick: function(){
            console.log('desktop click');
            backdrop.visible = false;
            cursor.cursor.visible = false;
            window.useDesktopMode();
            ga('send', 'event', 'Click', 'DesktopMode');
          }
        });
        desktopMode.mesh.position.set(0.15, dialogHeight, zOffset);
        desktopMode.mesh.visible = false;
        backdrop.add(desktopMode.mesh);



        Leap.loopController.on('streamingStarted', function(){

          pluginLeap.mesh.visible = false;
          playback.mesh.visible = false;

          pluginLeap.mesh.dispatchEvent({type: 'click'});

          desktopMode.mesh.visible = true;
          HMDMode.mesh.visible = true;

          document.getElementById('desktopVsHMDMode').className = '';
          document.getElementById('controllerStatusMessage').className = 'hidden';

        });


        // must be global so that blur and focus can access it in app.js
        window.cursor = new VRCursor();

        // can't customize position of cursor without messing things up.
        // note: VRCursor will have to be upgraded in order to allow always being in front of mesh.
        cursor.setMode('centered');
        cursor.init(renderer.domElement, camera, scene);

        cursor.ready.then(function() {
          scene.add(cursor.layout);
          console.log(cursor.layout.position);
          cursor.cursor.position.setZ(-0.35);
          cursor.cursor.material.color.setHex(0x81d41d);
        	cursor.enable();
        });

        // enable or disable cursor on VRclient focus & blur callbacks
        VRClient.onBlur = function() {
        	cursor.disable();
        };

        VRClient.onFocus = function() {
        	cursor.enable();
        };



        var gridMat = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          specular: 0x000000,
          map: THREE.ImageUtils.loadTexture("images/Grid-01.png")
        });

        var grid = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          gridMat
        );
        grid.name = "grid";
        scene.add(grid);

        grid.rotation.set(-Math.PI / 2, 0, 0);
        grid.position.set(0, -1.23, zDepth - 0.02);





        var handArrow1 = new HandArrow(scene);
        var handArrow2 = new HandArrow(scene);

        Leap.loopController.on('twoHand.start', function(hand1, hand2) {
          if (handArrow1.mesh !== undefined) {
            handArrow1.mesh.visible = true;
          }
          if (handArrow2.mesh !== undefined) {
            handArrow2.mesh.visible = true;
          }
        });

        Leap.loopController.on('twoHand.update', function(hand1, hand2) {
          handArrow1.update(hand1.palmPosition, hand2.palmPosition );
          handArrow2.update(hand2.palmPosition, hand1.palmPosition);
        });

        Leap.loopController.on('twoHand.end', function() {
          if (handArrow1.mesh !== undefined) {
            handArrow1.mesh.visible = false;
          }
          if (handArrow2.mesh !== undefined) {
            handArrow2.mesh.visible = false;
          }
        });



//        var collageText = createText('Collage');
//        var stackText   = createText('Stack');
//        text.position.setZ(-250);
//        text.position.setY(120);
//        scene.add(text);

        // now defunkt cursor work
        Leap.loopController.on('hand', function(hand){
          return;
          if (hand.data('cursor')) return;

          var boneMeshes = hand.indexFinger.data('boneMeshes');

          console.log(boneMeshes);

          if (!boneMeshes) return;

          var cursorTarget = new THREE.Vector3(-5,-39,25);
          var cursorDirection = new THREE.Vector3(0,-1,0);
          var cursorLength = 40;

          var cursor = new THREE.ArrowHelper(
            cursorDirection,
            cursorTarget.clone().sub(cursorDirection.normalize().multiplyScalar(cursorLength)),
            cursorLength,
            0x5daa00,
            20,
            10
          );

          boneMeshes[0].add(cursor);

          hand.data('cursor', cursor);
        });


        var render = function() {
          cursor.update();
          Arrows.update();
          vrControls.update();
          vrEffect.render(scene, camera);
        };
        render();

        // By controlling render from frame, we make sure that rendering happens immediately after frame processing.
        Leap.loopController.on('frame', function(){
          TWEEN.update();
          render();
        });

        var renderWithoutLeap = function() {
          if ( Leap.loopController.streaming() ) return;

          render();
          window.requestAnimationFrame(renderWithoutLeap);
        };

        renderWithoutLeap();


        dock.on('imageLoad', function(image){

          if (!Leap.loopController.streaming()){
            render()
          }

          if (!VRClientReady) {
            console.log("VRClient ready");
            VRClient.ready();
            VRClientReady = true;
          }

          // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
          image.touch( function(){
            ga('send', 'event', 'Images', 'Touch', image.mesh.name);
          });

          image.release( function(){
            ga('send', 'event', 'Images', 'Release', image.mesh.name);
          });

        });


        var player = Leap.loopController.plugins.playback.player;

        // these objects get "frames" added to them later
        // todo - loading graphic
        var recordings = {
          p1: {
//            url: "recordings/remove-photos-2-56fps.json.lz"
//            url: "recordings/remove-photos-3-53fps.json.lz"
            url: "recordings/remove-photos-3-110fps.json.lz"
          },
          p2: {
            url: "recordings/stack-images-51fps.json.lz"
          },
          p3: {
            url: "recordings/spread-photos-55fps.json.lz"
          }
        };
        var p1link = document.getElementById('auto-part1-link');
        var p2link = document.getElementById('auto-part2-link');
        var p3link = document.getElementById('auto-part3-link');

        Leap.loopController.on('playback.playbackFinished', function(){
          player.clear();

          if (player.recording == recordings.p1){
            if (p2link){
              document.getElementById('auto-part2-span').style.display = "block";
            }
          }
          if (player.recording == recordings.p2){
            if (p3link) {
              document.getElementById('auto-part3-span').style.display = "block";
            }
          }
        });

        var loadingText;
        Leap.loopController.on('playback.ajax:begin', function(player){
          loadingText = createText('Loading..');
          loadingText.position.setZ(-0.3);
          loadingText.position.setY(0.07);
          scene.add(loadingText);
        });

        Leap.loopController.on('playback.ajax:complete', function(player){
          // not sure why, but this also seems to be disappearing on its own sometimes..
          scene.remove(loadingText);
          player.play();
        });

        if (p1link){
          p1link.onclick = function(){
            player.setRecording(recordings.p1);
            player.play();
            return false;
          };
        }

        if (p2link){
          p2link.onclick = function(){
            player.setRecording(recordings.p2);
            player.play();
            return false;
          }
        }

        if (p3link) {
          p3link.onclick = function () {
            player.setRecording(recordings.p3);
            player.play();
            return false;
          };
        }

      }
    };
  });

}).call(this);
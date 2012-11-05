var camera  = undefined;
function createScene(element) {

  // Renderer
  var renderer = new THREE.WebGLRenderer({clearColor:0xFFFFFF, clearAlpha: 1});
  renderer.setSize(element.width(), element.height());
  element.append(renderer.domElement);
  renderer.clear();

  // Scene
  var scene = new THREE.Scene(); 

  // Lights...
  [[0,0,1,  0xFFFFCC],
   [0,1,0,  0xFFCCFF],
   [1,0,0,  0xCCFFFF],
   [0,0,-1, 0xCCCCFF],
   [0,-1,0, 0xCCFFCC],
   [-1,0,0, 0xFFCCCC]].forEach(function(position) {
    var light = new THREE.DirectionalLight(position[3]);
    light.position.set(position[0], position[1], position[2]).normalize();
    scene.add(light);
  });

  // Camera...
  var fov    = 45,
      aspect = element.width() / element.height(),
      near   = 1,
      far    = 10000;

    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  //camera.rotationAutoUpdate = true;
  //camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 500;
  //camera.lookAt(scene.position);
  scene.add(camera);
  /*
  controls = new THREE.TrackballControls(camera);
  controls.noPan = true;
  controls.dynamicDampingFactor = 0.15;*/

  // Action!
  function render() {
      var timer = new Date().getTime() * 0.0005;

      renderer.render(scene, camera);

    requestAnimationFrame(render); // And repeat...
  }
  render();

  // Fix coordinates up if window is resized.
  $(window).on('resize', function() {
    renderer.setSize(element.width(), element.height());
    camera.aspect = element.width() / element.height();
    camera.updateProjectionMatrix();
    /*controls.screen.width = window.innerWidth;
    controls.screen.height = window.innerHeight;*/
  });

  return scene;
}
/*
function onMouseMove( event ) {



    event.preventDefault();
        var theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 )
            + onMouseDownTheta;
        var phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 )
            + onMouseDownPhi;

        var phi = Math.min( 180, Math.max( 0, phi ) );

        camera.position.x = radious * Math.sin( theta * Math.PI / 360 )
            * Math.cos( phi * Math.PI / 360 );
        camera.position.y = radious * Math.sin( phi * Math.PI / 360 );
        camera.position.z = radious * Math.cos( theta * Math.PI / 360 )
            * Math.cos( phi * Math.PI / 360 );
        camera.updateMatrix();



    var mouse3D = projector.unprojectVector(
        new THREE.Vector3(
            ( event.clientX / renderer.domElement.width ) * 2 - 1,
            - ( event.clientY / renderer.domElement.height ) * 2 + 1,
            0.5
        ),
        camera
    );
    ray.direction = mouse3D.subSelf( camera.position ).normalize();

    interact();
    render();

}*/
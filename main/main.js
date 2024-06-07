import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let camera, scene, renderer, group, container, randomColor, mouseX, mouseY;

let composer, fxaaPass, afterimagePass;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let spheres = [];
let INTERSECTED;

const clock = new THREE.Clock();

init();
animate();

function init() {

  // select DOM element that will be used to render scene
  container = document.getElementById( 'container' );

  document.addEventListener( 'mousemove', onMouseMove, false );
  document.querySelectorAll('body :not(input):not(button)').forEach((item) => {
    item.addEventListener('click', onClick, false);
  });

  // create a camera using the container for dimensions & set its position
  camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 2000 );
  camera.position.set(0, 0, 125);

  // create a scene, no background, add fog - helps provide perspective
  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2( 0x000000, 0.009 );

  // create lighting
  const hemiLight = new THREE.HemisphereLight( 0x6499FF, 0x6499FF, 1 );
  hemiLight.position.set( 0, 1000, 0 );

  const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( - 3000, 1000, - 1000 );
  scene.add( dirLight, hemiLight );

  // create a group to store the generated three objects
  group = new THREE.Group();

  const center = new THREE.Vector3(0, 0, 0); // central point

  // create objects
  for ( let i = 0; i < 100; i ++ ) {

    // make cubes
    const geometry = new THREE.SphereGeometry(0.6);
    const material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );

    // random coordinates generated and positions set
    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(60));
    mesh.position.set(x, y, z);
    mesh.rotation.set(x, y, z);

    // scale object
    if (i % 2 == 0) {
      mesh.scale.setScalar( Math.random() * 2 );
    }
    else {
      mesh.scale.setScalar( Math.random() * 4 );
    }


    // set colours
    if (i % 3 == 0) {
      mesh.material.color.setHex(0x2C446C);
    }
    else {
      mesh.material.color.setHex(0xFFFFFF);
    }
    // add objects to the group
    group.add(mesh);

    spheres.push(mesh);

    // create line material
    const lineMaterial = new THREE.LineBasicMaterial({color: 0x2C446C, transparent: true, opacity: 0.5});

    // create geometry for the line to connect cube and central point
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, z), center]);

    // create line
    const line = new THREE.Line(lineGeometry, lineMaterial);

    group.add(line);
  }

  // add group to the scene
  scene.add(group);

  // create renderer
  renderer = new THREE.WebGLRenderer({alpha: true});
  renderer.setClearColor (0xff0000, 1);
  renderer.autoClear = false;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild( renderer.domElement );

  // post processing
  const renderPass = new RenderPass( scene, camera );
  renderPass.clearColor = new THREE.Color( 0, 0, 0 );
  renderPass.clearAlpha = 0;
  
  // after image - trail effect
  afterimagePass = new AfterimagePass();
  afterimagePass.uniforms[ 'damp' ].value = 0.8;

  // bloom
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.9, 0.85 );
  bloomPass.threshold = 0;
  bloomPass.strength = 1.3;
  bloomPass.radius = 0.1;
  renderer.toneMappingExposure = 1.5;

  // FXAA
  fxaaPass = new ShaderPass( FXAAShader );
  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
	fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );

  // composers, pass on the post processing effects
  composer = new EffectComposer( renderer );
  composer.addPass( renderPass );
  composer.addPass( fxaaPass );
  composer.addPass( afterimagePass );
  composer.addPass( bloomPass );

  // event listeners for window resize and mouse movement
  window.addEventListener( 'resize', onWindowResize );
  document.addEventListener('mousemove', animateParticles);
}

function onClick( event ) {

  var clientX, clientY;

  clientX = event.clientX;
  clientY = event.clientY;

  mouse.x = ( clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );
  const intersects = raycaster.intersectObjects( spheres );

  if (intersects.length > 0) {
    intersects[0].object.material.color.set(Math.random() * 0xFFFFFF);
  }
}

function onMouseMove( event ) {

  mouseX = event.clientX;
  mouseY = event.clientY;

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  let intersects = raycaster.intersectObjects( spheres, true );

  if ( intersects.length > 0 ) {
      if ( INTERSECTED != intersects[ 0 ].object ) {
          if ( INTERSECTED ) { // Scale back to original if not being hovered
              INTERSECTED.scale.set( INTERSECTED.currentScale.x, INTERSECTED.currentScale.y, INTERSECTED.currentScale.z );
          }

          INTERSECTED = intersects[ 0 ].object;
          INTERSECTED.currentScale = INTERSECTED.scale.clone();
          INTERSECTED.scale.multiplyScalar(3);
      }
  } else {
      if ( INTERSECTED ) { // Scale back to original
          INTERSECTED.scale.set( INTERSECTED.currentScale.x, INTERSECTED.currentScale.y, INTERSECTED.currentScale.z );
      }
      INTERSECTED = null;
  }
}

// animation on mouse movement
function animateParticles(event) {
  mouseY = event.clientY;
  mouseX = event.clientX;
}

// window resize
function onWindowResize() {

  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( container.offsetWidth, container.offsetHeight );
  composer.setSize( container.offsetWidth, container.offsetHeight );

  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
}

// animate the scene
function animate() {

  const elapsedTime = clock.getElapsedTime()

  requestAnimationFrame( animate );

  group.rotation.y += 0.0005;
  group.rotation.z += 0.0007;
  group.rotation.x += - 0.0003;

  const isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

  // only rotate in animate function if not on a touch device
  if (!isTouchDevice && mouseX > 0) {
    group.rotation.x = -mouseY * 0.001;
    group.rotation.y = -mouseX * 0.001;
  }

  composer.render();

}
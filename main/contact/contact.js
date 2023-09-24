import './style.css'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let camera, scene, renderer, group, container, randomColor;
let composer, fxaaPass, afterimagePass;
let mouse = {x: 0, y: 0};
const clock = new THREE.Clock();
init();
animate();

function init() {
  container = document.getElementById( 'container' );
  camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 2000 );
  camera.position.set(0, 0, 350);

  scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2( 0x000000, 0.0045 );

  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 1 );
  hemiLight.position.set( 0, 1000, 0 );
  const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  dirLight.position.set( - 3000, 1000, - 1000 );
  scene.add( dirLight, hemiLight );

  group = new THREE.Group();

  for ( let i = 0; i < 150; i ++ ) {
    let geometry;
    if (i % 3 === 0) { 
      geometry = new THREE.BoxGeometry( 2.5, 2.5, 2.5 );
    } else {
      geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    }
    
    const material = new THREE.MeshStandardMaterial( { color: 0xffffff, flatShading: true } );
    const mesh = new THREE.Mesh( geometry, material );

    const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(150));
    mesh.position.set(x, y, z);
    mesh.rotation.set(x, y, z);
    mesh.scale.setScalar( Math.random() * 3 );

    mesh.material.color.setHex(0x7FFFD4);
    if (i % 5 == 0) {
      mesh.material.color.setHex(0xFF1493);
    }

    group.add( mesh );
  }
  scene.add( group );

  renderer = new THREE.WebGLRenderer({alpha: true});
  renderer.setClearColor (0xff0000, 1);
  renderer.autoClear = false;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.toneMapping = THREE.ReinhardToneMapping;
  container.appendChild( renderer.domElement );

  const renderPass = new RenderPass( scene, camera );
  renderPass.clearColor = new THREE.Color( 0, 0, 0 );
  renderPass.clearAlpha = 0;

  afterimagePass = new AfterimagePass();
  afterimagePass.uniforms[ 'damp' ].value = 0.95;

  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = 0;
  bloomPass.strength = 4;
  bloomPass.radius = 0.5;
  renderer.toneMappingExposure = 1.5;

  fxaaPass = new ShaderPass( FXAAShader );
  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );

  composer = new EffectComposer( renderer );
  composer.addPass( renderPass );
  composer.addPass( fxaaPass );
  composer.addPass( afterimagePass );
  composer.addPass( bloomPass );

  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener('mousemove', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });
}

function onWindowResize() {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  composer.setSize( container.offsetWidth, container.offsetHeight );

  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( container.offsetWidth * pixelRatio );
  fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( container.offsetHeight * pixelRatio );
}

function generateRandomColor() {
  let letters = '0123456789ABCDEF';
  let color = '0x';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function animate() {
  const elapsedTime = clock.getElapsedTime();

  scene.rotation.y = mouse.x * 0.12;
  scene.rotation.x = mouse.y * 0.12;

  requestAnimationFrame(animate);
  group.rotation.x += 0.0005;
  group.rotation.z += 0.0004;
  composer.render();
}
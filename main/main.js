import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

let camera, scene, renderer, group, container;
let composer, fxaaPass, afterimagePass;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let spheres = [];

const clock = new THREE.Clock();
const sphereCount = 750; // Number of spheres for a denser globe

// Added variables for hue cycling and mouse movement tracking
let hue = 0;
let lastMouseX = 0;
let lastMouseY = 0;
let mouseDelta = 0;

const minRadius = 0.0005;
const maxRadius = 8;

// **New Addition: Timer to Track Mouse Idle State**
let lastMouseMoveTime = Date.now();
const idleTimeout = 700; // Time in milliseconds to consider as idle

init();
animate();

// Function to generate a random size within the range
function getRandomSize() {
    return Math.random() * (maxRadius - minRadius) + minRadius;
}

function init() {

  // Select DOM element that will be used to render scene
  container = document.getElementById('container');

  document.addEventListener('mousemove', onMouseMove, false);
  document.querySelectorAll('body :not(input):not(button)').forEach((item) => {
    item.addEventListener('click', onClick, false);
  });

  // Create a camera using the container for dimensions & set its position
  camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 1, 2000);
  camera.position.set(0, 0, 230);

  // Create a scene, set background color and add fog for depth
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Black background for better visibility
  scene.fog = new THREE.FogExp2(0x000000, 0.008);

  // Create lighting
  const hemiLight = new THREE.HemisphereLight(0x6499FF, 0x6499FF, 0.6);
  hemiLight.position.set(0, 1000, 0);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(-3000, 1000, -1000);
  scene.add(dirLight, hemiLight);

  // Create a group to store the generated three objects
  group = new THREE.Group();

  // **Updated Sphere Positioning for Random Distribution**
  const globeRadius = 50;
  for (let i = 0; i < sphereCount; i++) {
    // Generate a random point on the sphere using the uniform distribution method
    const u = Math.random();
    const v = Math.random();

    const theta = 2 * Math.PI * u; // Longitude
    const phi = Math.acos(2 * v - 1); // Latitude

    const x = globeRadius * Math.sin(phi) * Math.cos(theta);
    const y = globeRadius * Math.sin(phi) * Math.sin(theta);
    const z = globeRadius * Math.cos(phi);

    // Create spheres with uniform size
    const geometry = new THREE.SphereGeometry(getRandomSize(), 10, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, emissive: 0x112244 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(x, y, z);

    // Slight rotation for depth effect
    mesh.rotation.set(
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2),
      THREE.MathUtils.randFloatSpread(2)
    );

    // Store original position for movement calculations
    mesh.userData = { 
      basePosition: mesh.position.clone(),
      velocity: new THREE.Vector3() // Initialize a velocity vector
    };

    // Add spheres to the group and array
    group.add(mesh);
    spheres.push(mesh);
  }

  // Add group to the scene
  scene.add(group);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.offsetWidth, container.offsetHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // Post processing
  const renderPass = new RenderPass(scene, camera);

  // Afterimage - trail effect
  afterimagePass = new AfterimagePass();
  afterimagePass.uniforms['damp'].value = 0.96;

  // Bloom - to make certain elements glow
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 1, 1);
  bloomPass.threshold = 5; // Adjusted threshold for better glow effect
  bloomPass.strength = 2.5;
  bloomPass.radius = 1.5;
  renderer.toneMappingExposure = 2;

  // FXAA - anti-aliasing
  fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms['resolution'].value.x = 1 / (container.offsetWidth * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (container.offsetHeight * pixelRatio);

  // Setup composer with passes
  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(fxaaPass);
  composer.addPass(afterimagePass);
  composer.addPass(bloomPass);

  // Add orbit controls for better navigation
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 150;
  controls.maxDistance = 450;

  // Event listeners for window resize and mouse movement
  window.addEventListener('resize', onWindowResize);
}

function onClick(event) {
  let clientX = event.clientX;
  let clientY = event.clientY;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(spheres);

  if (intersects.length > 0) {
    // Change color on click
    intersects[0].object.material.color.setHex(Math.random() * 0xFFFFFF);
    intersects[0].object.material.emissive.setHex(Math.random() * 0xFFFFFF);
  }
}

function onMouseMove(event) {
  // Calculate mouse movement delta
  const deltaX = event.clientX - lastMouseX;
  const deltaY = event.clientY - lastMouseY;
  // Calculate the movement speed
  mouseDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // **Update the Mouse Idle Timer**
  lastMouseMoveTime = Date.now();

  // Update last mouse positions
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;

  // Update normalized mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.offsetWidth, container.offsetHeight);
  composer.setSize(container.offsetWidth, container.offsetHeight);

  const pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms['resolution'].value.x = 1 / (container.offsetWidth * pixelRatio);
  fxaaPass.material.uniforms['resolution'].value.y = 1 / (container.offsetHeight * pixelRatio);
}

// **Modified handleInteractions Function**
function handleInteractions() {
  const currentTime = Date.now();
  const timeSinceLastMove = currentTime - lastMouseMoveTime;
  const isMouseIdle = timeSinceLastMove > idleTimeout;

  // Define parameters for interaction
  const interactionRadius = 70; // Radius around the camera where interaction affects spheres
  const maxDisplacement = 150; // Maximum displacement per frame

  // Increment hue for color cycling
  hue += 0.001; // Adjust the speed of cycling here
  if (hue > 1) hue = 0; // Reset hue to keep it within [0,1]

  spheres.forEach(sphere => {
    // Calculate vector from camera to sphere
    const vector = new THREE.Vector3();
    sphere.getWorldPosition(vector);
    const distance = raycaster.ray.distanceToPoint(vector);

    if (!isMouseIdle && distance < interactionRadius) {
      // Apply a random velocity proportional to mouseDelta
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * mouseDelta * 0.01,
        (Math.random() - 0.5) * mouseDelta * 0.01,
        (Math.random() - 0.5) * mouseDelta * 0.01
      );

      // Update sphere's velocity
      sphere.userData.velocity.add(velocity);

      // Limit the velocity to prevent excessive movement
      sphere.userData.velocity.clampLength(0.2, 0.8);

      // Update the sphere's position based on its velocity
      sphere.position.add(sphere.userData.velocity);

      // Gradually reduce velocity to simulate damping
      sphere.userData.velocity.multiplyScalar(0.95);

      // Cycle through colors using HSL based on hue
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      sphere.material.color.lerp(color, 0.05);

      // Increase emissive intensity based on mouseDelta, capped for best visual effect
      const emissiveColor = new THREE.Color().setHSL(hue, 1, THREE.MathUtils.clamp(0.2 + mouseDelta * 0.005, 0.2, 1));
      sphere.material.emissive.lerp(emissiveColor, 0.05);
    }

    // **New Logic: Reset All Spheres When Mouse is Idle**
    if (isMouseIdle) {
      // Smoothly reset to original position
      sphere.position.lerp(sphere.userData.basePosition, 0.05);

      // Smoothly reset velocity
      sphere.userData.velocity.lerp(new THREE.Vector3(), 0.1);

      // Smoothly reset color
      sphere.material.color.lerp(new THREE.Color(0xffffff), 0.05);
      sphere.material.emissive.lerp(new THREE.Color(0x112244), 0.05);
    }
  });

  // Reset mouseDelta after processing
  mouseDelta = 0;
}

// Animate the scene
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Gentle rotation for the globe
  group.rotation.y += 0.0005;
  group.rotation.x += 0.0002;

  // Handle interactions
  handleInteractions();

  // Render the scene with post-processing
  composer.render();
}
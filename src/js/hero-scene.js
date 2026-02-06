import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('hero-canvas');
if (canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8e8);

  const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lighting — bright and even to keep boxes light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
  backLight.position.set(-3, -2, -3);
  scene.add(backLight);

  // Box configurations
  const boxConfigs = [
    { size: [2.0, 2.0, 2.0], pos: [-4.5, 1.5, -2], color: 0xf0f0f0, speed: [0.003, 0.005, 0.002] },
    { size: [1.4, 1.4, 1.4], pos: [3.5, -1.0, -1], color: 0xe8e8e8, speed: [0.005, 0.003, 0.004] },
    { size: [1.8, 1.8, 1.8], pos: [0.5, 2.0, -3], color: 0xf5f5f5, speed: [0.004, 0.006, 0.003] },
    { size: [1.2, 1.2, 1.2], pos: [-2.5, -1.8, 0], color: 0xececec, speed: [0.006, 0.004, 0.005] },
    { size: [1.6, 1.6, 1.6], pos: [5.0, 0.5, -2], color: 0xe5e5e5, speed: [0.003, 0.007, 0.002] },
    { size: [1.0, 1.0, 1.0], pos: [-1.0, -2.5, -1], color: 0xf2f2f2, speed: [0.007, 0.005, 0.006] },
  ];

  const boxes = boxConfigs.map((cfg) => {
    const geometry = new RoundedBoxGeometry(cfg.size[0], cfg.size[1], cfg.size[2], 4, 0.15);
    const material = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.4,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    // Give each box a random initial rotation
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    mesh.userData.speed = cfg.speed;
    scene.add(mesh);
    return mesh;
  });

  // Handle resize
  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    for (const box of boxes) {
      box.rotation.x += box.userData.speed[0];
      box.rotation.y += box.userData.speed[1];
      box.rotation.z += box.userData.speed[2];
    }
    renderer.render(scene, camera);
  }
  animate();
}

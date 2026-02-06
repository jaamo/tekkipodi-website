import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const canvas = document.getElementById("hero-canvas");
if (canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e8e8);

  const camera = new THREE.PerspectiveCamera(
    50,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.z = 12;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Post-processing — bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.clientWidth, canvas.clientHeight),
    0.6, // strength
    0.8, // radius
    0.803 // threshold
  );
  composer.addPass(bloomPass);

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
    // Edge boxes — half off screen, extra large
    {
      size: [6.0, 6.0, 6.0],
      pos: [-15.0, 4.5, -5],
      color: 0xf0f0f0,
      speed: [0.001, 0.0015, 0.0008],
    },
    {
      size: [5.5, 5.5, 5.5],
      pos: [15.5, -4.0, -4],
      color: 0xe8e8e8,
      speed: [0.0015, 0.001, 0.0012],
    },
    {
      size: [5.8, 5.8, 5.8],
      pos: [13.0, 5.5, -6],
      color: 0xe5e5e5,
      speed: [0.001, 0.002, 0.0007],
    },
    {
      size: [5.5, 5.5, 5.5],
      pos: [-14.0, -5.5, -5],
      color: 0xededed,
      speed: [0.0012, 0.001, 0.0015],
    },
    // Outer boxes — large
    {
      size: [3.5, 3.5, 3.5],
      pos: [-10.0, -3.0, -3],
      color: 0xececec,
      speed: [0.0018, 0.0012, 0.0015],
    },
    {
      size: [3.2, 3.2, 3.2],
      pos: [10.5, 2.5, -3],
      color: 0xf5f5f5,
      speed: [0.0012, 0.0018, 0.001],
    },
    {
      size: [3.0, 3.0, 3.0],
      pos: [-11.0, 7.0, -4],
      color: 0xeaeaea,
      speed: [0.0015, 0.0012, 0.001],
    },
    {
      size: [3.3, 3.3, 3.3],
      pos: [11.5, -6.5, -4],
      color: 0xefefef,
      speed: [0.001, 0.0015, 0.0018],
    },
    // Mid boxes — medium
    {
      size: [2.0, 2.0, 2.0],
      pos: [-6.0, 2.0, -2],
      color: 0xf2f2f2,
      speed: [0.0015, 0.001, 0.0012],
    },
    {
      size: [1.8, 1.8, 1.8],
      pos: [7.0, -2.0, -2],
      color: 0xebebeb,
      speed: [0.0012, 0.0018, 0.001],
    },
    // Near center — small
    {
      size: [1.2, 1.2, 1.2],
      pos: [-2.5, -2.0, -1],
      color: 0xf3f3f3,
      speed: [0.002, 0.0015, 0.0018],
    },
    {
      size: [1.0, 1.0, 1.0],
      pos: [3.0, 1.5, -1],
      color: 0xf0f0f0,
      speed: [0.0018, 0.002, 0.0012],
    },
  ];

  const isMobile = window.innerWidth <= 768;
  const activeConfigs = isMobile
    ? boxConfigs.filter((_, i) => i % 2 === 0)
    : boxConfigs;

  const sizeScale = isMobile ? 0.5 : 1;

  const boxes = activeConfigs.map((cfg) => {
    const geometry = new RoundedBoxGeometry(
      cfg.size[0] * sizeScale,
      cfg.size[1] * sizeScale,
      cfg.size[2] * sizeScale,
      4,
      0.15
    );
    const material = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.4,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    mesh.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    mesh.userData.speed = cfg.speed;
    scene.add(mesh);
    return mesh;
  });

  // Mouse tracking — subtle camera orbit
  const mouse = { x: 0, y: 0 };
  const cameraTarget = { x: 0, y: 0 };
  const maxRotation = 0.025; // radians — subtle

  window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Scroll parallax — camera shifts up slower than page scrolls
  let scrollY = 0;
  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.pageYOffset || document.documentElement.scrollTop;
    },
    { passive: true }
  );

  // Handle resize
  function onResize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
  }
  window.addEventListener("resize", onResize);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Smooth camera follow with lerp
    cameraTarget.x += (mouse.x * maxRotation - cameraTarget.x) * 0.05;
    cameraTarget.y += (mouse.y * maxRotation - cameraTarget.y) * 0.05;
    camera.rotation.y = -cameraTarget.x;
    camera.rotation.x = -cameraTarget.y;

    // Scroll parallax — shift camera Y to create slower background movement
    camera.position.y = scrollY * 0.01;

    for (const box of boxes) {
      box.rotation.x += box.userData.speed[0];
      box.rotation.y += box.userData.speed[1];
      box.rotation.z += box.userData.speed[2];
    }
    composer.render();
  }
  animate();
}

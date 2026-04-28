// Replace these filenames if you use different names or locations (assets/ folder recommended)
const PANORAMA = 'assets/pan_render_room1_0002.png'; // equirectangular PNG (you said this is in assets/)
const AUDIO_FILE = 'assets/audio_radio.mp3';       // put your MP3 in assets/ or change path
const VIDEO_FILE = 'assets/tv_video.mp4';          // put your MP4/PNG in assets/ or change path

// Use CDN module imports (no bundler required)
import * as THREE from 'https://esm.sh/three@0.152.0';
import { OrbitControls } from 'https://esm.sh/three@0.152.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('container');
const overlay = document.getElementById('overlay');
const panelTitle = document.getElementById('panel-title');
const panelContent = document.getElementById('panel-content');
const closeBtn = document.getElementById('closeBtn');

// Scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 0.1);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.18;
controls.zoomSpeed = 0.9;
controls.minDistance = 0.1;
controls.maxDistance = 800;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

// Enable zoom and explicit mouse/touch mappings for consistent zoom behaviour
controls.enableZoom = true;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,   // middle wheel / mouse wheel behaviour
  RIGHT: THREE.MOUSE.PAN
};
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN   // two-finger pinch -> dolly (zoom)
};

// ensure the canvas captures gesture events
renderer.domElement.style.touchAction = 'none';

// --- add desktop wheel zoom + two-finger pinch fallback for mobile / touchpad ---
const MIN_FOV = 20;
const MAX_FOV = 90;
const WHEEL_ZOOM_SPEED = 0.02;   // adjust to taste
const PINCH_ZOOM_SPEED = 0.02;   // adjust to taste

// Wheel: use wheel events to change camera.fov (prevents page scroll)
renderer.domElement.addEventListener('wheel', (e) => {
  // prevent page zoom/scroll while over the canvas
  e.preventDefault();
  // e.deltaY > 0 => zoom out, < 0 => zoom in
  camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * WHEEL_ZOOM_SPEED, MIN_FOV, MAX_FOV);
  camera.updateProjectionMatrix();
}, { passive: false });

// Touch pinch fallback (in addition to OrbitControls' handling)
let lastTouchDist = null;
function touchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches.length === 2) {
    lastTouchDist = touchDistance(e.touches);
  }
}, { passive: true });

renderer.domElement.addEventListener('touchmove', (e) => {
  if (e.touches && e.touches.length === 2) {
    // prevent default to stop page pinch-zoom on some browsers
    e.preventDefault();
    const dist = touchDistance(e.touches);
    if (lastTouchDist != null) {
      const delta = lastTouchDist - dist; // positive -> fingers moved closer -> zoom out
      camera.fov = THREE.MathUtils.clamp(camera.fov + delta * PINCH_ZOOM_SPEED, MIN_FOV, MAX_FOV);
      camera.updateProjectionMatrix();
    }
    lastTouchDist = dist;
  }
}, { passive: false });

renderer.domElement.addEventListener('touchend', (e) => {
  if (!e.touches || e.touches.length < 2) lastTouchDist = null;
}, { passive: true });

// Sphere with panorama mapped on inside
const loader = new THREE.TextureLoader();
loader.load(PANORAMA,
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  },
  undefined,
  (err) => {
    console.error('Panorama load error', err);
    panelTitle.textContent = 'Asset load error';
    panelContent.innerHTML = '<p class="muted">Failed to load the panorama. Make sure the filename is correct and the file is placed next to this HTML file.</p>';
    overlay.classList.add('active');
  }
);

// Hotspot definitions (spherical coordinates in degrees)
// theta = longitude (deg), phi = latitude (deg)
const hotspots = [
  {
    id:'books',
    title:'Books — Research Writing',
    theta: -3.5, phi:  -6,
    type:'text',
    content: `<div class="text-scroll">
                <p><strong>Notes on the Past Room —</strong></p>
                <p>Here is a short excerpt of research writing about memory, domestic space and narrative. Replace this text with your full essay or scrollable research notes for the thesis.</p>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer ac turpis at orci cursus pharetra. Curabitur vitae risus purus. Phasellus at urna id lectus pretium commodo. Suspendisse potenti.</p>
              </div>`
  },
  {
    id:'radio',
    title:'Radio — Audio Archive',
    theta: -4.5, phi: -6,
    type:'audio',
    content: AUDIO_FILE
  },
  {
    id:'tv',
    title:'TV — Visual Artifact',
    theta: 7.5, phi: -7,
    type:'video',
    content: VIDEO_FILE
  }
];

// Create hotspot meshes and HTML labels
const hotspotObjects = [];
const labelElements = [];

function sphericalToVector(radius, thetaDeg, phiDeg) {
  const theta = THREE.MathUtils.degToRad(thetaDeg);
  const phi = THREE.MathUtils.degToRad(90 - phiDeg); // convert latitude to phi
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x,y,z);
}

// small canvas texture for sprite dot
function makeDotTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size*0.5, size*0.5, 2, size*0.5, size*0.5, size*0.5);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(110,231,183,0.98)');
  g.addColorStop(0.28, 'rgba(110,231,183,0.3)');
  g.addColorStop(1, 'rgba(110,231,183,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,size,size);
  return new THREE.CanvasTexture(c);
}
const dotTexture = makeDotTexture();

hotspots.forEach(h => {
  const pos = sphericalToVector(498, h.theta, h.phi); // slightly inside sphere radius
  const mat = new THREE.SpriteMaterial({ map: dotTexture, transparent:true, depthTest:false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(18,18,1);
  sprite.position.copy(pos);
  sprite.name = h.id;
  scene.add(sprite);
  hotspotObjects.push(sprite);

  // HTML label
  const label = document.createElement('div');
  label.className = 'hotspot-label';
  label.innerHTML = `<div style="font-weight:600">${h.title.split('—')[0].trim()}</div><div class="muted">${h.title.split('—')[1]?.trim() || ''}</div>`;
  container.appendChild(label);
  labelElements.push({ el: label, data: h, obj: sprite });
});

// Raycaster for clicks/taps
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX ?? (event.touches && event.touches[0].clientX);
  const clientY = event.clientY ?? (event.touches && event.touches[0].clientY);
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = - ((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(hotspotObjects, true);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    const h = hotspots.find(x => x.id === hit.name);
    if (h) openPanel(h);
  }
}
renderer.domElement.addEventListener('pointerdown', onPointerDown, {passive:true});
renderer.domElement.addEventListener('touchstart', onPointerDown, {passive:true});

// Update label positions on render
function updateLabels() {
  labelElements.forEach(item => {
    const vec = item.obj.position.clone();
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = ( - vec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    item.el.style.left = `${x}px`;
    item.el.style.top = `${y}px`;

    // Hide labels behind camera or offscreen
    const visible = vec.z < 1 && vec.z > -1 && vec.x > -1.2 && vec.x < 1.2 && vec.y > -1.2 && vec.y < 1.2;
    if (visible) {
      item.el.classList.add('visible');
    } else {
      item.el.classList.remove('visible');
    }
  });
}

// Panel behaviour
function openPanel(h) {
  panelTitle.textContent = h.title;
  panelContent.innerHTML = ''; // clear
  if (h.type === 'text') {
    panelContent.innerHTML = h.content;
  } else if (h.type === 'audio') {
    panelContent.innerHTML = `<div class="media">
      <p class="muted">Audio artifact from the Past Room</p>
      <audio id="audioPlayer" controls preload="none">
        <source src="${h.content}" />
        Your browser does not support the audio element.
      </audio>
    </div>`;
  } else if (h.type === 'video') {
    const ext = (h.content.split('.').pop() || '').toLowerCase();
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
      panelContent.innerHTML = `<div class="media"><img src="${h.content}" alt="${h.title}"></div>`;
    } else {
      panelContent.innerHTML = `<div class="media">
        <video id="videoPlayer" controls playsinline preload="metadata">
          <source src="${h.content}" />
          Your browser does not support the video element.
        </video>
      </div>`;
    }
  }
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden','false');
}

closeBtn.addEventListener('click', closePanel);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closePanel();
});
function closePanel() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden','true');
  const a = document.getElementById('audioPlayer');
  if (a && !a.paused) a.pause();
  const v = document.getElementById('videoPlayer');
  if (v && !v.paused) v.pause();
}

// Resize handling
window.addEventListener('resize', onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Rendering loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}
animate();

// Small UX improvement: prevent accidental page drag selection when interacting
document.body.style.userSelect = 'none';

// Keyboard escape to close overlay
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePanel();
});
// Replace these filenames if you use different names or locations (assets/ folder recommended)
const PANORAMA = 'assets/pan_render_room1_0002.png'; // equirectangular PNG (you said this is in assets/)
const AUDIO_FILE = 'assets/The Past Room Pt 2.m4a';       // put your MP3 in assets/ or change path
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

// start view: look at theta=0, phi=0 (longitude 0, latitude 0)
camera.lookAt(new THREE.Vector3(1, 0, 0));
controls.update();

// Enable zoom and explicit mouse/touch mappings for consistent zoom behaviour
controls.enableZoom = true;
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.PAN
};
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
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
    title:'Book 1 — Introduction',
    theta: -3.5, phi:  -6,
    type:'text',
    content: `<div class="text-scroll">
      <p><strong>I. Introduction</strong></p>

      <p>Everything has an origin point in time. A person is born somewhere, on a particular day, in a particular weather. A tree falls as a seed onto a patch of ground it didn’t choose. A stretch of land gets eyes on it for the first time—some creature, some traveler—and something shifts, something begins. What makes these origin points interesting is not that they happen, but what happens after: the returning. How many times does a person have to come back to a place before they call it home? How many seasons does a landscape have to absorb before it can hold an inhabitant? My thesis, “2110”, is about this relationship—between land and inhabitant, between climate and shelter, between the deep past and an uncertain future—traced through one house, on one road, in one Iowa city, across the full arc of geological and human time.</p>

      <p>The house is 2110 Blue Lawn Road, Iowa City, Iowa. It is a ranch-style structure, the kind built in the middle of the twentieth century when a particular vision of the American home—modest, horizontal, rooted—was being mass-produced across the country’s interior. It sits on land that was once shallow sea, then glacial till, then prairie, then contested territory, then surveyed and sold at $1.25 an acre by a federal government whose authority over it was premised on a violent dispossession. It has been insulated against cold, painted against decay, mortgaged against risk. It is, in other words, ordinary—which is exactly why it matters. Ordinary houses are where most of human life happens. They are where the politics of land, race, climate, and capital play out at the scale of the individual and the family. They are the unit through which the American Dream has most consistently been measured, promised, and denied.</p>

      <p>I grew up in houses. I know what it feels like to be inside one during a storm—the specific quality of safety that comes from walls and a roof holding against wind and water, against the outside pressing in. That feeling of shelter is one of the oldest and most fundamental human experiences, and it has always been contingent: on the structure’s material integrity, on who could access it, and on the stability of the environment surrounding it. What this thesis argues is that all three of these contingencies are now in flux simultaneously—and that understanding how we arrived here requires going much further back than the mortgage crisis or the New Deal or even the first European settlers, all the way to the Devonian sea floor that built the bedrock beneath Iowa City.</p>

      <p>We are living in a moment of compound disruption. The climate is changing in ways that directly threaten the physical integrity of homes: through intensifying storms, flooding, heat, and the compounding pressures of drought and precipitation extremes. The insurance market, which makes homeownership financially legible, is pulling back from precisely the regions most exposed to these risks. At the same time, for many Americans, homeownership has never been fully accessible: race, income, geography, and policy have all functioned historically—and continue to function—as filters determining who gets to be sheltered and who does not. To ask what happens to our homes as the climate changes is also, necessarily, to ask who has a home to lose.</p>

      <p>The argument of this thesis is that you cannot understand the future of home without understanding the past of land—and that the past of land is simultaneously geological, ecological, and political. These are not separate stories. The Devonian sea made the limestone that made the bedrock. The glaciers made the soil that made the farmland. The farmland made the economic rationale for settlement. The settlement made the legal and financial infrastructure of homeownership. That infrastructure was designed, explicitly and implicitly, to concentrate wealth in the hands of some and withhold it from others. And now climate change is rewriting the terms of that infrastructure in ways that compound those original inequities. The ground beneath the house has always been restless. What is new is that the political and ecological crises are arriving at the same address, at the same time.</p>

      <p>This paper is organized in five sections. The first traces the geological and ecological history of the land that 2110 Blue Lawn Road occupies—from the Devonian to the Holocene—establishing that transformation is the original condition of the land, not a recent emergency. The second examines the human and political history of that same land: the Indigenous communities who built sustainable relationships with it over 13,000 years, the colonial and federal processes that produced the concept of private land ownership, the racial and economic structures that shaped who could access homeownership, and the contemporary convergence of those structures with climate risk. The third looks forward through the lens of a predictive climate model—built on ERA5 reanalysis data and calibrated with CMIP6 projections under the IPCC’s SSP2-4.5 scenario—to speculate on what the house, and the idea of home it represents, might become by 2110. The fourth section describes the installation itself: the three rooms, the mediums, the methodologies, and what the physical and digital experience argues that this paper alone cannot.</p>

      <p>Cornelia Mutel writes of Iowa’s landscape: “We think that we walk on solid ground, that the earth under our feet is inviolable. But this rectangle of land we today call Iowa has always been restless turf. Only the rate of its ceaseless transformation has changed with time.” The same might be said of the idea of home itself. It has never been as stable as it felt from the inside. “2110” is an attempt to make that instability visible—not to produce despair, but to produce a more honest reckoning with what we are trying to protect, who has been excluded from that protection, and what it will take to build something more durable in its place.</p>
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
  },
  {
    id: 'video1',
    title: 'Window 1 — Wagtail',
    theta: -11.5, phi: -2.5,
    type: 'video',
    content: 'assets/wagtail.mp4'
  },
  {
    id: 'video2',
    title: 'Window 2 — Harebells',
    theta: -5, phi: -2.5,
    type: 'video',
    content: 'assets/harebells.mp4'
  },
  {
    id: 'video3',
    title: 'Window 3 — Plant Sways',
    theta: 2.5, phi: -2.5,
    type: 'video',
    content: 'assets/plant_sways.mp4'
  },
  {
    id: 'video4',
    title: 'Window 4 — Field',
    theta: 8.7, phi: -2.5,
    type: 'video',
    content: 'assets/field.mp4'
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

// hovered hotspot id for label visibility
let hoveredHotspotId = null;

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

// show labels only on hover: update hoveredHotspotId on pointer move/leave
function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX;
  const clientY = event.clientY;
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = - ((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(hotspotObjects, true);
  if (intersects.length > 0) {
    hoveredHotspotId = intersects[0].object.name;
    renderer.domElement.style.cursor = 'pointer';
  } else {
    hoveredHotspotId = null;
    renderer.domElement.style.cursor = '';
  }
}
function onPointerLeave() {
  hoveredHotspotId = null;
  renderer.domElement.style.cursor = '';
}
renderer.domElement.addEventListener('pointermove', onPointerMove, {passive:true});
renderer.domElement.addEventListener('mouseleave', onPointerLeave);

// Update label positions on render (position always updated; visibility only when hovered)
function updateLabels() {
  labelElements.forEach(item => {
    const vec = item.obj.position.clone();
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
    const y = ( - vec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
    item.el.style.left = `${x}px`;
    item.el.style.top = `${y}px`;

    // visible on-screen test
    const onScreen = vec.z < 1 && vec.z > -1 && vec.x > -1.2 && vec.x < 1.2 && vec.y > -1.2 && vec.y < 1.2;

    // show label only if hovered AND on-screen
    if (onScreen && hoveredHotspotId === item.data.id) {
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

// --- set initial view to the centroid direction of the hotspots ---
// compute centroid of hotspot positions and point the camera there
(function setInitialViewToHotspots({ animate = true, duration = 600 } = {}) {
  if (hotspotObjects.length === 0) return;

  // compute average position (in world space)
  const avg = new THREE.Vector3(0, 0, 0);
  hotspotObjects.forEach(o => avg.add(o.position));
  avg.divideScalar(hotspotObjects.length);

  // direction from origin toward hotspots centroid
  const dir = avg.clone().normalize();
  const targetPoint = dir.clone().multiplyScalar(10);

  // set controls target immediately
  controls.target.copy(targetPoint);

  if (!animate) {
    camera.lookAt(targetPoint);
    controls.update();
    return;
  }

  // smooth quaternion slerp from current camera orientation to target orientation
  const startQuat = camera.quaternion.clone();
  const tmpCam = camera.clone();
  tmpCam.lookAt(targetPoint);
  const endQuat = tmpCam.quaternion.clone();

  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    THREE.Quaternion.slerp(startQuat, endQuat, camera.quaternion, t);
    controls.target.lerp(targetPoint, t);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

// call it once after hotspots are created
setInitialViewToHotspots({ animate: false });
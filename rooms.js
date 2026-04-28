import * as THREE from 'https://esm.sh/three@0.152.0';
import { OrbitControls } from 'https://esm.sh/three@0.152.0/examples/jsm/controls/OrbitControls.js';

// ── Room definitions ──────────────────────────────────────────────────────────
const ROOMS = [
  {
    id: 'past',
    label: 'The Past Room',
    panorama: 'assets/pan_render_room1_5_0000_0001.png',
    hotspots: [
      {
        id: 'books',
        title: 'Book 1 — Introduction',
        theta: -4.7, phi: -15.2,
        type: 'text',
        content: `<div class="text-scroll">
      <p><strong>I. Introduction</strong></p>

      <p>Everything has an origin point in time. A person is born somewhere, on a particular day, in a particular weather. A tree falls as a seed onto a patch of ground it didn't choose. A stretch of land gets eyes on it for the first time—some creature, some traveler—and something shifts, something begins. What makes these origin points interesting is not that they happen, but what happens after: the returning. How many times does a person have to come back to a place before they call it home? How many seasons does a landscape have to absorb before it can hold an inhabitant? My thesis, "2110", is about this relationship—between land and inhabitant, between climate and shelter, between the deep past and an uncertain future—traced through one house, on one road, in one Iowa city, across the full arc of geological and human time.</p>

      <p>The house is 2110 Blue Lawn Road, Iowa City, Iowa. It is a ranch-style structure, the kind built in the middle of the twentieth century when a particular vision of the American home—modest, horizontal, rooted—was being mass-produced across the country's interior. It sits on land that was once shallow sea, then glacial till, then prairie, then contested territory, then surveyed and sold at $1.25 an acre by a federal government whose authority over it was premised on a violent dispossession. It has been insulated against cold, painted against decay, mortgaged against risk. It is, in other words, ordinary—which is exactly why it matters. Ordinary houses are where most of human life happens. They are where the politics of land, race, climate, and capital play out at the scale of the individual and the family. They are the unit through which the American Dream has most consistently been measured, promised, and denied.</p>

      <p>I grew up in houses. I know what it feels like to be inside one during a storm—the specific quality of safety that comes from walls and a roof holding against wind and water, against the outside pressing in. That feeling of shelter is one of the oldest and most fundamental human experiences, and it has always been contingent: on the structure's material integrity, on who could access it, and on the stability of the environment surrounding it. What this thesis argues is that all three of these contingencies are now in flux simultaneously—and that understanding how we arrived here requires going much further back than the mortgage crisis or the New Deal or even the first European settlers, all the way to the Devonian sea floor that built the bedrock beneath Iowa City.</p>

      <p>We are living in a moment of compound disruption. The climate is changing in ways that directly threaten the physical integrity of homes: through intensifying storms, flooding, heat, and the compounding pressures of drought and precipitation extremes. The insurance market, which makes homeownership financially legible, is pulling back from precisely the regions most exposed to these risks. At the same time, for many Americans, homeownership has never been fully accessible: race, income, geography, and policy have all functioned historically—and continue to function—as filters determining who gets to be sheltered and who does not. To ask what happens to our homes as the climate changes is also, necessarily, to ask who has a home to lose.</p>

      <p>The argument of this thesis is that you cannot understand the future of home without understanding the past of land—and that the past of land is simultaneously geological, ecological, and political. These are not separate stories. The Devonian sea made the limestone that made the bedrock. The glaciers made the soil that made the farmland. The farmland made the economic rationale for settlement. The settlement made the legal and financial infrastructure of homeownership. That infrastructure was designed, explicitly and implicitly, to concentrate wealth in the hands of some and withhold it from others. And now climate change is rewriting the terms of that infrastructure in ways that compound those original inequities. The ground beneath the house has always been restless. What is new is that the political and ecological crises are arriving at the same address, at the same time.</p>

      <p>This paper is organized in five sections. The first traces the geological and ecological history of the land that 2110 Blue Lawn Road occupies—from the Devonian to the Holocene—establishing that transformation is the original condition of the land, not a recent emergency. The second examines the human and political history of that same land: the Indigenous communities who built sustainable relationships with it over 13,000 years, the colonial and federal processes that produced the concept of private land ownership, the racial and economic structures that shaped who could access homeownership, and the contemporary convergence of those structures with climate risk. The third looks forward through the lens of a predictive climate model—built on ERA5 reanalysis data and calibrated with CMIP6 projections under the IPCC's SSP2-4.5 scenario—to speculate on what the house, and the idea of home it represents, might become by 2110. The fourth section describes the installation itself: the three rooms, the mediums, the methodologies, and what the physical and digital experience argues that this paper alone cannot.</p>

      <p>Cornelia Mutel writes of Iowa's landscape: "We think that we walk on solid ground, that the earth under our feet is inviolable. But this rectangle of land we today call Iowa has always been restless turf. Only the rate of its ceaseless transformation has changed with time." The same might be said of the idea of home itself. It has never been as stable as it felt from the inside. "2110" is an attempt to make that instability visible—not to produce despair, but to produce a more honest reckoning with what we are trying to protect, who has been excluded from that protection, and what it will take to build something more durable in its place.</p>
    </div>`
      },
      {
        id: 'radio',
        title: 'Radio — Audio Archive',
        theta: -7.6, phi: -15.1,
        type: 'audio',
        content: 'assets/The Past Room Pt 2.m4a'
      },
      {
        id: 'tv',
        title: 'TV — Visual Artifact',
        theta: 21.5, phi: -17.2,
        type: 'video',
        content: 'assets/tv_video.mp4'
      },
      {
        id: 'video1',
        title: 'Window 1 — Wagtail',
        theta: -21.3, phi: -4.9,
        type: 'video',
        content: 'assets/wagtail.mp4'
      },
      {
        id: 'video2',
        title: 'Window 2 — Harebells',
        theta: -8.2, phi: -4.0,
        type: 'video',
        content: 'assets/harebells.mp4'
      },
      {
        id: 'video3',
        title: 'Window 3 — Plant Sways',
        theta: 6.3, phi: -4.1,
        type: 'video',
        content: 'assets/plant_sways.mp4'
      },
      {
        id: 'video4',
        title: 'Window 4 — Field',
        theta: 20.4, phi: -4.7,
        type: 'video',
        content: 'assets/field.mp4'
      }
    ]
  },
  {
    id: 'present',
    label: 'The Present Room',
    panorama: 'assets/pan_render_room2_1_0000_0001.png',
    hotspots: []
  },
  {
    id: 'future',
    label: 'The Future Room',
    panorama: 'assets/pan_render_room3_1_0000_0001.png',
    hotspots: [
      {
        id: 'screen-left',
        title: 'Page 1',
        theta: -2, phi: 0,   // ← use θ/φ HUD to position on screen
        type: 'link',
        url: 'https://aishaa.net/projects/predictive_model/climate_projection_ssp245.html'
      },
      {
        id: 'screen-right',
        title: 'Page 2',
        theta:  2, phi: 0,   // ← use θ/φ HUD to position on screen
        type: 'link',
        url: 'https://aishaa.net/projects/predictive_model/house_impact.html'
      },
    ]
  }
];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const container   = document.getElementById('container');
const overlay     = document.getElementById('overlay');
const panelTitle  = document.getElementById('panel-title');
const panelContent = document.getElementById('panel-content');
const closeBtn    = document.getElementById('closeBtn');

// ── Scene / camera / renderer ─────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 0, 0.1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// ── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan    = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed  = 0.18;
controls.zoomSpeed    = 0.9;
controls.minDistance  = 0.1;
controls.maxDistance  = 800;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.enableZoom   = true;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches      = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
renderer.domElement.style.touchAction = 'none';

camera.lookAt(new THREE.Vector3(1, 0, 0));
controls.update();

// ── Zoom via FOV (wheel + pinch) ──────────────────────────────────────────────
const MIN_FOV = 20, MAX_FOV = 90;
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.02, MIN_FOV, MAX_FOV);
  camera.updateProjectionMatrix();
}, { passive: false });

let lastTouchDist = null;
function touchDistance(touches) {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches?.length === 2) lastTouchDist = touchDistance(e.touches);
}, { passive: true });
renderer.domElement.addEventListener('touchmove', (e) => {
  if (e.touches?.length === 2) {
    e.preventDefault();
    const dist = touchDistance(e.touches);
    if (lastTouchDist != null) {
      camera.fov = THREE.MathUtils.clamp(camera.fov + (lastTouchDist - dist) * 0.02, MIN_FOV, MAX_FOV);
      camera.updateProjectionMatrix();
    }
    lastTouchDist = dist;
  }
}, { passive: false });
renderer.domElement.addEventListener('touchend', (e) => {
  if (!e.touches || e.touches.length < 2) lastTouchDist = null;
}, { passive: true });

// ── Panorama sphere (texture swapped on room change) ──────────────────────────
const loader = new THREE.TextureLoader();
const sphereMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
const sphere = new THREE.Mesh(new THREE.SphereGeometry(500, 60, 40), sphereMat);
scene.add(sphere);

function loadPanorama(path) {
  loader.load(path, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    if (sphereMat.map) sphereMat.map.dispose();
    sphereMat.map = texture;
    sphereMat.needsUpdate = true;
  }, undefined, (err) => {
    console.error('Panorama load error', err);
  });
}

// ── Hotspot helpers ───────────────────────────────────────────────────────────
function sphericalToVector(radius, thetaDeg, phiDeg) {
  const theta = THREE.MathUtils.degToRad(thetaDeg);
  const phi   = THREE.MathUtils.degToRad(90 - phiDeg);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function makeDotTexture() {
  const size = 64, c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size * 0.5, size * 0.5, 2, size * 0.5, size * 0.5, size * 0.5);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(110,231,183,0.98)');
  g.addColorStop(0.28, 'rgba(110,231,183,0.3)');
  g.addColorStop(1,    'rgba(110,231,183,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const dotTexture = makeDotTexture();

let hotspotObjects  = [];
let labelElements   = [];
let currentHotspots = [];

function clearHotspots() {
  hotspotObjects.forEach(s => scene.remove(s));
  labelElements.forEach(item => item.el.remove());
  hotspotObjects  = [];
  labelElements   = [];
  currentHotspots = [];
}

function buildHotspots(hotspots) {
  currentHotspots = hotspots;
  hotspots.forEach(h => {
    const pos = sphericalToVector(498, h.theta, h.phi);
    const mat = new THREE.SpriteMaterial({ map: dotTexture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(18, 18, 1);
    sprite.position.copy(pos);
    sprite.name = h.id;
    scene.add(sprite);
    hotspotObjects.push(sprite);

    const label = document.createElement('div');
    label.className = 'hotspot-label';
    label.innerHTML = `<div style="font-weight:600">${h.title.split('—')[0].trim()}</div><div class="muted">${h.title.split('—')[1]?.trim() || ''}</div>`;
    container.appendChild(label);
    labelElements.push({ el: label, data: h, obj: sprite });
  });
}

// ── Raycaster ─────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
let hoveredHotspotId = null;

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.clientX ?? event.touches?.[0].clientX;
  const clientY = event.clientY ?? event.touches?.[0].clientY;
  pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(hotspotObjects, true)[0];
  if (hit) {
    const h = currentHotspots.find(x => x.id === hit.object.name);
    if (!h) return;
    if (h.type === 'link') {
      window.open(h.url, '_blank', 'noopener');
    } else {
      openPanel(h);
    }
  }
}
renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });
renderer.domElement.addEventListener('touchstart',  onPointerDown, { passive: true });

function onPointerMove(event) {
  const clientX = event.clientX, clientY = event.clientY;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(hotspotObjects, true)[0];
  hoveredHotspotId = hit ? hit.object.name : null;
  renderer.domElement.style.cursor = hit ? 'pointer' : '';
  updateCoordsFromPointer(clientX, clientY);
}
function onPointerLeave() {
  hoveredHotspotId = null;
  renderer.domElement.style.cursor = '';
  coordHUD.style.display = 'none';
}
renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
renderer.domElement.addEventListener('mouseleave',  onPointerLeave);
renderer.domElement.addEventListener('touchmove', (e) => {
  updateCoordsFromPointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

// ── Label update loop ─────────────────────────────────────────────────────────
function updateLabels() {
  labelElements.forEach(item => {
    const vec = item.obj.position.clone().project(camera);
    item.el.style.left = `${(vec.x *  0.5 + 0.5) * renderer.domElement.clientWidth}px`;
    item.el.style.top  = `${(vec.y * -0.5 + 0.5) * renderer.domElement.clientHeight}px`;
    const onScreen = vec.z < 1 && vec.z > -1 && Math.abs(vec.x) < 1.2 && Math.abs(vec.y) < 1.2;
    item.el.classList.toggle('visible', onScreen && hoveredHotspotId === item.data.id);
  });
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function openPanel(h) {
  panelTitle.textContent = h.title;
  if (h.type === 'text') {
    panelContent.innerHTML = h.content;
  } else if (h.type === 'audio') {
    panelContent.innerHTML = `<div class="media">
      <p class="muted">Audio artifact from the Past Room</p>
      <audio id="audioPlayer" controls preload="none"><source src="${h.content}" /></audio>
    </div>`;
  } else if (h.type === 'video') {
    const ext = h.content.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','webp'].includes(ext)) {
      panelContent.innerHTML = `<div class="media"><img src="${h.content}" alt="${h.title}"></div>`;
    } else {
      panelContent.innerHTML = `<div class="media">
        <video id="videoPlayer" controls playsinline preload="metadata"><source src="${h.content}" /></video>
      </div>`;
    }
  }
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
}

closeBtn.addEventListener('click', closePanel);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
function closePanel() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.getElementById('audioPlayer')?.pause();
  document.getElementById('videoPlayer')?.pause();
}
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Render loop ───────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}
animate();
document.body.style.userSelect = 'none';

// ── Initial camera orientation toward hotspot centroid ────────────────────────
function setInitialViewToHotspots({ animated = false, duration = 600 } = {}) {
  if (hotspotObjects.length === 0) return;
  const avg = new THREE.Vector3();
  hotspotObjects.forEach(o => avg.add(o.position));
  avg.divideScalar(hotspotObjects.length);
  const targetPoint = avg.clone().normalize().multiplyScalar(10);
  controls.target.copy(targetPoint);
  if (!animated) { camera.lookAt(targetPoint); controls.update(); return; }
  const startQuat = camera.quaternion.clone();
  const tmpCam = camera.clone(); tmpCam.lookAt(targetPoint);
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
}

// ── Room switching ────────────────────────────────────────────────────────────
let currentRoomIdx = 0;

function switchRoom(idx) {
  if (idx === currentRoomIdx) return;
  const room = ROOMS[idx];
  if (!room.panorama) return;
  currentRoomIdx = idx;
  navBar.querySelectorAll('.room-btn').forEach((btn, i) => btn.classList.toggle('active', i === idx));
  closePanel();
  clearHotspots();
  loadPanorama(room.panorama);
  buildHotspots(room.hotspots);
  setInitialViewToHotspots({ animated: true });
}

// ── Room nav bar ──────────────────────────────────────────────────────────────
const navBar = document.createElement('div');
navBar.id = 'room-nav';
ROOMS.forEach((room, idx) => {
  const btn = document.createElement('button');
  btn.className = 'room-btn' + (idx === 0 ? ' active' : '');
  btn.textContent = room.label;
  if (!room.panorama) btn.disabled = true;
  btn.addEventListener('click', () => switchRoom(idx));
  navBar.appendChild(btn);
});
document.body.appendChild(navBar);

// ── Theta/phi HUD (follows cursor) ───────────────────────────────────────────
const coordHUD = document.createElement('div');
coordHUD.id = 'coordHUD';
coordHUD.style.cssText = [
  'position:fixed', 'top:0', 'left:0',
  'padding:6px 10px',
  'background:rgba(0,0,0,0.72)',
  'color:#6ee7b7',
  'font-family:Inter,Roboto,system-ui,sans-serif',
  'font-size:12px', 'line-height:1.4', 'border-radius:6px',
  'z-index:9999', 'pointer-events:none', 'white-space:nowrap',
  'display:none', 'transform:translate(14px,14px)'
].join(';');
document.body.appendChild(coordHUD);

function updateCoordsFromPointer(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
    coordHUD.style.display = 'none'; return;
  }
  pointer.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
  pointer.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const dir = raycaster.ray.direction.clone().normalize();
  const thetaDeg = THREE.MathUtils.radToDeg(Math.atan2(dir.z, dir.x));
  const phiDeg   = 90 - THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)));
  coordHUD.innerHTML = `θ: ${thetaDeg.toFixed(1)}°  φ: ${phiDeg.toFixed(1)}°`;
  coordHUD.style.display = 'block';
  coordHUD.style.left = clientX + 'px';
  coordHUD.style.top  = clientY + 'px';
}

// ── Boot: load first room ─────────────────────────────────────────────────────
loadPanorama(ROOMS[0].panorama);
buildHotspots(ROOMS[0].hotspots);
setInitialViewToHotspots();

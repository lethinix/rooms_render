import * as THREE from 'https://esm.sh/three@0.152.0';
import { OrbitControls } from 'https://esm.sh/three@0.152.0/examples/jsm/controls/OrbitControls.js';

const DEV_MODE = new URLSearchParams(window.location.search).has('dev');
const IS_TOUCH  = window.matchMedia('(hover: none)').matches;

// ── Room definitions ──────────────────────────────────────────────────────────
const ROOMS = [
  {
    id: 'past',
    label: 'The Past Room',
    panorama: 'assets/room1_new7.png',
    initialView: { theta: -3.2, phi: -23.3 },
    hotspots: [
      {
        id: 'books',
        title: 'Book 1 — The Past',
        theta: -4.7, phi: -33.8,
        type: 'text',
        content: `<div class="text-scroll">
      <p><strong>The Past</strong></p>
      <p>Iowa's landscape begins in the sea. During the Devonian period which took place 419 to 359 million years ago, the land that is now the midwest was submerged under a shallow, warm tropical ocean, filled with ancient fish, sea worms, brachiopods, crinoids, and colonial corals. As this era closed, it left behind limestone and sedimentary bedrock that now sits thousands of feet beneath Iowa's farmland, compressed evidence of a world that no longer exists. In the town 2110 Blue Lawn Road lives, there exists a Devonian fossil gorge that makes this history visible; a more than 300-million-year-old seafloor exposed at the surface, still bearing the impressions of creatures that predate the dinosaurs.</p>
      <p>What followed was a cycle of advance and retreat. Seas moved back and forth across the continent for roughly 500 million years, leaving behind limestone, shale, and sedimentary rock that built up into thousands of feet of thickness. Then came the glaciers. Beginning around 2.5 million years ago, continental ice sheets moved south across Iowa over and over again, each advance scraping the surface flat, filling crevices, and carrying boulders from the north. Their retreat deposited loess–wind-blown silt that piled up to 600 feet deep in places–and created the rolling hills, river valleys, and dark, fertile soils that compose Iowa's landscape today. Iowa City itself sits on glacial till: the land was flattened by the last glacier, its bedrock a mix of Mississippian and Devonian limestone from a nearly 100-million-year time span.</p>
      <p>The first known humans arrived in Iowa approximately 13,000 years ago. These groups consisted of small tribes likely migrating from northeastern Asia in pursuit of large animal herds like camels, mammoths, bison, horses. Over thousands of years these communities shifted from big-game hunting to woodland culture to agriculture, cultivating squash, gourds, sunflowers, and corn along the river bottoms. By 8,000 years ago, the prairie had returned to what is now Iowa City, and by 1,000 years ago, tribal societies had established permanent villages with trade networks reaching as far as Cahokia in modern-day St. Louis. The Ioway tribe gave the state its name; in 1700 an estimated 1,000 Ioway people lived in Iowa.</p>
      <p>Burial mounds along the Iowa River in Johnson County, including the Aicher Mound Group with excavation beginning in 1863, are among the most tangible records of this civilization. The mounds, built from the same Pleistocene loess that makes up the county's farmland, contained burials arranged in seated or bent positions, covered with wood ash before earth was placed on top. Among the artifacts recovered was a Mississippian hooded bottle–a hand-modeled ceramic vessel whose decorative markings reflect belief systems associated with the duality of life, death, and rebirth. This decorated and carefully placed item is one of the longest-curated archaeological artifacts in Iowa.</p>
      <p>European colonization began in the 1670s, when French explorers entered the region. The French introduced trade networks that indigenous communities became increasingly dependent on. They eventually applied pressure, including military threat, that forced the Sauk and Meskwaki tribes westward into Iowa in the 1730s. By the early 1800s, the U.S. government was systematically removing Native American land rights. Iowa opened to pioneer settlement in 1833 through the Black Hawk Purchase, which forced the Sauk and Meskwaki out of eastern Iowa. The land was surveyed between 1836 and 1859 and sold at $1.25 per acre, or granted through military warrants, which accounted for 40% of Iowa's land transfers. Settlers formed claim associations that protected their illegal squatting with the threat of violence, effectively writing the first chapter of American homeownership policy: organized, armed, and exclusionary.</p>
      <p>The political economy of homeownership solidified over the following century. From 1890 to 1930, the national homeownership rate held steady at around 46.5%, kept low by difficult mortgage terms with maximum loan-to-value ratios of 50%, 5 to 10 year maturities, and little amortization. The Great Depression intercepted this system; with nearly a quarter of Americans unemployed, banks failing, and foreclosures rising, the federal government intervened. The Federal Home Loan Bank Act, the Home Owner's Loan Corporation, and the Federal Housing Administration (1934) together introduced the long-term, fixed-rate, self-amortizing mortgage that made mass homeownership possible. The GI Bill of 1944 extended these benefits to veterans, and homeownership rose from 43.6% in 1940 to 61.9% in 1960.</p>
      <p>However, this increased access to home ownership was not equal. In 1870, only 7% of Black household heads owned land, and that gap never closed. In cotton-intensive counties, sharecropping and tenancy systems backed by hostile law and credit structures prevented Black men from ascending into property ownership even when they might otherwise have qualified. The postwar mortgage expansion, which was the same system that built the American middle class, largely excluded Black families either explicitly through redlining or implicitly through the geography and financing of new suburban development. By 2010, Iowa's homeownership rate was 72.1%, and 95.3% of Iowa's homeowners were white, non-Hispanic, in a state population that was 89% white. The house at 2110 Blue Lawn Road is a product of this history too.</p>
      <p>Some of the earliest maps of urbanization in Iowa City come from insurance companies. The Sanborn Fire Maps, created to help insurers assess liability in urbanized areas, documented building layouts, materials, and risk in unprecedented detail. They are an early version of something this project returns to at the end: the relationship between home, risk, and who bears the cost of both.</p>
    </div>`
      },
      {
        id: 'radio',
        title: 'Radio — Audio Archive',
        theta: -7.6, phi: -34.3,
        type: 'audio',
        content: 'assets/The Past Room Pt 2.m4a'
      },
      {
        id: 'tv',
        title: 'Video 1 - Glaciers and Oceans',
        theta: 19.7, phi: -37.3,
        type: 'video',
        content: 'assets/glacial_script.mp4'
      },
      {
        id: 'video1',
        title: 'Window 1',
        theta: -18.7, phi: -26.5,
        type: 'video',
        content: 'assets/prarie_script.mp4',
        startTime: 0, endTime: 61, nextHotspotId: 'video2'
      },
      {
        id: 'video2',
        title: 'Window 2',
        theta: -7.3, phi: -25.8,
        type: 'video',
        content: 'assets/prarie_script.mp4',
        startTime: 59, endTime: 122, nextHotspotId: 'video3'
      },
      {
        id: 'video3',
        title: 'Window 3',
        theta: 6.0, phi: -25.4,
        type: 'video',
        content: 'assets/prarie_script.mp4',
        startTime: 108, endTime: 239, nextHotspotId: 'video4'
      },
      {
        id: 'video4',
        title: 'Window 4',
        theta: 18.8, phi: -26.5,
        type: 'video',
        content: 'assets/prarie_script.mp4',
        startTime: 240, endTime: 318
      }
    ]
  },
  {
    id: 'present',
    label: 'The Present Room',
    panorama: 'assets/room2_new3.png',
    initialView: { theta: -3.2, phi: -23.3 },
    hotspots: [
      {
        id: 'books2',
        title: 'Book 2 — The Present',
        theta: 12.6, phi: -30.1,
        type: 'text',
        content: `<div class="text-scroll">
      <p><strong>The Present</strong></p>
      <p>Out of geological time, indigenous civilization, colonization, federal housing policy, and the specific texture of Iowa City's development, a ranch-style house was built at 2110 Blue Lawn Road. It stands today as a result of everything that happened before it. It is clad in painted Southern Yellow Pine or Ponderosa Pine siding (the standard exterior cladding for Midwestern homes of its era) and its structure performs the work all houses perform: keeping weather out, keeping inhabitants in, maintaining conditions adequate for human life.</p>
      <p>Today, that task is getting harder. Since the mid-2010s, the U.S. insurance market has experienced more financially damaging years than profitable ones, with premiums rising as high as 50% in some markets and coverage being reduced or withdrawn entirely from areas once considered low-risk–including Iowa, Arkansas, and Utah. In 2023, insurers reported major losses on homeowners' policies in 18 states, driven by stronger and more frequent natural disasters compounded by a migration of Americans into hazard-prone areas. When insurers leave, the downstream effects are significant: without private insurance new buyers cannot access traditional mortgages, current homeowners face non-renewal, and landlords pass increased costs on to renters or allow properties to deteriorate.</p>
      <p>For renters and lower-income homeowners, who may already be disproportionately concentrated in areas of highest climate risk, this creates a compounding vulnerability. The same communities that were excluded from the wealth-building machinery of postwar homeownership are now most exposed to the wealth-destroying machinery of climate change. The house at 2110 Blue Lawn Road sits at the intersection of these pressures: a structure shaped by history, now facing a future it was not designed for.</p>
    </div>`
      }
    ]
  },
  {
    id: 'future',
    label: 'The Future Room',
    panorama: 'assets/room3_new.png',
    initialView: { theta: -3.2, phi: -23.3 },
    screen: {
      src: 'assets/house_model.mov',
      opacity: 0.5,
      corners: [
        { theta: -5.6, phi:  -20.9 },   // top-left
        { theta:  4.4, phi:  -20.8 },   // top-right
        { theta:  -5.7, phi: -26.0 },   // bottom-left
        { theta: 4.6, phi: -25.9 },   // bottom-right

        
      ]
    },
    hotspots: [
      {
        id: 'books3',
        title: 'Book 3 — The Future',
        theta: 12.9, phi: -29.6,
        type: 'text',
        content: `<div class="text-scroll">
      <p><strong>The Future: What the Model Shows</strong></p>
      <p>The predictive model built for this project has two components. The first uses machine learning trained on ERA5 reanalysis data (ECMWF's fifth-generation global climate record, running from 1940 to present) to learn the statistical patterns in Iowa City's historical weather and generate day-level predictions. The second uses a physics-based approach to project conditions in 2075 and 2110, drawing on CMIP6 outputs from three high-resolution models (EC-Earth3P-HR, MPI-ESM1-2-XR, and MRI-AGCM3-2-S) for the near-term window, and IPCC AR6 delta scaling under the SSP2-4.5 scenario. This scenario is considered the 'middle of the road' pathway, and is the one most commonly used in climate adaptation planning for the long range.</p>
      <p>The SSP2-4.5 scenario projects roughly 2.4°C of global warming by 2100, consistent with current policy trajectories. For Iowa City specifically, this translates to approximately 4 to 5°F warmer summers, more intense precipitation events, longer drought periods between rain events, and more frequent severe thunderstorm conditions. The Clausius-Clapeyron relationship, which says warmer air holds approximately 7% more water vapor per degree Celsius, means that when it does rain, storms can release significantly more water at once. The model applies a precipitation intensity multiplier to reflect this physical relationship, producing storm events in 2110 that are meaningfully more severe than those in the historical baseline.</p>
      <p>These climate projections are then applied to the material lifecycle of the house. Treated pine siding in the Midwest is already subject to significant stress from freeze-thaw cycles, moisture infiltration, and UV degradation; under projected 2110 conditions, the frequency and severity of those stress events increases substantially. The model traces the implications for structural integrity, maintenance cycles, and the cost of keeping the house functional as a shelter–the same function it has always performed, now requiring more to sustain.</p>
      <p>The findings are not catastrophic in the sense of predicting collapse. They are quieter than that; they indicate potential for a steady increase in the maintenance burden, the insurance cost, the energy required to maintain interior conditions, and the probability of damage events that exceed what the structure was built to handle. The house will likely still be standing in 2110. What remains uncertain is whether, and for whom, it will still be home.</p>
    </div>`
      },
      {
        id: 'screen-left',
        title: 'Page 1',
        theta: -2.5, phi: -23.3,
        type: 'link',
        url: 'predictive_model/climate_projection_ssp245.html',
        loadingText: 'data loading...'
      },
      {
        id: 'screen-right',
        title: 'Page 2',
        theta: 2.5, phi: -23.3,
        type: 'link',
        url: 'predictive_model/house_impact.html',
        loadingText: 'house model rendering...'
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
const sphereMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, opacity: 1 });
const sphere = new THREE.Mesh(new THREE.SphereGeometry(500, 60, 40), sphereMat);
scene.add(sphere);

// ── Loading spinner ───────────────────────────────────────────────────────────
const loaderEl = document.createElement('div');
loaderEl.id = 'room-loader';
document.body.appendChild(loaderEl);

function fadeRoom(to, duration = 350, onDone) {
  const from = sphereMat.opacity;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    sphereMat.opacity = from + (to - from) * t;
    if (t < 1) { requestAnimationFrame(step); }
    else { onDone?.(); }
  }
  requestAnimationFrame(step);
}

function loadPanorama(path, onLoaded) {
  loaderEl.classList.add('active');
  loader.load(path, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    if (sphereMat.map) sphereMat.map.dispose();
    sphereMat.map = texture;
    sphereMat.needsUpdate = true;
    loaderEl.classList.remove('active');
    fadeRoom(1, 400);
    onLoaded?.();
  }, undefined, (err) => {
    console.error('Panorama load error', err);
    loaderEl.classList.remove('active');
    fadeRoom(1, 400);
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
  const size = 128, c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size * 0.5, cy = size * 0.5;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.48);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.1,  'rgba(210,255,238,1)');
  g.addColorStop(0.22, 'rgba(110,231,183,0.95)');
  g.addColorStop(0.44, 'rgba(110,231,183,0.38)');
  g.addColorStop(0.72, 'rgba(110,231,183,0.12)');
  g.addColorStop(1,    'rgba(110,231,183,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
const dotTexture = makeDotTexture();

let hotspotObjects    = [];
let labelElements     = [];
let currentHotspots   = [];
let screenMeshes      = [];
let pendingHotspotOpen = null;

function clearScreenMeshes() {
  screenMeshes.forEach(m => {
    scene.remove(m);
    const vid = m.material.map?.image;
    if (vid?.pause) { vid.pause(); vid.removeAttribute('src'); }
    m.material.map?.dispose();
    m.material.dispose();
    m.geometry.dispose();
  });
  screenMeshes = [];
}

function buildScreenVideo({ src, corners, opacity = 0.5 }) {
  const r = 495;
  const [tl, tr, bl, br] = corners.map(c => sphericalToVector(r, c.theta, c.phi));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    tl.x, tl.y, tl.z,
    tr.x, tr.y, tr.z,
    bl.x, bl.y, bl.z,
    br.x, br.y, br.z,
  ]), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
    0, 1,   // TL
    1, 1,   // TR
    0, 0,   // BL
    1, 0,   // BR
  ]), 2));
  geo.setIndex([0, 2, 1,  1, 2, 3]);

  const vid = document.createElement('video');
  vid.src = src;
  vid.loop = true;
  vid.muted = true;
  vid.playsInline = true;
  vid.autoplay = true;
  vid.play().catch(() => {});

  const tex = new THREE.VideoTexture(vid);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 1;
  scene.add(mesh);
  screenMeshes.push(mesh);
}

function clearHotspots() {
  hotspotObjects.forEach(s => scene.remove(s));
  labelElements.forEach(item => { item.el.remove(); });
  hotspotObjects    = [];
  labelElements     = [];
  currentHotspots   = [];
  revealedHotspotId = null;
}

function buildHotspots(hotspots) {
  currentHotspots = hotspots;
  if (pendingHotspotOpen) {
    const id = pendingHotspotOpen;
    pendingHotspotOpen = null;
    setTimeout(() => {
      const h = currentHotspots.find(x => x.id === id);
      if (!h) return;
      if (h.type === 'link') showLinkLoader(h.loadingText || 'loading...', h.url);
      else openPanel(h);
    }, 120);
  }
  hotspots.forEach(h => {
    const pos = sphericalToVector(498, h.theta, h.phi);
    const mat = new THREE.SpriteMaterial({ map: dotTexture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(28, 28, 1);
    sprite.position.copy(pos);
    sprite.name = h.id;
    sprite.renderOrder = 2;
    scene.add(sprite);
    hotspotObjects.push(sprite);

    const label = document.createElement('div');
    label.className = 'hotspot-label';
    const sub = h.title.split('—')[1]?.trim() || '';
    label.innerHTML = `<div style="font-weight:600">${h.title.split('—')[0].trim()}</div>${sub ? `<div class="muted">${sub}</div>` : ''}<div class="label-tap-hint">tap again to open</div>`;
    label.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      revealedHotspotId = null;
      if (h.type === 'link') showLinkLoader(h.loadingText || 'loading...', h.url);
      else openPanel(h);
    });
    container.appendChild(label);

    labelElements.push({ el: label, data: h, obj: sprite });
  });
}

// ── Raycaster ─────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const pointer   = new THREE.Vector2();
let hoveredHotspotId = null;
let revealedHotspotId = null;

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
    if (IS_TOUCH && revealedHotspotId !== h.id) {
      revealedHotspotId = h.id;
      return;
    }
    revealedHotspotId = null;
    if (h.type === 'link') {
      showLinkLoader(h.loadingText || 'loading...', h.url);
    } else {
      openPanel(h);
    }
  } else if (IS_TOUCH) {
    revealedHotspotId = null;
  }
}
renderer.domElement.addEventListener('pointerdown', onPointerDown, { passive: true });

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
    const sx = (vec.x *  0.5 + 0.5) * renderer.domElement.clientWidth;
    const sy = (vec.y * -0.5 + 0.5) * renderer.domElement.clientHeight;
    item.el.style.left    = `${sx}px`;
    item.el.style.top     = `${sy}px`;
    const onScreen = vec.z < 1 && vec.z > -1 && Math.abs(vec.x) < 1.2 && Math.abs(vec.y) < 1.2;
    item.el.classList.toggle('visible', onScreen && (hoveredHotspotId === item.data.id || revealedHotspotId === item.data.id));
  });
}

// ── Panel ─────────────────────────────────────────────────────────────────────
function openPanel(h) {
  panelTitle.textContent = h.title;
  if (h.type === 'text') {
    panelContent.innerHTML = h.content + '<div class="scroll-hint">scroll for more ↓</div>';
    setTimeout(() => {
      const ts = panelContent.querySelector('.text-scroll');
      const hint = panelContent.querySelector('.scroll-hint');
      if (ts && hint) {
        const update = () => { hint.style.opacity = (ts.scrollHeight - ts.scrollTop <= ts.clientHeight + 8) ? '0' : '1'; };
        ts.addEventListener('scroll', update);
        update();
      }
    }, 0);
  } else if (h.type === 'audio') {
    panelContent.innerHTML = `<div class="media">
      <p class="muted">Audio artifact from the Past Room</p>
      <audio id="audioPlayer" controls preload="none"><source src="${h.content}" /></audio>
    </div>`;
    setTimeout(() => {
      const el = document.getElementById('audioPlayer');
      if (!el) return;
      try {
        const AC = window.AudioContext || /** @type {any} */(window).webkitAudioContext;
        const ctx = new AC();
        const src = ctx.createMediaElementSource(el);
        const gain = ctx.createGain();
        gain.gain.value = 3.0;
        src.connect(gain);
        gain.connect(ctx.destination);
        if (ctx.state === 'suspended') ctx.resume();
      } catch(e) {}
    }, 50);
  } else if (h.type === 'video') {
    const ext = h.content.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','webp'].includes(ext)) {
      panelContent.innerHTML = `<div class="media"><img src="${h.content}" alt="${h.title}"></div>`;
    } else {
      panelContent.innerHTML = `<div class="media">
        <video id="videoPlayer" controls playsinline preload="metadata"><source src="${h.content}" /></video>
      </div>`;
      if (h.startTime != null) {
        setTimeout(() => {
          const vid = document.getElementById('videoPlayer');
          if (!vid) return;
          const seek = () => { vid.currentTime = h.startTime; };
          if (vid.readyState >= 1) seek();
          else vid.addEventListener('loadedmetadata', seek, { once: true });
          vid.addEventListener('play', () => {
            if (!userPausedBg) bgAudio.play().catch(() => {});
          });
          if (h.endTime != null) {
            vid.addEventListener('timeupdate', () => {
              if (vid.currentTime >= h.endTime) {
                vid.pause();
                vid.currentTime = h.endTime;
                if (h.nextHotspotId && !document.getElementById('next-video-btn')) {
                  const btn = document.createElement('button');
                  btn.id = 'next-video-btn';
                  btn.className = 'next-video-btn';
                  btn.textContent = 'next video';
                  btn.addEventListener('click', () => {
                    const next = currentHotspots.find(x => x.id === h.nextHotspotId);
                    if (next) openPanel(next);
                  });
                  vid.closest('.media').appendChild(btn);
                }
              }
            });
          }
        }, 0);
      }
    }
  }
  const panelEl = overlay.querySelector('.panel');
  panelEl.classList.toggle('panel--video', h.type === 'video');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

closeBtn.addEventListener('click', closePanel);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });
function closePanel() {
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.getElementById('audioPlayer')?.pause();
  document.getElementById('videoPlayer')?.pause();
  document.body.style.overflow = '';
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
  const pulse = 32 + 22 * Math.abs(Math.sin(Date.now() * 0.002));
  hotspotObjects.forEach(s => s.scale.set(pulse, pulse, 1));
  updateLabels();
  renderer.render(scene, camera);
}
animate();
document.body.style.userSelect = 'none';

function animateCameraTo(targetPoint, duration = 600) {
  const startQuat = camera.quaternion.clone();
  const tmpCam = camera.clone(); tmpCam.lookAt(targetPoint);
  const endQuat = tmpCam.quaternion.clone();
  controls.target.copy(targetPoint);
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    THREE.Quaternion.slerp(startQuat, endQuat, camera.quaternion, t);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

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
  fadeRoom(0, 300, () => {
    clearHotspots();
    clearScreenMeshes();
    buildHotspots(room.hotspots);
    if (room.screen) buildScreenVideo(room.screen);
    if (room.initialView) {
      const t = sphericalToVector(10, room.initialView.theta, room.initialView.phi);
      animateCameraTo(t);
    } else {
      setInitialViewToHotspots({ animated: true });
    }
    loadPanorama(room.panorama);
  });
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

// ── Fullscreen button ─────────────────────────────────────────────────────────
const fsBtn = document.createElement('button');
fsBtn.id = 'fs-btn';
fsBtn.title = 'Toggle fullscreen';
fsBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
fsBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
document.addEventListener('fullscreenchange', () => {
  const inFS = !!document.fullscreenElement;
  fsBtn.innerHTML = inFS
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
});
document.body.appendChild(fsBtn);

// ── Link loading overlay ──────────────────────────────────────────────────────
const linkLoaderEl = document.createElement('div');
linkLoaderEl.id = 'link-loader';
linkLoaderEl.innerHTML = `<div class="link-loader-ring"></div><p class="link-loader-text"></p>`;
document.body.appendChild(linkLoaderEl);

function showLinkLoader(text, url) {
  linkLoaderEl.querySelector('.link-loader-text').textContent = text;
  linkLoaderEl.classList.add('active');
  window.open(url, '_blank', 'noopener');
  setTimeout(() => linkLoaderEl.classList.remove('active'), 2800);
}

window.__2110goto = function(roomIdx, hotspotId) {
  if (roomIdx === currentRoomIdx) {
    const h = currentHotspots.find(x => x.id === hotspotId);
    if (!h) return;
    if (h.type === 'link') showLinkLoader(h.loadingText || 'loading...', h.url);
    else openPanel(h);
  } else {
    pendingHotspotOpen = hotspotId;
    switchRoom(roomIdx);
  }
};

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
  if (!DEV_MODE) return;
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

// ── Background audio ─────────────────────────────────────────────────────────
const bgAudio = document.createElement('audio');
bgAudio.src    = 'assets/thesis_time_audio.mp4';
bgAudio.loop   = true;
bgAudio.volume = 0.22;

const audioBtn = document.createElement('button');
audioBtn.id = 'audio-btn';
audioBtn.setAttribute('aria-label', 'Toggle background music');

function syncAudioBtn() {
  audioBtn.textContent = bgAudio.paused ? '♫' : '⏸';
  audioBtn.classList.toggle('muted', bgAudio.paused);
}
syncAudioBtn();

let userPausedBg = false;
audioBtn.addEventListener('click', () => {
  if (bgAudio.paused) { userPausedBg = false; bgAudio.play(); }
  else                { userPausedBg = true;  bgAudio.pause(); }
});
bgAudio.addEventListener('play',  syncAudioBtn);
bgAudio.addEventListener('pause', syncAudioBtn);

// Try autoplay; fall back to first user interaction
bgAudio.play().catch(() => {
  const startOnce = () => { bgAudio.play().catch(() => {}); };
  window.addEventListener('pointerdown', startOnce, { once: true });
  window.addEventListener('keydown',     startOnce, { once: true });
});

document.body.appendChild(audioBtn);

// ── Boot: load first room ─────────────────────────────────────────────────────
sphereMat.opacity = 0;
loadPanorama(ROOMS[0].panorama);
buildHotspots(ROOMS[0].hotspots);
const initTarget = sphericalToVector(10, -3.2, -23.3);
controls.target.copy(initTarget);
camera.lookAt(initTarget);
controls.update();

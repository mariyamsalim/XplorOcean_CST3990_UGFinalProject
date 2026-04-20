// zone config
const ZONE_CONFIG = {
  sunlight: {
    skyColor:        '#004C6D',
    fogColor:        '#0077B6',
    fogDensity:      0.04,
    flashlight:      0,     
    flashlightAngle: 25,
  },
  twilight: {
    skyColor:        '#021028',
    fogColor:        '#030D1E',
    fogDensity:      0.07,
    flashlight:      1.5,   
    flashlightAngle: 30,
  },
  midnight: {
    skyColor:        '#000000',
    fogColor:        '#000000',
    fogDensity:      0.08,
    flashlight:      20,    
    flashlightAngle: 35,
  },
};

// track active zone
let currentZone = null;

AFRAME.registerComponent('flashlight-follow', {
  tick: function () {
    const cam = document.getElementById('cam');
    const flashlight = document.getElementById('flashlight');
    const target = document.getElementById('flashlight-target');
    if (!cam || !flashlight || !target) return;
    const camWorldPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camWorldPos);

    const camWorldQuat = new THREE.Quaternion();
    cam.object3D.getWorldQuaternion(camWorldQuat);
    flashlight.object3D.position.copy(camWorldPos);
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camWorldQuat);
    forward.multiplyScalar(8);
    target.object3D.position.copy(camWorldPos).add(forward);
  }
});

// transport player to diff zones
function transport(zoneName) {
const config = ZONE_CONFIG[zoneName];
  if (!config) return;

  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('back-btn').style.display = 'block';
  document.body.classList.add('vr-active');

  // hide previous zone
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) prev.setAttribute('visible', false);
  }

  // show new zone
  const next = document.getElementById(zoneName + '-zone');
  if (next) {
    next.setAttribute('visible', true);
    setTimeout(() => {
      const unloadedEntities = next.querySelectorAll('[data-src]');
      console.log('Found entities to load:', unloadedEntities.length);
      unloadedEntities.forEach(el => {
        const modelUrl = el.getAttribute('data-src');
        el.setAttribute('gltf-model', modelUrl);
        el.removeAttribute('data-src'); 
      });

      // restart all animations in this zone
      next.querySelectorAll('[animation]').forEach(el => {
        if(el.components.animation) {
          el.components.animation.beginAnimation();
        }
      });
    }, 100);
  }

  // sky colour
  document.getElementById('main-sky').setAttribute('color', config.skyColor);

  // fog
  const scene = document.querySelector('a-scene');
  scene.setAttribute('fog', `type: exponential; color: ${config.fogColor}; density: ${config.fogDensity}`);

  // flashlight
  flashlight.setAttribute('light',
  `type: spot; color: #FFF5E0; intensity: ${config.flashlight}; distance: 40; angle: ${config.flashlightAngle}; penumbra: 0.1; decay: 1.5; target: #flashlight-target`);
  currentZone = zoneName;
}

// testing scanner
AFRAME.registerComponent('scanner', {
  init: function () {
    this.el.addEventListener('click', () => {
      const d = this.el.dataset;
      document.getElementById('modal-name').textContent  = d.name   || '';
      document.getElementById('modal-sci').textContent   = d.sci    || '';
      document.getElementById('modal-fam').textContent   = d.fam    || '';
      document.getElementById('modal-facts').textContent = d.facts  || '';
      document.getElementById('modal-impact').textContent = d.impact || '';

      const img = document.getElementById('modal-img');
      if (d.img) {
        img.src = d.img;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }

      document.getElementById('scanner-modal').style.display = 'flex';
    });
  },
});

// back to menu
function backToMenu() {
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) prev.setAttribute('visible', false);
    currentZone = null;
  }
 
  // reset sky and fog 
  document.getElementById('main-sky').setAttribute('color', '#004C6D');
  const scene = document.querySelector('a-scene');
  scene.setAttribute('fog', 'type: exponential; color: #0077B6; density: 0.04');
 
  // turn off flashlight
  document.getElementById('flashlight').setAttribute('light',
    'type: spot; intensity: 0; distance: 25; angle: 55; penumbra: 0.8; decay: 1.5');
 
  // show main menu, hide back button and modal
  document.getElementById('landing-page').style.display = 'block';
  document.body.classList.remove('vr-active'); 
  
  document.getElementById('back-btn').style.display  = 'none';
  document.getElementById('scanner-modal').style.display = 'none';

}

// close modal
function closeModal() {
  document.getElementById('scanner-modal').style.display = 'none';
}

// testing sinking fish
AFRAME.registerComponent('sinking-fish', {
  schema: { speed: { type: 'number', default: 0.002 } },
  tick: function () {
    const pos = this.el.getAttribute('position');
    this.el.setAttribute('position', { x: pos.x, y: pos.y - this.data.speed, z: pos.z });
  },
});

AFRAME.registerComponent('floating', {
  schema: {
    amplitude: { type: 'number', default: 0.3 },
    speed:     { type: 'number', default: 0.001 },
    wobble:    { type: 'number', default: 2 },
  },
  init: function () {
    this.baseY    = null; 
    this.baseRotZ = null;
    this.t        = Math.random() * Math.PI * 2;
  },
  tick: function (time, delta) {
    if (this.baseY === null) {
      this.baseY    = this.el.object3D.position.y;
      this.baseRotZ = this.el.object3D.rotation.z;
    }

    this.t += delta * this.data.speed;
    const sine = Math.sin(this.t);

    this.el.object3D.position.y = this.baseY + sine * this.data.amplitude;
    this.el.object3D.rotation.z = this.baseRotZ + (sine * this.data.wobble * Math.PI / 180);
  },
});
document.querySelector('a-assets').addEventListener('timeout', () => {
  console.warn('A-Frame assets timed out!');
});
document.querySelector('a-assets').addEventListener('loaded', () => {
  console.log('All assets loaded successfully.');
});

// modal func
function openGuideModal() {
  document.getElementById('guide-modal').style.display = 'flex';
}

function closeGuideModal() {
  document.getElementById('guide-modal').style.display = 'none';
}

function openSurveyModal() {
  document.getElementById('survey-modal').style.display = 'flex';
}

function closeSurveyModal() {
  document.getElementById('survey-modal').style.display = 'none';
}
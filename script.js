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
    fogDensity:      0.12,
    flashlight:      2.5,    
    flashlightAngle: 22,
  },
};

// track active zone
let currentZone = null;

// transport player to diff zones
function transport(zoneName) {
  const config = ZONE_CONFIG[zoneName];
  if (!config) return;

  // hide menu, show back button
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('back-btn').style.display = 'block';

  // hide previous zone
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) prev.setAttribute('visible', false);
  }

  // show new zone
  const next = document.getElementById(zoneName + '-zone');
  if (next) next.setAttribute('visible', true);

  // sky colour
  document.getElementById('main-sky').setAttribute('color', config.skyColor);

  // fog
  const scene = document.querySelector('a-scene');
  scene.setAttribute('fog', `type: exponential; color: ${config.fogColor}; density: ${config.fogDensity}`);

  // flashlight
  const flashlight = document.getElementById('flashlight');
  flashlight.setAttribute('light', `type: spot; intensity: ${config.flashlight}; distance: 25; angle: ${config.flashlightAngle}; penumbra: 0.8; decay: 1.5`);

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
    'type: spot; intensity: 0; distance: 25; angle: 25; penumbra: 0.8; decay: 1.5');
 
  // show main menu, hide back button and modal
  document.getElementById('main-menu').style.display = 'flex';
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
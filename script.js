// ============================================================
//  XplorOcean — script.js
//  Main application logic for the WebVR ocean simulation.
//
//  Responsibilities:
//    - Zone configuration and transport (switching between zones)
//    - A-Frame custom components (scanner, flashlight-follow,
//      sinking-fish, floating)
//    - Scanner / info-modal population
//    - Guide and survey modal open/close helpers
//    - Asset load event listeners
// ============================================================


// ============================================================
//  ZONE CONFIGURATION
//  One entry per ocean zone. Values are applied by transport()
//  when the player enters that zone.
//
//  flashlight: 0 = off (sunlight zone needs no torch)
// ============================================================
const ZONE_CONFIG = {
  sunlight: {
    skyColor:        '#004C6D',
    fogColor:        '#0077B6',
    fogDensity:      0.04,
    flashlight:      0,       // No flashlight needed — plenty of ambient light
    flashlightAngle: 25,
    audioId:         'sunlight-audio',
  },
  twilight: {
    skyColor:        '#021028',
    fogColor:        '#030D1E',
    fogDensity:      0.07,    // Overridden below to 0.02 so assets stay visible
    flashlight:      1.5,
    flashlightAngle: 30,
    audioId:         'twilight-audio',
  },
  midnight: {
    skyColor:        '#000000',
    fogColor:        '#000000',
    fogDensity:      0.08,    // Overridden below to 0.01 so distant assets are visible
    flashlight:      20,      // Bright flashlight required — near-total darkness
    flashlightAngle: 35,
    audioId:         'midnight-audio',
  },
};


// ============================================================
//  STATE
// ============================================================

// Tracks which zone is currently active (null = on landing page)
let currentZone = null;


// ============================================================
//  A-FRAME COMPONENT: flashlight-follow
//  Runs every tick to keep the spotlight and its look-at target
//  locked to the camera's world position and forward direction.
// ============================================================
AFRAME.registerComponent('flashlight-follow', {
  tick: function () {
    const cam        = document.getElementById('cam');
    const flashlight = document.getElementById('flashlight');
    const target     = document.getElementById('flashlight-target');
    if (!cam || !flashlight || !target) return;

    // Mirror the camera's world position onto the flashlight
    const camWorldPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camWorldPos);
    flashlight.object3D.position.copy(camWorldPos);

    // Place the look-at target 8 units in front of the camera
    const camWorldQuat = new THREE.Quaternion();
    cam.object3D.getWorldQuaternion(camWorldQuat);
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camWorldQuat);
    forward.multiplyScalar(8);
    target.object3D.position.copy(camWorldPos).add(forward);
  }
});


// ============================================================
//  FUNCTION: transport(zoneName)
//  Transitions the player from the landing page (or a previous
//  zone) into the specified ocean zone.
//
//  Steps:
//    1. Show/hide UI chrome
//    2. Apply fog for the zone
//    3. Refresh camera projection matrix
//    4. Hide the previous zone and show the new one
//    5. Lazy-load 3D models (data-src → gltf-model)
//    6. Update sky colour
//    7. Configure the flashlight
//    8. Swap ambient audio
// ============================================================
function transport(zoneName) {
  const config = ZONE_CONFIG[zoneName];
  if (!config) return;

  // 1. UI state — hide the landing page, show the back button
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('back-btn').style.display     = 'block';
  document.body.classList.add('vr-active');

  const scene = document.querySelector('a-scene');

  // 2. Fog — midnight and twilight use reduced density overrides so
  //    their assets remain visible despite the dark colour values.
  if (zoneName === 'midnight') {
    scene.setAttribute('fog', {
      type:    'exponential',
      color:   '#000000',
      density: 0.01,
    });
  } else if (zoneName === 'twilight') {
    scene.setAttribute('fog', {
      type:    'exponential',
      color:   config.fogColor,
      density: 0.02,
    });
  } else {
    scene.setAttribute('fog', `type: exponential; color: ${config.fogColor}; density: ${config.fogDensity}`);
  }

  // 3. Force camera to recalculate its projection matrix after zone change
  const camera = document.getElementById('cam');
  if (camera && camera.components.camera) {
    camera.components.camera.camera.updateProjectionMatrix();
  }

  // 4.1. Hide the previous zone and pause its animations
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) {
      prev.setAttribute('visible', false);
      prev.querySelectorAll('[animation-mixer]').forEach(el => el.pause());
    }
  }

  // 4.2. Show the new zone
  const next = document.getElementById(zoneName + '-zone');
  if (next) {
    next.setAttribute('visible', true);
    next.play();

    // Activate the aframe-environment-component if this zone uses one
    const env = next.querySelector('[environment]');
    if (env) {
      env.setAttribute('environment', 'active', true);
    }

    // Lazy-load: swap data-src → gltf-model on a short delay so the scene has time to become visible before parsing begins.
    setTimeout(() => {
      const entities = next.querySelectorAll('[data-src]');
      entities.forEach(el => {
        const modelUrl = el.getAttribute('data-src');
        if (!el.getAttribute('gltf-model')) {
          el.setAttribute('gltf-model', modelUrl);
        }
        // Resume animation-mixer if the model already had one running
        if (el.components['animation-mixer']) {
          el.components['animation-mixer'].play();
        }
      });

      // Restart any declarative A-Frame animations on zone entities
      next.querySelectorAll('[animation]').forEach(el => {
        if (el.components.animation) {
          el.components.animation.beginAnimation();
        }
      });
    }, 100);
  }

  // 5. Sky colour
  document.getElementById('main-sky').setAttribute('color', config.skyColor);

  // 6. Flashlight — use surgical setAttribute calls to avoid clobbering other light properties that A-Frame may have already set.
  const flashlight = document.getElementById('flashlight');
  flashlight.setAttribute('light', 'type',      'spot');
  flashlight.setAttribute('light', 'intensity',  config.flashlight);
  flashlight.setAttribute('light', 'distance',   100);
  flashlight.setAttribute('light', 'angle',      config.flashlightAngle);
  flashlight.setAttribute('light', 'target',     '#flashlight-target');

  // 7. Audio — stop any currently playing zone track then start the new one
  const ambientSound = document.getElementById('ambient-sound');
  if (ambientSound && ambientSound.components.sound) {
    ambientSound.components.sound.stopSound();
    ambientSound.setAttribute('sound', 'src', '#' + config.audioId);
    ambientSound.components.sound.playSound();
  }

  currentZone = zoneName;
}


// ============================================================
//  A-FRAME COMPONENT: scanner
//  Registered on every clickable marine-life entity.
//  On click, reads data attributes and populates the scanner-modal with the creature's info, facts, and image.
// ============================================================
AFRAME.registerComponent('scanner', {
  init: function () {
    this.el.addEventListener('click', () => {
      const name    = this.el.getAttribute('data-name');
      const sci     = this.el.getAttribute('data-sci');
      const fam     = this.el.getAttribute('data-fam');
      const facts   = this.el.getAttribute('data-facts');
      const impact  = this.el.getAttribute('data-impact');
      const imgPath = this.el.getAttribute('data-img');

      // Populate taxonomy fields
      document.getElementById('modal-name').textContent   = name   || '';
      document.getElementById('modal-sci').textContent    = sci    || '';
      document.getElementById('modal-fam').textContent    = fam    || '';
      document.getElementById('modal-impact').textContent = impact || '';

      // Facts are pipe-separated in the data attribute — split into a <ul>
      const factsArray = (facts || '').split('|').filter(f => f.trim().length > 0);
      const factsHTML  = factsArray.map(fact => `<li>${fact.trim()}</li>`).join('');
      document.getElementById('modal-facts').innerHTML = `<ul>${factsHTML}</ul>`;

      // Show or hide the animal image
      const img = document.getElementById('modal-img');
      if (imgPath) {
        img.src           = imgPath;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }

      document.getElementById('scanner-modal').style.display = 'flex';
    });
  },
});


// ============================================================
//  FUNCTION: backToMenu()
//  Tears down the active zone and returns the player to the landing page, resetting sky, fog, flashlight, and audio.
// ============================================================
function backToMenu() {
  // Hide and pause the active zone
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) {
      prev.setAttribute('visible', false);
      prev.querySelectorAll('[animation-mixer]').forEach(el => el.pause());
    }
    currentZone = null;
  }

  // Deactivate any aframe-environment-component instances
  document.querySelectorAll('[environment]').forEach(env => {
    env.setAttribute('environment', 'active', false);
  });

  // Reset sky and fog to sunlight-zone defaults
  document.getElementById('main-sky').setAttribute('color', '#004C6D');
  document.querySelector('a-scene').setAttribute(
    'fog',
    'type: exponential; color: #0077B6; density: 0.04'
  );

  // Turn off flashlight
  document.getElementById('flashlight').setAttribute('light', 'intensity: 0');

  // Stop ambient audio
  const ambientSound = document.getElementById('ambient-sound');
  if (ambientSound && ambientSound.components.sound) {
    ambientSound.components.sound.stopSound();
  }

  // Restore UI — show landing page, hide VR-specific elements
  document.getElementById('landing-page').style.display   = 'block';
  document.getElementById('back-btn').style.display       = 'none';
  document.getElementById('scanner-modal').style.display  = 'none';
  document.body.classList.remove('vr-active');
}


// ============================================================
//  FUNCTION: closeModal()
//  Closes the scanner / creature info modal.
// ============================================================
function closeModal() {
  document.getElementById('scanner-modal').style.display = 'none';
}


// ============================================================
//  A-FRAME COMPONENT: sinking-fish
//  Moves an entity downward by `speed` units per tick.
//  Used on the finned great white shark to simulate it sinking after being thrown back into the water.
// ============================================================
AFRAME.registerComponent('sinking-fish', {
  schema: {
    speed: { type: 'number', default: 0.002 },
  },
  tick: function () {
    const pos = this.el.getAttribute('position');
    this.el.setAttribute('position', {
      x: pos.x,
      y: pos.y - this.data.speed,
      z: pos.z,
    });
  },
});


// ============================================================
//  A-FRAME COMPONENT: floating
//  Applies a gentle sine-wave bob and roll to an entity,
//  making it look like it's drifting in a current.
// ============================================================
AFRAME.registerComponent('floating', {
  schema: {
    amplitude: { type: 'number', default: 0.3 },
    speed:     { type: 'number', default: 0.001 },
    wobble:    { type: 'number', default: 2 },
  },
  init: function () {
    // Cached on first tick so it offsets from the entity's starting position
    this.baseY    = null;
    this.baseRotZ = null;
    // Random phase offset so multiple floating entities don't move in lockstep
    this.t = Math.random() * Math.PI * 2;
  },
  tick: function (time, delta) {
    // Capture baseline on the first tick 
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


// ============================================================
//  ASSET LOAD EVENTS
//  Logged to the console for debugging asset loading issues.
// ============================================================
document.querySelector('a-assets').addEventListener('timeout', () => {
  console.warn('A-Frame assets timed out — some models or audio may be missing.');
});
document.querySelector('a-assets').addEventListener('loaded', () => {
  console.log('All A-Frame assets loaded successfully.');
});


// ============================================================
//  MODAL HELPERS — Guide and Survey
// ============================================================
function openGuideModal()  { document.getElementById('guide-modal').style.display  = 'flex'; }
function closeGuideModal() { document.getElementById('guide-modal').style.display  = 'none'; }
function openSurveyModal() { document.getElementById('survey-modal').style.display = 'flex'; }
function closeSurveyModal(){ document.getElementById('survey-modal').style.display = 'none'; }
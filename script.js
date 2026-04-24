// zone config
const ZONE_CONFIG = {
  sunlight: {
    skyColor:        '#004C6D',
    fogColor:        '#0077B6',
    fogDensity:      0.04,
    flashlight:      0,     
    flashlightAngle: 25,
    audioId:        'sunlight-audio',
  },
  twilight: {
    skyColor:        '#021028',
    fogColor:        '#030D1E',
    fogDensity:      0.07,
    flashlight:      1.5,   
    flashlightAngle: 30,
    audioId:        'twilight-audio',
  },
  midnight: {
    skyColor:        '#000000',
    fogColor:        '#000000',
    fogDensity:      0.08,
    flashlight:      20,    
    flashlightAngle: 35,
    audioId:        'midnight-audio',
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

function transport(zoneName) {
  const config = ZONE_CONFIG[zoneName];
  if (!config) return;

  // UI and State
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('back-btn').style.display = 'block';
  document.body.classList.add('vr-active');

  const scene = document.querySelector('a-scene');

  // 1. Unified Fog Logic (Prevents overwriting the Midnight fix)
  if (zoneName === 'midnight') {
    scene.setAttribute('fog', {
      type: 'exponential',
      color: '#000000',
      density: 0.01 // Keep this low so distant assets are visible
    });
  } else if (zoneName === 'twilight') {
    // Twilight fix: lowering density from 0.07 to 0.02 so assets stay visible
    scene.setAttribute('fog', {
      type: 'exponential',
      color: config.fogColor,
      density: 0.02 
    });
} else {
    scene.setAttribute('fog', `type: exponential; color: ${config.fogColor}; density: ${config.fogDensity}`);
}

  // 2. Camera Refresh
  const camera = document.getElementById('cam');
  if (camera && camera.components.camera) {
    camera.components.camera.camera.updateProjectionMatrix();
  }

  // 3. Hide previous zone
  if (currentZone) {
    const prev = document.getElementById(currentZone + '-zone');
    if (prev) {
      prev.setAttribute('visible', false);
      prev.querySelectorAll('[animation-mixer]').forEach(el => el.pause());
    }
  }

  // 4. Show new zone and Load Assets
  const next = document.getElementById(zoneName + '-zone');
  if (next) {
    next.setAttribute('visible', true);
    next.play();

    // Activate environment component if present
    const env = next.querySelector('[environment]');
    if (env) {
      env.setAttribute('environment', 'active', true);
    }

    setTimeout(() => {
      const entities = next.querySelectorAll('[data-src]');
      entities.forEach(el => {
        const modelUrl = el.getAttribute('data-src');
        if (!el.getAttribute('gltf-model')) {
          el.setAttribute('gltf-model', modelUrl);
        }
        if (el.components['animation-mixer']) {
          el.components['animation-mixer'].play();
        }
      });

      next.querySelectorAll('[animation]').forEach(el => {
        if(el.components.animation) {
          el.components.animation.beginAnimation();
        }
      });
    }, 100);
  }

  // 5. Sky Color
  document.getElementById('main-sky').setAttribute('color', config.skyColor);

  // 6. Flashlight (Using surgical setAttribute)
  const flashlight = document.getElementById('flashlight');
  flashlight.setAttribute('light', 'type', 'spot'); 
  flashlight.setAttribute('light', 'intensity', config.flashlight);
  flashlight.setAttribute('light', 'distance', 100); 
  flashlight.setAttribute('light', 'angle', config.flashlightAngle);
  flashlight.setAttribute('light', 'target', '#flashlight-target');

  // 7. Audio
  const ambientSound = document.getElementById('ambient-sound');
  if (ambientSound && ambientSound.components.sound) {
    ambientSound.components.sound.stopSound();
    ambientSound.setAttribute('sound', 'src', '#' + config.audioId);
    ambientSound.components.sound.playSound();
  }

  currentZone = zoneName;
}
// testing scanner
AFRAME.registerComponent('scanner', {
  init: function () {
    this.el.addEventListener('click', () => {
      const name = this.el.getAttribute('data-name');
      const sci = this.el.getAttribute('data-sci');
      const fam = this.el.getAttribute('data-fam');
      const facts = this.el.getAttribute('data-facts');
      const impact = this.el.getAttribute('data-impact');
      const imgPath = this.el.getAttribute('data-img');

      document.getElementById('modal-name').textContent  = name   || '';
      document.getElementById('modal-sci').textContent   = sci    || '';
      document.getElementById('modal-fam').textContent   = fam    || '';
      document.getElementById('modal-facts').textContent = facts  || '';
      document.getElementById('modal-impact').textContent = impact || '';
      const factsArray = facts.split('|').filter(f => f.trim().length > 0);

      // Wrap each part in <li> tags
      const factsHTML = factsArray
        .map(fact => `<li>${fact.trim()}</li>`)
        .join('');

      // Inject the list into modal
      document.getElementById('modal-facts').innerHTML = `<ul>${factsHTML}</ul>`;
      const img = document.getElementById('modal-img');
      if (imgPath) {
        img.src = imgPath;
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
    if (prev) {
      prev.setAttribute('visible', false);
      // Pause animations to save performance
      prev.querySelectorAll('[animation-mixer]').forEach(el => el.pause());
    }
    currentZone = null;
  }
  document.querySelectorAll('[environment]').forEach(env => {
    env.setAttribute('environment', 'active', false);
  });
 
  // reset sky and fog 
  document.getElementById('main-sky').setAttribute('color', '#004C6D');
  const scene = document.querySelector('a-scene');
  scene.setAttribute('fog', 'type: exponential; color: #0077B6; density: 0.04');
 
  // turn off flashlight
  document.getElementById('flashlight').setAttribute('light', 'intensity: 0');
 
  // show main menu, hide back button and modal
  document.getElementById('landing-page').style.display = 'block';
  document.body.classList.remove('vr-active'); 
  
  document.getElementById('back-btn').style.display  = 'none';
  document.getElementById('scanner-modal').style.display = 'none';

  const ambientSound = document.getElementById('ambient-sound');
  if (ambientSound && ambientSound.components.sound) {
    ambientSound.components.sound.stopSound();
  }

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
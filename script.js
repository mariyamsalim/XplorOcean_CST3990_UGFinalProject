//testing sinking property
AFRAME.registerComponent('sinking-fish', {
  tick: function () {
    let pos = this.el.getAttribute('position');
    if (pos.y > -10) { 
      this.el.setAttribute('position', {
        x: pos.x, 
        y: pos.y - 0.005, 
        z: pos.z
      });
    }
  }
});

//testing scanner property
AFRAME.registerComponent('scanner', {
  init: function () {
    this.el.addEventListener('click', () => {
      const name = this.el.getAttribute('data-name');
      const sciName = this.el.getAttribute('data-sci');
      const famName = this.el.getAttribute('data-fam');
      const facts = this.el.getAttribute('data-facts');
      const impact = this.el.getAttribute('data-impact');
      const imgSrc = this.el.getAttribute('data-img');
      const modal = document.getElementById('scanner-modal');
      const factsContainer = document.getElementById('facts-container');

      document.getElementById('modal-name').innerText = name || "Unknown";
      document.getElementById('modal-sci').innerText = sciName || "N/A";
      document.getElementById('modal-fam').innerText = famName || "N/A";
      document.getElementById('modal-impact').innerText = impact || "No impact data available.";
      const imgElement = document.getElementById('modal-img');
      if (imgSrc) imgElement.src = imgSrc;
      if (!facts || facts.trim() === "") {
        factsContainer.style.display = 'none';
      } else {
        factsContainer.style.display = 'block';
        document.getElementById('modal-facts').innerText = facts;
      }
      modal.style.display = 'block';
    });
  }
});

window.closeModal = function() {
  document.getElementById('scanner-modal').style.display = 'none';
};

function closeModal() {
  document.getElementById('scanner-modal').style.display = 'none';
}

function transport(zone) {
  const scene = document.querySelector('a-scene');
  const sky = document.querySelector('a-sky');
  const menu = document.getElementById('main-menu');
  menu.style.display = 'none'; 

  if (zone === 'sunlight') {
    sky.setAttribute('color', '#4db8ff');
    scene.setAttribute('fog', 'type: exponential; color: #005f73; density: 0.05');
  } 
  else if (zone === 'twilight') {
    sky.setAttribute('color', '#002b36');
    scene.setAttribute('fog', 'type: exponential; color: #001a33; density: 0.12');
  } 
  else if (zone === 'midnight') {
    sky.setAttribute('color', '#00050a');
    scene.setAttribute('fog', 'type: exponential; color: #000000; density: 0.25');
  }
}
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
      const fishName = this.el.getAttribute('data-name');
      const fishInfo = this.el.getAttribute('data-info');

      const modal = document.querySelector('#scanner-modal');
      const nameHeading = document.querySelector('#modal-name');
      const infoText = document.querySelector('#modal-text');

      if (modal && nameHeading && infoText) {
        nameHeading.innerText = fishName;
        infoText.innerText = fishInfo;
        
        modal.style.display = 'block';
      }
    });
  }
});

function closeModal() {
  document.getElementById('scanner-modal').style.display = 'none';
}
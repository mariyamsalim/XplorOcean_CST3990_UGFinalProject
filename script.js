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
    this.el.addEventListener('click', function () {
      const info = this.getAttribute('data-info');
      alert("SCANNER DATA: " + info); 
    });
  }
});
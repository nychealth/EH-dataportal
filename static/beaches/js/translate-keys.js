const TRANSLATE_KEYS = [
    'Water quality is measured in most probable number per 100 mL of water (MPN/100mL), an estimate of the number of bacteria in a water sample.',
    'Advisory',
    'Closed for the Season',
    'Closed',
    'Closed for Swimming',
    'Open',
    'Sample Date',
    'Single Day Results',
    '30-Day Geometric Mean',
  ];
  
  // Build and inject the hidden divs dynamically
  function buildTranslateBridge(keys) {
    const wrapper = document.createElement('div');
    wrapper.id = 'popup-translate';
    wrapper.style.cssText = 'height:0;overflow:hidden;color:black;font-size:12px;';
  
    ['popup-original', 'popup-translated'].forEach(id => {
      const container = document.createElement('div');
      container.id = id;
      if (id === 'popup-original') container.className = 'notranslate';
      keys.forEach((text, i) => {
        const div = document.createElement('div');
        div.setAttribute('key', i);
        div.textContent = text;
        container.appendChild(div);
      });
      wrapper.appendChild(container);
    });
  
    document.body.insertAdjacentElement('afterbegin', wrapper);
  }
  
  buildTranslateBridge(TRANSLATE_KEYS);
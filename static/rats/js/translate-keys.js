const TRANSLATE_KEYS = [
  'No treatments by NYC Health',
  'in the last 5 years',
  'Failed for Rat Activity and Other Reason',
  'NYC Health Department Action',
  'Inspections in last 5 years',
  'See FAQ tab for more info',
  'Failed for Other Reason',
  'Failed for Rat Activity',
  'View Property History',
  'Joint Interest Area',
  'Monitoring visit',
  'Community Board',
  'Last Inspection',
  'Open in new tab',
  'Staten Island',
  'Stoppage done',
  'Bait applied',
  'Cleanup done',
  'association',
  'Inspections',
  'preparatory',
  'Street View',
  'apartments',
  'Compliance',
  'elementary',
  'highbridge',
  'Inspection',
  'leadership',
  'playground',
  'technology',
  'washington',
  'community',
  'Manhattan',
  'academic',
  'Brooklyn',
  'bushwick',
  'memorial',
  'triangle',
  'academy',
  'Borough',
  'college',
  'gardens',
  'Initial',
  'program',
  'science',
  'village',
  'avenue',
  'center',
  'garden',
  'groups',
  'island',
  'Job ID',
  'middle',
  'Passed',
  'Queens',
  'rehabs',
  'rights',
  'school',
  'square',
  'street',
  'Block',
  'Bronx',
  'green',
  'group',
  'lower',
  'ocean',
  'parks',
  'phase',
  'place',
  'plaza',
  'point',
  'rehab',
  'river',
  'south',
  'arts',
  'city',
  'Date',
  'east',
  'farm',
  'high',
  'hill',
  'park',
  'side',
  'site',
  'west',
  'BBL',
  'Lot',
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
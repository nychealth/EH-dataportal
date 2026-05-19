// ─────────────────────────────────────────────────────────────────
// CONFIG
// Main settings for reuse across feature services.
// Update this section when adapting the code.
// Set layerTitle to match the layer name in the AGOL webmap.
// Add/remove fields as needed.
// ─────────────────────────────────────────────────────────────────

const CONFIG = {

// Beach layer title (must match the webmap name exactly).
// Set to null to use the first feature layer found.
  layerTitle: 'Beach Status',

  fields: {
    beachName: 'BeachName',         // Display name of the beach
    status:    'Status',            // Current status value
    borough:   'Borough',
    beachType: 'BeachType',
    // beachID removed — popup history is handled via Arcade in the webmap
  },

// ────────────────────────────────────────────────────────────── 
// Maps raw STATUS values to internal keys used by
// STATUS_LABELS and CSS classes (case-sensitive).
// ──────────────────────────────────────────────────────────────

  statusMap: {
    'Advisory':                           'adv',
    'Advisory - NYC Parks':               'adv',
    'Closed':                             'closed',
    'Closed - NYC Parks':                 'closed',
    'Closed for the Season':              'closedseason',
    'Closed for the Season - NYC Parks':  'closedseason',
    'Closed for Swimming':                'closedswim',
    'Closed for Swimming - NYC Parks':    'closedswim',
    'Open':                               'open',
    'Open - NYC Parks':                   'open',
  },

  // Sort the beach list alphabetically by beach name
  sortAlpha: true,

};

// ──────────────────────────────────────────────────────────────
// STATUS LABELS
// Display labels for each status key.
// Used in beach list pills and aria-labels.
// 'unknown' is the fallback for unmapped values.
// ──────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  adv:          'Advisory',
  closed:       'Closed',
  closedseason: 'Closed for the Season',
  closedswim:   'Closed for Swimming',
  open:         'Open',
  unknown:      'Status Unknown',
};

// ──────────────────────────────────────────────────────────────
// DOM REFERENCES
// Cached page elements used across the script.
// Queried once to avoid repeated DOM lookups.
// ──────────────────────────────────────────────────────────────

const mapEl      = document.getElementById('arcmap');
const listEl     = document.getElementById('beach-list');
const loadingEl  = document.getElementById('list-loading');
const errorEl    = document.getElementById('list-error');
const errorMsgEl = document.getElementById('list-error-msg');
const retryBtn   = document.getElementById('retry-btn');
const updatedEl  = document.getElementById('list-updated');
const toastEl    = document.getElementById('zoom-toast');
let   toastTimer;


// ──────────────────────────────────────────────────────────────
// TAB SWITCHING
// Controls the three tabs (Map, Beach List, FAQ).
// activateTab() sets the active button and panel.
// Also called by zoomToFeature() to show the map.
// ──────────────────────────────────────────────────────────────

const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function activateTab(targetPanel) {
  tabBtns.forEach(btn => {
    const active = btn.dataset.panel === targetPanel;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });
  tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === targetPanel);
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.panel));
});


// ──────────────────────────────────────────────────────────────
// LIST STATE HELPERS
// Controls the beach list UI state.
// showLoading() shows the spinner.
// showError() shows an error message.
// hideLoadingState() clears both after load.
// ──────────────────────────────────────────────────────────────
function showLoading() {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  listEl.querySelectorAll('.beach-item').forEach(el => el.remove());
}

function showError(msg) {
  loadingEl.classList.add('hidden');
  errorEl.classList.remove('hidden');
  errorMsgEl.textContent = msg ?? 'Could not load beach data.';
}

function hideLoadingState() {
  loadingEl.classList.add('hidden');
  errorEl.classList.add('hidden');
}


// ──────────────────────────────────────────────────────────────
// BUILD BEACH LIST
// Renders the list from query results.
// Splits beaches into NYC Parks vs others.
// Sorts each group A–Z and renders <li> rows with status pills.
// Rows are keyboard-accessible and call zoomToFeature() on click or Enter/Space.
// ──────────────────────────────────────────────────────────────
function buildBeachList(features) {
  hideLoadingState();
  listEl.querySelectorAll('.beach-item, .borough-header').forEach(el => el.remove());

  if (!features || features.length === 0) {
    showError('No beach features were returned by the layer.');
    return;
  }

  // Split into NYC Parks beaches and all others
  const parksBeaches = [];
  const otherBeaches = [];

  features.forEach(feature => {
    const type = feature.attributes[CONFIG.fields.beachType] ?? '';
    if (type === 'NYC Parks') {
      parksBeaches.push(feature);
    } else {
      otherBeaches.push(feature);
    }
  });

  // Sort each group alphabetically by beach name
  const sortByName = (a, b) => {
    const nameA = (a.attributes[CONFIG.fields.beachName] ?? '').toString();
    const nameB = (b.attributes[CONFIG.fields.beachName] ?? '').toString();
    return nameA.localeCompare(nameB);
  };

  parksBeaches.sort(sortByName);
  otherBeaches.sort(sortByName);

  // Parks beaches first, then all others
  const sortedFeatures = [...parksBeaches, ...otherBeaches];

  // Render one <li> per beach
  sortedFeatures.forEach(feature => {
    const attrs       = feature.attributes;
    const name        = attrs[CONFIG.fields.beachName] ?? 'Unnamed Beach';
    const rawStatus   = attrs[CONFIG.fields.status];
    const statusKey   = CONFIG.statusMap[rawStatus] ?? 'unknown';
    const statusLabel = STATUS_LABELS[statusKey];
    const beachType   = attrs[CONFIG.fields.beachType] ?? '';

    const parkIcon = beachType === 'NYC Parks'
      ? `<img src="./img/DPR.png" class="park-icon" alt="NYC Parks">`
      : '';

    const li = document.createElement('li');
    li.className = 'beach-item';
    li.setAttribute('tabindex', '0');
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `${name} — ${statusLabel}. Tap to zoom to map.`);

    li.innerHTML = `
      <div class="beach-info">
        <div class="beach-name">${parkIcon}<span>${name}</span></div>
      </div>
      <span class="status-pill ${statusKey}">${statusLabel}</span>
      <span class="beach-arrow" aria-hidden="true">›</span>
    `;

    li.addEventListener('click', () => zoomToFeature(feature, name));
    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        zoomToFeature(feature, name);
      }
    });

    listEl.appendChild(li);
  });

  updatedEl.classList.add('visible');
}


// ──────────────────────────────────────────────────────────────
// QUERY FEATURE LAYER
// Finds the beach layer by title (or uses the first feature layer).
// Loads its schema, then queries all features with geometry and attributes.
// Geometry supports zoomToFeature(); all fields support the popup.
// Called on map load and on Retry.
// ──────────────────────────────────────────────────────────────
async function loadBeachesFromLayer(view) {
  showLoading();

  let layer;
  if (CONFIG.layerTitle) {
    layer = view.map.allLayers.find(
      l => l.type === 'feature' && l.title === CONFIG.layerTitle
    );
  }
  if (!layer) {
    layer = view.map.allLayers.find(l => l.type === 'feature');
  }

  if (!layer) {
    showError(`Layer "${CONFIG.layerTitle}" not found in the webmap.`);
    console.error('[Beach List] Layer not found. Available layers:',
      view.map.allLayers.map(l => `${l.type}: "${l.title}"`).toArray());
    return;
  }

  try {
    await layer.load();

    const availableFields = new Set(layer.fields.map(f => f.name));
    const requestedFields = Object.values(CONFIG.fields)
      .filter(f => f && availableFields.has(f));

    if (requestedFields.length === 0) {
      console.warn('[Beach List] None of the configured field names were found in the layer. Requesting all fields.');
      requestedFields.push('*');
    }

    const result = await layer.queryFeatures({
      where:          '1=1',
      outFields:      ['*'],
      returnGeometry: true,
    });

    buildBeachList(result.features);

  } catch (err) {
    console.error('[Beach List] Query failed:', err);
    showError('Could not load beach data. Check the console for details.');
  }
}


// ──────────────────────────────────────────────────────────────
// MAP READY HANDLER
// Fires when <arcgis-map> signals the view is ready.
// Stores the view for reuse (e.g., Retry).
// ──────────────────────────────────────────────────────────────
let mapView = null;

mapEl.addEventListener('arcgisViewReadyChange', async (evt) => {
  const view = evt.target.view;
  if (!view) return;
  mapView = view;
  await loadBeachesFromLayer(view);
});


// ──────────────────────────────────────────────────────────────
// RETRY BUTTON
// Re-runs the layer query if the view is ready.
// Otherwise, shows loading and waits for the handler above.
// ──────────────────────────────────────────────────────────────
retryBtn.addEventListener('click', () => {
  if (mapView) {
    loadBeachesFromLayer(mapView);
  } else {
    showLoading();
  }
});


// ──────────────────────────────────────────────────────────────
// TOAST NOTIFICATION
// Shows a brief message, then fades out (~2.8s).
// Used by zoomToFeature() to confirm the selected beach.
// ──────────────────────────────────────────────────────────────
function showToast(msg) {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}


// ──────────────────────────────────────────────────────────────
// ZOOM TO FEATURE
// Called when a beach is selected.
// Switches to the map tab, zooms to the feature (level 15),
// and opens its AGOL popup.
// Uses preloaded feature data (no extra request).
// Translation is handled by the bridge below.
// ─────────────────────────────────────────────────────────────
async function zoomToFeature(feature, name) {
  activateTab('panel-map');
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      const view = mapEl.view;
      if (!view) return;
      await view.goTo({ target: feature.geometry, zoom: 15 });
      view.openPopup({ features: [feature], location: feature.geometry });
      showToast(`📍 Zoomed to ${name}`);
    });
  });
}


// ═══════════════════════════════════════════════════════════════
// GOOGLE TRANSLATE POPUP BRIDGE
//
// BACKGROUND
// Google Translate:
// 1) Only translates existing DOM content (not injected later)
// 2) Cannot access Shadow DOM (e.g., <arcgis-map>)
//
// APPROACH
// Store popup strings in hidden DOM elements so Translate can see them.
// When a popup opens, compare original vs translated text,
// build a map, and apply it inside the Shadow DOM.
//
// Translate does the work; this bridges it into the popup.
//
// Add strings in translate-keys.js.
// See google-translate-shadow-dom-bridge.md for details.
// ═══════════════════════════════════════════════════════════════


// ── 1. Load phrases ───────────────────────────────────────────
// Reads key/text pairs from a hidden div group
// (#popup-original or #popup-translated) into an object.
function loadTranslatePhrases(container) {
  const result = {};
  if (!container) return result;
  container.querySelectorAll('[key]').forEach(el => {
    result[el.getAttribute('key')] = el.textContent;
  });
  return result;
}


// ── 2. Build substitution map ─────────────────────────────────
// Compares original vs translated divs.
// Returns changed strings as: original → translated.
// Sorted longest-first to avoid substring collisions
// (e.g., "Closed" vs "Closed for the Season").
function buildSubstitutionMap() {
  const original   = loadTranslatePhrases(document.getElementById('popup-original'));
  const translated = loadTranslatePhrases(document.getElementById('popup-translated'));
  const map = {};

  Object.keys(original).forEach(key => {
    const orig  = original[key]?.trim();
    const trans = translated[key]?.trim();
    if (orig && trans && orig !== trans) {
      map[orig] = trans;
    }
  });

  // Longest strings first — prevents partial substring replacement
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => b[0].length - a[0].length)
  );
}


// ── 3. Apply substitutions ────────────────────────────────────
// Applies the map to a single text node in place.
// Skips if no matches are found.
function applySubstitutions(textNode, subMap) {
  let text = textNode.textContent;
  let changed = false;
  Object.entries(subMap).forEach(([orig, trans]) => {
    if (text.includes(orig)) {
      text = text.replaceAll(orig, trans);
      changed = true;
    }
  });
  if (changed) textNode.textContent = text;
}


// ── 4. Translate open popup ───────────────────────────────────
// Finds popup nodes in the ArcGIS shadow root and
// applies translations to all text nodes.
// No-op if English or no popup is open.
// Selectors match SDK 4.29+
// (use '.esri-popup__header-title' / '.esri-popup__content' below 4.29).
function translateOpenPopup() {
  const arcMap = document.getElementById('arcmap');
  const shadowRoot = arcMap?.shadowRoot;
  if (!shadowRoot) return;

  const subMap = buildSubstitutionMap();
  if (Object.keys(subMap).length === 0) return; // English — nothing to do

  const containers = [
    shadowRoot.querySelector('.esri-features__heading'),
    shadowRoot.querySelector('.esri-feature__main-container'),
  ].filter(Boolean);

  if (!containers.length) return;

  containers.forEach(container => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      { acceptNode: n => n.textContent.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT }
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => applySubstitutions(node, subMap));
  });
}


// ── 5. Watch popup rendering ─────────────────────────────────
// Runs inside arcgisViewReadyChange:
//
// a) Double-click fix — bypasses ArcGIS click delay by handling zoom directly.
//
// b) MutationObserver — watches shadow DOM for popup changes.
// Debounced to wait for final content before translating.
mapEl.addEventListener('arcgisViewReadyChange', (evt) => {
  const view = evt.target?.view;
  if (!view) return;

  // (a) Remove double-click zoom delay for faster popup response
  view.on('double-click', (evt) => {
    evt.stopPropagation();
    view.goTo({ zoom: view.zoom + 1, center: evt.mapPoint });
  });

  const sr = document.getElementById('arcmap').shadowRoot;
  if (!sr) return;

  let translateTimer = null;
  let lastContent = '';

  // (b) Watch shadow DOM for popup content changes
  const popupObserver = new MutationObserver(() => {
    const container = sr.querySelector('.esri-feature__main-container');
    if (!container) return;

    // Skip if content hasn't actually changed — avoids re-translating
    // the same popup when unrelated DOM mutations fire
    const currentContent = container.textContent;
    if (currentContent === lastContent) return;
    lastContent = currentContent;

    // Debounce — wait for Arcade/related table mutations to settle
    clearTimeout(translateTimer);
    translateTimer = setTimeout(translateOpenPopup, 400);
  });

  popupObserver.observe(sr, {
    childList:     true,
    subtree:       true,
    characterData: true,
  });
});


// ── 6. Re-translate on language change ───────────────────────
// Watches #popup-translated for updates from Google Translate.
// Re-applies translation if a popup is already open.
const translatedContainer = document.getElementById('popup-translated');
if (translatedContainer) {
  const langObserver = new MutationObserver(() => {
    const view = mapEl?.view;
    if (view?.popup?.visible) {
      setTimeout(translateOpenPopup, 200);
    }
  });
  langObserver.observe(translatedContainer, {
    childList: true, characterData: true, subtree: true
  });
}
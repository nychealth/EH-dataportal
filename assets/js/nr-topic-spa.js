// Lightweight, topic-centric Neighborhood Reports viewer.
//
// Expects window.NR_TOPIC_SPA_CONFIG set by the Hugo layout with:
//   - sections: array of { id, containerId, reportUrl } objects, one per report_topic.
//   - neighborhoods: optional array of neighborhood names available in the UI.
//
// On load, fetches each section's EHDP-data JSON, groups rows by neighborhood,
// and renders indicator rows into the matching container. When the user switches
// neighborhoods via the <select>, all sections re-render in place.
//
// Uses only vanilla JS and Bootstrap classes; no charts/maps yet.
;(function () {
  var config = window.NR_TOPIC_SPA_CONFIG;
  if (!config || !config.sections || !config.sections.length) {
    return;
  }

  var neighborhoodSelect = document.getElementById('nr-topic-neighborhood');
  if (!neighborhoodSelect) {
    return;
  }

  // Per-section data store: sectionId -> { neighborhoodName -> rows[] }
  var sectionData = {};

  // Track how many sections have finished loading so we can do the
  // initial render once all data is available.
  var sectionsLoaded = 0;

  // --- helpers ---

  // Translate tertile rank + rankReverse flag into human-readable comparison text.
  function getTertileLabel(rank, rankReverse) {
    var r = String(rank);
    var reverse = rankReverse === true || rankReverse === 'true';

    if (r === '1') {
      return reverse ? 'Less than most neighborhoods' : 'Higher than most neighborhoods';
    }
    if (r === '2') {
      return 'In the middle of NYC neighborhoods';
    }
    if (r === '3') {
      return reverse ? 'Higher than most neighborhoods' : 'Less than most neighborhoods';
    }
    return '';
  }

  // Build the HTML for a single indicator row (Bootstrap list-group-item).
  function buildRowHTML(row) {
    var value =
      row.data_value_geo_entity !== null && row.data_value_geo_entity !== undefined
        ? row.data_value_geo_entity
        : '–';

    var unitParts = [];
    if (row.measurement_type) unitParts.push(row.measurement_type);
    if (row.units) unitParts.push(row.units);
    var units = unitParts.join(' ').trim();

    var tertileText = getTertileLabel(row.data_value_rank, row.rankReverse);

    return (
      '<div class="mb-2 mb-md-0">' +
        '<div class="font-weight-bold">' + (row.indicator_short_name || '') + '</div>' +
        '<div class="text-muted small">' + (row.indicator_long_name || '') + '</div>' +
      '</div>' +
      '<div class="text-md-right">' +
        '<div class="h5 mb-0">' + value + '</div>' +
        (units ? '<div class="small text-muted">' + units + '</div>' : '') +
        (tertileText ? '<div class="small mt-1">' + tertileText + '</div>' : '') +
      '</div>'
    );
  }

  // --- rendering ---

  // Render one section's indicators for the given neighborhood.
  function renderSection(section, neighborhoodName) {
    var container = document.getElementById(section.containerId);
    if (!container) return;

    var byNeighborhood = sectionData[section.id] || {};
    var rows = byNeighborhood[neighborhoodName] || [];

    container.innerHTML = '';

    if (!rows.length) {
      container.innerHTML =
        '<p class="text-muted mb-0">No data available for this neighborhood.</p>';
      return;
    }

    rows.forEach(function (row) {
      var item = document.createElement('div');
      item.className =
        'list-group-item d-flex flex-column flex-md-row align-items-md-center justify-content-between';
      item.innerHTML = buildRowHTML(row);
      container.appendChild(item);
    });
  }

  // Re-render all sections for the chosen neighborhood.
  function renderAll(neighborhoodName) {
    config.sections.forEach(function (section) {
      renderSection(section, neighborhoodName);
    });
  }

  // --- data loading ---

  // Fetch one section's JSON, group by neighborhood, and sort by tertile rank.
  function loadSection(section) {
    fetch(section.reportUrl)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var rows = Array.isArray(data) ? data : [];
        var byNeighborhood = {};

        // Group rows by neighborhood name.
        rows.forEach(function (row) {
          var n = row.neighborhood;
          if (!n) return;
          if (!byNeighborhood[n]) byNeighborhood[n] = [];
          byNeighborhood[n].push(row);
        });

        // Within each neighborhood, sort indicators by tertile rank (highest first)
        // so the most concerning values surface toward the top.
        Object.keys(byNeighborhood).forEach(function (n) {
          byNeighborhood[n].sort(function (a, b) {
            var ra = Number(a.data_value_rank);
            var rb = Number(b.data_value_rank);
            if (isNaN(ra) || isNaN(rb)) return 0;
            return rb - ra;
          });
        });

        sectionData[section.id] = byNeighborhood;
      })
      .catch(function (error) {
        console.error('Error loading section "' + section.id + '":', error);
        sectionData[section.id] = {};
      })
      .then(function () {
        // Whether success or failure, check if all sections are done loading.
        sectionsLoaded++;
        if (sectionsLoaded >= config.sections.length) {
          // All sections loaded — do the initial render.
          var initial =
            (config.neighborhoods && config.neighborhoods[0]) || neighborhoodSelect.value;
          if (initial) {
            neighborhoodSelect.value = initial;
            renderAll(initial);
          }
        }
      });
  }

  // --- init ---

  // When the user changes the neighborhood, re-render all sections in place.
  neighborhoodSelect.addEventListener('change', function () {
    renderAll(neighborhoodSelect.value);
  });

  // Kick off parallel fetches for each section's report JSON.
  config.sections.forEach(function (section) {
    loadSection(section);
  });
})();

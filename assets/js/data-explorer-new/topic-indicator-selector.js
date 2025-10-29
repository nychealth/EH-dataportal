// --------------------------------------------------------
// all indicator metadata as global variable
// --------------------------------------------------------
let indicators = null; 

// --------------------------------------------------------
// Immediately start loading metadata.json
// --------------------------------------------------------
const indicatorsPromise = fetch(`${data_repo}${data_branch}/indicators/metadata/metadata.json`)
  .then(response => response.json())
  .then(data => {
    console.log("* fetch metadata.json");
    indicators = data; 
    // console.log(indicators);
    return data; // resolve promise
  })
  .catch(error => console.error("Error loading metadata.json:", error));

// Waits for indicators to be ready
async function ensureIndicatorsLoaded() {
  if (indicators) return indicators; 
  console.log("Waiting for indicators to load...");
  return await indicatorsPromise; 
}

// --------------------------------------------------------
// When a topic is selected, show indicator menu modal, and print indicators
// --------------------------------------------------------
function getIndicatorsForTopic(title, indicatorsJSON, dest) {
    
    const indicators = JSON.parse(indicatorsJSON);

    // Close topic selector modal
    $('#topicSelector').modal('hide');

    // Open Indicator Selector modal
    $('#indicatorSelector').modal('show');

    // set destination
    console.log('destination:', dest)
    
    // pass indicator json to print function
    printIndicators(indicators, dest)

}


// --------------------------------------------------------
// Print chosen topic's indicators to indicator selection modal 
// --------------------------------------------------------
async function printIndicators(x, destination) {
    // Destination
    const indicatorDestination = document.getElementById("indicatorDestination");
    if (!indicatorDestination) {
        console.error("Error: No element with id 'indicatorDestination' found.");
        return;
    }

    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded();
    console.log("Indicators ready!", data);

    // Clear existing content
    indicatorDestination.innerHTML = '';

    x.forEach(section => {
        // Only proceed if there are indicators
        if (!section.indicators || section.indicators.length === 0) return;

        // Header (optional)
        const headerHtml = section.header ? `<h5 class="font-weight-bold mt-3 mb-1">${section.header}</h5>` : '';

        // Generate HTML for each indicator
        const indicatorsHtml = section.indicators.map(id => {
            // Look up the indicator object in the global indicators array
            const indicator = indicators.find(ind => ind.IndicatorID === id);

            if (!indicator) {
                console.warn(`Indicator with ID ${id} not found.`);
                return ''; // skip if not found
            }

            return `
                <div class="indicator-card mb-1">
                    <div class="border p-2 border-gray-300 rounded">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6><a href='${destination}?id=${indicator.IndicatorID}'>${indicator.IndicatorName}</a></h6>
                        </div>
                        <p class="mb-0" style="font-size: 14px;">${indicator.IndicatorDescription}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Wrap in indicator-grid
        const sectionHtml = `
            ${headerHtml}
            <div class="indicator-grid">
                ${indicatorsHtml}
            </div>
        `;

        // Append to destination
        indicatorDestination.innerHTML += sectionHtml;
    });
}


// --------------------------------------------------------
// Check for URL parameter (?id=XXXX) and load indicator metadata 
// --------------------------------------------------------

function checkURL() {
    
    const queryString = window.location.search;
    
    const urlParams = new URLSearchParams(queryString);

    const chosenIndicator = urlParams.get('id');

    console.log('Chosen indicator:' + chosenIndicator) // output indicator ID

    printIndicatorInfo(chosenIndicator)

    draw311Buttons(chosenIndicator)

}

async function printIndicatorInfo(x) {

    x = Number(x)

    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded();
    console.log("Indicators ready!", data);

    // Find the indicator object where IndicatorID matches x
    const indicator = data.find(d => d.IndicatorID === x);
    if (!indicator) {
        console.warn("No indicator found for ID:", x);
        return;
    }

    // Query holders
    const nameHolders = document.querySelectorAll('.indicator-name');
    const descriptionHolders = document.querySelectorAll('.indicator-description');

    // Fill name fields
    nameHolders.forEach(el => {
        el.textContent = indicator.IndicatorName ?? "";
    });

    // Fill description fields
    descriptionHolders.forEach(el => {
        el.textContent = indicator.IndicatorDescription ?? "";
    });

}


checkURL()
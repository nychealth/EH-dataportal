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
    console.log("Indicators ready to print to indicator selection modal!", data);

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
                            <a class='h6' href='${destination}?id=${indicator.IndicatorID}'>${indicator.IndicatorName}</a>
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

    const chosenIndicator = Number(urlParams.get('id'));

    console.log('Chosen indicator: ', chosenIndicator) // output indicator ID

    printIndicatorInfo(chosenIndicator)

    draw311Buttons(chosenIndicator)

    printMenus(chosenIndicator)


}

// --------------------------------------------------------
// Print basic indicator info from metadata to page 
// --------------------------------------------------------
async function printIndicatorInfo(x) {

    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded();
    console.log("Indicators ready to print to page!");

    // Find the indicator object where IndicatorID matches x
    const indicator = data.find(d => d.IndicatorID === x);

    console.log('This indicator:');
    console.log(indicator)

        if (!indicator) {
            console.warn("No indicator found for ID:", x);
            $('#indicatorSelector').modal('show'); // fire Indicator Selection Modal
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

        // Handle Data Source and How Calculated
        const howCalculatedEl = document.getElementById('howCalculated');
        const dataSourcesEl = document.getElementById('dataSources');

        // Clear previous content
        howCalculatedEl.innerHTML = '';
        dataSourcesEl.innerHTML = '';

        // To store unique sources
        const uniqueSources = new Set();

        // Loop through Measures
        indicator.Measures.forEach(measure => {
            // Append MeasurementType and how_calculated
            const p = document.createElement('p');
            p.innerHTML = `<strong>${measure.MeasurementType}:</strong> ${measure.how_calculated}`;
            howCalculatedEl.appendChild(p);

            // Collect sources
            if (measure.Sources) {
                uniqueSources.add(measure.Sources);
            }
        });

        // Display unique sources
        uniqueSources.forEach(source => {
            const p = document.createElement('p');
            p.textContent = source;
            dataSourcesEl.appendChild(p);
        });


}




function copyCitation() {
    const citeText = document.getElementById('citeText').innerText;

    // Create temporary textarea
    const temp = document.createElement('textarea');
    temp.value = citeText;
    document.body.appendChild(temp);
    temp.select();
    temp.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(temp.value).then(() => {
        const btn = document.getElementById('citeButton');
        btn.innerHTML = `<i class="fas fa-copy mr-1" aria-hidden="true"></i>Copied!`;
    });

    document.body.removeChild(temp); // clean up
}
// ======================================================================= //
// 311.js
// ======================================================================= //

// 311 crosswalk loading and action-link rendering

// console.log(">> 311.js");

// ----------------------------------------------------------------------- //
// 311 action links
// ----------------------------------------------------------------------- //

// Loads the 311 crosswalk and renders the matching "Contact 311" action links for one indicator.
const render311Links = (indicator_id) => {

    debugLog("* render311Links");

    // Holds the crosswalk rows matched to the current indicator, populated once the CSV loads.
    let filteredCrosswalk = [];

    // ----- fetch crosswalk CSV ----- //

    const crosswalkUrl = `${baseURL}311/311-crosswalk.csv`;

    // One crosswalk serves every indicator, so parse it once and re-filter the cached rows.
    loadOnce(crosswalkUrl, () => d3.csv(crosswalkUrl))
        .then((crosswalk) => {

            // console.log('crosswalk')
            // console.log(crosswalk)

            // ----- clear previous 311 UI state ----- //

            // Three destinations render on an explorer page: the desktop header dropdown, the
            // mobile tab-bar dropdown, and the take-action partial. Drive them all off the class.
            let dest = document.querySelectorAll('.destination311')

            dest.forEach(element => element.innerHTML = '')

            // ----- filter crosswalk to current indicator ----- //

            // Narrows the full crosswalk to the rows relevant to the indicator being drawn.
            filteredCrosswalk = crosswalk.filter(indicator => indicator.IndicatorID == indicator_id )

            // console.log(filteredCrosswalk)

            // ----- toggle heading/containers by match count ----- //

            // Show or hide the 311 heading and containers based on whether links exist.
            if (filteredCrosswalk.length > 0) {

                document.getElementById('contact311Label').innerHTML = 'Contact 311 about:'
                dest.forEach(element => element.classList.remove('hide'))

            } else {

                document.getElementById('contact311Label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))

            };

            // ----- render one link per matched row ----- //

            // Render one outbound 311 article link per matching crosswalk record.
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {

                // test length to prevent orphaned vertical bar
                let verticalBar = (i < filteredCrosswalk.length - 1) ? ' | ' : '';

                // Link text and target come from the matching crosswalk row for this iteration.
                let title = filteredCrosswalk[i].topic;
                let destination = filteredCrosswalk[i].kaLink;

                // kanumber is the 311 knowledge article ID from the crosswalk CSV
                let btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" target="_blank" rel="noopener noreferrer">${title}</a>${verticalBar}`;
                
                dest.forEach(element => element.innerHTML += btn);

            }
    })
    .catch(error => {
        console.log(error);
    })
}



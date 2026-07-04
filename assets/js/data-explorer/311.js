// ======================================================================= //
// 311.js
// ======================================================================= //

// 311 crosswalk loading and action-link rendering

// console.log(">> 311.js");

// ----------------------------------------------------------------------- //
// 311 action links
// ----------------------------------------------------------------------- //

// Loads 311 crosswalk links and prints the matching action buttons for one indicator.
const draw311Buttons = (indicator_id) => {

    debugLog("* draw311Buttons");

    // Holds the crosswalk rows matched to the current indicator, populated once the CSV loads.
    let filteredCrosswalk = [];

    // ----- fetch crosswalk CSV ----- //

    d3.csv(`${baseURL}311/311-crosswalk.csv`)
        .then(async data => {

            // console.log(">>> 311-crosswalk");
            return data;
        })
        .then((crosswalk) => {

            // console.log('crosswalk')
            // console.log(crosswalk)

            // ----- clear previous 311 UI state ----- //

            document.getElementById('311').innerHTML = ''

            // The take-action partial renders twice on the explorer, so update both destinations.
            let dest = document.querySelectorAll('.destination311')

            dest.forEach(element => element.innerHTML = '')

            // ----- filter crosswalk to current indicator ----- //

            // Narrows the full crosswalk to the rows relevant to the indicator being drawn.
            filteredCrosswalk = crosswalk.filter(indicator => indicator.IndicatorID == indicator_id )

            // console.log(filteredCrosswalk)

            // ----- toggle heading/containers by match count ----- //

            // Show or hide the 311 heading and containers based on whether links exist.
            if (filteredCrosswalk.length > 0) {

                document.getElementById('311label').innerHTML = 'Contact 311 about:'
                dest.forEach(element => element.classList.remove('hide'))

            } else {

                document.getElementById('311label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))

            };

            // ----- render one link per matched row ----- //

            // Render one outbound 311 article link per matching crosswalk record.
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {

                // Link text and target come from the matching crosswalk row for this iteration.
                let title = filteredCrosswalk[i].topic
                let destination = filteredCrosswalk[i].kaLink

                // kanumber is the 311 knowledge article ID from the crosswalk CSV
                let btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="mr-1" target="_blank" rel="noopener noreferrer">${title}</a>| `
                
                dest.forEach(element => element.innerHTML += btn)

            }
    })
    .catch(error => {
        console.log(error);
    })
}



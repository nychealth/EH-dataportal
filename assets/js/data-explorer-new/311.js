// ======================================================================= //
// 311.js
// ======================================================================= //

//  fetch and load 311 Crosswalk into global object

// console.log(">> 311.js");

//------- call function

// draw311Buttons(this_IndicatorID)

//------- function to draw 311 buttons

// Loads 311 crosswalk links and prints the matching action buttons for one indicator.
const draw311Buttons = (indicator_id) => {

    console.log("* draw311Buttons");

    let filteredCrosswalk = [];

    d3.csv(`${baseURL}311/311-crosswalk.csv`)
        .then(async data => {

            // console.log(">>> 311-crosswalk");
            return data;
        })
        .then((crosswalk) => {

            // console.log('crosswalk')
            // console.log(crosswalk)

            document.getElementById('311').innerHTML = ''

            // since we bring the takeaction partial in 2x on the DE page, we need to do this based on a class instead of an ID.
            let dest = document.querySelectorAll('.destination311')

            dest.forEach(element => element.innerHTML = '')

            filteredCrosswalk = crosswalk.filter(indicator => indicator.IndicatorID == indicator_id )

            // console.log(filteredCrosswalk)

            // Creates label if there are 311 links

            // Show or hide the 311 heading and containers based on whether links exist.
            if (filteredCrosswalk.length > 0) {

                document.getElementById('311label').innerHTML = 'Contact 311 about:'
                dest.forEach(element => element.classList.remove('hide'))

            } else {

                document.getElementById('311label').innerHTML = ''
                dest.forEach(element => element.classList.add('hide'))

            };

            // draws 311 buttons
            // Render one outbound 311 article link per matching crosswalk record.
            for (let i = 0; i < filteredCrosswalk.length; i ++ ) {

                let title = filteredCrosswalk[i].topic
                let destination = filteredCrosswalk[i].kaLink

                // kanumber is the 311 knowledge article ID from the crosswalk CSV
                let btn = `<a href="https://portal.311.nyc.gov/article/?kanumber=${destination}" class="mr-1" target="_blank" rel="noopener noreferrer">${title}</a>| `
                
                dest.forEach(element => element.innerHTML += btn)

            }
    })
}



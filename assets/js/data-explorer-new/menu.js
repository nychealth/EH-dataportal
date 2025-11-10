// ASYNC BECAUSE IT AWAITS metadata.json VIA ensureIndicatorsLoaded()
async function printMenus(x) {

    console.log('Menus running')

    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded('printing measure menu');
    // console.log("Indicators ready to print menus!");

    // Find indicator by ID (make sure x is a number)
    const thisOne = indicators.find(d => d.IndicatorID === Number(x));
    console.log(thisOne);

    const measures = thisOne.Measures.map(m => ({
        MeasurementType: m.MeasurementType,
        MeasureID: m.MeasureID
    }));

    console.log(measures);

    styleAndPrintMenu(measures, '.measures-holder', 'measure');
}

// THIS IS THE MENU-STYLING FUNCTION - IT TAKES IN AN ARRAY OF OPTIONS/ITEMS, THE DESTINATION ELEMENT, AND THE OPTION TYPE
function styleAndPrintMenu(items, destination, type) {

    // Select *all* matching containers
    const containers = document.querySelectorAll(destination);

    // Loop through each container
    containers.forEach(container => {

        container.innerHTML = ''; // Clear before inserting new menu items

        items.forEach(item => {

            const button = document.createElement('button');
            button.className = 'dropdown-item';
            button.type = 'button';

            // Existing dropdown-text updater
            button.setAttribute('onclick', 'updateDropdownText(this)');

            // "changeMeasure" handler
            button.addEventListener('click', () => {
                changeMeasure(type, item.MeasureID);
            });

            button.textContent = item.MeasurementType;

            container.appendChild(button);
        });

    });
}


// This starts to step on Measure.JS's toes a little bit - but this is a chance measure function that right now, runs off of dropdown/button click, and logs to the console. 
// "Type" will be any option: geo, timeperiod, measure, etc. 
function changeMeasure(type, measureID) {
    console.log(`change - ${type}: ${measureID}`);
}
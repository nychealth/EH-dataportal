async function printMenus(x) {

    console.log('Menus running')

    // Ensure metadata are loaded
    const data = await ensureIndicatorsLoaded();
    console.log("Indicators ready to print menus!");

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



function changeMeasure(type, measureID) {
    console.log(`change - ${type}: ${measureID}`);
}

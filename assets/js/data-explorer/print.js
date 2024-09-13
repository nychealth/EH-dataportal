console.log('print vis js running')

// Runs on button click to fire the 'print' modal, and, on delay, draw the chart
function printModal() {
    $('#printModal').modal('show');
    setTimeout(printViz,500)
}

// prints the visualization to the modal's window
function printViz() {
    vegaEmbed("#printVis", printSpec)
}

// We can also pass in arguments to use from the function calls. 

/* If Map...
- Add year to subtitle
- Add neighborhood to subtitle
*/

/* If trend...
- Turn legend on.
*/
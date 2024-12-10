console.log('rat javascript loaded')

function changeTable(table,zone) {
    var buttonID = table + '-' + zone
    var tableID = "table-" + table + '-' + zone

    var buttonClass = 'table' + table + "Buttons"
    var tableClass = "table" + table + "tables"

    // Get all of the buttons for table 2, and remove the "active" class
    var buttons = document.querySelectorAll('.' + buttonClass)
    buttons.forEach(button => button.classList.remove('active'));

    // Put the "active" class on for the one you clicked on
    document.getElementById(buttonID).classList.add('active')

    // Get all of the tables for table 2, and add the "hide" class
    var tables = document.querySelectorAll('.' + tableClass)
    tables.forEach(table => table.classList.add('hide'))

    // Get the table that corresponds to the clicked-on button, and remove the "hide" class
    document.getElementById(tableID).classList.remove('hide')

}
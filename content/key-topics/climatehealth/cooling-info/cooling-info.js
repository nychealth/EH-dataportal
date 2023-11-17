// API documentation: https://www.weatherapi.com/docs/
// Sample returns: https://www.weatherapi.com/api-explorer.aspx#forecast

// ----------------------------------------------------------------- //
// ---------- First, ingest weather API and print to page ---------- //
// ----------------------------------------------------------------- //
var apiData;
fetch('http://api.weatherapi.com/v1/forecast.json?key=0d4a042ad8ec468da7b135156231711&q=NYC&days=1&aqi=yes&alerts=no')
    .then(response => {return response.json()})
    .then(data => {
    // console.log(data)
    apiData = data

    // Print current temp, max temp, and AQI
    var currentTemp = apiData.current.temp_f
    document.getElementById('currentTemp').innerHTML = currentTemp + '° F'

    var maxTemp = apiData.forecast.forecastday[0].day.maxtemp_f
    document.getElementById('maxTemp').innerHTML = maxTemp  + '° F'

    var aqi = apiData.current.air_quality["us-epa-index"]
    // document.getElementById('aqi').innerHTML = aqi

    // Style temp interpretation
      var hotText = document.getElementById('hot')

    if (maxTemp > 80 & maxTemp < 85) {
        hotText.innerHTML = 'warm'
        hotText.style['background-color'] = "orange"
    } else if (maxTemp > 85 & maxTemp < 90) {
        hotText.innerHTML = 'hot'
        hotText.style['background-color'] = "red";
        hotText.style.color = 'white'
    } else if (maxTemp > 90 ) {
        hotText.innerHTML = 'very hot'
        hotText.style['background-color'] = "darkred"
        hotText.style.color = 'white'
    } else {
        hotText.innerHTML = 'mild'
        hotText.style['background-color'] = "blue"
        hotText.style.color = 'white'
    }

    var aqiMeaning = document.getElementById('aqimeaning')
    if (aqi == '1') {
      aqiMeaning.innerHTML = 'Good'
      aqiMeaning.style['background-color'] = '#00E400'
    } else if (aqi == '2') {
      aqiMeaning.innerHTML = 'Moderate'
      aqiMeaning.style['background-color'] = '#FFFF00'
    } else if (aqi == '3') {
      aqiMeaning.innerHTML = 'Unhealthy for sensitive groups'
      aqiMeaning.style['background-color'] = '#FF7E00'
    } else if (aqi == '4') {
      aqiMeaning.innerHTML = 'Unhealthy'
      aqiMeaning.style['background-color'] = '#FF0000'
      aqiMeaning.style.color = 'white'
    } else if (aqi == '5') {
      aqiMeaning.innerHTML = 'Very unhealthy'
      aqiMeaning.style['background-color'] = '#7E0023'
      aqiMeaning.style.color = 'white'
    }
  })

// -------------------------------------------------------------------------- //
// ---------- Next, loop through config to print questions to page ---------- //
// -------------------------------------------------------------------------- //

function runQuestions() {
  content.forEach(question => {

    // Question block
    var questionBlock = document.createElement('div')
    questionBlock.setAttribute('class', 'border mb-4 p-1 hide')
    questionBlock.setAttribute('id','question-'+question.id)

    // Question and prompt
    questionBlock.innerHTML += '<h3 class="h5 mt-2">' + question.text + '</h3>'
    questionBlock.innerHTML += '<p>' + question.prompt + '</p>'

    // Draw answer buttons
    question.options.forEach(option => {

      var btn = `<button class="btn-${question.id} btn btn-sm btn-outline-secondary px-2 mr-1" id="btn-${question.id}-${option.optionID}" onclick="answer(${question.id}, ${option.optionID}, ${option.goTo})">${option.copy}</button>`
      questionBlock.innerHTML += btn

    })

    document.getElementById('mainContent').appendChild(questionBlock)
  })
  // end question loop

document.getElementById('question-1').classList.remove('hide')

}

runQuestions();

// set up variables
var needsHelp;
var sensitiveGroup;
var dangerousTemp;
var hasAC;
var hasFan;
var hasWindow;


function answer(question, answer, next) {
  var resp = question + "-" + answer
  console.log('question/answer: ', resp)

  // loop through class btn-question, remove active, add active to id btn-question-answer
  var questionButtons = document.querySelectorAll('.btn-' + question)
  questionButtons.forEach(x => x.classList.remove('active'))
  var clickedBtn = document.getElementById('btn-' + question + '-' + answer)
  clickedBtn.classList.add('active')

  // if question-answer matches a recommendation, activate recommendation
  console.log('resp:', resp)
  var rec = document.getElementById('rec-'+resp)

  if (rec) {
    console.log('rec exists!')
    rec.classList.add('active')
  } else {
    console.log('no rec for this answer')
    // Need to figure out how to turn off Active if somebody changes their ansewr !!!!!!
  }

  // This exposes the next question, specified by goTo
  document.getElementById('question-'+ next).classList.remove('hide')
  document.querySelector(`#question-`+next).scrollIntoView({
    behavior: 'smooth'
});

}
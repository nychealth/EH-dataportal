// set up variables for questions
var isOverheating;
var needsHelp;
var sensitiveGroup;
var usesEME;
var doesBehavior;
var isSensitiveAge;
var hasAnimal;
var hasAC;
var limitsAC
var typeAC;
var hasFan;
var hasWindow;

// other variables
var over78F;
var aqiInterpretation;
var aqi
var warmSeason;
var currentTemp



// ----------------------------------------------------------------- //
// ---------- First, ingest weather API and print to page ---------- //
// ----------------------------------------------------------------- //

// API documentation: https://www.weatherapi.com/docs/
// Sample returns: https://www.weatherapi.com/api-explorer.aspx#forecast

var apiData;
fetch('http://api.weatherapi.com/v1/forecast.json?key=0d4a042ad8ec468da7b135156231711&q=NYC&days=1&aqi=yes&alerts=no')
    .then(response => {return response.json()})
    .then(data => {
    // console.log(data)
    apiData = data

    printToPage()
  })

function printToPage() {
    // Print current temp, max temp, and AQI
    currentTemp = apiData.current.temp_f
    document.getElementById('currentTemp').innerHTML = currentTemp + '° F'


    var maxTemp = apiData.forecast.forecastday[0].day.maxtemp_f
    document.getElementById('maxTemp').innerHTML = maxTemp  + '° F'

    aqi = apiData.current.air_quality["us-epa-index"]
    // document.getElementById('aqi').innerHTML = aqi

    // Style temp interpretation
      var hotText = document.getElementById('hot')

      if (maxTemp > 77.9) {
        over78F = 'Yes'
      }

    if (maxTemp > 80 & maxTemp < 85) {
        hotText.innerHTML = 'warm'
        hotText.style['background-color'] = "orange";
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
        hotText.style.color = 'white';
        over80F = 'No'
    }

    document.getElementById('over80F').innerHTML = over80F


    var aqiMeaning = document.getElementById('aqimeaning')
    if (aqi == '1') {
      aqiInterpretation = 'Good'
      aqiMeaning.style['background-color'] = '#00E400'
    } else if (aqi == '2') {
      aqiInterpretation = 'Moderate'
      aqiMeaning.style['background-color'] = '#FFFF00'
    } else if (aqi == '3') {
      aqiInterpretation = 'Unhealthy for sensitive groups'
      aqiMeaning.style['background-color'] = '#FF7E00'
    } else if (aqi == '4') {
      aqiInterpretation = 'Unhealthy'
      aqiMeaning.style['background-color'] = '#FF0000'
      aqiMeaning.style.color = 'white'
    } else if (aqi == '5') {
      aqiInterpretation = 'Very unhealthy'
      aqiMeaning.style['background-color'] = '#7E0023'
      aqiMeaning.style.color = 'white'
    }
    aqiMeaning.innerHTML = aqiInterpretation
    document.getElementById('aqiNum').innerHTML = aqi

}

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

      var btn = `<button class="btn-${question.id} btn btn-sm btn-outline-secondary px-2 mr-1 mb-1" id="btn-${question.id}-${option.optionID}" onclick="answer(${question.id}, ${option.optionID}, ${option.goTo});${option.setVariable}">${option.copy}</button>`
      questionBlock.innerHTML += btn

    })

    // Create message Section
    var message = `<div id="message-${question.id}" class="hide inline-block my-2 p-2 border border-primary">Here's message</div>`
    questionBlock.innerHTML += message

    document.getElementById('mainContent').appendChild(questionBlock)

    /*
    // Create secondary message section?
    var answerMessage = `<div id="am-${question.id}" class="border my-2">Post answer message goes here</div>`
    questionBlock.innerHTML += answerMessage
    */

  })
  // end question loop

document.getElementById('question-1').classList.remove('hide')

}





// -------------------------------------------------------------------------- //
// ---------- Answer functionality                                 ---------- //
// -------------------------------------------------------------------------- //
function answer(question, answer, next) {

  // get question
  var thisQuestion;
  for (let i = 0; i < content.length; i++) {
    if (content[i].id === question) {
      thisQuestion = content[i]
    } else {}
  } 

  // get answer
  var thisAnswer;
  for (let i = 0; i < thisQuestion.options.length; i++) {
    if (thisQuestion.options[i].optionID === answer) {
      thisAnswer = thisQuestion.options[i]
    } else {}
  }

  // console.log(thisAnswer)

  // print message
  var message = document.getElementById('message-' + thisQuestion.id)
  message.classList.remove('hide')
  message.innerHTML = thisAnswer.message 

  console.log('next',next)
  // This exposes the next question, specified by goTo
  if (next === 99) {
    console.log('next is 99')
    runFinal()
  } else {
    document.getElementById('question-'+ next).classList.remove('hide')
    /* 
    document.querySelector(`#message-`+thisAnswer.optionID).scrollIntoView({
      behavior: 'smooth'
    });
    */
  }


  // loop through class btn-question, remove active, add active to id btn-question-answer
  var questionButtons = document.querySelectorAll('.btn-' + question)
  questionButtons.forEach(x => x.classList.remove('active'))
  var clickedBtn = document.getElementById('btn-' + question + '-' + answer)
  clickedBtn.classList.add('active')


/* Commenting out recommendations panel for questions - since it's not a question -> recommendation, but rather, multivariate
// Based on config - does an answer change a variable?
// Then, run a Recommendation() function - does a changed variable trigger a recommendation? 

  var resp = question + "-" + answer

  // if question-answer matches a recommendation, activate recommendation
  var rec = document.getElementById('rec-'+resp)

  if (rec) {
    console.log('rec exists!')
    rec.classList.add('active') // we can change this to trigger a recommendation, running through a rec script that reads the temp and aqi variables.
  } else {
    console.log('no rec for this answer')
    // Need to figure out how to turn off Active if somebody changes their ansewr !!!!!!
  }
  */

}

// -------------------------------------------------------------------------- //
// ---------- These functions set variables; they're set in config ---------- //
// -------------------------------------------------------------------------- //

function overheating(x) {
  isOverheating = x
  document.getElementById('isOverheating').innerHTML = isOverheating
}

function help(x) {
  needsHelp = x
  document.getElementById('needsHelp').innerHTML = needsHelp
}

function sensitive(x) {
  sensitiveGroup = x
  document.getElementById('sensitiveGroup').innerHTML = sensitiveGroup
}

function eme(x) {
  usesEME = x
  document.getElementById('usesEME').innerHTML = usesEME

}

function behavior(x) {
  doesBehavior = x
  document.getElementById('doesBehavior').innerHTML = doesBehavior

}

function age(x) {
  isSensitiveAge = x;
  document.getElementById('isSensitiveAge').innerHTML = isSensitiveAge

}

function animal(x) {
  hasAnimal = x;
  document.getElementById('hasAnimal').innerHTML = hasAnimal

}

function ac(x) {
  hasAC = x
  document.getElementById('hasAC').innerHTML = hasAC
}

function limitAC(x) {
  limitsAC = x;
  document.getElementById('limitsAC').innerHTML = limitsAC

}

function acType(x) {
  typeAC = x;
  document.getElementById('typeAC').innerHTML = typeAC

}

function fan(x) {
  hasFan = x
  document.getElementById('hasFan').innerHTML = hasFan
}

function ifWindow(x) {
  hasWindow = x
  document.getElementById('hasWindow').innerHTML = hasWindow

}

function runFinal() {
  var msg
  console.log('We are reviewing your data')
  document.getElementById('finalInfo').classList.remove('hide')

  var finalMessageText = document.getElementById('finalMessages')

  // Message 1
  if (needsHelp == 'Yes' || 
    (warmSeason === 'Yes' && (isSensitiveAge ==='Yes' || sensitiveGroup === 'Yes' || doesBehavior === 'Yes'))
  ) {
    msg = '<p><strong>You have potentially serious symptoms.</strong> Find medical providers here.</p>'
    finalMessageText.innerHTML += msg
  }

  // Message 2
  if (aqi > 3 || 
    (aqi > 2 && sensitiveGroup === 'Yes')) {
    msg = '<p><strong>You are more sensitive to air pollution,</strong>, and <strong>the Air Quality Index is elevated</strong> Consider wearing a mask outside. Read more about mask use.</p>'
    finalMessageText.innerHTML += msg
  }

  // Message 3
  if (over78F === 'Yes' && hasAC === 'No') {
    msg = '<p><strong>It’s warm, and you don’t have an AC</strong>. A fan can help cool you down. But it won’t cool the air – if it’s too hot inside, it’s just moving hot air around, and can make you even warmer. </p>'
    finalMessageText.innerHTML += msg
  }

  // Message 4
  if (hasAC === 'No' && (over78F === 'Yes' || isOverheating === 'Yes')) {
    msg = '<p><strong>It’s hot outside and you don’t have an AC</strong>. Open a window to cool down your home. Keep shades drawn during the day to prevent sunlight from heating up your home. </p>'
    finalMessageText.innerHTML += msg
  }

  // Message 5
  if (hasAC === 'No' && (currentTemp > 94.9 || (currentTemp > 84.5 && (aqi > 3|| (aqi > 2 && sensitiveGroup === 'Yes'))))) {
    msg = '<strong>Air conditioning is the best way to stay safe when it is this hot.</strong> Get a list of public air conditioned spaces here.  '
    finalMessageText.innerHTML += msg
  }

  // Message 6
  if (typeAC === 'Window/wall') {}
  
  // Message 7
  if (currentTemp > 85 || sensitiveGroup === 'Yes' || aqi > 2 || isSensitiveAge === 'Yes' ) {}

  // Message 8
  if (currentTemp > 80 ) {
    msg = 'Limit activities that can heat up your home like indoor cooking.'
    finalMessageText.innerHTML += msg
  }

  // Message 9


  // Message 10
  if (currentTemp > 85 || isOverheating === 'Yes') {
    msg = 'Using AC at home is the best way to stay safe when it is hot outside.  Set your unit to 78 degrees or "low cool" to reduce energy consumption and remain safe from the heat.'
    finalMessageText.innerHTML += msg
  }

  // 

}


// -------------------------------------------------------------------------- //
// ---------- Determines if we're in warm season ---------------------------- //
// -------------------------------------------------------------------------- //
function isSummerDate() {
  // Get the current date
  var currentDate = new Date();

  // Set the start and end dates for summer (April 1 and September 30)
  var summerStart = new Date(currentDate.getFullYear(), 3, 1); // Month is zero-based
  var summerEnd = new Date(currentDate.getFullYear(), 8, 30); // Month is zero-based

  // Check if the current date is between April 1 and September 30
  return currentDate >= summerStart && currentDate <= summerEnd;
}

// Example usage
if (isSummerDate()) {
  console.log('It is summer!');
  warmSeason = 'Yes'
} else {
  console.log('It is not summer.');
  warmSeason = 'No'
}
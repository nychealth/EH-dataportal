// set up variables for questions

var sensitiveGroup  = "No"
var usesEME         = "No"
var hasAnimal       = "No"
var hasAC           = "No"
var limitsAC        = "No"
var hasFan          = "No"
var currentTemp     = "No"
var forecastTemp;
var maxTemp;
var aqi             = "No"

// other variables
var over78F;
var aqiInterpretation;
var tempLabel;

var warmSeason;




// ----------------------------------------------------------------- //
// ---------- First, ingest weather API and print to page ---------- //
// ----------------------------------------------------------------- //

// API documentation: https://www.weatherapi.com/docs/
// Sample returns: https://www.weatherapi.com/api-explorer.aspx#forecast

var apiData;
fetch('https://api.weatherapi.com/v1/forecast.json?key=0d4a042ad8ec468da7b135156231711&q=NYC&days=1&aqi=yes&alerts=no')
    .then(response => {return response.json()})
    .then(data => {
    // console.log(data)
    apiData = data

    printToPage()
    getAQI()
  })

// WeatherAPI.com returns different AQI than EPA/Airnow, so, we use a different call for consistent AQI data.
// https://docs.airnowapi.org/forecastsbyzip/query
// https://docs.airnowapi.org/ForecastsByZip/docs

var aqiAPI;
function getAQI() {
  fetch('https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=10013&distance=25&API_KEY=B34C7BA1-26C7-4DD2-9B1C-AAFD7AF4F12F')
  .then(response => {return response.json()})
  .then(data => {
    console.log('airnow api:')
    console.log(data)
    aqiAPI = data

    if (aqiAPI[0].AQI > aqiAPI[1].AQI) {
      aqi = aqiAPI[0].Category.Number
    } else {
      aqi = aqiAPI[1].Category.Number
    }

    console.log('aqi is: ' + aqi)

    // print to page and style
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
      aqiMeaning.style['background-color'] = '#993399'
      aqiMeaning.style.color = 'white'
    } else if (aqi == '6') {
      aqiInterpretation = 'Hazardous'
      aqiMeaning.style['background-color'] = '#7E0023'
      aqiMeaning.style.color = 'white'
    }
    aqiMeaning.innerHTML = aqiInterpretation
    document.getElementById('aqiNum').innerHTML = aqi
  })
}

function printToPage() {
    // Print current temp, max temp, and AQI
    currentTemp = Number(apiData.current.temp_f)
    forecastTemp = Number(apiData.forecast.forecastday[0].day.maxtemp_f)
    
    document.getElementById('currentTemp').innerHTML = currentTemp + '° F'
    document.getElementById('forecastTemp').innerHTML = forecastTemp  + '° F'


    if (currentTemp >= forecastTemp) {
      maxTemp = currentTemp
    } else {
      maxTemp = forecastTemp
    }

    // Style temp interpretation
      var hotText = document.getElementById('hot')

      if (maxTemp > 77.9) {
        over78F = 'Yes'
      }

    if (maxTemp >= 78 & maxTemp < 85) {
        tempLabel = 'warm'
        hotText.style['background-color'] = "orange";
    } else if (maxTemp >= 85 & maxTemp < 90) {
        tempLabel = 'hot'
        hotText.style['background-color'] = "red";
        hotText.style.color = 'white'
    } else if (maxTemp >= 90 ) {
        tempLabel = 'very hot'
        hotText.style['background-color'] = "darkred"
        hotText.style.color = 'white'
    } else if (maxTemp < 80) {
        tempLabel = 'mild'
        hotText.style['background-color'] = "blue"
        hotText.style.color = 'white';
        over80F = 'No'
    }

      hotText.innerHTML = tempLabel

    document.getElementById('over80F').innerHTML = over80F

}

// -------------------------------------------------------------------------- //
// ---------- Next, loop through config to print questions to page ---------- //
// -------------------------------------------------------------------------- //

function runQuestions() {

  document.getElementById('allContent').classList.remove('hide')

  content.forEach(question => {

    // Question block
    var questionBlock = document.createElement('div')
    questionBlock.setAttribute('class', 'border-top mb-4 p-1 hide')
    questionBlock.setAttribute('id','question-'+question.id)
    questionBlock.innerHTML = `<div class="row"><div class="col-9"><h3 class="h5 mt-2">${question.text}</h3><p>${question.prompt}</p></div><div class="col-3"><img src="img/${question.image}" style="width:100%"></div></div>`

    // Draw answer buttons
    question.options.forEach(option => {

      var btn = `<button class="btn-${question.id} btn btn-sm btn-outline-secondary px-2 mr-1 mb-1" id="btn-${question.id}-${option.optionID}" onclick="answer(${question.id}, ${option.optionID}, ${option.goTo});${option.setVariable}">${option.copy}</button>`
      questionBlock.innerHTML += btn

    })

    // Create message Section
    var message = `<div id="message-${question.id}" class="hide inline-block my-2 p-2 border border-primary">Here's message</div>`
    questionBlock.innerHTML += message

    document.getElementById('mainContent').appendChild(questionBlock)

  })
  // end question loop

document.getElementById('question-1').classList.remove('hide')
document.getElementById('question-1').scrollIntoView({
      behavior: 'smooth'
    })

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

  // print message
  var message = document.getElementById('message-' + thisQuestion.id)
  message.classList.remove('hide')
  message.innerHTML = thisAnswer.message 

  // console.log('next',next)
  // This exposes the next question, specified by goTo
  if (next === 99) {
    // console.log('next is 99')
    runFinal()
    document.getElementById('messageResults').scrollIntoView({
      behavior: 'smooth'
    })
  } else {
    document.getElementById('question-'+ next).classList.remove('hide')
    document.getElementById('message-'+ thisQuestion.id).scrollIntoView({
      behavior: 'smooth'
    })

  }


  // loop through class btn-question, remove active, add active to id btn-question-answer
  var questionButtons = document.querySelectorAll('.btn-' + question)
  questionButtons.forEach(x => x.classList.remove('active'))
  var clickedBtn = document.getElementById('btn-' + question + '-' + answer)
  clickedBtn.classList.add('active')

}

// -------------------------------------------------------------------------- //
// ---------- These functions set variables; they're set in config ---------- //
// -------------------------------------------------------------------------- //

function sensitive(x) {
  sensitiveGroup = x
  document.getElementById('sensitiveGroup').innerHTML = sensitiveGroup
}

function eme(x) {
  usesEME = x
  document.getElementById('usesEME').innerHTML = usesEME
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

function fan(x) {
  hasFan = x
  document.getElementById('hasFan').innerHTML = hasFan
}


// -------------------------------------------------------------------------- //
// ---------- Run recommendations -------------------------------- ---------- //
// -------------------------------------------------------------------------- //
function runFinal() {
  var msg
  console.log('We are reviewing your data')

  document.getElementById('finalInfo').classList.remove('hide')
  // document.getElementById('testInfo').classList.remove('hide')

  var finalMessageText = document.getElementById('finalMessages')
  finalMessageText.innerHTML = ''

  // Message 0: Default, resources, with AC
  if (maxTemp < 78 && hasAC === 'Yes') {
    msg = `<p>Because it's not too warm today, you probably won't need AC. But when it's hot, spending time in air conditioning is important to staying healthy. Ask friends and family if they have AC. If they don't, tell them about  <a href="https://finder.nyc.gov/coolingcenters/">Cool Options, a list of air-conditioned places that are open and free to all</a>. </p>`
    
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message 0b: Default, resources, noAC
  if (maxTemp < 78 && hasAC === 'No') {
    msg = `<p>Today's temperature is not too warm.  Before it gets too hot, make a plan for how you can get relief from the heat - whether with air conditioning at home or in other cool spaces. Find out if your friends, family members, and neighbors have AC, and make sure you know of <a href="https://finder.nyc.gov/coolingcenters/">nearby public places to go to stay cool</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message. Warm and no AC.
  if (maxTemp > 78 && hasAC === 'No' && aqi < 3) {
    msg = `<p>It's ` + tempLabel + `, and you don't have an AC. If it's hotter inside than outside, open windows to try to cool down your home.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: warm, no AC, bad AQ
  if (maxTemp > 78 && hasAC === 'No' && aqi >= 3) {
    msg = `<p>It's ` + tempLabel + `, and you don't have an AC. Open windows to try to cool down your home. Even though the air quality is poor, it is more important to stay cool right now.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: warm, no AC, Fan
  if (maxTemp > 78 && hasAC === 'No' && hasFan === 'Yes') {
    msg = `<p>If it's cooler outside than inside, your fan can help cool you down. But if it's too hot , it can actually make you even warmer. It's better to spend time in AC.  <a href="https://finder.nyc.gov/coolingcenters/">Find a cool place to go</a>. Also, you can <a href="https://www.epa.gov/air-research/research-diy-air-cleaners-reduce-wildfire-smoke-indoors">use your fan as a DIY air purifier for when the Air Quality Index is unhealthy</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }


  // Message: no AC
  if (hasAC === 'No') {
    msg = `<p>About 9% of NYC households don't have an AC - but it's the best way to stay safe when it's hot. Find out if you're eligible for the <a href="https://portal.311.nyc.gov/article/?kanumber=KA-02529">Home Energy Assistance Program</a> which can help make air conditioning your home more affordable.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: Hot and AC
  if (maxTemp >= 85 && hasAC === 'Yes') {
    msg = `<p>Air conditioning is the best way to stay safe when it's this hot, so now's the time to turn it on!  Reach out to family, neighbors, and friends to make sure they have AC or <a href="https://finder.nyc.gov/coolingcenters/">know where to find a cool place</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: Hot and No AC
  if (maxTemp >= 85 && hasAC === 'No') {
    msg = `<p>Air conditioning is the best way to stay safe when it's this hot. Since you don't have AC, <a href='https://:finder.nyc.gov/coolingcenters/'>visit a cool public place</a>, or a friend or family member who has AC. Taking a cool shower can also help temporarily. If you can't leave your home, keep your windows open if it's hotter inside than outside. Make sure to drink lots of water and try to avoid alcohol and caffeine. <a href="https://www.nyc.gov/site/doh/health/emergency-preparedness/emergencies-extreme-weather-heat.page">Get more information on hot weather and health</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: Limits AC, not warm
  if (maxTemp <= 78 && limitsAC === 'Yes') {
    msg = `<p>You sometimes limit use of your AC because of the cost. Before it gets hot, get help with your home cooling energy bills. Find out if you're eligible for <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'>Con Ed's Energy Affordability Program</a>, which can help make air conditioning your home more affordable.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message: Limits AC,  warm
  if (maxTemp >78 && limitsAC === 'Yes') {
    msg = `<p>You sometimes limit use of your AC because of the cost, but on ` + tempLabel + ` days like today, it's time to turn it on. Using AC for just a few hours a day on 'low cool' or 78 degrees can keep your home from getting dangerously hot. Find out if you're eligible for <a href='www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'>Con Ed's Energy Affordability Program</a>, which can help make air conditioning your home more affordable. You can also <a href="https://finder.nyc.gov/coolingcenters/">find an air-conditioned space to visit</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // OVERALL AIR QUALITY MESSAGE BUNDLE
  if (aqi === 1 || (aqi < 4 && sensitiveGroup === 'No')) {
    msg = `<p>The air quality today is fine for you. Stay informed - sign up for air quality alerts at <a href="https://www.airnow.gov/">AirNow</a> and sign up for <a href="a858-nycnotify.nyc.gov/notifynyc/">Notify NYC alerts</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  if (aqi === 2 && sensitiveGroup === 'Yes') {
    msg = `<p>The air quality is moderate, but you may be more sensitive to pollution. If you spend time outdoors, follow routine precautions to manage any existing conditions.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  if (aqi === 3 && sensitiveGroup === 'Yes') {
    msg = `<p>The air quality is unhealthy for people more sensitive to air pollution. Air pollution can harm health. Limit strenuous and prolonged (over an hour) outdoor activities. Consider wearing a mask outside if you are experiencing symptoms, like coughing or throat or eye irritation. <a href="https://www.nyc.gov/site/doh/health/health-topics/air-quality-fire-smoke-and-effect-on-air-quality.page">Learn more about wearing masks</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  if (aqi === 4 && sensitiveGroup === 'No') {
    msg = `<p>The air quality today is unhealthy. Air pollution can harm health. Limit strenuous and prolonged (over an hour) outdoor activities. Consider wearing a mask outside if you are experiencing symptoms, like coughing or throat or eye irritation. <a href="https://www.nyc.gov/site/doh/health/health-topics/air-quality-fire-smoke-and-effect-on-air-quality.page">Learn more about wearing masks</a></p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  if ((aqi === 4 && sensitiveGroup === 'Yes') || aqi === 5) {
    msg = `<p>The air quality today is unhealthy. Air pollution can harm health. Avoid any unnecessary outdoor activities. Consider wearing a mask outside if you are experiencing symptoms, like coughing or throat or eye irritation. <a href="https://www.nyc.gov/site/doh/health/health-topics/air-quality-fire-smoke-and-effect-on-air-quality.page">Learn more about wearing masks</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  if (aqi === 6) {
    msg = `<p>The air quality today is very unhealthy. Air pollution can harm health. Avoid any unnecessary outdoor activities. Consider wearing a mask outside if you are experiencing symptoms, like coughing or throat or eye irritation. <a href="https://www.nyc.gov/site/doh/health/health-topics/air-quality-fire-smoke-and-effect-on-air-quality.page">Learn more about wearing masks</a>. </p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // END MAJOR AQI BUNDLE

  // High AQI and not warm - close your windows
  if ((maxTemp < 70 && aqi > 3)
        ||
      (maxTemp < 70 && (aqi > 2 && sensitiveGroup ==='Yes'))) {
    msg = `<p>The air quality is unhealthy today. Close your windows to keep air pollution out.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // high AQI and warm. close windows, use AC.
  if ((maxTemp > 70 && aqi > 3 && hasAC === 'Yes')
    ||
      (maxTemp > 70 && hasAC === 'Yes' && aqi > 2 && sensitiveGroup ==='Yes')) {
    msg = `<p>The air quality is unhealthy today. Keep your windows closed, and use your AC if it gets too hot inside. Keep the AC vent closed, or use "recirculate" mode, which can help filter the air."</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
    }

  // High AQI - indoor air
  if (aqi > 3) {
    msg = `<p>Limit activities that can worsen indoor air, like frying or broiling food, smoking or vaping, vacuuming, burning candles or incense, or using a fireplace.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Hot - indoor air
  if (maxTemp >= 85) {
    msg = `<p>Limit activities that can heat up your indoor space, like using your oven or stove.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // High AQI - filter your air, sensitive.
  if (hasAC === 'Yes' && (
    (sensitiveGroup === 'Yes' && (aqi === 2 || aqi === 3))
  )) {
    msg = `<p>Because the air quality today can be unhealthy for sensitive groups, you may want to take some precautions. Air purifiers with filters can help remove some pollution from the air. Closing the vent on your AC or setting it to re-circulate will help you stay cool while preventing your AC unit from blowing polluted air inside. No matter what, always use your AC when it's hot. Staying cool is the priority. <a href='https://www.nyc.gov/site/doh/health/health-topics/indoor-air-quality.page'>Learn more about indoor air quality</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // High AQI, not sensitive, has AC
  if (aqi > 3 && hasAC === 'Yes') {
    msg = `<p>Because of today's air quality, take some precautions. Air purifiers with filters can help remove some air pollution from the air. Closing the vent on your AC or setting it to re-circulate will help you stay cool while preventing your AC unit from blowing polluted air inside. No matter what, always use your AC when it's hot. Staying cool is the priority. <a href='https://www.nyc.gov/site/doh/health/health-topics/indoor-air-quality.page'>Learn more about indoor air quality</a>.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Pets, high temp or high AQI
  if (hasAnimal === 'Yes' && (maxTemp > 78 || aqi > 3)) {
    msg = `<p>Your animals can't tell you when they are not feeling well. Some animals may need AC when it gets hot. And if the air quality is unhealthy for the general public, keep your animals indoors as much as possible and limit strenuous activity for both you and your animal.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Uses EME
  if (usesEME === 'Yes') {
    msg = `<p>Like 7.6% of New York City households, you use electric medical equipment. Register with your utility provider so they can contact you during an emergency, like a power outage during a heatwave. You will need a medical certificate. ConEd customers should call 1-877-582-6633 or use “MyAccount” online. PSEG customers should call 1-800-490-0025.</p>`
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

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


// -------------------------------------------------------------------------- //
// ---------- Sets up test buttons ---------------------------- //
// -------------------------------------------------------------------------- //

function setUpTest() {
  document.getElementById('testInfo').classList.remove('hide')

  document.getElementById('input-currentTemp').setAttribute('value',currentTemp);
  document.getElementById('input-aqinum').setAttribute('value',aqi);
  if (sensitiveGroup === 'Yes') {
    document.getElementById('btn-sensitiveGroup').classList.add('active')
  }

  if (usesEME === 'Yes') {
    document.getElementById('btn-usesEME').classList.add('active')
  }

  if (hasAnimal === 'Yes') {
    document.getElementById('btn-hasAnimal').classList.add('active')
  }

  if (hasAC === 'Yes') {
    document.getElementById('btn-hasAC').classList.add('active')
  }

  if (limitsAC === 'Yes') {
    document.getElementById('btn-limitsAC').classList.add('active')
  }

  if (hasFan === 'Yes') {
    document.getElementById('btn-hasFan').classList.add('active')
  }
}

// put event listeners on each button to toggle state and variable
var btnSensitiveGroup = document.getElementById('btn-sensitiveGroup');
btnSensitiveGroup.addEventListener('click', function(event) {
  btnSensitiveGroup.classList.toggle('active')
  if (sensitiveGroup === 'Yes') {
    sensitiveGroup = 'No'
  } else { sensitiveGroup = 'Yes'}
  document.getElementById('sensitiveGroup').innerHTML = sensitiveGroup;
  runFinal()
});

// put event listeners on each button to toggle state and variable
var btnusesEME = document.getElementById('btn-usesEME');
btnusesEME.addEventListener('click', function(event) {
  btnusesEME.classList.toggle('active')
  if (usesEME === 'Yes') {
    usesEME = 'No'
  } else { usesEME = 'Yes'}
  document.getElementById('usesEME').innerHTML = usesEME;
  runFinal()
});

// put event listeners on each button to toggle state and variable
var btnhasAnimal = document.getElementById('btn-hasAnimal');
btnhasAnimal.addEventListener('click', function(event) {
  btnhasAnimal.classList.toggle('active')
  if (hasAnimal === 'Yes') {
    hasAnimal = 'No'
  } else { hasAnimal = 'Yes'}
  document.getElementById('hasAnimal').innerHTML = hasAnimal;
  runFinal()
});

// put event listeners on each button to toggle state and variable
var btnhasAC = document.getElementById('btn-hasAC');
btnhasAC.addEventListener('click', function(event) {
  btnhasAC.classList.toggle('active')
  if (hasAC === 'Yes') {
    hasAC = 'No'
  } else { hasAC = 'Yes'}
  document.getElementById('hasAC').innerHTML = hasAC;
  runFinal()
});

// put event listeners on each button to toggle state and variable
var btnlimitsAC = document.getElementById('btn-limitsAC');
btnlimitsAC.addEventListener('click', function(event) {
  btnlimitsAC.classList.toggle('active')
  if (limitsAC === 'Yes') {
    limitsAC = 'No'
  } else { limitsAC = 'Yes'}
  document.getElementById('limitsAC').innerHTML = limitsAC;
  runFinal()
});

// put event listeners on each button to toggle state and variable
var btnhasFan = document.getElementById('btn-hasFan');
btnhasFan.addEventListener('click', function(event) {
  btnhasFan.classList.toggle('active')
  if (hasFan === 'Yes') {
    hasFan = 'No'
  } else { hasFan = 'Yes'}
  document.getElementById('hasFan').innerHTML = hasFan;
  runFinal()
});

// temp
var inputCurrentTemp = document.getElementById('input-currentTemp');
if (inputCurrentTemp) {
  inputCurrentTemp.addEventListener('input', function(event) {
      var currentValue = parseFloat(this.value);
      console.log('Current temperature:', currentValue);
      maxTemp = currentValue
      document.getElementById('currentTemp').innerHTML = currentValue

      var hotText = document.getElementById('hot')
      if (currentValue > 78 & currentValue < 85) {
        tempLabel = 'warm'
        hotText.style['background-color'] = "orange";
    } else if (currentValue >= 85 & currentValue < 90) {
        tempLabel = 'hot'
        hotText.style['background-color'] = "red";
        hotText.style.color = 'white'
    } else if (currentValue >= 90 ) {
        tempLabel = 'very hot'
        hotText.style['background-color'] = "darkred"
        hotText.style.color = 'white'
    } else if (currentValue < 78) {
        tempLabel = 'mild'
        hotText.style['background-color'] = "blue"
        hotText.style.color = 'white';
        over80F = 'No'
    }
        hotText.innerHTML = tempLabel

      runFinal()
  })
};

// aqi
var inputAQI = document.getElementById('input-aqinum');
if (inputAQI) {
  inputAQI.addEventListener('input', function(event) {
      var currentValue = parseFloat(this.value);
      console.log('Current temperature:', currentValue);
      aqi = currentValue
      document.getElementById('aqiNum').innerHTML = currentValue

      // re-style AQI text
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
        aqiMeaning.style['background-color'] = '#993399'
        aqiMeaning.style.color = 'white'
      } else if (aqi == '6') {
        aqiInterpretation = 'Hazardous'
        aqiMeaning.style['background-color'] = '#7E0023'
        aqiMeaning.style.color = 'white'
      }
      aqiMeaning.innerHTML = aqiInterpretation
      document.getElementById('aqiNum').innerHTML = aqi

      runFinal()
  })
};
// set up variables for questions

var sensitiveGroup  = "No"
var usesEME         = "No"
var hasAnimal       = "No"
var hasAC           = "No"
var limitsAC        = "No"
var hasFan          = "No"
var currentTemp     = "No"
var aqi             = "No"

// other variables
var over78F;
var aqiInterpretation;

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

// WeatherAPI.com returns different AQI than EPA/Airnow, so, using different call for consistent AQI data.
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
    currentTemp = apiData.current.temp_f
    document.getElementById('currentTemp').innerHTML = currentTemp + '° F'


    var maxTemp = Number(apiData.forecast.forecastday[0].day.maxtemp_f)
    document.getElementById('maxTemp').innerHTML = maxTemp  + '° F'

    // aqi = apiData.current.air_quality["us-epa-index"]

    // Style temp interpretation
      var hotText = document.getElementById('hot')

      if (maxTemp > 77.9) {
        over78F = 'Yes'
      }

    if (maxTemp >= 78 & maxTemp < 85) {
        hotText.innerHTML = 'warm'
        hotText.style['background-color'] = "orange";
    } else if (maxTemp >= 85 & maxTemp < 90) {
        hotText.innerHTML = 'hot'
        hotText.style['background-color'] = "red";
        hotText.style.color = 'white'
    } else if (maxTemp >= 90 ) {
        hotText.innerHTML = 'very hot'
        hotText.style['background-color'] = "darkred"
        hotText.style.color = 'white'
    } else if (maxTemp < 80) {
        hotText.innerHTML = 'mild'
        hotText.style['background-color'] = "blue"
        hotText.style.color = 'white';
        over80F = 'No'
    }

    document.getElementById('over80F').innerHTML = over80F

}

// -------------------------------------------------------------------------- //
// ---------- Next, loop through config to print questions to page ---------- //
// -------------------------------------------------------------------------- //

function runQuestions() {

  content.forEach(question => {

    // Question block
    var questionBlock = document.createElement('div')
    questionBlock.setAttribute('class', 'border-top mb-4 p-1 hide')
    questionBlock.setAttribute('id','question-'+question.id)
    questionBlock.innerHTML = `<div class="row"><div class="col-9"><h3 class="h5 mt-2">${question.text}</h3><p>${question.prompt}</p></div><div class="col-3"><img src="img/${question.image}" style="width:100%"></div></div>`

    // Question and prompt
    // questionBlock.innerHTML += `<div class="float-right p-1" style="height: 200px;"><img src="img/${question.image}" style="height:100%"></div><p></p>` + '<h3 class="h5 mt-2">' + question.text + '</h3>'
    // questionBlock.innerHTML += `<p>` + question.prompt + `</p>`

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

  // console.log(thisAnswer)

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
    // Need to figure out how to turn off Active if somebody changes their answer !!!!!!
  }
  */

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


function runFinal() {
  var msg
  console.log('We are reviewing your data')

  document.getElementById('finalInfo').classList.remove('hide')
  // document.getElementById('testInfo').classList.remove('hide')

  var finalMessageText = document.getElementById('finalMessages')
  finalMessageText.innerHTML = ''

  // Message 0 - default / look at resources.
  if (currentTemp < 70) {
  msg = "<p><strong> Today's temperature is not too warm. </strong> Before it gets too hot find out if your friends, family members, or neighbors have AC, and make sure you know of nearby public places to go to stay cool to recommend to others who don't have AC. It could save someone's life.</p>"
    finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

    // Message 4 - warm and no AC
    if (hasAC === 'No' && currentTemp > 78 && aqi < 3) {
      msg = '<p><strong>It’s hot, and you don’t have an AC</strong>. If it’s hotter inside than outside, open your window to try to keep your home cool.</p>'
      finalMessageText.innerHTML += msg + '<hr class="my-2">'
  
    }

    // Message 4a - warm and no AC, plus bad AQ
    if (hasAC === 'No' && currentTemp > 78 && aqi >= 3) {
      msg = '<p><strong>It’s hot, and you don’t have an AC</strong>. Open your window to try to keep your home cool. Even though the air quality is poor, it is more important to stay cool right now.</p>'
      finalMessageText.innerHTML += msg + '<hr class="my-2">'
  
    }

  // Message 2 - warm and no AC? Use a fan. 
  if (hasAC === 'No' && currentTemp > 78 && hasFan === 'Yes') {
    msg = '<p>Your fan can help cool you down. But it won’t cool the air – if it’s too hot inside, it’s just moving hot air around, and can make you even warmer. <a href="https://finder.nyc.gov/coolingcenters/">Find a cool place to go</a>.</p><p>When the Air Quality Index is bad, <a href="https://www.epa.gov/air-research/research-diy-air-cleaners-reduce-wildfire-smoke-indoors"> you can also use your fan as a DIY air purifier.</a> </p>'
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

  // no AC
  if (hasAC === 'No') {
    msg = `<p>About 9% of NYC households are like you, and don't have an AC - but it's the best way to stay safe when it's hot. Find out if you're eligible for <a href="https://portal.311.nyc.gov/article/?kanumber=KA-02529"> Home Energy Assistance Program </a> and <a href="https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill"> Con Ed's Energy Affordability Program, </a> which can help make air conditioning your home more affordable.</p>`
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }


  // Message 5 - hot and AC
  if ( currentTemp > 85 && hasAC === 'Yes') {
    msg = '<p><strong>Air conditioning is the best way to stay safe when it’s this hot. </strong> Reach out to friends to make sure they have a place to cool off. </p>'
  finalMessageText.innerHTML += msg + '<hr class="my-2">'

  }

  // Message 6 - hot and no AC
  if ( currentTemp > 85 && hasAC === 'No') {
    msg = "<p><strong>Air conditioning is the best way to stay safe when it’s this hot</strong>. Since you don't have AC, <a href='https://finder.nyc.gov/coolingcenters/'>visit a cool public place</a>, or friend or family member who has AC. Taking a cool shower can also help temporarily. When you are at home, continue to be mindful of the heat and make sure to drink enough water. </p>"
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

  // Limits AC, not warm
  if (limitsAC === 'Yes' && currentTemp <= 78) {
    msg = "<p><strong>You have an AC, but sometimes limit use because of the cost</strong>. Before it gets hot, get help with your home cooling. Find out if you're eligible for <a href='https://portal.311.nyc.gov/article/?kanumber=KA-02529'> HEAP </a> and <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'> Con Ed's Energy Affordability Program, </a> which can help make air conditioning your home more affordable.</p>"
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

  // Limits AC and is warm
  if (limitsAC === 'Yes' && currentTemp > 78) {
    msg = "<p><strong>You have an AC, but sometimes limit use because of the cost</strong>. Using AC for even a few hours a day on 'low cool' or 78 degrees can keep your home from getting dangerously hot. Find out if you're eligible for <a href='https://portal.311.nyc.gov/article/?kanumber=KA-02529'> HEAP </a> and <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'> Con Ed's Energy Affordability Program, </a> which can help make air conditioning your home more affordable.</p>"
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }


  // Message 0.5 - default low aqi / look at resources 
  if (aqi < 3 ) {
    msg = "<p><strong> The air quality today is fine for you.</strong> Before an air quality emergency, make sure you know what to do and what supplies you need to stay safe. </p>"
      finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }


  // AQI BUNDLE:
   // Message 0.75 - default bad aqi / declares bad aqi

   if (sensitiveGroup === 'Yes' && aqi > 2) {
      msg = "<p><strong> The air quality is bad, and you're more sensitive to air pollution</strong>. Air pollution can harm health.  Limit strenuous and prolonged (over 1 hour) outdoor activities. <a href='https://www.nyc.gov/assets/doh/downloads/pdf/eode/aqi-guidelines-general.pdf'>More info on what to do when the air quality is bad</a>.</p>"
      finalMessageText.innerHTML+= msg + '<hr class="my-2">'
   }

   if (aqi > 3 && sensitiveGroup != 'Yes' ) {
    msg = "<p><strong> The air quality is bad.</strong> Your recommendations will reflect this. Limit strenuous and prolonged (over 1 hour) outdoor activities.  <a href='https://www.nyc.gov/assets/doh/downloads/pdf/eode/aqi-guidelines-general.pdf'>More info on what to do when the air quality is bad</a>. </p>"
      finalMessageText.innerHTML+= msg + '<hr class="my-2">'
  }

  // Message 1 - AQI / wear a mask
  if (aqi > 3 || 
    (aqi > 2 && sensitiveGroup === 'Yes')) {
    msg = '<p><strong>Because of the air quality today</strong>, consider staying indoors as much as possible to reduce health risks. If you need to open a window to stay cool, that is fine too — staying cool is always the most important. If you must be outdoors, limit exercise and strenuous activity. Consider wearing a mask outside, or inside if you open the windows. <a href="https://www.nyc.gov/site/doh/health/health-topics/air-quality-fire-smoke-and-effect-on-air-quality.page> Read more about when to use a mask.</a></p>'
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

      // Message 3b - high AQI and not warm - close your windows
      if ( 
        (currentTemp < 60 && aqi > 3) ||
        (currentTemp < 60 && aqi > 2 && sensitiveGroup === 'Yes')
        ) {
          msg = '<p>Close your windows to prevent the air pollution from getting in. </p>'
          finalMessageText.innerHTML += msg + '<hr class="my-2">'
        }

    // Message 3 - high AQI and warm - close your windows and use your AC
    if ( 
      (hasAC === 'Yes' && currentTemp > 70 && aqi > 3) || 
      (hasAC === 'Yes' && currentTemp > 70 && aqi > 2 && sensitiveGroup === 'Yes')
      ) {
        msg = "<p>Close your windows to prevent the air pollution from getting in. Closed windows can make your space warmer, so use your AC to stay cool and comfortable if you need to. </p>"
        finalMessageText.innerHTML += msg + '<hr class="my-2">'
      }
  
  // Message 7 - hot or high AQI
  if (currentTemp > 85 || aqi > 3) {
    msg = '<p>Cooking can heat up your home and gas stoves can pollute your indoor air. When it is really hot out or the Air Quality Index is bad, cooking less with appliances that heat the home can help. Consider cooking with a microwave. </p> <p>Other activities that can worsen indoor air: smoking or vaping tobacco or cannabis products, vacuuming, burning candles or incense, or using a fireplace.</p>'    
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

  // High AQI -> Filter your air.
  if (
    ( hasAC === 'Yes') &&
    ((sensitiveGroup === 'Yes' && aqi > 2) || (aqi > 3))
    ) {
      msg = "<p><strong>Because of the bad air quality</strong>, you may want to take some precautions. Air purifiers with filters can help remove some air pollution from the air. Air cleaners that kill viruses or bacteria using ultraviolet (UV) light will not remove air pollution from the air. Some air cleaners release ozone gas, which is bad for your lungs and an asthma trigger. Don't use these under any conditions.</p> <p> Closing the vent on your AC or setting it to re-circulate will help you stay cool while preventing your AC unit from blowing polluted air inside. Remember to change the filter every month during the summer and after any air quality emergency.</p> <p> If you can't find a way to close the vent or set the AC to re-circulate, you should still use the AC regardless of the air quality outside. Remember that when it’s this hot outside, being overheated can make you very sick much more quickly than breathing in polluted air. Staying cool is the priority. <a href='https://www.nyc.gov/site/doh/health/health-topics/indoor-air-quality.page'> Learn more about indoor air quality.</a></p>"
      finalMessageText.innerHTML += msg + '<hr class="my-2">'
    }



  // Pets, high temp or high AQI
  if ( hasAnimal === 'Yes' && 
      (currentTemp > 80 || aqi > 3)
  ) {
    msg = '<p><strong>Your animals </strong> can’t tell you when they are not feeling well. </p> <p>Generally, if it is more than 80 degrees outside, animals need AC. And if the air quality is unhealthy for the general public, animals may need to spend more time indoors than usual. </p><p><a href="https://www.heat.gov/"> Learn more about who is most at risk during extreme heat. </a></p>'
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
  }

  // uses EME
  if (usesEME === 'Yes') {
    msg = '<p><strong>Like 7.6% of New York City households, you use electric medical equipment, (like a wheelchair, nebulizer, respirator, or dialysis machine). </strong> You can register these with your utility provider so they can contact you during an emergency, like a power outage during a heatwave. You will need a medical certificate. <p>ConEd customers call 1-877-582-6633 or use “MyAccount” online. PSEG customers can call Call 1-800-490-0025. </p>'
    finalMessageText.innerHTML += msg + '<hr class="my-2">'
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
      currentTemp = currentValue
      document.getElementById('currentTemp').innerHTML = currentValue

      var hotText = document.getElementById('hot')
      if (currentValue > 78 & currentValue < 85) {
        hotText.innerHTML = 'warm'
        hotText.style['background-color'] = "orange";
    } else if (currentValue >= 85 & currentValue < 90) {
        hotText.innerHTML = 'hot'
        hotText.style['background-color'] = "red";
        hotText.style.color = 'white'
    } else if (currentValue >= 90 ) {
        hotText.innerHTML = 'very hot'
        hotText.style['background-color'] = "darkred"
        hotText.style.color = 'white'
    } else if (currentValue < 78) {
        hotText.innerHTML = 'mild'
        hotText.style['background-color'] = "blue"
        hotText.style.color = 'white';
        over80F = 'No'
    }

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
console.log("Config file loaded.")

var content = [
    {
        "id": 1,
        "text": "First, let's make sure you're doing OK. Are you experiencing any of the following symptoms right now? These can be a sign that you're struggling with the heat or the air quality.",
        "prompt": "Difficulty breathing | Lightheadedness | Fatigue | Headache | Loss of appetite | Nausea or vomiting | Rapid pulse ",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "You may need medical help.",
                "setVariable": "help('Yes')",
                "goTo": 2
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great, let's move on.",
                "setVariable": "help('No')",
                "goTo": 2
            }
        ]

    },
    {
        "id": 2,
        "text": "Do any of these describe you?",
        "prompt": "Heart disease | Asthma or other breathing condition | Pregnant | Diabetic | Over age 60 | Limited mobility | Living alone | Under age 16",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "setVariable": "sensitive('Yes')",
                "message": "Certain health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "goTo": 3
            },
            {
                "optionID": 2,
                "copy": "No",
                "setVariable": "sensitive('No')",
                "message": "Good. Let's take a look at ways to stay cool when it's hot.",
                "goTo": 3
            }
        ]
    },
    {
        "id": 3,
        "text": "What kind of Air Conditioner do you have??",
        "prompt": "On a hot day, the inside of an apartment without AC can be up to 10 degrees hotter than outside - and can stay hotter for days. Using AC at home is the best way to stay safe when it's hot outside.",
        "options": [
            {
                "optionID": 1,
                "copy": "Central air",
                "setVariable": "ac('Central')",
                "message": "Stay cool!",
                "goTo": 4
            },
            {
                "optionID": 2,
                "copy": "Window/wall unit",
                "setVariable": "ac('Window/wall')",
                "message": "Only cool one room!",
                "goTo": 4
            },
            {
                "optionID": 3,
                "copy": "Portable unit",
                "setVariable": "ac('Portable')",
                "message": "Is it strong enough?",
                "goTo": 4
            },
            {
                "optionID": 4,
                "copy": "I don't have AC",
                "setVariable": "ac('None')",
                "message": "OK let's find another way to keep you cool.",
                "goTo": 4
            }
        ]
    },
    {
        "id": 4,
        "text": "Do you have a fan?",
        "prompt": "A fan can help.",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Pro fan",
                "setVariable": "fan('Yes')",
                "goTo": 99
            },
            {
                "optionID": 2,
                "copy": "No",
                "message": "Oh no!",
                "setVariable": "fan('No')",
                "goTo": 99
            }
        ]
    },
    {
        "id": 99,
        "text": "So let's figure out how to stay cool.",
        "prompt": "Stay cool message...",
        "options": []
    }
]

/*
"followUP" can be addRecommendation(x) and that function can highlight (blink a few times?) one of the recommendation list-items 
*/
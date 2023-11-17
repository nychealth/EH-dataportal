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
                "goTo": 99
            },
            {   
                "optionID": 2,
                "copy": "No",
                "goTo": 2
            }
        ]

    },
    {
        "id": 2,
        "text": "Do any of these describe you? Certain health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
        "prompt": "Heart disease | Asthma or other breathing condition | Pregnant | Diabetic | Over age 60 | Limited mobility | Living alone | Under age 16",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "goTo": 3
            },
            {
                "optionID": 2,
                "copy": "No",
                "goTo": 3
            }
        ]
    },
    {
        "id": 3,
        "text": "Do you have an air conditioner?",
        "prompt": "On a hot day, the inside of an apartment without AC can be up to 10 degrees hotter than outside - and can stay hotter for days. Using AC at home is the best way to stay safe when it's hot outside.",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "goTo": 4
            },
            {
                "optionID": 2,
                "copy": "No",
                "goTo": 5
            }
        ]
    },
    {
        "id": 4,
        "text": "What kind of AC do you have?",
        "prompt": "Using AC at home is the best way to stay safe when it is hot outside. When that is not possible, seeking air conditioned refuge somewhere else is the next best option. Let's think about other ways you can protect yourself in the meantime. On a hot day, the inside of an apartment without AC can be up to 10 degrees hotter than outside and heat can stay in the building for days after the outside temperatures are cooler. Among New Yorkers who died after becoming dangerously hot at home, and for whom there was information about the presence or absence of an AC, 19% had an AC that was either not working or not in use. If you are concerned about affording your utility bill, check out HEAP, ConEd's Energy Affordability program, and EnergyShare.",
        "options": [
            {
                "optionID": 1,
                "copy": "Central air",
                "goTo": 5
            },
            {
                "optionID": 2,
                "copy": "Window or wall unit",
                "goTo": 5
            }
            ,
            {
                "optionID": 3,
                "copy": "Portable AC",
                "goTo": 5
            }
        ]
    },
    {
        "id": 5,
        "text": "Do you have a fan?",
        "prompt": "A fan can help.",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "goTo": 4
            },
            {
                "optionID": 2,
                "copy": "No",
                "goTo": 5
            }
        ]
    },
    {
        "id": 99,
        "text": "You may need medical help.",
        "prompt": "[How to make this message dependent on the heat and AQI values?]",
        "options": []
    }
]

/*
"followUP" can be addRecommendation(x) and that function can highlight (blink a few times?) one of the recommendation list-items 
*/
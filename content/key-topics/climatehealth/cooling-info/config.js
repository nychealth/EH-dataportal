console.log("Config file loaded.")

var content = [
    {
        "id": 1,
        "text": "First, let's make sure you're doing OK. Are you experiencing any of the following symptoms right now?",
        "prompt": "These can be a sign that you're struggling with the heat or the air quality.: <ul><li>Difficulty breathing <li>Lightheadedness <li>Fatigue <li>Headache <li>Loss of appetite <li>Nausea or vomiting <li>Rapid pulse</ul> ",
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
        "prompt": "<ul><li>Heart disease <li>Asthma or other breathing condition <li>Pregnant <li>Diabetic <li>Over age 60 <li>Limited mobility <li>Living alone <li>Under age 16 <li> Substance use <li> Experiencing mental health issues </ul>",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "setVariable": "sensitive('Yes')",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
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
                "message": "Great. These can help you stay cool. To save energy, set it at 78 degrees F when it's hot out.",
                "goTo": 4
            },
            {
                "optionID": 2,
                "copy": "Window/wall unit",
                "setVariable": "ac('Window/wall')",
                "message": "These tend to be best at cooling single rooms, not whole homes or apartments... you can check the BTUs... (etc)",
                "goTo": 4
            },
            {
                "optionID": 3,
                "copy": "Portable unit",
                "setVariable": "ac('Portable')",
                "message": "These tend to be best at cooling single rooms, not whole homes or apartments... you can check the BTUs... (etc and so on)",
                "goTo": 4
            },
            {
                "optionID": 4,
                "copy": "I don't have AC",
                "setVariable": "ac('None')",
                "message": "When it's hot, ACs are the best way to stay cool - but let's find other ways.",
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
                "message": "Great, you have a fan. It can help cool things.",
                "setVariable": "fan('Yes')",
                "goTo": 5
            },
            {
                "optionID": 2,
                "copy": "No",
                "message": "Oh no! Well, let's figure out some other ways you can stay cool.",
                "setVariable": "fan('No')",
                "goTo": 5
            }
        ]
    },
    {
        "id": 5,
        "text": "Do you have any pets or working animals?",
        "prompt": "Pets and working animals are also vulnerable to heat and air quality.",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "We'll make sure these recommendations include the safety of your animal(s).",
                "setVariable": "animal('Yes')",
                "goTo": 6
            },
            {
                "optionID": 2,
                "copy": "No",
                "message": "",
                "setVariable": "animal('No')",
                "goTo": 6
            }
        ]
    },

    /* test question */

    {
        "id": 6,  
        "text":  "Is it over 85 degrees inside or are you uncomfortably hot?",
        "prompt": "Often times when people get sick from the heat, they don't realize that they are overheating until they are experiencing heat exhaustion/heat stroke.",
        "options": [  
        { 
            "optionID": 1, 
            "copy": "Yes", 
            "message": "NOTE: Certain medications can make you more sensitive to heat or make it hard for your body to cool down.",
            "setVariable": "overheating('Yes')", 
            "goTo": 1
        
        },  
        {  
            "optionID": 2, 
            "copy": "No", 
            "message": "NOTE: Certain medications can make you more sensitive to heat or make it hard for your body to cool down.", 
            "setVariable": "overheating('No')", 
            "goTo": 1
        }
    ]

},
{

   
        


}

]
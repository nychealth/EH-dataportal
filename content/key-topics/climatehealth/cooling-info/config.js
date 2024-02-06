console.log("Config file loaded.")

var content = [

    {
        "id": 1,
        "text": "Is it over 85 degrees inside or are you uncomfortably hot?",
        "prompt": "Often times when people get sick from the heat, they don't realize that they are overheating until they are experiencing heat exhaustion/heat stroke.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "NOTE: Certain medications can make you more sensitive to heat or make it hard for your body to cool down.",
                "setVariable": "overheating('Yes')",
                "goTo": 2
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "NOTE: Certain medications can make you more sensitive to heat or make it hard for your body to cool down.",
                "setVariable": "overheating('No')",
                "goTo": 2
            }
        ]

    },

     /*Questions -- Section 1, Question 2*/

    {
        "id": 2,
        "text": "Let's make sure you're doing OK. Are you experiencing any of the following symptoms right now?",
        "prompt": "These can be a sign that you're struggling with the heat or the air quality. These symptoms can be a sign of severe illness. If this is an emergency call 911. You can also call 311 for health insurance.", 
        "options": [
            {
                "optionID": 1,
                "copy": "difficulty breathing",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 2,
                "copy": "light-headedness",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 3,
                "copy": "fatigue",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 4,
                "copy": "headache",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            }, 
            {   
                "optionID": 5,
                "copy": "loss of appetite",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 5,
                "copy": "nausea or vomiting",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 6,
                "copy": "rapid pulse",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 7,
                "copy": "more than one of these",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 8,
                "copy": "None of the above symptoms",
                "message": "This can be serious. Maybe you should see a doctor or go to urgent care. These are the signs and symptoms of heat exhaustion. Remember, more people die of heat than all other natural disasters combined. If you're not feeling well, take it seriously. Drink cool water and seek medical attention.",
                "setVariable": "help('No')",
                "goTo": 3
            }
        ]

    },

    
    /* Question 3*/

    {
        "id": 3,
        "text": "Do any of these describe you?",
        "prompt": "Certain conditions and life situations can make you more vulnerable to extreme heat and bad air quality.", 
        "options": [
            {
                "optionID": 1,
                "copy": "heart disease",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 2,
                "copy": "asthma or other breathing condition",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 2,
                "copy": "pregnant",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 3,
                "copy": "pregnant",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            }, 
            {   
                "optionID": 4,
                "copy": "diabetic",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 5,
                "copy": "Limited mobility",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 6,
                "copy": "Socially isolated (living alone)",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 4
            },
            {   
                "optionID": 7,
                "copy": "immunocompromised",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 8,
                "copy": "Mental health, cognitive, or developmental condition",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 9,
                "copy": "More than one of these conditions",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 14
            },
            {   
                "optionID": 10,
                "copy": "No",
                "message": "Good. Let's take a look at ways to stay cool when it's hot and take precautions based on the air quality",
                "setVariable": "sensitive('No')",
                "goTo": 4
            },
        
        ]

    },

    /* Question 14 */

    {
        "id": 14,
        "text": "Do you rely on electronic medical equipment to keep you healthy?",
        "prompt": "If the power goes out during a heat wave, your equipment may be at risk of running out of battery, which is risky to your health.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Make sure to have an emergency plan back up batteries. You can also register your equipment with your utility provider. <br> CONED: 1-800-752-6633 <br> PSEG: 1800-490-0025",
                "setVariable": "eme('Yes')",
                "goTo": 4
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great, let's move on.",
                "setVariable": "eme('No')",
                "goTo": 4
            }
        ]

    },


    /* Question 4 */

    {
        "id": 4,
        "text": "Do any of these behavioral risk factors describe you?",
        "prompt": "Certain activities can make you more vulnerable to extreme heat and bad air quality.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Work or exercise outside or have limited access to indoor shelter",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "behavior('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 2,
                "copy": "Misuse drugs or alcohol",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "behavior('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 3,
                "copy": "Takes medicine that make it difficult for your body to stay cool",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "behavior('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 4,
                "copy": "More than one of these behaviors",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "behavior('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 5,
                "copy": "None of these",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "behavior('No')",
                "goTo": 5
            }
        ]

    }, 

    /* Question 5 */

    {
        "id": 5,
        "text": "Are you over the age of 60 or under the age of 16?",
        "prompt": "Older and younger people are more sensitive to heat and poor air quality.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "age('Yes')",
                "goTo": 6
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "These health conditions and life situations can make you  more vulnerable to extreme heat and bad air quality.",
                "setVariable": "age('No')",
                "goTo": 6
            }
        ]

    },


    /* Question 6*/

    {
        "id": 6,
        "text": "Do you have any pets or working animals?",
        "prompt": "Pets and working animals are also vulnerable to heat and air quality.",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "We'll make sure these recommendations include the safety of your animal(s).",
                "setVariable": "animal('Yes')",
                "goTo": 7
            },
            {
                "optionID": 2,
                "copy": "No",
                "message": "",
                "setVariable": "animal('No')",
                "goTo": 7
            }
        ]
    },


    /* Question 7 */

    {
        "id": 7,
        "text": "The best way to stay safe in hot weather is with air conditioning. Does your indoor environment have air conditioning?",
        "prompt": "On a hot day, the inside of an apartment without AC can be up to 10 degrees hotter than outside — and can stay hotter for days. Using AC at home is the best way to stay safe when it's hot outside..", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great! You have an air conditioner.",
                "setVariable": "ac('Yes')",
                "goTo": 8
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "When it's hot, AC is the best way to stay cool — but let's find other ways.",
                "setVariable": "ac('No')",
                "goTo": 11
            }
        ]

    },


    /* Question 8 */


    {
        "id": 8,
        "text": "Do you limit your use of AC because of the cost?",
        "prompt": "If you limit your use of AC, the most important times to still use it are when the outdoor temperature is greater than 80 degrees and at night when apartments are still hot from earlier in the day. Setting your unit to 78 degrees or 'low cool' is a way to reduce energy consumption and remain safe from the heat].", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "There are resources such as HEAP and CON ED's Energy Affordability Program that can help make air conditioning your home more affordable.",
                "setVariable": "limitAC('Yes')",
                "goTo": 9
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great, let's move on to the next question.",
                "setVariable": "limitAC('No')",
                "goTo": 9
            }
        ]

    },


    /* Question 9 */


    {
        "id": 9,
        "text": "What kind of AC do you have?",
        "prompt": "Different types of air conditioning are able to provide varying levels of cooling and air filtration during hot weather.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Central AC",
                "message": "Great. These can help you stay cool. To save energy, set your unit at 78 degrees F when it's hot out.",
                "setVariable": "acType('Central')",
                "goTo": 11
            },
            {   
                "optionID": 2,
                "copy": "Window or wall unit",
                "message": "These tend to be best at cooling single rooms, not whole homes or apartments. <br><br><strong>How many BTUs is your AC?</strong> BTU is a measure of how strong your AC is. Look for a small label. A 5,000 BTU unit can cool a small bedroom, up to 150 square feet. Every additional 100 square feet requires 1,000 more BTUs. If your AC isn't strong enough to cool your whole space, then use it to just cool a single room. ",
                "setVariable": "acType('Window/wall')",
                "goTo": 11
            },
            {   
                "optionID": 3,
                "copy": "Portable AC",
                "message": "These tend to be best at cooling single rooms, not whole homes or apartments.<br><br> <strong>How many BTUs is your AC?</strong> BTU is a measure of how strong your AC is. Look for a small label. A 5,000 BTU unit can cool a small bedroom, up to 150 square feet. Every additional 100 square feet requires 1,000 more BTUs. If your AC isn't strong enough to cool your whole space, then use it to just cool a single room. ",
                "setVariable": "acType('Portable')",
                "goTo": 11
            },
            {   
                "optionID": 4,
                "copy": "Ductless mini split",
                "message": "These tend to be best at cooling single rooms, not whole homes or apartments.<br><br> <strong>How many BTUs is your AC?</strong> BTU is a measure of how strong your AC is. Look for a small label. A 5,000 BTU unit can cool a small bedroom, up to 150 square feet. Every additional 100 square feet requires 1,000 more BTUs. If your AC isn't strong enough to cool your whole space, then use it to just cool a single room. ",
                "setVariable": "acType('Window/wall')", /* not sure how to set this new var */
                "goTo": 11
            }

        ]

    },

    
    /* Question 10 */


    {
        "id": 10,
        "text": "How many BTUs is your AC unit?",
        "prompt": "BTU is a measure of how powerful your air conditioner is. Look for a small label. <br> A 5,000 BTU air conditioner can effectively cool a small bedroom or a room that is 100 to 150 square feet. Every additional 100 square feet requires 1,000 more BTUs. <br> If you air conditioner is not powerful enough to cool several rooms, confining the AC to one room can be a way to ensure part of your space stays cool.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Next question",
                "message": "",
                "goTo": 11
            }
        ]

    },

    /* Question 11 */

    {
        "id": 11,
        "text": "Do you have a fan?",
        "prompt": "Fans can help cool you down by moving air around to increase sweat evaporation which can be especially helpful in a humid environment. However, fans do not cool the air so the air currents flowing over the body must be cooler than your body temperature to cool you down. if it is over 78 degrees indoors, the fan is actually moving hot air around and can make you even warmer.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great, you have a fan. It can help cool you down .",
                "setVariable": "fan('Yes')",
                "goTo": 12
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Let's figure out some other ways you can stay cool.",
                "setVariable": "fan('No')",
                "goTo": 12
            }
        ]

    },


    /* Question 12*/


    {
        "id": 12,
        "text": "Do you have windows?",
        "prompt": "Windows can be useful for regulating temperature and air quality.", 
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "If the temperature is cooler outside than inside, opening windows can be another way to cool down a space that does not have an AC unit. However, uncovered or unshaded windows can let in sunlight that heats up a room. In these instances, keeping shades drawn during the day may be a better option to prevent extra heat from entering the apartment.",
                "setVariable": "ifWindow('Yes')",
                "goTo": 99
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "",
                "setVariable": "ifWindow('No')",
                "goTo": 99
            }
        ]

    },
]
    
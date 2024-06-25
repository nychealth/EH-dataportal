console.log("Config file loaded.")

var content = [

    


    

     /* Question 1*/

    {
        "id": 1,
        "text": "Do any of these describe you?",
        "prompt": "Certain health conditions and life situations can make you more vulnerable to extreme heat and bad air quality. <ul> <li><strong>Health conditions</strong>: difficulty breathing, heart disease, asthma or other breathing condition, pregnant, diabetic, limited mobility, immunocompromised, mental health, cognitive, or developmental condition </li> <li><strong>Life situations</strong>:  work or exercise outside, limited access to indoor shelter, misuse drugs or alcohol, take medicine that makes it difficult for your body to stay cool, living alone </li> <li><strong>Age</strong>: Over 60 or under  16 </li></ul>",
        "image": "Vulnerable_groups1.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "These health conditions and life situations can make you more vulnerable to extreme heat and bad air quality.",
                "setVariable": "sensitive('Yes')",
                "goTo": 2
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great. Let's move on.",
                "setVariable": "sensitive('No')",
                "goTo": 2
            },
        ]

    },

    
    /* Question 2*/

    {
        "id": 2,
        "text": "Do you rely on electronic medical equipment to keep you healthy?",
        "prompt": "If the power goes out during a heat wave, your equipment may run out of battery, which can be dangerous.", 
        "image": "Pacemaker.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Make sure to have an emergency plan and back up batteries. You can also <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/special-services'>register your equipment with your utility provider:<a> <ul><li> CON ED: 1-800-752-6633 <li>PSEG: 1-800-490-0025</ul>",
                "setVariable": "eme('Yes')",
                "goTo": 3
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great. Let's move on.",
                "setVariable": "eme('No')",
                "goTo": 3
            }
        
        ]

    },

    /* Question 3*/

    {
        "id": 3,
        "text": "Do you have any pets or working animals?",
        "prompt": "Pets and working animals are also vulnerable to heat and air quality.",
        "image": "Parrot_pet.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "We'll make sure these recommendations include the safety of your animal(s).",
                "setVariable": "animal('Yes')",
                "goTo": 4
            },
            {
                "optionID": 2,
                "copy": "No",
                "message": "Great, let's move on.",
                "setVariable": "animal('No')",
                "goTo": 4
            }
        ]
    },


    /* Question 4 */

    {
        "id": 4,
        "text": "The best way to stay safe in hot weather is with air conditioning. Does your indoor environment have air conditioning?",
        "prompt": "On a hot day, the inside of an apartment without air conditioning can be up to 10 degrees hotter than outside — and can stay hotter for days after it cools down outside. Being in air conditioning is the best way to stay safe when it's hot outside.", 
        "image": "AC.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great! You have an air conditioner. Different types of air conditioning are able to provide varying levels of cooling and air filtration during hot weather. BTU is a measure of how powerful your air conditioner is. Look for a small label. <ul><li>A 5,000 BTU air conditioner can effectively cool a small bedroom or a room that is 100 to 150 square feet.<li> Every additional 100 square feet requires 1,000 more BTUs.</ul> If your air conditioner is not powerful enough to cool several rooms, confining the air conditioner to one room can be a way to ensure part of your space stays cool.",
                "setVariable": "ac('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "When it's hot air conditioner is the best way to stay cool, but let's find other ways you can stay cool. Skip to the next question.",
                "setVariable": "ac('No')",
                "goTo": 6
            }
        ]

    },


    /* Question 5 */


    {
        "id": 5,
        "text": "Do you limit your use of air conditioning because of the cost?",
        "prompt": "If you limit your use of AC, the most important times to still use it are when the outdoor temperature is greater than 80 degrees and at night when apartments are still hot from earlier in the day. Setting your unit to 78 degrees or 'low cool' is a way to reduce energy consumption and remain safe from the heat.", 
        "image": "Piggy_bank.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Find out if you are eligible for <a href='https://www.nyc.gov/site/hra/help/energy-assistance.page'>HEAP</a> and <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'>CON ED's Energy Affordability Program</a>, which can help make air conditioning your home more affordable.",
                "setVariable": "limitAC('Yes')",
                "goTo": 6
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Great, let's move on to the next question.",
                "setVariable": "limitAC('No')",
                "goTo": 6
            }
        ]

    },


    /* Question 6 */

    {
        "id": 6,
        "text": "Do you have a fan?",
        "prompt": "Fans can help cool you down by moving air around to increase sweat evaporation, which can be especially helpful in a humid environment, or to pull in cooler air from outside. However, fans do not cool the air so the air currents flowing over the body must be cooler than your body temperature to cool you down. When it’s hot, a fan alone is not enough. Spending time in air conditioning — even for an hour or two — can help you stay safe. <a href='https://finder.nyc.gov/coolingcenters'>Visit a cool place when it is hot outside.</a>", 
        "image": "Fan.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great, you have a fan. It can help cool you down.",
                "setVariable": "fan('Yes')",
                "goTo": 99
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Let's figure out some other ways you can stay cool.",
                "setVariable": "fan('No')",
                "goTo": 99
            }
        ]

    },

]
    
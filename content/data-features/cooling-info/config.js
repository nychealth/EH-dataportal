console.log("Config file loaded.")

var content = [

    


    

     /* Question 1*/

    {
        "id": 1,
        "text": "Do any of these describe you or someone you live with?",
        "prompt": "Certain health conditions and life situations can make you more vulnerable to extreme heat and bad air quality. <ul> <li><strong>Health conditions</strong>: difficulty breathing, heart disease, asthma or other breathing condition, pregnant, diabetic, limited mobility, immunocompromised, mental health, cognitive, or developmental condition </li> <li><strong>Life situations</strong>:  work or exercise outside, limited access to indoor shelter, misuse drugs or alcohol, take medicine that makes it difficult for your body to stay cool, live alone </li> <li><strong>Age</strong>: Over 60 or under  16 </li></ul>",
        "image": "Vulnerable_groups1.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "These health conditions and life situations can make you or someone you live with more vulnerable to extreme heat and bad air quality.",
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
        "text": "Do you or someone you live with rely on electronic medical equipment to keep you healthy?",
        "prompt": "", 
        "image": "Pacemaker.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "If the power goes out during a heat wave, your equipment may run out of battery, which can be dangerous. Make sure to have an emergency plan and back up batteries. You can also <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/special-services'>register your equipment with your utility provider:<a> <ul><li> CON ED: 1-800-752-6633 <li>PSEG: 1-800-490-0025</ul>",
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
        "text": "Do you have air conditioning?",
        "prompt": "The best way to stay safe in hot weather is with air conditioning.", 
        "image": "AC.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great! You have an air conditioner. If your air conditioner is not powerful enough to cool several rooms, use it in the one room to make sure part of your space stays cool. Setting your air conditioner to 78F or Low Cool can keep you safe, comfortable, and save money.",
                "setVariable": "ac('Yes')",
                "goTo": 5
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "On a hot day, inside  without air conditioning can be up to 10 degrees hotter than outside — and can stay hotter for days after it cools down outside. Being in air conditioning is the best way to stay safe when it's hot outside. Let's keep going to find other ways you can stay cool.",
                "setVariable": "ac('No')",
                "goTo": 6
            }
        ]

    },


    /* Question 5 */


    {
        "id": 5,
        "text": "Do you limit your use of air conditioning because of the cost?",
        "prompt": "If you limit your use of AC, the most important times to still use it are when the outdoor temperature is greater than 80 degrees and at night when apartments are still hot from earlier in the day.", 
        "image": "Piggy_bank.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Setting your air conditioner to 78F or Low Cool can keep you safe, comfortable, and save money. You may be eligible for assistance to cool your home. Visit the <a href='https://www.nyc.gov/site/hra/help/energy-assistance.page'>Home Energy Assistance Program</a> and <a href='https://www.coned.com/en/accounts-billing/payment-plans-assistance/help-paying-your-bill'>CON ED's Energy Affordability Program</a> to learn more.",
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
        "prompt": "Fans can help cool you down. But, fans do not cool the air.", 
        "image": "Fan.svg",
        "options": [
            {
                "optionID": 1,
                "copy": "Yes",
                "message": "Great, you have a fan. Fans can help cool you down when the air outside is cooler than the air inside. When it's hot, a fan alone is not enough. You can visit a cool place when it is hot outside",
                "setVariable": "fan('Yes')",
                "goTo": 99
            },
            {   
                "optionID": 2,
                "copy": "No",
                "message": "Let's figure out some other ways you can stay cool. Spending time in air conditioning — even for an hour or two — can help you stay safe. <a href='https://finder.nyc.gov/coolingcenters'>Visit a cool place when it is hot outside.</a>",
                "setVariable": "fan('No')",
                "goTo": 99
            }
        ]

    },

]
    
---
title: "ZAPPA: A tool to understand air quality policies"
date: 2022-12-03T08:33:22-04:00
draft: false
seo_title: "ZAPPA: a tool to understand air quality policies."
seo_description: "A data story on ZAPPA, a tool to understand air quality policies."
tags:
categories: ["transportation", "airquality"]
keywords:
  [
    "air quality",
    "traffic",
    "transportation",
    "air pollution",
    "lungs",
    "breathing",
    "pm2.5",
    "fine particles",
    "fine particulate matter",
    "health impacts",
    "ZAPPA",
    "modelling",
    "data science",
    "computer modelling",
    "model",
    "policies",
    "policy",
    "health impacts",
    "health impact assessment",
  ]
image: ds-road-traffic.jpg
photocredit: "Ed Reed/Mayoral Photography Office"
---

New York City’s air quality is generally good and has been improving over time. Still, air pollution threatens health: two pollutants, [ozone and PM2.5 cause about 2,400 deaths per year in NYC, and thousands more emergency department visits and hospitalizations for asthma, heart, and lung problems]({{< baseurl >}}data-explorer/health-impacts-of-air-pollution/?id=2122#display=summary).

It’s important to clean up the air to protect New Yorkers, and we know how to do it: reduce emissions from buildings, vehicles, restaurants, power plants, and other sources of pollutants.

But how can New Yorkers decide which air quality policies to push for? How can we know what changes will have the greatest benefits?

To help answer these questions, the Health Department developed [ZAPPA — the ZIP Code Air Pollution Policy Assessment](https://treehug-app.its.unc.edu/nyserda/) — a free, online tool that that uses emissions data and atmospheric chemistry models to predict the effects of different policy proposals to reduce emissions.

Planners, advocates, scientists and others can use ZAPPA to see how proposed policy changes would affect air pollution, health outcomes, and costs, including at the neighborhood level.

Let’s try it.

### Modelling different scenarios using ZAPPA

**Scenario 1: What if we eliminated electric power generation in NYC?**

Some New Yorkers advocate closing all power plants in NYC and relying only on renewable energy sources like hydro, wind, or solar power. What does ZAPPA tell us about the impact of such a proposal?

Generating electricity releases pollutants like nitrogen oxides and sulfur dioxide, which help create PM2.5. Many of New York City’s power plants are “peaker plants” that are only activated at times of high electricity demand.

ZAPPA shows us that if we closed all the city’s power plants, we would see a fairly small reduction in average PM2.5 across the city: citywide PM2.5 would go down by 0.12 µg/m3. This would prevent only 5 deaths per million people aged 30 and older and avoid only 9 asthma emergency department visits per million people.

<div class="medium my-4">

<style>
td {
    padding-right: 15px;
}
</style>

| **Reductions in:**           | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| **PM2.5 (citywide average)** | **0.12** µg/m3                                     |
| **Deaths**                   | **5** _per 1,000,000 people 30 and above per year_ |
| **Asthma ED visits**         | **9** _per 1,000,000 people per year_              |

</div>

There may be more significant local effects in some ZIP Codes. To explore these, follow the directions below on how to run ZAPPA and get ZIP-Code level results.

**Scenario 2: Which ZIP Codes would benefit the most from going car-free?**

Some policy-makers are considering limiting vehicle use in parts of the City. Which limits would make the most difference?

- What if Midtown were a car-free zone?
- How would that compare to creating a car-free zone in the South Bronx?
- And, what if we eliminated vehicle traffic in the whole city?

Midtown has some of the worst air quality in all of NYC, while the South Bronx has some of the worst health impacts due to air quality. So, what would be the health impact of creating car-free zones in these neighborhoods?

</div>
<div class="wide my-4">

<iframe title="ZAPPA Car-free scenario models" aria-label="Table" id="datawrapper-chart-F4ifN" src="https://datawrapper.dwcdn.net/F4ifN/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="208" data-external="1"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();
</script>

</div>
<div class="narrow">

If we stopped traffic from entering Midtown, we would see PM2.5 go down an average of 0.85 µg/m3 in those ZIP Codes, leading to about 37 fewer deaths per million people aged 30 and older and about 19 ED fewer visits for asthma per million people.

Instead, if we stopped traffic from entering the South Bronx, we would see PM2.5 go down an average of 0.20 µg/m3 in the corresponding ZIP Codes. ZAPPA shows us that each year, we would reduce annual deaths by 12 per million people aged 30 and older and avoid almost 33 ED visits for asthma per million people per year in the South Bronx.

And if we stopped traffic from entering any part of NYC, we would experience an average decrease of 0.46 µg/m3 in PM2.5 citywide, and as a result, there would be 20 fewer deaths per million for people aged 30 and older, and 20 ED visits for asthma avoided per million people.

Using ZAPPA, we learn that neighborhoods with higher air pollution see greater reductions in pollution, and neighborhoods with worse health impacts from air pollution would see greater health improvements than the citywide average.

 </div>
 <div class="wide my-4">
<iframe title="Greater PM2.5 reductions in Midtown..." aria-label="Arrow Plot" id="datawrapper-chart-kKZ8g" src="https://datawrapper.dwcdn.net/kKZ8g/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="132"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();
</script>
<br><br>

<iframe title="" aria-label="Arrow Plot" id="datawrapper-chart-W9qln" src="https://datawrapper.dwcdn.net/W9qln/1/" scrolling="no" frameborder="0" style="width: 0; min-width: 100% !important; border: none;" height="101"></iframe><script type="text/javascript">!function(){"use strict";window.addEventListener("message",(function(e){if(void 0!==e.data["datawrapper-height"]){var t=document.querySelectorAll("iframe");for(var a in e.data["datawrapper-height"])for(var r=0;r<t.length;r++){if(t[r].contentWindow===e.source)t[r].style.height=e.data["datawrapper-height"][a]+"px"}}}))}();
</script>
</div>
<div class="narrow">

Compared to Midtown, the South Bronx has a smaller average reduction in PM2.5 but a higher reduction in emergency department visits for asthma in this traffic scenario. That’s because the worst health impacts of air pollution are not found in neighborhoods with the most air pollution.

### Key takeaways

ZAPPA—a new, free online tool created by the NYC Health Department with Institute for the Environment at UNC-Chapel Hill–-can help New Yorkers understand the health outcomes of proposed emission-reduction policies. ZAPPA uses fine-grained, ZIP-Code level data to produce precise, reliable estimates. It lets us compare outcomes by neighborhood, and provides data that can inform air quality policy development, program planning, and advocacy, and enable users to center equity and public health in environmental measures.

---

<br>

## Step-by-Step: How do we use ZAPPA?

**First, create an account.**
[Visit ZAPPA and create an account](https://treehug-app.its.unc.edu/nyserda/). Your estimates and results will be saved to your account.

**Next, start a new run.**  
Select Start a new NYC run. Give it a name and description - the model and results will be saved to your account.

**Select ZIP Codes.**
These are the ZIP Codes you’d like to focus on.

{{< figure src="Zappa1.png" alt="Left hand side has a menu with dropdowns. Top to bottom it says: Name and Description, ZIP Codes and waterways, Modify Traffic & Emissions, Advanced, and Review changes. The right hand side has a map of NYC with all ZIP Codes outlined in yellow." >}}

For the scenarios in this data story, here’s what we used:

_Power generation scenario_: All ZIP Codes

_Car-free scenarios_:

- NYC: all ZIP Codes
- Midtown: 10001, 10016, 10017, 10018, 10019, 10022, 10036
- South Bronx: 10451, 10452, 10454, 10455, 10456, 10474

**Then, Select Traffic & Emissions Types**

Next, you’ll tell ZAPPA what traffic or emissions you want to change, and how. Click through the menus for different tiers and options. This can get complicated, and may require a lot of knowledge about a proposed policy - like how much it will actually affect emissions or traffic.

_For the scenarios in this data story, here’s what we used:_

|        | Power generation scenario         | Car-free scenario |
| ------ | --------------------------------- | ----------------- |
| Tier 1 | Fuel Combustion: Electric Utility | Highway vehicles  |
| Tier 2 | All                               | All               |
| Tier 3 | N/A                               | N/A               |

{{< figure src="Zappa2.png" alt="The menu with dropdown has 'All ZIP Codes' selected. The 'Modify Traffic & Emissions' also open and can be edited." >}}

**Next, Input emissions or traffic change**

Select Set emissions changes. You’ll have the option of changing emissions by a specific amount of tons per year, or just by a percent change. For some scenarios, you would change the emissions while for others, you would set traffic changes.

_For the scenarios in this data story, here’s what we used:_

|                   | Power generation scenario | Car-free scenario                |
| ----------------- | ------------------------- | -------------------------------- |
| Emissions changes | -100% for each pollutant  | N/A                              |
| Traffic changes   | N/A                       | Electric fuel source\*\*:        |
|                   |                           | 87.46 for passenger vehicles     |
|                   |                           | 4.98 for small commercial trucks |
|                   |                           | 0.43 for school buses            |
|                   |                           | 0.99 for transit buses           |
|                   |                           | 4.69 for large commercial trucks |
|                   |                           | 1.45 for other large trucks      |

<hr>

- _If we eliminated all electric power generation within NYC, we would remove all related emissions. To represent this emissions change in ZAPPA, we would zero out the pollutants by getting the pollutant modified value to 0 under “Set Emissions Changes”. This change can be done using the percent change or specifying ton per year change._
- _If we created car-free zones, we would change Fleet Mix so there is no gasoline, diesel, CNG or E-85 use. Preserve each row’s percent distribution and move it into “Electric”. Moving the fleet mix distributions into “electric” in this way means there are no pollutant emissions from those other fuel sources, effectively modeling that there is no vehicle traffic on the street._

 <br>

**Set Emissions or Traffic Changes**
{{< figure src="Zappa3.png" alt="Grey window that says 'Set Emissions Changes' and 'Fuel Combustion: Electric Utility' with Pollutant, Percent Change, Base Value, Modified Value, and Change as column headers. Percent change is editable and user has input -100% on each line of pollutants. There is Set and Cancel buttons" >}}

<hr>

{{< figure src="Zappa4.png" alt="Grey window that says 'Set Traffic Changes' and 'Fleet Mix' with Vehicle type, Gasoline, Diesel, CNG, E-85, and Electric as column headers. There are numbers in each cell corresponding to six vehicle types. Fleet mix total is 100.00% " >}}

{{< figure src="Zappa5.png" alt="Grey window that says  'Set Traffic Changes' and 'Fleet Mix' with Vehicle type, Gasoline, Diesel, CNG, E-85, and Electric as column headers. All numbers are assigned in electric only now." >}}

**Finally, review changes made to model**
{{< figure src="Zappa6.png" alt="Grey window that says 'Emissions changes' and 'Hover over the emissions tier to see the full tier names'. The column headers are # of ZIP Codes, # of waterways, emission tier, NH3, NO2, PM2.5, SO2, and VOC. There are buttons for: show shapes, delete, and close." >}}

We can review the emissions and traffic changes made (if any) in the “Review Changes” dropdown menu. Then, name the model, save, and then click run!

**Lastly, review the results of the completed model**
After running the model, the saved and run model will appear in “Model Runs” of your account.

{{< figure src="Zappa7.png" alt="Image of Model run results for: Electric_Power_Generation_All_Zips. The dropdown menu notes the description, displayed metric (total health benefits), ZIP Code result details, citywide totals, and download results. The map of NYC has all ZIP Codes outlined in black with varying shades of blue." >}}

You can toggle through the estimated impacts of the policy change in the final model.

{{< figure src="Zappa8.png" alt="Grey drop down menu of Category: Concentrations, Health Impacts, Economic Impacts and Health Impacts is selected." >}}

{{< figure src="Zappa9.png" alt="Displayed results for Health Impacts and Metric of Mortality (low estimate) with citywide totals listed. The map of NYC has all ZIP Codes outlined in black with varying shades of blue." >}}

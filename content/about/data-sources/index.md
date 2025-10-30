---
title: Where does our data come from?
draft: false
date: 2025-06-07T08:49:22-04:00
image: Repo.png
photocredit: EH Data Portal team
categories:
  - internal
keywords:
  - how we work
  - redesign
  - accessibility
  - open source
  - screen readers
  - data visualization
seo_title: Understanding EHDP data sources
seo_description: "Data sources"
description: "Data sources"
---

The Environment and Health Data Portal hosts over 200 datasets on topics like air quality, climate, pests, housing, and much more. These data can tell us a lot about how environmental factors like housing, air quality, and socioeconomic status can shape health from neighborhood to neighborhood. But where does all of this data come from? How often is it updated? And how do we select which datasets to feature?

## Question #1: Where do you get your data?

We get data from many sources: some from NYC Health or other city agencies like NYC Parks or Department of Investigations (DOI); and some from outside sources, like the CDC, SPARCS, the U.S. Census, and the EPA. Here are some of the core ones:

<hr>
<div aria-hidden="true">
<div class="nav nav-tabs device-md mb-3" role="tablist">
    <a class="nav-item nav-link active" id="tab-btn-02-a" href="#tab-02-a" data-toggle="tab"
        aria-controls="tab-01-a" aria-selected="true" role="tab">
        <i class="fa-solid fa-clipboard-list"></i> CHS  
    </a>
    <a class="nav-item nav-link" id="tab-btn-02-b" href="#tab-02-b" data-toggle="tab"
        aria-controls="tab-02-b" aria-selected="false" role="tab">
        <i class="fa-solid fa-hospital"></i> SPARCS
    </a>
    <a class="nav-item nav-link" id="tab-btn-02-c" href="#tab-02-c" data-toggle="tab"
        aria-controls="tab-02-c" aria-selected="false" role="tab">
        <i class="fa-solid fa-house"></i> HVS
    </a>
        <a class="nav-item nav-link" id="tab-btn-02-d" href="#tab-02-d" data-toggle="tab"
        aria-controls="tab-02-d" aria-selected="false" role="tab">
        <i class="fa-solid fa-clipboard-list"></i> ACS
    </a>
        <a class="nav-item nav-link" id="tab-btn-02-e" href="#tab-02-e" data-toggle="tab"
        aria-controls="tab-02-e" aria-selected="false" role="tab">
        <i class="fa-solid fa-wind"></i> NYCCAS
    </a>
</div>

<div class="tab-content fs-sm p-1" id="tabs-02-content">
    <div class="tab-pane fade show active" id="tab-02-a" aria-labelledby="tab-btn-02-a" role="tabpanel">
        <p><strong>What is the Community Health Survey (CHS)?</strong> This phone survey is conducted by NYC Health and interviews about 10,000 New Yorkers each year. Running since 2009, CHS reports detailed data on many chronic diseases and health behaviors, helping us see trends at the neighborhood, borough, and citywide level.<br><br>
        <strong>CHS indicators include:</strong>
        <ul>
        <li><a href="../../data-explorer/mental-health/?id=2417">Mental health: Adults with depression</a></li>
        <li><a href="../../data-explorer/economic-conditions/?id=2132">Health care: Adults with health insurance</a></li>
        <li><a href="../../data-explorer/asthma/?id=18">Asthma: Adults with a recent asthma attack</a></li>
        <li><a href="../../data-explorer/physical-activity/?id=2060">Physical activity: Recent exercise</a></li>
        </ul>
      <strong>What we use it for: </strong>CHS data helps us track the health of New Yorkers and connect the dots between health behavior and health status. This helps us prioritize programs where they matter most. If we see, for example, that there are fewer adults with a doctor in West Queens, we can try to address that through campaigns and outreach. Or if there are more adults with a recent asthma attack in the South Bronx, we can communicate with healthcare providers, neighborhood centers, and schools to provide resources and and education, prevention, and mitigation plans.</p>
    </div>
    <div class="tab-pane fade" id="tab-02-b" aria-labelledby="tab-btn-02-b" role="tabpanel"><p>
    <strong>What is New York Statewide Planning and Research Cooperative System (SPARCS)?</strong> SPARCS collects patient-level data, like diagnoses, treatments, and characteristics for both inpatient and outpatient stays throughout the state. It was established in 1979 as a collaboration between the NY state government and the healthcare system. <br><br>
  <strong>SPARCS indicators include: </strong>
    <ul>
    <li>heat-stress hospitalizations and emergency department visits</li>
    <li>psychiatric hospitalizations</li>
    <li>Asthma hospitalizations </li>
    <li>Bicycle injury hospitalizations </li>
    </ul>
  <strong>What we use it for:</strong> Patient-level data from healthcare facilities can help us understand how environmental factors (for example hot days and socioeconomic status) relate to health outcomes (like heat-related hospitalizations among different demographics). These vital data help us characterize severity and risk factors for different populations.</p>
    </div>
    <div class="tab-pane fade" id="tab-02-c" aria-labelledby="tab-btn-02-c" role="tabpanel">
        <p>
        <strong>What is the Housing and Vacancy Survey (HVS)?</strong> Taken every three years, the Housing and Vacancy Survey is by HPD and the Census Bureau. The main purpose of HVS is to describe how many rental units are vacant to understand more about rent control and stabilization and the housing market.<br><br>
        <strong>HVS indicators include: </strong>
          <ul>
          <li>Homes with cracks or holes</li>
          <li>Homes with mold </li>
          <li>Household air conditioning  </li>
          <li>Rent-burdened households  </li>
          </ul>
        <strong>What we use it for:</strong> It helps us understand the state and quality of our available housing, which ties into important health outcomes. HVS data about housing issues that affect health can help us connect these issues to other disparities and inequities across NYC, like income, health care, heat and cold vulnerability and more.
        </p>
    </div>
    <div class="tab-pane fade" id="tab-02-d" aria-labelledby="tab-btn-02-d" role="tabpanel">
        <p>
        <strong>What is the American Community Survey (ACS)?</strong> Taken annually by the US census, this survey collects population, housing, and workforce data like unemployment, income, insurance, and more. <br><br>
        <strong>HVS indicators include: </strong>
          <ul>
          <li>Older adults living alone (65+) </li>
          <li>Foreign-born population  </li>
          <li>Neighborhood poverty  </li>
          </ul>
        <strong>What we use it for:</strong> This critical data helps us understand the links between inequality, the social determinants of health, and health outcomes. ACS data on income is used to show how neighborhoods with higher levels of poverty tend to live in neighborhoods with less quality housing, and also have higher rates of many chronic diseases and premature death. 
        </p>
    </div>
      <div class="tab-pane fade" id="tab-02-e" aria-labelledby="tab-btn-02-e" role="tabpanel">
        <p>
        <strong>What is the New York City Community Air Survey (NYCCAS)?</strong> Started in 2008, NYCCAS is the largest ongoing urban air monitoring program of any U.S. city. NYCCAS tracks air pollutants at the street-level, where people spend most of their time. <br><br>
        <strong>NYCCAS indicators include:</strong>
          <ul>
          <li>Concentration of fine particles (PM2.5)  </li>
          <li>Ozone (O3)  </li>
          <li>Sulfur dioxide (SO2)  </li>
          </ul>
        <strong>What we use it for:</strong> It helps us inform PlaNYC, track changes in air quality over time, estimate exposures for health research, inform the public about local topics, such as air quality improvements, health benefits of public transit to air quality, and efforts to reduce the health impacts of air pollution.  
        </p>
    </div>
</div>
<br>
<hr>

### What types of data sources are there?

There are many kinds of data, which are collected, cleaned, and updated in different ways. Here are some of the categories data can fall into, and some may even fall into multiple categories.

<div class="accordion-group narrow my-3" role="tablist" id="accordion-01">
  <div class="card">
    <a class="card-header collapse collapsed font-weight-bold" id="acc-button-01" data-toggle="collapse" href="#panel-acc-button-01"  role="tab" aria-expanded="false" aria-controls="panel-acc-button-01">
      <span class="title" role="heading" aria-level="3">Regulatory data</span>
    </a>

  <div class="collapse" id="panel-acc-button-01" role="tabpanel" aria-labelledby="acc-button-01" data-parent="#accordion-01">
    <div class="card-body card-white fs-md">
    <p>
Collecting this type of data is mandated by the local, state, or federal government, which typically means it is updated regularly and reliably. In New York state, blood lead level testing is mandated. Because it is mandatory, it also means that blood lead levels of NYC populations are regularly updated, so there are many years of this data available. Still, not everyone goes to the doctor, even if testing is required. Air quality monitoring is another example of regulatory data. A common limitation on regulatory data is resources – e.g. it isn’t possible to put an air quality monitor on every block.
    </p>
    </div>
  </div>
  <!-- .collapse -->
  </div>

  <!-- .card (end of first accordion, repeat as needed) -->

  <div class="card">
      <a class="card-header collapse collapsed font-weight-bold" id="acc-button-02" data-toggle="collapse" href="#panel-acc-button-02"  role="tab" aria-expanded="false" aria-controls="panel-acc-button-02">
        <span class="title" role="heading" aria-level="3">Survey data</span>
      </a>

<div class="collapse" id="panel-acc-button-02" role="tabpanel" aria-labelledby="acc-button-02" data-parent="#accordion-01">
    <div class="card-body fs-md">
<p>
Questions are answered by a selection of respondents, usually over the phone, via e-mail, or another way. Surveys like the Community Health Survey, the Housing and Vacancy Survey, and the American Community Survey are taken regularly at different intervals. While most surveys are voluntary, some, like ACS, are compulsory.

Sometimes, a survey drops a question, and we have to decide how to continue to track that indicator. In 2015, CHS dropped a question about recent cycling, so we looked for other indicators in both the CHS and ACS, with the goal of finding something with many years of data so we could see the change over time. We found monthly bicycle use. The reliability of survey data depends on the willingness of respondents, as well as their honesty, the framing of the questions, and many other factors.

</p>
</div>

</div>
<!-- .collapse -->

</div>

  <div class="card">
      <a class="card-header font-weight-bold collapse collapsed" id="acc-button-03" data-toggle="collapse" href="#panel-acc-button-03"  role="tab" aria-expanded="false" aria-controls="panel-acc-button-03">
        <span class="title" role="heading" aria-level="3">Registry / population data</span>
      </a>

<div class="collapse" id="panel-acc-button-03" role="tabpanel" aria-labelledby="acc-button-03" data-parent="#accordion-01">
    <div class="card-body fs-md">
<p>
Standardized information about people sharing a condition or experience. This includes birth and death records, which have been updated for a very long time.

Premature mortality from the NYC Bureau of Vital Statistics and the US Census; or cancers in children from the New York State Cancer Registry both fall into this category.

</p>
</div>

</div>
<!-- .collapse -->
</div>

  <div class="card">
      <a class="card-header font-weight-bold collapse collapsed" id="acc-button-04" data-toggle="collapse" href="#panel-acc-button-04"  role="tab" aria-expanded="false" aria-controls="panel-acc-button-04">
        <span class="title" role="heading" aria-level="3">Syndromic surveillance</span>
      </a>

<div class="collapse" id="panel-acc-button-04" role="tabpanel" aria-labelledby="acc-button-04" data-parent="#accordion-01">
    <div class="card-body  fs-md">
<p>
Collected continuously and systematically, surveillance data includes some regulatory data like air and water quality monitoring. Monitoring air and water systematically started around the 1970s with the Clean Air Act, so it has not been collected for as long as older types of data, like birth and death records. Testing might be taken frequently throughout the year, but only reported every quarter for a more accurate interpretation.
                </p>
            </div>
</div>
<!-- .collapse -->
</div>

  <div class="card">
      <a class="card-header font-weight-bold collapse collapsed" id="acc-button-05" data-toggle="collapse" href="#panel-acc-button-05"  role="tab" aria-expanded="false" aria-controls="panel-acc-button-05">
        <span class="title" role="heading" aria-level="3">Other types of data and open data</span>
      </a>

<div class="collapse" id="panel-acc-button-05" role="tabpanel" aria-labelledby="acc-button-05" data-parent="#accordion-01">
    <div class="card-body  fs-md">
<p>
There are other kinds of data too. There is administrative data, which is collected by healthcare or government organizations. An example of this are evictions (court-ordered), which are available through the Department of Investigations (DOI). There is also operational data, like our litter basket coverage data, which is from the Department of Sanitation (DSNY), but available through NYC Open Data.

NYC’s Local Law 11 requires city agencies to make data considered “public” available through a single data portal so that anyone can access and use it. This type of transparency reflects the idea that public data belongs to the public, and empowers all New Yorkers to have understand key information about civic life. Note that not all data used by city agencies is considered public; due to privacy laws, much health data is excluded from this requirement.

</p>
</div>

</div>
<!-- .collapse -->
</div>
</div>

## Question #2: How do you choose datasets?

We try to paint a picture of how environments shape health in NYC across time – we use datasets to quantify the state of various measures of health, and explanatory text to frame it, provide context, and add meaning. That said, there are many, many more datasets out there – so how do we choose? We have frequent conversations with our data stewards to determine what datasets would add the most value to the portal.

<img src="../data-sources/Litterbasket_NTA.png">

But sometimes we see something on NYC open data, or another source, that provides interesting context to NYC’s environment and health. For example, our litter basket coverage data. These humble amenities may be overlooked, but have a strong connection to health: when there are more litter baskets, there is less litter, and fewer pests. Fewer pests are healthier for a neighborhood and <a href="../../data-stories/sanitation">cleaner streets have a positive impact on mental health and feelings of safety and positivity</a>. Public bathrooms also make it easier for people to partake in public life.

<!-- maybe delete one of these examples -->

Another great example are transit datasets. Accessible subway stations and bus stops with audio announcements are both found on NYC Open Data, and illustrate how accessible transit (and thus, all of New York City) is to New Yorkers with disabilities, those transporting small children, older adults, and everyone! While these data don’t have as much of a <i>direct</i> connection with health, they are valuable to the portal’s mission of showing how the environment – built, social, economic – shapes health.

## Question #3: Why is some of your data out of date?

There are many different kinds of environment and health data with many different characteristics. These data (ranging from neighborhood poverty and cold-stress hospitalizations, to Citi bike station density and cockroach sightings) aren’t all measured, collected, recorded, organized, and reported in the same way, or within the same time period.Sometimes data is also aggregated into multi-year batches to protect privacy while being stable enough to show impacts at the neighborhood level.

As a result, some types of data aren't updated as frequently as others. But that doesn’t mean that older datasets don’t tell us valuable information. Significant trends in health can take a long time to show up. Ultimately, we use data for many reasons, including to support our decisions. If the data shows that one group is more likely to suffer from heat-related illness, for example, we know that isn’t going to be addressed overnight. We can use it to inform programs that span multiple years – even if we do get a fresh batch of data every year, it’s not likely to change our core strategy.

To sum up, each of our sources collect data in different ways and on different timelines -- meaning that things don't always line up perfectly. But they still all capture valuable information about health and the environment that shapes it in NYC.

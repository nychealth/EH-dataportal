// ======================================================================= //
// data loading and manipulation functions
// ======================================================================= //

// I reversed the order of these function declarations to make the process
//  of data creation easier to understand

// ----------------------------------------------------------------------- //
// function to load indicator metadata
// ----------------------------------------------------------------------- //

const loadIndicator = (this_indicatorId, bypassUrlChange) => {

    // console.log("window.location.hash 1 [loadIndicator]", window.location.hash);


    currentHash = window.location.hash;

    console.log('this_indicatorId', this_indicatorId, bypassUrlChange)

    // console.log("** loadIndicator");

    // if indicatorId isn't given, use the first indicator from the dropdown list 
    //  (which is populated by Hugo reading the content frontmatter). 

    const firstIndicatorId = document.querySelectorAll('#indicator-dropdown button')[0].getAttribute('data-indicator-id');

    indicatorId = this_indicatorId ? this_indicatorId : firstIndicatorId;

    // remove active class from every list element
    $(".indicator-dropdown-item").removeClass("active");
    $(".indicator-dropdown-item").attr('aria-selected', false);

    // get the list element for this indicator
    const thisIndicatorEl = document.querySelector(`button[data-indicator-id='${indicatorId}']`)
    
    // set this element as active & selected
    $(thisIndicatorEl).addClass("active");
    $(thisIndicatorEl).attr('aria-selected', true);

    // indicatorId comes in as  a string, so "find" uses '==' instead of '==='

    indicator = indicators.find(indicator => indicator.IndicatorID == indicatorId);
    indicatorName = indicator?.IndicatorName ? indicator.IndicatorName : '';
    indicatorDesc = indicator?.IndicatorDescription ? indicator.IndicatorDescription : '';
    indicatorShortName = indicator?.IndicatorShortname ? indicator.IndicatorShortname : indicatorName;
    indicatorMeasures = indicator?.Measures;

    //create Citation

    createCitation(); // re-runs on updating Indicator
    
    // send Indicator Title to vis headers

    document.getElementById('summaryTitle').innerHTML = indicatorName;
    document.getElementById('mapTitle').innerHTML     = indicatorName;
    document.getElementById('trendTitle').innerHTML   = indicatorName;
    // document.getElementById('linksTitle').innerHTML   = indicatorName; // Handled by VL spec

    // reset selected measure flags

    selectedMapMeasure = false;
    selectedTrendMeasure = false;
    selectedLinksMeasure = false;
    
    // console.log("window.location.hash 2 [loadIndicator]", window.location.hash);

    if (!bypassUrlChange) {
        url.searchParams.set('id', indicatorId);
        url.hash = window.location.hash;
        window.history.pushState({ id: indicatorId , hash: window.location.hash}, '', url);
    }
    
    // console.log("window.location.hash 3 [loadIndicator]", window.location.hash);

    // call data loading function

    const indicatorTitle = document.getElementById('dropdownIndicator')

    indicatorTitle.innerHTML = indicatorName

    console.log('indicatorId: ', indicatorId)

    loadData(indicatorId)
}

// ----------------------------------------------------------------------- //
// function to Load indicator data and create Arquero data frame
// ----------------------------------------------------------------------- //

const loadData = (this_indicatorId) => {
    
    // console.log("window.location.hash [loadData]", window.location.hash);
    // console.log("** loadData");

    fetch(data_repo + "/" + data_branch + `/indicators/data/${this_indicatorId}.json`)
    .then(response => response.json())
    .then(async data => {

        // call the geo file loading function

        loadGeo();

        // console.log("data [loadData]", data);
        
        ful = aq.from(data)
            .derive({ "GeoRank": aq.escape( d => assignGeoRank(d.GeoType))})
            .groupby("Time", "GeoType", "GeoID", "GeoRank")
        
        
        aqData = ful
            .groupby("Time", "GeoType", "GeoID")
            .orderby(aq.desc('Time'), 'GeoRank')
    })
}



// ----------------------------------------------------------------------- //
// function to load geographic data
// ----------------------------------------------------------------------- //

const loadGeo = () => {

    // console.log("window.location.hash [loadGeo]", window.location.hash);

    const geoUrl = data_repo + "/" + data_branch + `/geography/GeoLookup.csv`; // col named "GeoType"
    
    aq.loadCSV(geoUrl)
        .then(data => {
            
            geoTable = data.select(aq.not('Lat', 'Long'));
            
            // call the data-to-geo joining function
            
            joinData();
        
    });
}

// ----------------------------------------------------------------------- //
// function to join indicator data and geo data
// ----------------------------------------------------------------------- //

const joinData = () => {

  // console.log("window.location.hash [joinData]", window.location.hash);

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //
  // get metadata fields
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

  // flatten MeasureID + TimeDescription
  
  let availableTimes = [];

  // create table column header with display type

  let measurementDisplay = [];


  indicatorMeasures.map(
  
      measure => {

          let aqAvailableTimes = 
              aq.from(measure.AvailableTimes)
              .derive({MeasureID: `${measure.MeasureID}`})
          
          availableTimes.push(aqAvailableTimes);

          let aqMeasurementDisplay = 
              aq.table(
              {
                  MeasureID: [measure.MeasureID], 
                  MeasurementType: [measure.MeasurementType], 
                  DisplayType: [measure.DisplayType]
              })
          
          measurementDisplay.push(aqMeasurementDisplay);

      }
  )
  
  // bind rows of Arquero tables in arrays

  let aqMeasureIdTimes     = availableTimes.reduce((a, b) => a.concat(b))
  let aqMeasurementDisplay = measurementDisplay.reduce((a, b) => a.concat(b))
  
  // console.log("aqMeasurementDisplay");
  // aqMeasurementDisplay.print()

  // console.log("aqMeasureIdTimes [joinData]");
  // aqMeasureIdTimes.print()

  // foundational joined dataset

  joinedAqData = aqData
      .join_left(geoTable, [["GeoID", "GeoType"], ["GeoID", "GeoType"]])
      .rename({'Name': 'Geography'})
      .join(aqMeasureIdTimes, [["MeasureID", "Time"], ["MeasureID", "TimeDescription"]])
      .select(
          "GeoID", 
          "GeoType", 
          "GeoRank", 
          "Geography", 
          "MeasureID",
          "Time", 
          "Value", 
          "DisplayValue", 
          "CI",
          "start_period",
          "end_period"
      )
      .orderby(aq.desc('end_period'), aq.desc('GeoRank'))
      .reify()

  // data for summary table

  fullDataTableObjects = joinedAqData
      .join_left(aqMeasurementDisplay, "MeasureID")
      .derive({ 
          MeasurementDisplay: d => op.trim(op.join([d.MeasurementType, d.DisplayType], " ")),
          DisplayCI: d => op.trim(op.join([d.DisplayValue, d.CI], " "))
      })
      .derive({ DisplayCI: d => op.replace(d.DisplayCI, /^$/, "-") }) // replace missing with "-"
      .select(aq.not("start_period", "end_period"))
      .objects()

  console.log("fullDataTableObjects", fullDataTableObjects);

  // data for map
  
  fullDataMapObjects = joinedAqData
      .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
      .impute({ Value: () => NaN })
      .objects()

  // map for trend chart

  fullDataTrendObjects = joinedAqData
      .filter(d => op.match(d.GeoType, /Citywide|Borough/)) // keep only Citywide and Boro
      .objects()

  // data for links & disparities chart

  fullDataLinksObjects = joinedAqData
      .filter(d => !op.match(d.GeoType, /Citywide|Borough/)) // remove Citywide and Boro
      .objects()

  // call the measure rendering etc. function

  renderMeasures();
  
}
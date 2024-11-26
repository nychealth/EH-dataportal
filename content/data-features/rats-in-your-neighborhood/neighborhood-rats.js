// initialize variables
var inputAddress;
var inputLat;
var inputLong;
var inputLatLong = []
var CDgeojson = 'https://gist.githubusercontent.com/mmontesanonyc/37c3ddb2bb368d3cd78dbd1e0cb4c22e/raw/0b5a7e8a6afbcb8e4a7c242ca320a135e920221f/cd.geojson'
var RMZgeojson = 'https://gist.githubusercontent.com/mmontesanonyc/7782a491c71c4cf52f2798f81428aa7a/raw/daec209b03f245a1ea25ca3994a4c5d48a63ce28/rmz.geojson'
let geojsonData;
let countyID;
var city;
var county;
var cdRMZOverlaps = [102,103,107,109,110,111,112,201,203,204,205,207,303,304,308]
var success;

// Initialize the map
const map = L.map('map').setView([40.7722226,-73.9638235],11);

// Add  tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 15,
    minZoom: 11
}).addTo(map);

// add reset button
L.easyButton({
    position: "bottomleft",
    states: [{
        title: "Zoom to fit",
        icon: "fas fa-undo",
        
        onClick: function() {
            
            resetZoom();
        }
    }]
}).addTo(map);     

function resetZoom() {
    // console.log('reset zoom 3')
    window.location.hash = '#top'
    location.reload()
}

// Initialize the geocoder
const geocoder = L.Control.Geocoder.nominatim();

// Form submission handler
document.getElementById('geocode-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent form from reloading the page

    const address = document.getElementById('address').value;

    // Use the geocoder to search for the address
    geocoder.geocode(address, function(results) {
    if (results && results.length > 0) {
        const { center, name, html } = results[0];
        map.setView(center, 13); // Update map to the result location

        // Add a marker
        L.marker(center).addTo(map)
        .bindPopup(html)
        .openPopup();

        // Get location details from results
        console.log('Location details:')
            console.log(results)
            inputLat = results[0].center.lat;
            inputLong = results[0].center.lng
            inputLatLong = [inputLat,inputLong]
        console.log('Latitude:', inputLat, 'Longitude:', inputLong)

        // check if it's an NYC address, and if it is, check to see what county it is.
        city = results[0].properties.address.city
        if (isInNYC(city) === true) {
            console.log('City is true, now check county')
            checkCounty(results[0].properties.display_name)
        } 

    } else {
        alert('Address not found!');
    }
    });
});

// Report if address is or is not in NYC
function isInNYC(x) {
    console.log('Checking to see if this address is in NYC...')
    if (x === 'New York') {
        console.log('Yes, it is a NYC address')
        document.getElementById('message1').innerHTML = 'This is a NYC address.'
        // checkCDs(countyID) // checks to see what CD this address is in
        return true;
   } else {
        console.log('No, it is not an NYC address')
        document.getElementById('message1').innerHTML = 'This address is not in NYC. Please try again.'
        alert('This address is not an NYC address - please try again.')
        return false;
   }
}

// If address is in NYC, check to see what county it is in:
function checkCounty(y) {
    console.log('County checking for location: ', y)
    if (y.includes('New York County')) {
        countyID = 1
    } else if (y.includes('Bronx County')) {
        countyID = 2
    } else if (y.includes('Kings County')) {
        countyID = 3
    } else if (y.includes('Queens County')) {
        countyID = 4
    } else if (y.includes('Richmond County')) {
        countyID = 5
    } 

    countyID ? checkCDs(countyID) : console.log('Could not ID county; stopping geocoding')

}

// With county information check to see what Community District it's in:
var thisArea = []
async function checkCDs(x) {
    console.log('County ID:', x)
    console.log('We will now check to see what CD this is in.')
    await getGeoJSON(CDgeojson); // load geoJSON

    // loop through geojsonData; match countyID to first character of geojsonData.features[0].properties.boro_cd
    for (let i = 0; i < geojsonData.features.length; i++) {
        let cdCode = geojsonData.features[i].properties.boro_cd
        let thisCDCounty = cdCode.substring(0,1)

        // if we find a geography in the right county (boro)...
        if (x == thisCDCounty) {

            // ...go into that geometry (CD)

            for (let j = 0; j < geojsonData.features[i].geometry.coordinates.length; j++) {

                // Loop through the geometry's nested polygons
                for (let k = 0; k < geojsonData.features[i].geometry.coordinates[j].length; k++) {
\
                    // grab each geometry, and test point (inputLatLong) against it
                    thisArea = geojsonData.features[i].geometry.coordinates[j][k];
                    let area     = L.polygon(thisArea).addTo(map)
                    let location    = L.marker(inputLatLong)

                    isMarkerInsidePolygon(location,area)
                    
                    // another approach
                    if (area.contains(location.getLatLng())) {
                         console.log('Contains!!!')
                         success = true
                         break; // stop the loop
                     }

                }
            }

        } 
    }

    if (!success) {console.log('We did not successfully identify a parent geography.')} // error message

}


function checkRMZs() {
    console.log('We will now check to see if you are in an RMZ...')

    getGeoJSON(RMZgeojson)

    console.log(geojsonData)

}

/*
    cdRMZOverlaps:
    - Manhattan: CDs 2, 3, 7, 9, 10, 11, 12
    - Bronx: CDs 1 3 4 5 7
    - Brooklyn: CDs 3, 4, 8
*/


function getGeoJSON(x) {
    return new Promise((resolve, reject) => {
        // Fetch the GeoJSON data
        fetch(x)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Parse the GeoJSON data
        })
        .then(data => {
            geojsonData = data; // Store the GeoJSON data in a global variable
            console.log('GeoJSON data loaded:', geojsonData);
            resolve(); // Resolve the promise when the data is ready
        })
        .catch(error => {
            console.error('Error fetching the GeoJSON file:', error);
            reject(error); // Reject the promise if there’s an error
        });
    });
}


// THIS IS THE POINT-IN-POLYGON CODE
function pointInPolygon() {
    var polygon = L.polygon(
        [
            [-73.98877931684075, 40.73396539973852],
            [-73.98757195270184, 40.73345699067858],
            [-73.98718049670539, 40.733292147761716],
            [-73.98494550599996, 40.732349672818046],
            [-73.98356052121288, 40.73177022493377],
            [-73.98346644208249, 40.731731080615965],
            [-73.98321467146559, 40.7316241682911],
            [-73.9829644066345, 40.731520842547646],
            [-73.9825562923175, 40.73135013405194],
            [-73.98246876214023, 40.73131488473316],
            [-73.9819091150614, 40.73109512831153],
            [-73.98166657031133, 40.730998547581294],
            [-73.98034007500252, 40.73044246087384],
            [-73.97992109976283, 40.73026220520872],
            [-73.97910803894669, 40.72991055847805],
            [-73.97802697950854, 40.72943305910739],
            [-73.97753843835038, 40.7292262479172],
            [-73.97690436371674, 40.72895782427804],
            [-73.97619632359181, 40.72866197652656],
            [-73.9758124489941, 40.72851976762252],
            [-73.97566782613242, 40.72846253200678],
            [-73.97329796838147, 40.72742800885995],
            [-73.97205015413232, 40.72688094679753],
            [-73.97197685059938, 40.72683035620166],
            [-73.97191244151819, 40.726791008767414],
            [-73.97185671237712, 40.72675868546612],
            [-73.97179601986961, 40.72671367965663],
            [-73.97162697271727, 40.72662845299688],
            [-73.9716697270118, 40.726392327154386],
            [-73.97169587451597, 40.72624182980494],
            [-73.97171894361507, 40.72612199325954],
            [-73.97173843379365, 40.725999667555534],
            [-73.97176755410239, 40.725833302952054],
            [-73.97177410965313, 40.72582128133709],
            [-73.9717914296149, 40.7258142211491],
            [-73.97181650587754, 40.72581496624993],
            [-73.97185935830902, 40.72558296953287],
            [-73.97187437695217, 40.725503116079835],
            [-73.97188490951483, 40.725424405065795],
            [-73.9719112073207, 40.72529037069994],
            [-73.97193374501076, 40.72517629035124],
            [-73.97193975456322, 40.72515803861003],
            [-73.97196154778587, 40.725039978810834],
            [-73.97200511841187, 40.72484149021083],
            [-73.97203666966882, 40.724684070020096],
            [-73.97206595867414, 40.72455915832869],
            [-73.97207196960349, 40.72453635085813],
            [-73.97208098151926, 40.724497567930385],
            [-73.97208400057288, 40.72446790554572],
            [-73.97209751290906, 40.72442341523471],
            [-73.97215609001728, 40.72417017827813],
            [-73.97216585996622, 40.72413196377576],
            [-73.972216923762, 40.723930054646765],
            [-73.97223344676965, 40.72384677992634],
            [-73.97226499868242, 40.72371445733364],
            [-73.97232507731586, 40.723463499327345],
            [-73.97236115744649, 40.72331206047648],
            [-73.97239945748277, 40.723148816366624],
            [-73.97251011180381, 40.72269688600675],
            [-73.97288971396699, 40.72108829721934],
            [-73.97298649726092, 40.72067054949914],
            [-73.973090065749, 40.72025374477521],
            [-73.97320040345137, 40.71983794684589],
            [-73.97331749335301, 40.719423219354226],
            [-73.97344131740637, 40.719009625778256],
            [-73.97357185653419, 40.71859722942127],
            [-73.97374101738176, 40.71809467576937],
            [-73.97391750479419, 40.717593583062225],
            [-73.97410129682518, 40.717094013142955],
            [-73.97429237062839, 40.71659602766536],
            [-73.97449070246041, 40.71609968808631],
            [-73.97469626768377, 40.71560505565819],
            [-73.97490904076994, 40.71511219142138],
            [-73.97512899530274, 40.71462115619672],
            [-73.97514977937124, 40.714579423863505],
            [-73.97516360806188, 40.7145519056912],
            [-73.97518850986306, 40.714503160723936],
            [-73.97521387023663, 40.714448498798475],
            [-73.97522549627958, 40.71442343994197],
            [-73.97524666388625, 40.71437780630549],
            [-73.97524670420732, 40.71437772456102],
            [-73.9758031128397, 40.71317812458921],
            [-73.97579532792433, 40.71317002319164],
            [-73.97596844519694, 40.71278957339087],
            [-73.97604981455508, 40.71260419377792],
            [-73.9761236883879, 40.712460325398354],
            [-73.9761653123832, 40.71242019791084],
            [-73.97631127867197, 40.712118647310184],
            [-73.97642872514528, 40.711909032503705],
            [-73.97650540115391, 40.711798789452516],
            [-73.9765500881422, 40.71173453872832],
            [-73.97671221539667, 40.71153576517841],
            [-73.97681883540048, 40.71141956752378],
            [-73.97699076574627, 40.71125666023057],
            [-73.97705659401753, 40.71119762646683],
            [-73.9772221356257, 40.71106873122834],
            [-73.97752668432639, 40.71084307273319],
            [-73.97772119493068, 40.71071007466073],
            [-73.97782091638246, 40.71064544490701],
            [-73.97789949619445, 40.7105998662024],
            [-73.97799674790384, 40.71056101739166],
            [-73.97807974906621, 40.710532250577266],
            [-73.97818190694284, 40.71050686551766],
            [-73.97825557749212, 40.710497909055306],
            [-73.97837148165257, 40.71048970749158],
            [-73.97861560123998, 40.7104737819109],
            [-73.97877613342084, 40.71046331504727],
            [-73.97918894377005, 40.7104349233883],
            [-73.9792072643461, 40.710433666393136],
            [-73.9792901523712, 40.710428144566976],
            [-73.98003642292834, 40.71037840126669],
            [-73.98028344332177, 40.71036181561106],
            [-73.98033652490473, 40.71035920071473],
            [-73.98033090124429, 40.71028693831357],
            [-73.98051046026364, 40.7102747519457],
            [-73.98128647552558, 40.71021834788167],
            [-73.98124579569945, 40.709826214601264],
            [-73.98306019477401, 40.709647911748135],
            [-73.98364234472633, 40.70959187924476],
            [-73.98449647076764, 40.70950966393945],
            [-73.98655035339982, 40.709311944139465],
            [-73.98816491726686, 40.70915678150649],
            [-73.98817340967875, 40.70914751830128],
            [-73.98839064023267, 40.70912694916267],
            [-73.98844653437385, 40.70913382054701],
            [-73.98847967268775, 40.70915584680593],
            [-73.9884972717388, 40.7091763052932],
            [-73.9886365807185, 40.70991206151631],
            [-73.98864533493685, 40.70991693389857],
            [-73.98866750580943, 40.70992003483075],
            [-73.98869610271332, 40.70992844984457],
            [-73.98871771111247, 40.709947090016286],
            [-73.98873681707525, 40.70997074184512],
            [-73.98879717785803, 40.70996660747224],
            [-73.98889845980884, 40.70995473576504],
            [-73.98935765696677, 40.709900986707886],
            [-73.98946067019428, 40.709889287051304],
            [-73.98957449608717, 40.70987408160655],
            [-73.98974515155741, 40.709848761655664],
            [-73.99015825373382, 40.70979037266377],
            [-73.99051420376698, 40.70973388411882],
            [-73.9907891301856, 40.709689506588695],
            [-73.99106783463007, 40.709657229842634],
            [-73.9913510923706, 40.709620332703366],
            [-73.99170260292523, 40.70956526245348],
            [-73.99176779580132, 40.70955505552374],
            [-73.9919054436645, 40.70952539658227],
            [-73.99203926968346, 40.709516919665326],
            [-73.99209131635969, 40.70950822290381],
            [-73.9921486897015, 40.70949860910412],
            [-73.9923611613991, 40.70946436881145],
            [-73.99284846748647, 40.70938187763877],
            [-73.99374012862228, 40.70924612043537],
            [-73.99400820164045, 40.70923747991905],
            [-73.99414063200345, 40.709233267399966],
            [-73.99437823543936, 40.70919263919895],
            [-73.99457899963724, 40.709130972910074],
            [-73.99517577369836, 40.709034293307745],
            [-73.99580385653569, 40.708946013907514],
            [-73.99601898395763, 40.70891622384748],
            [-73.9966640099659, 40.70882690451773],
            [-73.99728287195578, 40.70873161984294],
            [-73.99808351186999, 40.70850961536717],
            [-73.99828602320592, 40.70842993146762],
            [-73.99852758585311, 40.70833152790831],
            [-73.99856114620616, 40.70831528323358],
            [-73.99872197955064, 40.7082374528962],
            [-73.99875396570859, 40.70822365102721],
            [-73.99880846276643, 40.70820013499269],
            [-73.99882158420984, 40.70817548167751],
            [-73.9988813086388, 40.70813663391982],
            [-73.99898340963244, 40.70809265331617],
            [-73.9990527673855, 40.70803254586638],
            [-73.99913434918952, 40.70798239694596],
            [-73.99919451174895, 40.70794737685408],
            [-73.99928731116864, 40.7080166031688],
            [-73.99936195582275, 40.70807228658836],
            [-73.99939955073677, 40.7081003383602],
            [-73.99944281440469, 40.708136556756614],
            [-73.9995627336694, 40.7082364831476],
            [-73.9998119392456, 40.70844261498332],
            [-73.99992936423627, 40.70853681758991],
            [-74.00000765589327, 40.708599619986416],
            [-74.00012359123079, 40.70868451928075],
            [-74.00019103138898, 40.708733912864744],
            [-74.00026566682727, 40.70879294991968],
            [-74.00055004953066, 40.709017917299526],
            [-74.00134439913731, 40.70964629295896],
            [-74.0014714023208, 40.70974655432328],
            [-74.00141934716292, 40.70981479577195],
            [-74.00128258532506, 40.70999405347292],
            [-74.00123476628733, 40.71005533303564],
            [-74.00113646757461, 40.71017596422536],
            [-74.00100325442945, 40.71035402976368],
            [-74.00090633637271, 40.71047783135636],
            [-74.00075289387978, 40.71067383219702],
            [-74.0006636699085, 40.710787802877334],
            [-74.00050986097234, 40.71098427045341],
            [-74.0006202506202, 40.711081984558355],
            [-74.00071409568511, 40.71119213351896],
            [-74.0007880129429, 40.71131210833295],
            [-74.00083962368913, 40.71143865685407],
            [-74.00086781464307, 40.71156815886219],
            [-74.00087276307242, 40.71169696831566],
            [-74.00089166286934, 40.71299925785347],
            [-74.00089354391562, 40.71302995078785],
            [-74.0008450545922, 40.71303962097749],
            [-74.00063383195948, 40.71308117856849],
            [-74.00062461465946, 40.7131118908331],
            [-74.0002210584419, 40.714250626889346],
            [-74.0004546306596, 40.71436504759891],
            [-74.00052734942693, 40.71517005936533],
            [-74.00078955186169, 40.71529096840146],
            [-74.00057839216119, 40.71557090242169],
            [-74.00013820907833, 40.716199730562344],
            [-73.9999309777797, 40.71654391427054],
            [-73.99944838180335, 40.717329797098365],
            [-73.99931241700145, 40.717550241777424],
            [-73.99858925568033, 40.71709951153714],
            [-73.99776285925766, 40.716813928121546],
            [-73.99698375215492, 40.71654054317207],
            [-73.99605872744375, 40.71623164021094],
            [-73.99580912349239, 40.71664465970802],
            [-73.9954287587875, 40.7172792430479],
            [-73.99480779021309, 40.71845742635036],
            [-73.99439866258628, 40.71945710892785],
            [-73.99423470916308, 40.71985151456352],
            [-73.99416805982594, 40.7200118462521],
            [-73.99407263221248, 40.72024349090297],
            [-73.9940415520236, 40.72032097982317],
            [-73.9938379218417, 40.720832148621795],
            [-73.99379593869142, 40.72093753746575],
            [-73.99352731367806, 40.721633261365945],
            [-73.99336181506884, 40.72208001783544],
            [-73.99333917242924, 40.72214114017185],
            [-73.99326016194931, 40.72235442627798],
            [-73.9930919022704, 40.722820084363995],
            [-73.99263254954295, 40.72405686515242],
            [-73.99260322198438, 40.724136449683414],
            [-73.99257987396696, 40.72420155492326],
            [-73.99232767958787, 40.724906097392044],
            [-73.99221516612971, 40.72523259566816],
            [-73.99206108543514, 40.72564461433434],
            [-73.99179396219462, 40.72639179536162],
            [-73.99163853409182, 40.72683325577492],
            [-73.99156762927869, 40.72703464711621],
            [-73.99155207579066, 40.72709433672387],
            [-73.99138898337311, 40.7274977011422],
            [-73.99135288961898, 40.72755739806016],
            [-73.99123439559044, 40.72772680526239],
            [-73.99129790628726, 40.72775524856221],
            [-73.99122943604792, 40.72807261736064],
            [-73.9911431514612, 40.72858815715545],
            [-73.99097394420761, 40.729195707209115],
            [-73.99078461602444, 40.729745748338516],
            [-73.99072530409872, 40.72987868747647],
            [-73.9905055860359, 40.73056495673777],
            [-73.99039010002672, 40.7312885238275],
            [-73.99021190972442, 40.73199633440486],
            [-73.99011350296756, 40.732400504343794],
            [-73.99010225743841, 40.73244537234044],
            [-73.99003455735858, 40.73275415137404],
            [-73.98986852139565, 40.73352711455494],
            [-73.98990295970059, 40.734434789634335],
            [-73.98883935090079, 40.73399047942878],
            [-73.98877931684075, 40.73396539973852]
        ]
    ).addTo(map);
      var m1 = L.marker([40.7187837, -73.9900266]); // 103 Orchard- should return true for the CD above.
      console.log(m1.getLatLng())
      console.log(polygon.contains(m1.getLatLng()));
}


function isMarkerInsidePolygon(marker, poly) {
    console.log('**isMarkerInsidePolygon**')
    var inside = false;
    var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
    for (var ii=0;ii<poly.getLatLngs().length;ii++){
        var polyPoints = poly.getLatLngs()[ii];
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }

    return inside;
};


function originalPointInPolygon() {
    var polygon = L.polygon([
        [51.51, -0.08],
        [51.503, -0.06],
        [51.51, -0.047]
      ]).addTo(map);
      var m1 = L.marker([51.515, -0.07]); // Outside and north of polygon
      var m2 = L.marker([51.506, -0.06]); // In polygon, not on border
      var m3 = L.marker([51.505, -0.074]); // Inside polygon boundary box but outside of polygon. 
      var m4 = L.marker([51.51, -0.067]); // On polygon border.
      
      console.log(polygon.contains(m1.getLatLng()));
      // ==> false
      console.log(polygon.contains(m2.getLatLng()));
      // ==> true
      console.log(polygon.contains(m3.getLatLng()));
      // ==> false
      console.log(polygon.contains(m4.getLatLng()));
      // ==> true
}


//----------------------- CODE TO DEVELOP -----------------------//
/*
Here's how this works:
- 



  - Put a basic geocoder on the map (insert address, drop a pin)

  - Store GeoJSONS offsite, ingest them

  - Run code that loops through RMZ and CD geojson, and extracts each polygon

      rmz.features[0].geometry.coordinates[0]
      loop through rmz.features[x],
        and loop through rmz.features[x].geometry.coordinates[y]
        var name = rmz.features[x].properties.Label
        if polygon.contains(point.getLatLng()), then var in = true, and print name to page.
      after loops, if in /= true, then, loop through CDs.

      Alternatively, you can loop through CDs first.
      If it's in one of the CDs that overlaps an RMZ, then you can run an RMZ loop. 

  - Build a function that runs a point through all of those polygons
  - Stop if it's in one thing, and return aspects of that polygon... (info about it?)
*/

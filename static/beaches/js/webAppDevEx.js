var _histTable;
var _map;
var _lang;
var _samples;
var _infoWindowHTML;

// ***************************************
// * EVENT HANDLERS
// **************************************

function onMapLoad(_map) {
	setTranslateText(_map);
	loadSampleResults(_map);
}

function onTabChange(event, ui) {
	var newTab = ui.newTab[0].children[0].getAttribute('ui-sref');
	if (newTab != 'propertyhistory') $("#tabs").tabs("disable",1);
	layoutWindow(newTab);
}

function onesriPopupChange(_div) {
	editPopup(_div);
}

function onesriMobileInfoViewChange(_div) {
	editPopup(_div);
}

function onWindowResize() {
	var activeTab = $("#tabs .ui-tabs-active")[0].innerText;
	layoutWindow(activeTab);
	// reset _histTable so it will force resize
	_histTable = null;
}

function onIframeLoaded(iframe) {
	// disable property history tab 
	$("#tabs").tabs("disable",1);
	var activeTab = $("#tabs .ui-tabs-active")[0].children[0].getAttribute('ui-sref');
	layoutWindow(activeTab);
} 

function onsingleresultdetailsLoad(div)
{
	div.setAttribute('top','0px');
}

function onquerytabheaderLoad(div)
{
	div.style.visibility='hidden';
	div.style.display='none';
}

function onqueryresultactionbuttonLoad(div)
{
	div.style.visibility='hidden';
	div.style.display='none';
}

function onresultlayersselectdivLoad(div)
{
	div.style.top='0px';
}

function onresultsnumberLoad(div)
{
	div.style.visibility='hidden';
	div.style.display='none';
}

function onresultscontainerLoad(div)
{
	div.style.top='0px';
	var _e = div.getElementsByClassName("popup-title-icon");
	for (var i=0; i<_e.length; i++) {
		_e[i].click();
		_e[i].style.visibility='hidden';
		_e[i].style.displey='none';
	}
	var _e = div.getElementsByClassName("popup-content");
	for (var i=0; i<_e.length; i++) {
		_e[i].style.visibility='hidden';
		_e[i].style.displey='none';
	}

	//popup-title-icon
}

function ondijit_form_Select_0Load(div)
{
	div.style.visibility='hidden';
	div.style.display='none';	
}

function onquerytabscontainerLoad(div)
{
	div.style.top='0px';
}

function on_20_panelLoad(div)
{
	if (window.innerWidth < 1000) {
		var barmax = div.getElementsByClassName("bar");
		if (barmax.length) {
			barmax[0].click();
		}
	}
}
// ************************************************
// * HELPER FUNCTIONS
// ************************************************

function loadSampleResults(_map)
{
	var iframe = document.getElementById("webappbld").getElementsByTagName("iframe")[0];
	var query = new iframe.contentWindow.esri.tasks.Query();
	query.where = '1=1';
	query.returnGeometry = true;
	query.outFields = ['*'];
	var queryTask = new iframe.contentWindow.esri.tasks.QueryTask(_map.tables[0].url);
	queryTask.execute(query).then(function(results) {
		// add all sample results to dictionary keyed by shapefileName
		_samples = {};
		results.features.forEach(function(f) {
			var b = f.attributes.BeachID;
			if (!(b in _samples)) _samples[b]=[];
			// add 5 hours because data is in UTC and need to convert to EST
			f.attributes['last_sample_date'] = f.attributes['last_sample_date'] + 18000000
			_samples[b].push(f.attributes);
		}); 
		// sort results for each beach by date
		for (k in _samples) {
			_samples[k] = _samples[k].sort(function(a,b) {return a.sampleDate < b.sampleDate?1:-1});
		}
	});
}


// function gets the text from the popup window and stores it into
// a double piped (||) delimited list in two hidden divs 
// when google translate works on the page it will translate the second div 
// but not the first (which has a class of notranslate)
// These will be used later to tranlate the popups
// The html for the popup with substitions is stored on the feature layers
// infoTemplate attribute. This needs to wait until the map is loaded and all
// feature layers are loaded. Specifically it is looking for layers with names that startsWith
// with PCS_DOHMHRatMap_Inspection
function setTranslateText(_map)
{
	function breakLineBy (startChar, endChar, txt) {
		var _ret = [];
		var _lines = txt.split(startChar);
		_lines.forEach(function(l) {
			var v = l.substr(l.search(endChar)+1).trim();
			if (v.length > 0) _ret.push(v); 
		});
		return _ret;
	}
	
	// function goes through an element and iteratively goes
	// through child elements extracting all textContent values
	// it strips any values between {} which are substititution values
	// in infotTemplate
	function getChildTextContent(_node, _vals) {
		if (!_node.hasChildNodes()) {
			var txt = _node.textContent.trim();
			// break text by {}
			var _lines = breakLineBy('{','}', txt);
			// break each of these lines by []
			_lines.forEach(function(v) {
				var _lines2 = breakLineBy('[',']',v);
				_lines2.forEach(function(v2) {_vals.push(v2);});
			})
			return true;
		}
		_node.childNodes.forEach(function(child) {
			getChildTextContent(child, _vals);
		});
	}

	
	function createDiv(_parent, _node, _key, _class) {
		var _div = document.createElement('div');
		_div.setAttribute('id', _parent.attr('id') + '-' + _key);
		if (_class) _div.setAttribute('class', _class);
		_div.setAttribute('key',_key);
		_div.innerHTML = _node;
		_parent.append(_div);
		return _div;
	}
	
	// get inspection layers
	var textNodes = [];
	// for each layer get the info template. convert it to xml and then get add all innertext not enclosed by{}
	// to _lines array
	for (lyrKey in _map._layers) {
		var l = _map._layers[lyrKey];
		if (l.infoTemplate && l.infoTemplate.info) {
			// this is the html for the infoTemplate
			var _descr = l.infoTemplate.info.description;
			if (_descr) {
				// xml conversion does not like url for some reason
				// urls are in single quotes. this removes all urls from the info
				// template html so it can be read as xml document
				var _lines  = _descr.split("'");
				for (var i=0; i<_lines.length; i++) {
					if (_lines[i].startsWith('http')) _lines[i]='';
				}
				// parse the above html into xml and add innertext to textNodes
				var s = '<doc>' + _lines.join("'") + '</doc>';
				var _xml = jQuery.parseXML(s);
				getChildTextContent(_xml, textNodes);	
			}
		}
	}
	
	// there may be child elements already in place -- phrases that you might want to be translated that
	// are not in the popup. Need to get the maximum key if they exist
	var maxKey = -1;
	var _children = $("#popup-original").children('div');
	for (var i=0; i<_children.length; i++) {
		maxKey = Math.max(_children[i].attributes.key.value, maxKey);
	}
	maxKey += 1;
	
	// add each the phrases to translate as divs with key for the index
	// two divs are added one for the original phrase and one that will be translated
	var originalDiv = $("#popup-original");
	var translatedDiv = $("#popup-translated");
	for (var i=0; i<textNodes.length;i++) {
		// add divs to both of the above
		createDiv(originalDiv, textNodes[i], i+maxKey);
		createDiv(translatedDiv, textNodes[i], i+maxKey, 'translate-hide');
	}
	
}


// *************************
// function edits the popup. It edits content after load by doing two main things: 
// 1. replace any phrases with translated phrases
// 2. adds sampling results and overwrites href for sampling history link 
// *************************
function editPopup(_div) {
	function loadTranslatePhrases(_parent) {
		var _phrases = {};
		var maxKey = -1;
		var _children = _parent.getElementsByTagName('div');
		for (var i=0; i<_children.length; i++) {
			var _node = _children[i];
			var key = parseInt(_node.attributes['key'].value);
			_phrases[key] = _node.innerText;
			maxKey = Math.max(maxKey, key);
		}
		// convert dictionary to array
		var _ret = Array(maxKey);
		for (var key in _phrases) {
			_ret[key] = _phrases[key];
		}
		return _ret;
	}

	// check to see if language has changed. If so hide toolbar at the top
	if (_lang != getLanguage()) {
		var _tbs = document.getElementsByClassName('goog-te-banner-frame');
		if (_tbs.length) {
			var _tb = _tbs[0];
			_tb.style.visibility = "hidden";
			_tb.style.display="none";
			var _body = document.getElementsByTagName("BODY")[0]; 
			_body.style.top = 0; 
		}
		_lang = getLanguage();
		return;
	}

	// if (getComputedStyle(_map.infoWindow.domNode).visibility=='hidden') return;
	
	// get the beach name
	// table: {Beach: "AMERICAN  TURNER", last_sample_date: 1562371200000, last_geomean: 108, last_singleday: 17, FID: 142}
	// featurelayer: {OBJECTID: 14, Name: "Whitestone Booster Civic Association", Type: "Private", Status: "Closed"}
	var featureID = null;
	var _feat = null;
	if (_map && _map.infoWindow && _map.infoWindow.features && _map.infoWindow.features.length > 0) {
		var _feat = _map.infoWindow.features[_map.infoWindow.selectedIndex].attributes;
		featureID = _feat.OBJECTID;
	}
	
	// do text substitution in the popup window
	// [last-sample-date], [last-geomean], [last-singleday], [view-history]
	if (_div && featureID) {
		var mainSection = _div.getElementsByClassName("mainSection")[0];
		if (mainSection && mainSection.innerHTML != _infoWindowHTML) {
			console.log("setting for popup for " + featureID);
			var beach = _feat.SampleName;
			var beachName = _feat.Name;
			var beachID = _feat.BeachID;

			// get beach sample data from the beach name
			var beachSamples = _samples[beachID];
			// default values in case there are no samples
			var lastDateStr = 'NA';
			var geoMean = 'NA';
			var singleDay = 'NA';
			// get the last sample date. These are sorted when loaded
			if (beachSamples) {
				var lastDate = new Date(beachSamples[0].last_sample_date);
				lastDateStr = '' + (lastDate.getMonth() + 1) + '/' + lastDate.getDate() + '/' + lastDate.getFullYear();
				geoMean = beachSamples[0].last_geomean;
				singleDay = beachSamples[0].last_singleday;
			}
			// replace values in popup
			var h = mainSection.innerHTML;
			var span = '<span style=\'font-size:10.5pt;font-family:Arial,sans-serif;color:#4C4C4C\'>'
			h = h.replace('[last-sample-date]', span + lastDateStr + '</span>');
			h = h.replace('[last-geomean]', span + geoMean + '</span>');
			h = h.replace('[last-singleday]', span + singleDay + '</span>');
			var _a = $("<a>");
			if (beachSamples) {
				_a.attr('href','#');
				_a.attr('id','viewhistory');
				_a.attr('style','font-size:10.5pt;font-family:Arial,sans-serif');
				_a.text('View Sample History');
			} else {
				_a.attr('style','visibility:hidden;');
			}
			h = h.replace('[view-history]', _a.get(0).outerHTML);
			mainSection.innerHTML = h;

			// translate popup content
			var doNotTranslate = [];
			var original = loadTranslatePhrases($('#popup-original')[0]);
			var translated = loadTranslatePhrases($('#popup-translated')[0]);
			if (translated.length == original.length) {
				var translatedTxt = mainSection.innerHTML;
				var changed = false;
				for (var i=0; i<translated.length; i++) {
					if (translated[i] != original[i] && translated[i].trim().length && !(doNotTranslate.indexOf(original[i].trim()) > -1)) {
						translatedTxt = translatedTxt.replace(original[i], translated[i].trim());
						changed = true;
					}
				}
				if (changed) mainSection.innerHTML = translatedTxt;
			}
			
			// add history link
			_a = $(_div.ownerDocument.getElementById('viewhistory'));
			_a.click(function(evt) {
				viewHistory(beachID, beachName);
				return false;
			});
			
			_infoWindowHTML = mainSection.innerHTML;
			
		}
	}
}

// *************************
// called to resize the window for everything except the map tab
// if the window content is bigger than the window size it places the footer at the bottom of the content
// and the user will have to scroll down to see the footer. If the content is smaller than the window size
// it anchors the footer at the bottom of the window
// *************************
function layoutWindow(activeTab) {
	var remainingSpace = window.innerHeight - document.getElementById("tabsUL").offsetHeight - document.getElementById("top").offsetHeight;
	var tabs = document.getElementById('tabs');
	var footerHeight = window.innerWidth < 768 ? 0 : document.getElementById("NYCfooterOuter").offsetHeight;
	var innerWrap = document.getElementById("inner-wrap");
	var iframe = document.getElementById("webappbld").getElementsByTagName("iframe")[0];
	if (activeTab == 'map') {
		// map should always fill up remaining space unless remaining space is less than 500px
		var mapHeight = (remainingSpace <= 500)?500:remainingSpace; 
		innerWrap.style.marginBottom="0";
		iframe.height= mapHeight;
	} else  {
		if (tabs.offsetHeight > (remainingSpace - footerHeight)) {
			innerWrap.style.marginBottom = "0";
		} else {
			innerWrap.style.marginBottom = String(-1 * footerHeight) + 'px';
		}
	}
	
}

function resizeMap() {
	var iframe = document.getElementById("webappbld").getElementsByTagName("iframe")[0];

	var innerWrap = document.getElementById("inner-wrap");
	var remainingSpace = window.innerHeight - document.getElementById("tabsUL").offsetHeight - document.getElementById("top").offsetHeight;
	if (remainingSpace <= 500) {
		innerWrap.style.marginBottom="0px";
		innerWrap.style.minHeight="0px";
		iframe.height=500;
	} else {
		var footerHeight = window.innerWidth < 768 ? 0 : document.getElementById("NYCfooterOuter").offsetHeight;
		innerWrap.style.minHeight="100%"
		innerWrap.style.marginBottom= String(-1 * footerHeight) + "px";
		iframe.height = remainingSpace - footerHeight;
	}
	// code to close side panel
	// iframe.contentDocument.getElementsByClassName('action-node')[0].click()
	// call on iphone
}

// **********************
// Opens sample history tab and builds table. Sample history is a tabulator table.
// **********************
function viewHistory(beachID, beachName) {
	// table: {Beach: "AMERICAN  TURNER", last_sample_date: 1562371200000, last_geomean: 108, last_singleday: 17, FID: 142}
	$("#tabs").tabs("enable",1);
	$("#tabs").tabs({active:1});
	$("#sample-history-beach")[0].innerHTML = beachName;
	
	// build the history table if it doesn't exist	
	if (!_histTable) {
		_histTable = new Tabulator("#property-history", {
			layout:"fitColumns", //fit columns to width of table (optional)
			columns:[ //Define Table Columns
				{title:"Sample Date", field:"last_sample_date", 
					formatter:function(cell,params) {
						d = new Date(cell.getValue());
						m = (d.getMonth() + 1);
						monthVal = (m < 10 ? '0' : '') + m;
						dy = d.getDate();
						dayVal = (dy < 10 ? '0' : '') + dy;
						return (monthVal + "/" + dayVal + "/" + d.getFullYear())},
					sorter: function(a,b,aRow,bRow, column, dir, sorterParams) {
						return (new Date(a)) - (new Date(b));
					}},
				{title:"30-Day Geometric Mean<div class='table-sub-head'>NYSDOH Limit: 35 MPN/100mL</div>", field:"last_geomean"},
				{title:"Single Day Results<div class='table-sub-head'>NYSDOH Limit: 104 MPN/100mL</div>", field:"last_singleday"},
			],
			initialSort:[{column:"last_sample_date", dir: "desc"},],
		});	
	}
	
	// make request to open data
	_histTable.setData(_samples[beachID]);
	_histTable.setSort('last_sample_date','desc');
	layoutWindow();

}


function viewMap() {
	$("#tabs").tabs({active:0});
}


//******************************
//CODE TO TRIGGER EVENT FUNCTIONS ABOVE
//******************************

//gets the cookie named
function readCookie(name) {
	var c = document.cookie.split('; '),
	cookies = {}, i, C;

	for (i = c.length - 1; i >= 0; i--) {
		C = c[i].split('=');
		cookies[C[0]] = C[1];
	 }

	 return cookies[name];
}	

// get the current google translate language
function getLanguage() {
	return readCookie('googtrans');
}

// **********************
// Function returns a function object from a string. If the function is not defined it 
// returns null
// **********************
function getFunction(funcName) {
	try {
		return eval(funcName);
	} 
	catch(err) {
		return null;
	}
}

// *********************
// Function is called by onload event of iframe. It adds a mutation observer to listen for when
// the classes specified in _divClasses exist. When it finds an element with this class it checks
// to see if the classes onLoad method is defined. The onLoad method should be the same as the
// "on" + [div class name] + "Load". It also checks to see if an onChange event exists. If so
// it adds a mutation observer to listen to when the onChange event occurs. Finally, this method listens
// for when the map itself exists. When it does it calls onMapLoad() (if defined) and sets the _map 
// variable. Once all _div elements are found this stops listening to changes in iframe.
// These listeners need to be triggered this way because the map and associated elements are loaded 
// dynamically so they are not available in the document.onload event or the iframe.onload event. 
// the iframe itself must be on the same domain as the web page.
// *********************
function onIframeLoad() {
	var _divClasses = ["action-node", "esriPopup", "esriMobileInfoView", "single-result-details", "query-tab-header", "query-result-action-button",
		"resultlayers-select-div","results-number", "results-container","dijit_form_Select_0", "query-tabs-container", "_20_panel"];
	var iframe = document.getElementById("webappbld").getElementsByTagName("iframe")[0];
	var doc = iframe.contentDocument || iframe.contentWindow.document;
	window.onresize = onWindowResize;
	// get the language from the cookie
	_lang = getLanguage();
	if (doc ) {
		onIframeLoaded();
		var observerConfig = { attributes: false, childList: true, characterData: false, subtree: true };	
		var divs = {};
		var layoutMgrObserver = new MutationObserver(
			function(mutation) {
				// check for map if found store as global variable and trigger onMapLoad (if defined)
				if (!_map) {
					_map = iframe.contentWindow ? iframe.contentWindow._viewerMap : null;
					if (_map && getFunction("onMapLoad")) onMapLoad(_map);
				}
				var _found = [];
				for (j=0;j<_divClasses.length;j++) {
					if (doc) {
						// _divClasses[j] is either class or id
						var _div = doc.getElementsByClassName(_divClasses[j])[0];
						if (!_div) _div = doc.getElementById(_divClasses[j]);
						if (_div) {
							// add to found so it can be removed from classes to listen for load
							_found.push(_divClasses[j]);
							// add on load if handler exists
							var _divClass = _divClasses[j];
							// if the onload function exists invoke it with _div as argument
							var onLoadFunction = getFunction("on" + _divClass.replace(/-/g,'') + "Load");
							if (onLoadFunction) onLoadFunction(_div);
							// check for onChange function
							var onChangeFunction = getFunction("on" + _divClass.replace(/-/g,'') + "Change");
							if (onChangeFunction) {
								var observerConfig = {attributes: true, childList: true, characterData: true, subtree: true };	
								// create observer for changes to div
								var onChangeObserver = new MutationObserver(function() {
									// disconnect so if modify div in onChange function does not send into endless loop
									this.disconnect();
									onChangeFunction(this._div);
									this.observe(this._div, observerConfig);
								});
								onChangeObserver._div = _div;
								onChangeObserver.observe(_div, observerConfig);
							}
						}
					}
				}
				// remove from divClasses
				_divClasses = _divClasses.filter(function(x) {return _found.indexOf(x) == -1});
				if (_divClasses.length == 0) {
					this.disconnect();
				}
			}
		)
		layoutMgrObserver.observe(iframe.contentDocument.getElementById("jimu-layout-manager"), observerConfig);	
	}
}

// *************************
// Add startsWith for ie
// *************************
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
  };
}

// *************************
// Add foreach to NodeList for ie
// *************************
if (!NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
}
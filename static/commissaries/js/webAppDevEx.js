var _map;
var _lang;
var _infoWindowHTML;
var _contentdoc;

// ***************************************
// * EVENT HANDLERS
// **************************************

function onMapLoad(_map) {
}

function onesriPopupChange(_div) {
	editPopup(_div);
}

function onesriMobileInfoViewChange(_div) {
	editPopup(_div);
}


function onIframeLoaded(iframe) {
	$("#tabs").tabs();
	var activeTab = $("#tabs .ui-tabs-active")[0].children[0].getAttribute('ui-sref');
	layoutWindow(activeTab);
} 


function onactionnodeLoad(_div) {
	if (isMobile()) { _div.click(); }
}

function onTabChange(event, ui) {
	var newTab = ui.newTab[0].children[0].getAttribute('ui-sref');
	// if (newTab != 'propertyhistory') $("#tabs").tabs("disable",1);
	layoutWindow(newTab);
}


/*
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
*/

// ************************************************
// * HELPER FUNCTIONS
// ************************************************


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



// *************************
// function edits the popup. It edits content after load by doing two main things: 
// 1. replace any phrases with translated phrases
// 2. adds sampling results and overwrites href for sampling history link 
// *************************
function editPopup(_div) {
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

	
	// do text substitution in the popup window
	// [last-sample-date], [last-geomean], [last-singleday], [view-history]
	if (_div) {
		var mainSection = _div.getElementsByClassName("mainSection")[0];
		if (mainSection && mainSection.innerHTML != _infoWindowHTML) {
			/*
			// replace values in popup
			// get the html of main section, make replacements in string and replace mainsection.innerHTML
			var h = mainSection.innerHTML;
			h = h.replace('[view-history]', _a.get(0).outerHTML);
			mainSection.innerHTML = h;
			*/
			// translate popup content
			var doNotTranslate = [];
			var original = loadTranslatePhrases($('#popup-original')[0]);
			var translated = loadTranslatePhrases($('#popup-translated')[0]);
			if (translated.length == original.length) {
				var translatedTxt = mainSection.innerHTML;
				var changed = false;
				for (var i=0; i<translated.length; i++) {
					if (translated[i] != original[i] && translated[i].trim().length && !(doNotTranslate.indexOf(original[i].trim()) > -1)) {
						translatedTxt = translatedTxt.replaceAll(original[i], translated[i].trim());
						changed = true;
					}
				}
				if (changed) mainSection.innerHTML = translatedTxt;
			}
			
			// add history link
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
	_contentdoc = doc;
	// window.onresize = onWindowResize;
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
		
		translationChangeFunction = getFunction('onTranslationChange');
		if (translationChangeFunction) {
			// capture when translation changes
			var target = document.getElementById('popup-translated');
			// create an observer instance
			var observer = new MutationObserver(function(mutations) {
				translationChangeFunction();
			});
			// configuration of the observer:
			var config = {attributes: true, childList: true, characterData: true, subtree: true};
			// pass in the target node, as well as the observer options
			observer.observe(target, config);		
		}

		onIframeLoaded();
	}
}


function isMobile() {
	return window.matchMedia("only screen and (max-width: 760px)").matches;
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


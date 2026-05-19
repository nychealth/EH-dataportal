///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

//****************************************************************
//The main function of the this file is to show popup when encountering limited unsupported browsers.
//****************************************************************

window.showWarningForLimitedBrowser = function(jimuNls){
  var userAgent = window.navigator.userAgent || '';
  var unsupportedBrowser = /Trident\/\d+/i.test(userAgent); //IE

  var isInBuilder = isInConfigOrPreviewWindow();
  if(isInBuilder || !unsupportedBrowser){
    return;
  }

  var browserContainer = document.getElementById('unsupported-browser-message');
  var closeButton = document.getElementsByClassName('browser-button-container')[0].firstElementChild;
  //show message popup.
  browserContainer.style.display = 'flex';


  function isInConfigOrPreviewWindow(){
    var b = false;
    try{
      b = !window.isBuilder && window.parent && window.parent !== window &&
        window.parent.isBuilder;
    }catch(e){
      b = false;
    }
    return !!b;
  };

  function loadLocaleAndInitLinks(){
    var browserLabels = jimuNls.limitedUnsupportedBrowser;
    var closeLabel = jimuNls.common.close;
    closeButton.firstElementChild.setAttribute('alt', closeLabel);
    closeButton.firstElementChild.setAttribute('title', closeLabel);
    closeButton.firstElementChild.setAttribute('aria-label', closeLabel);

    document.getElementById('message-title').innerHTML = browserLabels.title;

    document.getElementById('message-content-1').innerHTML = browserLabels.onlineContent1;
    // document.getElementById('message-content-1').innerHTML = browserLabels.enterpriseContent1;

    document.getElementById('message-content-2').innerHTML = browserLabels.content2
    .replace(/\<chrome\-link\>(.+)\<\/chrome\-link\>/, '<a class="browser-message-link" href="https://www.google.com/chrome/">$1</a>')
    .replace(/\<firefox\-link\>(.+)\<\/firefox\-link\>/, '<a class="browser-message-link" href="https://www.mozilla.org/firefox/">$1</a>')
    .replace(/\<safari\-link\>(.+)\<\/safari\-link\>/, '<a class="browser-message-link" href="https://www.apple.com/safari/">$1</a>')
    .replace(/\<edge\-link\>(.+)\<\/edge\-link\>/, '<a class="browser-message-link" href="https://www.microsoft.com/edge/">$1</a>');

    document.getElementById('message-content-3').innerHTML = browserLabels.onlineContent3
    .replace(/\<feedback\-link\>(.+)\<\/feedback\-link\>/, '<a class="browser-message-link" href="https://community.esri.com/community/gis/web-gis/arcgisonline">$1</a>');
  }

  function initEvents(){
    browserContainer.firstElementChild.onclick = function(evt){
      if(evt.target.tagName !== 'A' && evt.target.tagName !== 'IMG'){
        evt.preventDefault();
        evt.stopPropagation();
      }
    }

    //close modal
    browserContainer.onclick = function(){
      closeModal();
    }
    closeButton.onclick = function(){
      closeModal();
    }
    browserContainer.addEventListener('keydown', function(evt){
      if(evt.keyCode === 27){
        evt.preventDefault();
        closeModal();
      }
    })

    //for links inside modal
    var links = document.getElementsByTagName('A');
    var lastLink = links[links.length - 1];
    closeButton.addEventListener('keydown', function(evt){
      if(evt.keyCode === 9 && evt.shiftKey){
        evt.preventDefault();
        lastLink.focus();
      }
    })
    lastLink.addEventListener('keydown', function(evt){
      if(evt.keyCode === 9 && !evt.shiftKey){
        evt.preventDefault();
        closeButton.focus();
      }
    })
  }

  function closeModal(){
    browserContainer.style.display = 'none';
  }

  loadLocaleAndInitLinks();
  initEvents();
}

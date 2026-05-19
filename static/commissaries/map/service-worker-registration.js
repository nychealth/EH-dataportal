'use strict';

if ('serviceWorker' in navigator) {
  // See https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/registration

  // listen DOMContentLoaded event to register sw earlier.
  window.addEventListener('DOMContentLoaded', function() {
    // service-worker.js *must* be located at the top-level directory relative to your site.
    // It won't be able to control pages unless it's located at the same level or higher than them.
    navigator.serviceWorker.register('./service-worker.js').then(function(reg) {
      console.log('Register a service worker.');
      window.swReg = reg
      window.swReg.active && window.swReg.active.postMessage({type: 'to_sw_register_success'});
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  });
}

window.postMessageToSw = function(message){
  if(!window.swReg){
    return;
  }
  window.swReg.active && window.swReg.active.postMessage(message);
}


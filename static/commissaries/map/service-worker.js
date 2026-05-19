var credential = null;
var isTryGetCredential = true;
var tryHandle;
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if(req.method === 'GET' && /\/sharing\/rest\/content\/items\/(.+)\/resources\/wabwidget/.test(req.url)){
    if(!credential){
      event.respondWith(new Promise(function(resolve, reject){
        var intervalHandle = setInterval(function(){
          if(!credential){
            !tryHandle && tryGetCredential();
            return
          }
          clearInterval(intervalHandle)

          resolve(fetch(appendCredentialToRequest(credential, event.request)))
        }, 200)
      }))
    }else{
      event.respondWith(fetch(appendCredentialToRequest(credential, event.request)));
      return;
    }
  }
  return;
});

self.addEventListener('activate', event => {
  clients.claim();
  !tryHandle && tryGetCredential()
});

self.addEventListener('message', (event) => {
  let message = event.data;
  if (message.type === 'to_sw_credential') {
    credential = message.credential;
  }else if(message.type === 'to_sw_no_credential'){
    isTryGetCredential = false;
  }else if(message.type === 'to_sw_register_success'){
    clients.claim();
  }
});

function appendCredentialToRequest(credential, req){
  if(credential && isDomainMatch(req.url, credential.server)){
    return new Request(appendToken(req.url));
  }else{
    return req;
  }
}

function tryGetCredential(){
  if(credential || !isTryGetCredential){
    if(tryHandle){
      clearTimeout(tryHandle)
      tryHandle = null
    }
    return
  }

  postMessage({
    type: 'to_window_get_credential'
  })

  tryHandle = setTimeout(tryGetCredential, 500)
}

function isDomainMatch(reqUrl, credentialUrl){
  if((/\.maps\.arcgis\.com/.test(reqUrl) || /www\.arcgis\.com/.test(reqUrl)) &&
    (/\.maps\.arcgis\.com/.test(credentialUrl) || /www\.arcgis\.com/.test(credentialUrl))){
    return true;
  }
  if((/\.mapsdevext\.arcgis\.com/.test(reqUrl) || /devext\.arcgis\.com/.test(reqUrl)) &&
    (/\.mapsdevext\.arcgis\.com/.test(credentialUrl) || /devext\.arcgis\.com/.test(credentialUrl))){
    return true;
  }
  if((/\.mapsqa\.arcgis\.com/.test(reqUrl) || /qaext\.arcgis\.com/.test(reqUrl)) &&
  (/\.mapsqa\.arcgis\.com/.test(credentialUrl) || /qaext\.arcgis\.com/.test(credentialUrl))){
    return true;
  }

  return reqUrl.indexOf(credentialUrl) > -1;
}

function appendToken(url){
  if(url.indexOf('?') < 0){
    return url + '?token=' + credential.token;
  }

  var query = url.split('?')[1];
  var pairs = query.split('&');
  var hasToken = false;
  for(var i = 0; i < pairs.length; i++){
    var splits = decodeURIComponent(pairs[i]).split('=');
    if(splits[0] === 'token'){
      hasToken = true;
    }
  }

  if(!hasToken){
    return url + '&token=' + credential.token;
  }
  return url;
}

function postMessage(message){
  clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message)
    })
  })
}


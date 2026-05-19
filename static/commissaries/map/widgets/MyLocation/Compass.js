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

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/Deferred',
  //'dojo/_base/html',
  'jimu/BaseWidget',
  'dojo/on',
  //'dojo/query',
  //'jimu/utils',
  'esri/symbols/PictureMarkerSymbol',
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/graphic",
  "esri/Color",
  "esri/geometry/Circle"
],
  function (declare, lang, Deferred,/*html,*/ BaseWidget, on,/*query, utils,*/
    PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol, Graphic, Color, Circle) {

    var instance = null, clazz;
    clazz = declare([BaseWidget], {
      //show compass on mobile
      constructor: function (folderUrl, map, config) {
        this.id = "widget-myLocation-compass-" + new Date().getTime();
        this.map = map;
        this.folderUrl = folderUrl;
        this.config = config;

        this._debug = 0;

        this.inherited(arguments);
      },

      show: function (parameters, geoLocate) {
        if (!(this.map.spatialReference.isWebMercator() || this.map.spatialReference === 4326)) {
          return; //support WebMercator only
        }
        // if(!jimuUtils.isMobileUa()){
        //   return;
        // }
        if (true === this.config.useCompass) {
          this._showDirection(geoLocate);
        }
        if (true === this.config.useAccCircle) {
          this._showAccCircle(parameters, geoLocate);
        }
      },

      //1. Direction
      _showDirection: function (geoLocate) {
        if (geoLocate.useTracking) {
          this._destroyDirectionHandler();
          var directionEvent;

          //var _flag1;
          if ('ondeviceorientationabsolute' in window) {
            directionEvent = "deviceorientationabsolute";// Chrome 50+ specific, "deviceorientationabsolute"
          //  _flag1 = "1";
          } else if ('ondeviceorientation' in window) {
            directionEvent = "deviceorientation";//Safari/iOS
          //  _flag1 = "2";
          } else if (DeviceOrientationEvent) {
            directionEvent = "deviceorientation";//FF
          //  _flag1 = "3";
          }
          //document.querySelector(".jimu-subtitle").innerText = this._flag1;

          this._directionHandler = on(window, directionEvent, lang.hitch(this, this._watchMobileLocation, geoLocate));
        }
      },

      _watchMobileLocation: function (geoLocate, event) {
        if (!event) {
          return;
        }

        var alpha;
        if (event.webkitCompassHeading || event.alpha) {
          alpha = event.webkitCompassHeading || Math.abs(event.alpha - 360);
        }
        var displayOrientation = window.orientation || 0;//Landscape: 90(head to left)/-90, Portrait: 0/180(head to bottom)
        //if (this._debug) {
        //  document.querySelector(".jimu-title").innerText = "==>"+this._flag1 +parseInt(alpha)+"==>"+displayOrientation;
        //}

        if ("undefined" !== typeof alpha) {
          var angle = -alpha - displayOrientation;
          var symbolOption = {
            url: this.folderUrl + "/images/compass.png",
            width: 36,
            height: 36,
            angle: angle
          };
          var highlightGraphic = geoLocate.highlightGraphic;

          highlightGraphic.setSymbol(new PictureMarkerSymbol(symbolOption));
        }
      },

      //2. accuracy circle
      _showAccCircle: function (parameters, geoLocate) {
        this._destroyAccCircle();
        var highlightGraphic = geoLocate.highlightGraphic;
        if (highlightGraphic && highlightGraphic._graphicsLayer) {
          var centerPt = highlightGraphic.geometry;

          var accuracy = parameters.position.coords.accuracy;
          var accCircleR = accuracy / this.map.getResolution();//px
          var circle = new Circle({
            center: centerPt,
            radius: accCircleR
          });

          var g = new Graphic(circle, new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([94, 164, 255, 0.2]), 1),//outline
            new Color([16, 119, 255, 0.2])
          ));
          highlightGraphic._graphicsLayer.add(g);

          //cache
          this._accCircle = g;
          this._accCircleGraphicsLayer = highlightGraphic._graphicsLayer;
        }
      },

      clean: function () {
        this._destroyDirectionHandler();
        this._destroyAccCircle();
      },
      //destroy
      destroy: function () {
        this.clean();
        this.inherited(arguments);
      },
      _destroyDirectionHandler: function () {
        if (this._directionHandler) {
          if (this._directionHandler.remove) {
            this._directionHandler.remove();
          }
          this._directionHandler = null;
        }
      },
      _destroyAccCircle: function () {
        if (this._accCircleGraphicsLayer && this._accCircleGraphicsLayer.remove && this._accCircle) {
          this._accCircleGraphicsLayer.remove(this._accCircle);
          this._accCircle = null;
        }
      }
    });

    clazz.getInstance = function (folderUrl, map, config) {
      if (instance === null) {
        instance = new clazz(folderUrl, map, config);
      }
      return instance;
    };
    clazz.needCompass = function (config) {
      if (true !== config.locateButton.highlightLocation || true !== config.locateButton.useTracking) {
        return false;//1 or all false
      }
      if (true !== config.useCompass && true !== config.useAccCircle) {
        return false;//all false
      }

      return true;
    };
    //https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes#3314664
    clazz.checkPermission = function () {
      var def = new Deferred();
      //var ua = utils.detectUserAgent();
      //var isIos = utils.isIosUa(),
      //    isSafari = ua.browser.safari;
      //alert("isSafari==> " + isSafari)

      //ios don't support def in requestPermission, so request directly
      if (/*isIos && isSafari &&*/DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission()
          .then(lang.hitch(this, function (response) {
            if (response == "granted") {
              def.resolve(true);
            } else {
              def.resolve(false);
            }
          }))
          .catch(function (error) {
            def.resolve(false);
          });
      } else {
        def.resolve(false);
      }
      return def;
    };
    return clazz;
  });
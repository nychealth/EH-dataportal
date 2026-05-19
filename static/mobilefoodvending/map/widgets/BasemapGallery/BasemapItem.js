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
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./BasemapItem.html',
  'dojo/Evented',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/on',
  'esri/SpatialReference',
  'jimu/utils',
  './utils'
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
  template, Evented, lang, html, on, SpatialReference, jimuUtils, utils) {
  var MODE_READONLY = 0, MODE_EDIT = 1, MODE_SELECT = 2;
  var clazz = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    basemap: null,
    folderUrl: null,
    nls: null,
    templateString: template,
    mode: MODE_READONLY, // readonly, edit, select

    _promise: null,
    _loaded: false,

    postCreate: function() {
      this.inherited(arguments);
      if (this.basemap) { // Create with basemap data
        this._createItem();
        this._loaded = true;
      }
      if (this.mode === MODE_EDIT) {
        html.addClass(this.domNode, 'edit-mode');
      } else if (this.mode === MODE_SELECT) {
        html.addClass(this.domNode, 'select-mode');
      }
    },

    toggleSelect: function() {
      if(this._loaded) {
        html.toggleClass(this.domNode, 'selected');
      }
    },

    isSelected: function() {
      return html.hasClass(this.domNode, 'selected');
    },

    updateItem: function(newBasemap) {
      this.basemap = newBasemap;
      html.setStyle(this.thumbnailElement,
                'backgroundImage', "url(" + this.basemap.thumbnailUrl + ")");
      this.titleElement.title = jimuUtils.stripHTML(this.basemap.title);
      this.titleElement.innerHTML = this.titleElement.title;
    },

    _createItem: function() {
      this.own(on(this.deleteIcon, 'click', lang.hitch(this, function() {
        this.emit('delete', this);
      })));
      this.own(on(this.editIcon, 'click', lang.hitch(this, function() {
        this.emit('edit', this);
      })));
      if (this.mode === MODE_SELECT) {
        this.own(on(this.domNode, 'click', lang.hitch(this, function() {
          this.toggleSelect();
          this.emit('selected', this.isSelected());
        })));
      } else {
        this.own(on(this.selectIcon, 'click', lang.hitch(this, function() {
          this.toggleSelect();
          this.emit('selected', this.isSelected());
        })));
      }

      var thumbnailUrl,
          reg = /data:image/,
          defaultThumbnail = this.folderUrl + "images/default.jpg";
      if (reg.test(this.basemap.thumbnailUrl)) {
        html.setStyle(this.thumbnailElement,
          'backgroundImage', "url(" + this.basemap.thumbnailUrl + ")");
      } else {
        if (!this.basemap.thumbnailUrl) {
          this.basemap.thumbnailUrl = defaultThumbnail;
          thumbnailUrl = this.basemap.thumbnailUrl;
        } else {
          if (this.basemap.thumbnailUrl.indexOf('//') === 0) {
            thumbnailUrl = this.basemap.thumbnailUrl;
            if(this.mode === MODE_READONLY) {
              thumbnailUrl = thumbnailUrl + utils.getToken(this.appConfig.portalUrl);
            }
          } else {
            thumbnailUrl = jimuUtils.processUrlInWidgetConfig(
                this.basemap.thumbnailUrl, this.folderUrl);
          }
        }
        if (this.mode !== MODE_READONLY) {
          jimuUtils.getBase64Data(thumbnailUrl).then(lang.hitch(this, function(data) {
            if (data) {
              this.basemap.thumbnailUrl = data;
            } else {
              this.basemap.thumbnailUrl = defaultThumbnail;
            }
            html.setStyle(this.thumbnailElement,
                'backgroundImage', "url(" + this.basemap.thumbnailUrl + ")");
          }));
        } else {
          html.setStyle(this.thumbnailElement,
                'backgroundImage', "url(" + thumbnailUrl + ")");
        }
      }

      this.titleElement.title = jimuUtils.stripHTML(this.basemap.title);
      this.titleElement.innerHTML = this.titleElement.title;

      // this.basemap.spatialReference is not an instance of SpatialReference
      // if it is read from config file
      if (!this.spatialReference.equals(
        new SpatialReference(+this.basemap.spatialReference.wkid))) {
        html.setStyle(this.thumbnailElement, "border", "1px solid red");
        html.setStyle(this.warnElement, 'display', '');
      }
    }
  });

  clazz.MODE_READONLY = MODE_READONLY;
  clazz.MODE_EDIT = MODE_EDIT;
  clazz.MODE_SELECT = MODE_SELECT;

  return clazz;
});

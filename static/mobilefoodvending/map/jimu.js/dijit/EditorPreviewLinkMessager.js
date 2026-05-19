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
  'dojo/on',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/query',
  'dojo/Evented',
  'dijit/Tooltip',
],
  function (declare, _WidgetBase, on, lang, html, query, Evented, Tooltip) {
    var singleton = null;
    var clazz = declare([_WidgetBase, Evented], {
      baseClass: 'jimu-editor-preview-link-messager',
      declaredClass: 'jimu.dijit.EditorPreviewLinkMessager',

      time: 3000,//3s

      postMixInProperties: function () {
        this.nls = window.jimuNls.richTextEditor;
        this.tooltipPrefix = this.nls.previewLinkToolTipsPrefix;
        this.tooltipSuffix = this.nls.previewLinkToolTipsSuffix;
      },

      isInBuilder: function () {
        return (window && window.parent && window.parent.isBuilder);
      },
      isHasContent: function (hasContent, isClosed) {
        return (hasContent && !isClosed);
      },

      filter: function (customContentNode) {
        if (customContentNode.nodeType && customContentNode.nodeType === 1) {
          var aTags = query('a', customContentNode);
          for (var i = 0, len = aTags.length; i < len; i++) {
            var a = aTags[i];
            var targetAttr = html.attr(a, "target");

            if ("_self" === targetAttr) { //mode: current window
              html.removeAttr(a, "target");
              var href = html.attr(a, "href");
              html.attr(a, "onclick", lang.hitch(this, function (evt) {
                this._interceptLink(evt);
                return false;
              }));

              //508
              this.own(on(a, 'focus', lang.hitch(this, function (evt) {
                this._interceptLink(evt);
              })));
              html.setAttr(a, "aria-label", href);
            }
          }
        }
      },

      _interceptLink: function (evt, href) {
        if (evt) {
          evt.preventDefault();//prevent link
        }

        var href = evt.target.href;

        //show
        Tooltip.show(this.tooltipPrefix + href + "<br/>" + this.tooltipSuffix, evt.target);
        //hide
        setTimeout(lang.hitch(this, function () {
          Tooltip.hide(evt.target);
        }), this.time);

        return false;
      }
    });

    clazz.getInstance = function () {
      if (null === singleton) {
        singleton = new clazz();
      }
      return singleton;
    };
    return clazz;
  });
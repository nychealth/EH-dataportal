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

define(['dojo/_base/declare',
    'dojo/_base/html',
    'dojo/query',
    'dojo/on',
    'dojo/_base/lang',
    './common',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/utils',
    'jimu/BaseWidget',
    'jimu/dijit/EditorXssFilter',
    'jimu/dijit/EditorPreviewLinkMessager'
  ],
  function(declare, html, query, on, lang, common, _WidgetsInTemplateMixin, jimuUtils, BaseWidget, EditorXssFilter, EditorPreviewLinkMessager) {
    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-about',

      postCreate: function () {
        this.inherited(arguments);
      },

      startup: function () {
        this.inherited(arguments);

        if (common.isDefaultContent(this.config)) {
          this.config.about.aboutContent = common.setDefaultContent(this.config, this.nls);
        }
        this.config.about.aboutContent = EditorXssFilter.getInstance().sanitize(this.config.about.aboutContent);//xss filter
        this.isOpen = true;

        this.openAtStartAysn = true;
        this.resize();

        this.openAtStartAysn = true;
        if(jimuUtils.isAutoFocusFirstNodeWidget(this)){
          this.customContentNode.focus();
        }

        //Focus customContentNode
        //use firstTabNode for passing focus state to customContentNode (FF)
        this.own(on(this.splashContainerNode, 'focus', lang.hitch(this, function(){
          this.firstTabNode.focus();
        })));
        this.own(on(this.firstTabNode, 'focus', lang.hitch(this, function(){
          this.customContentNode.focus();
        })));

        jimuUtils.setWABLogoDefaultAlt(this.customContentNode);
      },

      resize: function () {
        this._resizeContentImg();
      },

      onOpen: function(){
        this.isOpen = true;
        //resolve issue #15086 when network is so slow.
        setTimeout(lang.hitch(this, function(){
          this.isOpen = false;
        }), 50);
      },

      _resizeContentImg: function () {
        //record current activeElement before resizing
        var _activeElement = document.activeElement;
        html.empty(this.customContentNode);

        var aboutContent = html.toDom(this.config.about.aboutContent);
        html.place(aboutContent, this.customContentNode);
        // single node only(no DocumentFragment)
        if (this.customContentNode.nodeType && this.customContentNode.nodeType === 1) {
          var contentImgs = query('img', this.customContentNode);
          if (contentImgs && contentImgs.length) {
            contentImgs.forEach(lang.hitch(this, function (img) {
              var isNotLoaded = ("undefined" !== typeof img.complete && false === img.complete) ? true : false;
              if (isNotLoaded) {
                this.own(on(img, 'load', lang.hitch(this, function () {
                  this._resizeImg(img);
                })));
              } else {
                this._resizeImg(img);
              }
            }));
          }

          //Init dom's attrs and events again because doms are new after resizing.
          var focusableNodes = jimuUtils.getFocusNodesInDom(this.domNode);
          if(focusableNodes.length){
            jimuUtils.initFirstFocusNode(this.domNode, focusableNodes[0]);
            jimuUtils.initLastFocusNode(this.domNode, focusableNodes[focusableNodes.length - 1]);
          }

          //focus firstNode if required
          if(this.isOpen || html.isDescendant(_activeElement, this.domNode)){
            var firstNode = jimuUtils.getFirstFocusNode(this.domNode);
            if(jimuUtils.isAutoFocusFirstNodeWidget(this)){
              firstNode.focus();
            }
            this.isOpen = false;
          }
        }

        var editorPreviewLinkMessager = EditorPreviewLinkMessager.getInstance();
        if (editorPreviewLinkMessager.isInBuilder()) {
          editorPreviewLinkMessager.filter(this.customContentNode);
        }
      },
      _resizeImg: function(img) {
        var customBox = html.getContentBox(this.customContentNode);
        var imgSize = html.getContentBox(img);
        if (imgSize && imgSize.w && imgSize.w >= customBox.w) {
          html.setStyle(img, {
            maxWidth: (customBox.w - 20) + 'px', // prevent x scroll
            maxHeight: (customBox.h - 40) + 'px'
          });
        }
      }
    });
    return clazz;
  });
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
    'dojo/_base/lang',
    'dojo/_base/html',
    'require',
    'dojo/on',
    'dojo/keys',
    'dojo/topic',
    'dijit/_TemplatedMixin',
    'dojo/text!./Panel.html',
    'jimu/BaseWidgetPanel',
    'jimu/dijit/LoadingIndicator',
    'jimu/utils'
  ],
  function(
    declare, lang, html, require, on, keys, topic,
    _TemplatedMixin, template, BaseWidgetPanel, LoadingIndicator, utils
  ) {
    //jshint unused:false
    /****
    This panel is dockable at left
    ****/
    return declare([BaseWidgetPanel, _TemplatedMixin], {
      baseClass: 'jimu-panel jimu-ldockable-panel',

      templateString: template,

      width: 0,

      postMixInProperties:function(){
        this.panelNls = window.jimuNls.common;
      },

      postCreate: function(){
        this.inherited(arguments);
        this.maxWidth = this.position.width;

        html.setAttr(this.domNode, 'tabindex', this.config.tabIndex);
        var widgetConfig = this.config.widgets[0];
        if(widgetConfig){
          html.setAttr(this.domNode, 'aria-label', widgetConfig.label);
          this.expandLabel = this.panelNls.expand.replace('${value}', widgetConfig.label);
          this.collapseLabel = this.panelNls.collapse.replace('${value}', widgetConfig.label);
          html.setAttr(this.barNode, 'aria-label', this.collapseLabel);
        }

        //use barNode as interactive DOM when panel is hidden.
        this.own(on(this.domNode, 'focus', lang.hitch(this, function(){
          if(this.windowState === 'minimized'){
            this.barNode.focus();
          }
        })));

        this.own(on(this.domNode, 'keydown', lang.hitch(this, function(evt){
          if(!this.widget && widgetConfig){
            this.widget = this.widgetManager.getWidgetById(widgetConfig.id);
          }
          if(evt.keyCode === keys.ESCAPE){
            if(html.hasClass(evt.target, this.baseClass) ||
              (evt.target === this.barNode && this.windowState === 'minimized')){
              evt.preventDefault();
              utils.trapToNextFocusContainer(this.domNode);
              return;
            }
            var focusNode = evt.target === this.barNode ? this.domNode : this.barNode;
            focusNode.focus();
          }
          else if(evt.keyCode === keys.ENTER && html.hasClass(evt.target, this.baseClass)){
            evt.stopPropagation();
            evt.preventDefault();
            if(this.widget){
              utils.focusFirstFocusNode(this.widget.domNode);
            }
          }
        })));
      },

      startup: function(){
        var configs = this.getAllWidgetConfigs();
        if(Array.isArray(this.config.widgets)){
          configs = this.config.widgets;
        }else{
          configs = [this.config];
        }
        if(configs.length > 0){
          html.empty(this.containerNode);
        }

        this.inherited(arguments);
      },

      onOpen: function(){
        this._setPostionWidthAndLeft();
        html.setStyle(this.domNode, {
          width: this.position.width + 'px'
        });
        if(this.position.width === 0){
          this.panelManager.minimizePanel(this);
        }else{
          this.panelManager.maximizePanel(this);
        }
      },

      setPosition: function(position){
        this.inherited(arguments);
        topic.publish('changeMapPosition', {left: this.position.left + this.position.width});
      },

      onMaximize: function() {
        html.addClass(this.barNode, 'max');
        html.removeClass(this.barNode, 'min');

        this.position.left = 0;
        this.setPosition(this.position);
        this.inherited(arguments);
      },

      onMinimize: function() {
        html.removeClass(this.barNode, 'max');
        html.addClass(this.barNode, 'min');

        //on minimize, we can't set width/height = 0 to minimize because we use border-box model
        //and the content height/width can't be nagative
        //go here for more information: http://dev.w3.org/csswg/css-ui/#box-sizing
        this.position.left = 0 - this.position.width;
        this.setPosition(this.position);
        this.inherited(arguments);
      },

      resize: function(){
        this._setPostionWidthAndLeft();

        var style = utils.getPositionStyle(this.position);
        style.position = 'absolute';
        html.setStyle(this.domNode, style);
        topic.publish('changeMapPosition', {left: this.position.left + this.position.width});
      },

      _setPostionWidthAndLeft: function(){
        if(window.appInfo.isRunInMobile){
          var box = html.getMarginBox(window.jimuConfig.layoutId);
          this.position.width = box.w * 0.8;
          if(this.position.width > this.maxWidth){
            this.position.width = this.maxWidth;
          }
        }else{
          this.position.width = this.position.width;
        }

        // if(this.windowState === 'minimized'){
        //   this.position.left = 0 - this.position.width;
        // }else{
        //   this.position.left = 0;
        // }
      },

      _onBarClick: function() {
        var _tabindex = 0;
        if (this.windowState === 'maximized') {
          this.panelManager.minimizePanel(this);
          html.setAttr(this.barNode, 'aria-label', this.expandLabel);
          _tabindex = this.config.tabIndex;
        } else {
          this.panelManager.maximizePanel(this);
          html.setAttr(this.barNode, 'aria-label', this.collapseLabel);
        }
        html.setAttr(this.barNode, 'tabindex', _tabindex);
        setTimeout(lang.hitch(this, function(){
          this.barNode.focus();
        }), 50);
      },

      _onBarKeyDown: function(evt) {
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          evt.stopPropagation();
          evt.preventDefault();
          this._onBarClick();
        }else if(evt.keyCode === keys.TAB){
          if(this.windowState === 'maximized'){
            evt.preventDefault();
            utils.focusFirstFocusNode(this.widget.domNode);
          }else if(evt.shiftKey){//mini
            //back to last widget icon in header widget basing on the default browser's behavior.
            html.setAttr(this.domNode, 'tabindex', '-1'); //temp to stop focusing on panel domNode
            setTimeout(lang.hitch(this, function(){
              html.setAttr(this.domNode, 'tabindex', this.config.tabIndex); //reset
            }), 50);
          }
        }
      }

    });
  });
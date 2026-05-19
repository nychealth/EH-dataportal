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
    'dojo/on',
    'dojo/keys',
    'dojo/query',
    'dojo/Deferred',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/promise/all',
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/utils',
    'jimu/BaseWidget',
    'jimu/MapManager',
    'jimu/filterUtils',
    'jimu/dijit/Message',
    'jimu/symbolUtils',
    'esri/lang',
    'esri/request',
    'esri/symbols/jsonUtils',
    'esri/layers/FeatureLayer',
    'esri/dijit/PopupTemplate',
    'esri/renderers/SimpleRenderer',
    './TaskSetting',
    './SingleQueryLoader',
    './SingleQueryResult',
    './utils',
    'jimu/LayerInfos/LayerInfos',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/formSelect'
  ],
  function(on, keys, query, Deferred, lang, html, array, all, declare, _WidgetsInTemplateMixin, jimuUtils, BaseWidget,
    MapManager, FilterUtils, Message, jimuSymUtils, esriLang, esriRequest, symbolJsonUtils, FeatureLayer, PopupTemplate,
    SimpleRenderer, TaskSetting, SingleQueryLoader, SingleQueryResult, queryUtils, LayerInfos) {

    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Query',
      baseClass: 'jimu-widget-query',
      currentTaskSetting: null,
      hiddenClass: "not-visible",
      _resultLayerInfos: null,//[{value,label,taskIndex,singleQueryResult}]
      mapManager: null,
      layerInfosObj: null,
      labelTasks: '',
      labelResults: '',

      _focusNodes: {}, //cache current focusable nodes for every page
      miniCycleHandlers:{},

      /*

      popupInfo -> popupTempalte -> PopupRenderer

      test:
      http://map.floridadisaster.org/GIS/rest/services/Events/FL511_Feeds/MapServer/4
      http://maps.usu.edu/ArcGIS/rest/services/MudLake/MudLakeMonitoringSites/MapServer/0
      http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0
      1. if queryType is 1, it means that the query supports OrderBy and Pagination.
         such as: http://services2.arcgis.com/K1Xet5rYYN1SOWtq/ArcGIS/rest/services/
         USA_hostingFS/FeatureServer/0
      2. if queryType is 2, it means that the query supports objectIds, but
         doesn't support OrderBy or Pagination.
         such as: http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer
      3. if queryType is 3, it means that the query doesn't support objectIds.
      */

      postMixInProperties: function(){
        this.inherited(arguments);
        this.layerInfosObj = LayerInfos.getInstanceSync();
        this.mapManager = MapManager.getInstance();
        this._resultLayerInfos = [];
        var strClearResults = this.nls.clearResults;
        var tip = esriLang.substitute({clearResults:strClearResults}, this.nls.operationalTip);
        this.nls.operationalTip = tip;
        this.nls.layerName = window.apiNls.widgets.directions.layerName;
        this.labelTasks = this.nls.tasks;
        this.labelResults = this.nls.queryResults;
        this._setUrlForConfig();
        this._showFilterLabel = true;
        if(this.config){
          this.config = queryUtils.getConfigWithValidDataSource(this.config);
          this._updateConfig();
          if(this.config.labelTasks){
            this.labelTasks = this.config.labelTasks;
          }
          if(this.config.labelResults){
            this.labelResults = this.config.labelResults;
          }
          this._showFilterLabel = this.config.showFilterLabel;
        }
      },

      _updateConfig: function() {
        if (this.config && this.config.queries && this.config.queries.length > 0) {
          array.forEach(this.config.queries, lang.hitch(this, function(singleConfig) {
            this._rebuildFilter(singleConfig.url, singleConfig.filter);
          }));
        }
        if (!this.config) {
          return;
        }
        if (typeof this.config.showFilterLabel === 'undefined') {
          this.config.showFilterLabel = true;
        }
        if (typeof this.config.criteiraLabel === 'undefined') {
          this.config.criteiraLabel = this.nls.queryCriteira;
        }
        if (typeof this.config.spatialFilterLabel === 'undefined') {
          this.config.spatialFilterLabel = this.nls.spatialFilter;
        }
      },

      _setUrlForConfig: function(){
        //set url attribute of config if webMapLayerId is set
        if(this.config && this.config.queries && this.config.queries.length > 0){
          array.forEach(this.config.queries, lang.hitch(this, function(singleConfig){
            if(singleConfig.webMapLayerId){
              var layerInfoOrTableInfo = this.layerInfosObj.getLayerOrTableInfoById(singleConfig.webMapLayerId);
              if(layerInfoOrTableInfo){
                singleConfig.url = layerInfoOrTableInfo.getUrl();
              }
            }
          }));
        }
      },

      _rebuildFilter: function(url, filter){
        try{
          if(filter){
            delete filter.expr;
            var filterUtils = new FilterUtils();
            filterUtils.isHosted = jimuUtils.isHostedService(url);
            filterUtils.getExprByFilterObj(filter);
          }
        }catch(e){
          console.log(e);
        }
      },

      postCreate:function(){
        this.inherited(arguments);
        this._initSelf();
        this._updateResultDetailUI();
        var trs = query('.single-task', this.tasksTbody);
        if(trs.length === 1){
          html.addClass(this.domNode, 'only-one-task');
          this._showTaskSettingPane(true);
          this._onClickTaskTr(trs[0]);
        }else{
          this._updateFocusNodes('taskList');
          //esc-key to focus on task tabs
          this.own(on(this.taskTabView, 'keydown', lang.hitch(this, function(event){
            if(event.keyCode === keys.ESCAPE){
              event.stopPropagation();
              this.taskQueryItem.focus();
            }
          })));
        }

        //esc-key to focus on result tabs
        this.own(on(this.resultTabView, 'keydown', lang.hitch(this, function(event){
          if(event.keyCode === keys.ESCAPE){
            event.stopPropagation();
            this.resultQueryItem.focus();
          }
        })));

        //revert the behavior(focus on lasFocusNode) by framework with shift+tab key, focus on current tabs
        this.own(on(this.lastNode_framework, 'focus', lang.hitch(this, function(){
          var currentTab = html.getAttr(this.taskQueryItem, 'aria-selected') === 'true' ?
           this.taskQueryItem : this.resultQueryItem;
          currentTab.focus();
        })));
      },

      _focusCurrentFirstNode: function(firstNode){
        if(!firstNode){
          if(html.getAttr(this.taskQueryItem, 'aria-selected') === 'true'){
            if(html.getStyle(this.taskList, 'display') !== 'none'){
              firstNode = this._focusNodes.taskList.first;
            }else{
              firstNode = this._focusNodes.taskSetting ? this._focusNodes.taskSetting.first : null;
            }
          }else{
            firstNode = this._focusNodes.result ? this._focusNodes.result.first : null;
          }
        }
        if(firstNode){//it doesn't exist before data is ready.
          firstNode.focus();
        }
      },

      _updateFocusNodes: function(type){
        var firstNode, lastNode;
        if(type === "taskList"){
          var trs = query('.single-task', this.tasksTbody);
          if(trs.length === 0){
            firstNode = lastNode = this.noQueryTipSection;
          }else{
            firstNode = trs[0];
            lastNode = trs[trs.length - 1];
          }
          this._focusNodes.taskList = {first: firstNode, last: lastNode};
        }else if(type === 'taskSetting'){
          firstNode = this.currentTaskSetting.domNode;
          lastNode = this.currentTaskSetting.btnExecute;
          this._focusNodes.taskSetting = {first: firstNode, last: lastNode};
        }else if(type === 'result'){
          if(this._resultLayerInfos.length === 0){
            firstNode = this.noresultSection;
            lastNode = this.noresultSection;
          }else{
            var tableRow = query('.' + this.singleQueryResult._lastFeatureClass, this.singleQueryResult.resultsTbody);
            if(tableRow[0]){
              var lastTableRow = tableRow[tableRow.length - 1];
              var lastRelatedBtn = query('.' + this.singleQueryResult._lastRelatedClass, lastTableRow)[0];
              // var isExpanded =  query('.popup-td.expanded', lastTableRow)[0];//not work for collapsing all
              var popupContent =  query('.popup-content', lastTableRow)[0];
              var isExpanded =  html.getStyle(popupContent, 'display') === 'block';
              if(lastRelatedBtn && isExpanded){
                lastNode = lastRelatedBtn;
              }else{
                lastNode = query('.' + this.singleQueryResult._lastFeatureArrowClass, lastTableRow)[0];
              }
            }else{
              lastNode = this.singleQueryResult.expandedListIcon;
            }
            firstNode = this.resultLayersSelect.domNode;
          }
          this._focusNodes.result = {first: firstNode, last: lastNode};
        }
        this._initMiniCycle(type, firstNode, lastNode);
      },

      _initMiniCycle: function(type, firstNode, lastNode){
        if(!this.miniCycleHandlers[type]){
          this.miniCycleHandlers[type] = {};
        }else{
          this.miniCycleHandlers[type].first.remove();
          this.miniCycleHandlers[type].last.remove();
        }
        this.miniCycleHandlers[type].first = on(firstNode, 'keydown', lang.hitch(this, function(event){
          if(event.keyCode === keys.TAB && event.shiftKey && event.target === firstNode){
            event.preventDefault();
            lastNode.focus();
          }
        }));
        this.miniCycleHandlers[type].last = on(lastNode, 'keydown', lang.hitch(this, function(event){
          if(event.keyCode === keys.TAB && !event.shiftKey){
            event.preventDefault();
            firstNode.focus();
          }
        }));
      },

      _onFeaturesLayoutUpdate: function(){
        this._updateFocusNodes('result');
      },

      onOpen: function(){
        var info = this._getCurrentResultLayerInfo();
        var singleQueryResult = info && info.singleQueryResult;
        if(singleQueryResult){
          singleQueryResult.showLayer();
        }
        this._showTempLayers();
        this.inherited(arguments);
      },

      onActive: function(){
        //this.map.setInfoWindowOnClick(false);
        // this.mapManager.disableWebMapPopup();
        this._showTempLayers();
      },

      onDeActive: function(){
        //deactivate method of DrawBox dijit will call this.map.setInfoWindowOnClick(true) inside
        // this.drawBox.deactivate();
        if(this.currentTaskSetting){
          this.currentTaskSetting.deactivate();
        }
        this.mapManager.enableWebMapPopup();
        this._hideTempLayers();
      },

      onClose:function(){
        if(this.config.hideLayersAfterWidgetClosed){
          this._hideAllLayers();
        }
        this._hideInfoWindow();
        this._hideTempLayers();
        this.inherited(arguments);
      },

      destroy:function(){
        this._hideInfoWindow();
        this._removeResultLayerInfos(this._resultLayerInfos);
        this.inherited(arguments);
      },

      _hideTempLayers: function(){
        if(this.currentTaskSetting){
          this.currentTaskSetting.hideTempLayers();
        }
      },

      _showTempLayers: function(){
        if(this.currentTaskSetting){
          this.currentTaskSetting.showTempLayers();
        }
      },

      _initSelf:function(){
        var queries = this.config.queries;

        if(queries.length === 0){
          html.setStyle(this.tasksNode, 'display', 'none');
          html.setStyle(this.noQueryTipSection, 'display', 'block');
          return;
        }

        //create query tasks
        array.forEach(queries, lang.hitch(this, function(singleConfig, index){
          var defaultIcon = this.folderUrl + "css/images/default_task_icon.png";
          queryUtils.dynamicUpdateConfigIcon(singleConfig, defaultIcon);
          var name = singleConfig.name;
          var strTr = '<tr role="button" tabindex="0" class="single-task">' +
            '<td class="first-td"><span class="task-icon"></span></td>' +
            '<td class="second-td">' +
              '<div class="list-item-name task-name-div"></div>' +
            '</td>' +
          '</tr>';
          var tr = html.toDom(strTr);
          var queryNameDiv = query(".task-name-div", tr)[0];
          queryNameDiv.innerHTML = name;
          html.place(tr, this.tasksTbody);

          var iconNode = query("span.task-icon", tr)[0];
          var icon = singleConfig.icon;

          if (icon) {
            var size = 16;
            var symbolNodeStyle = null;
            var isImgType = icon.url || icon.imageData;

            if (isImgType) {
              icon.setWidth(size);
              icon.setHeight(size);
            } else {
              symbolNodeStyle = {
                width: size + 1,
                height: size + 1
              };
              icon.setSize(size);
            }

            var symbolNode = jimuSymUtils.createSymbolNode(icon, symbolNodeStyle);
            html.place(symbolNode, iconNode);
          }

          tr.taskIndex = index;
          tr.singleConfig = singleConfig;
          if(index % 2 === 0){
            html.addClass(tr, 'even');
          }else{
            html.addClass(tr, 'odd');
          }
        }));
      },

      _onTabHeaderClicked: function(event){
        var target = event.target || event.srcElement;
        if(target === this.taskQueryItem){
          var currentResultLayerInfo = this._getCurrentResultLayerInfo();
          if(currentResultLayerInfo){
            var singleQueryResult = currentResultLayerInfo.singleQueryResult;
            if(singleQueryResult){
              if(singleQueryResult.singleRelatedRecordsResult || singleQueryResult.multipleRelatedRecordsResult){
                singleQueryResult._showFeaturesResultDiv();
              }
            }
          }
          this._switchToTaskTab();
        }else if(target === this.resultQueryItem){
          this._switchToResultTab();
        }
      },

      _onTabHeaderKeydown: function(event){
        var target = event.target || event.srcElement;
        if(event.keyCode === keys.ENTER){
          this._onTabHeaderClicked(event);
        }else if(event.keyCode === keys.LEFT_ARROW || event.keyCode === keys.RIGHT_ARROW){
          var nextTab = target === this.taskQueryItem ? this.resultQueryItem : this.taskQueryItem;
          nextTab.focus();
        }
        else if(event.keyCode === keys.TAB){
          if(event.shiftKey){
            event.preventDefault();
          }else if(target === this.taskQueryItem && html.getAttr(this.taskQueryItem, 'tabindex') === '-1'){
            event.preventDefault();
            this._focusCurrentFirstNode();
          }
        }
      },

      _switchToTaskTab: function(){
        html.removeClass(this.resultQueryItem, 'selected');
        html.removeClass(this.resultTabView, 'selected');
        html.addClass(this.taskQueryItem, 'selected');
        html.addClass(this.taskTabView, 'selected');

        html.setAttr(this.resultQueryItem, 'tabindex', '-1');
        html.setAttr(this.resultQueryItem, 'aria-selected', 'false');
        html.setAttr(this.taskQueryItem, 'tabindex', '0');
        html.setAttr(this.taskQueryItem, 'aria-selected', 'true');

        //set first focusNode
        jimuUtils.initFirstFocusNode(this.domNode, this.taskQueryItem);
      },

      _switchToResultTab: function(){
        this._updateResultDetailUI();
        html.removeClass(this.taskQueryItem, 'selected');
        html.removeClass(this.taskTabView, 'selected');
        html.addClass(this.resultQueryItem, 'selected');
        html.addClass(this.resultTabView, 'selected');

        html.setAttr(this.taskQueryItem, 'tabindex', '-1');
        html.setAttr(this.taskQueryItem, 'aria-selected', 'false');
        html.setAttr(this.resultQueryItem, 'tabindex', '0');
        html.setAttr(this.resultQueryItem, 'aria-selected', 'true');

        this._updateFocusNodes('result');

        //set first focusNode
        jimuUtils.initFirstFocusNode(this.domNode, this.resultQueryItem);
      },

      _updateResultDetailUI: function(){
        if(this._resultLayerInfos.length > 0){
          html.removeClass(this.resultSection, this.hiddenClass);
          html.addClass(this.noresultSection, this.hiddenClass);
        }else{
          html.addClass(this.resultSection, this.hiddenClass);
          html.removeClass(this.noresultSection, this.hiddenClass);
          this.noresultSection.focus();
        }
      },

      _showTaskListPane: function(){
        html.setStyle(this.taskList, 'display', 'block');
        html.setStyle(this.taskSettingContainer, 'display', 'none');
        this._switchToTaskTab();
      },

      _showTaskSettingPane: function(){
        html.setStyle(this.taskList, 'display', 'none');
        html.setStyle(this.taskSettingContainer, 'display', 'block');
        this._switchToTaskTab();
      },

      /*------------------------------task list------------------------------------*/

      _onTaskListClicked: function(event){
        var target = event.target || event.srcElement;
        var tr = jimuUtils.getAncestorDom(target, lang.hitch(this, function(dom){
          return html.hasClass(dom, 'single-task');
        }), 10);

        if(!tr){
          return;
        }

        this._onClickTaskTr(tr);
      },

      _onTaskListKeydown: function(event){
        if(event.keyCode === keys.ENTER || event.keyCode === keys.SPACE){
          var tr = event.target || event.srcElement;
          this._onClickTaskTr(tr);
        }
      },

      _onClickTaskTr: function(tr){
        //this._getLayerInfoAndServiceInfo(tr).then(lang.hitch(this, function(response){
        this._getLayerInfoAndRelationshipLayerInfos(tr).then(lang.hitch(this, function(response){
          var layerInfo = response.layerInfo;
          var layerObject = response.layerObject;
          //var serviceInfo = response.serviceInfo;
          var relationshipLayerInfos = response.relationshipLayerInfos;
          var relationshipPopupTemplates = response.relationshipPopupTemplates;
          tr.singleConfig.objectIdField = jimuUtils.getObjectIdField(layerInfo);
          var popupInfo = this._getPopupInfo(layerInfo, tr.singleConfig);
          if(!popupInfo){
            console.error("can't get popupInfo");
          }
          popupInfo.fieldInfos = queryUtils.getPortalFieldInfosWithoutShape(layerInfo, popupInfo.fieldInfos);
          delete popupInfo.readFromWebMap;
          //now we get all layerDefinitions and popupInfos
          //we prepare currentAttrs here
          var currentAttrs = SingleQueryLoader.getCleanCurrentAttrsTemplate();
          currentAttrs.queryTr = tr;
          currentAttrs.config = lang.clone(tr.singleConfig);
          currentAttrs.config.popupInfo = popupInfo; //add popupInfo attribute
          currentAttrs.layerInfo = layerInfo;
          currentAttrs.layerObject = layerObject;
          //currentAttrs.serviceInfo = serviceInfo;
          currentAttrs.relationshipLayerInfos = relationshipLayerInfos;
          currentAttrs.relationshipPopupTemplates = relationshipPopupTemplates;
          currentAttrs.query.maxRecordCount = layerInfo.maxRecordCount || 1000;

          currentAttrs.queryType = queryUtils.getQueryType(layerInfo);

          //after get currentAttrs, we can show task setting pane destroy the old TaskSetting dijit and create a new one
          if (this.currentTaskSetting) {
            this.currentTaskSetting.destroy();
          }
          this.currentTaskSetting = null;
          this._showTaskSettingPane();
          this.currentTaskSetting = new TaskSetting({
            wId: this.id,
            nls: this.nls,
            map: this.map,
            showFilterLabel:this._showFilterLabel,
            criteiraLabel:this.config.criteiraLabel,
            spatialFilterLabel:this.config.spatialFilterLabel,
            currentAttrs: currentAttrs,
            layerInfosObj: this.layerInfosObj,
            onBack: lang.hitch(this, function() {
              this._showTaskListPane();
              this._focusCurrentFirstNode();
            }),
            onApply: lang.hitch(this, function(currentAttrs) {
              this._onBtnApplyClicked(currentAttrs);
            })
          });

          if (this.currentTaskSetting.canAutoRunning()) {
            this._switchToResultTab();
            //if the task can run without specify other parameters, then we run it automatically
            this.currentTaskSetting.run();
          }

          this.currentTaskSetting.placeAt(this.taskSettingContainer);

          this._updateFocusNodes('taskSetting');
          this._focusCurrentFirstNode();

          this.own(on(this.currentTaskSetting.domNode, 'keydown', lang.hitch(this, function(event){
            if(event.keyCode === keys.ESCAPE){
              event.stopPropagation();
              if(!html.hasClass(this.domNode, 'only-one-task') && event.target !== this.currentTaskSetting.backArrow){
                this.currentTaskSetting.backArrow.focus();
              }else{
                this.taskQueryItem.focus();
              }
            }
          })));

        }), lang.hitch(this, function(err){
          console.error("can't get layerInfo", err);
        }));
      },

      _getLayerInfoAndServiceInfo: function(tr){
        var def = new Deferred();
        var layerDef = this._getLayerInfo(tr);
        var serviceDef = this._getServiceInfo(tr);
        this.shelter.show();
        all([layerDef, serviceDef]).then(lang.hitch(this, function(results) {
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
          tr.layerInfo = results[0];
          tr.serviceInfo = results[1];
          def.resolve({
            layerInfo: tr.layerInfo,
            serviceInfo: tr.serviceInfo
          });
        }), lang.hitch(this, function(err) {
          console.error(err);
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
          var errMsg = "";
          if (err && err.httpCode === 403) {
            errMsg = this.nls.noPermissionsMsg;
          }
          this._showQueryErrorMsg(errMsg);
          def.reject();
        }));
        return def;
      },

      _getLayerInfoAndRelationshipLayerInfos: function(tr){
        var def = new Deferred();
        this.shelter.show();
        var layerDefinitionDef = this._getLayerInfo(tr);
        var layerObjectDef = queryUtils.tryGetLayerObject(tr.singleConfig.webMapLayerId);
        all([layerDefinitionDef, layerObjectDef]).then(lang.hitch(this, function(res){
          var layerInfo = res[0];
          var layerObject = res[1];
          tr.layerInfo = layerInfo;
          tr.layerObject = layerObject;
          this._getRelationshipLayerInfos(tr).then(lang.hitch(this, function(relationshipLayerInfos){
            if(!this.domNode){
              return;
            }

            tr.relationshipLayerInfos = relationshipLayerInfos;
            var relationshipPopupTemplates = {};
            var webMapItemData = this.map.itemInfo.itemData;

            var baseServiceUrl = tr.singleConfig.url.replace(/\d*\/*$/g, '');

            for(var layerId in relationshipLayerInfos){
              var layerDefinition = relationshipLayerInfos[layerId];
              //var popupInfo = queryUtils.getDefaultPopupInfo(layerDefinition, false, true);
              var layerUrl = baseServiceUrl + layerId;
              var popupInfo = queryUtils.getPopupInfoForRelatedLayer(webMapItemData, layerUrl , layerDefinition);
              relationshipPopupTemplates[layerId] = new PopupTemplate(popupInfo);
            }
            this.shelter.hide();
            def.resolve({
              layerInfo: layerInfo,
              layerObject: layerObject,
              relationshipLayerInfos: relationshipLayerInfos,
              relationshipPopupTemplates: relationshipPopupTemplates
            });
          }), lang.hitch(this, function(err){
            if(!this.domNode){
              return;
            }
            this.shelter.hide();
            def.reject(err);
          }));
        }), lang.hitch(this, function(err){
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          def.reject(err);
        }));
        return def;
      },

      //get layer definition
      _getLayerInfo: function(tr){
        var def = new Deferred();
        if(tr.layerInfo){
          def.resolve(tr.layerInfo);
        }else{
          var layerUrl = tr.singleConfig.url;
          esriRequest({
            url: layerUrl,
            content: {
              f: 'json'
            },
            handleAs: 'json',
            callbackParamName: 'callback'
          }).then(lang.hitch(this, function(layerInfo){
            tr.layerInfo = layerInfo;
            def.resolve(layerInfo);
          }), lang.hitch(this, function(err){
            def.reject(err);
          }));
        }
        return def;
      },

      //get meta data of MapServer or FeatureServer
      _getServiceInfo: function(tr){
        var def = new Deferred();
        if(tr.serviceInfo){
          def.resolve(tr.serviceInfo);
        }else{
          var layerUrl = tr.singleConfig.url;
          var serviceUrl = this._getServiceUrlByLayerUrl(layerUrl);
          esriRequest({
            url: serviceUrl,
            content: {
              f: 'json'
            },
            handleAs: 'json',
            callbackParamName: 'callback'
          }).then(lang.hitch(this, function(serviceInfo){
            tr.serviceInfo = serviceInfo;
            def.resolve(serviceInfo);
          }), lang.hitch(this, function(err){
            def.reject(err);
          }));
        }
        return def;
      },

      //get relationship layers definition
      _getRelationshipLayerInfos: function(tr){
        var def = new Deferred();
        if(tr.relationshipLayerInfos){
          def.resolve(tr.relationshipLayerInfos);
        }else{
          var layerInfo = tr.layerInfo;
          var relationships = layerInfo.relationships;
          if(relationships && relationships.length > 0){
            var layerUrl = tr.singleConfig.url;
            var serviceUrl = this._getServiceUrlByLayerUrl(layerUrl);
            var defs = array.map(relationships, lang.hitch(this, function(relationship){
              var url = serviceUrl + "/" + relationship.relatedTableId;
              return esriRequest({
                url: url,
                content: {
                  f: 'json'
                },
                handleAs: 'json',
                callbackParamName: 'callback'
              });
            }));
            all(defs).then(lang.hitch(this, function(results){
              tr.relationshipLayerInfos = {};
              array.forEach(relationships, lang.hitch(this, function(relationship, index){
                tr.relationshipLayerInfos[relationship.relatedTableId] = results[index];
              }));
              def.resolve(tr.relationshipLayerInfos);
            }), lang.hitch(this, function(err){
              tr.relationshipLayerInfos = null;
              def.reject(err);
            }));
          }else{
            tr.relationshipLayerInfos = {};
            def.resolve(tr.relationshipLayerInfos);
          }
        }
        return def;
      },

      _getServiceUrlByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var serviceUrl = layerUrl.slice(0, lastIndex);
        return serviceUrl;
      },

      _getPopupInfo: function(layerDefinition, config){
        var result = null;
        var defaultPopupInfo = queryUtils.getDefaultPopupInfo(layerDefinition, false, false);
        result = defaultPopupInfo;
        var popupInfo = null;
        if(config.popupInfo){
          //new query
          if(config.popupInfo.readFromWebMap){
            if(config.webMapLayerId){
              var layerInfo = null;
              if(queryUtils.isTable(layerDefinition)){
                layerInfo = this.layerInfosObj.getTableInfoById(config.webMapLayerId);
              }else{
                layerInfo = this.layerInfosObj.getLayerInfoById(config.webMapLayerId);
              }
              if (layerInfo) {
                popupInfo = layerInfo.getPopupInfo();
                if (popupInfo) {
                  popupInfo = lang.clone(popupInfo);
                  result = popupInfo;
                } else {
                  result = defaultPopupInfo;
                }
              } else {
                result = defaultPopupInfo;
              }
            }else{
              result = defaultPopupInfo;
            }
          }else{
            //custom popup info
            popupInfo = lang.clone(config.popupInfo);
            delete popupInfo.readFromWebMap;
            result = popupInfo;
          }
        }else if(config.popup){
          //old query, update old config.popup to new config.popupInfo
          result = queryUtils.upgradePopupToPopupInfo(layerDefinition, config.popup);
        }else{
          result = defaultPopupInfo;
        }

        if(!result){
          result = defaultPopupInfo;
        }

        result.showAttachments = !!layerDefinition.hasAttachments;

        queryUtils.removePopupInfoUnsupportFields(layerDefinition, result);

        return result;
      },

      /*------------------------------task list------------------------------------*/

      //start to query
      _onBtnApplyClicked:function(currentAttrs){
        //we should enable web map popup here
        this.mapManager.enableWebMapPopup();

        html.addClass(this.resultTabView, this.hiddenClass);

        //set query.resultLayer
        var singleResultLayer = currentAttrs.config.singleResultLayer;
        if(singleResultLayer){
          var taskIndex = currentAttrs.queryTr.taskIndex;
          var taskOptions = this._getResultLayerInfosByTaskIndex(taskIndex);
          if(taskOptions.length > 0){
            //When SingleQueryResult is destroyed, the related feature layer is removed
            this._removeResultLayerInfos(taskOptions);
          }
        }

        var queryName = this.currentTaskSetting.getQueryResultName();
        queryName = jimuUtils.sanitizeHTML(queryName);
        this._createNewResultLayer(currentAttrs, queryName);

        this.shelter.show();

        var singleQueryResult = new SingleQueryResult({
          map: this.map,
          nls: this.nls,
          label: queryName,
          currentAttrs: currentAttrs,
          queryWidget: this,
          onBack: lang.hitch(this, function(){
            this._switchToResultTab();
          })
        });
        this.own(on(singleQueryResult, 'show-related-records', lang.hitch(this, this._onShowRelatedRecords)));
        this.own(on(singleQueryResult, 'hide-related-records', lang.hitch(this, this._onHideRelatedRecords)));
        this.own(on(singleQueryResult, 'features-update', lang.hitch(this, this._onFeaturesUpdate)));
        this.own(on(singleQueryResult, 'features-layout-update', lang.hitch(this, this._onFeaturesLayoutUpdate)));

        //we should put singleQueryResult into the dom tree when _onSingleQueryFinished is called
        //singleQueryResult.placeAt(this.singleResultDetails);

        singleQueryResult.executeQueryForFirstTime().then(lang.hitch(this, function(/*allCount*/){
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
          html.removeClass(this.resultTabView, this.hiddenClass);
          // if(allCount > 0){
          //   this._onSingleQueryFinished(singleQueryResult, queryName);
          // }
          this._onSingleQueryFinished(singleQueryResult, queryName);
          this._updateResultDetailUI();

          this.singleQueryResult = singleQueryResult;
          this._updateFocusNodes('result');
          this._focusCurrentFirstNode();
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          html.removeClass(this.resultTabView, this.hiddenClass);
        }));
      },
      //create a FeatureLayer
      _createNewResultLayer: function(currentAttrs, queryName){
        var resultLayer = null;
        var renderer = null;
        var taskIndex = currentAttrs.queryTr.taskIndex;

        var layerInfo = lang.clone(currentAttrs.layerInfo);

        //override layerInfo
        layerInfo.name = queryName;
        //ImageServiceLayer doesn't have drawingInfo
        if (!layerInfo.drawingInfo) {
          layerInfo.drawingInfo = {};
        }

        layerInfo.drawingInfo.transparency = 0;
        layerInfo.minScale = 0;
        layerInfo.maxScale = 0;
        layerInfo.effectiveMinScale = 0;
        layerInfo.effectiveMaxScale = 0;
        layerInfo.defaultVisibility = true;
        delete layerInfo.extent;

        //only keep necessary fields
        var singleQueryLoader = new SingleQueryLoader(this.map, currentAttrs);
        var necessaryFieldNames = singleQueryLoader.getOutputFields();
        layerInfo.fields = array.filter(layerInfo.fields, lang.hitch(this, function(fieldInfo) {
          return necessaryFieldNames.indexOf(fieldInfo.name) >= 0;
        }));
        var featureCollection = {
          layerDefinition: layerInfo,
          featureSet: null
        };

        //For now, we should not add the FeatureLayer into map.
        resultLayer = new FeatureLayer(featureCollection);
        //set taskIndex for resutlLayer
        resultLayer._queryWidgetTaskIndex = taskIndex;
        //set popupTemplate
        var popupInfo = lang.clone(currentAttrs.config.popupInfo);
        var popupTemplate = new PopupTemplate(popupInfo);
        if(popupInfo.showAttachments){
          var url = currentAttrs.config.url;
          var objectIdField = currentAttrs.config.objectIdField;
          queryUtils.overridePopupTemplateMethodGetAttachments(popupTemplate, url, objectIdField);
        }
        resultLayer.setInfoTemplate(popupTemplate);

        currentAttrs.query.resultLayer = resultLayer;

        //set renderer
        //if the layer is a table, resultsSymbol will be null
        if(!queryUtils.isTable(currentAttrs.layerInfo)){
          if(!currentAttrs.config.useLayerSymbol && currentAttrs.config.resultsSymbol){
            var symbol = symbolJsonUtils.fromJson(currentAttrs.config.resultsSymbol);
            renderer = new SimpleRenderer(symbol);
            resultLayer.setRenderer(renderer);
          }
        }

        return resultLayer;
      },

      /*---------------------------query result list-------------------------------*/

      _onSingleQueryFinished: function(singleQueryResult, queryName){
        this.currentTaskSetting.onGetQueryResponse();
        singleQueryResult.placeAt(this.singleResultDetails);
        this._hideAllSingleQueryResultDijits();
        this._switchToResultTab();
        html.setStyle(singleQueryResult.domNode, 'display', 'block');
        var currentAttrs = singleQueryResult.getCurrentAttrs();
        var taskIndex = currentAttrs.queryTr.taskIndex;

        var resultLayerInfo = {
          value: jimuUtils.getRandomString(),
          label: queryName,
          taskIndex: taskIndex,
          singleQueryResult: singleQueryResult
        };

        this._resultLayerInfos.push(resultLayerInfo);

        this.resultLayersSelect.addOption({
          value: resultLayerInfo.value,
          label: resultLayerInfo.label
        });
        this.resultLayersSelect.set('value', resultLayerInfo.value);

        this._showResultLayerInfo(resultLayerInfo);

        this._updateResultDetailUI();
      },

      _onResultLayerSelectChanged: function(){
        var resultLayerInfo = this._getCurrentResultLayerInfo();
        if (resultLayerInfo) {
          this._showResultLayerInfo(resultLayerInfo);
        }
      },

      _getCurrentResultLayerInfo: function(){
        var resultLayerInfo = null;
        var value = this.resultLayersSelect.get('value');
        if(value){
          resultLayerInfo = this._getResultLayerInfoByValue(value);
        }
        return resultLayerInfo;
      },

      _hideAllLayers: function(/*optional*/ ignoredSingleQueryResult){
        var dijits = this._getAllSingleQueryResultDijits();
        array.forEach(dijits, lang.hitch(this, function(singleQueryResult){
          if(singleQueryResult && singleQueryResult !== ignoredSingleQueryResult){
            singleQueryResult.hideLayer();
          }
        }));
      },

      _removeResultLayerInfosByTaskIndex: function(taskIndex){
        var resultLayerInfos = this._getResultLayerInfosByTaskIndex(taskIndex);
        this._removeResultLayerInfos(resultLayerInfos);
      },

      _getResultLayerInfoByValue: function(value){
        var resultLayerInfo = null;
        array.some(this._resultLayerInfos, lang.hitch(this, function(item){
          if(item.value === value){
            resultLayerInfo = item;
            return true;
          }else{
            return false;
          }
        }));
        return resultLayerInfo;
      },

      _getResultLayerInfosByTaskIndex: function(taskIndex){
        var resultLayerInfos = this._resultLayerInfos;
        resultLayerInfos = array.filter(resultLayerInfos, lang.hitch(this, function(resultLayerInfo){
          return resultLayerInfo.taskIndex === taskIndex;
        }));
        return resultLayerInfos;
      },

      _removeResultLayerInfoByValues: function(values){
        var indexArray = [];
        array.forEach(this._resultLayerInfos, lang.hitch(this, function(resultLayerInfo, index){
          if(values.indexOf(resultLayerInfo.value) >= 0){
            indexArray.push(index);
            if(resultLayerInfo.singleQueryResult && resultLayerInfo.singleQueryResult.domNode){
              resultLayerInfo.singleQueryResult.destroy();
            }
            resultLayerInfo.singleQueryResult = null;
          }
        }));
        indexArray.reverse();
        array.forEach(indexArray, lang.hitch(this, function(index){
          this._resultLayerInfos.splice(index, 1);
        }));
        this.resultLayersSelect.removeOption(values);

        var options = this.resultLayersSelect.getOptions();
        if(options && options.length > 0){
          this.resultLayersSelect.set('value', options[0].value);
        }else{
          if(typeof this.resultLayersSelect._setDisplay === "function"){
            this.resultLayersSelect._setDisplay("");
          }
        }

        this._updateResultDetailUI();
      },

      _removeResultLayerInfos: function(resultLayerInfos){
        var values = array.map(resultLayerInfos, lang.hitch(this, function(resultLayerInfo){
          return resultLayerInfo.value;
        }));
        return this._removeResultLayerInfoByValues(values);
      },

      _getAllSingleQueryResultDijits: function(){
        var dijits = [];

        if(this._resultLayerInfos && this._resultLayerInfos.length > 0){
          array.forEach(this._resultLayerInfos, lang.hitch(this, function(resultLayerInfo){
            if(resultLayerInfo && resultLayerInfo.singleQueryResult){
              dijits.push(resultLayerInfo.singleQueryResult);
            }
          }));
        }

        return dijits;
      },

      _hideAllSingleQueryResultDijits: function(){
        var dijits = this._getAllSingleQueryResultDijits();
        array.forEach(dijits, lang.hitch(this, function(dijit){
          html.setStyle(dijit.domNode, 'display', 'none');
        }));
      },

      _showResultLayerInfo: function(resultLayerInfo){
        this._hideAllSingleQueryResultDijits();
        var singleQueryResult = resultLayerInfo.singleQueryResult;
        this._hideAllLayers(singleQueryResult);
        if (singleQueryResult) {
          html.setStyle(singleQueryResult.domNode, 'display', 'block');
          singleQueryResult.showLayer();
          singleQueryResult.zoomToLayer();
        }
      },

      removeSingleQueryResult: function(singleQueryResult){
        var value = null;
        array.some(this._resultLayerInfos, lang.hitch(this, function(resultLayerInfo){
          if(resultLayerInfo.singleQueryResult === singleQueryResult){
            value = resultLayerInfo.value;
            return true;
          }else{
            return false;
          }
        }));
        if(value !== null){
          this._removeResultLayerInfoByValues([value]);
        }
      },

      _onShowRelatedRecords: function(){
        html.addClass(this.resultLayersSelectDiv, this.hiddenClass);
      },

      _onHideRelatedRecords: function(){
        html.removeClass(this.resultLayersSelectDiv, this.hiddenClass);
      },

      _onFeaturesUpdate: function(args){
        var taskIndex = args.taskIndex;
        var features = args.features;
        try{
          this.updateDataSourceData(taskIndex, {
            features: features
          });
        }catch(e){
          console.error(e);
        }
      },

      /*-------------------------common functions----------------------------------*/

      _isImageServiceLayer: function(url) {
        return (url.indexOf('/ImageServer') > -1);
      },

      _showQueryErrorMsg: function(/* optional */ msg){
        new Message({message: msg || this.nls.queryError});
      },

      _hideInfoWindow:function(){
        if(this.map && this.map.infoWindow){
          this.map.infoWindow.hide();
          if(typeof this.map.infoWindow.setFeatures === 'function'){
            this.map.infoWindow.setFeatures([]);
          }
        }
      }

    });
  });
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
    'jimu/dijit/BindLabelPropsMixin',
    'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojo/Evented',
    'dojo/text!./SingleQueryResult.html',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/keys',
    'dojo/_base/query',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/Deferred',
    'esri/lang',
    'esri/tasks/QueryTask',
    'esri/tasks/FeatureSet',
    'esri/dijit/PopupTemplate',
    'esri/dijit/PopupRenderer',
    'esri/tasks/RelationshipQuery',
    'esri/renderers/SimpleRenderer',
    'jimu/utils',
    'jimu/symbolUtils',
    'jimu/dijit/Popup',
    'jimu/dijit/Message',
    'jimu/dijit/FeatureActionPopupMenu',
    'jimu/BaseFeatureAction',
    'jimu/dijit/SymbolChooser',
    'jimu/LayerInfos/LayerInfos',
    'jimu/FeatureActionManager',
    './SingleQueryLoader',
    './RelatedRecordsResult',
    'jimu/dijit/LoadingIndicator',
    'jimu/dijit/formSelect'
  ],
  function(declare, _WidgetBase, BindLabelPropsMixin, _TemplatedMixin, _WidgetsInTemplateMixin, Evented, template, lang,
    on, keys, query, html, array, Deferred, esriLang, QueryTask, FeatureSet, PopupTemplate, PopupRenderer,
    RelationshipQuery, SimpleRenderer, jimuUtils, jimuSymbolUtils, Popup, Message, PopupMenu, BaseFeatureAction,
    SymbolChooser, LayerInfos, FeatureActionManager, SingleQueryLoader, RelatedRecordsResult) {

    return declare([_WidgetBase, BindLabelPropsMixin, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {

      baseClass: 'single-query-result',
      templateString: template,
      singleQueryLoader: null,
      featureLayer: null, //used for execute queryRelatedFeatures
      singleRelatedRecordsResult: null,
      multipleRelatedRecordsResult: null,
      popupMenu: null,

      //options:
      map: null,
      nls: null,
      currentAttrs: null,
      queryWidget: null,

      _lastFeatureClass: 'jimu-table-row-last',
      _lastFeatureArrowClass: 'popup-title-icon',
      _lastRelatedClass: 'related-table-btn-last',

      //public methods:
      //getCurrentAttrs
      //zoomToLayer
      //executeQueryForFirstTime
      //_emitFeaturesUpdate

      //events:
      //features-update
      //show-related-records
      //hide-related-records

      postMixInProperties: function(){
        this.inherited(arguments);
        this.isRenderIdForAttrs = true;
        var commonNls = window.jimuNls.common;
        this.nls.back = commonNls.back;

        this.nls.expand = commonNls.expand.split(' $')[0];
        this.nls.collapse = commonNls.collapse.split(' $')[0];
      },

      //we can get where,geometry and resultLayer from singleQueryLoader
      getCurrentAttrs: function() {
        if (this.singleQueryLoader) {
          return this.singleQueryLoader.getCurrentAttrs();
        }
        return null;
      },

      postCreate: function() {
        this.inherited(arguments);
        //init SingleQueryLoader
        this.singleQueryLoader = new SingleQueryLoader(this.map, this.currentAttrs);
        this.popupMenu = PopupMenu.getInstance();
        this.featureActionManager = FeatureActionManager.getInstance();
        this.btnFeatureAction.title = window.jimuNls.featureActions.featureActions;

        this._initExpandListIcon();

        //init escape
        this.own(on(this.multipleRelatedRecordsDiv, 'keydown', lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ESCAPE && evt.target !== this.multipleRelatedRecordsResultBackBtn){
            evt.stopPropagation();
            this.multipleRelatedRecordsResultBackBtn.focus();
          }
        })));
        this.own(on(this.singleRelatedRecordsResultDiv, 'keydown', lang.hitch(this, function(evt){
          if(evt.keyCode === keys.ESCAPE && evt.target !== this.singleRelatedRecordsResultBackBtn){
            evt.stopPropagation();
            this.singleRelatedRecordsResultBackBtn.focus();
          }
        })));
      },

      _initExpandListIcon: function(){
        var currentAttrs = this.getCurrentAttrs();
        var config = currentAttrs && currentAttrs.config;
        var defaultExpand = config && config.defaultExpand;
        if(defaultExpand){
          html.addClass(this.expandedListIcon, 'expanded');
          this.expandedListIcon.title = this.nls.collapseAll;
          html.addClass(this.resultsTbody, 'expanded');
        }else{
          html.addClass(this.expandedListIcon, 'folded');
          this.expandedListIcon.title = this.nls.expandAll;
          html.addClass(this.resultsTbody, 'folded');
        }
      },

      destroy: function() {
        this.emit('features-update', {
          taskIndex: this.currentAttrs.queryTr.taskIndex
        });
        this.queryWidget = null;
        var currentAttrs = this.getCurrentAttrs();
        if (currentAttrs) {
          if (currentAttrs.query) {
            if (currentAttrs.query.resultLayer) {
              if (currentAttrs.query.resultLayer.getMap()) {
                this.map.removeLayer(currentAttrs.query.resultLayer);
              }
            }
            currentAttrs.query.resultLayer = null;
          }
        }
        this.inherited(arguments);
      },

      _isValidNumber: function(v) {
        return typeof v === "number" && !isNaN(v);
      },

      zoomToLayer: function() {
        var currentAttrs = this.getCurrentAttrs();
        var resultLayer = currentAttrs.query.resultLayer;
        if (resultLayer && !this._isTable(currentAttrs.layerInfo)) {
          //we should validate geometries to calculate extent
          var graphics = array.filter(resultLayer.graphics, lang.hitch(this, function(g) {
            var geo = g.geometry;
            if (geo) {
              //x and y maybe "NaN"
              if (geo.type === 'point') {
                return this._isValidNumber(geo.x) && this._isValidNumber(geo.y);
              } else if (geo.type === 'multipoint') {
                if (geo.points && geo.points.length > 0) {
                  return array.every(geo.points, lang.hitch(this, function(xyArray) {
                    if (xyArray) {
                      return this._isValidNumber(xyArray[0]) && this._isValidNumber(xyArray[1]);
                    } else {
                      return false;
                    }
                  }));
                } else {
                  return false;
                }
              } else {
                return true;
              }
            } else {
              return false;
            }
          }));
          if (graphics.length > 0) {
            var featureSet = jimuUtils.toFeatureSet(graphics);
            jimuUtils.zoomToFeatureSet(this.map, featureSet);
          }
        }
      },

      _emitFeaturesUpdate: function(){
        this.emit('features-update', {
          taskIndex: this.currentAttrs.queryTr.taskIndex,
          features: this.currentAttrs.query.resultLayer.graphics
        });
      },

      //start to query
      executeQueryForFirstTime: function() {
        var def = new Deferred();

        //reset result page
        this._clearResultPage();
        this._hideResultsNumberDiv();

        var currentAttrs = this.getCurrentAttrs();

        var resultLayer = currentAttrs.query.resultLayer;

        var callback = lang.hitch(this, function(features) {
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
          var allCount = currentAttrs.query.allCount;
          var foundedNum = currentAttrs.query.foundedNum;
          this._updateNumSpan(foundedNum, allCount);
          if (allCount > 0) {
            this._addResultItems(features, resultLayer);
            this._addResultLayerToMap(resultLayer);
            this.zoomToLayer();
          }
          def.resolve(allCount);
          this._emitFeaturesUpdate();
        });

        var errorCallback = lang.hitch(this, function(err) {
          console.error(err);
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
          if (resultLayer) {
            this.map.removeLayer(resultLayer);
          }
          resultLayer = null;
          this._showQueryErrorMsg();
          def.reject(err);
        });

        this.shelter.show();

        if (currentAttrs.queryType !== 3) {
          this._showResultsNumberDiv();
        }

        //execute Query for first time
        this.singleQueryLoader.executeQueryForFirstTime().then(callback, errorCallback);

        return def;
      },

      getResultLayer: function() {
        var currentAttrs = this.getCurrentAttrs();
        var resultLayer = lang.getObject("query.resultLayer", false, currentAttrs);
        return resultLayer;
      },

      showResultLayer: function() {
        var resultLayer = this.getResultLayer();
        if (resultLayer) {
          resultLayer.show();
        }
      },

      hideResultLayer: function() {
        var resultLayer = this.getResultLayer();
        if (resultLayer) {
          resultLayer.hide();
        }
      },

      showLayer: function() {
        this.showResultLayer();
        if (this.multipleRelatedRecordsResult) {
          this.multipleRelatedRecordsResult.showLayer();
        }
        if (this.singleRelatedRecordsResult) {
          this.singleRelatedRecordsResult.showLayer();
        }
      },

      hideLayer: function() {
        this.hideResultLayer();
        if (this.multipleRelatedRecordsResult) {
          this.multipleRelatedRecordsResult.hideLayer();
        }
        if (this.singleRelatedRecordsResult) {
          this.singleRelatedRecordsResult.hideLayer();
        }
      },

      _addResultLayerToMap: function(resultLayer) {
        if (this.map.graphicsLayerIds.indexOf(resultLayer.id) < 0) {
          this.map.addLayer(resultLayer);
        }
      },

      _showResultsNumberDiv: function() {
        html.setStyle(this.resultsNumberDiv, 'display', 'flex');
      },

      _hideResultsNumberDiv: function() {
        html.setStyle(this.resultsNumberDiv, 'display', 'none');
      },

      _updateNumSpan: function(numberFounded, allCount) {
        if(numberFounded > allCount){
          numberFounded = allCount;
        }
        this._updateLoadMoreVisible(numberFounded < allCount);
        numberFounded = jimuUtils.localizeNumber(numberFounded);
        allCount = jimuUtils.localizeNumber(allCount);
        var numText = numberFounded + '/' + allCount;
        this.numSpan.innerHTML = numText;
      },

      _isTable: function(layerDefinition) {
        return layerDefinition.type === "Table";
      },

      _onResultsScroll:function(){
        if (!jimuUtils.isScrollToBottom(this.resultsContainer)) {
          return;
        }
        this._continueQuery();
      },

      _continueQuery: function() {
        var currentAttrs = this.getCurrentAttrs();

        var allCount = currentAttrs.query.allCount;
        var foundedNum = currentAttrs.query.foundedNum;
        if (foundedNum >= allCount) {
          return;
        }

        var resultLayer = currentAttrs.query.resultLayer;

        var callback = lang.hitch(this, function(features) {
          if (!this.domNode) {
            return;
          }
          this._updateLoadMoreState(false);
          this.shelter.hide();
          foundedNum = currentAttrs.query.foundedNum;
          this._updateNumSpan(foundedNum, allCount);
          this._addResultItems(features, resultLayer);
          this.zoomToLayer();
          this._emitFeaturesUpdate();
          this.emit('features-layout-update');
        });

        var errorCallback = lang.hitch(this, function(err) {
          console.error(err);
          if (!this.domNode) {
            return;
          }
          this._updateLoadMoreState(false);
          this._showQueryErrorMsg();
          this.shelter.hide();
        });

        this.shelter.show();
        this._updateLoadMoreState(true);
        this.singleQueryLoader.executeQueryWhenScrollToBottom().then(callback, errorCallback);
      },

      _clearResultPage: function() {
        this._hideInfoWindow();
        this._unSelectResultTr();
        html.empty(this.resultsTbody);
        this._updateNumSpan(0, 0);
      },

      _unSelectResultTr: function() {
        if (this.resultTr) {
          html.removeClass(this.resultTr, 'jimu-state-active');
        }
        this.resultTr = null;
      },

      _selectResultTr: function(tr) {
        this._unSelectResultTr();
        this.resultTr = tr;
        if (this.resultTr) {
          html.addClass(this.resultTr, 'jimu-state-active');
        }
      },

      _addResultItems: function(features, resultLayer) {
        var currentAttrs = this.getCurrentAttrs();
        var url = currentAttrs.config.url;
        var objectIdField = currentAttrs.config.objectIdField;

        var relationships = this._getCurrentRelationships();
        var popupInfo = currentAttrs.config.popupInfo;
        var popupInfoWithoutMediaInfos = lang.clone(popupInfo);
        popupInfoWithoutMediaInfos.mediaInfos = [];
        var popupTemplate2 = new PopupTemplate(popupInfoWithoutMediaInfos);

        var shouldCreateSymbolNode = true;

        var renderer = resultLayer.renderer;
        if (!renderer) {
          shouldCreateSymbolNode = false;
        }

        var isWebMapShowRelatedRecordsEnabled = this._isWebMapShowRelatedRecordsEnabled();

        this._featuresNum = features.length;
        array.forEach(features, lang.hitch(this, function(feature, i) {
          var trClass = '';
          if (i % 2 === 0) {
            trClass = 'even';
          } else {
            trClass = 'odd';
          }

          resultLayer.add(feature);

          var options = {
            resultLayer: resultLayer,
            feature: feature,
            trClass: trClass,
            popupTemplate2: popupTemplate2,
            relationships: relationships,
            objectIdField: objectIdField,
            url: url,
            relationshipPopupTemplates: currentAttrs.relationshipPopupTemplates,
            shouldCreateSymbolNode: shouldCreateSymbolNode,
            isWebMapShowRelatedRecordsEnabled: isWebMapShowRelatedRecordsEnabled
          };

          this._createQueryResultItem(options, i);
        }));
      },

      _updateLoadMoreVisible: function(show) {
        if (show) {
          html.removeClass(this.loadMoreIcon, 'query-hidden');
        } else {
          html.addClass(this.loadMoreIcon, 'query-hidden');
        }
      },

      _updateLoadMoreState: function(loading) {
        if (loading) {
          html.addClass(this.loadMoreIcon, 'loading');
        } else {
          html.removeClass(this.loadMoreIcon, 'loading');
        }
      },

      _onLoadMoreClicked:function(){
        this._continueQuery();
      },

      _onLoadMoreKeydown:function(event){
        if(event.keyCode === keys.ENTER || event.keyCode === keys.SPACE){
          this._onLoadMoreClicked();
        }
      },

      _clearPopItemClass:function(){
        var exPoptd = query('.query-result-item-table .popup-td.expanded', this.resultsTbody);
        var foPoptd = query('.query-result-item-table .popup-td.folded', this.resultsTbody);
        if(exPoptd && exPoptd.length){
          exPoptd.removeClass('expanded');
        }
        if(foPoptd && foPoptd.length){
          foPoptd.removeClass('folded');
        }
      },

      _onExpandClicked:function(){
        var label = this.nls.expand;
        this._clearPopItemClass();
        if(!html.hasClass(this.resultsTbody, 'expanded')){
          html.removeClass(this.expandedListIcon, 'folded');
          html.addClass(this.resultsTbody, 'expanded');
          html.removeClass(this.resultsTbody, 'folded');
          this.expandedListIcon.title = this.nls.collapseAll;
          label = this.nls.collapse;

        }else{
          html.addClass(this.expandedListIcon, 'folded');
          html.removeClass(this.resultsTbody, 'expanded');
          html.addClass(this.resultsTbody, 'folded');
          this.expandedListIcon.title = this.nls.expandAll;
        }

        //update all
        var icons = query('.popup-title-icon', this.resultsTbody);
        for(var i = 0; i < icons.length; i++){
          html.setAttr(icons[i], 'aria-label', label);
        }
        this.emit('features-layout-update');
      },

      _onExpandKeydown: function(event){
        if(event.keyCode === keys.ENTER || event.keyCode === keys.SPACE){
          this._onExpandClicked();
        }
      },

      _getPopupTitle: function(popupTemplate, feature) {
        if (!popupTemplate) {
          return;
        }
        var title;
        if (typeof popupTemplate.title === "function") {
          title = popupTemplate.title(feature);
        } else {
          title = popupTemplate.title;
        }
        return title;
      },

      _createQueryResultItem: function(options, i) {
        var lastFeatureClass = '';
        var lastRelatedClass = '';
        var lastArrowData = '';
        if(i === this._featuresNum - 1){
          lastFeatureClass = ' ' + this._lastFeatureClass;
          lastRelatedClass = ' ' + this._lastRelatedClass;
          lastArrowData = 'data-lastArrow="true"';
        }
        var resultLayer = options.resultLayer;
        var feature = options.feature;
        var trClass = options.trClass;
        var popupTemplate2 = options.popupTemplate2;
        var relationships = options.relationships;
        var objectIdField = options.objectIdField;
        var url = options.url;
        var relationshipPopupTemplates = options.relationshipPopupTemplates;
        var shouldCreateSymbolNode = options.shouldCreateSymbolNode;
        var isWebMapShowRelatedRecordsEnabled = options.isWebMapShowRelatedRecordsEnabled;

        var attributes = feature && feature.attributes;
        if (!attributes) {
          return;
        }
        var title = this._getPopupTitle(popupTemplate2, feature);
        //create PopupRenderer
        var strItem = '<tr role="button" tabindex="0" ' +
          'class="jimu-table-row jimu-table-row-separator query-result-item' + lastFeatureClass + '" ' +
          ' cellpadding="0" cellspacing="0"><td>' +
          '<table class="query-result-item-table">' +
          '<tbody>' +
          '<tr>' +
          '<td class="symbol-td"></td><td class="popup-td expanded">' +
          '<div class="popup-title-container">' +
          '<div class="popup-title">' + title + '</div>' +
          '<div role="button" tabindex="0" aria-label="' + this.nls.collapse + '" ' + lastArrowData +
          ' class="popup-title-icon"></div></div>' +
          '<div class="popup-content"></div>' +
          '</td>' +
          '</tr>' +
          '</tbody>' +
          '</table>' +
          '</td></tr>';
        var trItem = html.toDom(strItem);
        html.addClass(trItem, trClass);
        html.place(trItem, this.resultsTbody);
        trItem.feature = feature;

        var symbolTd = query('.symbol-td', trItem)[0];
        if (shouldCreateSymbolNode) {
          try {
            var renderer = resultLayer.renderer;
            if (renderer) {
              var symbol = renderer.getSymbol(feature);
              if (symbol) {
                var symbolNode = jimuSymbolUtils.createSymbolNode(symbol, {
                  width: 32,
                  height: 32
                });
                if (symbolNode) {
                  html.place(symbolNode, symbolTd);
                }
              }
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          html.destroy(symbolTd);
        }

        var popupTd = query('.popup-td .popup-content', trItem)[0];
        var catheTitle = popupTemplate2.title;
        var catheInfoTitle = popupTemplate2.info && popupTemplate2.info.title;

        popupTemplate2.title = null;
        if(catheInfoTitle){
          popupTemplate2.info.title = null;
        }
        var popupRenderer = new PopupRenderer({
          template: popupTemplate2,
          graphic: feature,
          chartTheme: popupTemplate2.chartTheme
        });
        html.place(popupRenderer.domNode, popupTd);
        popupRenderer.startup();
        popupTemplate2.title = catheTitle;
        if(catheInfoTitle){
          popupTemplate2.info.title = catheInfoTitle;
        }
        //create TitlePane for relationships
        if (objectIdField && relationships && relationships.length > 0 && isWebMapShowRelatedRecordsEnabled) {
          var objectId = feature.attributes[objectIdField];
          //var lastIndex = relationships.length - 1;
          array.forEach(relationships, lang.hitch(this, function(relationship, j) {
            //{id,name,relatedTableId}
            //var layerName = this._getLayerNameByRelationshipId(relationship.id);
            var relationshipLayerInfo = this._getRelationshipLayerInfo(relationship.relatedTableId);
            var layerName = relationshipLayerInfo.name;
            var relationshipPopupTemplate = relationshipPopupTemplates[relationship.relatedTableId];

            var btnClass = "related-table-btn";
            if(i === this._featuresNum - 1 && j === relationships.length - 1){
              btnClass = btnClass + ' ' + lastRelatedClass;
            }
            var btn = html.create("div", {
              "class": btnClass,
              "role": "button",
              "tabindex": "0",
              "innerHTML": layerName //this.nls.attributesFromRelationship + ': ' + layerName
            }, popupTd);
            btn.queryStatus = "unload";
            btn.url = url;
            btn.layerName = layerName;
            btn.objectId = objectId;
            btn.relationship = relationship;
            btn.relationshipLayerInfo = relationshipLayerInfo;
            btn.relationshipPopupTemplate = relationshipPopupTemplate;
          }));
        }
      },

      _onBtnMultipleRelatedBackClicked: function() {
        this._showFeaturesResultDiv();
      },

      _onBtnMultipleRelatedBackKeydown: function(evt) {
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.ESCAPE){
          evt.stopPropagation();
          this._onBtnMultipleRelatedBackClicked();
          this.btnFeatureAction.focus();
        }else if(evt.keyCode === keys.TAB && evt.shiftKey){
          evt.preventDefault();
          this.multipleRelatedRecordsResult.lastFocusItem.focus();
        }
      },

      _onBtnSingleRelatedBackClicked: function() {
        this._showFeaturesResultDiv();
      },

      _onBtnSingleRelatedBackKeydown: function(evt) {
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE || evt.keyCode === keys.ESCAPE){
          evt.stopPropagation();
          this._onBtnSingleRelatedBackClicked();
          this._currentRelatedRecord.focus();
        }else if(evt.keyCode === keys.TAB && evt.shiftKey){
          evt.stopPropagation();
        }
      },

      _onBtnSingleRelatedTitleKeydown: function(evt) {
        if(evt.keyCode === keys.TAB && evt.shiftKey){
          evt.preventDefault();
          this.singleRelatedRecordsResult.lastFocusItem.focus();
        }
      },

      _showFeaturesResultDiv: function() {
        if (this.multipleRelatedRecordsResult) {
          this.multipleRelatedRecordsResult.destroy();
        }
        this.multipleRelatedRecordsResult = null;

        if (this.singleRelatedRecordsResult) {
          this.singleRelatedRecordsResult.destroy();
        }
        this.singleRelatedRecordsResult = null;

        html.addClass(this.multipleRelatedRecordsDiv, 'not-visible');
        html.addClass(this.singleRelatedRecordsResultDiv, 'not-visible');
        html.removeClass(this.featuresResultDiv, 'not-visible');
        this.emit("hide-related-records");
      },

      _showMultipleRelatedRecords: function() {
        if (this.singleRelatedRecordsResult) {
          this.singleRelatedRecordsResult.destroy();
        }
        this.singleRelatedRecordsResult = null;

        html.addClass(this.featuresResultDiv, 'not-visible');
        html.addClass(this.singleRelatedRecordsResultDiv, 'not-visible');
        html.removeClass(this.multipleRelatedRecordsDiv, 'not-visible');
        this.emit("show-related-records");

        var relationships = this._getCurrentRelationships();
        this.relatedLayersSelect.removeOption(this.relatedLayersSelect.getOptions());
        array.forEach(relationships, lang.hitch(this, function(relationship) {
          var relationshipLayerInfo = this._getRelationshipLayerInfo(relationship.relatedTableId);
          var relationshipPopupTemplate = this.currentAttrs.relationshipPopupTemplates[relationship.relatedTableId];
          var layerName = relationshipLayerInfo.name;

          this.relatedLayersSelect.addOption({
            value: relationship.id + "",//should be a string
            label: layerName,
            relationship: relationship,
            relationshipLayerInfo: relationshipLayerInfo,
            relationshipPopupTemplate: relationshipPopupTemplate
          });
        }));

        this._onRelatedLayersSelectChanged();
      },

      _onRelatedLayersSelectChanged: function() {
        var value = this.relatedLayersSelect.get('value');
        var option = this.relatedLayersSelect.getOptions(value);
        if (!option) {
          return;
        }
        /*{
            value: relationship.id,
            label: layerName,
            relationship: relationship,
            relationshipLayerInfo: relationshipLayerInfo,
            relationshipPopupTemplate: relationshipPopupTemplate,
            selected: index === 0
          }*/
        if (this.multipleRelatedRecordsResult) {
          this.multipleRelatedRecordsResult.destroy();
        }
        this.multipleRelatedRecordsResult = new RelatedRecordsResult({
          map: this.map,
          layerDefinition: option.relationshipLayerInfo,
          nls: this.nls,
          config: this.currentAttrs.config
        });
        // this.multipleRelatedRecordsResult.placeAt(this.multipleRelatedRecordsDiv, 'first');
        this.multipleRelatedRecordsResult.placeAt(this.multipleRelatedRecordsDiv);
        this.multipleRelatedRecordsResult.lastFocusItem = this.multipleRelatedRecordsResultBackBtn;//default for asyn data
        this.multipleRelatedRecordsResultBackBtn.focus();

        this.own(on(this.multipleRelatedRecordsResult, 'focus-result-header', lang.hitch(this, function(){
          this.multipleRelatedRecordsResultBackBtn.focus();
        })));

        var url = this.currentAttrs.config.url;
        this.shelter.show();
        var errorCallback = lang.hitch(this, function(err) {
          console.error(err);
          if (!this.domNode) {
            return;
          }
          this.shelter.hide();
        });
        //var objectIds = this.currentAttrs.query.objectIds;
        this.singleQueryLoader.getObjectIdsForAllRelatedRecordsAction().then(lang.hitch(this, function(objectIds){
          var def = this._queryRelatedRecords(url, objectIds, option.relationship.id);
          def.then(lang.hitch(this, function(response) {
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            //{objectId:{features,geometryType,spatialReference,transform}}
            var features = [];
            array.forEach(objectIds, lang.hitch(this, function(objectId) {
              var a = response[objectId];
              if (a && a.features && a.features.length > 0) {
                features = features.concat(a.features);
              }
            }));

            var relationshipLayerInfo = option.relationshipLayerInfo;
            var featureSet = new FeatureSet();
            featureSet.fields = lang.clone(relationshipLayerInfo.fields);
            featureSet.features = features;
            featureSet.geometryType = relationshipLayerInfo.geometryType;
            featureSet.fieldAliases = {};
            array.forEach(featureSet.fields, lang.hitch(this, function(fieldInfo) {
              var fieldName = fieldInfo.name;
              var fieldAlias = fieldInfo.alias || fieldName;
              featureSet.fieldAliases[fieldName] = fieldAlias;
            }));
            this.multipleRelatedRecordsResult.setResult(option.relationshipPopupTemplate, featureSet);
          }), errorCallback);
        }), errorCallback);
      },

      _showSingleRelatedRecordsDiv: function() {
        if (this.multipleRelatedRecordsResult) {
          this.multipleRelatedRecordsResult.destroy();
        }
        this.multipleRelatedRecordsResult = null;

        html.addClass(this.featuresResultDiv, 'not-visible');
        html.addClass(this.multipleRelatedRecordsDiv, 'not-visible');
        html.removeClass(this.singleRelatedRecordsResultDiv, 'not-visible');
        this.emit("show-related-records");
      },

      _onSingleRelatedTableButtonClicked: function(target) {
        if (this.singleRelatedRecordsResult) {
          this.singleRelatedRecordsResult.destroy();
        }
        this.singleRelatedRecordsResult = null;
        var url = target.url;
        var layerName = target.layerName;
        var objectId = target.objectId;
        var relationship = target.relationship;
        var relationshipLayerInfo = target.relationshipLayerInfo;
        var relationshipPopupTemplate = target.relationshipPopupTemplate;
        this.singleRelatedRecordsResult = new RelatedRecordsResult({
          map: this.map,
          layerDefinition: relationshipLayerInfo,
          nls: this.nls,
          config: this.currentAttrs.config
        });
        // this.singleRelatedRecordsResult.placeAt(this.singleRelatedRecordsResultDiv, 'first');
        this.singleRelatedRecordsResult.placeAt(this.singleRelatedRecordsResultDiv);
        // this.own(on(this.singleRelatedRecordsResult, 'back', lang.hitch(this, function(){
        //   this._showFeaturesResultDiv();
        // })));

        this.singleRelatedRecordsResultTitle.lastFocusItem = this.singleRelatedRecordsResultBackBtn;//default
        this.own(on(this.singleRelatedRecordsResult, 'focus-result-header', lang.hitch(this, function(){
          this.singleRelatedRecordsResultTitle.focus();
        })));


        this._showSingleRelatedRecordsDiv();
        var callback = lang.hitch(this, function() {
          var featureSet = new FeatureSet();
          featureSet.fields = lang.clone(relationshipLayerInfo.fields);
          featureSet.features = target.relatedFeatures;
          featureSet.geometryType = relationshipLayerInfo.geometryType;
          featureSet.fieldAliases = {};
          array.forEach(featureSet.fields, lang.hitch(this, function(fieldInfo) {
            var fieldName = fieldInfo.name;
            var fieldAlias = fieldInfo.alias || fieldName;
            featureSet.fieldAliases[fieldName] = fieldAlias;
          }));
          this.singleRelatedRecordsResult.setResult(relationshipPopupTemplate, featureSet);

          this.relatedTitleDiv.innerHTML = layerName;

          this.singleRelatedRecordsResultTitle.focus();
          this._currentRelatedRecord = target;
        });
        //execute executeRelationshipQuery when firstly click target
        if (target.queryStatus === "unload") {
          target.queryStatus = "loading";
          this.shelter.show();
          this._queryRelatedRecords(url, [objectId], relationship.id).then(lang.hitch(this, function(response) {
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            //{objectId:{features,geometryType,spatialReference,transform}}
            var result = response && response[objectId];
            var features = result && result.features;
            features = features || [];
            target.relatedFeatures = features;
            target.queryStatus = "loaded";
            callback();
          }), lang.hitch(this, function(err) {
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            console.error(err);
            target.queryStatus = "unload";
            callback();
          }));
        } else if (target.queryStatus === "loaded") {
          callback();
        }
      },

      _queryRelatedRecords: function(url, objectIds, relationshipId) {
        var queryTask = new QueryTask(url);
        var relationshipQuery = new RelationshipQuery();
        relationshipQuery.objectIds = objectIds;
        relationshipQuery.relationshipId = relationshipId;
        relationshipQuery.outFields = ['*'];
        relationshipQuery.returnGeometry = true;
        relationshipQuery.outSpatialReference = this.map.spatialReference;
        return queryTask.executeRelationshipQuery(relationshipQuery);
      },

      _getCurrentRelationships: function() {
        var currentAttrs = this.getCurrentAttrs();
        return currentAttrs.queryTr.layerInfo.relationships || [];
      },

      //{id,name,relatedTableId}
      //relationshipId is the id attribute
      _getRelationshipInfo: function(relationshipId) {
        var relationships = this._getCurrentRelationships();
        for (var i = 0; i < relationships.length; i++) {
          if (relationships[i].id === relationshipId) {
            return relationships[i];
          }
        }
        return null;
      },

      _getRelationshipLayerInfo: function(relatedTableId) {
        var currentAttrs = this.getCurrentAttrs();
        var layerInfo = currentAttrs.relationshipLayerInfos[relatedTableId];
        return layerInfo;
      },

      _tryLocaleNumber: function(value) {
        var result = value;
        if (esriLang.isDefined(value) && isFinite(value)) {
          try {
            //if pass "abc" into localizeNumber, it will return null
            var a = jimuUtils.localizeNumber(value);
            if (typeof a === "string") {
              result = a;
            }
          } catch (e) {
            console.error(e);
          }
        }
        //make sure the retun value is string
        result += "";
        return result;
      },

      _showQueryErrorMsg: function( /* optional */ msg) {
        new Message({
          message: msg || this.nls.queryError
        });
      },

      _onSinglePopupExpandIconClicked: function(target) {
        var label = this.nls.expand;
        var poptd = target.parentNode.parentNode;
        if (!poptd) {
          return;
        }
        var a = html.hasClass(this.resultsTbody, 'expanded');
        var b = !html.hasClass(poptd, 'expanded') && !html.hasClass(poptd, 'folded');
        if (b) {
          if (a) {
            html.addClass(poptd, 'folded');
            html.removeClass(poptd, 'expanded');
          } else {
            html.addClass(poptd, 'expanded');
            html.removeClass(poptd, 'folded');
            label = this.nls.collapse;
          }
        } else {
          if (html.hasClass(poptd, 'expanded')) {
            html.removeClass(poptd, 'expanded');
            html.addClass(poptd, 'folded');
          } else {
            html.addClass(poptd, 'expanded');
            html.removeClass(poptd, 'folded');
            label = this.nls.collapse;
          }
        }
        html.setAttr(target, 'aria-label', label);
        if(html.getAttr(target, 'data-lastArrow') === 'true'){
          this.emit('features-layout-update');
        }
      },

      _onResultsTableKeydown:function(event){
        if(event.keyCode === keys.ENTER || event.keyCode === keys.SPACE){
          this._onResultsTableClicked(event);
        }
      },

      _onResultsTableClicked: function(event) {
        var target = event.target || event.srcElement;
        if (!html.isDescendant(target, this.resultsTable)) {
          return;
        }

        if (html.hasClass(target, 'popup-title-icon')) {
          this._onSinglePopupExpandIconClicked(target);
          return;
        }

        if (html.hasClass(target, 'related-table-btn')) {
          this._onSingleRelatedTableButtonClicked(target);
          return;
        }

        var tr;
        if(html.hasClass(target, 'query-result-item')){//for keyboard
          tr = target;
        }else{
          tr = jimuUtils.getAncestorDom(target, lang.hitch(this, function(dom) {
            return html.hasClass(dom, 'query-result-item');
          }), this.resultsTbody);
        }
        if (!tr) {
          return;
        }

        this._selectResultTr(tr);

        html.addClass(tr, 'jimu-state-active');
        var feature = tr.feature;
        var geometry = feature.geometry;
        if (geometry) {
          var geoType = geometry.type;
          var centerPoint, extent;
          if (geoType === 'point') {
            centerPoint = geometry;
          } else if (geoType === 'multipoint') {
            if (geometry.points.length === 1) {
              centerPoint = geometry.getPoint(0);
            } else if (geometry.points.length > 1) {
              centerPoint = geometry.getPoint(0);
            }

          } else if (geoType === 'polyline') {
            extent = geometry.getExtent();
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
          } else if (geoType === 'polygon') {
            extent = geometry.getExtent();
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
          } else if (geoType === 'extent') {
            extent = geometry;
            extent = extent.expand(1.4);
            centerPoint = extent.getCenter();
          }
          var featureSet = jimuUtils.toFeatureSet(feature);
          jimuUtils.zoomToFeatureSet(this.map, featureSet);
          if (typeof this.map.infoWindow.setFeatures === 'function') {
            this.map.infoWindow.setFeatures([feature]);
          }
          if (typeof this.map.infoWindow.reposition === 'function') {
            this.map.infoWindow.reposition();
          }
          this.map.infoWindow.show(centerPoint);
        }
      },

      _hideInfoWindow: function() {
        if (this.map && this.map.infoWindow) {
          this.map.infoWindow.hide();
          if (typeof this.map.infoWindow.setFeatures === 'function') {
            this.map.infoWindow.setFeatures([]);
          }
        }
      },

      /* ----------------------------operations-------------------------------- */

      _getFeatureSet: function() {
        var layer = this.currentAttrs.query.resultLayer;
        //get popup info for field alias
        var popupInfos = null;
        var popupInfoObj = this.currentAttrs.config && this.currentAttrs.config.popupInfo;
        if (popupInfoObj) {
          popupInfos = popupInfoObj.fieldInfos;
        }

        var featureSet = new FeatureSet();
        featureSet.fields = lang.clone(layer.fields);
        featureSet.features = [].concat(layer.graphics);
        featureSet.geometryType = layer.geometryType;
        featureSet.fieldAliases = {};
        array.forEach(featureSet.fields, lang.hitch(this, function(fieldInfo) {
          var fieldName = fieldInfo.name;
          var fieldAlias = this._getFieldAliasByPopupInfo(fieldInfo, popupInfos);
          featureSet.fieldAliases[fieldName] = fieldAlias;
        }));
        return featureSet;
      },

      _getFieldAliasByPopupInfo: function(fieldInfo, popupInfos) {
        var fieldName = fieldInfo.name;
        var fieldAlias = fieldInfo.alias || fieldName;
        if (popupInfos && popupInfos.length) {
          var popupInfo = popupInfos.filter(function(ppInfo) {
            return ppInfo.fieldName === fieldName;
          })[0];
          if (popupInfo) {
            fieldAlias = popupInfo.label;
          }
        }
        return fieldAlias;
      },

      _onBtnMenuClicked: function(evt) {
        var position = html.position(evt.target || evt.srcElement);
        var featureSet = this._getFeatureSet();
        var currentAttrs = this.getCurrentAttrs();
        var layer = currentAttrs.query.resultLayer;
        this.featureActionManager.getSupportedActions(featureSet, layer).then(lang.hitch(this, function(actions) {
          array.forEach(actions, lang.hitch(this, function(action) {
            action.data = featureSet;
          }));

          if (!currentAttrs.config.enableExport) {
            var exportActionNames = [
              'ExportToCSV',
              'ExportToFeatureCollection',
              'ExportToGeoJSON',
              'SaveToMyContent'
            ];
            actions = array.filter(actions, lang.hitch(this, function(action) {
              return exportActionNames.indexOf(action.name) < 0;
            }));
          }

          actions = array.filter(actions, lang.hitch(this, function(action) {
            return action.name !== 'CreateLayer';
          }));

          var removeAction = new BaseFeatureAction({
            name: "RemoveQueryResult",
            iconClass: 'icon-close',
            label: this.nls.removeThisResult,
            iconFormat: 'svg',
            map: this.map,
            onExecute: lang.hitch(this, this._removeResult)
          });
          removeAction.name = "RemoveQueryResult";
          removeAction.data = featureSet;
          actions.push(removeAction);

          var relatedRecordAction = this._getRelatedTableAction(featureSet);
          if (relatedRecordAction) {
            actions.push(relatedRecordAction);
          }

          var symbolAction = this._getSymbolAction(featureSet);
          if (symbolAction) {
            actions.push(symbolAction);
          }

          this.popupMenu.setActions(actions);
          this.popupMenu._setFocusedNodeBeforeOpen();
          this.popupMenu.show(position);
        }));
      },

      _onBtnMenuKeydown: function(evt){
        if(evt.keyCode === keys.ENTER || evt.keyCode === keys.SPACE){
          this._onBtnMenuClicked(evt);
        }

      },

      _getObjectIdField: function() {
        return this.currentAttrs.config.objectIdField;
      },

      _getSymbolAction: function(featureSet) {
        var action = null;
        if (this.currentAttrs.query.resultLayer.renderer && this.currentAttrs.config.canModifySymbol) {
          var features = featureSet && featureSet.features;
          action = new BaseFeatureAction({
            name: "ChangeSymbol",
            label: this.nls.changeSymbol,
            data: features,
            iconClass: 'icon-edit-symbol',
            iconFormat: 'svg',
            map: this.map,
            onExecute: lang.hitch(this, this._showSymbolChooser)
          });
        }
        return action;
      },

      _showSymbolChooser: function() {
        var resultLayer = this.currentAttrs.query.resultLayer;
        var renderer = resultLayer.renderer;
        var args = {};
        var symbol = renderer.defaultSymbol || renderer.symbol;
        if (symbol) {
          args.symbol = symbol;
        } else {
          var symbolType = jimuUtils.getSymbolTypeByGeometryType(resultLayer.geometryType);
          args.type = symbolType;
        }
        var symbolChooser = new SymbolChooser(args);
        var popup = new Popup({
          width: 380,
          autoHeight: true,
          titleLabel: this.nls.changeSymbol,
          content: symbolChooser,
          onClose: lang.hitch(this, function() {
            symbolChooser.destroy();
            symbolChooser = null;
            popup = null;
          }),
          buttons: [{
            label: window.jimuNls.common.ok,
            onClick: lang.hitch(this, function() {
              var symbol = symbolChooser.getSymbol();
              this._updateSymbol(symbol);
              popup.close();
            })
          }, {
            label: window.jimuNls.common.cancel,
            onClick: lang.hitch(this, function() {
              popup.close();
            })
          }]
        });
      },

      _updateSymbol: function(symbol) {
        var renderer = new SimpleRenderer(symbol);
        var resultLayer = this.currentAttrs.query.resultLayer;
        resultLayer.setRenderer(renderer);
        resultLayer.redraw();
        var symbolNodes = query(".symbol", this.resultsTable);
        array.forEach(symbolNodes, lang.hitch(this, function(oldSymbolNode) {
          var parent = oldSymbolNode.parentElement;
          html.destroy(oldSymbolNode);
          var newSymbolNode = jimuSymbolUtils.createSymbolNode(symbol, {
            width: 32,
            height: 32
          });
          if (newSymbolNode) {
            html.place(newSymbolNode, parent);
          }
        }));
      },

      _getRelatedTableAction: function(featureSet) {
        var action = null;
        var features = featureSet && featureSet.features;
        var relationships = this._getCurrentRelationships();
        var objectIdField = this._getObjectIdField();
        if (objectIdField && features.length > 0 && relationships && relationships.length > 0 &&
            this._isWebMapShowRelatedRecordsEnabled()) {
          action = new BaseFeatureAction({
            iconClass: 'icon-show-related-record',
            icon: '',
            data: featureSet,
            label: this.nls.showAllRelatedRecords,
            onExecute: lang.hitch(this, function() {
              this._showMultipleRelatedRecords();
              var def = new Deferred();
              def.resolve();
              return def;
            }),
            getIcon: function() {
              return "";
            }
          });
        }
        return action;
      },

      _isWebMapShowRelatedRecordsEnabled: function(){
        //#2887
        var popupInfo = this.currentAttrs.config.popupInfo;
        if(popupInfo.relatedRecordsInfo){
          return popupInfo.relatedRecordsInfo.showRelatedRecords !== false;
        }
        return true;
      },

      _removeResult: function() {
        this.queryWidget.removeSingleQueryResult(this);
        this._hideInfoWindow();
      },

      _getAvailableWidget: function(widgetName) {
        var appConfig = this.queryWidget.appConfig;
        var attributeTableWidget = appConfig.getConfigElementsByName(widgetName)[0];
        if (attributeTableWidget && attributeTableWidget.visible) {
          return attributeTableWidget;
        }
        return null;
      },

      _openAttributeTable: function() {
        var attributeTableWidget = this._getAvailableWidget("AttributeTable");

        if (!attributeTableWidget) {
          return;
        }

        var layerInfosObj = LayerInfos.getInstanceSync();
        var layerId = this.currentAttrs.query.resultLayer.id;
        var layerInfo = layerInfosObj.getLayerInfoById(layerId);
        var widgetManager = this.queryWidget.widgetManager;
        widgetManager.triggerWidgetOpen(attributeTableWidget.id).then(lang.hitch(this, function() {
          this.queryWidget.publishData({
            'target': 'AttributeTable',
            'layer': layerInfo
          });
        }));
      }

    });
  });
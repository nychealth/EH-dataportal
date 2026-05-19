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
  'dojo/_base/lang',
  'dojo/_base/html',
  "dojo/query",
  'dojo/on',
  'dojo/keys',
  'dojo/_base/array',
  'jimu/utils'
],
  function (lang, html, query, on, keys, array, jimuUtils) {
    var mo = {};
    mo.a11y_initGalleryNodesAttrs = function () {
      var galleryNodes = query('.esriBasemapGalleryNode', this.domNode);
      if(galleryNodes.length){
        array.forEach(galleryNodes, function(node) {
          var imgA = query('a', node)[0];
          html.setAttr(imgA, 'tabindex', '-1');

          var imgLabel = query('span', node)[0];
          html.setAttr(node, 'aria-label', imgLabel.innerHTML);
          html.setAttr(node, 'tabindex', '0');
          html.setAttr(node, 'role', 'button');
          on(node, "keydown", lang.hitch(this, function(evt){
            if(evt.keyCode === keys.ENTER){
              imgA.click();
            }
          }));
        });
        jimuUtils.initFirstFocusNode(this.domNode, galleryNodes[0]);
        jimuUtils.initLastFocusNode(this.domNode, galleryNodes[galleryNodes.length - 1]);
        this.openAtStartAysn = true;
        if(jimuUtils.isAutoFocusFirstNodeWidget(this)){
          galleryNodes[0].focus();
        }
      }
    };
    return mo;
  });
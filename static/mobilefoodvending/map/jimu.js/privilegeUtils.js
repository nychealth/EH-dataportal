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
  'dojo/Deferred',
  'esri/IdentityManager',
  'esri/request',
  'jimu/tokenUtils',
  'jimu/portalUrlUtils'
], function(Deferred, IdentityManager, esriRequest, tokenUtils, portalUrlUtils) {

  var mo = {};

  mo.checkEssentialAppsLicense = function(appId, portal, isInBuilder) {
    var portalUrl = portalUrlUtils.getStandardPortalUrl(portal.portalUrl);
    var sharingUrl = portalUrlUtils.getSharingUrl(portalUrl);
    var oauthappid = "arcgisWebApps";

    var retDef = new Deferred();
    var checkAppAccessDef;
    //Determine if app is public or private
    if(isInBuilder) {
      checkAppAccessDef = IdentityManager.checkAppAccess(sharingUrl, oauthappid);
    } else {
      checkAppAccessDef = portal.getItemById(appId).then(function(appItem) {
        if(appItem.access === "public") {
          return {isPublicApp: true};
        } else {
          return IdentityManager.checkAppAccess(sharingUrl, oauthappid);
        }
      });
    }

    checkAppAccessDef.then(function(response) {
      portal.getSigninSettingsOfSelfInfo().then(function(signinSettings) {
        if(signinSettings &&
           signinSettings.blockedApps &&
           signinSettings.blockedApps.indexOf &&
           signinSettings.blockedApps.indexOf('webappbuilder') > -1
        ) {
          retDef.reject({
            message: 'wab is blocked by org admin',
            isBlockedByOrg: true
          });
        } else {
          // Anonymous user's signinSettings is {};
          retDef.resolve(response);
        }
      }, function(err) {
        retDef.reject({
          message: err && err.message,
          isBlockedByOrg: false
        });
      });
    }, function(err) {
      retDef.reject({
        message: err && err.message,
        isBlockedByOrg: false
      });
    });
    return retDef;
  };

  mo.checkIsSelfOrigin = function(appId, portal, isInBuilder) {
    var isSelfOrigin = true;
    var retDef;

    // portal info from address bar
    var portalUrlFromAddressBar = portalUrlUtils.getPortalUrlFromLocation();
    portalUrlFromAddressBar = portalUrlUtils.getStandardPortalUrl(portalUrlFromAddressBar);
    var itemUrl = portalUrlUtils.getItemUrl(portalUrlFromAddressBar, appId);
    var portalHostFromAddressBar = window.location.host;
    var signedIn = tokenUtils.userHaveSignInPortal(portalUrlFromAddressBar);

    var isArcgisOnlineUrl =
      ['www.arcgis.com', 'devext.arcgis.com', 'qaext.arcgis.com'].indexOf(portalHostFromAddressBar) >= 0;

    var isInAnIframe = window.location !== window.parent.location;

    if(portal.isPortal || isInBuilder || isArcgisOnlineUrl || signedIn || isInAnIframe) {
      retDef = new Deferred();
      retDef.resolve(isSelfOrigin);
    } else {
      var args = {
        url: itemUrl,
        handleAs: 'json',
        content: {
          f: 'json'
        },
        callbackParamName: 'callback'
      };

      return esriRequest(args).then(function(appItem) {
        if(appItem.contentOrigin && appItem.contentOrigin !== "self") {
          isSelfOrigin = false;
          return isSelfOrigin;
        } else {
          return isSelfOrigin;
        }
      });
    }

    return retDef;
  };

  return mo;
});

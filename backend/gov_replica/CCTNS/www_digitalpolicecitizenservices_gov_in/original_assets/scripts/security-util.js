/**
 *  Copyright 2011 National Crime Records Bureau. All rights reserved.
 *  
 *   Project Name: CCTNS 
 *   Document   : security-util.js 
 *   Description:  contains functions required for security token, 
 *      appendToken() function should be present in including jsp  
 *   Version Information: 2.0,Azad Achipra, JUl 31, 2013
 *   Modification History:
 *   V2.1, Aug 1, 2013 by Azad - Added function to appendToken to form.
 *   V2.2, Nov 6, 2013 by Vijayakumar - Added function getContextURLPath to changeLocationHref
 *   
 **/

/* function to change the location href after appending the token to the provided url */
function changeLocationHref(url) {
   
    window.location.href =  appendToken(url);
}
function changeLocationHrefMaster(url) {
   
    window.location.assign(appendToken(url));
}
   
function getContextURLPath(){
    var rootUrl = location.protocol;
    rootUrl = rootUrl+"//"+location.host
    var path = location.pathname;
    var tempStr = path.split('/');
    rootUrl = rootUrl+"/"+tempStr[1];
    //alert("Final Root URL=>"+rootUrl);

    return rootUrl;
}
/* function to change the url in the parameter provided for opening an window to append token  */
function openWindow(parameters) {
    parameters.url = appendToken(parameters.url);
    window.open(parameters.url, target=parameters.target);
}
            
/* function to append token to href of 'a' tag in given result element*/
function appendTokenForAjaxResult(resultElementId) {
    var resultElement = document.getElementById(resultElementId);
    var anchorElements = resultElement.getElementsByTagName('a')
    var anchorElementsLen = anchorElements.length;
    for(var i=0; i<anchorElementsLen; i++) {
        var anchorElement = anchorElements[i];
        var ahref = anchorElement.href;
        if(ahref.indexOf(".htm") > -1 ){
            anchorElement.href = appendToken(ahref);
        }
    }    
}

function SecurityUtil(){};

SecurityUtil.appendTokenToIframeSrc = function() {
    $('iframe').each(function(){
        var iframeElement = $(this);
        var iframeParent = iframeElement.parent();
        if(iframeParent != null) {
            var srcInputElement = iframeParent.find("input[id=iframesrcurl]");
            if(srcInputElement != null) {
                var srcFromInput = iframeParent.find("input[id=iframesrcurl]").attr("value");
                iframeElement.attr("src", appendToken(srcFromInput));                
            }
        }
    });     
}

SecurityUtil.appendTokenToForm = function(formElementId, actionUrl) {
    document.getElementById(formElementId).action = appendToken(actionUrl);
//$(formElementId).attr("action", appendToken(actionUrl));
}



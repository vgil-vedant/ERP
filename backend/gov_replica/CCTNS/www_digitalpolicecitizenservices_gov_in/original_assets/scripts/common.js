/**
 *  Copyright 2011 National Crime Records Bureau. All rights reserved.
 *  
 *   Project Name: CCTNS 
 *   Document   : common.js 
 *   Description:  contains common functions 
 *   Version Information: 2.0
 *   Modification History:
 *
 *   
 **/
jQuery(function(){
    /*
     * this swallows backspace keys on any non-input element.
     * stops backspace -> back
     */
    var rx = /INPUT|SELECT|TEXTAREA/i;

    $(document).bind("keydown keypress", function(e){
        if( e.which == 8 ){ // 8 == backspace
            if(!rx.test(e.target.tagName) || $(e.target).is(':checkbox') || $(e.target).is(':radio') || $(e.target).is(':submit') || e.target.disabled || e.target.readOnly ) {
                e.preventDefault();
            }
        }
    });
});

/**
 * To verify offline connectivity
 */
function checkOffline(required, url, logoutUrl){
    if(required) {
        var tsTimeStamp = new Date().getTime();
        javascript:$.fancybox.showActivity();
        $.post("gdEntryofflineConnection.htm",{
            "time":tsTimeStamp
        },
        function(data){
            if(data != null){
                if(data.error==true){
                    fancyAlertFor(document.getElementById("MSG_516").value);
                }else{
                    changeLocationHref(url);
                }
            }else{
                changeLocationHref(logoutUrl);
            }
        });
        return false;            
    } else {
        return true;
    }
}

/**
 * functtion to add token parameter to the given url if not present
 */
function appendTokenWithUrl(url, tokenName, tokenValue) {
    if(url.indexOf(tokenName) > -1) {
        return url;
    }
    if(url.indexOf('?') != -1) {
        url = url + '&' + tokenName + '=' + tokenValue;
    } else {
        url = url + '?' + tokenName + '=' + tokenValue;
    }
    return url;
}

/**
 * To verify offline connectivity
 */
function checkForValidLoginUser(menutitle,url){
   //alert (menutitle +"----"+url)
        var tsTimeStamp = new Date().getTime();
        var mesg= document.getElementById("altMenuAuthMsgWithUseCaseName").value;
        javascript:$.fancybox.showActivity();
        $.post("checkforvaliduser.htm",{
            "time":tsTimeStamp,
            "menutitle":menutitle
        },
        function(data){
            if(data != null){//alert (data.error)
                if(data.error==true){
                    
                    fancyAlertFor(mesg.replace('@usecaseame',"'"+menutitle+"'"));
                    return false;
                }else{
                    changeLocationHref(url);
                }
            }
            return true;
        });
return false;
}


function checkOfflineAndValidUSer(required, url, logoutUrl,menutitle){
 

 javascript:$.fancybox.showActivity();

     
 
    if(required) {
        var tsTimeStamp = new Date().getTime();
       
        $.post("gdEntryofflineConnection.htm",{
            "time":tsTimeStamp
        },
        function(data1){
           if(data1 != null){
                if(data1.error==true){
                   // dataoffline ="true";
                    fancyAlertFor(document.getElementById("MSG_516").value);
               }else{
                    changeLocationHref(url);
                }
            }else{
                changeLocationHref(logoutUrl);
            }
        });
        return false;            
    } else
    {
        var mesg= document.getElementById("altMenuAuthMsgWithUseCaseName").value;
        $.post("checkforvaliduser.htm",{
            "time":tsTimeStamp,
            "menutitle":menutitle
        },
        function(data2){
           
            if(data2 != null){//alert (data.error)
                if(data2.error==true){
                  if (data2.errorOffline == true) {
                   fancyAlertFor(document.getElementById("MSG_516").value);   
                  } else {
                    fancyAlertFor(mesg.replace('@usecaseame',"'"+menutitle+"'"));    
                  }
                  
                }else{
                    changeLocationHref(url);
                }
            }
        });
        return false;    
    }
}
   
function fancyAlertFor(msg) {

    var Content= "<div class='errorh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='error' style='border:1px solid #924949;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #990000; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='errorbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
    jQuery.fancybox({
        'modal' : true,
        'content' : Content,
        onClosed : function() {
        }
    });
    
}

        

/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
function fancyAlert(msg,elementType) {
 
    var Content= "<div class='errorh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='error' style='border:1px solid #924949;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #990000; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='errorbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            try {
            document.getElementById(elementType).focus();
            } catch(e) {
                
            }

        }
    });
}

function fancyWarningWithdisableField(msg,elementType) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='warningbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            
         
   
            
            document.getElementById(elementType).focus();
        }

    });
    
}
function fancyWarning(msg,elementType) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='warningbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            
           
          
            
            document.getElementById(elementType).focus();
        }

    });
    
}


function fancySuccess(msg,elementType) {

    var Content= "<div class='successh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='success' style='border:1px solid #60a174;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #006600; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='successbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {

            document.getElementById(elementType).focus();


        }

    });
    
}

function fancyLoading(msg) {

    var Content= "<div class='successh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='success' style='border:1px solid #60a174;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #006600; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content

    });
    
}

function fancyAlertWithClear(msg,elementType) {
 
    var Content= "<div class='errorh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='error' style='border:1px solid #924949;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #990000; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='errorbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            document.getElementById(elementType).value = "";
            document.getElementById(elementType).focus();

   

        }

    });

}

function fancyWarningOnClose(msg) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button'   class='warningbutton' onclick=\"warningYesOption();\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button'  class='warningbutton' onclick=\"warningNoOption();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ></div></div>";

    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {

         
        }

    });

    
}

function warningYesOption()
{
    jQuery.fancybox.close();
    
    
        changeLocationHref("indexsys.htm");
    
}

function warningNoOption()
{
    jQuery.fancybox.close();
}



function fancyAlertwithSwitchTab(msg,elementType, parentTab, childTab) {
 
    var Content= "<div class='errorh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='error' style='border:1px solid #924949;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #990000; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='errorbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            TabView.switchTab(0, parentTab);
            TabView.switchTab(1, childTab);
            document.getElementById(elementType).focus();
        }

    });

}


function fancyAlertwithSwitchTabWithoutParent(msg,elementType, tab) {
 
    var Content= "<div class='errorh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='error' style='border:1px solid #924949;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #990000; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='errorbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            TabView.switchTab(0, tab);
            document.getElementById(elementType).focus();
        }

    });

}


function fancyClear(msg, formId) {


    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button'   class='warningbutton' onclick=\"warningClearYesOption('"+formId+"');\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button'  class='warningbutton' onclick=\"warningClearNoOption();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ><input type=\"hidden\" id=\"deleteOptionClick\" name=\"deleteOptionClick\" /></div></div>";
  
 
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
        //document.getElementById(elementType).focus();


        }

    });
    
}

function warningClearYesOption(formId)
{ 
    $("#"+formId).find("select option").attr("selected","");
    $("#"+formId).find("select option[value='0']").attr("selected","selected");

    $(':input:not([readonly])',"#"+formId)
    .removeAttr('checked')
    .not(':radio, :button, :submit, :reset, :hidden', ':readonly')
    .val('')
    .removeAttr('selected');
                 
    
    jQuery.fancybox.close();
    return true;
}

function warningClearNoOption()
{
    $("#deleteOptionClick").val("No");
    jQuery.fancybox.close();
}


function fancyClearFirComplaint(msg, formId) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button'   class='warningbutton' onclick=\"warningClearYesOptionFirComplaint('"+formId+"');\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button'  class='warningbutton' onclick=\"warningClearNoOption();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ><input type=\"hidden\" id=\"deleteOptionClick\" name=\"deleteOptionClick\" /></div></div>";
  
 
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
        //document.getElementById(elementType).focus();


        }

    });
    
}

function warningClearYesOptionFirComplaint(formId)
{ 
    $("#"+formId).find("select option").attr("selected","");
    $("#"+formId).find("select option[value='0']").attr("selected","selected");

    $(':input:not([readonly])',"#"+formId)
    .removeAttr('checked')
    .not(':radio, :button, :submit, :reset, :hidden', ':readonly')
    .val('')
    .removeAttr('selected');
    $("#datetimer7").Watermark("DD/MM/YYYY" );
    
    jQuery.fancybox.close();
}


function fancyWarningWithClear(msg,elementType) {
 
    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>" + msg +  "</div><div style='color:#fff; padding:0px!important; width:50px; margin-top:-30px;'><input type='button' style='margin-left:180px'  class='warningbutton' onclick=\"jQuery.fancybox.close();\" value=\""+document.getElementById("alrtbuttOk").value+"\" value='"+document.getElementById("alrtbtnClose").value+"'>" + "</div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,

        onClosed : function() {
            
            
            document.getElementById(elementType).value = "";
            document.getElementById(elementType).focus();

   

        }

    });

}

/**
 * Popup opener for help page
 */
function popituphelp(url) {
    newwindow=window.open(url,'name','height=500,width=400,scrollbars=1');
    if (window.focus) {
        newwindow.focus()
        }
    return false;
}
function f_dialogClose () {

    var n_nesting = a_windows.length - 1;
    // destroy element
    if (a_windows[n_nesting].removeNode)
        a_windows[n_nesting].removeNode(true);
    else if (document.body.removeChild)
        document.body.removeChild(a_windows[n_nesting]);
    a_windows[n_nesting] = null;
    a_windows.length = n_nesting;

    // move the screen
    f_putScreen(n_nesting ? true : false);
}
function fancyWarningOnCloseReports(msg) {
    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button' style='width:45px;'  class='warningbutton' onclick=\"warningYesOption();\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button'  class='warningbutton' style='width:45px;' onclick=\"warningNoOption();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ></div></div>";
   
    jQuery.fancybox({
        'modal' : true,
        'content' : Content,
        onClosed : function() {           
        }
    });
    
}

function warningYesOption()
{
    jQuery.fancybox.close();  
    changeLocationHref("reportonpolicestationbase.htm");
    
}

function warningNoOption()
{
    jQuery.fancybox.close();
}

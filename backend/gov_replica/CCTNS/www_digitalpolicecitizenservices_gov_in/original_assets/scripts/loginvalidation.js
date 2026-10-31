
function validateLogin(language)
{         
    var len = 9; 
    var len1 = 30;
    var val1=$("#IDToken1").val().replace(/^\s+|\s+$/g, '~');
    var val2=$("#IDToken2").val().replace(/^\s+|\s+$/g, '~');
    var bool=false;
    if ( ($("#IDToken1").val().length <= 0 || val1=='~')&& ($("#IDToken2").val().length <= 0 || val2=='~') )
    {
                                            
        fancyAlert(document.getElementById("alertuserpassword").value,'IDToken1');
        bool= false;
       
    }else if($("#IDToken1").val().length <= 0 || val1=='~'){
       
        fancyAlert(document.getElementById("alertusername").value,'IDToken1');
        bool= false;
    }else if($("#IDToken2").val().length <= 0 || val2=='~'){
        fancyAlert(document.getElementById("alertpassword").value,'IDToken2');
        bool= false;
    } else {
        if($("#IDToken1").val().length > len){
            var val3 =  $("#IDToken1").val().substring(0, len);
            $("#IDToken1").val = val3;
        }   
        if($("#IDToken2").val().length > len1){
            var val4 =  $("#IDToken2").val().substring(0, len1);
            $("#IDToken2").val = val4;
        }        
        bool= true;
        
        document.getElementById("button").disabled=true;
        var split = language.split('-');
            javascript:$.fancybox.showActivity();
        var form_url = $("#loginForm").attr("action"); 
        form_url = form_url + "?lang=" + split[0];
        $("#loginForm").attr("action",form_url);
        $("#loginForm").submit();
    //checkUserStatus(language);  
    }
    return bool;
}

function checkUserStatus(language){
    document.getElementById("button").disabled=true;
    var split = language.split('-');
        javascript:$.fancybox.showActivity();
        //timeout:60;
        
        
    $.post("checkUserStatus.htm",{
        "IDToken1":$("#IDToken1").val(),
        "language":split[0]
    },
    function(data){
        var items = data.offlineLoggedIn;
        if(items==true){
            document.getElementById("button").disabled=false;
            fancyAlert('You are already logged in Offline.Please use the existing session or logout from the existing session.', 'IDToken1');
             
            bool=false;
        } 
        else{
            var form_url = $("#loginForm").attr("action"); 
            form_url = form_url + "?lang=" + split[0];
            //var split = language.split('-');
            /**var location =form_url.split("ssologin.htm");
            location=location[0];           
            if(location.indexOf(',') != -1){
                location=location.split(',');
            }
            location=location+'ssologin.htm';
            var locationUrlAndParam = location.split("?");
            var url = locationUrlAndParam[0];
            
            if(locationUrlAndParam[1] != null) {
                var gotoParam = locationUrlAndParam[1];
                var gotoNameAndValue = gotoParam.split("=");
                var gotoName = gotoNameAndValue[0];
                var gotoValue = gotoNameAndValue[1];
                gotoValue = gotoValue + "?lang=" + split[0];
            
                $('<input>').attr({
                    type: 'hidden',
                    id: gotoName,
                    name: gotoName,
                    value:gotoValue
                }).appendTo('#loginForm');
           }**/
            
            
            $("#loginForm").attr("action",form_url);
            $("#loginForm").submit();


            
        }
    }, 30000);
}

function changevalidateForm()
{
    var bool=true;
    if($("#loginPwdOld").val()== ''){          
        //fancyAlert('please enter old password.','loginPwdOld');
        fancyAlert(document.getElementById('enteroldpassword').value,'loginPwdOld');
        bool= false;
    }
    var bool=true;
    if($("#loginPwdNew").val()== ''){          
        //fancyAlert('please enter new password.','loginPwdNew');
        fancyAlert(document.getElementById('enternewpassword').value,'loginPwdNew');
        bool= false;
    }

    else if($("#cpassword").val() == ''){        
        //fancyAlert('please enter confirm password.','cpassword');        
        fancyAlert(document.getElementById('enterconfirmpassword').value,'cpassword');
        bool= false;
    }
    else if($("#loginPwdNew").val()!=$("#cpassword").val()){       
        //fancyAlert('Password and Confirm Password is not same','cpassword');
        fancyAlert(document.getElementById('samepassword').value,'cpassword');
        document.getElementById("loginPwdNew").value="";
        document.getElementById("cpassword").value="";
        bool= false;
    }
    else if($("#loginPwdNew").val() != ''){      
        
        var myString=document.getElementById("loginPwdNew").value;
        var Stringlen = myString.length;
        var ValidateDigits = /[^0-9]/g;
        var ValidateSpChar = /[a-zA-Z0-9]/g;
        var ValidateChar = /[^a-zA-Z]/g;
   
        var digitString = myString.replace(ValidateDigits , "");
        var specialString = myString.replace(ValidateSpChar, "");
        var charString = myString.replace(ValidateChar, "");
        
        if(Stringlen < 8)
        {           
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        }
        if(specialString.length < 1)
        {
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
            
        }
        if(digitString.length < 1)
        {
           // fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
           fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        }
        if(charString.length < 1)
        {
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        } 
   
    }
    
    return bool;
}

function changeResetForm()
{
     var bool=true;
    if($("#loginPwdNew").val()== ''){          
        //fancyAlert('please enter new password.','loginPwdNew');
        fancyAlert(document.getElementById('enternewpassword').value,'loginPwdNew');
        bool= false;
    }

    else if($("#cpassword").val() == ''){        
        //fancyAlert('please enter confirm password.','cpassword');        
        fancyAlert(document.getElementById('enterconfirmpassword').value,'cpassword');
        bool= false;
    }
    else if($("#loginPwdNew").val()!=$("#cpassword").val()){       
        //fancyAlert('Password and Confirm Password is not same','cpassword');
        fancyAlert(document.getElementById('samepassword').value,'cpassword');
        document.getElementById("loginPwdNew").value="";
        document.getElementById("cpassword").value="";
        bool= false;
    }
    else if($("#loginPwdNew").val() != ''){      
        
        var myString=document.getElementById("loginPwdNew").value;
        var Stringlen = myString.length;
        var ValidateDigits = /[^0-9]/g;
        var ValidateSpChar = /[a-zA-Z0-9]/g;
        var ValidateChar = /[^a-zA-Z]/g;
   
        var digitString = myString.replace(ValidateDigits , "");
        var specialString = myString.replace(ValidateSpChar, "");
        var charString = myString.replace(ValidateChar, "");
        
        if(Stringlen < 8)
        {           
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        }
        if(specialString.length < 1)
        {
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
            
        }
        if(digitString.length < 1)
        {
           // fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
           fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        }
        if(charString.length < 1)
        {
            //fancyAlert('Password should contain minimum 8 & maximum 30 characters including atleast a special character,number and an alphabet','loginPwdNew');
            fancyAlert(document.getElementById('passwordvalidation').value,'loginPwdNew');
            document.getElementById("loginPwdNew").value="";
            document.getElementById("cpassword").value="";
            bool= false;
        } 
   
    }
    
    return bool;
}

function passwordfirstvalid(){
    var bool=true;    
    if($("#loginPwdOld").val()== ''){          
        //fancyAlert('please enter old password.','loginPwdOld');
        fancyAlert(document.getElementById('enteroldpassword').value,'loginPwdOld');
        bool= false;
    }
   else if($("#pass1").val()== ''){   
        
        //fancyAlert('please enter new password.','pass1');
        fancyAlert(document.getElementById('enternewpassword').value,'pass1');
        bool= false;
    }

    else if($("#cpassword").val() == ''){        
        //fancyAlert('please enter confirm password.','cpassword');  
        fancyAlert(document.getElementById('enterconfirmpassword').value,'cpassword');
        
        bool= false;
    }
    else if($("#pass1").val()!=$("#cpassword").val()){       
        //fancyAlert('Password and Confirm Password is not same','cpassword');
        fancyAlert(document.getElementById('samepassword').value,'cpassword');
        document.getElementById("pass1").value="";
        document.getElementById("cpassword").value="";
        //document.getElementById("cpassword").focus();
        bool= false;
    }
    else if($("#pass1").val() != ''){      
        
        var myString=document.getElementById("pass1").value;
        var Stringlen = myString.length;
        var ValidateDigits = /[^0-9]/g;
        var ValidateSpChar = /[a-zA-Z0-9]/g;
        var ValidateChar = /[^a-zA-Z]/g;
   
        var digitString = myString.replace(ValidateDigits , "");
        var specialString = myString.replace(ValidateSpChar, "");
        var charString = myString.replace(ValidateChar, "");
        
        if(Stringlen < 8)
        {           
            //fancyAlert('minimum 8 characters & maximum 30 characters should have at least 1 special character, 1 number and 1 alphabet','pass1');
            fancyAlert(document.getElementById('passwordvalidation').value,'pass1');
            document.getElementById("pass1").value="";
            document.getElementById("cpassword").value="";
            
            bool= false;
        }
        if(specialString.length < 1)
        {
            //fancyAlert('minimum 8 characters & maximum 30 characters should have at least 1 special character, 1 number and 1 alphabet','pass1');
            fancyAlert(document.getElementById('passwordvalidation').value,'pass1');
            document.getElementById("pass1").value="";
            document.getElementById("cpassword").value="";
            
            bool= false;
            
        }
        if(digitString.length < 1)
        {
            //fancyAlert('minimum 8 characters & maximum 30 characters should have at least 1 special character, 1 number and 1 alphabet','pass1');
            fancyAlert(document.getElementById('passwordvalidation').value,'pass1');
            document.getElementById("pass1").value="";
            document.getElementById("cpassword").value="";
            
            bool= false;
        }
        if(charString.length < 1)
        {
            //fancyAlert('minimum 8 characters & maximum 30 characters should have at least 1 special character, 1 number and 1 alphabet','pass1');
            fancyAlert(document.getElementById('passwordvalidation').value,'pass1');
            document.getElementById("pass1").value="";
            document.getElementById("cpassword").value="";
            
            bool= false;
        }  
         
    }
    if(document.getElementById("securityques1").value=="0")
    {
        //fancyAlert('Please select security question1.','securityques1');
        fancyAlert(document.getElementById('entersecurityquestion1').value,'securityques1');
        
        bool= false;
    }
    
    
    
    if($('#securityAnswer1Id2').is(':visible')){
        if(document.getElementById("securityanswer111").value=="")
        {
            //fancyAlert('Please enter security answer1.','securityanswer111');
            fancyAlert(document.getElementById('entersecurityanswer1').value,'securityanswer111');
           
            bool= false;
        }
    }
    if($('#securityAnswer1Id1').is(':visible')){
        if(document.getElementById("securityAnswer1").value==""||document.getElementById("securityAnswer1").value=='DD/MM/YYYY')
        {
            //fancyAlert('Please enter security answer1.','securityAnswer1');
            fancyAlert(document.getElementById('entersecurityanswer1').value,'securityAnswer1');
           
            bool= false;
        }
    }
    if(document.getElementById("securityques2").value=="0")
    {
        //fancyAlert('Please select security question2.','securityques2');
        fancyAlert(document.getElementById('entersecurityquestion2').value,'securityques2');
        
        bool= false;
    }
    if($('#securityAnswer2Id2').is(':visible')){
        if(document.getElementById("securityanswer222").value=="")
        {
            //fancyAlert('Please enter security answer2.','securityanswer222');
            fancyAlert(document.getElementById('entersecurityanswer2').value,'securityanswer222');
            
            bool= false;
        }
    }
    if($('#securityAnswer2Id1').is(':visible')){
        if(document.getElementById("securityAnswer2").value=="" ||document.getElementById("securityAnswer2").value=='DD/MM/YYYY')
        {
            //fancyAlert('Please enter security answer2.','securityAnswer2');
            fancyAlert(document.getElementById('entersecurityanswer2').value,'securityAnswer2');
            
            bool= false;
        }
    }
    
    if(document.getElementById("securityques1").value==document.getElementById("securityques2").value)
    {
        //fancyAlert('Please select different question.','securityques2');
        //fancyAlert('Security Questions should not be same','securityques2');
        fancyAlert(document.getElementById('notsamesecurityquestion').value,'securityques2');
        
        bool= false;
    }
    
    return bool;
}
    
   



function forgotPasswordValidateForm()
{
    var bool=true;
    if(document.getElementById("loginId").value=="")
    {
        fancyAlert('Please enter UserName.','loginId');
       
        bool=false;
    }    
    if($('#securityAnswer1Id2').is(':visible')){
        if(document.getElementById("securityanswera").value=="")
        {
            fancyAlert('Please enter security answer1.','securityanswera');
            
            bool= false;
        }
    }
    if($('#securityAnswer1Id1').is(':visible')){
    
    
        if(document.getElementById("securityAnswer1").value=="")
        {
            fancyAlert('Please enter security answer1.','securityAnswer1');
            
            bool= false;
        }
        
    }
    if($('#securityAnswer2Id2').is(':visible')){
        if(document.getElementById("securityanswerb").value=="")
        {
            fancyAlert('Please enter security answer2.','securityanswerb');
            
            bool= false;
        }
    }
    if($('#securityAnswer2Id1').is(':visible')){ 
  
        if(document.getElementById("securityAnswer2").value=="")
        {
            fancyAlert('Please enter security answer2.','securityAnswer2');
            
            bool= false;
        }
        
    }
    return bool;
}

    
function getSecurityQuestions(username)
{
    $.post("getsecurityquestions.htm",{"username":username,"rand":Math.random()},
        function(data){
            
          var items = data.rows;
        $("#securityques1").val('');
        $("#securityques2").val('');
           
            $.each(items, function(key, val) {
                
                if(val[0]==4){
                    
                    $('#securityAnswer1Id1').show();  
                    $('#securityAnswer1Id2').hide(); 
                }
                else
                {
                    $('#securityAnswer1Id1').hide();  
                    $('#securityAnswer1Id2').show();
                }
                if(val[1]==4)
                {
                    $('#securityAnswer2Id1').show();  
                    $('#securityAnswer2Id2').hide(); 
                }else
                {
                    $('#securityAnswer2Id1').hide();  
                    $('#securityAnswer2Id2').show();
                }
                
                $("#securityques1").val(val[2]);
                $("#securityques2").val(val[3]);
                $("#securityQuestion1Cd").val(val[0]);
                $("#securityQuestion2Cd").val(val[1]);
            });
        });
}
function CommentsMinLength(a,MINLENGTH,id)
{
    //text.value = text.value.substring(0,maxLength);
    var length=a.value.length;

    if (length<MINLENGTH)

    {
        a.value=a.value.substring(0,MINLENGTH);
        
        fancyWarningAdmin('Minimum of'+" "+MINLENGTH+" "+'characters',id);
        //     fancyAlertAdmin("Minimum of "+MINLENGTH+" chars!",id);
        document.getElementById(id).value="";
        document.getElementById(id).focus();
        return false;
    }

    else return true;

}
function validateDOBDateWithCurrentDateLogin(id,field)
{
    
    var value = '';                                          
    if (field.length > 0) 
    {   
        var dd = field.substring(0,2) 
        var mm = field.substring(3,5) 
        var yyyy = field.substring(6,10) 
        var dt=new Date(yyyy,mm-1,dd) 
        var now=new Date() 
        var diff=(dt - now) 
        if(diff>0) 
        { 
           
            document.getElementById(id).value='DD/MM/YYYY';
            
            fancyAlertAdmin('Date should not be greater than current date.',id);
            //fancyAlertAdmin('Date should not be greater than current date.','dateadmin1');
            document.getElementById(id).focus();
            return false; 
        } 
                                
                                
    }   
    var dob = document.getElementById(id).value;
    var dt1  = parseInt(dob.substring(0,2),10);
    var mon1 = parseInt(dob.substring(3,5),10);
    var yr1  = parseInt(dob.substring(6,10),10);    
    var date1 = new Date(yr1, mon1-1, dt1);
    var now=new Date();
    
    
    
    var joinDt = now.getFullYear();
    var years = Math.floor((now.getTime() - date1.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    var dateaftsixty = date1.getFullYear()+65;
    
    
    if(years < 18)
    {
        
        //javascript:$.modaldialog.warning("Joining date should be atleast 18 year more than date of birth ");
        document.getElementById(id).value='DD/MM/YYYY';
        
        fancyAlertAdmin('Age should be greater than 18 years',id);
        //fancyAlertAdmin('Joining date should be atleast 18 year more than date of birth','dateadmin1');
        //$("#dateadmin2").Watermark("DD/MM/YYYY");
        document.getElementById(id).focus();
        return false;
    }
   
    if(joinDt > dateaftsixty){
        document.getElementById(id).value='DD/MM/YYYY';  
        
        fancyAlertAdmin('Age should be less than 65 years',id);
        //fancyAlertAdmin('Joining date should be less than 65 year','dateadmin1');
        //$("#dateadmin2").Watermark("DD/MM/YYYY");
        document.getElementById(id).focus();        
        return false;
    }
}


function fancyWarningOnCloseForgotPassword(msg) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button'  style='width:45px;' class='warningbutton' onclick=\"warningYesOptionForgotPassword();\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button' style='width:45px;'  class='warningbutton' onclick=\"warningNoOptionForgotPassword();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ></div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,
        onStart : function(){
            diasbledElements=$("select:disabled,input:disabled");
            $(':input:not([readonly])').not(':radio').attr('disabled','disabled');
        },
        onComplete :  function() {
            $("#fancyAlertOk").focus();
        },
        onCleanup :function() {
            $(':input:not([readonly])').not(':radio').attr('disabled',false);
        },

        onClosed : function() {

           
        }

    });
    
}

function warningYesOptionForgotPassword()
{
   
    
    $.fancybox.close();
    parent.$.fancybox.close();
    
}

function warningNoOptionForgotPassword()
{
    jQuery.fancybox.close();
}


function fancyWarningOnCloseLogin(msg) {

    var Content= "<div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'><div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600; font-size:12px; font-weight:bold;'><br/>"+ msg +"</div><div style='color:#fff;padding:0px 0px 0px 175px!important; width:100px; margin-top:-30px;'> <input type='button' style='width:45px;'  class='warningbutton' onclick=\"warningYesOptionLogin();\" value=\""+document.getElementById("alrtbtnYes").value+"\" > <input type='button' style='width:45px;' class='warningbutton' onclick=\"warningNoOptionLogin();\" value=\""+document.getElementById("alrtbtnNo").value+"\" ></div></div>";
   
    jQuery.fancybox({

        'modal' : true,

        'content' : Content,
        onStart : function(){
            diasbledElements=$("select:disabled,input:disabled");
            $(':input:not([readonly])').not(':radio').attr('disabled','disabled');
        },
        onComplete :  function() {
            $("#fancyAlertOk").focus();
        },
        onCleanup :function() {
            $(':input:not([readonly])').not(':radio').attr('disabled',false);
        },

        onClosed : function() {

           
        }

    });
    
}

function warningYesOptionLogin()
{
    
    jQuery.fancybox.close();
    
    changeLocationHref("logout.htm");
}

function warningNoOptionLogin()
{
    jQuery.fancybox.close();
}
    
function alreadyLoggedInPopUp(isSessionAlreadyExist, message, loggoutButton) {
        if(isSessionAlreadyExist) {
            var content= "\
                <div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'>\n\
                <div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600;font-size:12px; font-weight:bold;'>\n\
                    <br/>"+ message +"<br/>\n\
                </div>\n\
                <div style='color:#fff;padding:0px 0px 0px 150px!important; width:250px;margin-top:-30px;'>\n\
                    <input type='button' id='fancyAlertSessionYes' class='warningbutton' onclick=\"invalidateSessions();\" value=\""+ loggoutButton +"\" >\n\
                    <input type='button' id='fancyAlertSessionNo' class='warningbutton' onclick=\"warningNoOptionLogin();\" value=\"Cancel\" >\n\
                </div>\n\
            </div>";
            jQuery.fancybox({
                'modal' : true,
                'content' : content
            });
        }    
}

function checkUserOfflineLoginStatus(offlineStatus) {
	if(offlineStatus == 'y') {
		var message = 'You are already logged in Offline. Please use the existing session or logout from the existing session.';
		var content= "\
            <div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'>\n\
            <div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600;font-size:12px; font-weight:bold;'>\n\
                <br/>"+ message +"<br/>\n\
            </div>\n\
            <div style='color:#fff;padding:0px 0px 0px 180px!important; width:50px;margin-top:-30px;'>\n\
                <input type='button' id='fancyAlertSessionNo' class='warningbutton' onclick=\"alreadyLoggedInPopUpNoOption();\" value=\"OK\" >\n\
            </div>\n\
        </div>";
        jQuery.fancybox({
            'modal' : true,
            'content' : content
        });
	}
	
}

function invalidateSessions() {
    location.href="invalidateexistingsession.htm";
}

function alreadyLoggedInPopUpNoOption()
{
    jQuery.fancybox.close();
    location.href="logout.htm";
}

function offlineCompatability(isCompatable, msg){
    if(isCompatable){
        var content= "\
                <div class='warningh' style='display: block; height:140px; width: 400px; left: 420.5px; top: 130px;'>\n\
                <div  class='warning' style='border:1px solid #957C17;height:135px;text-align:center;font-family:Arial, Helvetica, sans-serif;color: #CC6600;font-size:12px; font-weight:bold;'>\n\
                    <br/>"+ msg +"<br/>\n\
                </div>\n\
                <div style='color:#fff;padding:0px 0px 0px 150px!important; width:250px;margin-top:-30px;'>\n\
                    <input type='button' id='fancyAlertOk' class='warningbutton' onclick=\"alreadyLoggedInPopUpNoOption();\" value=\" OK \" >\
                </div>\n\
            </div>";
            jQuery.fancybox({
                'modal' : true,
                'content' : content
            });
    }
}



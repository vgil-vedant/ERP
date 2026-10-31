$( document ).ready(function() {
	$("#captcha_code").attr("style", "display:none");
});

$('#fpassword').bind('copy paste', function (e) {
e.preventDefault();
         });

function showState(str)
{
	if(str=='1')
	{
		$('#show_state').removeClass('d-none');
		$('#generatepass').addClass('d-none');
	}
	else if(str=='2')
	{
		$('#show_state').addClass('d-none');
		$('#generatepass').addClass('d-none');
	}
	else if(str=='3')
	{
		$('#show_state').addClass('d-none');
		$('#generatepass').removeClass('d-none');
	}
}
function genpassword()
{
	$("#fjocode").val('');
	$("#fverifyotp").val('');
	$("#pin").val('');
	$("#conf_pin").val('');
	$('#genpassModal').modal('show');
}
function sendOTP()
{
	$('#verify_otp').hide();
	//alert(validateSendOTP())
	if(validateSendOTP())
	{
		
		var fjocode = $("#fjocode").val();
		
		var url="login/sendOTP/";	
		var postdata = "fjocode="+ fjocode ;			
		
		//alert(url +'\n' + postdata);
		function callbackEST(obj)
		{	
			if(obj.status)
				$('#verify_otp').show();
		}
		ajaxCall({url:url,postdata:postdata,callback:callbackEST});
	
		//e.preventDefault();  //prevent form from submitting

	}
	
}
function checkuserData(formtype='P',appl_type){
	/*var state = $("#selState").val();
	if(state == "")
	{
		alert("Please select state");
		return false;
	}
	
	var userType = $("#selUser").val();

	if(userType == "")
	{
		alert("Please select user");
		return false;
	}
	
	var postdata = "sel_state="+ state+'&userType='+userType;
	var url="login/setUserLogInfo/";	
	ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
	function callbackEST(obj){
		*/
		//alert('aaaa'+formtype);return false;
		/*if(formtype == 'P'){
			window.location.replace("http://10.192.100.62/ecourts2.0/parichay.php");
		}else {*/
			window.location.replace("https://ecourts.gov.in/ecourts2.0/janparichay.php?appl_type="+appl_type);
				
			
		//}
	//}
}
function verifyOTP()
{
	//$('#change_pass_div').hide();
	//alert(validateSendOTP())
		var fjocode = $("#fjocode").val();
		var fverifyotp1 = $("#fverifyotp").val();
		var temp_gennum=$('#gennum').val();
		var fverifyotp =sha256_digest(sha256_digest(fverifyotp1)+sha256_digest(temp_gennum));
		var url="login/verify_otp/";	
		var postdata = "fverifyotp="+fverifyotp+'&temp_gennum='+temp_gennum+'&fjocode='+fjocode ;			
		
		//alert(url +'\n' + postdata);
		function callbackEST(obj)
		{	
			//if(obj.status)
				
			if(obj.status1==1)
			{
				//alert('bbbbb')
				$('#change_pass_div').show();
				//requestUri('home');
			}
		}
		ajaxCall({url:url,postdata:postdata,callback:callbackEST});
	
		//e.preventDefault();  //prevent form from submitting

		
}
function submit_data()
{
	$('#genpassModal').modal('hide');
	$('#change_pass_div').hide();
	$('#verify_otp').hide();
	//alert(validateSendOTP())
	if(validatePin())
	{
	
		var fjocode = $("#fjocode").val();
		//var new_password =sha256_digest( $("#new_password").val());
		//var confirm_password =sha256_digest( $("#confirm_password").val());
		var pin = $("#pin").val();
		var conf_pin = $("#conf_pin").val();
		var fverifyotp1 = $("#fverifyotp").val();
		var temp_gennum=$('#gennum').val();
		var fverifyotp =sha256_digest(sha256_digest(fverifyotp1)+sha256_digest(temp_gennum));
		var url="login/submit/";	
		var postdata = "fverifyotp="+fverifyotp+'&temp_gennum='+temp_gennum+'&fjocode='+fjocode+'&pin='+pin+'&conf_pin='+conf_pin  ;			
		
		//alert(url +'\n' + postdata);
		if(pin !=conf_pin)
		{
			errorAlert('new pin and confirm pin should be same');
			return false;
		}

		function callbackEST(obj)
		{	
			
			if(obj.status==1)
			{
				$("#fjocode").val('');
				 $("#fverifyotp").val('');
				 $("#pin").val('');
				 $("#conf_pin").val('');
				 //$('#password_frm').trigger("reset");
				 
				
			}
		}
		ajaxCall({url:url,postdata:postdata,callback:callbackEST});
	}
	
}
function validatePin()
{
    $("#password_frm").validate();
    pattern();
   
    $('#pin').rules('add', {
    	required:true,
		number : true,
        maxlength: 6,
		minlength: 6,
        messages: {
        required: 'PIN is required',
		number: 'PIN should be Numeric Value',
        maxlength: 'PIN is required maximum 6 characters',
		minlength: 'PIN is required maximum 6 characters',
        
        }
    });
	 $('#conf_pin').rules('add', {
    	required:true,
		number : true,
        maxlength: 6,
		minlength: 6,
        messages: {
        required: 'PIN is required',
			number: 'PIN should be Numeric Value',
        maxlength: 'PIN is required maximum 6 characters',
		minlength: 'PIN is required maximum 6 characters',
        
        }
    });
    
        
    if(!$('#pin').valid())
        $('.error').first().focus();
    return $('#pin').valid();
	  if(!$('#conf_pin').valid())
        $('.error').first().focus();
    return $('#conf_pin').valid();
}

function validateSendOTP()
{
    $("#password_frm").validate();
    pattern();
   
    $('#fjocode').rules('add', {
    	required:true,
        maxlength: 7,
        messages: {
        required: 'Jo Code is required',
        maxlength: 'Jo Code is required maximum 254 characters',
        
        }
    });
    
        
    if(!$('#fjocode').valid())
        $('.error').first().focus();
    return $('#fjocode').valid();
}

function login(logout_flg)
{
	$("#validateError").modal("hide");
	$("#validateError").removeClass("show");
	$("#validateError").removeClass("fade");
	$("#validateError").addClass("hide");
	//alert(validate());
	if(validate())
	{
		var temp_gennum=$('#gennum').val();
		var fpassword = $("#fpassword").val();
		var fuser = $("#fuser").val();
	
		var fuser_type ="2";
		var fhighcort ="";
		
	
		var fcaptcha_code = $("#fcaptcha_code").val();
		var fpassword =sha256_digest(sha256_digest(fpassword)+sha256_digest(temp_gennum));

		var url="login/verify_login/";	
		var postdata = "fuser="+ fuser +"&fpassword="+fpassword+'&temp_gennum='+temp_gennum+'&logout_flg='+logout_flg+"&fcaptcha_code="+fcaptcha_code;			
		
		//alert(url +'\n' + postdata);
		function callbackEST(obj)
		{		
			
			if(obj.status1==1)
			{
				//alert('bbbbb')
				requestUri('home');
			}
			else if(obj.status1 == 0)
			{
				$('#div_captcha').html(obj.div_captcha);
                $('#captcha_code').hide();
			}	
		}
		ajaxCall({url:url,postdata:postdata,callback:callbackEST,loader:false});
	
		//e.preventDefault();  //prevent form from submitting

	}
}
function validate()
{
    $("#frm_login").validate();
    pattern();
   
    
    $('#fuser').rules('add', {
    	required:true,
        maxlength: 254,
        //emailchar:true,
        messages: {
        required: 'User name is required',
        maxlength: 'User name is required maximum 254 characters',
        //emailchar: 'Invalid Email address',
        }
    });
    $('#fpassword').rules('add', {
    	required:true,
        maxlength: 255,
       // password: true,
        messages: {
        required: 'Password is required',
        maxlength: 'Password is required maximum 255 characters',
        password: 'Password Must be at least 6 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*',
        }
    });
	/* $('#new_password').rules('add', {
    	required:true,
        maxlength: 255,
       // password: true,
        messages: {
        required: 'New Password is required',
        maxlength: 'New Password is required maximum 255 characters',
       // password: 'Password Must be at least 6 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*',
        }
    });
	 $('confirm_password').rules('add', {
    	required:true,
        maxlength: 255,
       // password: true,
        messages: {
        required: 'Confirm Password is required',
        maxlength: 'Confirm Password is required maximum 255 characters',
       // password: 'Password Must be at least 6 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*',
        }
    });
	 $('#pin').rules('add', {
    	required:true,
        maxlength: 6,
       // password: true,
        messages: {
        required: 'Pin is required',
        maxlength: 'Pin is required maximum 6 characters',
       // password: 'Password Must be at least 6 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*',
        }
    });*/
	if($("#high_rad").is(':checked'))
		{
			 $('#fhighcourt_id').rules('add', {
				required:true,
				messages: {
				required: 'Please Select Highcourt'
				
			   // password: 'Password Must be at least 6 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*',
				}
			});
		}
     /*$('#captcha_code').rules('add', {
    	required:true,
        maxlength: 6,
       
        messages: {
        required: 'Captcha is required',
        maxlength: 'Captcha is required maximum 6 characters',
        
        }
    });*/
        
    //if(!$('#frm_login').valid())
        //$('.error').first().focus();
    return $('#frm_login').valid();
}



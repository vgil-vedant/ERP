$(document).ready(function () {

		document.title ='Process Details - eCourt India Services';
		$('#fcaptcha_code').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z0-9 ]/g, ''));
  });
	$('#fprocess_id').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z0-9_ ]/g, ''));
  });
});

function authendicateData(pid)
{


	//alert(pid);
	var url="processDetails/authendicateData";
	var postdata ="processid="+pid;
			
		ajaxCall({url:url,postdata:postdata,callback:callbackParty,connection:'N'});
		function callbackParty(obj)
		{  
		
			if(obj.status == 1)
			{ 	
					$("#resemail").show();
					$("#resmobile").show(); 
					$("#otpdiv").show();
					$("#resemail").html("Email : "+obj.recv_email);
					$("#resmobile").html("Mobile : "+obj.maskedMobile);
			}	

		}
}
let countdownInterval;
function sendOtp(){

	$("#div_otp").show();
	$("#gotp").hide();
	$("#proc_msg").hide();
	$("#user_otp").val('');
	
	var usermobno = encodeURIComponent($('#user_mobile').val());
	var user_email = encodeURIComponent($('#user_email').val());
	 var user_name = encodeURIComponent($('#user_name').val());
	 
	//var processid = encodeURIComponent($('#hdn_process_id').val());

	var processid = $('#hdn_process_id').val();
	var hdn_addressee_type = ($('#hdn_addressee_type').val());


	var url = "processDetails/sendotp";

	var postdata ="mobile="+usermobno+"&user_email="+user_email+"&processid="+processid+"&user_name="+user_name; //processid="+pid+"&
//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callbackParty,connection:'N'});
	function callbackParty(result)
	{  
		
		
		if(result.status == 1)
		{ 	
			//alert(result.sent);
				 if (result.sent == "Y")
			{
                $('#send_otp_msg').show();
                $('#send_otp_msg').html(result.otp_msg);
                $('#sent_message').val(result.sent_message);

				$("#inputbox").hide();
                $("#otpbox").show();
                $("#waitmsg").html("Please enter the verification code sent via Email <br>Do not refresh or close this window.");


                $("#verifyotp").attr("disabled", false);
                $("#sendOtp").attr("disabled", true);

                $("#resendbtn").attr("disabled", true);
                startOtpTimer(20); // Start 2-minute timer
            } else {
                $("#sendOtp").attr("disabled", true);
		    alert("There is something Wrong");
            }
		}	

	}
//alert("OTP sent successfully!");
      
      // Re-enable the button if needed
     
}


function verify_otp()
{
	var usermobno = $('#user_mobile').val();
	var user_email = $('#user_email').val();
	var user_otp = btoa($('#user_otp').val());
	var hdn_process_id = $('#hdn_process_id').val();
	var hdn_addressee_type = ($('#hdn_addressee_type').val());
	//alert(hdn_process_id);
//	if(validateOtp())
	{
		var postdata="process_id="+hdn_process_id+"&user_otp="+user_otp+"&addressee_type="+hdn_addressee_type;
		//alert(postdata);

		var url = "processDetails/verify_otp";

		ajaxCall({url:url,postdata:postdata,callback:callbackParty,connection:'N'});
		function callbackParty(result)
		{  
			//alert(44444444444);
			//alert(result.status+'aaaaaa');
			if(result.status == 1)
			{ 	
				
				//if (result.sent == "Y")
				{
					/*$('#send_otp_msg').show();
					$('#send_otp_msg').html(result.otp_msg);
					$('#sent_message').val(result.sent_message);

				 
					$("#waitmsg").html("Please enter the 6-digit code sent via SMS <br>Do not refresh or close this window.");


					$("#verifyotp").attr("disabled", false);
					$("#sendOtp").attr("disabled", true);

					$("#resendbtn").attr("disabled", true);
					startOtpTimer(120); // Start 2-minute timer*/

					if(window.matchMedia("(max-width: 767px)").matches)
					{
							//window.location.replace("https://services.ecourts.gov.in/ecourtindia_v6/"+result.order);
							window.open("https://services.ecourts.gov.in/ecourtindia_v6/" + result.order, '_blank');

					}else
					{ 
						 $('#user_otp').val('');
						 $("#p_order").val(result.order);

							file_name="<object data='"+result.order+"' height='100%' width='100%' style='min-height:600px;'></object>";
							//alert(file_name);
							$("#modal_order_body").show().html(file_name);
							var myModal = new bootstrap.Modal($('#modalOders'), {
							backdrop: "static", //remove ability to close modal with click
							keyboard: false, //remove option to close with keyboard
							show: true //Display loader!
					});
					}
					myModal.toggle();

            } /*else {
                $("#sendOtp").attr("disabled", true);
            }*/
		}
		else if(result.status==2)
		{
			//alert(111111111111111
			$("#gotp").show();
			$("#proc_msg").show();
			$("#div_otp_modal").hide();
			
		}

	}
	}


}

function closefile()
{
	var order = $("#p_order").val();
	var url   = "processDetails/closefile";

	var postdata = "filename="+order;

	ajaxCall({url:url,postdata:postdata,callback:callbackParty,connection:'N'});
	function callbackParty(result)
	{  
		
		/*alert(result.status);
		if(result.status == 1)
		{ 	

		}*/
		refreshCaptcha();
	}


}
function resetProcessID() {

    $('#fprocess_id').val('');
    
}
function validateOtp()
{
	//alert(1);
	$("#frmprocess").validate();
    pattern();
   
   
	 $('#user_otp').rules('add', {
		required:true,	
		digits: true,
		minlength: 6,
        messages: {
		 required : 'Please Enter OTP',
		 digits: "Please enter only numbers",
		minlength: "OTP must be 6 digits"
        }
    });
   
  
    if(!$('#frmprocess').valid())
        $('.error').first().focus();
    return $('#frmprocess').valid();


}

//PORTAL LOGIN FUNCTION=====================================

$(function () { //shorthand document.ready function
	$('#user_password,#user_pwd').on('copy paste cut', function (e) {
		e.preventDefault();
		//alert('Copy-paste is disabled for security.');
	});

	show_hide_login_user();
	//$('select').chosen({width:"100%"});


	//AUDIT ISSUE===============================================================

	//restrict symbol and special character=====================
	$('#user_name').on('keypress', function (evt) {
		var charCode = evt.which || evt.keyCode;
		var charStr = String.fromCharCode(charCode);

		// Allow: letters, numbers, @, -, /, .
		if (!charStr.match(/^[a-zA-Z0-9@_\/.\-]+$/)) {
			evt.preventDefault();
		}
	});

	$('#user_name').on('input', function () {
		// Replace anything not allowed
		this.value = this.value.replace(/[^a-zA-Z0-9@_\/.\-]/g, '');
	});
	$('#fcaptcha_code_mobile, #fcaptcha_code_mobile2').on('keypress', function (evt) {
		var charCode = evt.which || evt.keyCode;
		var charStr = String.fromCharCode(charCode);

		// Allow: letters, numbers, @, -, /, .
		if (!charStr.match(/[a-zA-Z0-9]/)) {
			evt.preventDefault();
		}
	});

	$('#fcaptcha_code_mobile, #fcaptcha_code_mobile2').on('input', function () {
		// Replace anything not allowed
		this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
	});

	//AUDIT ISSUE ADDED===============================================================

	$('#frm_login').on('submit', function (e) {

		var radioUser = $("input[name='rdoUser']:checked").val();
		var user_name = $("#user_name").val();

		var rdoLang = $("input[name='rdoLang']:checked").val();

		//alert(radioUser + $("#frm_login").valid());
		if ($("#frm_login").valid() == true) {
			var state = $("#selState").val();
			if (state == "") {
				alert("Please select state");
				return false;
			}

			var user_password = $("#user_password").val();
			if (user_password == "") {
				alert("Please enter password");
				return false;
			}
			var fcaptcha_code = $('#fcaptcha_code_mobile').val();
			var temp_gennum = $('#gennum').val();
			var user_password = sha256_digest(sha256_digest(user_password) + sha256_digest(temp_gennum));


			var user_state = $("#selState").val();
			var user_pin = $("#user_password").val();

			var url = "login/verify_login/";
			var postdata = "user_state=" + user_state + "&user_password=" + user_password + "&user_name=" + user_name + "&user_type=" + radioUser + '&user_lang=' + rdoLang +
				'&temp_gennum=' + temp_gennum + "&fcaptcha_code=" + fcaptcha_code;

			//alert(url +'\n' + postdata);
			function callbackEST(obj) {
				//alert(obj.errorMsg + '\n' + obj.errormsg + '\n' + obj.status);

				if (obj.status == true && typeof obj.redirect_path !== "undefined") {
					window.location.href = obj.redirect_path;
					$('#fcaptcha_code_mobile').val('');
				} else {
					$('#gennum').val(obj.gennum);
					//alert(obj.errorMsg);
					$(".alert-danger4").show();
					$("#msg-danger4").html(obj.errorMsg);
					$("#msg-danger4").attr("aria-label", obj.errorMsg.replace(/(<([^>]+)>)/ig, ''));
					if (obj.duplicate_login == 0) {
						$('#user_name, #user_password').val('');
					}
					//Regenerate CAPCHA===========================================================================
					if ($('#captcha_image').length >= 1) {
						if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh();
						document.getElementById('captcha_image').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
					}
					if (obj.captcha != '' && obj.duplicate_login == 0) {
						$('#div_captcha_mobile').html(obj.captcha);
						$('#div_captcha_mobile1').html(obj.captcha);
						$('#div_captcha_mobile2').html(obj.captcha);
						$('.captchaClass').val('');
						$('#fcaptcha_code_mobile').val('');
					}
					$('#fcaptcha_code_mobile').val('');

				}

			}

			ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });

			e.preventDefault();  //prevent form from submitting
		}
	});



	$('#frm_duplicate_login').on('submit', function (e) {
		if ($('#frm_duplicate_login').valid()) {
			var user_password = $("#user_pwd").val();
			var temp_gennum = $('#gennum').val();
			var user_password = sha256_digest(sha256_digest(user_password) + sha256_digest(temp_gennum));
			var fcaptcha_code = $('#fcaptcha_code_mobile1').val();

			var url = "login/verify_duplicate_login/";
			var postdata = "duplicate_user=1" + "&user_password=" + user_password +
				'&temp_gennum=' + temp_gennum + "&fcaptcha_code=" + fcaptcha_code;

			function callbackEST(obj) {
				if (obj.status == true && typeof obj.redirect_path !== "undefined") {
					window.location.href = obj.redirect_path;
				} else {
					$(".alert-danger5").show();
					$("#msg-danger5").html(obj.errorMsg);

					if (obj.captcha != '' && obj.duplicate_login == 0) {
						//$('#div_captcha_mobile').html(obj.captcha);		
						$('#div_captcha_mobile1').html(obj.captcha);
						//$('#div_captcha_mobile2').html(obj.captcha);	
						$('.captchaClass').val('');
						$('#fcaptcha_code_mobile1').val('');
					}
				}
			}
			ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
			e.preventDefault();  //prevent form from submitting
		}
	});

	$("#alert_invalid_pin").on('hide.bs.modal', function () {
		//alert('The modal is about to be hidden.');

		if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh(); document.getElementById('captcha_image').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
		$('#fcaptcha_code_mobile').val('');

	});

	window.addEventListener("load", function () {

		const carouselEl = document.querySelector('#carouselExampleIndicators');
		const toggleBtn = document.querySelector('#carouselToggle');
		const icon = document.querySelector('#carouselIcon');
		const text = document.querySelector('#carouselText');

		const carousel = bootstrap.Carousel.getInstance(carouselEl);

		let paused = false;

		toggleBtn.addEventListener('click', function () {

			if (!paused) {

				carousel.pause();

				icon.className = "fas fa-play";
				text.textContent = "Play automatic slideshow";

			} else {

				carousel.cycle();

				icon.className = "fas fa-pause";
				text.textContent = "Pause automatic slideshow";

			}

			paused = !paused;

		});

	});


});


/*---- restrict paste functionality -----*/
/*
$(document).ready(function(){
  $('#user_password').bind("cut copy paste",function(e) {
	e.preventDefault();
  });
});
*/
/*-----------------------------------------*/


/*function calculate_age(dp_id, age_id) {
	//alert(dp_id);
	var fpet_dob = $('#' + dp_id).val();
	if (fpet_dob) {
		var bdate = fpet_dob.split("-");
		var bday = bdate[0];
		var bmonth = bdate[1];
		var byear = bdate[2];

		var my_age = get_age(new Date(byear, bmonth, bday));

		$('#' + age_id).val(my_age);
	}
}*/
$('#fextra_age, #fextra_age1').on('input', function () {
    const id = $(this).attr('id');
    if (id === 'fextra_age') $('#fpet_dob').val('');
    if (id === 'fextra_age1') $('#fpet_dob1').val('');
});

$('#fpet_dob').datepicker({
    dateFormat: 'dd-mm-yy',
    changeMonth: true,
    changeYear: true,
    yearRange: "1900:2100",

    onSelect: function (dateText) {
        calculate_age('fpet_dob', 'fextra_age');
    }
});
$('#fpet_dob1').datepicker({
    dateFormat: 'dd-mm-yy',
    changeMonth: true,
    changeYear: true,
    yearRange: "1900:2100",

    onSelect: function (dateText) {
        calculate_age('fpet_dob1', 'fextra_age1');
    }
});

function calculate_age(dp_id, age_id) {
	//alert('login');
		//console.log('macp');

    var val = $('#' + dp_id).val();

    if (!val || val.length !== 10) return;

    var parts = val.split('-');

    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    var today = new Date();
    var age = today.getFullYear() - year;

    if (
        (today.getMonth() + 1 < month) ||
        (today.getMonth() + 1 === month && today.getDate() < day)
    ) {
        age--;
    }

    $('#' + age_id).val(age);
}

function checkuserData(formtype='P'){
	//alert(formtype + ' => ' +  formtype);
	var state = $("#selState").val();
	if(state == "")
	{
		alert("Please select state");
		return false;
	}
	
	var userType =  $("input[name='rdoUser']:checked").val();

	if(userType == "")
	{
		alert("Please select user");
		return false;
	}
	//alert('  userType =>' +  userType);
	var postdata = "sel_state="+ state+'&userType='+userType;
	var url="login/setUserLogInfo/";	
	ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
	function callbackEST(obj){
		if(formtype == 'P'){
			window.location.replace("https://filing.ecourts.gov.in/pdedev/parichay.php");
		}else {
			window.location.replace("https://filing.ecourts.gov.in/pdedev/janparichay.php");
		}	
	}
}

function show_hide_login_user() {
	var radioUser = $("input[name='rdoUser']:checked").val();
	//alert(radioUser);

	if (radioUser == '1' || radioUser == '3') { //Show advocate login options
		$('#user_name, #user_password').val('');
		$('#user_name').attr('placeholder', 'Bar Code/Email/Mobile/Unique Code');

		/*
		$('.gr_advocate_user').show();
		$('.gr_user_mobile').hide();
		$('.clsGeneratePin').show();
		*/
	}
	else if (radioUser == '2' || radioUser == '4') { //Show normal user login options
		$('#user_name, #user_password').val('');
		$('#user_name').attr('placeholder', 'Email/Mobile/Unique Code');
		/*
		$('.gr_advocate_user').hide();
		$('.gr_user_mobile').show();
		$('.clsGeneratePin').show();
		*/
	}
	
	//Hide for  'Institutional Litigant' AND 'Court Nominated Officials' 
	if (radioUser == '6' || radioUser == '7') {
		$('.csVidhiParichay').hide();
	}else{
		var sel_state = $('#selState').val();
		if(sel_state == 1){
			$('.csVidhiParichay').show();
		}
	}
	

	$('#msg-danger4').html('');
	$('.alert-danger4').hide();
}

function show_hide_lang_efiling4(state_id = '') {
	if (state_id) {
		var sel_state = state_id;
	} else {
		var sel_state = $('#selState').val();
	}


	if (sel_state && sel_state >= 1) {

		if (sel_state == 1) {
			$('#dvInstLitigant').show();			
		} else {
			$('#dvInstLitigant').hide();
		}

		var postdata = "sel_state=" + sel_state;
		var url = "login/get_language_option/";

		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
		function callbackEST(obj) {
			//alert('status: ' + obj.status + '\n' + obj.bilingual + '\n' + obj.state_lang);
			if (obj.status) {
				if (obj.bilingual == 'Y') {
					$('#dvBilingual').show();
					$('#sp_lang_id2').html(obj.state_lang);
				}
				else {
					$('#dvBilingual').hide();
					$('#sp_lang_id2').html('');
				}
			}
			if (obj.efiling4 == 'Y') {
				sessionStorage.setItem("currunt_state_id", obj.state);
				
			}
		}
	}
	else {
		$('#dvBilingual').hide();
		$('#sp_lang_id2').html('');
	}
}


function show_hide_user_type(){	
	var sel_state = $('#selState2').val();
	stateArr = macp_state;
	var isstateArr = stateArr.includes(sel_state);
	
	if (sel_state && sel_state == 1) {
		$('#spGovAuthority').show();
	}else{
		$('#spGovAuthority').hide();
	}	
}

function show_hide_lang() {
	var sel_state = $('#selState').val();
	stateArr = macp_state;
	var isstateArr = stateArr.includes(sel_state);
	
	 if (sel_state == 1) {
		$('.csVidhiParichay').show(); 
	}else{
		$('.csVidhiParichay').hide();
	}

	if (sel_state == 4) {
	//	alert('You have selected Kerala. You are being redirected to the Kerala e-Filing portal.');
        //	window.location.href = 'https://filing.keralacourts.in/';
    	}	

	if (sel_state && sel_state == 1) {
		$('#dvGovAuthority').show();
	}else{
		$('#dvGovAuthority').hide();
	}

	if (sel_state && sel_state >= 1) {
		if (isstateArr == true) {
			$('#dvInstLitigant').show();
		} else {
			$('#dvInstLitigant').hide();
		}

		const stateData = [
			{ "state_code": 1, "state_lang": "मराठी", "bilingual": "Y" },
			{ "state_code": 3, "state_lang": "Kannada", "bilingual": "N" },
			{ "state_code": 10, "state_lang": "Tamil", "bilingual": "N" },
			{ "state_code": 13, "state_lang": "Hindi", "bilingual": "Y" },
			{ "state_code": 15, "state_lang": "Hindi", "bilingual": "Y" },
			{ "state_code": 23, "state_lang": "Hindi", "bilingual": "Y" }
		];
		stateData.forEach(state => {
			//console.log('State Code: ${state.state_code}, Language: ${state.state_lang}');
			//alert(state.state_code +'=='+ sel_state);
			if (state.state_code == sel_state) {

				if (state.bilingual == 'Y') {
					$('#dvBilingual').show();
					$('#sp_lang_id2').html(state.state_lang);
				} else {
					$('#dvBilingual').hide();
					$('#sp_lang_id2').html('');
				}
			}

		});

		/*
		var postdata = "sel_state="+ sel_state;
		var url="login/get_language_option/";	

		ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
		function callbackEST(obj){
				  //alert('status: ' + obj.status + '\n' + obj.bilingual + '\n' + obj.state_lang);
				  if(obj.status){
					if(obj.bilingual == 'Y'){
							$('#dvBilingual').show();
							$('#sp_lang_id2').html(obj.state_lang);
						}
					else{
							$('#dvBilingual').hide();
							$('#sp_lang_id2').html('');
					}
				  }
				  
				  //FOR MOVE TO EFILING4 FROM EFILING3 =======================
				 // if(obj.efiling4 == 'Y'){
				//	sessionStorage.setItem("currunt_state_id", obj.state);
				
				//  }
				  
		}
		*/
	}
	else {
		$('#dvBilingual').hide();
		$('#sp_lang_id2').html('');
	}
}

function generate_adv_otp() {
	return false;
	if ($("#frm_login").valid() == true) {
		var adv_state_code = $("#adv_state_code").val();
		var adv_bar_code = $("#adv_bar_code").val();
		var adv_bar_code_year = $("#adv_bar_code_year").val();
		var selState = $("#selState").val();

		if (!selState) {
			alert('Please select state');
			return false;
		}

		if (!adv_state_code) {
			alert('Please enter advocate state code');
			return false;
		}

		if (!adv_bar_code) {
			alert('Please enter advocate bar code');
			return false;
		}

		if (!adv_bar_code_year) {
			alert('Please enter year');
			return false;
		}

		if (adv_state_code && adv_bar_code && adv_bar_code_year) {
			var postdata = "adv_state_code=" + adv_state_code + "&adv_bar_code=" + adv_bar_code + "&adv_bar_code_year=" + adv_bar_code_year + "&selState=" + selState;
			var url = "login/generate_adv_login_otp/";
			//alert(postdata + '\n' + url);
			ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
			function callbackEST(obj) {
				//alert('status: ' + obj.status + '\n' + obj.msg);
				if (obj.status == "success") {
					$(".alert-success").show();
					$("#msg-success").html(obj.msg);
				} else {
					$("alert-danger").show();
					$("#msg-danger").html(obj.msg);
				}
			}

		} else {
			alert('Please enter bar code');
			return false;
		}
	}
}
$('#txtMobile').prop('disabled', false);
$(document).ready(function () {
	// When the mobile number field is being typed into
	$('#txtEmail').prop('disabled', false);


	$('#txtMobile').on('input', function () {
		if ($(this).val() != '') {
			// If mobile number is filled, disable the email field
			$('#txtEmail').prop('disabled', true);
		} else {
			// If mobile number is cleared, enable the email field
			$('#txtEmail').prop('disabled', false);
		}
	});

	// When the email field is being typed into
	$('#txtEmail').on('input', function () {
		if ($(this).val() != '') {
			// If email is filled, disable the mobile number field
			$('#txtMobile').prop('disabled', true);
		} else {
			// If email is cleared, enable the mobile number field
			$('#txtMobile').prop('disabled', false);
		}
	});
});

//Validation for Forgot password form==================
$("#frmRegenerate").validate({

	errorPlacement: function (error, element) {
		if ($("#selState2_chosen").length) {
			error.insertAfter("#selState2_chosen");
		} else {
			error.insertAfter(element);
		}
	},
	ignore: "",
	rules: {
		selState2: {
			required: true
		},
		fcaptcha_code_mobile2: {
			required: function () {
				return ($("#hidden_otp1").val() == 'Y');
			}

		},
		txtMobile: {
			require_from_group: [1, ".user_mobile_email"],
			digits: true,
			minlength: 10
		},
		txtEmail: {
			require_from_group: [1, ".user_mobile_email"],
			maxlength: 50,
			email: true
		}
	},
	messages: {
		selState2: {
			required: "Please select state"
		},

		fcaptcha_code_mobile2: {
			required: "Enter captcha"
		},
		txtMobile: {
			require_from_group: "Please enter a valid registered mobile number.",
			digits: "Please enter 10 digit mobile number",
			minlength: "Please enter 10 digit mobile number"
		},
		txtEmail: {
			require_from_group: "Please enter a valid email address.",
			email: "Please enter valid email id",
			maxlength: "Only 50 Characters are allowed"
		}
	}
});
//=================================

//Validation for duplicate login form==================
$("#frm_duplicate_login").validate({
	errorPlacement: function (error, element) {
		if (element.attr("name") == "selState")
			error.insertAfter("#selState_chosen");
		else
			error.insertAfter(element);
	},
	ignore: "",
	rules: {
		user_pwd: {
			required: true
		},
		fcaptcha_code_mobile1: {
			required: function () {
				return ($("#hidden_otp").val() == 'Y');
			}

		}
	},
	messages: {
		user_pwd: {
			required: "Enter user password"
		},
		fcaptcha_code_mobile1: {
			required: "Enter captcha"
		}
	}
});
//=================================
$.validator.addMethod(
	"strongPassword",
	function (value, element) {
		return this.optional(element) ||
			/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]).{6,}$/.test(value);
	},
	"Password must be at least 6 characters long and contain an uppercase letter, a number, and a special character"
);

$.validator.addMethod(
	"validUsername",
	function (value, element) {

		// Email pattern
		var emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

		// Mobile number (India – 10 digits, starts 6-9)
		var mobilePattern = /^[6-9]\d{9}$/;

		// Barcode / Unique code (alphanumeric, 6–40 chars)
		var codePattern = /^[A-Za-z0-9_/-]{6,40}$/;

		return this.optional(element) ||
			emailPattern.test(value) ||
			mobilePattern.test(value) ||
			codePattern.test(value);
	},
	"Enter a valid Email, Mobile number, or Unique Code"
);

$.validator.addMethod("usernameCheck", function (value, element) {
	return this.optional(element) || /^[A-Za-z0-9@._\-\/]+$/.test(value);
}, "Username must contain only letters, numbers, or @");
//Validation for login form==================
$("#frm_login").validate({
	highlight: function (element, errorClass, validClass) {
        if ($(element).attr("name") == "selState") {
            $("#selState_chosen").removeClass(errorClass); // remove red highlight
        } else {
            $(element).addClass(errorClass).removeClass(validClass);
        }
    },

    unhighlight: function (element, errorClass, validClass) {
        if ($(element).attr("name") == "selState") {
            $("#selState_chosen").removeClass(errorClass);
        } else {
            $(element).removeClass(errorClass).addClass(validClass);
        }
    },
	ignore: "",
	rules: {
		selState: {
			required: true
		},
		user_name: {
			required: true,
			usernameCheck: true,
			validUsername: true

		},
		user_password: {
			required: true,
			minlength: 6,
			strongPassword: true
		},
		fcaptcha_code_mobile: {
			required: function () {
				return ($("#hidden_otp").val() == 'Y');
			}

		}
	},

	groups: {
		adv_state1: "adv_state_code adv_bar_code adv_bar_code_year"
	},
	messages: {
		selState: { required: "Please Select state" },
		user_name: {
			required: "Enter user name",
			usernameCheck: "Invalid Username",
			validUsername: "Enter valid Email / Mobile / Unique Code"
		},
		user_password: {
			required: "Enter user password",
			minlength: "Password must be at least 6 characters long",
			strongPassword: "Password must contain 1 uppercase letter, 1 number, and 1 special character"
		},
		fcaptcha_code_mobile: {
			required: "Enter captcha"
		}
	}
});
//=================================

//=================

var interval = "";
//--------------------------------OnClickOTP------------------------------------------------------//
function OnClickOTP(buttonId, div_id = '') {
	//alert('OnClickOTP :');
	var seconds = 120;
	interval = setInterval(function () {
		var minutes = Math.round((seconds - 30) / 60);
		remainingSeconds = seconds % 60;
		if (remainingSeconds < 10) {
			remainingSeconds = "0" + remainingSeconds;
		}
		$('#' + div_id).show();

		if (div_id == 'div_countdown2')
			var div = 'countdown2';
		else
			var div = 'countdown1';

		document.getElementById(div).innerHTML = minutes + ":" + remainingSeconds;
		if (seconds === 0) {
			if (div_id == 'div_countdown2')
				var div = 'div_otp2';
			else
				var div = 'div_otp1';


			document.getElementById(div).style.display = 'none';
			clearInterval(interval);
			$("#button_mobile").prop('disabled', false);
			$("#button_mobileR").prop('disabled', false);
			if (div_id == 'div_countdown2')
				$("#div_otp2").show();
			else
				$("#div_otp1").show();
			if (buttonId == "button_mobileR") {
				$("#button_mobile").show();
				$("#button_mobileR").hide();
			}
			else {
				$("#button_mobileR").show();
				$("#button_mobile").hide();
			}
		}

		seconds -= 1;
		//do whatever here..
	}, 1000);

	//alert(div_id);
	if (div_id == 'div_countdown2') {
		var state_code = $("#selState2").val();
		generate_otp('mobile', state_code);
	}
	else {
		var state_code = $("#selState1").val();
		generate_otp('umobile', state_code);
	}
}


function verify_otp_grass() {
	var otp = $("#user_otp1").val();
	if (otp == "") {
		alert("Please send OTP and enter OTP you requested..!");
		return false;
	}
}



function verify_pin() {
	var url = "login/verify_otp/";

	var uname = $("#uname").val();
	var uemail = $("#uemail").val();
	var umobile = $("#umobile").val();
	var user_pin = $("#user_otp1").val();

	if (user_pin == "") {
		$('#alert_invalid_pin').modal('show');
		return false;
	}

	var postdata = "uname=" + uname + "&uemail=" + uemail + "&umobile=" + umobile + "&user_pin=" + user_pin;


	function callbackEST(obj) {
		if (obj.status1 == true) {
			//alert(uname + " Successfully Registred" + "\n\n" + "Use your mobile number and newly generated pin as password for login");	
			$(".alert-success").show();
			$("#createACModal").modal('toggle');
			//$('#frm_register').trigger("reset");
			$("#div_footer_btn2").show();
			$("#msg-danger2").html("");
			$("#alert-danger2").hide();
			clearInterval(interval);
			document.getElementById('div_otp1').style.display = 'none';
			$("#msg-success").html(" Successfully Registred" + "<br>" + "Use your mobile number and newly generated pin as password for login");
			//location.reload();
		} else {
			alert('Invalid pin');
		}
	}
	ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
}
//NEW USER REGISTRATION FORM END HERE=====================================


//PIN GENERATION FORM=====================================
function regenerate_pin() {
	if ($("#frmRegenerate").valid() == true) {
		var mobile = $("#mobile").val();
		var postdata = "umobile=" + mobile;

		if (mobile == '') {
			alert("Enter Mobile No");
			return false;
		}
		else if (mobile.length != 10) {
			alert("Enter 10 digit Mobile No");
			$("#mobile").val("");
			return false;
		}
		else if (!mobile.match(/^\d+$/)) {
			alert("Enter only digits in Mobile No");
			$("#mobile").val("");
			return false;
		}

		var url = "login/verify_mobile/";

		function callbackEST(obj) {

			if (obj.status2 == true) {
				$("#div_footer_btn2").hide();
				OnClickOTP('', 'div_countdown2');
				$("#div_footer_btn1").hide();
			} else {
				$(".alert-danger3").show(); $("#msg-danger3").html(obj.errormsg1);
			}
		}
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
	}
}

function verify_regenerated_pin() {
	var url = "login/verify_otp/";

	var umobile = $("#mobile").val();
	var user_pin = $("#user_otp2").val();

	if ($("#frmRegenerate").valid() == true) {
		var postdata = "umobile=" + umobile + "&user_pin=" + user_pin;


		function callbackEST(obj) {
			//alert('status: ' + obj.status1);
			if (obj.status1 == true) {
				//alert(uname + " Successfully Registred" + "\n\n" + "Use your mobile number and newly generated pin as password for login");	
				$(".alert-success").show();

				$("#countdown2").html("");
				$("#user_otp2").html("");
				$("#mobile").val("");
				$("#div_footer_btn1").show();
				clearInterval(interval);
				document.getElementById('div_otp2').style.display = 'none';

				$("#regPINModal").modal('toggle');
				$("#msg-success").html(" Successfully Registred" + "<br>" + "Use your mobile number and newly generated pin as password for login");
				//location.reload();
			} else {
				$(".alert-danger1").show(); $("#msg-danger1").html("Invalid Pin");
			}
		}
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
	}
}


function generate_otp(mobile_var, state_code) {

	var mobile = document.getElementById(mobile_var).value;

	var dbval2 = '';
	if (state_code == "") {
		alert("Select State");
	}
	else if (mobile == '') {
		alert("Enter Mobile No");
		//document.getElementById("mobile").focus();
	}
	else if (mobile.length != 10) {
		alert("Enter 10 digit Mobile No");
		document.getElementById("mobile").value = '';
		//document.getElementById("mobile").focus();
	}
	else if (!mobile.match(/^\d+$/)) {
		alert("Enter only digits in Mobile No");
		document.getElementById("mobile").value = '';
		//document.getElementById("mobile").focus();
	}
	else {
		dataString = 'mobile=' + mobile + '&state_code=' + state_code;
		var base_url = $('#base_url').val();


		function callbackOtp(result) {
			if (mobile_var == 'umobile') {
				document.getElementById('user_otp1').value = "";
				document.getElementById('div_otp1').style.display = '';
				if (result.status == "success") {
					$(".alert-success5").show();
					$("#msg-success5").html(result.msg);
				} else {
					$("alert-danger5").show();
					$("#msg-danger5").html(result.msg);
				}
			} else {
				document.getElementById('user_otp2').value = "";
				document.getElementById('div_otp2').style.display = '';
				if (result.status == "success") {
					$(".alert-success3").show();
					$("#msg-success3").html(result.msg);
				} else {
					$("alert-danger3").show();
					$("#msg-danger3").html(result.msg);
				}
			}
		}
		ajaxCall({ url: 'login/generate_otp', postdata: dataString, callback: callbackOtp, connection: 'N' });
	}
}

function reset_form(frm) {
	var validator = $("#" + frm).validate();
	validator.resetForm();
	$(".alert-danger3").hide();
	$(".alert-success3").hide();
	$(".alert-danger4").hide();

	$(".alert-danger5").hide();
	$(".alert-success5").hide();

	// Clear message text
	$("#msg-danger4").html("");

	if (frm == 'frmRegenerate') {
		$("#div_footer_btn1").show();
		$("#div_otp2").hide();
	}
	clearInterval(interval);

	$("#" + frm)[0].reset();

	$('#user_password').attr('type', 'password');
	$('#chkShowPassword').prop('checked', false);

	$('#login-form-status-message').text('');
	setTimeout(function () {
		$('#login-form-status-message').text('Login form has been reset');
	}, 100);
}


$(document).ready(function () {
	//ALLOW ONLY NUMBERS IN CASE NUMBER AND YEAR TEXTBOX
	$('#adv_bar_code, #adv_bar_code_year, #user_pin, #user_mobile, #txtMobile, #user_otp2 ').keypress(function (e) {
		var charCode = e.which || e.keyCode;

		// Allow only digits 0–9
		if (charCode < 48 || charCode > 57) {
			e.preventDefault();
		}
	});

	$('#adv_bar_code, #adv_bar_code_year, #user_pin, #user_mobile, #txtMobile, #user_otp2 ').on('paste', function (e) {
		// Delay needed to allow paste to complete before cleaning
		let el = this;
		setTimeout(function () {
			el.value = el.value.replace(/[^0-9]/g, '');
		}, 0);
	});


	$('#user_password').on('contextmenu', function (e) {
		e.preventDefault();
	});
	$('#user_pwd').on('contextmenu', function (e) {
		e.preventDefault();
	});
});



$("#txtEmail").keyup(function () {
	var get_email = $("#txtEmail").val();
	$("#val_txtEmail").val(get_email);
});

$('#txtEmail').on('keypress', function (e) {

	var char = String.fromCharCode(e.which);
	var value = $(this).val();
	var newValue = value + char;

	// Allow only valid characters
	if (!/[A-Za-z0-9@._-]/.test(char)) {
		e.preventDefault();
		return;
	}

	// Only one @ allowed
	if (char === '@' && value.indexOf('@') !== -1) {
		e.preventDefault();
		return;
	}

	// Prevent dot at start
	if (char === '.' && value.length === 0) {
		e.preventDefault();
		return;
	}

	// Prevent consecutive dots
	if (char === '.' && value.slice(-1) === '.') {
		e.preventDefault();
		return;
	}

	// Prevent dot immediately after @
	if (char === '.' && value.slice(-1) === '@') {
		e.preventDefault();
		return;
	}

	// 🚫 Prevent multiple dots in domain part
	var afterAt = newValue.split('@')[1];
	if (afterAt && (afterAt.match(/\./g) || []).length > 1) {
		e.preventDefault();
		return;
	}

	// 🚫 Stop typing if extension already complete (like .com)
	if (/\.(com|in|org|net|edu)$/i.test(value)) {
		e.preventDefault();
		return;
	}
});



$('#regForPassModal').on('hidden.bs.modal', function () {
	//document.getElementById('captcha_image').src = '/pdedev/securimage/securimage_show.php?' + Math.random(); 
})

$('#alert_invalid_pin').on('hidden.bs.modal', function () {
	//document.getElementById('captcha_image').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
})

//FORGOT PASSWORD FUNCTIONALITY=====================================
function open_fp_form() {
	    triggerElement = document.activeElement;
	//document.getElementById('captcha_image2').src = '/pdedev/securimage/securimage_show.php?' + Math.random(); 

	if ($('#captcha_image2').length >= 1) {
		if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh();
		document.getElementById('captcha_image2').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
	}
	$('#fcaptcha_code_mobile2').val('');
	$('#selState2').val('');
	$('#selState2').trigger("chosen:updated");
	$('#txtMobile, #txtEmail, #user_otp2').val('');
	$('#div_otp2, #div_footer_btn4').hide();
	$('#div_footer_btn3').show();
	$('label.error').remove();
	$("#regForPassModal").modal('show');


}

function open_logout_form() {
	/*
	if($('#captcha_image').length>=1){
		setTimeout(function() {if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh(); document.getElementById('captcha_image').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
		}, 1000);
	}
	*/

	if ($('#captcha_image1').length >= 1) {
		if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh(); document.getElementById('captcha_image1').src = '/pdedev/securimage/securimage_show.php?' + Math.random();

	}

	var postdata = '';
	var url = "login/duplicate_logout_data/";
	ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
	function callbackEST(obj) {
		//alert(obj.status  +  '\n' + obj.errormsg);
		if (!obj.errormsg) {
			if (obj.status == true) {
				$('#lbl_user_state').html(obj.state_name);
				$('#lbl_user_type').html(obj.user_type);
				$('#lbl_user_name').html(obj.username);
				$("#alert_invalid_pin").modal('toggle');
			}
		}

		//Regenerate CAPCHA===========================================================================
		if ($('#captcha_image2').length >= 1) {
			if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh();
			document.getElementById('captcha_image2').src = '/pdedev/securimage/securimage_show.php?' + Math.random();

		}
	}


}

function disableButtonFor10Sec(buttonId) {
	var btn = $("#" + buttonId);
	var seconds = 15;

	btn.prop("disabled", true);
	btn.text("Resend OTP in " + seconds + "s");

	// Start countdown
	var interval = setInterval(function () {
		seconds--;
		btn.text("Resend OTP in " + seconds + "s");

		if (seconds <= 0) {
			clearInterval(interval);
			btn.prop("disabled", false);
			btn.text("Resend OTP");
		}
	}, 1000); // runs every 1 second
}
/*$(document).ready(function () {

	// start la button disabled
	$("#btn_send_otp").prop("disabled", true);

	function checkFields() {
		var state = $("#selState2").val();
		var mobile = $("#txtMobile").val().trim();
		var email = $("#txtEmail").val().trim();

		if (state !== "" && (mobile !== "" || email !== "")) {
			$("#btn_send_otp").prop("disabled", false);
		} else {
			$("#btn_send_otp").prop("disabled", true);
		}
	}

	// events
	$("#selState2, #txtMobile, #txtEmail").on("change keyup", function () {
		checkFields();
	});

});*/
function send_forgot_pass_otp() {
	var url = "login/generateForgotPassOTP/";
	if ($("#frmRegenerate").valid()) {
		// now disable button

		var postdata = $("#frmRegenerate").serialize();
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
		function callbackEST(obj) {
			console.log(obj)
			disableButtonFor10Sec("re_btn_send_otp");
			if (!obj.errormsg) {
				if (obj.status == true) {
					$('#div_otp2').show();
					$('#div_footer_btn3').hide();
					$('#div_footer_btn4').show();
					$('#fcaptcha_code_mobile2').val('');
				}
			}


			$.session.set('attempts_mbl_cnt', obj.attempts_mbl_ch);
			if (obj.flag_val == 1) {
				//$("#regForPassModal").modal('toggle');
			} else {
				errorAlert(obj.msg1);
				if (obj.attempts_mbl_ch >= 5 || $.session.get('attempts_mbl_cnt') >= 5) {
					dis_mbl_otp();
				}
			}
			//Regenerate CAPCHA===========================================================================
			if ($('#captcha_image2').length >= 1) {
				if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh();
				// alert(1);
				document.getElementById('captcha_image2').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
			}
		}
	}
}

//===== disable send OTP button of mobile
function dis_mbl_otp() {
	var tm_limit = 2 * 60 * 1000;  //2 min
	if ($.session.get('attempts_mbl_cnt') >= 5) {
		$("#user_otp2").prop('disabled', true);
		$("#verify_button").prop('disabled', true);
		$("#re_btn_send_otp").prop('disabled', true);
		setTimeout(function () {
			$("#user_otp2").prop('disabled', false);
			$("#verify_button").prop('disabled', false);
			$("#re_btn_send_otp").prop('disabled', false);
			$.session.set('attempts_mbl_cnt', 0);

			var url = 'login/counter_set';
			var postdata = 'email_flag=0&mbl_flag=1';
			ajaxCall({ url: url, postdata: postdata, callback: call_back1, connection: 'N', chosen: false });
			function call_back1() { }

		}, tm_limit);
	}
}
// Initiate counter
let mobile_otp_counter = 0;
function verify_regenerated_otp() {
	if ($('#frmRegenerate').valid()) {
		var user_otp = $("#user_otp2").val();
		if (!user_otp || user_otp == '') {
			alert('Please enter OTP');
			return false;
		}
		mobile_otp_counter += 1;
		var fcaptcha_code = $('#fcaptcha_code_mobile2').val();
		var url = "login/verify_fp_otp/";
		var postdata = $("#frmRegenerate").serialize();

		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N' });
		function callbackEST(obj) {
			$.session.set('attempts_mbl_cnt', obj.attempts_mbl_ch);
			if (obj.flag_val == 1) {
				$("#regForPassModal").modal('toggle');
			} else {
				errorAlert(obj.msg1);
				$('#fcaptcha_code_mobile2').val('');
				if (obj.attempts_mbl_ch >= 5 || $.session.get('attempts_mbl_cnt') >= 5) {
					dis_mbl_otp();
				}
			}

			//Regenerate CAPCHA===========================================================================
			if ($('#captcha_image2').length >= 1) {
				if (typeof window.captcha_image_audioObj !== 'undefined') captcha_image_audioObj.refresh();
				document.getElementById('captcha_image2').src = '/pdedev/securimage/securimage_show.php?' + Math.random();
			}
		}
	}
}

function myFunction(id) {
	var x = document.getElementById(id);
	if (x.type === "password") {
		x.type = "text";
	} else {
		x.type = "password";
	}
}

$('#regForPassModal').on('keydown', function(e) {
    if (e.key === 'Tab') {
        var focusable = $('#regForPassModal')
            .find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
            .filter(':visible');
        var first = focusable.first()[0];
        var last  = focusable.last()[0];
        if (e.shiftKey) {
            // SHIFT + TAB
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // TAB
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
});  
//FORGOT PASSWORD FUNCTIONALITY END HERE=====================================

const anchorLinks = ['#services', '#contact'];

anchorLinks.forEach(hash => {
  const link = document.querySelector(`a[href$="${hash}"]`);
  const target = document.getElementById(hash.slice(1));

  if (link && target) {
    link.addEventListener('click', () => {
      setTimeout(() => target.focus({ preventScroll: true }), 500);
    });
  }
});

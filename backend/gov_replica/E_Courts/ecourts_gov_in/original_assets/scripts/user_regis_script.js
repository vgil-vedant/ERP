$(document).ready(function () {
	$("#mobno_edit").hide();
	$("#mob_no").removeAttr("disabled");
	$("#adv_name").removeAttr("disabled");
	$('.chosen').chosen();
	$("#div_adv_court").hide();

	$("#div_org_nm").hide();
	$("#div_lit_org").hide();

	$("#adv_verify").val('N');

	$("#advo_mobile").val('');
	$("#advo_email").val('');

	$("#val_email").val('');
	$("#val_mobile").val('');

	$("#resetRegForm").on('click', resetRegForm);


	$("#rdo_user_adv, #rdo_user_lit, #rdo_user_clerk").on('change', resetRegForm);




	$('#mob_no').on('input', function () {
		const isComplete = $(this).val().length === 10;
		$('#get_otp').prop('disabled', !isComplete);
	});
	$('#txt_otp').on('input', function () {
		const isComplete = $(this).val().length === 6;
		$('#verify_otp').prop('disabled', !isComplete);
	});



	/* 	$("#rdo_user_adv, #rdo_user_lit, #rdo_user_clerk").on('change', function () {
			var selectedRadio = $(this).val(); // Get the value of the clicked radio button
			$("#frm_register")[0].reset(); // Reset the form
			$('#national_state_code_chosen').trigger('chosen:updated');
	
			// Manually set the radio button back to the selected state
			$("input[name='" + $(this).attr('name') + "'][value='" + selectedRadio + "']").prop('checked', true);
		}); */


	//datePickerIcon('txt_dob');   //==== old 
	datePickerIcon('txt_dob', 0);

	/*
		$("#txt_dob").datepicker({
			dateFormat: 'dd-mm-yy',
			constrainInput: true,
			minDate: new Date('1900/01/01'),
			maxDate: 0,
			changeMonth: true,
			changeYear: true,
			showOtherMonths: true,
			yearRange: '1900:c',
			showOn: "both",
			defaultDate: '01-01-1900',
			buttonImage: "jquery-date/images/calendar.gif",
			buttonImageOnly: true,
	
			beforeShow: function () {
				$("#txt_dob").attr("aria-expanded", "true");
			},
			onClose: function () {
				$("#txt_dob").attr("aria-expanded", "false");
			}
	
		}).next(".ui-datepicker-trigger").attr({
			"role": "button",
			"aria-label": "Open calendar for Date of Birth",
			"tabindex": "0"
		})
	
			.addClass("btn btn-secondary btn-sm").attr("alt", "") // alt="" to prevent screen readers from reading raw image filename
			.attr("role", "button") // announce it as a button to screen readers
			.attr("aria-label", "Open calendar") // meaningful label
			.attr("tabindex", 0) // make it focusable with keyboard
			.on("keydown", function (e) {
				if (e.key === "Enter" || e.key === " " || e.keyCode === 13 || e.keyCode === 32) {
					$(this).trigger("click"); // simulate mouse click on keyboard press
					e.preventDefault()
				}
			});
	*/
function updateDobMaxDate() {
    var dp = $("#txt_dob").data("datepicker");
    if (!dp) return;

    var isAdvOrLit = $("#rdo_user_adv,#rdo_user_lit").is(":checked");

    var stateCensus = $('#national_state_code').val()?.split('~')[0];
    var isSpecialState = (stateCensus == 27 || stateCensus == 30) && $("#chkOthState").is(':checked');

    // If special state condition is true → NO restriction
    if (isSpecialState) {
        dp.settings.maxDate = 0;
    } else {
        dp.settings.maxDate = isAdvOrLit ? "-20Y" : 0;
    }

    $("#txt_dob").datepicker("refresh"); // important to apply change

	if (isSpecialState) {
        $('#dob-label').text('Enrolment Date');
    } else {
        $('#dob-label').text('Date of Birth');
    }
}

	updateDobMaxDate();



	$("#rdo_user_adv, #rdo_user_lit, #chkOthState, #national_state_code")
    .on("change", updateDobMaxDate);

	/*$('#lit_name,#adv_name,#org_name,#contact_person').bind('keypress', function (event) {
		var regex = new RegExp("^[a-zA-Z' . _]+$");
		var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
		if (!regex.test(key)) {
			event.preventDefault();
			return false;
		}
	});*/
	$('#lit_name, #adv_name, #org_name, #contact_person').on('input', function () {

		let value = $(this).val();

		// Allow only letters, space, apostrophe and dot
		value = value.replace(/[^a-zA-Z' .]/g, '');

		// ❌ Prevent starting with dot or apostrophe
		value = value.replace(/^[.'"]+/, '');

		// ❌ Prevent consecutive dots
		value = value.replace(/\.{2,}/g, '.');

		// ❌ Prevent consecutive apostrophes
		value = value.replace(/'{2,}/g, "'");

		$(this).val(value);
	});



	$('#org_name').bind('keypress', function (event) {
		var regex = /^[a-zA-Z' ._]+$/;  // Allows letters, spaces, apostrophes, periods, and underscores
		var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);

		// Get the current value of the input field
		var currentValue = $(this).val();

		// Check if the first character is special (e.g., underscore or space)
		if (currentValue === "" && (key === "_" || key === " " || !/[a-zA-Z]/.test(key))) {
			event.preventDefault();  // Prevent input if it's an invalid first character
			return false;
		}

		// Allow the key press if it's valid and does not break the rules
		if (!regex.test(key)) {
			event.preventDefault();
			return false;
		}
	});


	/*$('#off_add,#txt_city').bind('keypress', function (event) 
	{
			var regex = new RegExp("^[a-zA-Z0-9 ,./-:;()#']+$");
			var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
			if (!regex.test(key)) {
			   event.preventDefault();
			   return false;
			}
	});*/



	$("#mob_no").keyup(function () {
		var get_mob_no = $("#mob_no").val();
		$("#val_mobile").val(get_mob_no);
		var mob_mask = get_mob_no.replace(/\d(?=\d{4})/g, "*");
		$("#adv_mobile_no").html(mob_mask);
	});

	$("#email").keyup(function () {
		var get_email = $("#email").val();
		$("#val_email").val(get_email);
	});


	$("#email").keyup(function () {
		var get_email = $("#email").val();
		$("#val_email").val(get_email);
	});
	
	$('#email').on('keypress', function (e) {
   		 var char = String.fromCharCode(e.which);
    		 var value = $(this).val();

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

    		// Prevent dot/dash at very start
    			if ((char === '.' || char === '-') && value.length === 0) {
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

   		 // Prevent @ immediately after a dot (e.g., "john.@x.com" typed as "john." then "@")
    		if (char === '@' && value.slice(-1) === '.') {
       			 e.preventDefault();
        		return;
   		 }
		});

	/*$('#email').on('keypress', function (e) {

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
		// 🚫 Prevent multiple dash in domain part
		var afterAt = newValue;
		if (afterAt && (afterAt.match(/\-/g) || []).length > 1) {
			e.preventDefault();
			return;
		}
	});*/


	$('#txt_pwd').on('contextmenu', function (e) {
		e.preventDefault();
	});
	$('#txt_conf_pwd').on('contextmenu', function (e) {
		e.preventDefault();
	});


	$('#contact_person,#state_code').on('input', function () {
		this.value = this.value.replace(/[^a-zA-Z _]/g, '');
	});
	$('#txt_dob').on('input', function () {
		this.value = this.value.replace(/[^0-9-]/g, '');
	});
	$('#mob_no, #txt_otp').on('input', function () {
		this.value = this.value.replace(/[^0-9-]/g, '');
	});
	$('#email').on('input', function () {
		this.value = this.value.replace(/[^A-Za-z0-9.@ _-]/g, '');
	});

	/*$('#bar_code').on('input', function () {
		let val = this.value;

		// Remove non-alphanumeric and non-hyphen characters
		val = val.replace(/[^A-Za-z0-9-]/g, '');

		// Ensure that the value doesn't start with 0 or -
		if (val[0] === '-') {
			val = val.slice(1);  // Remove the leading character if it's 0 or -
		}

		// Ensure that there is only one hyphen
		let parts = val.split('-');
		if (parts.length > 2) {
			val = parts[0] + '-' + parts.slice(1).join('');
		}

		// Ensure the value doesn't consist of just 0 or -
		if (val === '-') {
			val = '';  // Clear value if it's just 0 or -
		}
		

		this.value = val;
	});*/

	$('#bar_code').on('input', function () {
    let val = this.value;

    // Remove non-alphanumeric and non-hyphen characters
    val = val.replace(/[^A-Za-z0-9-]/g, '');

    // Prevent starting with -
    if (val[0] === '-') {
        val = val.slice(1);
    }

    // Ensure only one hyphen
    let parts = val.split('-');
    if (parts.length > 2) {
        val = parts[0] + '-' + parts.slice(1).join('');
    }

    // Allow single 0 or values like 0123
    // But restrict all-zero values like 000000000
    if (/^0+$/.test(val) && val.length > 2) {
        val = '00';
    }

	// ✅ NEW CONDITION: if user enters only "00"
if (val === '00') {
    $('#barcode_error').text('Barcode cannot be only 00');
} else {
    $('#barcode_error').text('');
}

    // Prevent only "-"
    if (val === '-') {
        val = '';
    }

    this.value = val;
});

	$('#bar_year').on('input', function () {
		let val = this.value;

		// Ensure that the value doesn't start with 0
		if (val[0] === '0') {
			val = val.slice(1);  // Remove the leading 0
		}
		// Ensure the value doesn't consist of just 0
		if (val === '0') {
			val = '';  // Clear value if it's just 0
		}

		this.value = val;
	});
	$(document).ready(function () {

		// Apply validation to all search fields
		$(document).on("input", "#sel_bench_input_search, #dist_code_input_search, #national_state_code_input_search ,#sel_highcourt_input_search", function () {
			this.value = this.value.replace(/[^a-zA-Z0-9\s]/g, '');
		});

		// Prevent typing special characters
		$(document).on("keypress", "#sel_bench_input_search, #dist_code_input_search, #national_state_code_input_search ,#sel_highcourt_input_search", function (e) {

			var charCode = e.which || e.keyCode;
			var charStr = String.fromCharCode(charCode);

			// Allow Backspace, Tab, Enter, Delete, Arrow keys
			if ($.inArray(charCode, [8, 9, 13, 37, 38, 39, 40, 46]) !== -1) {
				return true;
			}

			// Allow only letters, numbers and space
			if (!/^[a-zA-Z0-9 ]$/.test(charStr)) {
				e.preventDefault();
				return false;
			}

		});

	});



	$('#dist_code').empty().append('<option value="">-- Select District --</option>');
	$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
	$("#selState1").find('option:selected').prop('selected', false);
	$("#selState1").trigger("chosen:updated");
	$("#dist_code").trigger("chosen:updated");
	$("#est_code").trigger("chosen:updated");

	setTimeout(function () {
		$(".alert-success5").hide();
		$(".alert-success5").html('');
		$(".alert-danger5").hide();
		$(".alert-danger5").html('');
	}, 2000);

	//var user_type=$('input[type=radio][name=rdoUser1]:checked').val();
	//var usertype_val=$("input[name='rdoUser1']:checked").val();
	// $("select, input").on("change", function () {
	// 	$(this).valid();   // revalidate this field only
	// });

	$('#frm_register').on('keydown', 'input', function (e) {

		if (e.key === "Enter") {

			// Allow Enter ONLY in OTP field
			if ($(this).attr("id") === "txt_otp") {
				return true;   // allow normal behaviour
			}

			// Block Enter everywhere else
			e.preventDefault();
			return false;
		}
	});

	

	//================== submit the form
	$('#frm_register').on('submit', function (e) {

		var usertype_val = $("input[name='rdoUser1']:checked").val();

		if ($("#frm_register").valid() == true) {

			var myModal = new bootstrap.Modal($("#reg-preview-modal")[0], {
				backdrop: 'static',
				keyboard: false
			});
			myModal.show();

			$('#reg-preview-modal .btn-confirm-submit').attr("disabled", true)
			$('#consent').prop('checked', false);


			if (usertype_val == 'A') {
				$("#preview-gender").show()
				$("#preview-dob").show();
				$("#preview-name").show();
				$("#preview-name > span").html($("#adv_name").val());
				$("#preview-barcode > span").html($("#state_code").val() + "/" + $("#bar_code").val() + "/" + $("#bar_year").val());
				$("#preview-barcode").show();
				if ($('#rdo_dist_court').is(':checked')) {
					$("#preview-court").show();
					$('#preview-bench').hide();
					$('#preview-court > label').html('District');
					$('#preview-court > span').html($('#dist_code option:selected').text());
				} else if ($('#rdo_high_court').is(':checked')) {
					$("#preview-court").show();
					$('#preview-bench').show();
					$('#preview-court > label').html('High Court');
					$('#preview-court > span').html($('#sel_highcourt option:selected').text());

					$('#preview-bench > label').html('Bench');
					$('#preview-bench > span').html($('#sel_bench option:selected').text());
				}
				$("#preview-courtType > span").html($('input[name="rdo_court_type"]:checked').parent().text().trim());
				$("#preview-courtType").show();
				$("#preview-orgName").hide();
				$('#preview-orgType').hide();
				$("#preview-contactPerson").hide();


			} else if (usertype_val == 'L') {

				if ($('#org_check').is(':checked')) {
					$("#preview-dob").hide();
					$("#preview-contactPerson").show();
					$("#preview-contactPerson >span").html($("#contact_person").val());


					$('#preview-orgType').show();
					$('#preview-orgType > span').html($('#sel_org_type option:selected').text());

					$("#preview-name").hide();
					$("#preview-orgName").show();
					$("#preview-orgName > span").html($("#org_name").val());
					$("#preview-gender").hide()
				} else {
					$("#preview-contactPerson").hide();

					$("#preview-dob").show();

					$("#preview-gender").show()
					$('#preview-orgType').hide();
					$("#preview-name").show();
					$("#preview-orgName").hide();
					$("#preview-name > span").html($("#lit_name").val());
					$("#preview-orgName").hide();
					$('#preview-orgType').hide();
				}


				$("#preview-barcode").hide();
				if ($('#rdo_dist_court').is(':checked')) {
					$("#preview-court").show();
					$('#preview-bench').hide();
					$('#preview-court > label').html('District');
					$('#preview-court > span').html($('#dist_code option:selected').text());
				} else if ($('#rdo_high_court').is(':checked')) {
					$("#preview-court").show();
					$('#preview-bench').show();
					$('#preview-court > label').html('High Court');
					$('#preview-court > span').html($('#sel_highcourt option:selected').text());

					$('#preview-bench > label').html('Bench');
					$('#preview-bench > span').html($('#sel_bench option:selected').text());

				}
				$("#preview-courtType > span").html($('input[name="rdo_court_type"]:checked').parent().text().trim());
				$("#preview-courtType").show();

			} else {
				$("#preview-contactPerson").hide();
				$("#preview-dob").show();
				$("#preview-court").hide();
				$("#preview-courtType").hide();
				$("#preview-barcode").hide();
				$('#preview-bench').hide();
				$("#preview-name").show();
				$("#preview-name > span").html($("#lit_name").val());
				$("#preview-orgName").hide();
				$('#preview-orgType').hide();
				$("#preview-gender").show()
			}
			$("#preview-gender > span").html($('input[name="gender"]:checked').parent().text().trim());

			// $("#preview-courtType > span").html($("#rdo_court_type").val());

			$("#preview-email > span").html($("#email").val());
			$("#preview-dob > span").html($("#txt_dob").val());
			$("#preview-mobile > span").html($("#mob_no").val());
			$("#preview-state > span").html($('#national_state_code option:selected').text());




			//====enable the disabled input elements before the $.ajax call
			if (usertype_val == 'A') {
				$("#adv_name").removeAttr("disabled");
				$("#mob_no").removeAttr("disabled");
			}

			var str_pwd = $('#txt_pwd').val();
			var str_cpwd = $('#txt_conf_pwd').val();

			/*---------- for password encryption ---------------*/
			var myPassword = $('#gennum').val();
			var fpass_new = $('#txt_pwd').val().trim();
			if (fpass_new) {
				var encrypted_fpass_new = CryptoJS.AES.encrypt(fpass_new, myPassword);
				$('#txt_pwd').val(encrypted_fpass_new);
			}
			var fnew_password = $('#txt_conf_pwd').val().trim();
			if (fnew_password) {
				var encrypted_fnew_password = CryptoJS.AES.encrypt(fnew_password, myPassword);
				$('#txt_conf_pwd').val(encrypted_fnew_password);
			}

			/*---------- for password encryption ---------------*/

			/*var str_pwd_val=sha256_digest(str_pwd);   
			var str_cpwd_val=sha256_digest(str_cpwd); 
			$('#txt_pwd').val(str_pwd_val);
			$('#txt_conf_pwd').val(str_cpwd_val);	
			*/


			$("#selState1").attr("disabled", false);

			var url = 'registration/user_data_register';
			var postdata = $("#frm_register").serialize();


			$('#reg-preview-modal').on('hide.bs.modal', function (e) {
				// Only alert if form wasn't submitted
				if (!window.modalFormSubmitted) {
					$("#txt_pwd").val('');
					$("#txt_conf_pwd").val('');

					// remove invalid state internally
					delete validator.invalid["txt_pwd"];
					delete validator.invalid["txt_conf_pwd"];

					// remove error labels from your custom containers
					$("#error_pwd").empty();
					$("#error_conf_pwd").empty();

					// remove error class
					$("#txt_pwd, #txt_conf_pwd").removeClass("error");



				}
			});

			$('#consent').on('change', () => {
				if ($('#consent').is(':checked')) {
					$('#reg-preview-modal .btn-confirm-submit').attr("disabled", false);
					$('#reg-preview-modal .btn-confirm-submit').off('click').on('click', function () {
						ajaxCall({ url: url, postdata: postdata, callback: callbackST, connection: 'N', chosen: false });
						$('#reg-preview-modal').modal('hide');
						resetRegForm();

					});
				} else {
					$('#consent').focus();
					$('#reg-preview-modal .btn-confirm-submit').attr("disabled", true);
				}
			})


			//prevent form from submitting
			e.preventDefault();

			function callbackST(obj) {
				//console.log("===>"+obj);
				if (obj.flag_val == 1) {
					//console.log(obj.flag_val);
					$(".alert-success5").css('display', 'block');
					$(".alert-success5").html(obj.msg);
					$("html, body").animate({ scrollTop: 0 }, "slow");

					setTimeout(function () {
						$(".alert-success5").hide();
						$(".alert-success5").html('');
						$("#frm_register").trigger("reset");
						$('#barcode_error').text('');

						$("#selState1").attr("disabled", false);
						$("#selState1").find('option:selected').prop('selected', false);
						$("#selState1").trigger("chosen:updated");

						$('#dist_code').empty().append('<option value="">-- Select District --</option>');
						$("#dist_code").trigger("chosen:updated");

						$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
						$("#est_code").trigger("chosen:updated");

						$("#sel_cd_state").find('option:selected').prop('selected', false);
						$("#sel_cd_state").trigger("chosen:updated");
						$('#sel_cd_dist').empty().append('<option value="">-- Select District --</option>');
						$("#sel_cd_dist").trigger("chosen:updated");

						$("#sel_highcourt").find('option:selected').prop('selected', false);
						$("#sel_highcourt").trigger("chosen:updated");
						$('#sel_bench').empty().append('<option value="">-- Select Bench --</option>');
						$("#sel_bench").trigger("chosen:updated");

						$("#national_state_code").find('option:selected').prop('selected', false);
						$("#national_state_code").trigger("chosen:updated");

						$('#sel_org_type').empty().append('<option value="">-- Select Organisation Type --</option>');
						$("#sel_org_type").trigger("chosen:updated");

						$("#adv_mobile_no").html('');

						$.session.set('attempt_mbl_cnt', 0);
						$.session.set('mbl_user', '');
						mobile_otp_cnt = 0;

						show_hide_user();

					}, 1000);
					$('#txt_pwd').val(str_pwd);
					$('#txt_conf_pwd').val(str_pwd);
				}
				else if (obj.flag_val == 0) {
					$(".alert-danger5").css('display', 'block');
					$(".alert-danger5").html(obj.msg3)
					//$('#txt_pwd').val('');
					//$('#txt_conf_pwd').val('');
					$('#txt_pwd').val(str_pwd);
					$('#txt_conf_pwd').val(str_pwd);
					//console.log("===="+usertype_val);
					if (usertype_val == 'A') {
						$("#mob_no").attr("disabled", "disabled");
					}

					$("html, body").animate({ scrollTop: 0 }, "slow");

					setTimeout(function () {
						$(".alert-danger5").hide();
						$(".alert-danger5").html('');
					}, 20000);

					$.session.set('attempt_mbl_cnt', 0);
					$.session.set('mbl_user', '');
					mobile_otp_cnt = 0;
				}
				else {
					//console.log("==11=>"+obj.textStatus);  
					$('#txt_pwd').val(str_pwd);
					$('#txt_conf_pwd').val(str_pwd);

					//console.log("==22=="+usertype_val);	

					if (usertype_val == 'A') {
						$("#mob_no").attr("disabled", "disabled");
					}
				}
			}
		}
	}); //====frm_register submit end

	var dob_error_msg = alerts_array[571];
	var email_error_msg = alerts_array[9];

	////[A-Za-z0-9\+_\-\*\.\!\#\$\%\&
	$.validator.addMethod("check_email", function (value, element) {
		return this.optional(element) || /^[a-zA-Z0-9.!#$%&*+-_]+@(?:\S{1,63})$/.test(value);
	}, email_error_msg);


$.validator.addMethod("date_check", function (value, element) {

    if (value === "") return true;

    // 1) Format check (DD-MM-YYYY)
    var match = value.match(/^(0[1-9]|[12][0-9]|3[01])[-](0[1-9]|1[012])[-](19|20)\d\d$/);
    if (!match) return false;

    // 2) Convert to Date object
    var parts = value.split("-");
    var dob = new Date(parts[2], parts[1] - 1, parts[0]);

    // Invalid real date check
    if (dob.getDate() != parts[0]) return false;

    var stateCensus = $('#national_state_code').val()?.split('~')[0];
    var isSpecialState = (stateCensus == 27 || stateCensus == 30) && $("#chkOthState").is(':checked');

    // 3) Advocate age rule (>= 20 years) — ONLY if not special state
    if ($("#rdo_user_adv").is(":checked") && !isSpecialState) {
        var today = new Date();
        var minAllowed = new Date(
            today.getFullYear() - 20,
            today.getMonth(),
            today.getDate()
        );

        if (dob > minAllowed) {
            return false;
        }
    }

    // 4) Prevent future dates (always लागू)
    var today = new Date();
    if (dob > today) {
        return false;
    }

    return true;

}, function () {

    var stateCensus = $('#national_state_code').val()?.split('~')[0];
    var isSpecialState = (stateCensus == 27 || stateCensus == 30) && $("#chkOthState").is(':checked');

    if ($("#rdo_user_adv").is(":checked") && !isSpecialState) {
        return "Advocate must be at least 20 years old";
    }

    return dob_error_msg;
});


	var pass_reg_exp = /^.*(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%&*]).*$/;

	var mobile_reg_exp = /^(?!([0-9])\1{9})[6-9][0-9]{9}$/;
	//var mobile_reg_exp = new RegExp("^[0-9X']+$");
	//var mobile_reg_exp = /^.*(?=.{10})(?=.*\d)(?=.*[xX0-9])(?=.*[A-Z])(?=.*[@#$%&*]).*$/;
	var pwd_msg = 'Password Must be at least 8 characters which contain at least 1 number, 1 lowercase, 1 uppercase letter and 1 special character from @#$%&*';
	var mob_msg = 'Please enter a valid mobile number.';
	//var email_reg_exp = /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
	var email_reg_exp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	var email_msg = 'Please enter a valid email address.';

	$.validator.addMethod("alpha", function (value, element) {
		return this.optional(element) || value == value.match(/^[a-zA-Z _\s]+$/);
	});
	$.validator.addMethod("yearGreaterThan1900", function (value, element) {
		// Get the current year
		var currentYear = new Date().getFullYear();

		// Check if the necessary conditions are met (radio button checked and other fields filled)
		if ($("#rdo_user_adv").is(":checked") &&
			$("#state_code").val() !== "" &&
			$("#bar_code").val() !== "") {

			// Validate if the year is greater than or equal to 1900 and less than or equal to current year
			return parseInt(value) >= 1900 && parseInt(value) <= currentYear;
		}

		// If conditions are not met, we skip the check (return true to avoid false positives)
		return true;
	}, "Please enter a year between 1900 and the current year.");



	//========== frm_register validate
	var validator = $("#frm_register").validate({
		onkeyup: false,        //  Disable validation on keyup
		onfocusout: false,     // Optional: disable on blur
		onclick: false,         // Optional: disable on click

		errorPlacement: function (error, element) {
			if (element.data().chosen) {
				element.next().after(error);
			}
			else if (element.attr("name") == "state_code" || element.attr("name") == "bar_code" || element.attr("name") == "bar_year") {
				//error.insertAfter(".div_advocate_barcode");
				error.appendTo('#error_advocate_barcode'); return;
			}
			else if (element.attr("name") == "adv_name") {

				error.appendTo('#error_adv_nm'); return;
			}
			else if (element.attr("name") == "lit_name") {
				error.appendTo('#error_litigant_nm'); return;
			}
			else if (element.attr("name") == "national_state_code") {
				error.appendTo('#error_national_state_code'); return;
			}
			else if (element.attr("name") == "selState1") {
				error.appendTo('#error_selState1_nm'); return;
			}
			else if (element.attr("name") == "mob_no") {
				error.appendTo('#error_mobile'); return;
			}
			else if (element.attr("name") == "txt_pwd") {
				error.appendTo('#error_pwd'); return;
			}
			else if (element.attr("name") == "txt_conf_pwd") {
				//console.log(error);
				error.appendTo('#error_conf_pwd'); return;
			}
			else if (element.attr("name") == "txt_otp") {
				error.appendTo('#error_otp'); return;
			}
			else if (element.attr("name") == "email") {
				error.appendTo('#error_email'); return;
			}
			else if (element.attr("name") == "txt_pin_code") {
				error.appendTo('#error_pin_code'); return;
			}
			else if (element.attr("name") == "sel_org_type") {
				error.appendTo('#error_org_type'); return;
			}
			else if (element.attr("name") == "org_name") {
				error.appendTo('#error_org_name'); return;
			}
			else if (element.attr("name") == "contact_person") {
				error.appendTo('#error_contact_person'); return;
			}
			else {
				element.next().after(error);
			}
		},
		ignore: "",

		rules: {
			state_code: {
				required: function () {
					return $("#rdo_user_adv").is(":checked");
				}
			},
			adv_name: {
				required: function () {
					return $("#rdo_user_adv").is(":checked");
				}
			},
			bar_code: {
				required: {
					depends: function () {
						return $("#rdo_user_adv").is(":checked") && $("#state_code").val() !== "";
					}
				},


				//digits: true
			},
			bar_year: {
				required: {
					depends: function () {
						return $("#rdo_user_adv").is(":checked") &&
							$("#state_code").val() !== "" &&
							$("#bar_code").val() !== "";
					}
				},
				digits: true,
				minlength: 4,
				maxlength: 4,
				yearGreaterThan1900: true,
			},
			lit_name: {
				//required: '#rdo_user_lit:checked'
				required: {
					depends: function (element) {
						if ((($("#rdo_user_lit").is(":checked")) || ($("#rdo_user_clerk").is(":checked"))) && (!$("#org_check").is(":checked"))) {
							return true;
						}
						else {
							return false;
						}
					}
				},

			},
			dist_code: {
				required: {
					depends: function (element) {
						if (($("#rdo_user_lit").is(":checked") || $("#rdo_user_adv").is(":checked")) && $("#rdo_dist_court").is(":checked")) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},
			sel_highcourt: {
				required: {
					depends: function (element) {
						if ($("#rdo_high_court").is(":checked")) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},

			sel_org_type: {
				required: {
					depends: function (element) {
						if ($("#rdo_user_lit").is(":checked") && ($("#org_check").is(":checked"))) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},
			org_name: {
				required: {
					depends: function (element) {
						if ($("#rdo_user_lit").is(":checked") && ($("#org_check").is(":checked"))) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},
			contact_person: {
				required: {
					depends: function (element) {
						if ($("#rdo_user_lit").is(":checked") && ($("#org_check").is(":checked"))) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},
			txt_dob: {
				required: {
					depends: function () {
						return !($("#rdo_user_lit").is(":checked") && $("#org_check").is(":checked"));
					}
				},
				date_check: true
			},

			national_state_code: { required: true },
			selState1: {
				required: {
					depends: function (element) {
						if (!$("#rdo_high_court").is(":checked")) {
							return true;
						}
						else {
							return false;
						}
					}
				}
			},
			mob_no: { required: true, minlength: 10, pattern: mobile_reg_exp },  //digits: true,	
			txt_pwd: { required: true, pattern: pass_reg_exp },
			txt_conf_pwd: { required: true, equalTo: "#txt_pwd", pattern: pass_reg_exp },
			txt_otp: { required: true, digits: true, minlength: 6 },
			email: { required: true, check_email: true, pattern: email_reg_exp }, 		 //pattern: email_reg_exp	,email:true,
			txt_contact_no: { digits: true },
			txt_pin_code: { digits: true, minlength: 6 },
		},
		groups: { adv_state: "state_code bar_code bar_year" },

		messages: {
			state_code: { required: "Please select state" },
			bar_code: { required: "Please enter barcode", digits: alerts_array[479] },
			bar_year: { required: "Please enter bar year", digits: 'Only numbers allowed', minlength: alerts_array[358] },


			adv_name: { required: alerts_array[157], alpha: 'Only alphabet and space allowed' },
			lit_name: {
				required: () => {
					if (!$("#rdo_user_lit").is(":checked")) {
						return "Please enter Clerk Name";
					} else {
						return alerts_array[359];
					}
				}, alpha: 'Only alphabet and space allowed'
			},
			dist_code: { required: 'Please select district' },
			sel_highcourt: { required: 'Please select high court' },

			national_state_code: { required: alerts_array[412] },
			selState1: { required: alerts_array[412] },

			mob_no: { required: alerts_array[417], minlength: alerts_array[418], pattern: mob_msg },
			txt_pwd: { required: "Please enter password", pattern: pwd_msg },
			txt_dob: { required: "Please Enter Date of Birth" },
			txt_conf_pwd: { required: "Please enter confirm password", equalTo: "Password does not match", pattern: pwd_msg },
			txt_otp: { required: alerts_array[419], minlength: "Please Enter 6 digit OTP" },			//alerts_array[420]
			email: { required: alerts_array[319], pattern: email_msg },	 //pattern:alerts_array[9]	, email: alerts_array[479]	
			txt_contact_no: { digits: alerts_array[479] },
			txt_pin_code: { digits: alerts_array[479], minlength: alerts_array[477] },
			sel_org_type: { required: alerts_array[480] },
			org_name: { required: alerts_array[481] },
			contact_person: { required: alerts_array[482] }
		}

	}); //==== validate end
	$("#frm_register").on("change blur keyup", "input, select, textarea", function () {
		if ($(this).val() !== "") {
			validator.element(this);
		}
	});


	$('#national_state_code').on('change', function () {

		setTimeout(function () {

			var el = $('#national_state_code')
				.next('.chosen-container')
				.find('a.chosen-single');

			if (el.length) {
				el.attr('tabindex', 0);
				el[0].focus({ preventScroll: true });

				// second focus after small gap (prevents steal)
				setTimeout(function () {
					el[0].focus({ preventScroll: true });
				}, 80);
			}

		}, 1000);

	});
});//==== dom end

function court_change() {
	var court_type = $("input[name='rdo_court_type']:checked").val();
	var user_type = $("input[name='rdoUser1']:checked").val();
	$('#dist_code').prop('selectedIndex', 0).trigger("chosen:updated");

	if (court_type == 1) //==== high court
	{
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();
		$("#div_adv_dist").hide();
		$("#div_dist_code").hide();
		$("#div_dist_code1").hide();
		$("#div_adv_court").show();
	}
	else if (court_type == 2) //==== district court
	{
		$('#sel_bench').empty().append('<option value="">-- Select Bench --</option>');
		$("#sel_bench").trigger("chosen:updated");
		$("#sel_highcourt").find('option:selected').prop('selected', false);
		$("#sel_highcourt").trigger("chosen:updated");

		$("#div_adv_court").hide();
		$("#div_adv_dist_est").show();
		$("#div_adv_dist_est1").show();
		$("#div_adv_dist").show();
		$("#div_dist_code").show();
		$("#div_dist_code1").show();
	}
	//====
	if (user_type == "A") {
		$("#div_adv_dist_est").show();
		$("#div_adv_dist_est1").show();
	}
	else if (user_type == "L") {
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();
	}
}

function show_hide_user() {
	$("#adv_mobile_no").html('');
	$("#lit_name").val('');
	$("#val_mobile").val('');
	$("#advo_mobile").val('');
	$("#adv_verify").val('N');

	//$("#national_state_code").val('');
	//$("#national_state_code").trigger("chosen:updated");

	setTimeout(function () {
		$(".alert-success5").hide();
		$(".alert-success5").html('');
		$(".alert-danger5").hide();
		$(".alert-danger5").html('');
	}, 3000);

	$("#div_lit_org").hide();

	$("#adv_name").removeAttr("disabled");

	$("#sel_cd_state").find('option:selected').prop('selected', false);
	$("#sel_cd_state").trigger("chosen:updated");

	$('#sel_cd_dist').empty().append('<option value="">-- Select District --</option>');
	$("#sel_cd_dist").trigger("chosen:updated");

	$("#dist_code").find('option:selected').prop('selected', false);
	$("#dist_code").trigger("chosen:updated");

	$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
	$("#est_code").trigger("chosen:updated");

	$("#txt_dob").val('');
	$("#txt_pwd").val('');
	$("#txt_conf_pwd").val('');

	//var mob_val="7788991234";		//==== dummy mobile no.
	//var mob_mask = mob_val.replace(/\d(?=\d{4})/g, "*");
	//$("#adv_mobile_no").html(mob_mask);

	var user_type1 = $("input[name='rdoUser1']:checked").val();
	court_change();
	$('#dvSelAdvClerk').hide();
	$('#dvOrdinaryPractice').show();


	$("#dvLitMessage").hide();
	if (user_type1 == 'A') {
		//$("#mobno_edit").show();
		$("#org_check").prop("checked", false);
		$("#div_adv_brn").show();
		$("#div_adv_dist_est").show();
		$("#div_adv_dist_est1").show();
		$("#div_adv_dist_court").show();
		//$("#div_adv_high_court").show();

		$("#div_litigant_per_det").hide();
		$("#div_litigant_per_det1").hide();
		$("#div_clerk_per_det").hide();
		$("#div_clerk_per_det1").hide();
		$("#litigant_lbl").hide();
		$("#barreg_lbl").show();
		$("#practic_lit_lbl").hide();
		$("#practic_adv_lbl").show();

		$("#div_lit_org").hide();
		//div_litigant_per_det

		//==== 27-05-2020
		$("#adv_name").val('');
		$("#lit_name").val('');
		//$("#off_add").val('');
		$("#mob_no").val('');
		$("#txt_otp").val('');
		$("#email").val('');
		$("#txt_city").val('');
		$("#txt_pin_code").val('');
		$("#txt_contact_no").val('');

		$('#dv_other_state').show();
	}
	else if (user_type1 == 'L') {
		$("#mobno_edit").hide();
		$("#mob_no").removeAttr("disabled");
		$("#dvLitMessage").show();
		$("#div_adv_brn").hide();
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();
		$("#div_adv_dist_court").hide();
		$("#div_clerk_per_det").hide();
		$("#div_clerk_per_det1").hide();
		//$("#div_adv_high_court").hide();	
		$("#div_litigant_per_det").show();
		$("#div_litigant_per_det1").show();
		$('#lblLitClerk').html('Litigant  Name');

		$("#litigant_lbl").show();
		$("#barreg_lbl").hide();

		$("#practic_lit_lbl").show();
		$("#practic_adv_lbl").hide();

		$("#div_lit_org").show();

		//====
		$("#div_adv_court").hide();
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();

		$("#div_adv_dist").show();
		$("#div_dist_code").show();
		$("#div_dist_code1").show();


		//==== 27-05-2020
		$("#adv_name").val('');
		//$("#off_add").val('');
		$("#mob_no").val('');
		$("#txt_otp").val('');
		$("#email").val('');
		$("#state_code").val('');
		$("#bar_code").val('');
		$("#bar_year").val('');
		$("#txt_city").val('');
		$("#txt_pin_code").val('');
		$("#txt_contact_no").val('');

		$('#dv_other_state').hide();

	}
	else if (user_type1 == 'C') {
		$("#mobno_edit").hide();
		$("#mob_no").removeAttr("disabled");

		$("#div_adv_brn").hide();
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();
		$("#div_adv_dist_court").hide();
		//$("#div_adv_high_court").hide();	

		$("#div_litigant_per_det").show();
		$("#div_litigant_per_det1").show();

		$('#lblLitClerk').html('Clerk Name');

		$('#div_lit_org').hide();


		$("#litigant_lbl").show();
		$("#barreg_lbl").hide();

		$("#practic_lit_lbl").show();
		$("#practic_adv_lbl").hide();

		$("#div_lit_org").hide();

		//$('#dvSelAdvClerk').show();
		$('#dvOrdinaryPractice').hide();


		//====
		$("#div_adv_court").hide();
		$("#div_adv_dist_est").hide();
		$("#div_adv_dist_est1").hide();

		$("#div_adv_dist").show();
		$("#div_dist_code").show();
		$("#div_dist_code1").show();

		//==== 27-05-2020
		$("#adv_name").val('');
		//$("#off_add").val('');
		$("#mob_no").val('');
		$("#txt_otp").val('');
		$("#email").val('');
		$("#state_code").val('');
		$("#bar_code").val('');
		$("#bar_year").val('');
		$("#txt_city").val('');
		$("#txt_pin_code").val('');
		$("#txt_contact_no").val('');

		$('#dv_other_state').hide();

	}
	orgComponentextparty();
}

function capitalize(s) {
	return s[0].toUpperCase() + s.slice(1);
}

function verify_bar_code() {
	if ($("#state_code").valid() && $("#bar_code").valid() && $("#bar_year").valid()) {

		$("#adv_mobile_no").html('');
		$("#adv_verify").val('N');
		$("#advo_mobile").val('');
		$("#advo_email").val('');
		$("#val_email").val('');
		$("#val_mobile").val('');

		$("#dist_code").find('option:selected').prop('selected', false);
		$("#dist_code").trigger("chosen:updated");

		$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
		$("#est_code").trigger("chosen:updated");

		$("#adv_name").removeAttr("disabled");
		var national_state_code = $("#national_state_code option:selected").val();
		var state_code = $("#state_code").val();
		var bar_code = $("#bar_code").val();
		var bar_year = $("#bar_year").val();
		var bar_code1 = state_code + '-' + bar_code + '-' + bar_year;
		var bar_code_middle = $("#bar_code").val();

		$("#adv_name").val('');
		$("#mob_no").val('');
		$("#txt_otp").val('');
		$("#email").val('');
		$("#txt_city").val('');
		$("#txt_pin_code").val('');
		$("#txt_contact_no").val('');

		$("#txt_dob").val('');
		$("#txt_pwd").val('');
		$("#txt_conf_pwd").val('');

		// **Check if bar_code is 0000**
		if (bar_code === "00") {
			msg2 = "Please enter a valid bar code.";
			$(".alert-danger5").css('display', 'block');
			$(".alert-danger5").html(msg2);
			$("html, body").animate({ scrollTop: 0 }, "slow");

			setTimeout(function () {
				$(".alert-danger5").hide();
				$(".alert-danger5").html('');
			}, 5000);

			return false; // Prevent further processing
		}


		// **Check if bar_year is 0000**
		if (bar_year === "0000") {
			msg2 = "Please enter a valid year.";
			$(".alert-danger5").css('display', 'block');
			$(".alert-danger5").html(msg2);
			$("html, body").animate({ scrollTop: 0 }, "slow");

			setTimeout(function () {
				$(".alert-danger5").hide();
				$(".alert-danger5").html('');
			}, 5000);

			return false; // Prevent further processing
		}


		// **Check if bar_year is less than 1900**


		if (state_code != '' && bar_code != '' && bar_year != '' && bar_year.length == 4 && national_state_code != "") {
			var res_nat_arr = national_state_code.split("~");
			var set_stateid = res_nat_arr[0];
			var set_dbname = res_nat_arr[2];

			if (set_dbname == "") {
				msg2 = "Connection Error";
				$(".alert-danger5").css('display', 'block');
				$(".alert-danger5").html(msg2);
				$("html, body").animate({ scrollTop: 0 }, "slow");

				setTimeout(function () {
					$(".alert-danger5").hide();
					$(".alert-danger5").html('');
				}, 5000);

				return false;
			}

			var url = "registration/verify_bar_code";
			var postdata = 'bar_code1=' + bar_code1 + '&national_state_code=' + national_state_code + '&bar_code_middle=' + bar_code_middle + '&state_code=' + state_code + '&bar_year=' + bar_year;
			ajaxCall({ url: url, postdata: postdata, callback: callback, connection: 'N', chosen: false });
		}
		function callback(result) {
			$('#adv_name').prop('disabled', false);
			$('#mob_no').prop('disabled', false);
			$('#email').prop('disabled', false);
			$('#txt_pwd').prop('disabled', false);
			$('#txt_conf_pwd').prop('disabled', false);
			$('#get_otp').prop('disabled', false);
			$('#verify_otp').prop('disabled', false);
			$('#txt_otp').prop('disabled', false);
			$('#btnRegister').prop('disabled', false);

			if (result.flag_val) {
				$(".alert-primary").css('display', 'block');
				$(".alert-primary").html(result.msg1);

				setTimeout(function () {
					$(".alert-primary").hide();
					$(".alert-primary").html('');
				}, 5000);
				
				setTimeout(function () {
			
				 var el = $('#btnverifyBarCode');

					if (el.length) {
						el[0].focus({ preventScroll: true });						
					}
				}, 1000);

				var obj_arry = result.item_data1;
				if (obj_arry.date_birth) {
					$('#txt_dob').val(obj_arry.date_birth);
				}

				if (obj_arry.adv_name != "") {
					$("#adv_name").val(obj_arry.adv_name);
					$("#adv_name").attr("disabled", "disabled");
					$("#adv_verify").val('Y');
				}

				if (obj_arry.email != "" && obj_arry.email != "NULL" && obj_arry.email != undefined) {
					$("#val_email").val(obj_arry.email);
					$("#advo_email").val(obj_arry.email);
				}
				$("#email").val(obj_arry.x_email);

				if (obj_arry.adv_mobile != "" && obj_arry.adv_mobile != 0 && obj_arry.adv_mobile != undefined) {
					$("#val_mobile").val(obj_arry.adv_mobile);
					$("#advo_mobile").val(obj_arry.adv_mobile);
					var mob_mask = obj_arry.adv_mobile.replace(/\d(?=\d{4})/g, "*");
				}

				$("#mob_no").attr("disabled", "disabled");
				$("#mobno_edit").show();
				$("#mob_no").val(obj_arry.x_mobile);
				$("#adv_mobile_no").html(obj_arry.x_mobile);

				if (obj_arry.district_name != "") {
					var district_name = (obj_arry.district_name).trim();
					var district_name1 = district_name.toLowerCase();
					var district_name2 = capitalize(district_name1);
					$("#dist_code option:contains(" + district_name2 + ")").attr("selected", true);
					$("#dist_code").trigger("chosen:updated");

					var dist_code = $("#dist_code option:selected").val();
					getEstab();
				}
			}
			else if (result.flag_val == 0) {
				$(".alert-danger5").css('display', 'block');
				$(".alert-danger5").html(result.msg1);
				$("#adv_verify").val('N');
				$("#advo_mobile").val('');
				$("#advo_email").val('');
				$("#mobno_edit").hide();
				$("#mob_no").removeAttr("disabled");
				$("#adv_mobile_no").html('');

				$("html, body").animate({ scrollTop: 0 }, "slow");

				if (result.msg1 != "This Advocate is not present in our system, please fill all information manually and submit the form, after login please upload your documents for approval") {
					$("html, body").animate({ scrollTop: 0 }, "slow");
					$('#adv_name').prop('disabled', true);
					$('#mob_no').prop('disabled', true);
					$('#email').prop('disabled', true);
					$('#txt_pwd').prop('disabled', true);
					$('#txt_conf_pwd').prop('disabled', true);
					$('#get_otp').prop('disabled', true);
					$('#verify_otp').prop('disabled', true);
					$('#txt_otp').prop('disabled', true);
					$('#btnRegister').prop('disabled', true);
				}

				setTimeout(function () {
					$(".alert-danger5").hide();
					$(".alert-danger5").html('');
				}, 9000);
			}
		}
	}
	else if (bar_year.length != 4 && state_code != '' && bar_code != '') {
		msg2 = alerts_array[358];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		$("html, body").animate({ scrollTop: 0 }, "slow");

		setTimeout(function () {
			$(".alert-danger5").hide();
			$(".alert-danger5").html('');
		}, 5000);
	}
	else if (national_state_code == "") {
		msg2 = "Please select State";
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		$("html, body").animate({ scrollTop: 0 }, "slow");

		setTimeout(function () {
			$(".alert-danger5").hide();
			$(".alert-danger5").html('');
		}, 5000);
	}
	else {
		msg2 = alerts_array[317]; // Default error message
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		$("html, body").animate({ scrollTop: 0 }, "slow");

		setTimeout(function () {
			$(".alert-danger5").hide();
			$(".alert-danger5").html('');
		}, 5000);
	}
}

var mobile_otp_cnt = 0;

function send_otp_reg() {
	//console.log("send_otp=====");
	var msg2 = "";
	var mob_exp = /^\d{10}$/;
	//var mob_no=$("#mob_no").val();
	var mob_no = $("#val_mobile").val();
	//var state_val=$("#selState1 option:selected").val();
	var state_val = $("#national_state_code option:selected").val();

	$("#txt_otp").val('');
	var res = state_val.split("~");
	var state_val = res[1];

	var state_code = $("#state_code").val();
	var bar_code = $("#bar_code").val();
	var bar_year = $("#bar_year").val();
	var bar_code1 = state_code + '-' + bar_code + '-' + bar_year;
	var bar_code_middle = $("#bar_code").val();

	if (state_val == "") {
		msg2 = alerts_array[356];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}

	if (mob_no == '') {
		mob_no = $("#mob_no").val();
	}
	if (mob_no == "") {

		msg2 = alerts_array[316];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}
	if (mob_no.length != 10) {
		msg2 = alerts_array[329];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);

		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}


	$.session.set('mbl_user', mob_no);

	if ($.session.get('mbl_user') == mob_no)
		mobile_otp_cnt++;

	//var user_type=$("input[name='rdoUser1']:checked").val();
	var national_state_code = $("#national_state_code option:selected").val();

	var url = 'registration/send_otp_reg';
	var postdata = 'mob_no=' + mob_no + '&state_code=' + state_code + '&state_val=' + state_val + '&national_state_code=' + national_state_code + '&val_mobile=' + mob_no + '&bar_code1=' + bar_code1 + '&bar_code_middle=' + bar_code_middle + '&bar_year=' + bar_year;


	$.session.set('attempt_mbl_cnt', mobile_otp_cnt);
	//alert('attempt_mbl_cnt: ' + mobile_otp_cnt);
	var tot_sms_allow = 7;
	if (mobile_otp_cnt <= tot_sms_allow) {
		ajaxCall({ url: url, postdata: postdata, callback: call_back, connection: 'N', chosen: false });
	}
	else {
		/*
		var msg11="You've reached the maximum attempts. Please try again after 5 minutes.";
		$(".alert-danger5").css('display','block');
		$(".alert-danger5").html(msg11);
		$("html, body").animate({ scrollTop: 0 }, "slow");

		
			setTimeout(function () {	
				$(".alert-danger5").hide();
				$(".alert-danger5").html('');
			}, 5000);	
			
			var tm_limit=1*60*1000;  //==== 5 min
			if($.session.get('attempt_mbl_cnt')>=tot_sms_allow)
			{

				$("#get_otp").prop('disabled',true);
				$("#verify_otp, #txt_otp").prop('disabled',true);
				
				setTimeout(function(){
					//console.log('----now check--mbl 111---'+$.session.get('attempt_mbl_cnt'));
				  $('#get_otp').prop('disabled', false);
				  $('#verify_otp, #txt_otp').prop('disabled', false);
				  $.session.set('attempt_mbl_cnt',0);
				  $.session.set('mbl_user','');			
				  mobile_otp_cnt=0;
				 // alert('attempt_mbl_cnt::: ' + attempt_mbl_cnt);
				},tm_limit);
			}
			*/
	}

	function call_back(obj) {
		if (obj.flag_val == 1) {
			$(".alert-success5").css('display', 'block');
			$(".alert-success5").html(obj.msg4);

			$("html, body").animate({ scrollTop: 0 }, "slow");

			setTimeout(function () {
				$(".alert-success5").hide();
				$(".alert-success5").html('');
			}, 5000);
		}
		else {
			if (obj.errormsg) {
				let position = obj.errormsg.search(/after 2 minute/i);
				if (position >= 1) {
					$("#get_otp").prop('disabled', true);
					$("#verify_otp, #txt_otp").prop('disabled', true);
					var tm_limit = 2 * 60 * 1000;  //==== 2 min
					setTimeout(function () {
						//console.log('----now check--mbl 111---'+$.session.get('attempt_mbl_cnt'));
						$('#get_otp').prop('disabled', false);
						$('#verify_otp, #txt_otp').prop('disabled', false);
						$.session.set('attempt_mbl_cnt', 0);
						$.session.set('mbl_user', '');
						mobile_otp_cnt = 0;
					}, tm_limit);
				}
			}

			$(".alert-danger5").css('display', 'block');

			if (obj.msg4) {
				$(".alert-danger5").html(obj.msg4);
				$("html, body").animate({ scrollTop: 0 }, "slow");
			}

			setTimeout(function () {
				$(".alert-danger5").hide();
				$(".alert-danger5").html('');
			}, 5000);
		}
	}
}

function verify_otp_reg() {
	var msg2 = "";
	var mob_no = $("#mob_no").val();
	var txt_otp = $("#txt_otp").val();

	if (mob_no == "") {
		msg2 = alerts_array[316];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}
	if (mob_no.length != 10) {
		msg2 = alerts_array[329];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}

	if (txt_otp == "") {
		msg2 = alerts_array[332];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}
	if (txt_otp.length < 4) {
		msg2 = alerts_array[333];
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}

	//var url='registration/verify_otp_reg';
	var url = 'registration/verify_mobile_otp';

	var postdata = 'mob_no=' + mob_no + '&txt_otp=' + txt_otp + '&action=1';
	ajaxCall({ url: url, postdata: postdata, callback: call_back, connection: 'N', chosen: false });

	function call_back(obj) {
		if (obj.flag_val == 1) {
			//alert("success");
			$(".alert-success5").css('display', 'block');
			$(".alert-success5").html(obj.msg2);
			//$("#createACModal").scrollTop(0);
			$("html, body").animate({ scrollTop: 0 }, "slow");

			setTimeout(function () {
				$(".alert-success5").hide();
				$(".alert-success5").html('');
			}, 7000);
		}
		else {
			$(".alert-danger5").css('display', 'block');
			$(".alert-danger5").html(obj.msg2);
			$("html, body").animate({ scrollTop: 0 }, "slow");

			setTimeout(function () {
				$(".alert-danger5").hide();
				$(".alert-danger5").html('');
			}, 10000);

			if (obj.msg2) {
				let position = obj.msg2.search(/after 2 minute/i);
				if (position >= 1) {
					$("#verify_otp, #txt_otp, #get_otp").prop('disabled', true);
					var tm_limit = 2 * 60 * 1000;  //==== 2 min
					setTimeout(function () {
						//console.log('----now check--mbl 111---'+$.session.get('attempt_mbl_cnt'));
						$('#verify_otp, #txt_otp, #get_otp').prop('disabled', false);
					}, tm_limit);
				}
			}


		}
	}
}

function getDistrict1(obj, selOption = '', gte_dist_sel_id) {
	//var selState = obj.value; 
	//var selDist = obj.value; 
	var selState = $("#sel_cd_state option:selected").val();
	//console.log('===selState==='+selState);

	selState = selState.trim();
	var id = obj.id;

	if (selState == "") {
		//alert("District List: State Code not found");
		return false;
	}

	var url = "registration/get_district";
	var postdata = "&selState=" + selState + "&selOption=" + selOption;

	function callbackEDT(obj) {
		//alert(obj.option);
		//$('#dist_code').html(obj.option);
		//$("#dist_code").trigger("chosen:updated");	

		$('#' + gte_dist_sel_id).html(obj.option);
		$("#" + gte_dist_sel_id).trigger("chosen:updated");
	}
	ajaxCall({ url: url, postdata: postdata, callback: callbackEDT, connection: 'N', chosen: false });
}

function getDistrict(obj, selOption = '', gte_dist_sel_id) {
	//var selState = obj.value; 
	var selState = $("#selState1 option:selected").val();
	//var selDist = obj.value; 
	//console.log('===selState==='+selState);

	selState = selState.trim();
	var id = obj.id;

	if (selState == "") {
		//alert("District List: State Code not found");
		return false;
	}

	var url = "registration/get_district";
	var postdata = "&selState=" + selState + "&selOption=" + selOption;

	function callbackEDT(obj) {
		//alert(obj.option);
		//$('#dist_code').html(obj.option);
		//$("#dist_code").trigger("chosen:updated");	
		if (obj.default_court_type == 'H') {
			$('#dv_high_court').show();
			$('#dv_dist_court').hide();
			setTimeout(function () {
				$('#sel_highcourt option:eq(1)').prop("selected", true);
				$('#sel_highcourt').trigger("chosen:updated");
			}, 1000);

			$('#rdo_high_court').prop("checked", true);
			$('#rdo_dist_court').prop("checked", false);
			$("#div_adv_court").show();
			$("#div_adv_dist").hide();

			$("#div_dist_code").hide();
			$("#div_dist_code1").hide();
		}
		else if (obj.default_court_type == 'D') {
			$('#dv_dist_court').show();
			$('#dv_high_court').hide();

			$('#rdo_dist_court').prop("checked", true);
			$('#rdo_high_court').prop("checked", false);

			$("#div_adv_court").hide();
			$("#div_adv_dist").show();

			$("#div_dist_code").show();
			$("#div_dist_code1").show();
		}
		else {

			$('#rdo_dist_court').prop("checked", true);
			$('#rdo_high_court').prop("checked", false);

			$('#dv_high_court').show();
			$('#dv_dist_court').show();

			$("#div_adv_court").hide();
			$("#div_adv_dist").show();

			$("#div_dist_code").show();
			$("#div_dist_code1").show();
		}

		$('#' + gte_dist_sel_id).html(obj.option);
		$("#" + gte_dist_sel_id).trigger("chosen:updated");

		if (gte_dist_sel_id != 'sel_cd_dist') {
			$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
			$("#est_code").trigger("chosen:updated");
		}
	}
	ajaxCall({ url: url, postdata: postdata, callback: callbackEDT, connection: 'N', chosen: false });
}

function getEstab(obj, selOption = '') {
	var state_val = $("#selState1 option:selected").val();
	//var selDist = obj.value; 
	var selDist = $("#dist_code option:selected").val();

	selDist = selDist.trim();
	//var id = obj.id; 

	if (selDist == "") {
		$('#est_code').empty().append('<option value="">-- Select Establishment --</option>');
		$("#est_code").trigger("chosen:updated");
		//alert("Establishment List: District Code not found");
		return false;
	}

	var url = "registration/get_estab";
	var postdata = "&selState=" + state_val + "&selDiste=" + selDist + "&selOption=" + selOption;

	//var postdata ="&selDiste="+selDist+"&selOption="+selOption;

	function callbackEDT(obj) {
		//alert(obj.option);
		$('#est_code').html(obj.option);
		$("#est_code").trigger("chosen:updated");
	}
	ajaxCall({ url: url, postdata: postdata, callback: callbackEDT, connection: 'N', chosen: false });
}

function get_bench() {
	var sel_high_court = $('#sel_highcourt').val();
	if (sel_high_court) {
		var url = "registration/get_bench";
		var postdata = "sel_high_court=" + sel_high_court;
		//alert(postdata);
		function callbackEST(obj) {
			//alert(obj.option);
			$('#sel_bench').html(obj.option);
			$("#sel_bench").trigger("chosen:updated");
			
			setTimeout(function () {
				var el = $('#national_state_code')
					.next('.chosen-container')
					.find('a.chosen-single');

				if (el.length) {
					el.attr('tabindex', 0);
					el[0].focus({ preventScroll: true });
				}
			}, 1000);
		}
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N', chosen: false });
	}
}

function isNumberKey(evt) {
	var charCode = (evt.which) ? evt.which : event.keyCode
	if (charCode > 31 && (charCode < 48 || charCode > 57))
		return false;
	return true;
}

function national_state_code_change(get_state_val) {

$('#barcode_error').text('');
	
	//console.log("===test==="+get_state_val);
	if (!get_state_val) {
		$('#dv_other_state').hide();
		alert('Please select state');
		return false;
	}
	$('#dv_other_state').show();
	show_hide_user();
	$("#state_code").val('');
	$("#bar_code").val('');
	$("#bar_year").val('');

	var res_arr = get_state_val.split("~");
	var set_state_val = res_arr[0] + '~' + res_arr[1];



	$("#selState1").val(set_state_val);
	$("#selState1").trigger("chosen:updated");

	/* ADDED FOR RAJASTHAN ADVOCATE BAR CODE ON 18-May-2023*/
	var state_abbr = res_arr[3];
	if (state_abbr == 'RJ') {
		state_abbr = 'R';
	}
	if (state_abbr == 'DL') {
		state_abbr = 'D';
	}
	$('#state_code').val(state_abbr);
	/* END HERE 18-May-2023*/



	var selected_selState1_id = $("#selState1").val();
	getDistrict("'" + selected_selState1_id + "'", '', 'dist_code');

	setTimeout(function () {

		$("#selState1").attr("disabled", "disabled");
		$("#selState1").trigger("chosen:updated");

		// Restore focus to SAME control (national_state_code) WITHOUT opening dropdown
		var el = $('#national_state_code')
			.next('.chosen-container')
			.find('a.chosen-single');

		if (el.length) {
			el.attr('tabindex', 0);
			el[0].focus({ preventScroll: true });
		}

	}, 1000);

	var sel_high_court = $('#sel_highcourt').val();

	var user_type2 = $("input[name='rdoUser1']:checked").val();

	if (user_type2 == 'C') {
		var url = "registration/get_advocate";
		var postdata = "get_state_val=" + get_state_val;
		//alert(postdata);
		function callbackEST(obj) {
			//alert(obj.option);
			$('#selAdvocate').html(obj.option);
			$("#selAdvocate").trigger("chosen:updated");

			// Restore focus to SAME control (national_state_code) WITHOUT opening dropdown
			var el = $('#national_state_code')
				.next('.chosen-container')
				.find('a.chosen-single');

			if (el.length) {
				el.attr('tabindex', 0);
				el[0].focus({ preventScroll: true });
			}


		}
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N', chosen: false });
	}

	orgComponentextparty();
	get_hc_tagged(res_arr[0]);


	/* for changing maharastra bar maxlength */
	$('#chkOthState').prop("checked", false);
	$('#state_code').attr('maxlength', '3');

	if (!$("#chkOthState").is(':checked')) {
		$('#state_code').prop("readonly", true);
	}


}

function orgComponentextparty() {
	var user_type2 = $("input[name='rdoUser1']:checked").val();
	if ($('#org_check').is(":checked")) {
		if (user_type2 == "A") {
			$("#div_litigant_per_det").hide();
			$("#div_litigant_per_det1").hide();
		}
		else if (user_type2 == "L") {
			$("#div_litigant_per_det").show();
			$("#div_litigant_per_det1").show();
		}
		$("#div_org_nmlbl").show();
		$("#div_org_nm").show();
		$("#div_lit_contact_per").show();
		$("#div_lit_contact_per1").show();

		$("#div_org_namelbl").show();
		$("#div_org_name").show();

		$("#div_gender").hide();
		$("#div_litigant_per_det").hide();
		$("#div_litigant_per_det1").hide();
		getOrganisationInAutoSearch();

	}
	else {
		//console.log("===else===");
		$("#div_org_nmlbl").hide();
		$("#div_org_nm").hide();
		$("#div_lit_contact_per").hide();
		$("#div_lit_contact_per1").hide();

		$("#div_org_namelbl").hide();
		$("#div_org_name").hide();

		$("#div_gender").show();
		$("#div_litigant_per_det").show();
		$("#div_litigant_per_det1").show();

		if (user_type2 == "A") {
			$("#div_litigant_per_det").hide();
			$("#div_litigant_per_det1").hide();
		}
		else if (user_type2 == "L") {
			$("#div_litigant_per_det").show();
			$("#div_litigant_per_det1").show();
		}
	}

	var el = $('#national_state_code')
		.next('.chosen-container')
		.find('a.chosen-single');

	if (el.length) {
		el.attr('tabindex', 0);
		el[0].focus({ preventScroll: true });
	}
}

function getOrganisationInAutoSearch() {
	var national_state_code = $("#national_state_code option:selected").val();
	var res_nat_arr = national_state_code.split("~");
	var set_dbname = res_nat_arr[2];

	if (national_state_code == "") {
		msg2 = "Please Select State"
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	}

	var url = "registration/get_organisation";
	var postdata = "set_dbname=" + set_dbname;
	//alert(postdata);
	function callbackEST(obj) {
		//alert(obj.option);
		$('#sel_org_type').html(obj.option);
		$("#sel_org_type").trigger("chosen:updated");
	}
	ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N', chosen: false });
}

function get_hc_tagged(get_state_census) {

	//var get_state_census=get_state_census;
	$('#sel_highcourt').empty();
	$("#sel_highcourt").trigger("chosen:updated");
	//alert(get_state_census);
	if (get_state_census == "") {
		msg2 = "Please Select State"
		$(".alert-danger5").css('display', 'block');
		$(".alert-danger5").html(msg2);
		//$("#createACModal").scrollTop(0);
		$("html, body").animate({ scrollTop: 0 }, "slow");
		var el = $('#national_state_code')
			.next('.chosen-container')
			.find('a.chosen-single');

		if (el.length) {
			el.attr('tabindex', 0);
			el[0].focus({ preventScroll: true });
		}
		return false;
	}
	else {
		var url = "registration/get_hc_tagged";
		var postdata = "get_state_census=" + get_state_census;
		//alert(postdata);
		function callbackEST(obj) {
			//alert(obj.option);
			$('#sel_highcourt').html(obj.option);
			$("#sel_highcourt").trigger("chosen:updated");
			setTimeout(function () {
				get_bench();
				var el = $('#national_state_code')
					.next('.chosen-container')
					.find('a.chosen-single');

				if (el.length) {
					el.attr('tabindex', 0);
					el[0].focus({ preventScroll: true });
				}
			}, 1000);

		}
		ajaxCall({ url: url, postdata: postdata, callback: callbackEST, connection: 'N', chosen: false });
	}
}

function mob_no_edit() {
	var msg = "1) The mobile number is verified by Bar. If the mobile number is changed, verification of documents, oath by video recording may have to be undertaken after registration. Verification will be done by respective authorities. As such it may take some time. \n 2) If mobile number is not changed and same mobile number is used, OTP verification is sufficient and Advocate can immediately start utilizing the eFiling services.";
	var res = confirm(msg);

	if (res) {
		$("#mob_no").removeAttr("disabled");
	}
	else {
		if ($("#mob_no").val() != "") {
			$("#mob_no").attr("disabled", "disabled");
		}
	}
}

function showhide_adv_bar() {
	if ($("#chkOthState").is(':checked')) {
		//alert('Checked');
		$('#state_code').prop("readonly", false);
		$('#other_state').val("1");
		//alert("if");



		/* for changing maharastra bar maxlength */
		var stateCensus = $('#national_state_code').val().split('~')[0];
		if ((stateCensus == 27 || stateCensus == 30) && $("#chkOthState").is(':checked')) {

			$('#state_code').attr('maxlength', '6');
			$('#state_code').prop("readonly", true);
			$('#state_code').val("MAH-LF");


			//alert(stateCensus);
		}




	} else {
		//alert('Not Checked');
		if ($('#national_state_code').val()) {
			var res_arr = $('#national_state_code').val().split("~");
			var state_abbr = res_arr[3];
			$('#state_code').val(state_abbr);
		}



		$('#state_code').prop("readonly", true);
		$('#other_state').val("0");
	}
}





$('#state_code').keypress(function (evt) {
	var key = evt.keyCode;
	if (key >= 48 && key <= 57) {
		evt.preventDefault();
	}

});

// Function to block invalid key presses
function restrictKeyPress(e) {
	const char = String.fromCharCode(e.which);
	const regex = /^[a-zA-Z0-9-]$/;
	if (!regex.test(char)) {
		e.preventDefault();
	}
}



// Function to sanitize pasted or typed input
function sanitizeInput(e) {
	// Remove any character not alphanumeric or dash
	e.target.value = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
}

function sanitizeInputYear(e) {
	// Remove any character not alphanumeric or dash
	e.target.value = e.target.value.replace(/[^0-9]/g, '');
}

window.onload = function () {
	const input = document.getElementById("bar_code");
	input.addEventListener("keypress", restrictKeyPress);
	input.addEventListener("input", sanitizeInput);  // Handles paste or mobile keyboards

	const baryear = document.getElementById("bar_year");
	baryear.addEventListener("keypress", restrictKeyPress);
	baryear.addEventListener("input", sanitizeInputYear);  // Handles paste or mobile keyboards
};


$('#email').on('input', function () {
	this.value = this.value.toLowerCase();
});






function resetRegForm() {

	$("#adv_mobile_no").html('');
	$('#get_otp').prop('disabled', true);
	$('#verify_otp').prop('disabled', true);
	var $form = $("#frm_register");

	/* preserve radio state */
	var radioStates = {};
	$form.find("input[type='radio']").each(function () {
		radioStates[this.name] = $form
			.find("input[name='" + this.name + "']:checked")
			.val();
	});

	/* reset form fields */
	$form[0].reset();
$('#barcode_error').text('');
	/* FULLY reset jQuery Validate */
	var validator = $form.data('validator');
	if (validator) {
		validator.resetForm();   // removes error labels + messages
		$form.find(".error").removeClass("error");
		$form.find(".valid").removeClass("valid");
	}

	/* reset chosen selects */
	$("#national_state_code, #adv_mobile_no , #selState1")
		.val('')
		.trigger('chosen:updated');

	/* reset dynamic district dropdown */
	$("#dist_code")
		.empty()
		.append('<option value="">Select District</option>')
		.val('')
		.trigger('chosen:updated');

	/* restore radio buttons */
	$.each(radioStates, function (name, value) {
		if (value !== undefined) {
			$form
				.find("input[name='" + name + "'][value='" + value + "']")
				.prop('checked', true);
		}
	});

	 $('#form-status-message').text('');

  setTimeout(function () {
    $('#form-status-message').text('Registration form has been reset');
  }, 100);
}







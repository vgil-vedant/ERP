//datePickerIcon('from_date',0);
//datePickerIcon('to_date',0);
$(document).ready(function () {

	document.title =' Case Order - eCourt India Services';
$('.sidebarMainMenu .nav-link').removeAttr('aria-current');
	$("#leftPaneMenuCO").attr("aria-current", "page");
//	 document.title = $(this).data('title');

  $('#partynameOrder').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z ]/g, ''));
  });

  $('#rgyearOrder, #search_case_no, #rgyearCaseOrder').on('input', function () {
    $(this).val($(this).val().replace(/[^0-9 ]/g, ''));
  });

  $('#order_party_captcha_code, #order_case_captcha_code, #order_no_captcha_code, #order_date_captcha_code').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z0-9 ]/g, ''));
  });

  $('#from_date, #to_date').on('input', function () {
    $(this).val($(this).val().replace(/[^ ]/g, ''));
  });

  $('#fir_no').on('input', function () {
    $(this).val($(this).val().replace(/[^0-9]/g, ''));
  });

});


datePickerIcon('from_date',0);
datePickerIcon('to_date',0);

function resetDataGrid(element) {
    $('#'+element).hide();

		// Clear first so screen readers re-announce
  $('#sr-alert').text('');
  setTimeout(function () {
    $('#sr-alert').text('Form has been reset');
  }, 100);
}

function submitPartyName()
{
	
	
  if(validatePartyName())
 {

	   var state_code =$("#sess_state_code").val() ;
	   var dist_code=$('#sess_dist_code').val();
	   var courtArr=$('#court_complex_code').val();
	   var court_est_arr=courtArr.split('@');
	   var court_complex=court_est_arr[0];
	   var court_complex_arr=court_est_arr[1];
	   var flag=court_est_arr[2];
	   var est_code=$('#court_est_code').val();
		if(flag=='Y' && $("#court_est_code").val()==0){
	    alert("Select Establishment");
		 return  false;
	}


	
	  if(validate_state_dist_complex()) //======== written in comopnent.js
	  {
			var fcaptcha_code=$('#order_party_captcha_code').val();
			if(fcaptcha_code=='')
			{
				errorAlert(alerts_array[475]);
				return false;
			}

			if(est_code!='')
			  {
				 est_code=est_code;
			  }
			else
			   {
				 est_code='';
			   }
	  
			var url="courtorder/submitPartyName";

			var postdata =$("#frmsearch_name_order").serialize()+"&state_code="+state_code+"&dist_code="+dist_code+"&court_complex="+court_complex+"&court_complex_arr="+court_complex_arr+"&est_code="+est_code
			//var postdata =$("#frmsearch_name").serialize();
			//alert(postdata);
			$("#help_co_party").hide();

			ajaxCall({url:url,postdata:postdata,callback:callbackParty,connection:'N'});
			function callbackParty(obj){   
				$('#div_captcha_order_party').html(obj.div_captcha);
//				 alert(obj.div_captcha);

				if(obj.status==0)
					{
					$("#order_party_captcha_code").val('');
					captcha_image_audioObj.refresh();
					document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
					return false;
					}
					else if(obj.status == 1)
				{ 				
					$('#co_party').html(obj.party_data);					
					$('#order_party_captcha_code').val('');
				}	else {
					$('#co_party').html('');
				}
				$('#co_party').show();
			}
		
		 }
	}
}

function submitCaseNo()
{
       //alert(1);
	if(validateCaseSubmit())
	{
	   var state_code =$("#sess_state_code").val() ;
	   var dist_code=$('#sess_dist_code').val();
	   var courtArr=$('#court_complex_code').val();
	   var court_est_arr=courtArr.split('@');
	   var court_complex=court_est_arr[0];
	   var court_complex_arr=court_est_arr[1];
	   var est_code=$('#court_est_code').val();
	   var case_type=$('#case_type').val();
	   var case_no=$('#search_case_no').val();
	   var rgyear=$('#rgyearCaseOrder').val();
	   var radvalue=$('input[name=frad]:checked').val();
	  
	   if(est_code!=''){
		 est_code=est_code;
	   }
	   else{
		 est_code='';
	   }

		 if(validate_state_dist_complex()) //======== written in comopnent.js
	    {

			var fcaptcha_code=$('#order_case_captcha_code').val();
			if(fcaptcha_code=='')
			{
				errorAlert(alerts_array[475]);
				return false;
			} 
			
		    var url="courtorder/submitCaseNo";
			var postdata =$("#frm_search_order_case").serialize()+"&state_code="+state_code+"&dist_code="+dist_code+"&court_complex="+court_complex+"&court_complex_arr="+court_complex_arr+"&est_code="+est_code+"&case_type="+case_type+"&case_no="+case_no+"&rgyear="+rgyear+"&radvalue="+radvalue;
			//alert(postdata);
			ajaxCall({url:url,postdata:postdata,callback:callbackComplex,connection:'N'});
			$("#help_co_case").hide();


				function callbackComplex(obj){  
					//$('#div_captcha_order_case').html(obj.div_captcha);
					//alert(obj);
					 // $('#div_captcha_order_case').html(obj.div_captcha);
					 $('#div_captcha_order_case').html(obj.div_captcha);
					 $('#order_case_captcha_code').val('');

				//	alert(obj.div_captcha);
                                        
					if(obj.status==0)
					{
					$("#order_case_captcha_code").val('');
					captcha_image_audioObj.refresh();
					document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
					return false;
					}
					else if(obj.status == 1)
					{ 
						////ert(obj.case_data);
						$('#cocase_no_res').html(obj.case_data);
						$('#order_case_captcha_code').val('');					
					}	else {
						$('#cocase_no_res').html('');					
					}
					$('#cocase_no_res').show();
				}
			 }
	}
}

function submitCourtNumber()
{
	
	 if(validateCourtNumber())
	{
		var state_code =$("#sess_state_code").val() ;
		var dist_code=$('#sess_dist_code').val();
		var courtArr=$('#court_complex_code').val(); 
		var court_est_arr=courtArr.split('@');
		var court_complex=court_est_arr[0];
		var court_complex_arr=court_est_arr[1];
		var flag=court_est_arr[2];
		var est_code=$('#court_est_code').val();		

		if(flag=='Y' && $("#court_est_code").val()==0){
			alert("Select Establishment");
			return false;
		}
		if(flag=='Y')
			var est_code = $("#court_est_code").val();
		else
			var est_code = '';

		 if(validate_state_dist_complex()) //======== written in comopnent
	    {
			var fcaptcha_code=$('#order_court_captcha_code').val();
			if(fcaptcha_code=='')
			{
				errorAlert(alerts_array[475]);
				return false;
			}  

			var court_no=$("#nnjudgecode1").val()
			var court_code_arr=court_no.split('$');
			var court_code=court_code_arr[0];
			var courtNoArr=court_code_arr[1].split('^');
			var radvalue=$('input[name=fradcourtno]:checked').val();
			
			if(court_no==0 || court_no=='')
			{
				errorAlert(alerts_array[475]);
			}
			else if(radvalue==0 || radvalue=='')
			{
				alert("Please Select Order Type");

			}

			var url="courtorder/submitCourtNo";
			var postdata =$("#frm_search_od_no").serialize()+"&state_code="+state_code+"&dist_code="+dist_code+"&court_complex="+court_complex+"&court_complex_arr="+court_complex_arr+"&est_code="+est_code+"&nnjudgecode="+courtNoArr[0]+"&temp_date1="+courtNoArr[1]+"&temp_date2="+courtNoArr[2]+"&court_code="+court_code_arr[0]+"&orderflagvalcourtno="+radvalue;
			//alert(postdata);
			ajaxCall({url:url,postdata:postdata,callback:callbackComplex,connection:'N'});
			$("#help_court_no").hide();
			function callbackComplex(obj){  
				$('#div_captcha_court_no').html(obj.div_captcha);	
			if(obj.status==0)
					{
					$("#order_no_captcha_code").val('');
					captcha_image_audioObj.refresh();
					document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
					return false;
					}
					else if(obj.status == 1)
				{ 			
					$('#showList_courtno').show();
					$('#showList_courtno').html(obj.court_no_data);
					$('#order_no_captcha_code').val('');
				
				} else {
					$('#showList_courtno').hide();
					$('#showList_courtno').html('');
				}
				$('#showList_courtno').show();
			}
		}
	}
}

function submitOrderDate()
{
	  //alert("In Order date");

	  if(validateOrdateDate())
	{
		var state_code =$("#sess_state_code").val() ;
		var dist_code=$('#sess_dist_code').val();
		var courtArr=$('#court_complex_code').val();
		var court_est_arr=courtArr.split('@');
		var court_complex=court_est_arr[0];
		var court_complex_arr=court_est_arr[1];
		var flag=court_est_arr[2];
		var est_code=$('#court_est_code').val();

		
		if(flag=='Y' && $("#court_est_code").val()==0){
			alert("Select Establishment");
		}
		if(flag=='Y')
			var est_code = $("#court_est_code").val();
		else
			var est_code = '';

		 if(validate_state_dist_complex()) //======== written in comopnent
	  {

			var fcaptcha_code=$('#order_date_captcha_code').val();
			if(fcaptcha_code=='')
			{
				errorAlert(alerts_array[475]);
				return false;
			}  

			var from_date=$("#from_date").val();
			var to_date=$("#to_date").val();
			var radvalue=$('input[name=fradorderdt]:checked').val();

			var today=new Date;
			var curDay=today.getDate();
			var curMonth=today.getMonth()+1;
			var curYear=today.getFullYear();

			//alert("from_date"+from_date+"to_date"+to_date+"curDay"+curDay+"curMonth"+curMonth+"curYear"+curYear);

			if(from_date!='')
				{
					var re = /^\d{1,2}\-\d{1,2}\-\d{4}$/; 
					if(from_date != '' && !from_date.match(re)) 
					{ 
						$("#from_date").focus(); 
						return false; 
					}

					from_date_split=from_date.split('-');
					from_date_day=from_date_split[0];
					from_date_mon=from_date_split[1];
					from_date_year=from_date_split[2];

					if(from_date_year>curYear)
					{
						$("#from_date").focus();
						return false ;
					}
					if(from_date_year==curYear)
					{
						if(from_date_mon>curMonth)
						{
							$("#from_date").val('');
							$("#from_date").focus();
							return false ;
						}

						if(from_date_mon==curMonth)
						{

							if(from_date_day>curDay)
							{
							  $("#from_date").val('');
							  $("#from_date").focus();
							  return false ;
							}
						}
					}
				}
				if(to_date!='')
				{
					var re = /^\d{1,2}\-\d{1,2}\-\d{4}$/; 
				
					if(to_date != '' && !to_date.match(re)) 
					{ 
						$("#to_date").focus(); 
						return false; 
					}
					to_date_split=to_date.split('-');
					to_date_day=to_date_split[0];
					to_date_mon=to_date_split[1];
					to_date_year=to_date_split[2];

					if(to_date_year>curYear)
					{
						$("#to_date").val()='';
						$("#to_date").focus(); 
						return false ;
					}
					if(to_date_year==curYear)
					{
						if(to_date_mon>curMonth)
						{
							$("#to_date").val('');
							$("#to_date").focus(); 
							return false ;
						}

						if(to_date_mon==curMonth)
						{
							if(to_date_day>curDay)
							{
								$("#to_date").val('');
								$("#to_date").focus(); 
								return false ;
							}
						}
					}
					if(from_date_year>to_date_year)
					{
						$("#to_date").val('');
						$("#to_date").focus(); 
						return false ;
					}
					if(from_date_year==to_date_year)
					{
						if(from_date_mon>to_date_mon)
						{
							$("#to_date").val('');
							$("#to_date").focus(); 
							return false ;
						}

						if(from_date_mon==to_date_mon)
						{

							if(from_date_day>to_date_day)
							{
								$("#to_date").val('');
								$("#to_date").focus(); 
								return false ;
							}
						}
					}
				 }
				 if(to_date=="")
				{
					$("#to_date").focus(); 
					return false;
				}		

				var url="courtorder/submitOrderDate";
				var postdata =$("#frm_search_od_date").serialize()+"&state_code="+state_code+"&dist_code="+dist_code+"&court_complex="+court_complex+"&court_complex_arr="+court_complex_arr+"&est_code="+est_code+"&from_date="+from_date+"&to_date="+to_date+"&orderflagvalorderdt="+radvalue;
				//alert(postdata);
				ajaxCall({url:url,postdata:postdata,callback:callbackComplex,connection:'N'});
				$("#help_order_date").hide();

					function callbackComplex(obj){  
					$('#div_captcha_order_date').html(obj.div_captcha);	
					if(obj.status==0)
						{
						$("#order_date_captcha_code").val('');
						captcha_image_audioObj.refresh();
						document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
						return false;
						}
						else if(obj.status == 1)
					{ 			
						$('#coorderdt').show();
						$('#coorderdt').html(obj.court_dt_data);
						$('#order_date_captcha_code').val('');
					}	else {
						$('#coorderdt').hide();
						$('#coorderdt').html('');	
					}
					$('#coorderdt').show();
				}
		}
	}
}

function validatePartyName()
{

	
		$("#frmsearch_name_order").validate();
		pattern();
		 var sess_lang = $("#hidSelLang").val(); 
        if(sess_lang!='english')
  {


        var partynameOrder = $('#partynameOrder').val();

        if (partynameOrder.charCodeAt(0)==34 || partynameOrder.charCodeAt(0)==39)
        {
         
                errorAlert(alerts_array[312]);
                return false;
        }

        if (partynameOrder.charCodeAt(0)==46 )
        {
         
                 errorAlert(alerts_array[481]);
                 return false;
        }


           for(i=0;i<partynameOrder.length;i++)
           {
                var schar = partynameOrder.charAt(i);
                var achar = schar.charCodeAt(0);

                if((achar>=65 && achar<=90)||(achar>=97 && achar<=122))
                {

                        errorAlert(alerts_array[94]);
                        return false;
                }

                if((achar>=33 && achar <=38) || (achar>=40 && achar <=45) ||(achar>=47 && achar <=64))
                {
                         
                         errorAlert(alerts_array[39]);
                        return false;
                }

           
           } 
      return true;
}else{     
		$('#partynameOrder').rules('add', {
			required:true,
			alphabet : true,
			messages: {
			required: alerts_array[40],
			alphabet :alerts_array[280],
			
			}
		});

		 $('#rgyearOrder').rules('add', {
			required:true,
			Number : true,
			maxlength : 4,
                        validateYear:true,
			messages: {
			required: alerts_array[115],
			Number : alerts_array[412],
			maxlength: alerts_array[42],
			validateYear:"Invalid Year",
			}
		});
			
		if(!$('#frmsearch_name_order').valid())
			$('.error').first().focus();
		return $('#frmsearch_name_order').valid();

}}


function validateCaseSubmit()
{
	
		$("#frm_search_order_case").validate();
		pattern();
	   
		$('#case_type').rules('add', {
			required:true,
			messages: {
			required: alerts_array[44],
			//maxlength: 'Jo Code is required maximum 254 characters',
			}
		});

		 $('#search_case_no').rules('add', {
			required:true,
			Number : true,
			messages: {
			required: alerts_array[682],
			Number : alerts_array[412],
			}
		});

		 $('#rgyearCaseOrder').rules('add', {
			required:true,
			Number : true,
			maxlength : 4,
			validateYear:true,
			messages: {
			required: alerts_array[115],
			Number : alerts_array[412],
			 maxlength: alerts_array[42],
			validateYear:"Invalid Year",
			}
		});
			
		if(!$('#frm_search_order_case').valid())
			$('.error').first().focus();
		return $('#frm_search_order_case').valid();
}


function validateCourtNumber()
{

		$("#frm_search_od_no").validate();
		pattern();
	   
		$('#nnjudgecode1').rules('add', {
			required:true,
			messages: {
			required: alerts_array[47],
			//maxlength: 'Jo Code is required maximum 254 characters',
			}
		});

	
		if(!$('#frm_search_od_no').valid())
			$('.error').first().focus();
		return $('#frm_search_od_no').valid();


}

$.validator.addMethod("greaterThanFromDate", function(value, element) {
    var fromDateVal = $('#from_date').val();
    var toDateVal = value;

    if (!fromDateVal || !toDateVal) return true;


    var fromParts = fromDateVal.split('-');
    var toParts = toDateVal.split('-');

    if (fromParts.length !== 3 || toParts.length !== 3) return false;

    var fromDate = new Date(fromParts[2], fromParts[1] - 1, fromParts[0]);
    var toDate = new Date(toParts[2], toParts[1] - 1, toParts[0]);

    return toDate >= fromDate;
}, "To date must be greater than or equal to From date");

function validateOrdateDate() {
    $("#frm_search_od_date").validate({
        errorPlacement: function(error, element) {
            if (element.data().chosen) {
                element.next().after(error);
            } else if (element.attr("name") === "from_date") {
                $('#error_from_date').html(error);
            } else if (element.attr("name") === "to_date") {
                $('#error_to_date').html(error);
            } else {
                element.next().after(error);
            }
        },
        ignore: "",
        rules: {
            from_date: {
                required: true,
                maxlength: 10

            },
            to_date: {
                required: true,
                maxlength: 10,
                greaterThanFromDate: true
            }
        },
        messages: {
            from_date: {
                required: alerts_array[50] || "From date is required",
                maxlength: 'From date must be at most 10 characters'
            },
            to_date: {
                required: alerts_array[54] || "To date is required",
                maxlength: 'To date must be at most 10 characters',
                greaterThanFromDate: 'To date must be greater than or equal to From date'
            }
        }
    });

    return $('#frm_search_od_date').valid();
}



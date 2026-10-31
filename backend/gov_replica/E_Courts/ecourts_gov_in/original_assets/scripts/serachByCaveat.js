$(document).ready(function () {

document.title ='Caveat Search - eCourt India Services';

	$('.sidebarMainMenu .nav-link').removeAttr('aria-current');
	$("#leftPaneMenuCavet").attr("aria-current", "page");

  $('#caveat_captcha_code').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z0-9 ]/g, ''));
  });

  $('#caveatorname, #caveateename, #caveatorcaveatee').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z ]/g, ''));
  });

  $('#caveat_search_case_no, #caveat_rgyear, #caveat_filing_no, #caveat_no, #caveat_year').on('input', function () {
    $(this).val($(this).val().replace(/[^0-9 ]/g, ''));
  });

  $('#caveat_dateofdecision_date').on('input', function () {
    $(this).val($(this).val().replace(/[^ ]/g, ''));
  });

});

datePickerIcon('caveat_dateofdecision_date',0);
$("#s_type").val('caveat');
$(function() {
	var radio_val=$('input[type=radio][name=searchcaveat][checked=checked]').val();
	var radio_v=$('input[type=radio][name=filing_type][checked=checked]').val();
	//alert(radio_val);
if(radio_v=='2')
	{
		$('.filing_no_caveat').hide();
		$('.case_no_caveat').show();
		$('#caveat_no').val('');
		$('#caveat_rgyear').val('');
	}
if(radio_val=='anywhere')
	{
	//alert(1);
	$('#caveatNo_div').hide();
	$('#dateOfDecision_div').hide();
	$('#caseType_div').hide();
	$('#subordinate_div').hide();
	$('#caveator_div').hide();
	$('#caveatee_div').show();
	$('#res_caveat_search').html('');
	$('#caveatorname').val('');
	}
$('input[type=radio][name=searchcaveat]').change(function() {
    if (this.value == 'anywhere') {
        $('#caveatNo_div').hide();
	$('#dateOfDecision_div').hide();
	$('#caseType_div').hide();
	$('#subordinate_div').hide();
	$('#caveator_div').hide();
	$('#caveatee_div').show();
	$('#res_caveat_search').html('');
	//$('#caveatorcaveatee').val('');


    }
    if (this.value == 'startingwith') {
    $('#caveatNo_div').hide();
	$('#dateOfDecision_div').hide();
	$('#caseType_div').hide();
	$('#subordinate_div').hide();
	$('#caveatee_div').hide();
	$('#caveator_div').show();
	$('#res_caveat_search').html('');
	$('#caveatorcaveatee').val('');
    }
	if (this.value == 'subordinateCourt') {
        $('#caveatNo_div').hide();
	$('#dateOfDecision_div').show();
	$('#caseType_div').show();
	$('#subordinate_div').show();
	$('#caveatee_div').hide();
	$('#caveator_div').hide();
	$('.modal-backdrop show').hide();
	$('#res_caveat_search').html('');
	$('#caveat_search_case_no').val('');
	$('#caveat_rgyear').val('');
	$('#caveat_filing_no').val('');


    }
	if (this.value == 'caveatno') {
        $('#caveatNo_div').show();
	$('#dateOfDecision_div').hide();
	$('#caseType_div').hide();
	$('#subordinate_div').hide();
	$('#caveatee_div').hide();
	$('#caveator_div').hide();
	$('#res_caveat_search').html('');
	$('#caveat_no').val('');
	$('#caveat_rgyear').val('');

    }
});

$('input[type=radio][name=filing_type]').change(function() {


if(this.value=='1')
	{
	$('.case_no_caveat').hide();
	
	$('.filing_no_caveat').show();
	}
	if(this.value=='2')
	{
	$('.filing_no_caveat').hide();
	
	$('.case_no_caveat').show();
	}
 });

 });

function resetDataGrid(element) {
    $('#'+element).hide();

		// Clear first so screen readers re-announce
  $('#sr-alert').text('');
  setTimeout(function () {
    $('#sr-alert').text('Form has been reset');
  }, 100);
}
 function fillSubordinateCourt()
{

	//$('#subordinate_court_name').chosen('destroy');
	var state_code =$("#sess_state_code").val() ;
	var dist_code=$('#sess_dist_code').val();
	var courtArr=$('#court_complex_code').val();
	var court_est_arr=courtArr.split('@');
	var court_complex=court_est_arr[0];
	var court_est=court_est_arr[1];
	var flag=court_est_arr[2];

	if(flag=='Y' && $("#court_est_code").val()==0){
	    alert("Select Establishment");
	}
	if(flag=='Y')
		var est_code = $("#court_est_code").val();
	else var est_code = '';

	var url="caveat_search/fillSubordinateCourt";
	


	var postdata ="state_code="+state_code+"&dist_code="+dist_code+"&court_complex_code="+court_complex+"&est_code="+est_code;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
	function callbackEST(obj){ 
		if(obj.status == 1)
		{       //$(".modal-backdrop").hide();	
			$('#subordinate_court_name').html(obj.subordinate_court_list);
		}	
	
		$(".modal-backdrop").hide();

	}
	
}

function submitCaveat(){
	
	if(validate_state_dist_complex()) //======== written in comopnent.js
	  {
        // alert(validatesCaveat);
	if(validatesCaveat())
	{
	   var state_code =$("#sess_state_code").val() ;
	   var dist_code=$('#sess_dist_code').val();
	   var courtArr=$('#court_complex_code').val();
	   var court_est_arr=courtArr.split('@');
	   var court_complex=court_est_arr[0];
	   var est_code=$('#court_est_code').val();
		 var flag=court_est_arr[2];


		if(flag=='Y' && $("#court_est_code").val()==0){
	    alert("Select Establishment");
		 return  false;
	}
	    var fcaptcha_code=$('#caveat_captcha_code').val();
		if(fcaptcha_code=='')
		{
			errorAlert(alerts_array[475]);	
			return false;
		}  

	   var url="caveat_search/submitCaveat";
	 
	   var postdata =$("#frm_caveat_search").serialize()+"&state_code="+state_code+"&dist_code="+dist_code+"&court_complex_code="+court_complex+"&est_code="+est_code;
		//alert(postdata);
		$("#how_to_caveat").hide();

		ajaxCall({url:url,postdata:postdata,callback:callbackComplex,connection:'N'});
			function callbackComplex(obj){   
				$('#div_captcha_caveat').html(obj.div_captcha);	
			if(obj.status==0)
                {                
					$("#caveat_captcha_code").val('');
                captcha_image_audioObj.refresh();                
				document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
                return false;                }
                else 	if(obj.status == 1)
				{ 			
					$('#res_caveat_search').html(obj.case_data);
					$('#caveat_captcha_code').val('');
				}	else {
					$('#res_caveat_search').html('');
				}
				$('#res_caveat_search').show();
			}
	  }
	}
}

function validatesCaveat(){
	//alert();
	$("#frm_caveat_search").validate();
    pattern();

		var radio_val = $("input[name='searchcaveat']:checked").val(); 
	//var radio_val=$('input[type=radio][name=searchcaveat][checked=checked]').val();
//	alert(radio_val);
	var radio_v=$("input[name=filing_type]:checked").val();


	if(radio_val=='anywhere')
	{
	 $('#caveatorname').rules('add', {
    	required:true,
		messages: {
        required: alerts_array[486],
		
        }
    });

	}
if(radio_val=='startingwith')
	{
	 $('#caveatorcaveatee').rules('add', {
    	required:true,
		messages: {
        required: alerts_array[687],
        }
    });

	}
if(radio_val=='subordinateCourt')
	{
	//	alert(1);
	if(radio_v=='2'){

	/*	$('#caveat_search_case_no').rules('add', {
    		equired:true,
		Number : true,
		messages: {
        	equired: alerts_array[35],
		Number : alerts_array[412],
		
        }
    });*/
	
		$('#caveat_search_case_no').rules('add', {
    	required:true,
		Number : true,
		messages: {
        required: alerts_array[35],
		Number : alerts_array[412],
		
        }
    });
	//lert('#caveat_rgyear');
	 $('#caveat_rgyear').rules('add', {
		 //alert(1);
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
	 $('#case_type_caveat').rules('add', {
    	required:true,
		messages: {
        required: alerts_array[44],
		
        }
    });

	}
	if(radio_v=='1'){
		$('#caveat_filing_no').rules('add', {
    	required:true,
		Number : true,
		messages: {
        	required: alerts_array[254],
		Number : alerts_array[412],
		
        }
    });
	 $('#caveat_rgyear').rules('add', {
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

	 $('#case_type_caveat').rules('add', {
    	required:true,
		messages: {
        required: alerts_array[44],
		
        }
    });

	}
	
	 
	}
        //alert(1);
	if(radio_val=='caveatno')
	{
	//alert(1); 
	$('#caveat_no').rules('add', {
    		required:true,
		Number : true,
		messages: {
        	required: alerts_array[689],
		Number : alerts_array[412],
		
        }
    });
	 $('#caveat_year').rules('add', {
    	required:true,
		Number : true,
		maxlength : 4,
	validateYear: true,
        messages: {
        required: alerts_array[115],
		Number : alerts_array[412],
        maxlength: alerts_array[42],
	validateYear: 'Invalid Year',
        }
    });
	
	}


	 $('#caveateename').rules('add', {
    	required:false,
		messages: {
        required: alerts_array[487],
		
        }
    });
	
	 $('#subordinate_court_name').rules('add', {
    	required:false,
		messages: {
        required: alerts_array[688],
		
        }
    });
	$('#caveat_dateofdecision_date').rules('add', {
    //	required:false,
	date : true,
	messages: {
       // required: 'Date of Decision is required',
        date :'Invalid Date',
		
        }
    });
// return $('#frm_caveat_search').valid();
   if(!$('#frm_caveat_search').valid())
       $('.error').first().focus();
    return $('#frm_caveat_search').valid();
}





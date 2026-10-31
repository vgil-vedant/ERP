
console.clear();
var triggerElement = null;
$(document).ready(function() {
  $.ajaxSetup({ cache: true });




$('.modal').on('hidden.bs.modal', function () {

    $(this).find('#fd_body, #vd_body').html('');

    if (triggerElement && document.contains(triggerElement)) {
        setTimeout(function () {
            let $el = $(triggerElement);

            if ($el.hasClass('chosen-select')) {
                $el.next('.chosen-container').find('.chosen-single').focus();
            } else {
                $el.focus();
            }
        }, 100);
    }
});
  
  //23-02-2026 Sugamy Issue ncorrect focus order found in form region.
/*
Description:
When we select any option from comboboxes using down arrow key, after selecting option the focus goes to "Edit case" tab on the top of the page.
This makes illogical focus order & confuses screen reader users. 
 */
  $(document).on('change', 'select', function () {
    if ($(this).data('chosen')) {

        let el = this;

        // Wait until chosen closes
        setTimeout(function () {
            $(el).trigger('chosen:activate');   // restore focus to combobox
        }, 0);
    }
});

$(document).on('chosen:hiding_dropdown', 'select', function () {

    let el = this;
    setTimeout(function () {
        $(el).trigger('chosen:activate');  // bring focus back to same dropdown
    }, 0);
});
//==========================================


//23-02-2026 Sugamy Issue For Tab and Arrow navigation in datepicker Avinash 
$(document).on("keydown", "#ui-datepicker-div td a", function (e) {

    let $current = $(this);
    let $td = $current.parent();
    let $tr = $td.parent();
    let index = $td.index();

    function focusCell($cell) {
        if ($cell.length) {
            let $link = $cell.find("a");
            if ($link.length) $link.focus();
        }
    }

    switch (e.key) {

        case "ArrowRight":
            e.preventDefault();
            focusCell($td.next("td:not(.ui-datepicker-other-month)"));
            break;

        case "ArrowLeft":
            e.preventDefault();
            focusCell($td.prev("td:not(.ui-datepicker-other-month)"));
            break;

        case "ArrowDown":
            e.preventDefault();
            focusCell($tr.next().children("td").eq(index));
            break;

        case "ArrowUp":
            e.preventDefault();
            focusCell($tr.prev().children("td").eq(index));
            break;

        case "Enter":
        case " ":
            e.preventDefault();
            $current.trigger("click");
            break;

        case "Escape":
            $(".hasDatepicker").datepicker("hide").focus();
            break;
    }
});

//start - code for modal trigger and focus
let lastFocusedElement;
document.querySelectorAll('[data-bs-toggle="modal"]').forEach(button => {
  button.addEventListener('click', function () {
    lastFocusedElement = this;
  });
});

const modalElement = document.getElementById('validateError');
modalElement.addEventListener('hidden.bs.modal', function () {
  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
});
//end

$(document).on("click", "a.dropdown-item", function(){
	//alert($('#selTagAdvocate').val());
	var sessionUserType = $('#sessionUserType').val();
    if(!$('#selTagAdvocate').val() && sessionUserType==4){
		//alert($('#selTagAdvocate').val());
		errorAlert('Please select advocate to further proceeding');
		return false;
	}
});
      
	$("#showManual1").click(function(){
		$('#vd_title').html('User Manual');
	});
	$("#showManual12").click(function(){
		$('#vd_title').html('User Manual');
	});
	
	var hidPFlag = $('#hidPFlag').val();
	//alert(hidPFlag);	
	if(hidPFlag == 'N'){
	setTimeout(function(){
		$('#change-password').click();},1000);
	}
  
});

function setBarReg(adv_id)
{
	var adv_bar_val=$('#'+adv_id).val().split('~');
	 $('#fbarcode1').val(adv_bar_val[1]);
	  $('#fbarcode2').val(adv_bar_val[1]);
		$('#fbarcode3').val(adv_bar_val[1]);
	  
}
function getSection(obj)
{
	var act_code = obj.value;
	var act_box_id = obj.id;
	var act_num = obj.title;
//alert(act_num + ' ' + act_code + ' ' + act_box_id);//19120080099001 factcode2  factcode_section
		var url="advocate_case_registration/getActSection/";	
		var postdata = "actCode="+act_code;
		//alert(postdata);
	

	function callbkAdv(result)
				{		
					if(result.msg1 == 0) {
							var section_code = 'factcode_section' + act_num;

							$('#'+section_code).html('<option value="">Select</option>');
							
							$.each( result, function( key,item ) {
								//alert('anil'+item.orgname) 
								
								if(item.actsection_code)
								{
									$('#'+section_code).append('<option value="'+item.actsection_code+'">' + item.act_section+' - '+item.actsection_code + '</option>');
								}
							});	
					}
				}
	ajaxCall({url:url,postdata:postdata,callback:callbkAdv,connection:'N'});	
}

function getExtraPartySection(obj, count)
{
	var act_code = obj.value;
	var act_box_id = count;

		var url="advocate_case_registration/getActSection/";	
		var postdata = "actCode="+act_code;
		//alert(postdata);
	

	function callbkAdv(result)
				{
				
					var section_code = 'factsection_codeparty'+act_box_id;					

					$('#'+section_code).html('<option value="">Select</option>');
					$.each( result, function( key,item ) {
						//alert('anil'+item.orgname) 
						
						if(item.actsection_code)
						{
							$('#'+section_code).append('<option value="'+item.actsection_code+'">' + item.act_section+' - '+item.actsection_code + '</option>');
						}
					});								
				}
	ajaxCall({url:url,postdata:postdata,callback:callbkAdv,connection:'N'});	
}


function ajaxCall(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(jsonobj.chosen==false)
		objchosen={chosen:false};
	else if(jsonobj.chosen==true)
		objchosen={chosen:true};
	else if(typeof jsonobj['chosen'] == 'undefined')
		objchosen={chosen:false};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;

	if(typeof jsonobj['loader'] == 'undefined')
		objloader={loader:true};
	else
		objloader=jsonobj.loader;
	if(objloader)
		fadein();
	//return false;
	setTimeout(function(){

	var chosen=objchosen.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	if($('#hid_case_adv_pde').val() && $('#hid_case_adv_flag').val()){
		postdata +="&hid_case_adv_pde="+$('#hid_case_adv_pde').val()+"&hid_case_adv_flag="+$('#hid_case_adv_flag').val()
	}
	
	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
	
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	
	   			
	   	},
		success:function( result ) {
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				successAlert(result.msg);
			}
			result['status']=true;
			callback(result);
			$('#__csrf_magic').val(result.nsteptoken);
			
			if(chosen)
			{
				setTimeout(function(){
					$('select:not(.csAct)').chosen("destroy").chosen({width:"100%"});

					getAdvocateInAutoSearch();
					
					$("#fpet_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					$("#fres_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					fadeout();
				},300);
			}
			
		}
	
	});
	},50);
}


function ajaxCallForManual(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(jsonobj.chosen==false)
		objchosen={chosen:false};
	else if(jsonobj.chosen==true)
		objchosen={chosen:true};
	else if(typeof jsonobj['chosen'] == 'undefined')
		objchosen={chosen:false};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;

	if(typeof jsonobj['loader'] == 'undefined')
		objloader={loader:true};
	else
		objloader=jsonobj.loader;
	if(objloader)
		fadein();
	//return false;
	setTimeout(function(){

	var chosen=objchosen.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	if($('#hid_case_adv_pde').val() && $('#hid_case_adv_flag').val()){
		postdata +="&hid_case_adv_pde="+$('#hid_case_adv_pde').val()+"&hid_case_adv_flag="+$('#hid_case_adv_flag').val()
	}
	
	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
	
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	
	   			
	   	},
		success:function( result ) {
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				successAlert(result.msg);
			}
			result['status']=true;
			callback(result);
			$('#__csrf_magic').val(result.nsteptoken);
						
			
		}
	
	});
	},50);
}

function ajaxCallNormal(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(jsonobj.chosen==false)
		objchosen={chosen:false};
	else if(jsonobj.chosen==true)
		objchosen={chosen:true};
	else if(typeof jsonobj['chosen'] == 'undefined')
		objchosen={chosen:false};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;

	if(typeof jsonobj['loader'] == 'undefined')
		objloader={loader:true};
	else
		objloader=jsonobj.loader;
	if(objloader)
		fadein();
	//return false;
	var chosen=objchosen.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	if($('#hid_case_adv_pde').val() && $('#hid_case_adv_flag').val()){
		postdata +="&hid_case_adv_pde="+$('#hid_case_adv_pde').val()+"&hid_case_adv_flag="+$('#hid_case_adv_flag').val()
	}
	//alert(postdata);
	/*if(typeof stateCode !== 'undefined'  && typeof distCode !== 'undefined' && typeof estCode !== 'undefined'){
		postdata += "&stateCode="+stateCode+"&distCode="+distCode+"&estCode="+estCode; 
		$(".alert-warning").hide();
		$('#msg-warning').html("");
	}
	else
	{
		if(connection!='N')
		{
			$(".alert-warning").show();
			$('#msg-warning').html("Please Select State,District and Establishment");
			return false;
		}
	}*/
	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		//dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
		
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
				//if(chosen && url != restricted_url && url != restricted_url1)
	   			
	   	},
		success:function( result ) {
			//alert('aaa'+result.nsteptoken)
			//alert('out')
			
			//if(url != restricted_url && url != restricted_url1){
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				//alert(result.msg)
				//$(".alert-success").show();
				//$("#msg-success").html(result.msg);
				successAlert(result.msg);
			}
			//result['status']=true;
			callback(result);
			$('#__csrf_magic').val(result.nsteptoken);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				$(".alert-success").hide();
				$("#msg-success").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
			
			
			
		}
	
	});
}

function ajaxCall1(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(jsonobj.chosen==false)
		jsonobj={chosen:false};
	else if(typeof jsonobj['chosen'] == 'undefined')
		jsonobj={chosen:true};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;
	
	//fadein();
	//return false;
	var chosen=jsonobj.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	if(typeof stateCode !== 'undefined'  && typeof distCode !== 'undefined' && typeof estCode !== 'undefined'){
		postdata += "&stateCode="+stateCode+"&distCode="+distCode+"&estCode="+estCode; 
		$(".alert-warning").hide();
		$('#msg-warning').html("");
	}
	else
	{
		if(connection!='N')
		{
			$(".alert-warning").show();
			$('#msg-warning').html("Please Select State,District and Establishment");
			return false;
		}
	}
	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
		
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
				//if(chosen && url != restricted_url && url != restricted_url1)
	   			
	   	},
		success:function( result ) {
			//alert('aaa'+result.nsteptoken)
			//alert('out')
			result['status']=true;
			callback(result);
			//if(url != restricted_url && url != restricted_url1){
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				//alert(result.msg)
				//$(".alert-success").show();
				//$("#msg-success").html(result.msg);
				successAlert(result.msg);
			}
			$('#__csrf_magic').val(result.nsteptoken);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				$(".alert-success").hide();
				$("#msg-success").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
			
			
			
			if(chosen)
			{
				setTimeout(function(){
					//$('select').chosen({width:"100%"});
					$('select:not(.csAct)').chosen("destroy").chosen({width:"100%"});
					
					//getPetAdvocateInAutoSearch();
					//getResAdvocateInAutoSearch();
					//getExtraPartyAdvocateInAutoSearch();

					//getPetOrganisationInAutoSearch();
				    //getResOrganisationInAutoSearch();
					getExtraPartyOrganisationInAutoSearch();				

					//getActInAutoSearch();
					
					$("#fpet_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					$("#fres_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					fadeout();
				},300);
			}
			
		}
	
	});
}



function ajaxCallAct(jsonobj)

{
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(typeof jsonobj['chosen'] == 'undefined')
		jsonobj={chosen:true};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;
	

	//return false;
	var chosen=jsonobj.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	if(typeof stateCode !== 'undefined'  && typeof distCode !== 'undefined' && typeof estCode !== 'undefined'){
		postdata += "&stateCode="+stateCode+"&distCode="+distCode+"&estCode="+estCode; 
		$(".alert-warning").hide();
		$('#msg-warning').html("");
	}
	else
	{
		if(connection!='N')
		{
			$(".alert-warning").show();
			$('#msg-warning').html("Please Select State,District and Establishment");
			return false;
		}
	}

	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	//alert(url + ' ' + restricted_url);
	//alert(base_url+'/?p='+url);///pdedev/?p=advocate_case_registration/getActs
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			//alert('bbbbbbb'+jqXHR.responseText+'-----'+errorThrown)
			var responseArray=jqXHR.responseText.split('#####');
			$(".alert-danger").show();
			$("#msg-danger").html(responseArray[0]);
			$('#submitdata').attr('disabled',false);
			setTimeout(function(){fadeout()},300);
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
		
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
			
			/*if(chosen && url != restricted_url && url != restricted_url1)
	   			fadein();*/
	   	},
		success:function( result ) {
			//alert('aaa'+result.nsteptoken)
			//alert('out')
			if(url != restricted_url &&  url != restricted_url1){
			//fadeout();
			}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				//alert(result.msg)
				$(".alert-success").show();
				$("#msg-success").html(result.msg);
			}
			$('#__csrf_magic').val(result.nsteptoken);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				$(".alert-success").hide();
				$("#msg-success").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
			
			result['status']=true;
			callback(result);
			//setTimeout(function(){fadeout()},300);
			
			if(chosen)
			{
				setTimeout(function(){
					//$('select').chosen({width:"100%"});
					$('select:not(.csAct)').chosen("destroy").chosen({width:"100%"});
					
					//getPetAdvocateInAutoSearch();
					//getResAdvocateInAutoSearch();
					//getExtraPartyAdvocateInAutoSearch();

					//getPetOrganisationInAutoSearch();
				    //getResOrganisationInAutoSearch();
					//getExtraPartyOrganisationInAutoSearch();				

					//getActInAutoSearch();
					
					$("#fpet_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					$("#fres_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					//fadeout();
				},300);
			}
			
		}
	
	});
}

function ajaxExternalCall(url,postdata,callback)
{
	$(".alert-danger").hide().html('');
	$(".alert-success").hide().html('');
	
	$.ajax({
		type: "POST",
		url:  url,
		dataType: 'json',
		async: false,
		data:postdata,		
		error: function(jqXHR, textStatus, errorThrown) {
			//alert(jqXHR.responseText)
			//$(".alert-danger").show().html(jqXHR.responseText);
			//$('#submitdata').attr('disabled',false);
			fadeout();
		},
		beforeSend:function()
	   	{		
	   		fadein();
	   	},
		success:function( result ) {
			
			fadeout();
			
			callback(result);
			
		}
	
	});
}

function jsonCall(url,postdata,callback)
{
	$(".alert-danger").hide().html('');
	$(".alert-success").hide().html('');
    var base_url=$('#base_url').val();
    var token=$('#__csrf_magic').val();
    //alert(token+'------'+url)
	var url1=base_url+"/?p="+url+'&__csrf_magic='+token;
	//var url="jsonFiles/jsondistrict.php";
	fadein();
	$.getJSON(url1,postdata ,function(obj)
   	{
		fadeout();
		if(obj.errormsg!='' && obj.errormsg!=undefined && obj.errormsg!=null)
			$(".alert-danger").show().html(obj.errormsg);
		if(obj.msg!='' && obj.msg!=undefined && obj.msg!=null)
			$(".alert-success").show().html(obj.msg);
		$('#__csrf_magic').val(obj.nsteptoken)
		callback(obj);

    }).fail(function(jqXHR, textStatus, errorThrown) {
       //alert(jqXHR.responseText)
       var responseArray=jqXHR.responseText.split('#####');
		$(".alert-danger").show().html(jqXHR.responseText);
		//$('#submitdata').attr('disabled',false);
		fadeout();
		if(responseArray[1]!='' && responseArray[1]!=undefined)
			$('#__csrf_magic').val(responseArray[1]);
		else
			$('#__csrf_magic').val(token);
    });


}
function ajaxCallNew(url,postdata,callback,formid)
{
	$(".alert-danger").hide().html('');
	$(".alert-success").hide().html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	postdata.append('ajax_req', true);
	var result= [];
	fadein();
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: 'json',
		async: "false",
		cache: false,
        contentType: false,
        processData: false,
		data:postdata,		
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
			
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
		
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
				//if(chosen && url != restricted_url && url != restricted_url1)
	   			
	   	},
		success:function( result ) {
			//alert('aaa'+result.nsteptoken)
			//alert('out'+result)
			
			//if(url != restricted_url && url != restricted_url1){
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				//alert(result.msg)
				//$(".alert-success").show();
				//$("#msg-success").html(result.msg);
				successAlert(result.msg);
			}
			result['status']=true;
			callback(result);
			$('#__csrf_magic').val(result.nsteptoken);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				$(".alert-success").hide();
				$("#msg-success").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
			
			
			
			/*if(chosen)
			{
				setTimeout(function(){
					//$('select').chosen({width:"100%"});
					$('select:not(.csAct)').chosen("destroy").chosen({width:"100%"});
					
					//getPetAdvocateInAutoSearch();
					getAdvocateInAutoSearch();
					//alert('getResAdvocateInAutoSearch');
					//getExtraPartyAdvocateInAutoSearch();

					//getPetOrganisationInAutoSearch();
				    //getResOrganisationInAutoSearch();
					//getExtraPartyOrganisationInAutoSearch();				

					//getActInAutoSearch();
					
					$("#fpet_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					$("#fres_salutation_chosen").each(function() {
						$(this).attr('style', 'width: 20%;text-align:left');
					})
					fadeout();
				},300);
			}*/
			
		}
	});
}
function ajaxCallreadPDF(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#__csrf_magic').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var result= [];
	if(jsonobj.chosen==false)
		objchosen={chosen:false};
	else if(jsonobj.chosen==true)
		objchosen={chosen:true};
	else if(typeof jsonobj['chosen'] == 'undefined')
		objchosen={chosen:false};
	if(typeof jsonobj['dataType'] == 'undefined')
		jsondataType='json';
	else
		jsondataType=jsonobj.dataType;

	if(typeof jsonobj['loader'] == 'undefined')
		objloader={loader:true};
	else
		objloader=jsonobj.loader;
	if(objloader)
		fadein();
	//return false;
	var chosen=objchosen.chosen;
	//alert(chosen)
	var estCode = $("#selEstablishment").val();
	//alert(estCode)
	if(estCode!='' && estCode!=undefined)
	{
		var myarr = estCode.split("~");
		var stateCode = myarr[0];
		var distCode = myarr[1];
		var estCode = myarr[2];
	}
	
	
	
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&__csrf_magic='+token,
		//contentType : 'application/pdf',
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
			//errorAlert(responseArray[0]);
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#__csrf_magic').val(responseArray[1]);
			else
				$('#__csrf_magic').val(token);
			/*setTimeout(function(){
				$(".alert-danger").hide();
				$("#msg-danger").html('');
				//$(".alert-dismissible").alert('close');
			},10000);*/
		
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
				//if(chosen && url != restricted_url && url != restricted_url1)
	   			
	   	},
		success:function( result ) {
			//alert('aaa'+result.nsteptoken)
			//alert('out')
			
			//if(url != restricted_url && url != restricted_url1){
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
				//$(".alert-danger").show();$("#msg-danger").html(result.errormsg);
				errorAlert(result.errormsg);
				result['status']=false;
				callback(result);
			}
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
			{
				//alert(result.msg)
				//$(".alert-success").show();
				//$("#msg-success").html(result.msg);
				successAlert(result.msg);
			}
			result['status']=true;
			callback(result);
			$('#__csrf_magic').val(result.nsteptoken);
			
			
		}
	
	});
}


function showDashboardPdfFile(filePath, docpath, pdfcallbk)
{
	var postdata="filePath="+filePath+"&docpath="+docpath;
	var url="custom_component/readDashboardPdfFile";
	ajaxCallreadPDF({url:url,postdata:postdata,callback:callbackST,connection:'N',loader:false});
	function callbackST(result)
	{
		pdfcallbk(result)
	}
}

function showPdfFile(filePath,pdfcallbk)
{
	var postdata="filePath="+filePath;
	var url="custom_component/readPdfFile";
	ajaxCallreadPDF({url:url,postdata:postdata,callback:callbackST,connection:'N',loader:false});
	function callbackST(result)
	{
		//alert(result.outputFile);
		pdfcallbk(result)
		//$('#'+elementId).attr("data",result.outputFile);
	}

}

var myModal ='';
function fadein()
{
 /*
 myModal = new bootstrap.Modal(document.getElementById('loadMe'), {
	  backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
});
myModal.show();
*/
	setTimeout(function() {$("#loadMe").modal('show');}, 10);
}

function fadeout()
{
	 /*
	setTimeout(function() {$("body").css("overflow","auto")}, 300);	
	setTimeout(function() {$(".modal-backdrop").remove();}, 50);
	$(".modal-backdrop").remove();
	$("body").css("overflow","auto");
	myModal.hide();
	*/
	$("#loadMe").removeClass("show");
	$("#loadMe").removeClass("fade");
	$("#loadMe").addClass("hide");
	//$("#loadMe").modal('hide');
	setTimeout(function() {$("#loadMe").modal('hide');}, 10);
}

function closeModel(obj)
{
	var modal_id=obj.modal_id;
	var clear_data=obj.clear_data_id;
	//alert(clear_data);
	if(clear_data!='' && clear_data!=undefined)
		$("#"+clear_data).html('');
	
	$("#"+modal_id).modal("hide");
	$("#"+modal_id).removeClass("show");
	$("#"+modal_id).removeClass("fade");
	$("#"+modal_id).addClass("hide");
	$(".xdsoft_datetimepicker").hide();
	$('.popover').popover('hide');
	
}

function get_age(birthDateObj) {
   //var diff_ms = Date.now() - dob.getTime();
   // var age_dt = new Date(diff_ms);
    //return Math.abs(age_dt.getUTCFullYear() - 1970);
	
    let today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
	//console.log(today.getFullYear() +'-'+ birthDateObj.getFullYear());
    
    // Adjust if the birthday hasn't occurred yet this year
    let monthDiff = (today.getMonth()+1) - birthDateObj.getMonth();
	//console.log((today.getMonth()+1) +' === '+ birthDateObj.getMonth());
    let dayDiff = today.getDate() - birthDateObj.getDate();
   // alert(monthDiff);
    if (monthDiff >=1) {
        age--;
    }
    return age;
}
function datePickerIcon(mydate, maxDate1, minDate1)
{
    var base_url = $('#base_url').val();

    if (!minDate1) {
        minDate1 = new Date('1900-01-01');
    }

    $('#' + mydate).datepicker({

    beforeShow: function (input, inst) {

        setTimeout(function () {

            // Make calendar accessible dialog
            $('#ui-datepicker-div').attr({
                role: 'dialog',
                'aria-modal': 'true',
                'aria-label': 'Calendar Date Picker'
            });

            // Move focus to selected date
            let $active = $('#ui-datepicker-div td a.ui-state-active');

            if (!$active.length) {
                $active = $('#ui-datepicker-div td a').first();
            }

            $active.focus();

        }, 10);
    },

    onClose: function (date, datepicker) {

        // Return focus to input
        $('#' + mydate).focus();

        if (date !== "") {
            var bdate  = date.split("-");
            var bday   = bdate[0];
            var bmonth = bdate[1] - 1;
            var byear  = bdate[2];
            var my_age = get_age(new Date(byear, bmonth, bday));

            if (datepicker.id === "fpet_dob") {
                $('#fextra_age').val(my_age);
            }
            if (datepicker.id === "fpet_dob1") {
                $('#fextra_age1').val(my_age);
            }
            if (datepicker.id === "fpet_dob_lh") {
                $('#fextra_age_lh').val(my_age);
            }
        }
    },

    dateFormat: 'dd-mm-yy',
    changeMonth: true,
    changeYear: true,
    showOtherMonths: true,
    selectOtherMonths: true,

    showOn: "button",
    buttonImage: base_url + "/jquery-date/images/calendar.gif",
    buttonImageOnly: true,
    buttonText: "Open calendar",

    maxDate: maxDate1,
    minDate: minDate1,
    yearRange: "-100:+2"
});

    /*  Accessibility FIX for calendar icon */
    setTimeout(function () {

        var $btn = $('#' + mydate)
            .next('.ui-datepicker-trigger');

        if ($btn.length) {

            $btn.attr({
                tabindex: '0',
                role: 'button',
                'aria-label': 'Open calendar'
            });

            // Keyboard support: Enter / Space
           $btn.on('keydown', function (e) {

				if (e.key === 'Enter' || e.key === ' ') {

					e.preventDefault();
					e.stopPropagation();

					$('#' + mydate).datepicker('show');

				}

			});
        }

        /*  Allow keyboard users to open calendar from input */
        $('#' + mydate).on('keydown', function (e) {
            if (e.altKey && e.key === 'ArrowDown') {
                $(this).datepicker('show');
            }
        });

    }, 300);
}


function datePicker_Icon(mydate,maxDate1,minDate1)
{
 
	if(minDate1=='' || minDate1==undefined)
		minDate1=new Date('15-08-1947'); 	  //minDate1='15-08-1947';
   $('#'+mydate).datepicker({
		
	// defaultDate: new Date(2014, February 2015'), 
	  dateFormat: 'dd-mm-yy',
	  changeMonth: true,
	  changeYear: true,
	  // beforeShowDay: editDays,
	  showOtherMonths: true,
	  selectOtherMonths: true,
	  showOn: "button",
	  buttonImage: "jquery-date/images/calendar.gif",
	   buttonImageOnly: true,
	  // maxDate: maxDate1,
	  minDate: minDate1,
	  yearRange: "-100:+2",
	}).next('img.ui-datepicker-trigger').attr('tabIndex', "-1");;
}

function editDays(date) 
{

    for (var i = 0; i < disabledDates.length; i++) 
    {

		var hdate=disabledDates[i].split('~');
		var expireDateArr=hdate[0].split("-");
		
		
		var expireDate = new Date(expireDateArr[2], expireDateArr[1]-1, expireDateArr[0]);
        if (expireDate.toString() == date.toString()) { 
				
             return [true, "Highlighted", hdate[1]];

        }
    }
         return [true, '', ''];

 } 

function compulsaryCheck(str,flag)
{	
	if(flag=='Y')
	{
	
	$('#'+str).rules("add", {
				required: true,  			
				messages    : {
				required    : alerts_array[1],
				}
			});
			setTimeout(function() {$('#'+str).css('background','rgb(229, 247, 254)')}, 300);	
	}
	else if(flag=='N')
	{
	
	
			$('#'+str).rules("add", {
				required: false
			});
			setTimeout(function() {$('#'+str).css('background','white')}, 300);	
			
	}
		
}
function manualCheck(str,msg)
{
	//alert(msg);
	 if(msg=='N')
	{
	
	
			$('#'+str).rules("add", {
				manual_invalid: false,  			
			
			});
			
	}
	else
	{ 
		$('#'+str).rules("add", {
				manual_invalid: true,  			
				messages    : {
				manual_invalid  : msg,
				}
			});
	}
	
		
}

function customizeValidation(str,msg,reg_expr)
{
	
		$('[name="'+str+'"]').rules("add", {
				
				
                cutomize   : true,  
				
                messages    : {	
				
                cutomize    : msg,
			  
                }
		});
		
	
		$.validator.addMethod("cutomize", function( value, element ) {
        var regex = new RegExp(reg_expr);
        var key = value;
		
        if (regex.test(key)) {
           return true;
        }
        return false;
    });
}
function logOut()
{
	var base_url=$('#base_url').val();
	
	var a=confirm('Are you sure you want to logout?')
    if(a)
    	window.location.href=''+base_url+'/?p=login/logOut';
}


function dynamicFormFields(result)
{
	return true;
	var sessid=0;	
	setTimeout(function() {$('#frm :input:enabled:visible:first').focus()}, 500);

	$.each(result.formfieldlength, function(key, val1){	
		if(result.htmltype[key]!=5)
		{
		 $('#'+key).attr('maxlength', val1);
		}
		if(result.bilingual[key]=='Y')
		{
			//$('#'+key).attr('style', 'background:#f2f5A9;');
			$('#'+key).css({"background":"rgba(242, 245, 169, 0.22)"});
		}
	});

	$("#frm").validate();

	$.each(result.formname1, function(key, val1){
		//alert(key+'--'+result.formcompulsory[key])
		if(result.formcompulsory[key]=='Y')
		{

			setTimeout(function() {$('#'+key).css({"background":"rgb(229, 247, 254)"})}, 300);
			setTimeout(function() {$('[name="'+val1+'"]').css({"background":"rgb(229, 247, 254)"})}, 300);	
		}
		//alert(key+'--'+$('#'+key).attr('name')+'=='+val1)
		//alert($('#'+key).attr('name')+'==='+val1)
		if($('#'+key).attr('name')==val1)
		{
	
			

	
	
			if(result.formcompulsory[key]=='Y')
			{	
     	
				$('[name="'+val1+'"]').rules("add", {
				required        : true,                             
					messages        : {
						required    : 'Compulsory Field'
					}
		
				});	 
		
			}
	
			if(result.formtype[key]==1 || result.formtype[key]==13)
			{	
				
				
				
				if(result.htmltype[key]==1)
				{
				   $('[name="'+val1+'"]').rules("add", {
						 digits: true,  
						 onlyzeronotallowed:true,
						messages    : {
							digits    : 'Only digit allowed',
							onlyzeronotallowed:'4 digit year'
							//onlyzeronotallowed:'only zero is not allowed'
						}
					});
				 }
			   
				 else
				 {
					
					 $('[name="'+val1+'"]').rules("add", {
						 digits: true,  
						// onlyzeronotallowed:true,
						messages    : {
							digits    : 'Alert id 2',
							//onlyzeronotallowed:'only zero is not allowed'
						}
					});
				 }
				 if( result.formtype[key]==13)
				 {
				   $('[name="'+val1+'"]').rules("add", {
						 range: [1, 32767],
						
						messages    : {
							range    : 'Alert id 257',
							//range    : 'value out of range',
							
						}
					});
				
				 }
				



			 }
			 else if(result.formtype[key]==2)
			 {	
			
			 $('[name="'+val1+'"]').rules("add", {
						float1   : true,                             
						messages    : {
							float1    : 'Alert id 30'
						}
				});
			 }
			 else if(result.formtype[key]==3 && result.bilingual[key]=="Y" && sessid==0)
			 {
				 
				 $('[name="'+val1+'"]').rules("add", {
						
						//validstring :true,
						EngNotAllowed : true,
						noalphabet	:	true,
						specialChars   : true,
						notNumber   : true,  
						//OnlySpecialCharsNotAllowed : true,
						messages    : {	
						
						//validstring : alerts_array[34],
						EngNotAllowed	:'English Not Allowed',
						notNumber    : 'Number Not Allowed',
						noalphabet    : 'Alert id 3',
						specialChars    : 'Alert id 3',
						//OnlySpecialCharsNotAllowed : "only spl char not allowed22"
							
						}
				});
			
			
			 }
			 
			 else if(result.formtype[key]==3 && result.bilingual[key]=="N" && sessid==0)
			 {
				 
				   $('[name="'+val1+'"]').rules("add", {
						
						//validstring :true,
						alphabet	: true,
						specialChars   : true,  
						notNumber   : true, 
						//OnlySpecialCharsNotAllowed : true,
						messages    : {	
						
						//validstring : alerts_array[34],
						notNumber    : 'Number not allowed',
						specialChars    : 'Alert id 3',
						alphabet    : 'Alert id 3',
						//OnlySpecialCharsNotAllowed : "only spl char not allowed22"
							
						}
				});
			
			
			 }


			 else if(result.formtype[key]==3 && result.bilingual[key]=="N" && sessid==1)
			 {
				
				 
				 $('[name="'+val1+'"]').rules("add", {
					 
							EngNotAllowed : true,
							noalphabet	:	true,
							specialChars   : true,
							notNumber   : true,  
							
						messages    : {
							EngNotAllowed	:'Alert id 35',
							notNumber    : 'Alert id 12',
							noalphabet    : 'Alert id 3',
							specialChars    : 'Alert id 3',
							
					   // OnlySpecialCharsNotAllowed : "only spl char not allowed33"
					  
							
						}
				});
			
			
			 }

			 else if(result.formtype[key]==3 && result.bilingual[key]=="Y" && sessid==1)
			 {
				
				 
				 $('[name="'+val1+'"]').rules("add", {
					 
							alphabet	: true,
							specialChars   : true,  
							notNumber   : true, 
							
						messages    : {
							notNumber    : 'Alert id 12',
							specialChars    : 'Alert id 3',
							alphabet    : 'Alert id 3',
					   // OnlySpecialCharsNotAllowed : "only spl char not allowed33"
					  
							
						}
				});
			
			
			 }
	


			else if(result.formtype[key]==15)
			{
		 
				$('[name="'+val1+'"]').rules("add", {
				
				
					alphabet	: true,
					specialChars   : true,  
					notNumber   : true, 
					
					messages    : {	
					
					
						notNumber    : 'Alert id 12',
						specialChars    : 'Alert id 3',
						alphabet    : 'Alert id 3',
					
						
					}
			});
	
	
			}
			else if(result.formtype[key]==4)
			{	
		
		
			
			}



			else if(result.formtype[key]==12 && result.bilingual[key]=="Y" && sessid==0)
			{
		 
				$('[name="'+val1+'"]').rules("add", {
				
					//validstring :true,
					EngNotAllowed : true,
					noalphabet	:	true,
					specialChars   : true,
				   
					//OnlySpecialCharsNotAllowed : true,
					messages    : {	
					
					//validstring : alerts_array[34],
					
					EngNotAllowed	:'Alert id 35',
					noalphabet    : 'Alert id 3',
					specialChars    : 'Alert id 3',
					//OnlySpecialCharsNotAllowed : "only spl char not allowed22"
						
					}
				});
	
	
			}
			else if(result.formtype[key]==12 && result.bilingual[key]=="N" && sessid==0)
			{
			 
				$('[name="'+val1+'"]').rules("add", {
					
					//validstring :true,
					alphabet	: true,
					specialChars   : true,  
					
				   // OnlySpecialCharsNotAllowed : true,
					messages    : {
						//validstring : alerts_array[34],
						
						specialChars    : 'Alert id 3',
						alphabet    : 'Alert id 3',
						//OnlySpecialCharsNotAllowed : "only spl char not allowed11"
					}
				});
		
		
			}



			else if(result.formtype[key]==12 && result.bilingual[key]=="N" && sessid==1)
			{
		 
		 
				$('[name="'+val1+'"]').rules("add", {
				
					//validstring :true,
					EngNotAllowed : true,
					noalphabet	:	true,
					specialChars   : true,
				   
					//OnlySpecialCharsNotAllowed : true,
					messages    : {	
					
					//validstring : alerts_array[34],
					
					EngNotAllowed	:'Alert id 35',
					noalphabet    : 'Alert id 3',
					specialChars    : 'Alert id 3',
					//OnlySpecialCharsNotAllowed : "only spl char not allowed22"
						
					}
				});
	
			}
			else if(result.formtype[key]==12 && result.bilingual[key]=="Y" && sessid==1)
			{
				
				$('[name="'+val1+'"]').rules("add", {
								
						//validstring :true,
						alphabet	: true,
						specialChars   : true,  
						
					   // OnlySpecialCharsNotAllowed : true,
						messages    : {
							//validstring : alerts_array[34],
							
							specialChars    : 'Alert id 3',
							alphabet    : 'Alert id 3',
							//OnlySpecialCharsNotAllowed : "only spl char not allowed11"
						}
				});
		
			
			}

			else if(result.formtype[key]==9)
			{	
				$('[name="'+val1+'"]').rules("add", {
					noNumberAtAll   : true,  
					nospecialChars  : true,     
					messages    : {
						noNumberAtAll     : 'Alert id 38',
						nospecialChars    : 'Alert id 230'
					}
				});
			}
			else if(result.formtype[key]==8)
			{	
				 
				$('[name="'+val1+'"]').rules("add", {
					email   : true,   
					emailchar:true,
					messages    : {
					   email    : 'Invalid email',
					   emailchar: 'Invalid email'
					}
				});
			 }
			 else if(result.formtype[key]==10)
			 {	
					 $('[name="'+val1+'"]').rules("add", {
						urlspecialChars   : true,
					   // notNumber   : true, 
						OnlySpecialCharsNotAllowed : true,
						messages    : {
							urlspecialChars    : 'Alert id 21',
						   // notNumber    : 'Alert id 12'
						   OnlySpecialCharsNotAllowed : "only special charecters not allowed"
						}
				});
			 }

			else if(result.formtype[key]==14)
			{	
		  

				$('[name="'+val1+'"]').rules("add", {
				
					//validstring :true,
					alphabet	: true,
					specialChars   : true,  
					notNumber   : true, 
					//OnlySpecialCharsNotAllowed : true,
					messages    : {	
					
					//validstring : alerts_array[34],
					notNumber    : 'Alert id 12',
					specialChars    : 'Alert id 3',
					alphabet    : 'Alert id 244',
					//OnlySpecialCharsNotAllowed : "only spl char not allowed22"
                    
					}
				});
			}
			else if(result.formtype[key]==5)
			{	
				$('[name="'+val1+'"]').rules("add", {
					time   : true,                             
					messages    : {
						time    : 'Invalid time'
					}
				});
			}


		}
	 
	});
}


$.validator.addMethod("accept", function(value, element, param) {
  return value.match(new RegExp("." + param + "$"));
});
$.validator.addMethod("alphanum", function(value, element) {
  return this.optional(element)|| /^\w+$/i.test(value);
});


$.validator.addMethod("EngNotAllowed", function( value, element ) {
        var regex = new RegExp("^[^a-zA-Z]*$");
        var key = value;
		
        if (regex.test(key)) {
           return true;
        }
        return false;
    });

$.validator.addMethod('time', function(value, element, param) {
    return value == '' || value.match(/^([01][0-9]|2[0-3]):[0-5][0-9]$/) || value.match(/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/);
}, 'Enter a valid time: hh:mm');

$.validator.addMethod("EngAndSpecialCharNotAllowed", function( value, element ) {
        var regex = new RegExp("^[^a-zA-Z<>\";`%!~#$|+%&*=\[\\]\:^{}?]*$");
        var key = value;
		
        if (regex.test(key)) {
           return true;
        }
        return false;
    });
	$.validator.addMethod("OnlySpecialCharsNotAllowed", function( value, element ) {
        
		// var regex = new RegExp("^[0-9@,-./_]*$");
		var regex = new RegExp("^[^0-9][()@,./\-_:]*$");
        var key = value;
		
        if (regex.test(key)) {
           return false;
        }
		else
		{
        return true;
		}
    });
	$.validator.addMethod("CharCheckForSection", function( value, element ) {
        
		 var regexalpha = new RegExp("^[a-zA-Z0-9,()]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) || keyalpha=='') {
           return true;
        }
        return false;
    });


$.validator.addMethod("specialChars", function( value, element ) {
        var regex = new RegExp("^[^<>\";`%!~#$|+%&*=\[\\]\:^{}?]*$");
        var key = value;
		
        if (regex.test(key)) {
           return true;
        }
        return false;
    });


	


	$.validator.addMethod("nospecialChars", function( value, element ) {
        //var regex = new RegExp("^[^<>'\"/;`%!~#$%&*()=\[\\]\:{}?@.,_-]*$");
        var regex = new RegExp("^[a-zA-Z]+$");
        var key = value;

        if (regex.test(key)) {
           return true;
        }
        return false;
    });
	$.validator.addMethod("urlspecialChars", function( value, element ) {
        var regex = new RegExp("^[^<>'\";`%!~#$%&*()=\[\\]\^{}?@,]*$");
        var key = value;
		
        if (regex.test(key)) {
           return true;
        }
        return false;
    });

	$.validator.addMethod("alphabet", function( value, element ) {
        var regexalpha = new RegExp("^[a-zA-Z0-9()@,. -_/\\n]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) || keyalpha=='') {
           return true;
        }
        return false;
    });

	$.validator.addMethod("emailchar", function( value, element ) {
        var regexalpha = new RegExp("^[a-zA-Z0-9@._-]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) || keyalpha=='') {
           return true;
        }
        return false;
    });

	$.validator.addMethod("alphabetnumber", function( value, element ) {
        var regexalpha = new RegExp("^[a-zA-Z0-9,]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) || keyalpha=='') {
           return true;
        }
        return false;
    });

	$.validator.addMethod("noalphabet", function( value, element ) {
        var regexalpha = new RegExp("^[a-zA-Z]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) && keyalpha!='') {
           return false;
        }
        return true;
    });
	$.validator.addMethod("manual_valid", function( value, element ) {       
						 return true;
						});
$.validator.addMethod("manual_invalid", function( value, element ) {       
						 return false;
						});

							
/*
$.validator.addMethod("smallint", function( value, element ) {
        var regexalpha = new RegExp("^(?:[0-5]?[0-9]{1,4}|3[0-4][0-9]{3}|32[0-4][0-9]{2}|327[0-2][0-9]|3276[0-7])$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha)) {
           return true;
        }
        return false;
    });

$.validator.addMethod("date", function(value, element) {

  return this.optional(element) || value.match(/^(?:[0-5]?[0-9]{1,4}|3[0-4][0-9]{3}|32[0-4][0-9]{2}|327[0-2][0-9]|3276[0-7])$/);
  },'smallint');
*/

function hasWhiteSpace(s) {

  return /\s/g.test(s);
}

$.validator.addMethod("notNumber", function(value, element, param) {
                       var reg = /[0-9]/;
					   var regex = new RegExp("^[0-9()@,-./_]*$");
					   var regex1 = new RegExp("^[()@,-./_0-9()@,-./_ ']+( [()@,-./_0-9()@,-./_ ']+)*$");
					    //var regex2 = new RegExp("^[0-9@,./_]+( [0-9']+)*$");

							
						
                      /* if((!isNaN(value) || value.indexOf(' ') >= 0 || regex.test(value)) && value!="" ){
                             return false;
                       }else{
                               return true;
                       }
					 */
					 //if((!isNaN(value) || regex.test(value) || regex1.test(value) || value.indexOf('\\') >= 0) && value!="" )--for not allowing \
						if((!isNaN(value) || regex.test(value) || regex1.test(value) ) && value!="" ){
                             return false;
                       }else{
                               return true;
                       }	

					  

                });



 $.validator.addMethod("Number", function(value, element, param) {
                       var reg =  /^[0-9]+$/;					
                       if (reg.test(value)) {
								return true;
						}
						else
						{
							 return false;
						}

                });

	$.validator.addMethod("onlyzeronotallowed", function(value, element, param) {                     	
		if( value!='')
				{
	
                       if (parseInt(value)>0) {
								return true;
						}
						else
						{
							 return false;
						}
				}
				else
				{
					 return true;
				}

                });






$.validator.addMethod("noNumberAtAll", function(value, element, param) {
                       var reg = /[0-9]/;					
                       if (reg.test(value)) {
								return false;
						}
						else
						{
							 return true;
						}

                });




$.validator.addMethod("validstring", function(value, element, param) {
                       var reg = /(.)\1{2,}/;					
                       if (reg.test(value)) {
								return false;
						}
						else
						{
							 return true;
						}

                });







$.validator.addMethod("date", function(date, element) {
 //              
   /*var regDate = /^(((0[1-9]|[12]\d|3[01])\-(0[13578]|1[02])\-((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\-(0[13456789]|1[012])\-((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\-02\-((19|[2-9]\d)\d{2}))|(29\-02\-((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/;
   if (optional(element) || date.match(regDate))
	{
		return true;
	}
	return false;*/
  return this.optional(element) || date.match(/^(((0[1-9]|[12]\d|3[01])\-(0[13578]|1[02])\-((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\-(0[13456789]|1[012])\-((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\-02\-((19|[2-9]\d)\d{2}))|(29\-02\-((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/);
  });




$.validator.addMethod("float1", function(value, element) {

                       var reg = /^[-+]?\d{0,12}(\.\d{1})?\d{0,2}$/;
                       if (reg.test(value)) {
								return true;
						}
						else
						{
							 return false;
						}

                });

function errorAlert(msg)
{
	$('#successIcon').addClass('d-none');
	$('#errorIcon').removeClass('d-none');
	//$(".alert-danger-cust").show().html(msg);
	
	var alertBox = $(".alert-danger-cust");

	 alertBox.show()
        .html(msg)          // ✅ renders HTML properly
        .attr("tabindex","-1")
        .focus();

	$(".alert-success-cust").hide().html('');
	/*$("#validateError").modal({
	  backdrop: "static", //remove ability to close modal with click
	  keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});*/

	$("#validateError").modal('show');
}
function successAlert(msg)
{
	$('#errorIcon').addClass('d-none');
	$('#successIcon').removeClass('d-none');
	$(".alert-success-cust").show().html(msg);
	$(".alert-danger-cust").hide().html('');
	/*$("#validateError").modal({
	  backdrop: "static", //remove ability to close modal with click
	  keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});*/

	$("#validateError").modal('show');
}

function getEstablishment(){
	var selDist = $('#selDistrict').val();
	//var selState = $('#selState').val();
	var selState = $('#selTagState').val();

	if(!selState){
		alert('Required State');		
		$('#selComponentDistrict').val('');	
		return false;
	}


	if(!selDist){
		alert('Required District.');		
		$('#selComponentEst').val('');	
		return false;
	}
	$('#selComponentDistrict_chosen').next('.error_comp').remove();
	
	var url="custom_component/getDistrictEstablishmentByJSON/";	
	var postdata = "fdistCode="+selDist+"&selState="+selState;
	//alert(postdata);
	function callbackEST(obj){
		//alert(obj.option);
		$('#selEstablishment').html(obj.option);
		$("#selEstablishment").trigger("chosen:updated");	
	}
	ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
}
/*
function feedback()
{
	var base_url=$('#base_url').val();
	$('#fd_body').load(base_url+'/?p=feedback',function(){
    $('#fd_screen').modal({show:true});
	$('#fd_title').html("Your Feedback");
	
	
	});
}
function support()
{
	var base_url=$('#base_url').val();
	$('#fd_body').load(base_url+'/?p=support',function(){
    $('#fd_screen').modal({show:true});
	$('#fd_title').html("Support");
	
	
	});
}*/

function help()
{
	var base_url=$('#base_url').val();
	var controller_name=$('#controller_name').val();
	var func_name=$('#func_name').val();
	ajaxCallNormal({url:'help/index/'+controller_name+'/'+func_name,postdata:'',callback:callbk,connection:'N'});
	function callbk(result)
	{
		$('#fd_title').html("Help");
		$('#fd_body').html(result);
		$('#fd_screen').modal('show');
		$('#fd_dialog').removeClass('modal-md');
		$('#fd_dialog').addClass('modal-lg');
		
	}
	/*
	$('#fd_body').load(base_url+'/?p=help/index/'+controller_name+'/'+func_name,function(){
		
    $('#fd_screen').modal({show:true});
	$('#fd_title').html("Help");
	
	
	});*/
	$('.close').click(function(){
		//alert('aaa')
		$('#fd_body').html('');
	});
}

//==== 24-09-2020
function admin_logout()
{
	var base_url=$('#base_url').val();
	var a=confirm('Are you sure you want to logout?')
    if(a)
    	window.location.href=''+base_url+'/?p=admin/logout';
}
function showVideos(str)
{
    console.log('opened');

    var base_url = $('#base_url').val();
    var controller_name = $('#controller_name').val();
    var func_name = $('#func_name').val();

    // 👉 store globally
    triggerElement = document.activeElement;

    ajaxCallNormal({
        url: 'help/showVideos/' + controller_name + '/' + func_name + '/' + str,
        postdata: '',
        callback: callbk,
        connection: 'N'
    });

    function callbk(result)
    {
        $('#fd_title').html("Video Tutorials");
        $('#fd_body').html(result);
        $('#fd_screen').modal('show');
        $('#fd_dialog')
            .removeClass('modal-md')
            .addClass('modal-lg modal-dialog-scrollable');
    }
}
function showFaqs()
{
    var base_url = $('#base_url').val();

    // 👉 store trigger
    triggerElement = document.activeElement;

    ajaxCallNormal({
        url: 'help/showFaqs',
        postdata: '',
        callback: callbk,
        connection: 'N'
    });

    function callbk(result)
    {
        $('#fd_title').html("FAQS");
        $('#fd_body').html(result);
        $('#fd_screen').modal('show');
        $('#fd_dialog')
            .removeClass('modal-md')
            .addClass('modal-lg modal-dialog-scrollable');
    }
}

function playVideo(path, flg) {
    triggerElement = document.activeElement;

    var str = '<div class="videoWrapper">' +
        '<iframe id="videoFrame" title="eFiling User Manual Video Tutorial" width="560" height="315" src="' + path + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin"></iframe>' +
        '</div>';

    $('#vd_screen').modal('show');
    $('#vd_body').html(str);

    $('#vd_dialog').removeClass('modal-md')
                   .addClass('modal-lg modal-dialog-scrollable');

    $('#vd_screen').on('shown.bs.modal', function () {
        $('#videoFrame').attr('tabindex', '-1').focus();
    });
}

function getAdvocateInAutoSearch() {}
/*function showManual()
{
	var url="help/showManual/";
	var postdata = '';
		
	function callback(result){
				
				//var str='<div class="videoWrapper"><iframe width="100%" height="550" src="'+result.path+'" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen sandbox="allow-scripts allow-same-origin" ></iframe></div>';
				var str='<div class="videoWrapper"><object data="'+result.path+'" height="550" width="100%"></object></div>';
				
				$('#vd_screen').modal('show');
				$('#vd_body').html(str);
				$('#vd_dialog').removeClass('modal-md');
				$('#vd_dialog').addClass('modal-lg');
	}
	ajaxCall({url:url,postdata:postdata,callback:callback,connection:'N',chosen:true});

	$('#vd_screen .close').click(function(){
		//alert('aaa')
		$('#vd_body').html('');
	});
}*/

function showManual() {

    var url = "help/showManual/";
    var postdata = '';

    // 👉 store trigger
    triggerElement = document.activeElement;

    function callback(result) {

        var str = `
            <p>
                <a href="${result.path}" target="_blank" rel="noopener" id="manualDownloadLink">
                    Download the User Manual (PDF)
                </a>
            </p>
            <div class="videoWrapper">
                <object data="${result.path}" type="application/pdf" width="100%" height="550">
                    <p>Your browser does not support PDFs. You can 
                        <a href="${result.path}" target="_blank" rel="noopener">download the PDF here</a>.
                    </p>
                </object>
            </div>
        `;

        $('#vd_screen').modal('show');
        $('#vd_body').html(str);
        $('#vd_dialog')
            .removeClass('modal-md')
            .addClass('modal-lg');
    }

    ajaxCallForManual({ 
        url: url, 
        postdata: postdata, 
        callback: callback, 
        connection: 'N', 
        chosen: true 
    });
}
if (!$.isArray) {
  $.isArray = Array.isArray;
}

if (!$.trim) {
  $.trim = function (str) {
    return (str || "").trim();
  };
}


if (!$.parseJSON) {
  $.parseJSON = JSON.parse;
}

if (!$.now) {
  $.now =  Date.now;
}

if (!$.isNumeric) {
  $.isNumeric = function (value) {
    return typeof value === 'number'
      ? Number.isFinite(value)
      : value !== '' && !Array.isArray(value) && !isNaN(value);
  };
}

if (!jQuery.type) {
    jQuery.type = function(obj) {
        if (obj == null) {
            return obj + "";
        }
        return typeof obj === "object" || typeof obj === "function"
            ? Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
            : typeof obj;
    };
}
if (!$.isFunction) {
    $.isFunction = function (obj) {
        return typeof obj === "function";
    };
}



$('#vd_dialog').on('keydown', function(e) {

    if (e.key === 'Tab') {

        var focusable = $('#vd_dialog')
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

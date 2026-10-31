/*******************************************************************/

function ajaxCall(paramObj)
{
	var callback=paramObj.callback;
	var url=paramObj.url;
	var postdata='';
	var frm='';
	var load=true;
	var datatype='json';
	$('#errSpan1').hide();
	if(paramObj.senddata!==undefined && paramObj.senddata!==null && paramObj.senddata!=='' )
	{
		postdata=paramObj.senddata;
	  /*$.each(paramObj.senddata,function(k,v){
	    senddata+='&'+k+'='+v;
	  });*/
	  
	}
	(paramObj.datatype!==undefined && paramObj.datatype!==null && paramObj.datatype!=='' )
	{
	  datatype=paramObj.datatype;
	}

	if(paramObj.loading!==undefined && paramObj.loading!==null && paramObj.loading!=='')
	{
	  load=paramObj.loading;
	}

     
    $.ajax({
    type: "POST",
    url:  url,
    dataType: "json",
    data:postdata,    
    error: function(jqXHR, textStatus, errorThrown) {
    	//console.log(jqXHR);
      //alert('error'+errorThrown+'--'+jqXHR.responseText);
      errorAlert('<b>Oops....!</b> '+errorThrown+' <b>responseText ::</b> '+textStatus);
      fadeout();
    },
    beforeSend:function()
    { 
        //loading();
		fadein();
    },
    success:function( result ) {
		//closeLoading();
		//if(paramObj.loader)
		fadeout();
		//$(window).scrollTop(0);
		//alert(result.errormsg)
		console.dir(result);
		//alert(result.status);
		if(result.status=='Y')
		{
			if(result.msg!='' && result.msg!=undefined && result.msg!=null)
				$('#errSpan1').show().html("<p align='center' style='color:red;'>"+result.msg+"</p>");
			callback(result);
			
		}
		else
		{
			$('#errSpan1').show().html("<p align='center' style='color:red;'>"+result.msg+"</p>");
			
		}
		setTimeout(function(){fadeout()},500);
		setTimeout(function(){fadeout()},1000);
		}
		  
  	});
      
}

function errorAlert(msg)
{
	$('#successIcon').hide();
	$('#errorIcon').show();
	$(".alert-danger-cust").show().html(msg);
	$(".alert-success-cust").hide().html('');
	$("#validateError").modal({
	  backdrop: "static", //remove ability to close modal with click
	  keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});
}
function successAlert(msg)
{
	$('#errorIcon').hide();
	$('#successIcon').show();
	$(".alert-success-cust").show().html(msg);
	$(".alert-danger-cust").hide().html('');
	$("#validateError").modal({
	  backdrop: "static", //remove ability to close modal with click
	  keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});
}

//************ added on 28/05/2019***********************/

function fadein()
{ 
	//$("form").css("background",'#989898').css("opacity",'0.7');			
	//$(".faded").show();
	$("#loadMe").modal({
      backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
    });
	
	
}
function fadeout()
{ 
	//$("form").show().css("background",'white').css("opacity",'1');
//	$(".fade").hide();
	$(".modal-backdrop").hide();
	///alert('aaa')
	$("#loadMe").modal("hide");

}


function showHighCourt(){
	if(parent.document.getElementById("courtFee_radio").checked==true)
	{
		var courtfeeFlag='Y';
	}
	else
	{
		var courtfeeFlag='N';
	}

	if(parent.document.getElementById("Fine_radio").checked==true)
	{
		var fineFlag='Y';
	}
	else
	{
		var fineFlag='N';
	}

	if(parent.document.getElementById("penalty_radio").checked==true)
	{
		var penaltyFlag='Y';
	}
	else
	{
		var penaltyFlag='N';
	}

	if(parent.document.getElementById("others_radio").checked==true)
	{
		var othersFlag='Y';
	}
	else
	{
		var othersFlag='N';
	}
				
	if(parent.document.getElementById("JudicialDeposit_radio").checked==true)
	{
		var JudicialFlag='Y';
	}
	else
	{
		var JudicialFlag='N';
	}

	function callbackHC(resHC)
	{
		var showHC=resHC.data;
		//alert(showHC);

		if(showHC=='Y')
		{
			$("#hcdc_radio").show();
		}
		else
		{  
			//alert("else1");					
			$("#hcdc_radio").hide();			
		}
		//console.log(resHC);
	}
	var send_str="action_code=showHighCourt&courtfeeFlag="+courtfeeFlag+"&fineFlag="+fineFlag+"&penaltyFlag="+penaltyFlag+"&othersFlag="+othersFlag+"&JudicialFlag="+JudicialFlag;
	//console.log(send_str);
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackHC,loader:false})	
}

function fillDistrict()
{

		var court_sel = $("input[name='courtSelect']:checked").val(); 
	
		$('#sess_dist_code').val("");
		$('#court_complex_code').val("");
		

		var epayOptions = parent.$("input[name='epayOptions']:checked").val();	 
		var state_code_new=document.getElementById('sess_state_code').value;
		var state_code_arr=state_code_new.split('~');
		var state_code=state_code_arr[0];
		state_code = state_code.replace(/\s/g,'');  
		var show_lang_href=state_code_arr[2];
		var show_lang_name=state_code_arr[1];
		var state_web_url=state_code_arr[3];
		var state_web_name=state_code_arr[4];
		var dist_data_list;
		if(state_code!="")
		{
			setScheme(state_code,epayOptions);
		}
	   fun_clear_combo(document.getElementById('court_complex_code'));
	   $("#office_code").html("<option value=''>Select Court </option>");
		$("#office_code2").html("<option value=''>Select Court </option>");
		document.getElementById('court_complex_code').value="";
		if(state_code!=0)
		{	
			var lang_sel='E';
			var show_lang_name='';
			function callbackd(dist_data_list)
			{
				fun_fill_combo(dist_data_list.data,document.getElementById('sess_dist_code'));
				if(court_sel=='HC')
				{
					$("#sess_dist_code").html("<option value='99'>High Court</option>")
					fillCourtComplex();
				}
			}
			var send_str="action_code=fillDistrict&state_code="+state_code+"&epayOptions="+epayOptions+"&court_sel="+court_sel;
			ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackd,loader:false})

		}
		
}
/*******************************************************************/
function show_stock_other_fee(str='')
{
        if(str=='')
        {
                return false;
        }
        var id=str.substring(3);
        if($('#'+str).prop('checked'))
        {
                $('#chk_div_'+id).show();
                $('#hidden_'+id).prop('disabled',true);
                $('#hidden_'+id).val($('#'+id).val());
        }
        else
        {
                $('#chk_div_'+id).hide();              
                $('#hidden_'+id).prop('disabled',true);
                $('#hidden_'+id).val('');
        }
}

function show_anyone_fee(id)
{

         
         if(id=='ck_hcbsawf_fee' && $('#ck_hcbawf_fee').prop('checked'))
        {

               $('#chk_div_hcbawf_fee').hide();
               $('#ck_hcbawf_fee').prop('checked', false);
                $('#hidden_hcbawf_fee').prop('disabled',true);
                $('#hidden_hcbawf_fee').val('');
        }
        if(id=='ck_hcbawf_fee' && $('#ck_hcbsawf_fee').prop('checked'))
        {       
                $('#chk_div_hcbsawf_fee').hide();
              $('#ck_hcbsawf_fee').prop('checked', false);
                $('#hidden_hcbsawf_fee').prop('disabled',true);
                $('#hidden_hcbsawf_fee').val('');
        }

}



function stateEvent()
{

	var court_sel = $("input[name='courtSelect']:checked").val(); 
	//alert(court_sel);
	$('#sess_dist_code').val("");
	$('#court_complex_code').val("");
	$("#Amount_lbf").val('');
	$("#Amount_awf").val('');
	$("#Amount_acwf").val('');
	$("#curancy_id_5").html("");
	$("#curancy_id_4").html("");
	$("#curancy_id_3").html("");
	$("#curancy_id_2").html("");
	$("#curancy_id_1").html("");
	$("#other_amt").hide();
	
	if(court_sel!='HC')
	{
		court_sel='DC';
	}


	var epayOptions = parent.$("input[name='epayOptions']:checked").val();	 
	var state_code_new=document.getElementById('sess_state_code').value;
	var state_code_arr=state_code_new.split('~');
	var state_code=state_code_arr[0];
	state_code = state_code.replace(/\s/g,'');  
	var show_lang_href=state_code_arr[2];
	var show_lang_name=state_code_arr[1];
	var state_web_url=state_code_arr[3];
	var state_web_name=state_code_arr[4];
	var dist_data_list;
	fun_clear_combo(document.getElementById('court_complex_code'));
	fun_clear_combo(document.getElementById('sess_dist_code'));
			//alert("typee=="+epayOptions);
	
	fun_clear_combo(document.getElementById('case_type'));
	resetFields();
	$("#office_code").html("<option value=''>Select Court </option>");
	$("#office_code2").html("<option value=''>Select Court </option>");
	document.getElementById('court_complex_code').value="";

	if(DISABLED_STATE_CODE==state_code && STATE_MAINTAINANCE_MSG=='Y' && PAYMENT_TYPE==epayOptions)
	{
		$("#specific_state_msg").show();	
	}
	else
	{
		$("#specific_state_msg").hide();	
	}		

		if(state_code!=0)
		{	
			var lang_sel='E';
			var show_lang_name='';
                         const state_code1=state_code;
                         const court_sel1=court_sel
			function callbackd(result)
			{
				//console.dir(dist_data_list);
				//return false;
///alert(result.data);     
  
                          if(result.multi_head_flag=='Y')
                          {  
                                     if(state_code1==4)
                                  { 
                                        $("#other_amt").show();
                                        $("#stock_multi_head").hide();
                                  }

                                  if(state_code1==11 && court_sel1=='HC')
                                  {     
                                        $("#stock_multi_head").show();
                                         $('#hcbawf_fee').val(result.hcbawf_fee);
                                        $('#bcwf_fee').val(result.bcwf_fee);
                                        $('#hcbsawf_fee').val(result.hcbsawf_fee);
                                        $('#acwf_fee').val(result.acwf_fee);
                                        $('#hclaawf_fee').val(result.hclaawf_fee);
                                        $('#vakalat_fee').val(result.vakalat_fee);
                                        $('#afidvit_fee').val(result.afidvit_fee);
                                        $('#notary_fee').val(result.notary_fee);

                                        price_in_words_updated($('#bcwf_fee').val(),'#curancy_id_bcwf_fee');
                                        price_in_words_updated($('#hcbawf_fee').val(),'#curancy_id_hcbawf_fee');
                                        price_in_words_updated($('#hcbsawf_fee').val(),'#curancy_id_hcbsawf_fee');
                                         price_in_words_updated($('#acwf_fee').val(),'#curancy_id_acwf_fee');
                                         price_in_words_updated($('#hclaawf_fee').val(),'#curancy_id_hclaawf_fee');
                                           price_in_words_updated($('#vakalat_fee').val(),'#curancy_id_vakalat_fee');
                                         price_in_words_updated($('#afidvit_fee').val(),'#curancy_id_afidvit_fee');
                                        price_in_words_updated($('#notary_fee').val(),'#curancy_id_notary_fee');
                                        $("#other_amt").hide();
                                   }
                                   
                          }
                          else
                          { 
                             $("#stock_multi_head").hide();
                             $("#other_amt").hide();

                          }


				if(document.getElementById("rdoCase").checked == true)
					existingcase='case';
				else
					existingcase='cnr';

				fun_fill_combo(result.fillDistrict,document.getElementById('sess_dist_code'));
				if(court_sel=='HC')
				{
					$("#sess_dist_code").html("<option value='99'>High Court</option>")
					//fillCourtComplex();

					/**** fillEstName ****/
					fun_fill_combo(result.fillEstName,document.getElementById('court_complex_code'));
				}
		/////////////////******pyment type***********////////////////		
			if(epayOptions=='O')
			{	
				if(existingcase=='cnr')
				{
					fun_fill_combo(result.fillPaymentType,document.getElementById('sub_payment_type'));
				}
				else
				{
					fun_fill_combo(result.fillPaymentType,document.getElementById('sub_payment_type'));

				}
			}

				/**** checkstateepayvendor ****/
				if(result.checkstateepayvendor=='Yes')
				{							
					if(existingcase=='cnr') {
						$("#refund_cnr").show();
						$("#refund").hide();
					} else {
						$("#refund").show();
						$("#refund_cnr").hide();
					}
				}
				else
				{
					$("#refund").hide();
					$("#refund_cnr").hide();
				}


				/**** setScheme ****/

				ValueArr=result.setScheme.split("~");  //alert(result.setScheme+ValueArr[0]);
				if(ValueArr[0]=='Y')
				{
					//$("#scheme_title").show();
					//$("#scheme").show();
					$("#scheme_div_cnr").show();
					$("#scheme_div").show();
				}
				else
				{
					//$("#scheme_title").hide();
					//$("#scheme").hide();
					$("#scheme_div_cnr").hide();
					$("#scheme_div").hide();
				}

				if(typeof result === 'string' && result.substring(0,5).toUpperCase()=='ERROR' )
				{
					document.getElementById('errSpan1').style.display="";	
					document.getElementById('errSpan1').innerHTML="<p align='center' style='color:red;'>THERE IS AN ERROR</p>";												
				}									
				else
				{
					document.getElementById('errSpan1').style.display='none';
				}
////////////////////////fillPaymentType/////////////////////
//alert(epayOptions);
	var cnr_num=document.getElementById('cnr_num').value;
	if(cnr_num=='')
	{
		var state_code = document.getElementById('sess_state_code').value;
	}
	else 
	{
		state_code ='';
	}
	//}
	//var epay_type = parent.$("input[name='epayOptions']:checked").val();







//////////////////////////////////////////
			}
			var send_str="action_code=stateEvent&state_code="+state_code+"&epayOptions="+epayOptions+"&court_sel="+court_sel;
///alert(send_str);
			ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackd,loader:false})

		}


}
/*******************************************************************/
function setScheme(state_code,epayOptions)
{
	$.ajax({
		type: "POST",
		url: "index_qry.php",						
		data:"action_code=setScheme&state_code="+state_code+"&epayOptions="+epayOptions,
		success:function( result ) 
		{
				//ValueArr=result.split("~");
				ValueArr=result.status;
				if(ValueArr=='Y')
				{
					//$("#scheme_title").show();
					//$("#scheme").show();
					$("#scheme_div_cnr").show();
					$("#scheme_div").show();
					
				}
				else
				{
					//$("#scheme_title").hide();
					//$("#scheme").hide();
					$("#scheme_div_cnr").hide();
					$("#scheme_div").hide();
				}
				if(typeof result === 'string' && result.substring(0,5).toUpperCase()=='ERROR')
				{
					document.getElementById('errSpan1').style.display="";	
					document.getElementById('errSpan1').innerHTML="<p align='center' style='color:red;'>THERE IS AN ERROR</p>";												
				}									
				else
				{
					document.getElementById('errSpan1').style.display='none';
				}
		}//success close
    });//ajax close
}
/*******************************************************************/


/*******************************************************************/
/*Function checkstateepayvendor is used to check whether state has sbivendor and if vendor is sbi refund policy is shown*/
function checkstateepayvendor()
{
	$("#office_details2").hide();
	$("#office_details").hide();
	$("#office_code").html("<option value=''>Select Office Code </option>");
	$("#office_code2").html("<option value=''>Select Office Code </option>");

	var epayOptions = parent.$("input[name='epayOptions']:checked").val();
	var cnr_num=document.getElementById('cnr_num').value;
	var case_sel = $("input[name='caseSelectCnr']:checked").val(); 
	if(cnr_num=='')
	{
		var state_code = document.getElementById('sess_state_code').value;
	}
	else 
	{
		state_code ='';
	}
	var send_str="action_code=checkstateepayvendor&state_code="+state_code+"&epayOptions="+epayOptions+"&cnr_no="+cnr_num;

	if(epayOptions=='O')
	{
		var payment_type=document.getElementById('sub_payment_type').value;
		send_str+="&payment_type="+payment_type;
	}
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackCheckState})
	function callbackCheckState(result)
	{
		if(result.data=='Yes')
		{							
			if(case_sel=='cnr') {
				$("#refund_cnr").show();
				$("#refund").hide();
			} else {
				$("#refund").show();
				$("#refund_cnr").hide();
			}
		}
		else
		{
			$("#refund").hide();
			$("#refund_cnr").hide();
		}
	}
	
}
/*******************************************************************/

/*******************************************************************/
function fillCourtComplex()
{
	var epayOptions = parent.$("input[name='epayOptions']:checked").val();
	var cnrradio = $("input[name='caseSelectCnr']:checked").val();
        if (cnrradio == 'cnr' && epayOptions=='O') {
                return;
        }

	//alert(epayOptions);
	
	if(epayOptions=='C' || epayOptions=='F')
	{
		var court_sel = $("input[name='courtSelect']:checked").val();
		
	}
	else
	{
		var court_sel='DC';
	}

	//alert("in fillCourtComplex"+court_sel);
	
	var state_code_new=document.getElementById('sess_state_code').value;
	var state_code_arr=state_code_new.split('~');
	var state_code=state_code_arr[0];
	state_code = state_code.replace(/\s/g,'');  
	var show_lang_href=state_code_arr[2];
	var show_lang_name=state_code_arr[1];
	var state_web_url=state_code_arr[3];
	var state_web_name=state_code_arr[4];
	var court_data_list;
	
	var dist_code=document.getElementById('sess_dist_code').value;
	
	fun_clear_combo(document.getElementById('court_complex_code'));
	fun_clear_combo(document.getElementById('case_type'));
	resetFields();
	$("#office_code").html("<option value=''>Select Court </option>");
	$("#office_code2").html("<option value=''>Select Court </option>");
	if(state_code!=0 && dist_code!=0)
	{	
		var lang_sel='E';
		var show_lang_name='';
		function callbackCC(court_data_list)
		{
			fun_fill_combo(court_data_list.data,document.getElementById('court_complex_code'));
		}
		var send_str="action_code=fillEstName&state_code="+state_code+"&dist_code="+dist_code+"&epayOptions="+epayOptions+"&court_sel="+court_sel;
		ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackCC})
		 
	}
	else
	{		
		fun_clear_combo(document.getElementById('court_complex_code'));
		document.getElementById('court_complex_code').value="";
	}
}
/*******************************************************************/

/*******************************************************************/
function hideCnrCaseNoButton()
{
	document.getElementById('rowCnrCase').style.display='';
}
/*******************************************************************/

/*******************************************************************/
function isFloat(value)
{
	ValueArr=value.split(".");
	if(ValueArr[0]=="0")
	{
		$('#errSpan1').show().html("<p align='center' style='color:red;'><strong>Amount Should be greater than zero</strong></p>");				
	}
	else
	{
		document.getElementById('errSpan1').style.display="none";	
	}
}
/*******************************************************************/

/*******************************************************************/
function showstateDistCom()
{
	
	var validator = $("#frm").validate();
	validator.destroy();            
	$("#refund").hide();
	$("#refund_cnr").hide(); 
	if(OTP=='Y')
	{
		document.getElementById('div_otp').style.display='none';
	}
	$("#button_mobile").show();
	$( '#button_mobile').prop('disabled', false);
	$("#button_mobileR").hide();
	$("#btnViewRowC").hide();
	$("#jd_type").hide();
	 var selForm =   $("input[name='caseSelectCnr']:checked").val();
	$(".select_class").removeClass("invalid");
	$(".form-control").removeClass("invalid");
	$("#errSpan1").hide();
	$("#div_redirect").hide();
	$("#party_details").hide();
	$("#order_details").hide();
	$("#displayCaseNo").hide();
	$("#display_case_no").hide();
	$("#party_details1").hide();
	$("#office_details2").hide();
	$("#Amount_lbf").val('');
	$("#Amount_awf").val('');
	$("#Amount_acwf").val('');
	$("#curancy_id_5").html("");
	$("#curancy_id_4").html("");
	$("#curancy_id_3").html("");
	$("#curancy_id_2").html("");
	$("#curancy_id_1").html("");
	$("#other_amt").hide();
	$("#office_details").hide();
	$("#office_code").html("<option value=''>Select Court </option>");
	$("#office_code2").html("<option value=''>Select Court </option>");
	  if(selForm == 'cnr') //New Case
	  {
		  $("#stateDistCom").hide();
		  $('#sess_state_code option').eq(0).prop('selected', true);
		  $('#sess_dist_code option').eq(0).prop('selected', true);
		  $('#court_complex_code option').eq(0).prop('selected', true);
		  fun_clear_combo(document.getElementById('sess_dist_code'));
		  fun_clear_combo(document.getElementById('case_type'));
		  fun_clear_combo(document.getElementById('scheme_code2'));			
			$("#scheme_div_cnr").hide();
			fun_clear_combo(document.getElementById('scheme_code'));			
			$("#scheme_div").hide();

		  $("#party_no").val('');
		  $("#amount").val('');
		  $("#mobile").val('');
		  $("#case_no").val('');
		 // $("#case_type").val('');
		   $("#case_year").val('');
		   $("#case_no1").hide();
			 $('#cnr_no').show(); 
			 //******pradnya***********/
			 $("#cnr_id").show();
			 $("#state_id").hide();
			 //********* pradnya***********/
			 $("#party_details1").hide();
			$("#rdoCnr").attr('checked', true);
		   $("#rdoCase").attr('checked', false);
		   $("#rdoOld").attr('checked', true);
	  }
	   if(selForm == 'case') //New Case
	   {
			$('#sess_state_code option').eq(0).prop('selected', true);
			$('#sess_dist_code option').eq(0).prop('selected', true);
			$('#court_complex_code option').eq(0).prop('selected', true);		
			fun_clear_combo(document.getElementById('court_complex_code'));
			fun_clear_combo(document.getElementById('sess_dist_code'));
			fun_clear_combo(document.getElementById('case_type'));
			fun_clear_combo(document.getElementById('scheme_code2'));			
			$("#scheme_div_cnr").hide();
			fun_clear_combo(document.getElementById('scheme_code'));			
			$("#scheme_div").hide();


			$("#stateDistCom").show();
			$("#cnr_num").val('');
			//$("#case_type").val('');
			$("#mobile").val('');
			$("#amount").val('');
			$("#party_no").val('');
			$("#case_no").val('');
			$("#case_year").val('');
			
			$("#case_no1").show();
		    $("#cnr_no").hide();
		 // ******added on 4/2/2019--- p*************/
				$("#cnr_id").hide();
				$("#state_id").show();
		//***********************/
			$("#case_num_lbl").html('Case Number');
			$("#case_no").attr("placeholder", "Case Number");
			$("#rdoCnr").attr('checked', false);
			$("#rdoCase").attr('checked', true);
			$("#rdoFiling").attr('checked', false);
			$("#rdoOld").attr('checked', true);
	  }
	  if(selForm == 'filing') //New Case
	  {
			$('#sess_state_code option').eq(0).prop('selected', true);
			$('#sess_dist_code option').eq(0).prop('selected', true);
			$('#court_complex_code option').eq(0).prop('selected', true);
			fun_clear_combo(document.getElementById('court_complex_code'));
			fun_clear_combo(document.getElementById('sess_dist_code'));
			fun_clear_combo(document.getElementById('case_type'));
			$("#stateDistCom").show();
			$("#cnr_num").val('');
			//$("#case_type").val('');
			$("#mobile").val('');
			$("#amount").val('');
			$("#party_no").val('');
			$("#case_no").val('');
			$("#case_year").val('');
			$("#case_no1").show();
			$("#cnr_no").hide();
			$("#case_num_lbl").html('Filing Number');
			$("#case_no").attr("placeholder", "Filing Number");
			$("#rdoCnr").attr('checked', false);
			$("#rdoCase").attr('checked', false);
			$("#rdoFiling").attr('checked', true);
			$("#rdoOld").attr('checked', true);
	  }
		$('#paybutton').attr('disabled',true);
		$("#amount").prop('disabled', true);
}
/*******************************************************************/

/*******************************************************************/
function showstateDistComCourtFee()
{
	generate_otp();
	var selForm = $("input[name='caseSelectCnr']:checked").val();
	$('#frm')[0].reset(); //reset form to reset the state of form
	if($('#frm').valid()){
		var validator = $("#frm").validate();
		validator.destroy();		
	}
	$(".select_class").removeClass("invalid");
	$(".form-control").removeClass("invalid");
	$("#party_details").hide();
	$("#order_details").hide();
	$("#displayCaseNo").hide();
	  if(selForm == 'cnr') //New Case
	  {
		  $("#stateDistCom").hide();
		  $('#sess_state_code option').eq(0).prop('selected', true);
		  $('#sess_dist_code option').eq(0).prop('selected', true);
		  $('#court_complex_code option').eq(0).prop('selected', true);
			fun_clear_combo(document.getElementById('court_complex_code'));
			fun_clear_combo(document.getElementById('sess_dist_code'));
			fun_clear_combo(document.getElementById('case_type'));
			

		  $("#party_no").val('');
		  $("#amount").val('');
		  $("#mobile").val('');
		  $("#case_no").val('');
		  //$("#case_type").val('');
		  $("#case_year").val('');
		  $("#case_no1").hide();
		  $('#cnr_no').show();
		  $("#party_details1").hide();
		  $("#rdoCnr").attr('checked', true);
		  $("#rdoCase").attr('checked', false);
		  $("#rdoFiling").attr('checked', false);
		  $("#rdoOld").attr('checked', true);
	  }
	  if(selForm == 'case') //New Case
	  {
		   $('#sess_state_code option').eq(0).prop('selected', true);
		   $('#sess_dist_code option').eq(0).prop('selected', true);
		   $('#court_complex_code option').eq(0).prop('selected', true);
		   fun_clear_combo(document.getElementById('court_complex_code'));
			fun_clear_combo(document.getElementById('sess_dist_code'));
			fun_clear_combo(document.getElementById('case_type'));
			
		   $("#stateDistCom").show();
		   $("#cnr_num").val('');
		   //$("#case_type").val('');
		   $("#mobile").val('');
		   $("#amount").val('');
		   $("#party_no").val('');
		   $("#case_no1").show();
		   $("#cnr_no").hide();
		   $("#case_num_lbl").html('Case Number');
		   $("#case_no").attr("placeholder", "Case Number");
		   $("#rdoCnr").attr('checked', false);
		   $("#rdoCase").attr('checked', true);
		   $("#rdoFiling").attr('checked', false);
		   $("#rdoOld").attr('checked', true);
	  }
	  if(selForm == 'filing') //New Case
	  {
		  $('#sess_state_code option').eq(0).prop('selected', true);
		  $('#sess_dist_code option').eq(0).prop('selected', true);
		  $('#court_complex_code option').eq(0).prop('selected', true);
		  fun_clear_combo(document.getElementById('court_complex_code'));
			fun_clear_combo(document.getElementById('sess_dist_code'));
			fun_clear_combo(document.getElementById('case_type'));

		  $("#stateDistCom").show();
		  $("#cnr_num").val('');
		  //$("#case_type").val('');
		  $("#mobile").val('');
		  $("#amount").val('');
		  $("#party_no").val('');
		  $("#case_no1").show();
		  $("#cnr_no").hide();
		  $("#case_num_lbl").html('Filing Number');
		  $("#case_no").attr("placeholder", "Filing Number");
		  $("#rdoCnr").attr('checked', false);
		  $("#rdoCase").attr('checked', false);
		  $("#rdoFiling").attr('checked', true);
		  $("#rdoOld").attr('checked', true);
	  }
	  $('#paybutton').attr('disabled',true);
}
/*******************************************************************/

/*******************************************************************/
function funOnComplexChange()
{
	resetFields();
	if(parent.document.getElementById('courtFee_radio').checked==true)
	{		
		//fillScheme();
	}
	if(parent.document.getElementById('others_radio').checked==true)
	{		
		 fillScheme();
	}
	var selForm = $("input[name='caseSelectCnr']:checked").val();
	  if(selForm == 'case' || selForm == 'filing') 
	  {
		  fillCaseType();
	  }
}
/*******************************************************************/

/*******************************************************************/
function isNumber(evt) 
{
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}
/*******************************************************************/

/*******************************************************************/
function isDecimal(evt, ele) 
{
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
	if(charCode == 46){
		if(ele.value.indexOf('.') >1){
			return false;
		}else{
			return true;
		}
	}	
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }	
    return true;
}
/*******************************************************************/

/*******************************************************************/
function isAlph(evt, ele) 
{
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if ((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || charCode == 32) {
        return true;
    }
	else
	{
		return false;
	}
}
/*******************************************************************/

/*******************************************************************/
function showJudgeName(cnr_no,selcase)
{
	send_str="cino="+cnr_no;
	send_str+="&action_code=showJudgeName";
	function callbackShowJud(result)
	{
		var resultdata=result.data;
		var resultArr=resultdata.split('~');
		if(selcase=='cnr')
		{
			$('label[for="displayCaseNocase"]').show();
			$("#displayCaseNocase").show();
		}
		else if(selcase=='case')
		{
			$('label[for="displayCaseNocase"]').hide();
			$("#displayCaseNocase").hide();
			
		}
		$("#displayCaseNo").show();
		$("#displayCourtNo").html(resultArr[0]);
		$("#displayCourtName").html(resultArr[1]);
	}
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackShowJud});
}
/*******************************************************************/

//************pradnya************************************************/

function checkInconsistency()
{
	var cnr_no= $("#cnr_num").val();
	var epay_type = parent.$("input[name='epayOptions']:checked").val();	 

    //alert("hi"+cnr_no);
	send_str="cnr_no="+cnr_no+"&epay_type="+epay_type;
	send_str+="&action_code=checkInconsistency";
	if(cnr_no!="")
	{
		function callbackShowJud(result)
		{
			var msg=result.msg;
			//alert(msg);
			if($.trim(msg)!='')
			{

			}
			
			/*$("#displayCaseNo").show();
			$("#displayCourtNo").html(resultArr[0]);
			$("#displayCourtName").html(resultArr[1]);*/
		}
		ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackShowJud});
	}

}

//******************************************************************//



function showHideOthers()
{ //to hide others tab if no state is enable for others
	send_str="&action_code=showHideOthers";
	function  callbackshowHideOthers(result)
	{
		//alert(result.data);
		if(result.data=='Y')
		{			
			$("#othersLabel").show();
		}
		else
		{
			$("#othersLabel").hide();
		}
	}
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackshowHideOthers});
}


/*function chk_amount(amount)
{
	var epay_type = parent.$("input[name='epayOptions']:checked").val();	
	var cnr_num=document.getElementById('cnr_num').value;
	if(cnr_num=='')
	{
		var state_code = document.getElementById('sess_state_code').value;		
	}
	else 
	{
		
		var national_state_code=cnr_num.substr(0, 2);
		if(national_state_code=='HP')
		{
			var state_code =5;
		}
	}
	
	if(state_code!=5)
	{
		if(amount > 2000)
		{
			alert("As per request, payment of fine over and above 2000/- through Debit Card is restricted. You may contact concerned High Court for further queries.");
			$("#amount").val('');

		}
	}
}*/

function chk_amount(amount)
{	
	var epayOptions = parent.$("input[name='epayOptions']:checked").val();
	var cnr_num=document.getElementById('cnr_num').value;
	var case_sel = $("input[name='caseSelectCnr']:checked").val(); 
	if(cnr_num=='')
	{
		var state_code = document.getElementById('sess_state_code').value;
	}
	else 
	{
		state_code ='';
	}
	var send_str="action_code=chk_amount&state_code="+state_code+"&amount="+amount+"&epayOptions="+epayOptions+"&cnr_no="+cnr_num;
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackChk_amount});

	function callbackChk_amount(result)
	{
		if(result!="")
		{
			if(result.msg!='')
			{				
				$('#errSpan1').show().html("<p align='center' style='color:red;'><strong>"+result.msg+"</strong></p>");				
			}
			else
			{
				document.getElementById('errSpan1').style.display="none";	
			}
		}
		else
		{
			document.getElementById('errSpan1').style.display="none";	
		}
	}
	
}


function ShowCourtForm(court)
{// show form according to hc and dc
	//alert(court);
	var epayOptions = parent.$("input[name='epayOptions']:checked").val();
        $('#stock_multi_head').hide();	
	$('#jd_ddo_div').hide();

	if(court=='HC')
	{
		$("#dist_div").hide();
		$("#state_name").html('High Court');
		$("#est_name").html('Bench');
		$("#court_complex_code").html("<option value=''>Select Bench Name</option>");
	}
	else
	{
		$("#dist_div").show();
		$("#state_name").html('State');
		$("#est_name").html('Establishment');
		$("#court_complex_code").html("<option value=''>Select Establishment Name</option>");
	}
	fun_clear_combo(document.getElementById('court_complex_code'));
	fun_clear_combo(document.getElementById('sess_dist_code'));
	fun_clear_combo(document.getElementById('case_type'));
	fun_clear_combo(document.getElementById('party_no'));
	fun_clear_combo(document.getElementById('scheme_code2'));			
	$("#scheme_div_cnr").hide();
	fun_clear_combo(document.getElementById('scheme_code'));			
	$("#scheme_div").hide();
	//$("#sess_dist_code").html("<option value='0'>Select District</option>");
	$("#sess_state_code").val('');
	//$("#case_type").html("<option value=''>Select Case Type</option>");
	//$("#party_no").html("<option value=''>Select Party </option>");
	$("#case_no").val('');
	$("#cnr_num").val('');
	$("#office_details2").hide();
	$("#office_details").hide();
	$("#Amount_lbf").val('');
	$("#Amount_awf").val('');
	$("#Amount_acwf").val('');
	$("#curancy_id_5").html("");
	$("#curancy_id_4").html("");
	$("#curancy_id_3").html("");
	$("#curancy_id_2").html("");
	$("#curancy_id_1").html("");
	$("#other_amt").hide();
	$("#office_code").html("<option value=''>Select Court </option>");
	$("#office_code2").html("<option value=''>Select Court </option>");
	$("#case_year").val('');
	$("#Amount").val('');
	$("#amount").val('');
	$("#PartyName").val('');
	$("#party_details1").hide();
	$("#displayCaseNo").hide();
	
	$("#mobile").val('');
	$("#btnViewC").hide();
	$("#rdoNew").prop('checked',true);
	$("#amount").prop('disabled', true);
	$("#Amount").prop('disabled', true);

	if(epayOptions=='C')
	{
		ShowCourtFeeForm();
	}
	fillState(court);
}



function fillState(court_sel)
{
		if(parent.document.getElementById("courtFee_radio").checked==true)
		{
			var courtfeeFlag='Y';
		}
		else
		{
			var courtfeeFlag='N';
		}

		if(parent.document.getElementById("Fine_radio").checked==true)
		{
			var fineFlag='Y';
		}
		else
		{
			var fineFlag='N';
		}

		if(parent.document.getElementById("penalty_radio").checked==true)
		{
			var penaltyFlag='Y';
		}
		else
		{
			var penaltyFlag='N';
		}

		if(parent.document.getElementById("others_radio").checked==true)
		{
			var othersFlag='Y';
		}
		else
		{
			var othersFlag='N';
		}
					
		if(parent.document.getElementById("JudicialDeposit_radio").checked==true)
		{
			var JudicialFlag='Y';
		}
		else
		{
			var JudicialFlag='N';
		}	
	var send_str="action_code=fillState&court_sel="+court_sel+"&courtfeeFlag="+courtfeeFlag+"&fineFlag="+fineFlag+"&penaltyFlag="+penaltyFlag+"&othersFlag="+othersFlag+"&JudicialFlag="+JudicialFlag;
	ajaxCall({url:'index_qry.php',senddata:send_str,callback:callbackfillState});

	function callbackfillState(result)
	{
		if(result.data!="")
		{
			$("#sess_state_code").html(result.data);
		}
		else
		{
			document.getElementById('errSpan1').style.display="none";	
		}
	}
	
}

    function price_in_words_updated(price, targetId) {

        $(targetId).html("");
        if (price === '') {
            return;
        }
        var sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
            dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"],
            tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"],
            handle_tens = function (dgt, prevDgt) {
                return dgt === 0 ? "" : " " + (dgt === 1 ? dblDigit[prevDgt] : tensPlace[dgt]);
            },
            handle_utlc = function (dgt, nxtDgt, denom) {
                return (dgt !== 0 && nxtDgt !== 1 ? " " + sglDigit[dgt] : "") + (nxtDgt !== 0 || dgt > 0 ? " " + denom : "");
            };

        var str = "",
            digitIdx = 0,
            digit = 0,
            nxtDigit = 0,
            words = [];

        var parts = price.split('.');
        var rupees = parts[0];
        var paise = parts.length > 1 ? parts[1] : '0';

        if (isNaN(parseInt(rupees)) || isNaN(parseInt(paise))) {
            str = "";
            $(targetId).html("");
        } else {
            if (parseInt(rupees) > 0 && rupees.length <= 10) {
                for (digitIdx = rupees.length - 1; digitIdx >= 0; digitIdx--) {
                    digit = rupees[digitIdx] - 0;
                    nxtDigit = digitIdx > 0 ? rupees[digitIdx - 1] - 0 : 0;
                    switch (rupees.length - digitIdx - 1) {
                        case 0:
                            words.push(handle_utlc(digit, nxtDigit, ""));
                            break;
                        case 1:
                            words.push(handle_tens(digit, rupees[digitIdx + 1]));
                            break;
                        case 2:
                            words.push(0 !== digit ? " " + sglDigit[digit] + " Hundred" + (0 !== rupees[digitIdx + 1] && 0 !== rupees[digitIdx + 2] ? " and" : "") : "");
                            break;
                        case 3:
                            words.push(handle_utlc(digit, nxtDigit, "Thousand"));
                            break;
                        case 4:
                            words.push(handle_tens(digit, rupees[digitIdx + 1]));
                            break;
                        case 5:
                            words.push(handle_utlc(digit, nxtDigit, "Lakh"));
                            break;
                        case 6:
                            words.push(handle_tens(digit, rupees[digitIdx + 1]));
                            break;
                        case 7:
                            words.push(handle_utlc(digit, nxtDigit, "Crore"));
                            break;
                        case 8:
                            words.push(handle_tens(digit, rupees[digitIdx + 1]));
                            break;
                        case 9:
                            words.push(0 !== digit ? " " + sglDigit[digit] + " Hundred" + (0 !== rupees[digitIdx + 1] || 0 !== rupees[digitIdx + 2] ? " and" : " Crore") : "");
                    }
                }
                str = words.reverse().join("");
            }


            if (paise !== '') {
                if (paise.length === 1) {
                    paise += '0'; // Padding with zero if only one digit
            }
                if (paise.length > 2) {
                    paise = paise.substring(0, 2); // Take only first two digits
                }
                var paise_in_word=[];
                for (digitIdx = paise.length - 1; digitIdx >= 0; digitIdx--) {
                    digit = paise[digitIdx] - 0;
                    nxtDigit = digitIdx > 0 ? paise[digitIdx - 1] - 0 : 0;
                    switch (paise.length - digitIdx - 1) {
                        case 0:
                            paise_in_word.push(handle_utlc(digit, nxtDigit, ""));
                            break;
                        case 1:
                            paise_in_word.push(handle_tens(digit, paise[digitIdx + 1]));
                            break;
                        }
                }
                paise_in_word=paise_in_word.reverse().join("");
                if(paise_in_word!='')
                {
                        str += " and " + paise_in_word + " Paise";
                }
            }

            $(targetId).html("Rupees " + str + " Only");
        }
    }
function checkPartyNameLength() {
    var text = $('#party_no').find('option:selected').text();
    if (text.length > 50) {
        $('#party_error').text('Note:- For payment, only the first 50 characters will be used.');
        text = text.substring(0, 50);
    } else {
        $('#party_error').text('');
    }
}
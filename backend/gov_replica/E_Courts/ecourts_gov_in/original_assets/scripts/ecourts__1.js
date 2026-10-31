
console.clear();


$(document).ready(function() {

$(document).on('click',function(){
		setTimeout(function(){$('label.error').hide()},5000);
});
	//location.reload(true);

	/*$('#dropdownMenuButton1').on('click', function (event) {
		$(this).toggleClass('show');
		 $('.mtpdropdown-menu.dropdown-menu').toggleClass('show');
	});
		$('#dropdownMenuButton2').on('click', function (event) {
		$(this).toggleClass('show');
		 $('.dropdown-menudrp.dropdown-menu').toggleClass('show');
	}); */

	$(".sidebarULBtn").on('click', function() {
		$(".sidebarULBtn").removeClass("active");
		$( this ).addClass("active");
	});

    $("#smallSidebar").on('click', function() {
		$(".sidebarULBtn").removeClass("collapsing");
        $("#mainContainer").toggleClass("sidebar-collapsed");
		
		var flg='N';
		if($('#mainContainer').hasClass('sidebar-collapsed'))
		{
			flg='Y';
			$('.collapse').removeClass('show');
		}
		else
		{
			var level1=$('#level1').val();
			$('#level1_'+level1).click();
		}
		

		var url="home/setMenu/"+flg;
		var postdata='';
		ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
		function callback(result)
		{
			
		}
    });

	
  $.ajaxSetup({ cache: true });
  //$('select').chosen({'width':'100%'});
  $.validator.setDefaults({ ignore: ":hidden:not(select)" });

  
	
	noBack();
	//window.history.back();
	/*document.onmousedown=disableclick;
	status="Right Click is not allowed";
	
    $(document).on("keydown", disableF5);
	*/
	/*var sidebar=localStorage.getItem("sidebar");
	//alert(sidebar+'=='+$( "#accordionSidebar" ).hasClass( "toggled" ))
	if(sidebar=='Y')
		$('#accordionSidebar').addClass('toggled');
	else
		$('#accordionSidebar').removeClass('toggled');*/
	if($('#mainContainer').hasClass('sidebar-collapsed'))
	{
		$(document).on('click',function(){
		$('.collapse').removeClass('show');
	});
	}
	$('.sidebarULBtn').on('click',function(){
		$('.collapse').removeClass('show');
	});
	
	setToken();
	
	if(!$('#mainContainer').hasClass('sidebar-collapsed'))
	{
		var level1=$('#level1').val();
		
		var link_id=$('#link_id').val();
		$('#level1_'+level1).click();
		
		setTimeout(function(){$('#link_'+link_id).css('background-color','#c2defa')},300);
	}
	
});

function setTopBar(str)
{
	if(str=='D')
	{
		$("header.navbar").removeClass("bg-topthemeLight").addClass("bg-topthemeDark");
	}
	if(str=='L')
	{
		$("header.navbar").removeClass("bg-topthemeDark").addClass("bg-topthemeLight");
	}
	var url="home/setTop/"+str;
	var postdata='';
	ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
	function callback(result)
	{
		
	}
}
function setSideBar(str)
{
	if(str=='D')
	{
		$(".sidebarULBtn").removeClass("collapsing");
        $("#mainContainer").removeClass("sidebar-collapsed");
		
		var flg='N';
		if($('#mainContainer').hasClass('sidebar-collapsed'))
			flg='Y';
		var level1=$('#level1').val();
		$('#level1_'+level1).click();
		
	}
	if(str=='C')
	{
		$(".sidebarULBtn").removeClass("collapsing");
        $("#mainContainer").addClass("sidebar-collapsed");
		
		var flg='N';
		if($('#mainContainer').hasClass('sidebar-collapsed'))
			flg='Y';
		$('.collapse').removeClass('show');
	}
	var url="home/setMenu/"+flg;
	var postdata='';
	ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
	function callback(result)
	{
		
	}
}
function setTheme(str)
{
	if(str=='1')
		$('body').removeClass("bg-theme02").removeClass("bg-theme03").removeClass("bg-theme04");
	else if(str=='2')	
		$('body').removeClass("bg-theme03").removeClass("bg-theme04").addClass("bg-theme02");
	else if(str=='3')	
		$('body').removeClass("bg-theme02").removeClass("bg-theme04").addClass("bg-theme03");
	else if(str=='4')	
		$('body').removeClass("bg-theme02").removeClass("bg-theme03").addClass("bg-theme04");
	var url="home/setTheme/"+str;
	var postdata='';
	ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
	function callback(result)
	{
		
	}
  
}
function openRightMenu() {
	$("#rightMenu").show();
}

function closeRightMenu() {
  $("#rightMenu").hide();
}

function showmodalReport(url)
{
	$('#modal_ifr').modal('show');
	str="<iframe src='"+url+"' style='width:100%; height:90vh;'></iframe>";
	$('#db_title').attr('style','color:#fda006;');
	//alert(result)
	// $('#db_body').load($(this).attr('href'));
	$('#modal_ifr_body').html(str);
}
function setToken()
{
	var app_token=$('#app_token').val();
	//alert('anil'+app_token);
	$('a').on('click',function() {
		//alert('anil'+$(this).attr('href'));
		var href=$(this).attr('href');
		if(app_token!=undefined && href!=undefined)
		{
			
			$(this).attr('href','#');
			//alert(href)
			var ques=href.includes('?');
			var token_exists=href.includes('app_token');
			if(!token_exists)
			{
				
				if(ques)
					href1=href+"&app_token="+app_token;
				else
					href1=href+"?app_token="+app_token;
				
			}
			else
			{
				a=href.split('app_token');
				href1=a[0]+'app_token='+app_token;
			}
			
			$(this).attr('href',href1);
			//alert('role'+$(this).attr('href'));
		}

	});
	$('button').on('click',function() {
		$('a').each(function() {
			//alert('anil'+$(this).attr('href'));
			var href=$(this).attr('href');
			if(app_token!=undefined && href!=undefined)
			{
				
				$(this).attr('href','#');
				//alert(href)
				var ques=href.includes('?');
				var token_exists=href.includes('app_token');
				if(!token_exists)
				{
					
					if(ques)
						href1=href+"&app_token="+app_token;
					else
						href1=href+"?app_token="+app_token;
					
				}
				else
				{
					a=href.split('app_token');
					href1=a[0]+'app_token='+app_token;
				}
				
				$(this).attr('href',href1);
				//alert('role'+$(this).attr('href'));
			}
		});
	});
}
function requestUri(param)
{
	var app_token=$('#app_token').val();
	var base_url=$('#base_url').val();
	param=param.replace('?','&');
	var redirect_path=base_url+"/?p="+param+"&app_token="+app_token;
	//alert(redirect_path)
	window.location.replace(redirect_path);
}
function noBack() { window.history.forward(); }

function disableclick(e)
{
	if(event.button==2)
	{
		alert(status);
		return false;
	}
}
function disableF5(e) { 
	if ((e.which || e.keyCode) == 116 || (e.which || e.keyCode) == 82) e.preventDefault(); 
};


function ajaxCall(jsonobj)
{
	//alert($('#app_token').val());
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#app_token').val();
	var url=jsonobj.url;
	var postdata=jsonobj.postdata;
	var callback=jsonobj.callback;
	var connection=jsonobj.connection;
	var redirect=jsonobj.redirect;
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
	//alert(token);
	
	
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&app_token='+token,		
		error: function(jqXHR, textStatus, errorThrown) {
			fadeout();
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			var responseArray=jqXHR.responseText.split('#####');
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
		    //alert('aaaa'+redirect);
			
			
			if(redirect=='Y')
			{
				$('#redirect').html(jqXHR.responseText);
			}
		
			$('#submitdata').attr('disabled',false);
			
			
			if(responseArray[1]!='' && responseArray[1]!=undefined)
			{
				//alert(responseArray[1])
				$('#app_token').val(responseArray[1]);
				setToken();
			}
			else
			{
				
				responseArray=jqXHR.responseText.split('"app_token":"');
				if(responseArray[1]!=undefined)
				{
					abc=responseArray[1].split('"}');
					if(abc!=undefined)
					{
						$('#app_token').val(abc[0]);
						setToken();
					}
					
				}
				/*else
				{
					$.ajax({
					type: "POST",
					url:  base_url+'/?p=defaultCls/amrt',
					dataType: jsondataType,
					async: false,
					data:postdata+'&ajax_req='+true+'&app_token='+token,		
					error: function(jqXHR, textStatus, errorThrown) {
					},
					success:function( result ) {
						$('#app_token').val(result.amrt);
						setToken();
					}
					});
				}*/
			}
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null && redirect!='Y')
				errorAlert(responseArray[0]);
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
			$('#app_token').val(result.app_token);
			setToken();
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
				return false;
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

function ajaxCallNormal(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#app_token').val();
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
	
	var restricted_url = 'advocate_case_registration/getActs';
	var restricted_url1 = 'advocate_case_registration/autocomplete_section';
	$.ajax({
		type: "POST",
		url:  base_url+'/?p='+url,
		//dataType: jsondataType,
		async: false,
		data:postdata+'&ajax_req='+true+'&app_token='+token,		
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
			{
				$('#app_token').val(responseArray[1]);
				setToken();
			}
			
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
			$('#app_token').val(result.app_token);
			setToken();
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
    var token=$('#app_token').val();
    //alert(token+'------'+url)
	var url1=base_url+"/?p="+url+'&app_token='+token;
	//var url="jsonFiles/jsondistrict.php";
	fadein();
	$.getJSON(url1,postdata ,function(obj)
   	{
		fadeout();
		if(obj.errormsg!='' && obj.errormsg!=undefined && obj.errormsg!=null)
			$(".alert-danger").show().html(obj.errormsg);
		if(obj.msg!='' && obj.msg!=undefined && obj.msg!=null)
			$(".alert-success").show().html(obj.msg);
		$('#app_token').val(obj.app_token)
		setToken();
		callback(obj);

    }).fail(function(jqXHR, textStatus, errorThrown) {
       //alert(jqXHR.responseText)
       var responseArray=jqXHR.responseText.split('#####');
		$(".alert-danger").show().html(jqXHR.responseText);
		//$('#submitdata').attr('disabled',false);
		fadeout();
		if(responseArray[1]!='' && responseArray[1]!=undefined)
		{
			$('#app_token').val(responseArray[1]);
			setToken();
		}
		
    });


}

function ajaxCallNew(url,postdata,callback,formid)
{
	$(".alert-danger").hide().html('');
	$(".alert-success").hide().html('');
	var base_url=$('#base_url').val();
	var token=$('#app_token').val();//alert('token:'+token);
	postdata.append('ajax_req', true);//alert('postdata:'+postdata);
	postdata.append('app_token', token);
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
			//alert('error:' + jqXHR + ' textStatus:' +textStatus);
			//$(".alert-danger").show();
			//$("#msg-danger").html(responseArray[0]);
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);
			
			//alert(token)
			if(responseArray[1]!='' && responseArray[1]!=undefined)
			{
				$('#app_token').val(responseArray[1]);
				setToken();
			}
			
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
		
			$('#app_token').val(result.app_token);
			setToken();
			//if(url != restricted_url && url != restricted_url1){
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			//}

			//alert('result.errormsg: '+result.errormsg)
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
			
			
			
		}
	});
}
function fadein()
{
	//$("form").css("background",'#989898').css("opacity",'0.7');			
	//$(".faded").show();
	var myModal = new bootstrap.Modal($('#loadMe'), {
   backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
})
	myModal.toggle();
	
	
}
function fadeout()
{
	//$("form").show().css("background",'white').css("opacity",'1');
	//$(".faded").hide();
	//alert('aaa');
	$("#loadMe").modal("hide");
	$("#loadMe").removeClass("show");
	$("#loadMe").removeClass("fade");
	$("#loadMe").addClass("hide");
	
	//alert('bbb')

}

function closeModel(obj)
{
	var modal_id=obj.modal_id;
	var clear_data=obj.clear_data_id;
	if(clear_data!='' && clear_data!=undefined)
		$("#"+clear_data).html('');
	
	$("#"+modal_id).modal("hide");
	$("#"+modal_id).removeClass("show");
	$("#"+modal_id).removeClass("fade");
	$("#"+modal_id).addClass("hide");
	$(".xdsoft_datetimepicker").hide();
	$('.popover').popover('hide');
	
}

function get_age(dob) {
    var diff_ms = Date.now() - dob.getTime();
    var age_dt = new Date(diff_ms);

    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

function datePickerIcon(mydate,maxDate1,minDate1)
{
	var base_url=$('#base_url').val();
	if(minDate1=='' || minDate1==undefined)
		minDate1=new Date('15-08-1947'); 	//minDate1='15-08-1947';

   $('#'+mydate).datepicker({
		
	// defaultDate: new Date(2014, February 2015'), 
	  onClose: function(date, datepicker) {
		  if (datepicker.id == "fpet_dob") {
				if (date != "") {
					var bdate = date.split("-");
					var bday = bdate[0];
					var bmonth = bdate[1];
					var byear = bdate[2];
					var my_age = get_age(new Date(byear, bmonth, bday));
					$('#fextra_age').val(my_age);
				}
		  }

		  if (datepicker.id == "fpet_dob_lh") {
				if (date != "") {
					var bdate = date.split("-");
					var bday = bdate[0];
					var bmonth = bdate[1];
					var byear = bdate[2];
					var my_age = get_age(new Date(byear, bmonth, bday));
					$('#fextra_age_lh').val(my_age);
				}
		  }
                },
	  dateFormat: 'dd-mm-yy',
	  changeMonth: true,
	  changeYear: true,
	  // beforeShowDay: editDays,
	  showOtherMonths: true,
	  selectOtherMonths: true,
	  //showOn: "button",
	  //buttonImage: base_url+"/jquery-date/images/calendar.gif",
	   //buttonImageOnly: true,
	   maxDate: maxDate1,
	  minDate: minDate1,
	  yearRange: "-100:+2",
	}).next('img.ui-datepicker-trigger').attr('tabIndex', "-1");;
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
	//alert(''+base_url+'/?p=login/logOut')
	var a=confirm('Are you sure you want to logout?')
    if(a)
	{
		var app_token=$('#app_token').val();
		window.location.href=''+base_url+'/?p=login/logOut&app_token='+app_token;
	}
}

function sideBarToggle()
{
	$('#accordionSidebar').toggleClass('toggled');
	if($( "#accordionSidebar" ).hasClass( "toggled" ))
		localStorage.setItem("sidebar", "Y");
	else
		localStorage.setItem("sidebar", "N");
	$('#appl_logo').toggleClass('appl_logo');
	
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
{  //alert("err="+msg);
	$('#successIcon').addClass('d-none');
	$('#errorIcon').removeClass('d-none');
	$(".alert-danger-cust").show().html(msg);
	$(".alert-success-cust").hide().html('');
//	$('#validateError').modal('show'); 

var myModal = new bootstrap.Modal($('#validateError'), {
   backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
})
	myModal.toggle();

	/*$("#validateError").modal({
	 backdrop: "static", //remove ability to close modal with click
	 keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});*/
}
function successAlert(msg)
{
	$('#errorIcon').addClass('d-none');
	$('#successIcon').removeClass('d-none');
	$(".alert-success-cust").show().html(msg);
	$(".alert-danger-cust").hide().html('');

	var myModal = new bootstrap.Modal($('#validateError'), {
   backdrop: "static", //remove ability to close modal with click
      keyboard: false, //remove option to close with keyboard
      show: true //Display loader!
})
	myModal.toggle();


	/*$("#validateError").modal({
	  backdrop: "static", //remove ability to close modal with click
	  keyboard: false, //remove option to close with keyboard
	  show: true //Display loader!
	});*/
}

function pattern()
{
	

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
        var regexalpha = new RegExp("^[a-zA-Z,. ]+$");
        var keyalpha = value;

        if (regexalpha.test(keyalpha) || keyalpha=='') {
           return true;
        }
        return false;
    });
    $.validator.addMethod("password", function( value, element ) {
       	//return /^[A-Za-z0-9\d@#$%&*]*$/.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[@#$%&*]/.test(value) && /\d/.test(value);
		return /^[A-Za-z0-9\d@#$%&*]*$/.test(value) && /[a-z]/.test(value) && /[@#$%&*]/.test(value) && /\d/.test(value);
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
        var regexalpha = new RegExp("^[a-zA-Z0-9, ]+$");
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
           if (reg.test(value) || value=='') {
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


}

function ajaxCallreadPDF(jsonobj)
{
	
	$(".alert-danger").hide();$("#msg-danger").html('');
	$(".alert-success").hide();$("#msg-success").html('');
	var base_url=$('#base_url').val();
	var token=$('#app_token').val();
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
	var chosen=objchosen.chosen;
	var estCode = $("#selEstablishment").val();
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
		data:postdata+'&ajax_req='+true+'&app_token='+token,
		//contentType : 'application/pdf',
		error: function(jqXHR, textStatus, errorThrown) {
			
			var responseArray=jqXHR.responseText.split('#####');
			if(responseArray[0]!='' && responseArray[0]!=undefined && responseArray[0]!=null)
				errorAlert(responseArray[0]);
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			$('#submitdata').attr('disabled',false);

			if(responseArray[1]!='' && responseArray[1]!=undefined)
				$('#app_token').val(responseArray[1]);
			else
				$('#app_token').val(token);
			result['status']=false;
			callback(result);
		},
		beforeSend:function()
	   	{	//alert('fadein')
				//if(chosen && url != restricted_url && url != restricted_url1)
	   			
	   	},
		success:function( result ) {
			setTimeout(function(){fadeout()},300);
			setTimeout(function(){fadeout()},1000);
			if(result.errormsg!='' && result.errormsg!=undefined && result.errormsg!=null)
			{
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
			$('#app_token').val(result.app_token);
		}
	
	});
}

$(document).ready(function(){

	datePickerIcon('fromDate');
	datePickerIcon('toDate');

		$("#divOutputunder").html('');
		$("#natmast").html('');
		$("#divOutput").html('');
  $("#toggleLayout").hide();
var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl)
	 
	// On "reset button" click, generate new random sum
	$('button[type=reset]').click(createSum);
	// On user input, check value
	$( "#ans" ).keyup(checkInput);
	
})

var total;

function getRandom()
	{
	return Math.ceil(Math.random()* 20);
	}

function createSum(){
	var randomNum1 = getRandom(),
	randomNum2 = getRandom();
	total =randomNum1 + randomNum2;
	$( "#question" ).text( randomNum1 + " + " + randomNum2 + "=" );  
	$("#ans").val('');
	checkInput();
}

function checkInput(){
	var input = $("#ans").val(), 
	slideSpeed = 200,
	hasInput = !!input, 
	valid = hasInput && input == total;
	$('#message').toggle(!hasInput);
	$('button[type=submit]').prop('disabled', !valid);  
	$('#success').toggle(valid);
	$('#fail').toggle(hasInput && !valid);
}
 

	$.session.set("active_tab","");

	$(document).on('input', '#ageRange', function() {
		$('#slider_value').html( $(this).val() );
			
	}); 

	$("#state_code").chosen('destroy');
	$("#sel_year_chosen").hide();
	$("#state_code").chosen();
	$("#dist_code").trigger("chosen:updated")

/*------css for state & dist select box in mobile devices--22/07/25-----start*/
	var isMobile = /iPhone|iPad|iPod|Android|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent);

  if (isMobile) {
    // Destroy Chosen on all selects if initialized
    $('select').each(function() {
      if ($(this).data('chosen')) {
        $(this).chosen('destroy');
      }
    });
  } else {
    // Initialize Chosen on desktop/tablet
    $('select').chosen();
  }

  /*------end-------*/
	
	$('.counter').counterUp();
	$('#alertDashboard').DataTable(
	 {
		//responsive:true
			}
    );


    $("#toggleLayout").click(function(){
	  $(".mainFourDivs .col-xl-6").toggleClass("col-xl-12");
	});
	
	
	$("#alerts-tab").click(function(){

		$("#statediv").show();
	state_code =$("#state_code").val();
	dist_code =$("#dist_code").val();
	  $("#refresh_pend").addClass("d-none");
	  $("#sel_year").hide();
    $("#sel_year_chosen").hide();
	// requestUri('home/index');
	$.session.set("active_tab","");
	requestUri('home/index&state_code='+state_code+'&dist_code='+$("#dist_code").val());
	});
	
	/*$("#disposal-tab").click(function(){

		$("#statediv").hide();
		$("#set_year_li").hide();
	});*/
});
var stagebarchart,casetypepiechart,matterTchart,matterTypeData,agechart,ageData,swchart,stagePieData,agelinechart,delaybarchart,instvsdispchart,dispnaturepiechart,disposalPieData,instvsdispchart1,pendvsdispchart,prechart,casetypepiechart1,agelinechart1,stagebarchart1,delayAgechart;

function refreshDashboard(ci_cri)
{
	$("#casetype").val('');
	var tab_val=$.session.get("active_tab");
	$("#refresh_pend").removeClass("d-none");
	$("#sel_year_chosen").hide();
	$("#ci_cri").val(ci_cri);
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/newPendDashboard';
	var stage_ready=$('input[name="Stagereadyradio"]:checked').val();
	var postdata='ci_cri='+ci_cri+'&stage_ready='+stage_ready+'&active_tab='+tab_val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		var casetype=result.mattertype_count;
		casetype=casetype.replaceAll('~',',');
		casetype=JSON.parse("["+casetype+"]");		
		
		nationalCaseType(result.mattertype,result.cases_count,result.case_gr);
		matterTypeData=JSON.parse("["+casetype+"]");
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		stageWiseBarChart(result.purpose_name,result.purpose_count);
		agewiseLineChart(result.year,result.year_count);
		
		if(tab_val=='pending')
		{
			delayReasonBarChart(result.delayName,result.delay_count);
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
		}
		else
		{
			delayReasonBarChart(result.dispYear,result.dispCount);
			disposalPieData=result.dispNatureCount;
			disposalNatureBarChart(result.subNatureName,result.subNatureCount)
		}
	}
}
function show_count_level3(state_code,dist_code,court_code,report_type)
{

	var url='information_mgnt/show_count_level3';

	$('#moda_count_levelthree').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code+'&dist_code='+dist_code+'&court_code='+court_code+'&report_type='+report_type;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{

	//	if(result.status)
		{	
			$('#modal_count_levelthree').html(result.tbl_str);
			$('#modal_count_report_type').html(result.report_type);
		}
		 $("#count_level_three").DataTable();
	}
	
}
function fetchPendDashboard(ci_cri,tab_val,disp_year)
{
	$("#statediv").show();
	if(ci_cri==2)
	{
		$("#civbtn").addClass('active');
		$("#cribtn").removeClass('active');
		$("#bothbtn").removeClass('active');
	}
	if(ci_cri==3)
	{
		$("#cribtn").addClass('active');
		$("#civbtn").removeClass('active');
		$("#bothbtn").removeClass('active');
	}
	if(ci_cri==1)
	{
		$("#bothbtn").addClass('active');
		$("#cribtn").removeClass('active');
		$("#civbtn").removeClass('active');
	}
	$.session.set("active_tab", tab_val);
	$('#Stageready3').prop('checked',true);
	$("#casetype").val('');
	$("#case_type_breadcrumb").hide();
	$("#age_breadcrumb").hide();
	$("#toggleLayout").show();
    $("#refresh_pend").show();
	
	$('#case_type_gr  option[value=4]').prop("selected", true);
	$('#case_type_gr').chosen('destroy');
	

	if(tab_val=='disposed')
	{
		$("#set_year_li").show();
		$(".stagereadygrp").hide();
		$("#sel_year").show();
		$("#sel_year_chosen").show();
		$("#dv_disp_nature_pie").removeClass('d-none');
		$("#dv_inst_disp_select").addClass('d-none');
		$("#title_3").html('Time to Disposition');
		$("#title_4").html('Nature of Disposal');
		$("#labelReady").html('Contested');
		$("#labelUnready").html('Uncontested');
		$("#stage_heading").html('Nature of Disposal');
		$("#div_ins_disp").hide();
		if(disp_year=='' && disp_year=='undefined')
			 disp_year=$("#sel_year").val();
		var stage_ready=$('input[name="Stagedispreadyradio"]:checked').val();
		setTimeout(function() {$('#sel_year').chosen('destroy');
		
		 $('#sel_year').chosen();
		 },300);
	}
	else
	{ 
		$("#set_year_li").hide();
		$(".stagereadygrp").show();
		$("#sel_year").hide();
		$("#dv_inst_disp_select").removeClass('d-none');
		$("#dv_disp_nature_pie").addClass('d-none');
		$("#title_3").html('Delay Reason');
		$("#title_4").html('Institution Vs Disposal');
		$("#labelReady").html('Ready');
                $("#labelUnready").html('Unready');
		$("#stage_heading").html('Stage');
		$("#div_ins_disp").show();
		$("#div_delay").addClass("col-xl-6").removeClass("col-xl-12");
		var stage_ready=$('input[name="Stagereadyradio"]:checked').val();
		 $('#sel_year').chosen('destroy');
		//$("#sel_year").val(2024);
		var currentTime = new Date();
		$("#sel_year").val(currentTime.getFullYear());
		 $('#sel_year').chosen();
	}
 
	$("input[name=Agewisebtnradio]").prop('checked',false);
	$("input[name=Stagewisebtnradio]").prop('checked',false);
	$("#ins_year").val('');
	$('#ins_year').trigger("chosen:updated");
	$("#refresh_pend").removeClass("d-none");
	$("#sel_year_chosen").hide();
	$("#ci_cri").val(ci_cri);
		
	stage_ready=3;
	$('#Stageready3').attr('checked',true);
	var state_code=$("#state_code").val();

	var dist_code=$("#dist_code").val();
	var url='home/newPendDashboard';
	var postdata='ci_cri='+ci_cri+'&stage_ready='+stage_ready+'&active_tab='+tab_val;
	if(state_code!=' ' || state_code!='null')
		postdata+='&state_code='+state_code;
	if(dist_code!=' ')
		postdata+='&dist_code='+dist_code;
	if(disp_year!='')
		postdata+='&disp_year='+disp_year;
	// alert(state_code)
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{		
		 if(state_code==null)
					state_code='';
			 if(dist_code==null)
					dist_code='';

		var casetype=result.mattertype_count;	 
		casetype=casetype.replaceAll('~',',');
		casetype=JSON.parse("["+casetype+"]");
		matterTypeData=JSON.parse("["+casetype+"]");
		//ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		disposalPieData=result.dispNatureCount;
	
		matterType('Matter Type Pendency',casetype);  
		pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
		nationalCaseType(result.mattertype,result.cases_count,result.case_gr); 	
		$(".apexcharts-series").find("path[selected=true]").css("fill", "rgba(107,146,173,0.8)");//alert('111111');
		 

		$("#ageBarInDropdowntbl").html('');
		$('#ageBarInDropdowntbl').append(result.ageChartcount);
		$("#tblAgeChartcount").DataTable({
		dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

		$("#chart9tbl").html('');
		$('#chart9tbl').append(result.casecount);	 
		$("#tblCasetype").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		
		$("#MatterTypeInDropdowntbl").html('');
		$('#MatterTypeInDropdowntbl').append(result.caseChartcount);
		//$("#tblCaseCharttype").DataTable();


		

        	
			 
		if(tab_val=='pending')
		{
			$("#div_delay").hide();

			$("#agewisetbl").html('');
		$('#agewisetbl').append(result.agewiseCount);	 
		$("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			agewiseLineChart(result.year,result.year_count);
			$("#ageline").val(result.year);
			$("#agelinecount").val(result.year_count);

			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
			stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name,result.purpose_name);	
			stageChart('Stage Category',result.stagewise_count,111,result.purposename);

			$("#delaytbl").html('');
			$('#delaytbl').append(result.delaywiseCount);  	
			
			$("#StageWisePInDropdowntbl").html('');
                        $('#StageWisePInDropdowntbl').html(result.stagewisePICount);
                        $("#stageCharttbl").DataTable();


			$("#stagetbl").html('');
	                $('#stagetbl').append(result.stagewiseCount);
        	        $("#tblStagewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			$("#tblDelaywisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
 
			$("#instVsDisptbl").html('');	
			var	year_arr		  =		result.insyear.split("~");
			var 	inst_count		  =		result.ins_count.split("~");
			var	dispo_count    =		result.disp_count.split("~");
			$('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody> ');
		 
				var 		  tot_instwise=0; 
				var			tot_dispwise =0;
				 for(i=0; i<year_arr.length; i++)
				 {	 	 
					  tot_instwise = (+tot_instwise) + (+inst_count[i]);
					  tot_dispwise = (+tot_dispwise) + (+dispo_count[i]);					 	
                                       
//$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');

					if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}												
			}		 
			$('#instVsDisptbl').append(' </tbody> ');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_instwise)+'</th><th>'+moneyFormatIndia(tot_dispwise)+'</th> </tr> </tfoot></table>');
			 $("#tblInstDispCount").DataTable({dom: 'lrfBtip',
				  buttons: [
					{ 
						"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
						exportOptions: {
							columns: ':visible'
						}
					},
					{
						"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
						exportOptions:{
							columns: ':visible'
						}
					},
					{
						"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
						exportOptions:{
							columns: ':visible'
						}
	        }]});			
		}

		else
		{			 
			$("#div_delay").show();
			dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);
			$("#pendageline").val(result.pend_age_year);
			$("#ageline").val(result.pend_age_cnt);
			$("#agelinecount").val(result.year_count);
			
			$("#agewisetbl").html('');
                        $("#tblAgewisecount").html('');

                        var pendAge_year_arr=result.pend_age_year.split('~');
                        var pendAge_year_arr  =             JSON.parse("["+pendAge_year_arr+"]");

                        var pendAge_count  =             result.pend_age_cnt.split("~");
                        var yearwise_count =                result.year_count.split("~");

                         var tot_yearwise=0;
                         var tot_pendAge=0;

                        $('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');
                        for(i=0; i<pendAge_year_arr.length; i++)
                        {
                                tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
                                tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

         			if(yearwise_count[i]=='' || yearwise_count[i]==undefined)
					yearwise_count[i]=0;                       
                                      //  $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');

					if(state_code=='' && dist_code=='')
					{
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}
					else
					{
						//$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}                                
			}
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_pendAge)+'</th><th>'+moneyFormatIndia(tot_yearwise)+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
			//alert(result.nature_disp_name)
			delayReasonBarChart(result.dispYear,result.dispCount);
			stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);		
			stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);
			$("#delaytbl").html('');
			$('#delaytbl').append(result.timetoDispCount);  	
			$("#tblTimetoDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			 $("#stagetbl").html('');
	                $('#stagetbl').append(result.natureOfDispCount);
        	        $("#tblnatureOfDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
			
			$("#StageWisePInDropdowntbl").html('');
			$('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);  	
			$("#tblnatureOfDispPIcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});			 
		}
	
	}
}
function fetchAlertDashboard()
{
		var postdata='';
		var url='home/alertDashboard';
		$("#penAlert-tab").show();
 
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		
	}
}
/********** Case type Group start***************/
function fetchCaseGroup(ci_cri)
{	
	$('#ins_year').val('');
	$('#ins_year').chosen('destroy');
		 
	if(ci_cri==2)
	{
		$("#civbtn").addClass('active');
		$("#cribtn").removeClass('active');
		$("#bothbtn").removeClass('active');
	}
	if(ci_cri==3)
	{
		$("#cribtn").addClass('active');
		$("#civbtn").removeClass('active');
		$("#bothbtn").removeClass('active');
	}
	if(ci_cri==1)
	{
		$("#bothbtn").addClass('active');
		$("#cribtn").removeClass('active');
		$("#civbtn").removeClass('active');
	}
	 $("#case_type_breadcrumb").hide();
	 $("#age_breadcrumb").hide();
	var active_tab=$.session.get("active_tab");
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/updateCaseType';
	$("#ci_cri").val(ci_cri);
	var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab;
	if(state_code!='' || state_code!='null')
		postdata+='&state_code='+state_code;
	if(dist_code!='' || dist_code!='null')
		postdata+='&dist_code='+dist_code;
	
	if(active_tab=='disposed')
	{
		var disp_year=$("#sel_year").val();
		postdata+='&disp_year='+disp_year;
	}
	$("#casetype").val('');
	$('#case_type_gr  option[value=4]').prop("selected", true);
	$('#case_type_gr').chosen('destroy');
	

	
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		 
		var casetype=result.mattertype_count;
		casetype=casetype.replaceAll('~',',');
		casetype=JSON.parse("["+casetype+"]");
		matterTypeData=JSON.parse("["+casetype+"]");
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		disposalPieData=result.dispNatureCount;
	
		matterType('Matter Type Pendency',casetype);
		pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
		nationalCaseType(result.mattertype,result.cases_count,result.case_gr);
		agewiseLineChart(result.year,result.year_count);
			
		 $("#chart9tbl").html('');
		 $('#chart9tbl').append(result.casecount);	 
		 $("#tblCasetype").DataTable();
		
		$("#agewisetbl").html('');
		$('#agewisetbl').append(result.agewiseCount);
		$("#tblAgewisecount").DataTable();
		
		$("#stagetbl").html('');
        $('#stagetbl').append(result.stagewiseCount);
		$("#tblStagewisecount").DataTable();
		
		/*$("#StageWisePInDropdowntbl").html('');
		$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
	 	$("#stageCharttbl").DataTable();*/
		
		$("#MatterTypeInDropdowntbl").html('');
		$('#MatterTypeInDropdowntbl').append(result.caseChartcount);
	 	//$("#tblCaseCharttype").DataTable();

		$("#ageBarInDropdowntbl").html('');
		$('#ageBarInDropdowntbl').append(result.ageChartcount);
		$("#tblAgeChartcount").DataTable();
		  
		if(active_tab=='pending')
		{
			stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name);

			delayReasonBarChart(result.delayName,result.delay_count);
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);

			  $("#StageWisePInDropdowntbl").html('');
                $('#StageWisePInDropdowntbl').append(result.stagewisePICount);
                $("#stageCharttbl").DataTable();

			$("#delaytbl").html('');
			$('#delaytbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount").DataTable();
			 
			$("#instVsDisptbl").html('');
			$("#tblInstDispCount").html('');
			 
			var	year_arr		  =		result.insyear.split("~");
			var 	inst_count		  =		result.ins_count.split("~");
			var	dispo_count    =		result.disp_count.split("~");

			var 	tot_instwise	=	0; 
			var	tot_dispwise =	0;
				 $('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
			 for(i=0; i<year_arr.length; i++)
			 {
							tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
							tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);

					if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
			 }
			$('#instVsDisptbl').append(' </tbody>');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_instwise)
+'</th><th>'+moneyFormatIndia(tot_dispwise)+'</th> </tr> </tfoot></table>');
			//$("#tblInstDispCount").DataTable();
			 $("#tblInstDispCount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		}
		else
		{
			delayReasonBarChart(result.dispYear,result.dispCount);
			stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);
			stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);

			dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);

			$("#agewisetbl").html('');
                        $("#tblAgewisecount").html('');

                        var     pendAge_year_arr             =             result.pend_age_year.split('~');
                        var     pendAge_year_arr             =             JSON.parse("["+pendAge_year_arr+"]");
                        var     pendAge_count                =             result.pend_age_cnt.split("~");
                        var     yearwise_count               =                result.year_count.split("~");

                         var     tot_yearwise    =  0;
                         var     tot_pendAge     =  0;

                        $('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');

                        for(i=0; i<pendAge_year_arr.length; i++)
                        {
                                tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
                                tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

                        //      $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td>'+pendAge_count[i]+'</td><td>'+yearwise_count [i]+'</td></tr> ');
				if(yearwise_count[i]=='' || yearwise_count[i]==undefined)
                                        yearwise_count[i]=0;

                                if(state_code=='' && dist_code=='')
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+ 
moneyFormatIndia(pendAge_count[i]) +'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                                else if(state_code!='' && dist_code=='' )
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +
moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                                else
                                {
                                      //  $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
									 $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +
moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                        }
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_pendAge)+'</th><th>'+moneyFormatIndia(tot_yearwise)+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable();


			$("#delaytbl").html('');
			$('#delaytbl').append(result.timetoDispCount);  	
			$("#tblTimetoDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

		/*	$("#instVsDisptbl").html('');
			$('#instVsDisptbl').append(result.natureOfDispCount);  	
			$("#tblnatureOfDispcount").DataTable();*/

			$("#stagetbl").html('');
                        $('#stagetbl').append(result.natureOfDispCount);
                        $("#tblnatureOfDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			$("#StageWisePInDropdowntbl").html('');
                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
                        $("#tblnatureOfDispPIcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			 
			/*$("#disaposalNatureChartTbl").html('');
			$('#disaposalNatureChartTbl').append(result.natureOfDispPICount);  	
			$("#tblnatureOfDispPIcount").DataTable();*/
			 
		}
	}
}

//for delay

function fetchDelayGroup(ci_cri,active_tab,caseType_val)
{	 
	$('#case_type_gr').chosen('destroy');
	//alert(ci_cri)
	if(ci_cri=='' || ci_cri==undefined)
					var ci_cri=$("#ci_cri").val();
			else 
					$("#ci_cri").val(ci_cri);
	if(ci_cri==2)
	{
		$("#civDelaybtn").addClass('active');
		$("#criDelaybtn").removeClass('active');
		$("#bothDelaybtn").removeClass('active');
	}
	if(ci_cri==3)
	{
		$("#criDelaybtn").addClass('active');
		$("#civDelaybtn").removeClass('active');
		$("#bothDelaybtn").removeClass('active');
	}
	if(ci_cri==1)
	{
		$("#bothDelaybtn").addClass('active');
		$("#criDelaybtn").removeClass('active');
		$("#civDelaybtn").removeClass('active');
	}
	//alert(ci_cri)
	 $("#case_type_breadcrumb").hide();
	 $("#age_breadcrumb1").hide();
	var active_tab=$.session.get("active_tab");
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/updateDelayType';
	$("#ci_cri").val(ci_cri);
	var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	if(caseType_val!='')
		postdata+='&caseType_val='+caseType_val; 
 
	$("#casetype").val('');
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		if(caseType_val=='' || caseType_val==undefined)
		{
			$('#case_type_select').chosen('destroy');
			$("#case_type_select").html(result.caseType_options);
			$("#case_type_select").chosen();
		}
		nationalCaseType1(result.delay_name,result.delay_count,result.delay_full_name); 	
		agewiseLineChart1(result.delaywise_year,result.delaywise_count);
		stageWiseBarChart1(result.delayCasetype_name,result.delayCasetype_count);

		$('#arrdelayId1').val(result.arrDelayID);
	 
		ageData=result.ageDelaywise_total;
	 
		$(".apexcharts-series").find("path[selected=true]").css("fill", "rgba(107,146,173,0.8)");//alert('111111');	 
	 
			 $("#div_delay").show();
			$("#chartstbl").html('');
			$('#chartstbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }],
				"ordering": false});
		 
		  
			ageData=result.agewise_count;
			pendingCasesDelayChartT2('Age Wise Pendency ',result.ageDelaywise_total,'#78C193',1111);

		$("#ageBarInDropdowntbl1").html('');
		$('#ageBarInDropdowntbl1').append(result.ageDelayChartcounts);
		$("#tblAgeChartcount1").DataTable({
		dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});


		$("#agewisetbl1").html('');
		$('#agewisetbl1').append(result.agewiseDelayCount);	 
		//alert(result.agewiseDelayCount);return false;
		$("#tblAgewisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		 	$("#ageline1").val(result.delaywise_year);
	 		$("#agelinecount1").val(result.delaywise_count); 

					 
		$("#stagetbl1").html('');
		$('#stagetbl1').append(result.delayCasecount);
		$("#tblCasetype1").DataTable({dom: 'lrfBtip',
		buttons: [
		{ 
			"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
			exportOptions: {
				columns: ':visible'
			}
		},
		{
			"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
			exportOptions:{
				columns: ':visible'
			}
		},
		{
			"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
			exportOptions:{
				columns: ':visible'
			}
		}]});
	 
	}
}

function nationalCaseType1(name1,datacount1,full_name)
{
	// var casetypepiechart1='';
	var a=datacount1.split('~');
	var b=0;
	for(var i=0;i<a.length;i++)
	{
		b=b+parseInt(a[i]);
	}
	datacount1=datacount1.replaceAll('~',',');
	// alert(datacount1);return false;
	data=JSON.parse("["+datacount1+"]");

	label=name1.replaceAll('~',',');
	label1=label.replaceAll('#',' ');//alert(label1);
	label1=JSON.parse("["+(label1)+"]");

	full_name=full_name.replaceAll('~',',');
	label2=full_name.replaceAll('#',' ');//alert(label1);
	label2=JSON.parse("["+(label2)+"]");

		$("#chartstbl").hide();
		$("#pendash1chart1").show(); 
		$("#caseTypechartbtn1").hide();
		$("#caseTypeTblbtn1").show();
	//var total=data.slice(0, -1);
	total=JSON.parse("["+data+"]");
	//alert(total.length);
	var dynamicWidth1='90%'
	if(total.length > 12)
	{
		dynamicWidth1='90%'
	}
	else if(total.length <= 12 && total.length>5 )
	{
		dynamicWidth1='60%'
	}
	else if(total.length <= 5 && total.length>2 )
	{
		dynamicWidth1='40%'
	}
	else if(total.length=2 )
	{
		dynamicWidth1='20%'
	}
	else if(total.length=1 )
	{
		dynamicWidth1='10%'
	}
	 
	var pendash1options1 = {
        series: [{
		name: "Count",
        data: data
        }],
		chart: {
        type: 'bar',
        height: dynamicWidth1,
		events: {
			markerClick: function (event, chartContext, config) {
				var ci_cri=$("#ci_cri").val();
				var state_code=$("#state_code").val();
				var dist_code=$("#dist_code").val();
				 var delayId =$('#arrdelayId1').val();
				 var case_type_select=$("#case_type_select").val();
			 
				var url='home/fetchDelayTypeWise';
				 //alert(config.dataPointIndex)
				var active_tab=$.session.get("active_tab");
				var postdata='casetypeval1='+config.dataPointIndex+'&ci_cri='+ci_cri+'&state_code='+state_code+'&dist_code='+dist_code+'&active_tab='+active_tab+'&delayId='+delayId+'&caseType_val='+case_type_select;
				
				if(active_tab=='disposed')
				{
					var disp_year=$("#sel_year").val();
					postdata+='&disp_year='+disp_year;
				}

				
				ajaxCall({url:url,postdata:postdata,callback:callback});
				function callback(result)
				{	 
			//		ageData=result.agewise_count;					 
					$("#casetype").val(result.casetype);

					if(result.delaywise_name!='')
					{
						$("#case_type_breadcrumb").show();
						$("#case_type_breadcrumb").html(result.delaywise_name+'&nbsp;&nbsp;<a href="#" onclick=$("#case_type_breadcrumb").html("");delay_dashboard('+ci_cri+'); ><i class="fa fa-times text-white"></i></a>');
					}
					else
						$("#case_type_breadcrumb").hide();
				
					 
					 
			 		//pendingCasesDelayChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);	
					pendingCasesDelayChartT2('Age Wise Pendency ',result.ageDelaywise_total,'#78C193',1111);
					 $("#stagetbl1").html('');
					$('#stagetbl1').append(result.delayCasecount);
			 	 
					//$("#tblCasetype1").DataTable();  	 
	  
				 
						stageWiseBarChart1(result.delayCasetype_name,result.delayCasetype_count);	

					
						 agewiseLineChart1(result.delaywise_year,result.delaywise_count);
						 
					  $("#div_delay").show();
			$("#chartstbl").html('');
			$('#chartstbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }],
				"ordering": false});


			$("#stagetbl1").html('');
	                $('#stagetbl1').append(result.delayCasecount);
        	        $("#tblCasetype1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
			$("#ageBarInDropdowntbl1").html('');
		$('#ageBarInDropdowntbl1').append(result.ageDelayChartcounts);
		$("#tblAgeChartcount1").DataTable({
		dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});


		$("#agewisetbl1").html('');
		$('#agewisetbl1').append(result.agewiseDelayCount);	 
		$("#tblAgewisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		 	$("#ageline1").val(result.delaywise_year);
	 		$("#agelinecount1").val(result.delaywise_count);



						 
				}
				
			 },
				mounted: function(chartContext, config) {
        window.dispatchEvent(new Event('resize'));
      },
				
			},
			toolbar: {
            show: true
          }
		/*	,	events: {
		mounted: function(chartContext, config) {
        window.dispatchEvent(new Event('resize'));
      }
    }*/
        },
			
     plotOptions: {
	  bar: {
		horizontal: true,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '15px',
		colors: ['#fff']
	  }
	},
	 
	stroke: {
	  show: false,
	  width: 1,
	  colors: ['#fff']
	},
		  tooltip: {
		  shared: true,
		  intersect: false,
		x: {
			  formatter: function(value, { dataPointIndex, w }) {
				// Use a different label for tooltip here
				const tooltipLabels = label2;
				return tooltipLabels[dataPointIndex];
			  }
			}
		},
	/*tooltip: {
	  shared: true,
	  intersect: false,

	},*/

		colors:["#517393","#ff0000"],
        dataLabels: {
          enabled:true,
			 
			  style: {
				colors: ['#333'],
				fontSize: '10px',
						
				
				
			  },
			  background: {
				enabled: true,
				foreColor: '#000',
				borderRadius: 2,
				padding: 2,
				opacity: 0,
				borderWidth: 1,
				borderColor: '#fff'
			  },
			offsetX: 50
        },
        xaxis: {
          categories:label1,
		labels: {
          show: false,
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
          
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },}

        },
			yaxis: {
      show: true,
      showAlways: true,
      showForNullSeries: true,
      labels: {
          show: true,
          align: 'right',
          minWidth: 0,
          maxWidth: 200,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-yaxis-label',
          },
          offsetX: 0,
          offsetY: 0,
          rotate: 0,
      },
  }
			
		};
		
		if(casetypepiechart1==undefined || casetypepiechart1=='')
		{
			$('#pendash1chart1').html('');
			casetypepiechart1 = new ApexCharts(document.querySelector("#pendash1chart1"), pendash1options1);
			casetypepiechart1.render();
		}
		else
		{
			casetypepiechart1.updateOptions(pendash1options1);
		}
}


function agewiseLineChart1(year1,data1)
	{
	//var agelinechart1='';
 //alert(data1);return false;
	year1=year1.replaceAll('~',',');
	year1=JSON.parse("["+year1+"]");

	data1=data1.replaceAll('~',',');
	data1=JSON.parse("["+data1+"]");
	total=JSON.parse("["+data1+"]");
   
   $('#agewise1chart1').show();
   $("#agewisechartbtn1").hide();
   $("#agewiseTblbtn1").show();
	$('#agewisetbl1').hide();
 
	//alert(total);
	var dynamicWidth1='150%'
	if(total.length > 10)
	{
		dynamicWidth1='150%'
	}
	else 
	{
		dynamicWidth1='100%';
	}
		 var ageWise1options = {
          series: [
          {
            name: "Count",
            data: data1
          }
        ],
          chart: {
          height: 250,
			   width: dynamicWidth1,
          type: 'area',
          dropShadow: {
            enabled: true,
            color: '#000',
            top: 18,
            left: 7,
            blur: 10,
            opacity: 0.2
          },
          toolbar: {
            show: true
          }
        },
        colors: ['#a9333a', '#00ff00'],
        dataLabels: {
          enabled: true,
        },
        stroke: {
          curve: 'smooth',
			  width: 2
        },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        markers: {
          size: 1
        },
        xaxis: {
	/*	labels: {
            rotate: -45,
	 style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },

          },*/
          categories: year1,
		labels: {
          rotate: -25,
	 rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },


      },
        },
		yaxis:{
		  labels: {
          show: false,
			},
		  }
        
        };
		if(agelinechart1==undefined || agelinechart1=='')
		{
			
			$("#agewise1chart1").html('');
			agelinechart1 = new ApexCharts(document.querySelector("#agewise1chart1"), ageWise1options);
			agelinechart1.render();
		}
		else
		{
			agelinechart1.updateOptions(ageWise1options);
 
		}

}



function stageWiseBarChart1(purpose_name1,purpose_data1)
{   
	//var stagebarchart1='';
	var a=purpose_data1.split('~');
	var b=0;
	for(var i=0;i<a.length;i++)
	{
		b=b+parseInt(a[i]);
	}
	purpose_data1=purpose_data1.replaceAll('~',',');
	data1=JSON.parse("["+purpose_data1+"]");
//alert(data1)
	label=purpose_name1.replaceAll('~',',');
	
	label1=label.replaceAll('#',' '); 
	label1=JSON.parse("["+(label1)+"]");
	
		$("#stagetbl1").hide();
		$("#stageWise1chart1").show(); 
		$("#stagechartbtn1").hide();
		$("#stageTblbtn1").show();
	
	//alert(total.length);
	var dynamicWidth1='200%'
	if(label1.length > 10)
	{
		dynamicWidth1='200%'
	}
	else 
	{
		dynamicWidth1='100%';
	}

	var stagewise1options1 = {
          series: [{
			   name: "Count",
          data: data1
        }],
          chart: {
          type: 'bar',
          height: 250,
		width:dynamicWidth1,
			  toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: false,
			dataLabels: {
			position: 'top',
			}
          }
        },
	
		dataLabels: {
			enabled: false,
			offsetX: 0,
		    offsetY: -	60,
			style: {
				fontSize: '10px',
				colors: ['#555']
			},
				formatter: function (val, opt) {
					var c=val *100 /b;
                return  ["("+c.toFixed(2)+"%)",val] 
              },
		},
		stroke: {
			show: false,
			width: 1,
			colors: ['#fff']
		},
		tooltip: {
		  shared: true,
		  intersect: false
		},
		colors: ['#009dae', '#00ff00'],
        
		
        xaxis: {
          categories:label1,
			  		labels: {
			  rotate: -15,
          rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },
		 offsetX: 10,

      },
        },
			  yaxis:{
		  labels: {
          show: true,
			},
		  }
        };
		if(stagebarchart1==undefined || stagebarchart1=='')
		{
			
			$("#stageWise1chart1").html('');
			stagebarchart1 = new ApexCharts(document.querySelector("#stageWise1chart1"), stagewise1options1);
			stagebarchart1.render();
		}
		else
		{$("#stageWise1chart1").html('');
			stagebarchart1.updateOptions(stagewise1options1);
		 
		}

}


function pendingCasesDelayChartT2(title1,tot_delay1,color1,id1)
{
	ageData1=tot_delay1;
	$('.ageWiseChart1').html('').attr('id1', 'ageWiseChart1'+id1);
	tot_delay1=ageData1.replaceAll('~',',');
	tot_delay1=JSON.parse("["+tot_delay1+"]");

	/*total_age=total_age.replaceAll('~',',');
	total_age=JSON.parse("["+total_age+"]");*/

	$('#ageTitle1').html(title1);
		
		$("#ageBarInDropdowntbl1").hide();
		$("#ageBarInDropdown1").show(); 
		$("#agechart1btn1").hide();
		$("#ageChartTblBtn1").show();
//var percentage=(tot_pend/total_age)*100;
//alert(percentage);
	var ageoptions1 = {
	  series: [ 
	  {
		  name: 'Total',
	  data: tot_delay1
	}, /*{
			  name: 'Percentage',
	  data: total_age,
	}*/],
	  chart: {
	  type: 'bar',
	  height: '80%',
		  toolbar: {
            show: false
          }
			,events: {
			 markerClick: function (event, chartContext, config)
			 {
					
					var url='home/fetchAgewise1/'+config.dataPointIndex;
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var active_tab=$.session.get("active_tab");
					var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					var case_type=$("#casetype").val();
					if(case_type!='')
						postdata+='&case_type='+case_type;

					
					if(active_tab=='disposed')
					{
						var disp_year=$("#sel_year").val();
						postdata+='&disp_year='+disp_year;
					}

					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	
						//alert(result.delay_age_label);
						if(result.delay_age_label!='')
						{
							//alert(result.year)
							$("#age_breadcrumb1").show();
							 
								var ageline1=$("#ageline1").val();
								var agelinecount1=$("#agelinecount1").val();
								$("#age_breadcrumb1").html(result.delay_age_label+'&nbsp;&nbsp;<a href="#" onclick=$("#age_breadcrumb1").html("");agewiseLineChart1(\''+ageline1+'\',\''+agelinecount1+'\'); ><i class="fa fa-times text-white"></i></a>');
						 
						}
						else
							$("#age_breadcrumb1").hide();

					 
						//agewiseLineChart1(result.year,result.year_count);
						agewiseLineChart1(result.delaywise_year,result.delaywise_count);
						$("#agewisetbl1").html('');
		$('#agewisetbl1').append(result.agewiseDelayCount);	 
		$("#tblAgewisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
						 
					}
                 	},				
			}
	},
	plotOptions: {
	  bar: {
		horizontal: true,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '12px',
		colors: ['#fff']
	  }
	},
	stroke: {
	  show: false,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: true,
	  intersect: false
	},
		  title:{
              text:'Delay Age Wise Pendency',		
		},
		  fill: {
  colors: [color1]
},
	xaxis: {
	   categories: ['0 to 1 Years', '1 to 3 Years', '3 to 5 Years', '5 to 10 Years', '10 to 20 Years', '20 to 30 Years','Above 30 Years'],
		   labels: {
          show: true,
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },}
	},

	};
	if(delayAgechart==undefined)
	{
		
		$("#ageBarInDropdown1").html('');
		delayAgechart = new ApexCharts(document.querySelector("#ageBarInDropdown1"), ageoptions1);
		delayAgechart.render();
	}
	else
	{
		setTimeout(function(){delayAgechart.updateOptions({
			series: [{
				name: "Count",
				data: tot_delay1
			}]
		})},500);
	}

}
function updateDelayCasesChartT2()
{
	tot_delay1=ageData1.replaceAll('~',',');
	tot_delay1=JSON.parse("["+tot_delay1+"]");
	setTimeout(function(){delayAgechart.updateOptions({
		series: [{
			name: "Count",
			data: tot_delay1
		}]
	})},500);
}


//end delay



function nationalCaseType(name,datacount,case_gr)
{
	if(case_gr=='' || case_gr==undefined)
		case_gr='All';
	var a=datacount.split('~');
	var b=0;
	for(var i=0;i<a.length;i++)
	{
		b=b+parseInt(a[i]);
	}
	datacount=datacount.replaceAll('~',',');
	data=JSON.parse("["+datacount+"]");

	label=name.replaceAll('~',',');
	label1=label.replaceAll('#',' ');//alert(label1);
	label1=JSON.parse("["+(label1)+"]");
		$("#chart9tbl").hide();
		$("#pendash1chart").show(); 
		$("#caseTypechartbtn").hide();
		$("#caseTypeTblbtn").show();
	//var total=data.slice(0, -1);
	total=JSON.parse("["+data+"]");
	//alert(total.length);
	var dynamicWidth1='90%'
	if(total.length > 12)
	{
		dynamicWidth1='90%'
	}
	else if(total.length <= 12 && total.length>5 )
	{
		dynamicWidth1='60%'
	}
	else if(total.length <= 5 && total.length>2 )
	{
		dynamicWidth1='40%'
	}
	else if(total.length=2 )
	{
		dynamicWidth1='20%'
	}
	else if(total.length=1 )
	{
		dynamicWidth1='10%'
	}
	
//alert(dynamicWidth1)
	var pendash1options = {
        series: [{
		name: "Count",
        data: data
        }],
		chart: {
        type: 'bar',
        height: dynamicWidth1,
		events: {
			markerClick: function (event, chartContext, config) {
				var ci_cri=$("#ci_cri").val();
				var state_code=$("#state_code").val();
				var dist_code=$("#dist_code").val();
				var url='home/fetchCaseTypeWise';
				//alert(config.dataPointIndex)
				var active_tab=$.session.get("active_tab");
				var postdata='casetypeval='+config.dataPointIndex+'&ci_cri='+ci_cri+'&state_code='+state_code+'&dist_code='+dist_code+'&active_tab='+active_tab;
				
				if(active_tab=='disposed')
				{
					var disp_year=$("#sel_year").val();
					postdata+='&disp_year='+disp_year;
				}

				
				ajaxCall({url:url,postdata:postdata,callback:callback});
				function callback(result)
				{	
					if(state_code==null)
							state_code='';
					 if(dist_code==null)
							dist_code='';
					if(result.casetype_name!='')
					{
						$("#case_type_breadcrumb").show();
						$("#case_type_breadcrumb").html(result.casetype_name+'&nbsp;&nbsp;<a href="#" onclick=$("#case_type_breadcrumb").html("");fetchPendDashboard('+ci_cri+',"'+active_tab+'"); ><i class="fa fa-times text-white"></i></a>');
					}
					else
						$("#case_type_breadcrumb").hide();

					var casetype=result.mattertype_count;
					casetype=casetype.replaceAll('~',',');
					casetype=JSON.parse("["+casetype+"]");
					matterTypeData=JSON.parse("["+casetype+"]");
					ageData=result.agewise_count;
					stagePieData=result.stagewise_count;
					disposalPieData=result.dispNatureCount;

					$("#casetype").val(result.casetype);
				
					matterType('Matter Type Pendency',casetype);
					//stageChart('Stage Wise Pendency',result.stagewise_count,111,result.purposename);
					//alert(result.purposename);
					pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
					
					 agewiseLineChart(result.year,result.year_count);
					//alert(result.year_count);
					//stageWiseBarChart(result.purpose_name,result.purpose_count);
					 

					$("#agewisetbl").html('');
					$('#agewisetbl').append(result.agewiseCount);
					$("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

					$("#stagetbl").html('');
					$('#stagetbl').append(result.stagewiseCount);
				//	alert(result.stagewiseCount);
					$("#tblStagewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});  				
					
				/*	$("#StageWisePInDropdowntbl").html('');
					$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
					$("#stageCharttbl").DataTable();*/

					$("#ageBarInDropdowntbl").html('');
					$('#ageBarInDropdowntbl').append(result.ageChartcount);
					$("#tblAgeChartcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
	  
					if(active_tab=='pending')
					{
						 //stageChart('stage Category',result.stagewise_count,111,result.purposename);
						 stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name);
						 agewiseLineChart(result.year,result.year_count);
						 $("#ageline").val(result.year);
						 $("#agelinecount").val(result.year_count);
						delayReasonBarChart(result.delayName,result.delay_count);
						instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
						   $("#StageWisePInDropdowntbl").html('');
                                        $('#StageWisePInDropdowntbl').append(result.stagewisePICount);
                                        $("#stageCharttbl").DataTable({dom: 'lrfBtip',
			  buttons: [
				{ 
					"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
					exportOptions: {
						columns: ':visible'
					}
				},
				{
					"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
					exportOptions:{
						columns: ':visible'
					}
				},
				{
					"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
					exportOptions:{
						columns: ':visible'
					}
				}]});
				
							$("#delaytbl").html('');
							$('#delaytbl').append(result.delaywiseCount);  	
							$("#tblDelaywisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
							
							$("#instVsDisptbl").html('');
							$("#tblInstDispCount").html('');

							var	year_arr		  =		result.insyear.split("~");
							var 	inst_count		  =		result.ins_count.split("~");
							var	dispo_count    =		result.disp_count.split("~");
							
							var 	tot_instwise	=	0; 
							var	tot_dispwise =	0;

							$('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:90vh;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
							 for(i=0; i<year_arr.length; i++)
								 {
										tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
										tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);		
							//$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td>'+inst_count[i]+'</td><td>'+dispo_count[i]+'</td></tr> ');
						 //	$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');

					if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}

				}
								$('#instVsDisptbl').append(' </tbody>');
								$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_instwise)+'</th><th>'+moneyFormatIndia(tot_dispwise)+'</th> </tr> </tfoot></table>');
								$("#tblInstDispCount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
						}
						else
						{
							delayReasonBarChart(result.dispYear,result.dispCount);
						//	disposalNature(result.dispNatureName,result.dispNatureCount);
							disposalNatureBarChart(result.subNatureName,result.subNatureCount); 
							stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);		
							stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);
							dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);
							$("#pendageline").val(result.pend_age_year);
							$("#ageline").val(result.pend_age_cnt);
							$("#agelinecount").val(result.year_count);

							$("#agewisetbl").html('');
							$("#tblAgewisecount").html('');

							var     pendAge_year_arr             =             result.pend_age_year.split('~');
							var     pendAge_year_arr             =             JSON.parse("["+pendAge_year_arr+"]");

							var     pendAge_count                 =             result.pend_age_cnt.split("~");
							var     yearwise_count                 =                result.year_count.split("~");

							var     tot_yearwise     =  0;
							var     tot_pendAge     =  0;

							$('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:90vh;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');

							for(i=0; i<pendAge_year_arr.length; i++)
							{
								tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
								tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

								if(yearwise_count[i]=='' || yearwise_count[i]==undefined)
                				                        yearwise_count[i]=0;
		
								
//$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
							
								
					if(state_code=='' && dist_code=='')
					{
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}
					else
					{
						$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
					}
				}

                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_pendAge)+'</th><th>'+moneyFormatIndia(tot_yearwise)+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});




							$("#delaytbl").html('');
							$('#delaytbl').append(result.timetoDispCount);  	
							$("#tblTimetoDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

							/*$("#instVsDisptbl").html('');
							$('#instVsDisptbl').append(result.natureOfDispCount);  	
							$("#tblnatureOfDispcount").DataTable();*/


							$("#stagetbl").html('');
				                        $('#stagetbl').append(result.natureOfDispCount);
				                        $("#tblnatureOfDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

				                        $("#StageWisePInDropdowntbl").html('');
				                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
				                        $("#tblnatureOfDispPIcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
							 
/*							$("#disaposalNatureChartTbl").html('');
							$('#disaposalNatureChartTbl').append(result.natureOfDispPICount);  	
							$("#tblnatureOfDispPIcount").DataTable();*/
							 
						}
				}
				
			 },
				 mounted: function(chartContext, config) {
        window.dispatchEvent(new Event('resize'));
      },
				
			},
			toolbar: {
            show: true
          }
        },
     plotOptions: {
	  bar: {
		horizontal: true,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '15px',
		colors: ['#fff']
	  }
	},
		title: {
          text: case_gr+' case type'
        },
	 
	stroke: {
	  show: false,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: true,
	  intersect: false,

	},

		colors:["#517393","#ff0000"],
        dataLabels: {
          enabled:true,
			 
			  style: {
				colors: ['#333'],
				fontSize: '10px',
						
				
				
			  },
			  background: {
				enabled: true,
				foreColor: '#000',
				borderRadius: 2,
				padding: 2,
				opacity: 0,
				borderWidth: 1,
				borderColor: '#fff'
			  },
			offsetX: 50
        },
        xaxis: {
          categories:label1,
		labels: {
          show: false,
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },}

        },
			yaxis: {
      show: true,
      showAlways: true,
      showForNullSeries: true,
      labels: {
          show: true,
          align: 'right',
          minWidth: 0,
          maxWidth: 160,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-yaxis-label',
          },
          offsetX: 0,
          offsetY: 0,
          rotate: 0,
      },
  }
			
		};
		
		if(casetypepiechart==undefined)
		{
			$('#pendash1chart').html('');
			casetypepiechart = new ApexCharts(document.querySelector("#pendash1chart"), pendash1options);
			casetypepiechart.render();
		}
		else
		{
			casetypepiechart.updateOptions(pendash1options);
		}
}
/*function updateNationalCaseType(name,datacount)
{
	datacount=datacount.replaceAll('~',',');
	data=JSON.parse("["+datacount+"]");
	label=name.replaceAll('~',',');
	label1=label.replaceAll('#',' ');//alert(label1);
	label1=JSON.parse("["+(label1)+"]");
	//var total=data.slice(0, -1);
	total=JSON.parse("["+data+"]");
	//alert(total.length);
	var dynamicWidth1='90%'
	if(total.length > 12)
	{
		dynamicWidth1='90%'
	}
	else 
	{
		dynamicWidth1=total.length*8;
		dynamicWidth1=dynamicWidth1+'%';
	}
	casetypepiechart.updateOptions({
		series: [{
			name: "Count",
			data: data
		}],
		chart: {
			height:dynamicWidth1
		},
		xaxis: {
		categories:label1
		}
	});
}*/
function matterType(dynamictitle,data)
{ 	
	matterTypeData=data;	
	//var matterTchart='';
	color= ['#6f917b','#d6b17b','#a6695b','#88b6ca','#e66571','#3DAAAF'];
	$('#matterTypeTitle').html(dynamictitle);
	$('#ins_year').val('');
	$('#ins_year').chosen('destroy');
	
	
	var mtoptions = {
		series: data,
		chart: {
			width: '80%',
			type: 'pie',
		
			events: {
				dataPointSelection: function (event, chartContext, config) {					 
					var ci_cri=$("#ci_cri").val();
				 
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					 
					//var state_code=state_code.trim();
					 
					var url='home/fetchMatterType';
					var active_tab=$.session.get("active_tab");
					$("#regCasetype").val(config.dataPointIndex);
					var postdata='mattertypeval='+config.dataPointIndex+'&ci_cri='+ci_cri+'&active_tab='+active_tab;

					if(state_code==null)
					{state_code=='';}
					if(dist_code==null)
					{dist_code=='';}
					 
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
 
					if(active_tab=='disposed')
					{  
						var disp_year=$("#sel_year").val();
						postdata+='&disp_year='+disp_year;
					}

					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	$('#case_type_gr').chosen('destroy');
						$("#casetype").val('');
						nationalCaseType(result.mattertype,result.cases_count,result.case_gr);
						$('#case_type_gr  option[value='+config.dataPointIndex+']').prop("selected", true);
						$("#chart9tbl").html('');
						$('#chart9tbl').append(result.casecount);	 
						$("#tblCasetype").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
						//$('#tblCasetype').append(result.casecount);

						 
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		disposalPieData=result.dispNatureCount;
	 
		pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
		 
		agewiseLineChart(result.year,result.year_count);		  
		
		$("#agewisetbl").html('');
		$('#agewisetbl').append(result.agewiseCount);
		$("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		
		$("#stagetbl").html('');
		$('#stagetbl').append(result.stagewiseCount);
		$("#tblStagewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});	 
 	 	 
		$("#ageBarInDropdowntbl").html('');
		$('#ageBarInDropdowntbl').append(result.ageChartcount);
		$("#tblAgeChartcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		  
		if(active_tab=='pending')
		{
			stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name);
			delayReasonBarChart(result.delayName,result.delay_count);
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
			stageChart('Stage Category',result.stagewise_count,111,result.purposename);

			$("#StageWisePInDropdowntbl").html('');
			$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
			$("#stageCharttbl").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			$("#delaytbl").html('');
			$('#delaytbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
			 
			$("#instVsDisptbl").html('');
			$("#tblInstDispCount").html('');
			 
			var	year_arr		  =		result.insyear.split("~");
			var 	inst_count		  =		result.ins_count.split("~");
			var	dispo_count    =		result.disp_count.split("~");

			var 	tot_instwise	=	0; 
			var	tot_dispwise =	0;
				 $('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
			 for(i=0; i<year_arr.length; i++)
			 {
							tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
							tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);

					   if((state_code=='' && dist_code=='') || (state_code==null && dist_code==null))
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
					}
					else if((state_code!='' && dist_code=='') ||  (state_code!='' && dist_code==null))
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
			 }
			$('#instVsDisptbl').append(' </tbody>');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_instwise+'</th><th>'+tot_dispwise+'</th> </tr> </tfoot></table>');
			$("#tblInstDispCount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		}
		else
		{
			delayReasonBarChart(result.dispYear,result.dispCount);
			stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);	
			stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);
			dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);

			$("#agewisetbl").html('');
                        $("#tblAgewisecount").html('');

                        var     pendAge_year_arr             =             result.pend_age_year.split('~');
                        var     pendAge_year_arr             =             JSON.parse("["+pendAge_year_arr+"]");
                        var     pendAge_count                =             result.pend_age_cnt.split("~");
                        var     yearwise_count               =                result.year_count.split("~");

                         var     tot_yearwise    =  0;
                         var     tot_pendAge     =  0;

                        $('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');

                        for(i=0; i<pendAge_year_arr.length; i++)
                        {
                                tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
                                tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

                        //      $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td>'+pendAge_count[i]+'</td><td>'+yearwise_count [i]+'</td></tr> ');
						if(yearwise_count[i]=='' || yearwise_count[i]==undefined)
                                        yearwise_count[i]=0;
								
                                if((state_code=='' && dist_code=='') || (state_code==null && dist_code==null))
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
                                }
                                else if(state_code!='' && dist_code=='' )
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
                                }
                                else
                                {
                                      //  $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
									 $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
                                }
                        }
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});


			$("#delaytbl").html('');
			$('#delaytbl').append(result.timetoDispCount);  	
			$("#tblTimetoDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
 

			$("#stagetbl").html('');
                        $('#stagetbl').append(result.natureOfDispCount);
                        $("#tblnatureOfDispcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			$("#StageWisePInDropdowntbl").html('');
                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
                        $("#tblnatureOfDispPIcount").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});

			 
	}
			 

					}
				}
			}
		},
		legend: {
			show: false,
			position: 'bottom'
		},
			
		labels: ['Original', 'Appeal', 'Application', 'Execution'],
		colors:color,
		responsive: [{
			breakpoint: 480,
			options: {
				chart: {
					width: 200
				},
				legend: {
					position: 'bottom'
				}
			}
		}],
		title:{
			text:'Case Category',		
		}
	};
		
		 
	if(matterTchart==undefined || matterTchart=='')
	{
	 	$("#MatterTypeInDropdown").html('');
		matterTchart = new ApexCharts(document.querySelector("#MatterTypeInDropdown"), mtoptions);
		setTimeout(function(){matterTchart.render()},1500);
		
	}
	else
	{
		setTimeout(function(){matterTchart.updateSeries(matterTypeData)},500);
	}
}

function updateMatterType()
{
	setTimeout(function(){matterTchart.updateSeries(matterTypeData)},500);
}



function fetchCasetypeGroup(url,get_val)
{	 
					 //$("#sel_search_by option:selected").val();
					// $('.case_type_gr option:eq(1)').prop('selected', true);
					
					//$('#case_type_gr_chosen').chosen('destroy');
					//$('#case_type_gr_chosen').val('get_val');
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var disp_year=$("#sel_year").val();
					var url='home/fetchMatterType';
					var active_tab=$.session.get("active_tab");
					$("#regCasetype").val(get_val);
					if(state_code==null || state_code=='null')
					{state_code=='';}
					if(dist_code==null)
					{dist_code=='';}

					if(state_code==' ')
					{state_code=='';}
					if(dist_code==' ')
					{dist_code=='';}

					
					var postdata='mattertypeval='+get_val+'&ci_cri='+ci_cri+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					if(disp_year!='' || disp_year!=undefined)
						postdata+='&disp_year='+disp_year;

	// alert(postdata);return false;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{		
						nationalCaseType(result.mattertype,result.cases_count,result.case_gr);						
						$("#chart9tbl").html('');
						$('#chart9tbl').append(result.casecount);	 
						$("#tblCasetype").DataTable();
						//$('#tblCasetype').append(result.casecount);

						//new
								 
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		disposalPieData=result.dispNatureCount;
	 
		pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
		 
		agewiseLineChart(result.year,result.year_count);		  
		
		$("#agewisetbl").html('');
		$('#agewisetbl').append(result.agewiseCount);
		$("#tblAgewisecount").DataTable();
		
		$("#stagetbl").html('');
		$('#stagetbl').append(result.stagewiseCount);
		$("#tblStagewisecount").DataTable();	 
 	 	 
		$("#ageBarInDropdowntbl").html('');
		$('#ageBarInDropdowntbl').append(result.ageChartcount);
		$("#tblAgeChartcount").DataTable();
		  
		if(active_tab=='pending')
		{
			stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name);
			delayReasonBarChart(result.delayName,result.delay_count);
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
			stageChart('Stage Category',result.stagewise_count,111,result.purposename);


			$("#StageWisePInDropdowntbl").html('');
			$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
			$("#stageCharttbl").DataTable();

			$("#delaytbl").html('');
			$('#delaytbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount").DataTable();
			 
			$("#instVsDisptbl").html('');
			$("#tblInstDispCount").html('');
			 
			var	year_arr		  =		result.insyear.split("~");
			var 	inst_count		  =		result.ins_count.split("~");
			var	dispo_count    =		result.disp_count.split("~");

			var 	tot_instwise	=	0; 
			var	tot_dispwise =	0;
				 $('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
			 for(i=0; i<year_arr.length; i++)
			 {
							tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
							tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);

					if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(inst_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(dispo_count[i])+'</a></td></tr> ');
					}
			 }
			$('#instVsDisptbl').append(' </tbody>');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_instwise)+'</th><th>'+moneyFormatIndia(tot_dispwise)+'</th> </tr> </tfoot></table>');
			$("#tblInstDispCount").DataTable();
		}
		else
		{
			delayReasonBarChart(result.dispYear,result.dispCount);
			stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);
			stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);
			dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);

				$("#agewisetbl").html('');
                        $("#tblAgewisecount").html('');

                        var     pendAge_year_arr             =             result.pend_age_year.split('~');
                        var     pendAge_year_arr             =             JSON.parse("["+pendAge_year_arr+"]");
                        var     pendAge_count                =             result.pend_age_cnt.split("~");
                        var     yearwise_count               =                result.year_count.split("~");

                         var     tot_yearwise    =  0;
                         var     tot_pendAge     =  0;

                        $('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');

                        for(i=0; i<pendAge_year_arr.length; i++)
                        {
                                tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
                                tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

                        //      $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td>'+pendAge_count[i]+'</td><td>'+yearwise_count [i]+'</td></tr> ');
				if(yearwise_count[i]=='' || yearwise_count[i]==undefined)
                                        yearwise_count[i]=0;

                                //if(state_code=='' && dist_code=='')
								if((state_code=='' && dist_code=='') || (state_code==null && dist_code==null))
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                                else if(state_code!='' && dist_code=='' || (state_code!='' && dist_code==null))
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                                else
                                {
                                      //  $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
									 $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(pendAge_count[i])+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +moneyFormatIndia(yearwise_count[i])+'</a></td></tr> ');
                                }
                        }
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+moneyFormatIndia(tot_pendAge)+'</th><th>'+moneyFormatIndia(tot_yearwise)+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable();


			$("#delaytbl").html('');
			$('#delaytbl').append(result.timetoDispCount);  	
			$("#tblTimetoDispcount").DataTable();
 

			$("#stagetbl").html('');
                        $('#stagetbl').append(result.natureOfDispCount);
                        $("#tblnatureOfDispcount").DataTable();

			$("#StageWisePInDropdowntbl").html('');
                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
                        $("#tblnatureOfDispPIcount").DataTable();

			 
	}
			 

					}

}

function get_casetypeWiseDelay(url,get_val)
{
	 
					 //$("#sel_search_by option:selected").val();
					// $('.case_type_gr option:eq(1)').prop('selected', true);
					
					//$('#case_type_gr_chosen').chosen('destroy');
					//$('#case_type_gr_chosen').val('get_val');
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var url='home/fetchMatterType';
					var active_tab=$.session.get("active_tab");
					$("#mattertypeval").val(get_val);
					
					var postdata='mattertypeval='+get_val+'&ci_cri='+ci_cri+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
	// alert(postdata);return false;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{		
						nationalCaseType(result.mattertype,result.cases_count,result.case_gr);
						
						$("#chart9tbl").html('');
						$('#chart9tbl').append(result.casecount);	 
						$("#tblCasetype").DataTable();
						//$('#tblCasetype').append(result.casecount);

					}

}


function pendingCasesChartT2(title,tot_pend,color,id)
{
	// var agechart='';
	ageData=tot_pend;
	$('.ageWiseChart').html('').attr('id', 'ageWiseChart'+id);
	tot_pend=ageData.replaceAll('~',',');
	tot_pend=JSON.parse("["+tot_pend+"]");

	/*total_age=total_age.replaceAll('~',',');
	total_age=JSON.parse("["+total_age+"]");*/

	$('#ageTitle').html(title);
		
		$("#ageBarInDropdowntbl").hide();
		$("#ageBarInDropdown").show(); 
		$("#agechart1btn").hide();
		$("#ageChartTblBtn").show();
//var percentage=(tot_pend/total_age)*100;
//alert(percentage);
	var ageoptions = {
	  series: [ 
	  {
		  name: 'Total',
	  data: tot_pend
	}, /*{
			  name: 'Percentage',
	  data: total_age,
	}*/],
	  chart: {
	  type: 'bar',
	  height: '80%',
		  toolbar: {
            show: false
          }
			,events: {
			 markerClick: function (event, chartContext, config)
			 {
					
					var url='home/fetchAgewise/'+config.dataPointIndex;
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var active_tab=$.session.get("active_tab");
					var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					var case_type=$("#casetype").val();
					if(case_type!='')
						postdata+='&case_type='+case_type; 
					
					if(active_tab=='disposed')
					{
						var disp_year=$("#sel_year").val();
						postdata+='&disp_year='+disp_year;
					}

					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	 
						if(result.age_label!='')
						{ 
							$("#age_breadcrumb").show();
							if(active_tab=='pending')
							{
								$("#agewisetbl").html('');
								$('#agewisetbl').append(result.agewiseCount);	 
								$("#tblAgewisecount").DataTable({dom: 'lrfBtip',
									buttons: [
									{ 
										"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
										exportOptions: {
										columns: ':visible'
										}
									},
									{
										"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
										exportOptions:{
										columns: ':visible'
										}
									},
									{
										"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
										exportOptions:{
										columns: ':visible'
									}
									}]
								});
								var ageline=$("#ageline").val();
								var agelinecount=$("#agelinecount").val();
								$("#age_breadcrumb").html(result.age_label+'&nbsp;&nbsp;<a href="#" onclick=$("#age_breadcrumb").html("");agewiseLineChart(\''+ageline+'\',\''+agelinecount+'\'); ><i class="fa fa-times text-white"></i></a>');
							}
							else
							{
								var pendageline=$("#pendageline").val();
								var ageline=$("#ageline").val();
								var agelinecount=$("#agelinecount").val();
								$("#age_breadcrumb").html(result.age_label+'&nbsp;&nbsp;<a href="#" onclick=$("#age_breadcrumb").html("");agewiseLineChart(\''+pendageline+'\',\''+ageline+'\',\''+agelinecount+'\'); ><i class="fa fa-times text-white"></i></a>'); 
							} 
						}
						else
							$("#age_breadcrumb").hide();

						if(active_tab=='pending') 
							agewiseLineChart(result.year,result.year_count);
						else
						{
							dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);						
						
														$("#agewisetbl").html('');
                                                        $("#tblAgewisecount").html('');

                                                        var     pendAge_year_arr             =             result.pend_age_year.split('~');
                                                        var     pendAge_year_arr             =             JSON.parse("["+pendAge_year_arr+"]");

                                                        var     pendAge_count                 =             result.pend_age_cnt.split("~");
                                                        var     yearwise_count                =                result.year_count.split("~");

                                                        var     tot_yearwise     =  0;
                                                        var     tot_pendAge      =  0;

                                                        $('#agewisetbl').append('<table id="tblAgewisecount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:275px;"><thead><tr><th>Years</th><th>Pending</th><th>Disposal</th></tr></thead><tbody>  ');

                                                        for(i=0; i<pendAge_year_arr.length; i++)
                                                        {
                                                                tot_pendAge             =               (+tot_pendAge) + (+pendAge_count[i]);
                                                                tot_yearwise            =               (+tot_yearwise) + (+yearwise_count [i]);

                                                                if(state_code=='' && dist_code=='')
                                                                {
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
                                                                }
                                                                else if(state_code!='' && dist_code=='' )
                                                                {
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
                                                                }
                                                                else
                                                                {
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
                                                                }
                                                        }

                                $('#agewisetbl').append(' </tbody>');
                                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th><th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
                                $("#tblAgewisecount").DataTable();
						}
					}
                 	},				
			}
	},
	plotOptions: {
	  bar: {
		horizontal: true,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '12px',
		colors: ['#fff']
	  }
	},
	stroke: {
	  show: false,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: true,
	  intersect: false
	},
		  title:{
              text:'Age Wise Pendency',		
		},
		  fill: {
  colors: [color]
},
	xaxis: {
	   categories: ['0 to 1 Years', '1 to 3 Years', '3 to 5 Years', '5 to 10 Years', '10 to 20 Years', '20 to 30 Years','Above 30 Years'],
		   labels: {
          show: true,
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },}
	},

	};
	if(agechart==undefined || agechart=='')
	{
		
		$("#ageBarInDropdown").html('');
		agechart = new ApexCharts(document.querySelector("#ageBarInDropdown"), ageoptions);
		agechart.render();
	}
	else
	{
		setTimeout(function(){agechart.updateOptions({
			series: [{
				name: "Count",
				data: tot_pend
			}]
		})},500);
	}

}
function updatePendingCasesChartT2()
{
	tot_pend=ageData.replaceAll('~',',');
	tot_pend=JSON.parse("["+tot_pend+"]");
	setTimeout(function(){agechart.updateOptions({
		series: [{
			name: "Count",
			data: tot_pend
		}]
	})},500);
}

function stageChart(title1,data,id,label)
{
	// var swchart='';
	stagePieData=data;
	
	data=stagePieData.replaceAll('~',',');	  
	data=JSON.parse("["+data+"]");
 	  
	label=label.replaceAll('~',',');
	label=label.replaceAll('#',' ');
	label=JSON.parse("["+label+"]");	 
 
	$('#stageTitle').html(title1);
	var swoptions = {
          series: data,
          chart: {
          width: '80%',
          type: 'pie',
			  events: {
			    dataPointSelection: function (event, chartContext, config) {
					
					var url='home/fetchstagewise/'+config.dataPointIndex;
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var case_type=$("#casetype").val();
					var mattertypeval='';

			var regCasetype=$("#regCasetype").val();
			 
			if(regCasetype =='')
					var mattertypeval=$("#case_type_gr").val();

					var active_tab=$.session.get("active_tab");
					if(active_tab=='pending')
						var stage_ready=$('input[name="Stagereadyradio"]:checked').val();
					else
						var stage_ready=$('input[name="Stagedispreadyradio"]:checked').val();

					
					var postdata='ci_cri='+ci_cri+'&stage_ready='+stage_ready+'&case_type='+case_type+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					if(regCasetype!='')
						postdata+='&regCasetype='+regCasetype;
					if(mattertypeval!='')
						postdata+='&mattertypeval='+mattertypeval; 
					
					if(active_tab=='disposed')
					{
						var disp_year=$("#sel_year").val();
						postdata+='&disp_year='+disp_year;
					}
					var case_type=$("#casetype").val();
					if(case_type!='')
						postdata+='&case_type='+case_type;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	
						if(active_tab=='pending')
						{
							stageWiseBarChart(result.purpose_name,result.purpose_count,result.purpose_name);
							 $("#stagetbl").html('');
							 $('#stagetbl').append(result.stagewiseCount);				 
							 $("#tblStagewisecount").DataTable();  
						}
						else
						{
							stageWiseBarChart(result.subNatureName,result.subNatureCount,result.subNatureFullName);		
							$("#stagetbl").html('');
							$('#stagetbl').append(result.natureOfDispCount);
							$("#tblnatureOfDispcount").DataTable({dom: 'lrfBtip',
							  buttons: [
								{  
									"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
									exportOptions: {
										columns: ':visible'
									}
								},
								{
									"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
									exportOptions:{
										columns: ':visible'
									}
								},
								{
									"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
									exportOptions:{
										columns: ':visible'
									}
								}]});
						}
					}
					
                 },
				
			}

        },
			  legend: {
			     show: false,
              position: 'bottom',			
            },
		dataLabels: {
	  enabled: true,
	  },

        labels:label,
		colors: ['#EE964B', '#dfb00c', '#28AFB0', '#19647E', '#1F271B', '#96a945', '#1fa8f2'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
			title:{
              text:''+title1,		
		}
        };
		
		if(swchart==undefined || swchart=='')
		{
			$("#StageWisePInDropdown").html('');
			swchart = new ApexCharts(document.querySelector("#StageWisePInDropdown"), swoptions);
		    swchart.render();	 
		}
		else
		{
			//setTimeout(function(){swchart.updateSeries(data)},1000);
			setTimeout(function(){swchart.updateOptions(swoptions)},1000);
		}
}

function fetchStageWise()
{
	var stage=$('input[name=Stagereadyradio]:checked').val();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	
	var url='home/updateStageWiseBar';
	var ci_cri=$("#ci_cri").val();
	var active_tab=$.session.get("active_tab");
	var postdata='ci_cri='+ci_cri+'&stage='+stage+'&active_tab='+active_tab;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	var case_type=$("#casetype").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	
	if(active_tab=='disposed')
	{
		var disp_year=$("#sel_year").val();
		postdata+='&disp_year='+disp_year;
	}

//alert(postdata)
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		stagePieData=result.stagewise_count;
		stageWiseBarChart(result.purpose_name,result.purpose_count); // commented by anil
		//stageChart('Stage Wise Pendency',result.stagewise_count,111,result.purposename);
		//$("#tblStagewisecount tr").remove()
		//$('#tblStagewisecount').append(result.stagewiseCount);
		
		$("#stagetbl").html('');
	        $('#stagetbl').append(result.stagewiseCount);
		if(active_tab=='pending')
			$("#tblStagewisecount").DataTable();
		else
			$("#tblnatureOfDispcount").DataTable();
 
		$("#StageWisePInDropdowntbl").html('');
		$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
	 	$("#stageCharttbl").DataTable();
	}
}

function stageWiseBarChart(purpose_name,purpose_data,disp_name)
{
	var active_tab=$.session.get("active_tab");
	//alert(active_tab)
	var a=purpose_data.split('~');
	var b=0;
	for(var i=0;i<a.length;i++)
	{
		b=b+parseInt(a[i]);
	}
	purpose_data=purpose_data.replaceAll('~',',');
	data=JSON.parse("["+purpose_data+"]");

	label=purpose_name.replaceAll('~',',');	
	label1=label.replaceAll('#',' '); 
	label1=JSON.parse("["+(label1)+"]");

	 
	label2=disp_name.replaceAll('~',',');	
	label3=label2.replaceAll('#',' '); 
	label3=label3.replaceAll('&','/'); 
	label4=JSON.parse("["+(label3)+"]");
 
//var label4=["DISMISSED / REJECTED OTHERWISE","DISMISSED,ALLOWED / GRANTED AFTER FULL HEARING",DISPOSED OTHERWISE,TRANSFERRED,SETTLED BY ADR,WITHDRAWN,DECREED,DECIDED,ALLOWED OTHERWISE,DECREE SATISFIED,DECIDED EX-PARTE,DECREED EX-PARTE,SETTLED OUTSIDE THE COURT,REJECTED,DECREED AFTER FULL TRIAL,AWARD PASSED,DISMISSED / REJECTED AFTER FULL TRIAL / HEARING,DECREED SATISFIED IN PART,PLAINT RETURNED,ABATED,PLAINT REJECTED,COMPOUNDED,DISMISSED AS THE DECREE IS NOT EXECUTABLE,REMANDED,DISMISSED EX-PARTE,DECREED OTHERWISE,PROCEEDING STOPPED,APPEAL DISMISSED, CROSS OBJECTION ALLOWED,APPEAL DISMISSED, CROSS OBJECTION DISMISSED,FINAL REPORT,APPEAL ALLOWED, CROSS OBJECTION ALLOWED,DISCHARGED,FINAL DECREE PREPARED,ACQUITTED,SUIT DISMISSED, COUNTER CLAIM DISMISSED,CONVICTED AND SENTENCED,SUIT DISMISSED, COUNTER CLAIM DECREED,SUIT DECREED, COUNTER CLAIM DISMISED,APPEAL ALLOWED, CROSS OBJECTION DISMISSED,REFERRED TO ARBITRATION,SUIT DECREED, COUNTER CLAIMS DECREED,COMMITTED TO SESSIONS COURT,CONVICTED AND SENTENCED FOR DEATH,BAIL GRANTED,BAIL CANCELLED,CONVICTED AND RELEASED ON  PROBATION,CONVICTED AND RELEASED ON  PROBATION,CONVICTED ON PLEAD GUILTY / PLEA BARGAINING,BAIL REFUSED,SOME CONVICTED AND RELEASED ON PROBATION, SOME ACQUITTED];
	//alert(label4)
		$("#stagetbl").hide();
		$("#stageWise1chart").show(); 
		$("#stagechartbtn").hide();
		$("#stageTblbtn").show();
	
 
	var dynamicWidth1='200%'
	if(label1.length > 10)
	{
		dynamicWidth1='200%'
	}
	else 
	{
		dynamicWidth1='100%';
	}

	var stagewise1options = {
          series: [{
			   name: "Count",
          data: data
        }],
          chart: {
          type: 'bar',
          height: 250,
		width:dynamicWidth1,
			  toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: false,
			dataLabels: {
			position: 'top',
			}
          }
        },
	
		dataLabels: {
			enabled: false,
			offsetX: 0,
		    offsetY: -	60,
			style: {
				fontSize: '10px',
				colors: ['#555']
			},
				formatter: function (val, opt) {
					var c=val *100 /b;
                return  ["("+c.toFixed(2)+"%)",val] 
              },
		},
		stroke: {
			show: false,
			width: 1,
			colors: ['#fff']
		},
		tooltip: {
		  shared: true,
		  intersect: false,
		x: {
			  formatter: function(value, { dataPointIndex, w }) {
				// Use a different label for tooltip here
				const tooltipLabels = label4;
				return tooltipLabels[dataPointIndex];
			  }
			}
		},
		colors: ['#009dae', '#00ff00'],
        
		
        xaxis: {
          categories:label1,
			  		labels: {
			  rotate: -15,
          rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },
		 offsetX: 10,

      },
        },
			  yaxis:{
		  labels: {
          show: true,
			},
		  }
        };
		if(stagebarchart==undefined)
		{
			
			$("#stageWise1chart").html('');
			stagebarchart = new ApexCharts(document.querySelector("#stageWise1chart"), stagewise1options);
			stagebarchart.render();
		}
		else
		{$("#stageWise1chart").html('');
			stagebarchart.updateOptions(stagewise1options);
		 
		}

}

function updateStageChart()
{
	data=stagePieData.replaceAll('~',',');
	//alert(data)
	data=JSON.parse("["+data+"]");
	setTimeout(function(){swchart.updateSeries(data)},500);
}

function agewiseLineChart(year,data){

	//var agelinechart='';
//alert(year)
	year=year.replaceAll('~',',');
	year=JSON.parse("["+year+"]");

	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");
	total=JSON.parse("["+data+"]");
   
   $('#agewise1chart').show();
   $("#agewisechartbtn").hide();
   $("#agewiseTblbtn").show();
	$('#agewisetbl').hide();
 
	//alert(total.length);
	var dynamicWidth1='150%'
	if(total.length > 10)
	{
		dynamicWidth1='150%'
	}
	else 
	{
		dynamicWidth1='100%';
	}
		 var ageWise1options = {
          series: [
          {
            name: "Count",
            data: data
          }
        ],
          chart: {
          height: 250,
			   width: dynamicWidth1,
          type: 'area',
          dropShadow: {
            enabled: true,
            color: '#000',
            top: 18,
            left: 7,
            blur: 10,
            opacity: 0.2
          },
          toolbar: {
            show: true
          }
        },
        colors: ['#6B88A3', '#00ff00'],
        dataLabels: {
          enabled: true,
        },
        stroke: {
          curve: 'smooth',
			  width: 2
        },
        grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },
        markers: {
          size: 1
        },
        xaxis: {
	/*	labels: {
            rotate: -45,
	 style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },

          },*/
          categories: year,
		labels: {
          rotate: -25,
	 rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },


      },
        },
		yaxis:{
		  labels: {
          show: false,
			},
		  }
        
        };
		if(agelinechart==undefined || agelinechart=='')
		{
			
			$("#agewise1chart").html('');
			agelinechart = new ApexCharts(document.querySelector("#agewise1chart"), ageWise1options);
			agelinechart.render();
		}
		else
		{
			agelinechart.updateOptions(ageWise1options);
 
		}

}
/*function updateAgewiseLineChart(year,data){

	year=year.replaceAll('~',',');
	year=JSON.parse("["+year+"]");

	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");
	total=JSON.parse("["+data+"]");
	//alert(total.length);
	var dynamicWidth1='500%'
	if(total.length > 10)
	{
		dynamicWidth1='500%'
	}
	else 
	{
		dynamicWidth1='100%';
	}
	agelinechart.updateOptions({
		series: [{
			name: "Count",
			data: data
		}],
		chart: {
			width:dynamicWidth1
		},
		xaxis: {
		categories:year
		}
	});

}*/
function delayReasonBarChart(delayName,delayCount)
{
	var delaybarchart='';
	delayCount=delayCount.replaceAll('~',',');
	data=JSON.parse("["+delayCount+"]");
	
	label=delayName.replaceAll('~',',');
	label1=label.replaceAll('#',' ');
	
	label1=JSON.parse("["+(label1)+"]");

	var a=delayCount.split(',');
	var b=0;
	for(var i=0;i<a.length;i++)
	{
		//alert(a[i])
		b=b+parseInt(a[i]);
	}
//alert(b)
		$("#delaytbl").hide();
		$("#delayWise1chart").show(); 
		$("#delaychartbtn").hide();
		$("#delayTblbtn").show();

	//alert(lb);
	if(data.length > 10)
	{
		dynamicWidth1='200%'
	}
	else if(data.length < 5 && data.length> 0)
	{
		dynamicWidth1='50%'
	}
	else 
	{
		dynamicWidth1='100%';
	}
	var delayWise1options = {
          series: [{
			   name: "Count",
          data: data
        }],
          chart: {
          type: 'bar',
          height: 250,
		width: dynamicWidth1,
			  toolbar: {
            show: false
          }
        },
        plotOptions: {
			bar: {
				borderRadius: 0,
				horizontal: false,
				dataLabels: {
			position: 'top',
			}
			}
        },
		dataLabels: {
			enabled: true,
			offsetX: 0,
		    offsetY: -	50,
			style: {
				fontSize: '10px',
				colors: ['#555']
			},
					formatter: function (val, opt) {
					var c=val *100 /b;
                return  ["("+c.toFixed(2)+"%)",val] 
              },
		},
		stroke: {
		  show: false,
		  width: 1,
		  colors: ['#fff']
		},
		tooltip: {
		  shared: true,
		  intersect: false
		},
		colors: ['#bd582d','#2D92BD', '#00ff00'],
		
        xaxis: {
			categories: label1,
			labels:{
				rotate: -25,
				rotateAlways: true,
				style: {
					colors: [],
					fontSize: '10px',
					fontFamily: 'Helvetica, Arial, sans-serif',
					fontWeight: 400,
					cssClass: 'apexcharts-xaxis-label',
				}
			}
        },
		yaxis:{
		  labels: {
          show: true,
			},
		}
    };
	if(delaybarchart==undefined || delaybarchart=='')
	{
		$("#delayWise1chart").html('');
		delaybarchart = new ApexCharts(document.querySelector("#delayWise1chart"), delayWise1options);
		delaybarchart.render();
	}
	else
	{
		delaybarchart.updateOptions(delayWise1options);
	}
}

function instVsDispPendChart(year,ins_count,disp_count)
{
	//console.log(year+"====================="+ins_count+"+++++++++++++++++="+disp_count)
	year=year.replaceAll('~',',');
	year=JSON.parse("["+year+"]");
	ins_count=ins_count.replaceAll('~',',');
	ins_count=JSON.parse("["+ins_count+"]");
	disp_count=disp_count.replaceAll('~',',');
	disp_count=JSON.parse("["+disp_count+"]");	 

	    $("#instVsDisptbl").hide();
		$("#instVsDisp1chart").show();
		$("#insDispchartbtn").hide();
		$("#insDispTblbtn").show();
	//var instvsdispchart='';
	var instVsDisp1options = {
		series: [
		{
			name: "Institution",
			data: ins_count
		},
		{
			name: "Disposal",
			data: disp_count
		}
		],
		chart: {
			height: 250,
			width: '100%',
			type: 'line',
			dropShadow: {
			enabled: true,
			color: '#000',
			top: 18,
			left: 7,
			blur: 10,
			opacity: 0.2
			},
			toolbar: {
				show: true
			}
		},
		colors: ['#3e8e7e', '#b85252'],
		dataLabels: {
			enabled: true,
		},
		stroke: {
			curve: 'smooth',
			width: 2
		},
		grid: {
			borderColor: '#e7e7e7',
			row: {
				colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
				opacity: 0.5
			}
		},
		markers: {
			size: 1
		},
			xaxis: {
			categories: year,
			labels: {
				style: {
				colors: [],
				fontSize: '10px',
				fontFamily: 'Helvetica, Arial, sans-serif',
				fontWeight: 400,
				cssClass: 'apexcharts-xaxis-label',
				}
			}
		},
		legend: {
		show: false,
		}
	};
	  
	  
	if(instvsdispchart==undefined || instvsdispchart=='')
	{
		$("#instVsDisp1chart").html('');
	 	instvsdispchart = new ApexCharts(document.querySelector("#instVsDisp1chart"), instVsDisp1options);
		 instvsdispchart.render();		 
	}
	else
	{
		instvsdispchart.updateOptions(instVsDisp1options);		 		 
	}
}

function fetchInsDisp()
{
	var year=$("#ins_year").val();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var case_type=$("#casetype").val();
	var url='home/updateInstitutionDisp';
	var ci_cri=$("#ci_cri").val();
	var mattertypeval=$("#mattertypeval").val();
	var active_tab=$.session.get("active_tab");
	var postdata='ci_cri='+ci_cri+'&year='+year+'&active_tab='+active_tab+'&mattertypeval='+mattertypeval;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	if(case_type!='')
		postdata+='&case_type='+case_type;
	var yearInsDisp = year;
	if(state_code==null)
					state_code='';
			 if(dist_code==null)
					dist_code='';
	ajaxCall({url:url,postdata:postdata,callback:callback});
	
	function callback(result)
	{
		instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
		
		$("#instVsDisptbl").html('');
		$("#tblInstDispCount").html('');		 
		 
			 var	year_arr		  =		result.insyear.replace(/[$"]/g, ' ') // to remove extra " in string
			 var	year_arr		  =		year_arr.split('~');		//split string to substrings
			 var 	inst_count		  =		result.ins_count.split("~");
			 var	dispo_count    =		result.disp_count.split("~");
	 
				var 	tot_instwise	=	0; 
				var	tot_dispwise =	0;
			 $('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
			 for(i=0; i<year_arr.length; i++)
			 {
					tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
					tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);	
 
				//$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td>'+inst_count[i]+'</td><td>'+dispo_count[i]+'</td></tr> ');
//$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+est_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+est_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
				if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
					else
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
			 }
			$('#instVsDisptbl').append('</tbody>');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_instwise+'</th><th>'+tot_dispwise+'</th> </tr> </tfoot></table>');
			$("#tblInstDispCount").DataTable();
		}	
}

function disposalNature(label,data)
{	
	data1=data.replaceAll('~',',');
	data=JSON.parse("["+data1+"]");

	label=label.replaceAll('~',',');
	label=label.replaceAll('#',' ');
	label=JSON.parse("["+label+"]");
	color= ['#FFA82D','#8DB600','#FF3547','#689FB0','#FF5722','#009688','#C51162','#03A9F4','#eb3b5a','#8854d0'];
	//$('#dispNatureTypeTitle').html(dynamictitle);
	
		var mtoptions = {
		series: data,
		chart: {
		height: '200px',
		width: '50%',
		type: 'pie',
		events: {
			    dataPointSelection: function (event, chartContext, config) {
					var ci_cri=$("#ci_cri").val();
					var state_code=$("#state_code").val();
					var dist_code=$("#dist_code").val();
					var url='home/fetchDispNature';
					var active_tab=$.session.get("active_tab");
					var postdata='disp_nature='+config.dataPointIndex+'&ci_cri='+ci_cri+'&active_tab='+active_tab;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					
					if(active_tab=='disposed')
					{
						var disp_year=$("#sel_year").val();
						postdata+='&disp_year='+disp_year;
					}
					var case_type=$("#casetype").val();
					if(case_type!='')
						postdata+='&case_type='+case_type;
					
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{		
						disposalNatureBarChart(result.subNatureName,result.subNatureCount);
					}
					
                 }				
			}
        },
			  legend: {
			   show: false,
              position: 'bottom'
            },
        labels: label,
		colors:color,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };
		if(dispnaturepiechart==undefined)
		{
			$("#disaposalNatureChart").html('');
			dispnaturepiechart = new ApexCharts(document.querySelector("#disaposalNatureChart"), mtoptions);
			dispnaturepiechart.render();
		}
		else
		{
			setTimeout(function(){dispnaturepiechart.updateSeries(data)},500);
		}
}
function updateDisposalNature()
{
	data=disposalPieData.replaceAll('~',',');
	//alert(data)
	data=JSON.parse("["+data+"]");
	setTimeout(function(){dispnaturepiechart.updateSeries(data)},500);
}
function disposalNatureBarChart(name,count)
{
	//$("#natureWiseDispChart").html('');
	count=count.replaceAll('~',',');
	data=JSON.parse("["+count+"]");
	
	label=name.replaceAll('~',',');
	label1=label.replaceAll('#',' ');
	
	label1=JSON.parse("["+(label1)+"]");
	var dynamicWidth1='200%'    	 
	 
		$("#instVsDisptbl").hide();
		$("#instVsDisp1chart").show(); 		
		$("#dispwisechartbtn").hide();
		$("#dispwiseTblbtn").show(); 

	if(data.length > 10)
	{
		dynamicWidth1='200%'
	}
	else if(data.length < 5 && data.length> 0)
	{
		dynamicWidth1='50%'
	}
	else 
	{
		dynamicWidth1='100%';
	}
	var delayWise1options1 = {
          series: [{
			   name: "Count",
          data: data
        }],
          chart: {
          type: 'bar',
          height: 250,
		width: dynamicWidth1,
			  toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: false,
          }
        },
		dataLabels: {
		  enabled: false,
		  offsetX: 0,
		  style: {
			fontSize: '12px',
			colors: ['#fff']
		  }
		},
		stroke: {
		  show: false,
		  width: 1,
		  colors: ['#fff']
		},
		tooltip: {
		  shared: true,
		  intersect: false
		},
		colors: ['#73854A', '#73854A'],
      
        xaxis: {
          categories: label1,
			  		labels: {
			  			  rotate: -45,
          rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },
 
      },
        },
		yaxis:{
		  labels: {
          show: true,
			},
		  }
        };
		if(instvsdispchart1==undefined)
		{
			$("#instVsDisp1chart").html('');
			instvsdispchart1 = new ApexCharts(document.querySelector("#instVsDisp1chart"), delayWise1options1);
			instvsdispchart1.render(); 
		}
		else
		{
			instvsdispchart1.updateOptions(delayWise1options1);
			 
		}
	
       // dispnaturebarchart = new ApexCharts(document.querySelector("#natureWiseDispChart"), delayWise1options);
        //dispnaturebarchart.render();
}








/******************************************* old funcations *********************************/
function get_distData(url,get_val)
{
 //alert(url); 

	var active_tab=$.session.get("active_tab");
	var disp_year=$("#sel_year").val();
	if(active_tab=='pending' || active_tab=='disposed')
	{
		fetchPendDashboard('2',active_tab,disp_year);
//alert(active_tab)
	}
	else if(active_tab=='caseLoad')
		case_load();
	else if(active_tab=='delay')
		delay_dashboard('2');
	else
	{
    var base_url=$("#txt_base_url").val();  
    var state_code=$("#state_code").val();  
	var resend=url;
	
    if($("#dist_code").val()!="" && state_code!="")
        var resend=url+'&state_code='+state_code+'&dist_code='+$("#dist_code").val();
	else if (state_code!='')
	{
		var resend=url+'&state_code='+state_code;
	}
	requestUri(resend);  
	}
}
function charts(civ1yr_count,criminal1yr_count,tot1yr_count,civ_count,cri_count,tot_count,cri_pend,civ_pend,tot_pend,not_uploaded_data_count,tot_est,casetypechart,purposetypechart,civ_undated,cri_undated,total_undated){
	
	
/*-------------------------civil cases pie chart--------------------*/
         var per3 = civ1yr_count*100/civ_count;

	 var chart3options = {
          series: [per3.toFixed(2)],
          chart: {
          type: 'radialBar',
          offsetY: -10,
          sparkline: {
            enabled: true
          }
        },
			colors:['#EAA531'],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
              background: "#e7e7e7",
              strokeWidth: '97%',
              margin: 5, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                color: '#999',
                opacity: 1,
                blur: 2
              }
            },
            dataLabels: {
              name: {
                show: true
              },
              value: {
                offsetY: -40,
                fontSize: '16px'
              }
            }
          }
        },
        grid: {
          padding: {
            top: 0
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 53, 91]
          },
        },
        labels: ['> 1 Year old'],
		subtitle: {
			text: ['More Than 1 Year Old: '+civ1yr_count],
			align: 'center',
			margin: 5,
			offsetX: 0,
			offsetY: 10,
			floating: true,
				style: {
				  fontSize:  '16px',
				  fontWeight:  'bold',
				  fontFamily:  undefined,
				  color:  '#EAA531'
				},
		}
        };

        var chart3 = new ApexCharts(document.querySelector("#chart3"), chart3options);
        chart3.render();
/*-------------------------criminal cases pie chart--------------------*/
		var per4 = criminal1yr_count*100/cri_count;

	 var chart4options = {
          series: [per4.toFixed(2)],
          chart: {
          type: 'radialBar',
          offsetY: -10,
          sparkline: {
            enabled: true
          }
        },
			colors:['#10A2C2'],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
              background: "#e7e7e7",
              strokeWidth: '97%',
              margin: 5, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                color: '#999',
                opacity: 1,
                blur: 2
              }
            },
            dataLabels: {
              name: {
                show: true
              },
              value: {
                offsetY: -40,
                fontSize: '16px'
              }
            }
          }
        },
        grid: {
          padding: {
            top: 0
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 53, 91]
          },
        },
        labels: ['> 1 Year old'],
		subtitle: {
			text: ['More Than 1 Year Old: '+criminal1yr_count],
			align: 'center',
			margin: 5,
			offsetX: 0,
			offsetY: 10,
			floating: true,
				style: {
				  fontSize:  '16px',
				  fontWeight:  'bold',
				  fontFamily:  undefined,
				  color:  '#10A2C2'
				},
		}
        };

        var chart4 = new ApexCharts(document.querySelector("#chart4"), chart4options);
        chart4.render();

		/*-------------------------total cases pie chart--------------------*/
	
		var per = tot1yr_count*100/tot_count;

		var chart5options = {
          series: [per.toFixed(2)],
          chart: {
          type: 'radialBar',
          offsetY: -10,
          sparkline: {
            enabled: true
          }
        },
		colors:['#B0578D'],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
              background: "#e7e7e7",
              strokeWidth: '97%',
              margin: 5, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                color: '#999',
                opacity: 1,
                blur: 2
              }
            },
            dataLabels: {
              name: {
                show: true
              },
              value: {
                offsetY: -40,
                fontSize: '16px'
              }
            }
          }
        },
        grid: {
          padding: {
            top: 0
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 53, 91]
          },
        },
        labels: ['> 1 Year old'],
		subtitle: {
			text: ['More than 1 year old: '+tot1yr_count],
			align: 'center',
			margin: 5,
			offsetX: 0,
			offsetY: 10,
			floating: true,
				style: {
				  fontSize:  '16px',
				  fontWeight:  'bold',
				  fontFamily:  undefined,
				  color:  '#B0578D'
				},
		}
        };

        var chart5 = new ApexCharts(document.querySelector("#chart5"), chart5options);
        chart5.render();
      


		/*------------------------------------------------------------*/
		
	//	pendingCasesChart(civ_pend,cri_pend,tot_pend);
		/*----------------------------------------------------------------*/

		/*var per = not_uploaded_data_count*100/tot_est;

		var chart8options = {
          series: [per.toFixed(2)],
          chart: {
          type: 'radialBar',
          offsetY: -10,
          sparkline: {
            enabled: true
          }
        },
		colors:['#FF788F'],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
              background: "#e7e7e7",
              strokeWidth: '97%',
              margin: 5, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                color: '#999',
                opacity: 1,
                blur: 2
              }
            },
            dataLabels: {
              name: {
                show: true
              },
              value: {
                offsetY: -40,
                fontSize: '16px'
              }
            }
          }
        },
        grid: {
          padding: {
            top: 0
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 53, 91]
          },
        },
        labels: ['Not Uploaded'],
		subtitle: {
			text: ['No. of establishments '+ not_uploaded_data_count+'/'+tot_est],
			align: 'center',
			margin: 5,
			offsetX: 0,
			offsetY: 10,
			floating: true,
				style: {
				  fontSize:  '12px',
				  fontWeight:  'bold',
				  fontFamily:  undefined,
				  color:  '#FF788F'
				},
		}
        };

        var chart8 = new ApexCharts(document.querySelector("#chart8"), chart8options);
        chart8.render();


		----------------------------------------- Undated Cases -------------------------------
		//var total_undated=civ_undated + cri_undated;    alert(total_undated) 
		var civ_per = civ_undated*100/tot_count;//alert(tot_count)
		var cri_per = cri_undated*100/tot_count;


	//civ_per=civ_per.toFixed(2);
	//cri_per=cri_per.toFixed(2);
var options = {
          series: [civ_per,cri_per],
          chart: {
          type: 'pie',
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
            	width:100,
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
	dataLabels: {
          enabled: true,
          offsetX: 0,
          style: {
                fontSize: '12px',
                colors: ['#212529']
          },
	dropShadow:{
		enabled:false,}
        },
	/*legend: {
        show: true,
        position: 'top',
    },
	labels: ['Civil','Criminal'],
  colors: ['#e75d71', '#e0a636'],

	subtitle: {
		text: ['Civil: ' +civ_undated + ', Criminal: '+cri_undated],
                        align: 'center',
                        margin: 2,
                        offsetX: 0,
                        offsetY: 0,
                        floating: true,
                                style: {
                                  fontSize:  '12px',
                                  fontWeight:  'bold',
                                  fontFamily:  undefined,
                                  color:  '#555'
                                },
                }

        };

        var chart = new ApexCharts(document.querySelector("#chartUndated"), options);
        chart.render();
*/


	/*-------------------------------case type wise---------------------------*/
	/*casetypechart=casetypechart.replaceAll('~',',');
	casetypechart=JSON.parse("["+casetypechart+"]");
		var chart9options = {
          series: casetypechart,
          chart: {
          width: '100%',
          type: 'pie',
        },
			  legend: {
              position: 'bottom'
            },
        labels: ['Original', 'Appeal', 'Application', 'Execution'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: '100%'
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };

        var chart9 = new ApexCharts(document.querySelector("#chart9"), chart9options);
        chart9.render();
*/

	/*------------------------------stage wise----------------------------*/
		//stagewiseChart(purposetypechart);
		
		}
/*---------------------state wise pendency--------------*/

$(document).ready(function(){
	AOS.init({  once: true });
	$("#delaytbl").hide();
	$("#chart9tbl").hide();
	$("#agewisetbl").hide();
	$("#stagetbl").hide();
	$("#stagetbl1").hide();
	$("#caseTypechartbtn").hide();
	$("#agewisechartbtn").hide();
	$("#agewisechartbtn1").hide();
	$("#delaychartbtn").hide();
	$("#stagechartbtn").hide();	
	$("#instVsDisptbl").hide();
	$("#insDispchartbtn").hide();
	$("#dispwisechartbtn").hide();
	$("#caseTypechart1btn").hide(); 
	$("#MatterTypeInDropdowntbl").hide(); 
	
	$("#stagechart1btn").hide(); 
	$("#StageWisePInDropdowntbl").hide(); 

	$("#agechart1btn").hide(); 
	$("#ageBarInDropdowntbl").hide(); 
	
	$("#natofdispChartBtn").hide();
	$("#disaposalNatureChartTbl").hide();

	$("#caseTypeTblbtn").click(function(){
		$("#pendash1chart").hide();
		$("#chart9tbl").show(); 
		$("#caseTypeTblbtn").hide();
		$("#caseTypechartbtn").show(); 
	});
	$("#caseTypechartbtn").click(function(){
		$("#chart9tbl").hide();
		$("#pendash1chart").show(); 
		$("#caseTypechartbtn").hide();
		$("#caseTypeTblbtn").show();
	});

	$("#caseTypeChartTblbtn").click(function(){
			$("#MatterTypeInDropdown").hide();
			$("#MatterTypeInDropdowntbl").show(); 
			$("#caseTypeChartTblbtn").hide();
			$("#caseTypechart1btn").show(); 
		});

	/*$("#caseTypechart1btn").click(function(){
		$("#MatterTypeInDropdowntbl").hide();	 			 
		setTimeout(function(){$("#MatterTypeInDropdown").show()},500);
		$("#caseTypechart1btn").hide();
		$("#caseTypeChartTblbtn").show();
	});*/
 
	  	
		$("#caseTypechart1btn").click(function(){
		$("#MatterTypeInDropdowntbl").hide();
        setTimeout(function(){$("#MatterTypeInDropdown").toggle()},500);
		$("#caseTypechart1btn").hide();
		$("#caseTypeChartTblbtn").show();
        updateMatterType();
    });
	 

	 $("#caseTypeTblbtn1").click(function(){
		$("#pendash1chart1").hide();
		$("#chartstbl").show(); 
		$("#caseTypeTblbtn1").hide();
		$("#caseTypechartbtn1").show(); 
	});
	$("#caseTypechartbtn1").click(function(){
		$("#chartstbl").hide();
		$("#pendash1chart1").show(); 
		$("#caseTypechartbtn1").hide();
		$("#caseTypeTblbtn1").show();
	});

	$("#stageTblbtn").click(function(){
		$("#stageWise1chart").hide();
		$("#stagetbl").show(); 
		$("#stageTblbtn").hide();
		$("#stagechartbtn").show(); 
	});
	$("#stagechartbtn").click(function(){
		$("#stagetbl").hide();
		$("#stageWise1chart").show(); 
		$("#stagechartbtn").hide();
		$("#stageTblbtn").show();
	});

	 $("#stageChartTblBtn").click(function(){
		$("#StageWisePInDropdown").hide();
		$("#StageWisePInDropdowntbl").show(); 
		$("#stageChartTblBtn").hide();
		$("#stagechart1btn").show(); 
	});

	$("#stagechart1btn").click(function(){		 
		 setTimeout(function(){$("#StageWisePInDropdown").toggle()},500);
	    $("#StageWisePInDropdowntbl").hide(); 		
		$("#stagechart1btn").hide();
		$("#stageChartTblBtn").show(); 
		//updateStageChart();
	}); 

	$("#stageTblbtn1").click(function(){
		$("#stageWise1chart1").hide();
		$("#stagetbl1").show(); 
		$("#stageTblbtn1").hide();
		$("#stagechartbtn1").show(); 
	});
	$("#stagechartbtn1").click(function(){
		$("#stagetbl1").hide();
		$("#stageWise1chart1").show(); 
		$("#stagechartbtn1").hide();
		$("#stageTblbtn1").show();
	});

	 $("#stageChartTblBtn1").click(function(){
		$("#StageWisePInDropdown1").hide();
		$("#StageWisePInDropdowntbl1").show(); 
		$("#stageChartTblBtn1").hide();
		$("#stagechart1btn1").show(); 
	});

	$("#stagechart1btn1").click(function(){		 
		 //setTimeout(function(){$("#StageWisePInDropdown1").toggle()},500);
		 setTimeout(function() {$("#StageWisePInDropdown1").toggle()}, 300);
	    $("#StageWisePInDropdowntbl1").hide(); 		
		$("#stagechart1btn1").hide();
		$("#stageChartTblBtn1").show(); 
		//updateStageChart();
	}); 


	$("#agewiseTblbtn").click(function(){
		$("#agewise1chart").hide();
		$("#agewisetbl").show(); 
		$("#agewiseTblbtn").hide();
		$("#agewisechartbtn").show(); 
	});
	$("#agewisechartbtn").click(function(){
		$("#agewisetbl").hide();
		//$("#agewise1chart").show(); 
		setTimeout(function() {$("#agewise1chart").show()}, 300);
		//alert('----------')
		//setTimeout(function(){$("#agewise1chart").toggle()},100)	;
		$("#agewisechartbtn").hide();
		$("#agewiseTblbtn").show();
	});	

	 $("#ageChartTblBtn").click(function(){ 
		$("#ageBarInDropdown").hide();
		$("#ageBarInDropdowntbl").show(); 
		$("#ageChartTblBtn").hide();
		$("#agechart1btn").show(); 
	});
	$("#agechart1btn").click(function(){
		$("#ageBarInDropdowntbl").hide();
		$("#ageBarInDropdown").show(); 
		$("#agechart1btn").hide();
		$("#ageChartTblBtn").show();
	}); 


	$("#agewiseTblbtn1").click(function(){
		$("#agewise1chart1").hide();
		$("#agewisetbl1").show(); 
		$("#agewiseTblbtn1").hide();
		$("#agewisechartbtn1").show(); 
	});
	$("#agewisechartbtn1").click(function(){
		$("#agewisetbl1").hide();
		$("#agewise1chart1").show(); 
		$("#agewisechartbtn1").hide();
		$("#agewiseTblbtn1").show();
	});
	  $("#agewisependchartbtn1").hide();
	 $("#agewisePendchart").show();
	 $("#agewisePendTbl").hide();
	 $("#agewisependTblbtn1").click(function(){
		                 $("#agewisePendchart").hide();
		                 $("#agewisePendTbl").show();
		                 $("#agewisependTblbtn1").hide();
		                 $("#agewisependchartbtn1").show();
		         });
	        $("#agewisependchartbtn1").click(function(){
			                $("#agewisePendTbl").hide();
			                $("#agewisePendchart").show();
			                $("#agewisependchartbtn1").hide();
			                $("#agewisependTblbtn1").show();
			        });

	 $("#ageChartTblBtn1").click(function(){ 
		$("#ageBarInDropdown1").hide();
		$("#ageBarInDropdowntbl1").show(); 
		$("#ageChartTblBtn1").hide();
		$("#agechart1btn1").show(); 
	});
	$("#agechart1btn1").click(function(){
		$("#ageBarInDropdowntbl1").hide();
		$("#ageBarInDropdown1").show(); 
		$("#agechart1btn1").hide();
		$("#ageChartTblBtn1").show();
	}); 


	$("#delayTblbtn").click(function(){
		$("#delayWise1chart").hide();
		$("#delaytbl").show(); 
		$("#delayTblbtn").hide();
		$("#delaychartbtn").show(); 
	});
	$("#delaychartbtn").click(function(){ 
		$("#delaytbl").hide();
		$("#delayWise1chart").show(); 
		//setTimeout(function(){$("#delayWise1chart").show()},500);	 
		$("#delaychartbtn").hide();
		$("#delayTblbtn").show();
	});

	$("#insDispTblbtn").click(function(){
		$("#instVsDisp1chart").hide();
		$("#instVsDisptbl").show(); 
		$("#insDispTblbtn").hide();
		$("#insDispchartbtn").show(); 
	});
	$("#insDispchartbtn").click(function(){
		$("#instVsDisptbl").hide();
		$("#instVsDisp1chart").show();
		$("#insDispchartbtn").hide();
		$("#insDispTblbtn").show();
	});
	
	$("#natofdispTblBtn").click(function(){
		$("#disaposalNatureChart").hide();
		$("#disaposalNatureChartTbl").show(); 
		$("#natofdispTblBtn").hide();
		$("#natofdispChartBtn").show(); 
	});
	$("#natofdispChartBtn").click(function(){
		$("#disaposalNatureChartTbl").hide();
		$("#disaposalNatureChart").show(); 
		$("#natofdispChartBtn").hide();
		$("#natofdispTblBtn").show();
	}); 

	$("#dispwiseTblbtn").click(function(){
		$("#instVsDisp1chart").hide();
		$("#instVsDisptbl").show(); 
		$("#dispwiseTblbtn").hide();
		$("#dispwisechartbtn").show(); 
	});
	$("#dispwisechartbtn").click(function(){
		$("#instVsDisptbl").hide();
		$("#instVsDisp1chart").show(); 		
		$("#dispwisechartbtn").hide();
		$("#dispwiseTblbtn").show();
	});

});

function statewisePendency(state_name,civ_state,cri_state,tot_state)
{
	state_name=state_name.replaceAll('~',',');
	civ_state=civ_state.replaceAll('~',',');
	cri_state=cri_state.replaceAll('~',',');
	tot_state=tot_state.replaceAll('~',',');

	var state=state_name.slice(0, -1);
	var civil=civ_state.slice(0, -1);
	var criminal=cri_state.slice(0, -1);
	var total=tot_state.slice(0, -1);
	state_name=JSON.parse("["+(state)+"]");
	civ_state=JSON.parse("["+(civil)+"]");
	cri_state=JSON.parse("["+(criminal)+"]");
	tot_state=JSON.parse("["+(total)+"]");

	var dynamicWidth='90%'
	if(tot_state.length > 10)
	{
		dynamicWidth='80%'
	}
	else if(tot_state.length > 4 )
	{
		dynamicWidth='30%'
	}
	else if(tot_state.length > 0 )
	{
		dynamicWidth='10%'
	}
	
	 var chart12options = {
	  series: [{
		  name: 'Civil',
	  data: civ_state
	}, {
			  name: 'Criminal',
	  data: cri_state
	}/*, {
				  name: 'Total',
	  data: tot_state
	}*/],
	  chart: {
	  type: 'bar',
	  height: 430,
	  stacked : true
	},
	plotOptions: {
	  bar: {
		horizontal: false,
	    columnWidth: dynamicWidth,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: -6,
	  style: {
		fontSize: '12px',
		colors: ['#fff']
	  }
	},
	stroke: {
	  show: true,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: true,
	  intersect: false
	},
	xaxis: {
	  categories: state_name,
	},
	};

	var chart12 = new ApexCharts(document.querySelector("#chart12"), chart12options);
	chart12.render();
}

function fetchDataNotUploaded()
{
	var url='home/fetchDataNotUploaded';
	var postdata='';
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$('#staticBackdropLabel').html('Data not uploaded');
		$('#modal-body-home').html(result.tbl_str);
		$('#tbl_data_not_uploaded').DataTable({
			//responsive:true,
			 rowGroup: {
				dataSrc: [1,2],
			  },
			  columnDefs: [ {
				targets: [1,2],
				visible: false
			  }]
		});
	}
}
function fetchStateData(flag,ci_cri)
{
	var url='home/fetchStateData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                postdata+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                postdata+="&distCode="+getDist;
        } 

		if (flag === 'ins' || flag === 'disp' || flag === 'citizen' || flag === 'women' || flag === 'delay') 
		{ 
			document.getElementById("yearBtn").removeAttribute("data-bs-toggle");
			document.getElementById("yearBtn").removeAttribute("data-bs-target");
		}
		else
		{ 
			document.getElementById("yearBtn").setAttribute("data-bs-toggle", "modal");
			document.getElementById("yearBtn").setAttribute("data-bs-target", "#modal_year_data");
		}

	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='ins')
			$('#staticBackdropState').html('Cases Instituted in Last Month');
		if(flag=='disp')
			$('#staticBackdropState').html('Cases Disposed in Last Month');
		if(flag=='citizen')
			$('#staticBackdropState').html('Filed Cases By Senior Citizen');
		if(flag=='women')
			$('#staticBackdropState').html('Filed Cases By Woman');
		if(flag=='delay')
			$('#staticBackdropState').html('Delay Reason');
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
			     dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}
function CaseTypeStateData(flag,ci_cri)
{
	var url='home/CaseTypeStateData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='original')
			$('#staticBackdropLabel1').html('Original');
		if(flag=='appeal')
			$('#staticBackdropLabel1').html('Appeal');
		if(flag=='application')
			$('#staticBackdropLabel1').html('Application');
		if(flag=='execution')
			$('#staticBackdropLabel1').html('Execution');
		
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
			     dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}
function stagewiseState(flag,ci_cri)
{
	var url='home/stagewiseState';

	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='app')
			$('#staticBackdropLabel1').html('Appearance/Service Related');
		if(flag=='com')
			$('#staticBackdropLabel1').html('Compliance/Steps/stay');
		if(flag=='evi')
			$('#staticBackdropLabel1').html('Evidence/Argument/Judgement');
		if(flag=='ple')
			$('#staticBackdropLabel1').html('Pleadings/Issues/Charge');
		
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
			     dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}

function stagewiseDist(flag,state_code,state_name,ci_cri)
{
	var url='home/stagewiseDist';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='app')
			$('#staticBackdropLabel2').html('Appearance/Service Related / '+state_name);
		if(flag=='com')
			$('#staticBackdropLabel2').html('Compliance/Steps/stay / '+state_name);
		if(flag=='evi')
			$('#staticBackdropLabel2').html('Evidence/Argument/Judgement / '+state_name);
		if(flag=='ple')
			$('#staticBackdropLabel2').html('Pleadings/Issues/Charge / '+state_name);
		$('#modal-body-dist').html(result.tbl_str);
		$('#tbl_dist').DataTable({		});
	}
}
function stagewiseEst(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/stagewiseEst';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='app')
			$('#staticBackdropLabel3').html('Appearance/Service Related / '+state_name+' / '+dist_name);
		if(flag=='com')
			$('#staticBackdropLabel3').html('Compliance/Steps/stay / '+state_name+' / '+dist_name);
		if(flag=='evi')
			$('#staticBackdropLabel3').html('Evidence/Argument/Judgement / '+state_name+' / '+dist_name);
		if(flag=='ple')
			$('#staticBackdropLabel3').html('Pleadings/Issues/Charge / '+state_name+' / '+dist_name);
		$('#modal-body-est').html(result.tbl_str);
		//$('#tbl_est').DataTable({		});
		gridview('_tbl_est');
	}
}
function stagewiseCases(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{
	var url='home/stagewiseCases';
	
	var table=$('#tbl_cases').DataTable();
		table.destroy();
		$('#tbl_cases').DataTable( {			
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/stagewiseCases",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "state_name", "value": state_name } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "dist_name", "value": dist_name } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "est_name", "value": est_name } );
					/* Column filter count */
					var postdata='';
					  var c=0;
                        $.each(aoData, function (k,v) {
                                if(c==0)
                                         postdata+=v.name+'='+v.value;
                                else
                                        postdata+='&'+v.name+'='+v.value;
                                c++;
                        });
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
						if(flag=='app')
						$('#staticBackdropLabel4').html('Appearance/Service Related / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='com')
							$('#staticBackdropLabel4').html('Compliance/Steps/stay / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='evi')
							$('#staticBackdropLabel4').html('Evidence/Argument/Judgement / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='ple')
							$('#staticBackdropLabel4').html('Pleadings/Issues/Charge / '+state_name+' / '+dist_name+'/ '+est_name);
					}
		}	
  } );
}
function fetchDistRecords(flag,state_code,state_name,ci_cri)
{
	var url='home/fetchDistData';
	var dist_code=$("#dist_code").val();
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='ins')
			$('#staticBackdropLabel2').html('Cases Instituted in Last Month / '+state_name);
		if(flag=='disp')
			$('#staticBackdropLabel2').html('Cases Disposed in Last Month / '+state_name);
		if(flag=='citizen')
			$('#staticBackdropLabel2').html('Filed Cases By Senior Citizen / '+state_name);
		if(flag=='women')
			$('#staticBackdropLabel2').html('Filed Cases By Woman / '+state_name);
		if(flag=='delay')
			$('#staticBackdropLabel2').html('Delay Reason / '+state_name);
		$('#modal-body-dist').html(result.tbl_str);
		//$('#tbl_dist').DataTable({		});
		gridview('_tbl_dist');
	}
}
function caseTypeDistData(flag,state_code,state_name,ci_cri)
{
	var url='home/CaseTypeDistData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='original')
			$('#staticBackdropLabel2').html('Original / '+state_name);
		if(flag=='appeal')
			$('#staticBackdropLabel2').html('Appeal / '+state_name);
		if(flag=='application')
			$('#staticBackdropLabel2').html('Application / '+state_name);
		if(flag=='execution')
			$('#staticBackdropLabel2').html('Execution / '+state_name);
		$('#modal-body-dist').html(result.tbl_str);
		//$('#tbl_dist').DataTable({		});
		gridview('_tbl_dist');
	}
}
function caseTypeEstData(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/caseTypeEstData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='original')
			$('#staticBackdropLabel3').html('Original / '+state_name+' / '+dist_name);
		if(flag=='appeal')
			$('#staticBackdropLabel3').html('Appeal / '+state_name+' / '+dist_name);
		if(flag=='application')
			$('#staticBackdropLabel3').html('Application / '+state_name+' / '+dist_name);
		if(flag=='execution')
			$('#staticBackdropLabel3').html('Execution / '+state_name+' / '+dist_name);
		$('#modal-body-est').html(result.tbl_str);
		gridview('_tbl_est');
	}
}
function caseTypeData(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{
	var url='home/caseTypeData';
	
	var table=$('#tbl_cases').DataTable();
		table.destroy();
		$('#tbl_cases').DataTable( {			
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/caseTypeData",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "state_name", "value": state_name } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "dist_name", "value": dist_name } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "est_name", "value": est_name } );
					/* Column filter count */
					var postdata='';
					  var c=0;
                        $.each(aoData, function (k,v) {
                                if(c==0)
                                         postdata+=v.name+'='+v.value;
                                else
                                        postdata+='&'+v.name+'='+v.value;
                                c++;
                        });
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
						if(flag=='original')
							$('#staticBackdropLabel4').html('Original / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='appeal')
							$('#staticBackdropLabel4').html('Appeal / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='application')
							$('#staticBackdropLabel4').html('Application / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='execution')
							$('#staticBackdropLabel4').html('Execution / '+state_name+' / '+dist_name+'/ '+est_name);
					}
		}	
  } );
}
function fetchEstRecords(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/fetchEstData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='ins')
			$('#staticBackdropLabel3').html('Cases Instituted in Last Month / '+state_name+' / '+dist_name);
		if(flag=='disp')
			$('#staticBackdropLabel3').html('Cases Disposed in Last Month / '+state_name+' / '+dist_name);
		if(flag=='citizen')
			$('#staticBackdropLabel3').html('Filed Cases By Senior Citizen / '+state_name+' / '+dist_name);
		if(flag=='women')
			$('#staticBackdropLabel3').html('Filed Cases By Woman / '+state_name+' / '+dist_name);
		if(flag=='delay')
			$('#staticBackdropLabel3').html('Delay Reason / '+state_name+' / '+dist_name);
		$('#modal-body-est').html(result.tbl_str);
		gridview('_tbl_est');
	}
}

function fetchCaseDetailsCaptcha(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{ 
        var url='home/fetchCaseCaptcha';
        var post_data='';
        $("#est_tab").hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
 
        function callback(result)
        {  
				 $('#modal-body-case-captcha').html(result.filename);
                  $("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:fetchCasesRecords(\""+flag+"\",\""+state_code+"\",\""+state_name+"\",\""+dist_code+"\",\""+dist_name+"\",\""+est_code+"\",\""+est_name+"\",\""+ci_cri+"\")\'data-bs-toggle='modal' data-bs-target='#modal_case_data1'>" ); 
        }
}
 

function fetchCasesRecords(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{		
        var url='home/fetchCaseData';
		$("#modal_case_data1").modal('show');
		var search_by=$("#sel_search_by2 option:selected").val();
		if(flag!='' && flag!=undefined)
                $("#flag").val(flag);
        else
                flag=$("#flag").val();

        if(ci_cri!='' && ci_cri!=undefined)
                $("#ci_cri").val(ci_cri);
        else
                ci_cri=$("#ci_cri").val();

        if(judge_code!='' && judge_code!=undefined)
                $("#judge_code").val(judge_code);
        else
                judge_code=$("#judge_code").val();

        if(state_code!='' && state_code!=undefined)
                $("#state_code2").val(state_code);
        else
                var state_code=$("#state_code2").val();
 
        if(dist_code!='' && dist_code!=undefined)
                $("#dist_code2").val(dist_code);
        else
                var dist_code=$("#dist_code2").val();

		 if(state_name!='' && state_name!=undefined)
                $("#txt_state_name").val(state_name);
        else
                var state_name=$("#txt_state_name").val();

		if(est_code!='' && est_code!=undefined)
			$("#txt_est_code").val(est_code);
		else
			est_code=$("#txt_est_code").val();  

		if(est_name!='' && est_name!=undefined)
			$("#txt_est_name").val(est_name);
		else
			est_name=$("#txt_est_name").val();  

		var captcha_val=$('#captcha1').val();
		 
                var table=$('#tbl_cases1').DataTable();
                table.destroy();
                $('#tbl_cases1').DataTable( {
                        dom: 'lrfBtip',
                        "pagingType": "full",
                        "paging": true,
                        "lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
                        "bProcessing": true,
                        "bServerSide": true,
                        "sAjaxSource": "home/fetchCaseData",
                         "bAutoWidth": false,
                        fnServerData: function ( sSource, aoData, fnCallback ) {
                                        aoData.push( { "name": "flag", "value": flag } );
                                        aoData.push( { "name": "state_code", "value": state_code } );
                                        aoData.push( { "name": "state_name", "value": state_name } );
                                        aoData.push( { "name": "dist_code", "value": dist_code } );
                                        aoData.push( { "name": "ci_cri", "value": ci_cri } );
                                        aoData.push( { "name": "dist_name", "value": dist_name } );
                                        aoData.push( { "name": "est_code", "value": est_code } );
                                        aoData.push( { "name": "est_name", "value": est_name } );
										aoData.push( { "name": "search_by", "value": search_by } );
										aoData.push( { "name": "captcha_val", "value": captcha_val } );
                                        /* Column filter count */
                                        var postdata='';
                                        var c=0;
										$.each(aoData, function (k,v) {
												if(c==0)
														 postdata+=v.name+'='+v.value;
												else
														postdata+='&'+v.name+'='+v.value;
												c++;
										});
                                        ajaxCall({url:url,postdata:postdata,callback:callback});
                                        function callback(result)
                                        { 
                                              /* fnCallback(result.output);

											 
                                                if(flag=='ins')
                                                $('#staticBackdropLabel14').html('Cases Instituted in Last Month / '+state_name+' / '+dist_name+'/ '+est_name);
                                                if(flag=='disp')
                                                        $('#staticBackdropLabel14').html('Cases Disposed in Last Month / '+state_name+' / '+dist_name+'/ '+est_name);
                                                if(flag=='citizen')
                                                        $('#staticBackdropLabel14').html('Filed Cases By Senior Citizen / '+state_name+' / '+dist_name+'/ '+est_name);
                                                if(flag=='women')
                                                        $('#staticBackdropLabel14').html('Filed Cases By Woman / '+state_name+' / '+dist_name+'/ '+est_name);
                                                if(flag=='delay')
                                                        $('#staticBackdropLabel14').html('Delay Reason / '+state_name+' / '+dist_name+'/ '+est_name);*/
														 
												if(result.msg=='')
                                                {  
													setTimeout(function(){ 
													$("#modal_case_data1").modal('show');	 
													$("#modal_casedata_captcha").modal('hide');
													},50 );	
										
                                                   fnCallback(result.output);
												    if(flag=='ins')
															$('#staticBackdropLabel14').html('Cases Instituted in Last Month / '+state_name+' / '+dist_name+'/ '+est_name);
													if(flag=='disp')
															$('#staticBackdropLabel14').html('Cases Disposed in Last Month / '+state_name+' / '+dist_name+'/ '+est_name);
													if(flag=='citizen')
															$('#staticBackdropLabel14').html('Filed Cases By Senior Citizen / '+state_name+' / '+dist_name+'/ '+est_name);
													if(flag=='women')
															$('#staticBackdropLabel14').html('Filed Cases By Woman / '+state_name+' / '+dist_name+'/ '+est_name);
													if(flag=='delay')
															$('#staticBackdropLabel14').html('Delay Reason / '+state_name+' / '+dist_name+'/ '+est_name); 								   												  
													 
                                                }
                                                else
                                                { 
													setTimeout(function(){
														$("#modal_case_data1").hide();
														$('#captcha1').val('');
														$("#modal_case_data1").modal('hide');
														 $("#modal_casedata_captcha").show();	
														$("#modal_casedata_captcha").modal('show');	
													},50);	
													 
													errorAlert('Invalid Captcha');
													 
													
													$('.modal-backdrop').remove();													
																								
                                                        document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
                                                        return false;
                                                       
                                                }
                                        }
                },
                                 buttons: [ { "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" ><span class="fas fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                                        exportOptions: { columns: ':visible'}
                                },{"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" ><span class="fas fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                                        exportOptions:{ columns: ':visible'}
                                },{"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" ><span class="fas fa-file-csv" aria-hidden="true" title="Export to csv"></span> </button>',
                                        exportOptions:{columns: ':visible'}
                                }]
  } );
}


function pendingCasesChart(civ_pend,cri_pend,tot_pend)
{
	cri_pend=cri_pend.replaceAll('~',',');
	civ_pend=civ_pend.replaceAll('~',',');
	tot_pend=tot_pend.replaceAll('~',',');
	civ_pend=JSON.parse("["+civ_pend+"]");
	cri_pend=JSON.parse("["+cri_pend+"]");
	tot_pend=JSON.parse("["+tot_pend+"]");
	var chart7options = {
	  series: [{
	  name: 'Civil',
	  data: civ_pend
	},{
	  name: 'Criminal',
	  data: cri_pend
	}/*, {
	  name: 'Total',
	  data: tot_pend
	}*/],
	  chart: {
	  type: 'bar',
	  height: 350,
	  stacked:true
	},
	plotOptions: {
	  bar: {
		horizontal: false,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '12px',
		colors: ['#fff']
	  }
	},
	stroke: {
	  show: true,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: true,
	  intersect: false
	},
	xaxis: {
	   categories: ['Total', '0 to 1 Years', '1 to 3 Years', '3 to 5 Years', '5 to 10 Years', '10 to 20 Years', '20 to 30 Years','Above 30 Years'],
	},
	};

	var chart7 = new ApexCharts(document.querySelector("#chart7"), chart7options);//alert(chart7);
	chart7.render();

}
function stagewiseChart(purposetypechart)
{
	purposetypechart=purposetypechart.replaceAll('~',',');
	purposetypechart=JSON.parse("["+purposetypechart+"]");
	var chart10options = {
	series: purposetypechart,
	chart: {
	width: '100%',
	type: 'pie',
	},
	labels: ['Appearance/Service Related	', 'Compliance/Steps/stay	', 'Evidence/Argument/Judgement	', 'Pleadings/Issues/Charge	'],
	  legend: {
	  position: 'bottom'
	},
	responsive: [{
	breakpoint: 480,
	options: {
	chart: {
	  width: '100%'
	},
	legend: {
	  position: 'bottom'
	}
	}
	}]
	};

	var chart10 = new ApexCharts(document.querySelector("#chart10"), chart10options);
	chart10.render();

}
function updateCaseType()
{
		var case_type =  $("#agewise_case_type option:selected").val();
		var post_data="case_type="+case_type;
		var state_code=$("#state_code").val();
		var dist_code=$("#dist_code").val();

		if(state_code!="")
		{
			post_data+='&state_code='+state_code;
		}
		if(state_code!="" && dist_code!="")
		{
			post_data+='&dist_code='+dist_code;
		}
		$("#chart7").html('');
		var url="home/update_pending_cases";
		ajaxCall({url:url,postdata:post_data,callback:callback,loader:true});
		function callback(result)
		{	
			pendingCasesChart(result.civil,result.criminal,result.total);
			$("#chart7tbl").html(result.table_str);
		}
}
function updateStageType()
{
	var case_type =  $("#stagewise_case_type option:selected").val();
	var post_data="case_type="+case_type;
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();

	if(state_code!="")
	{
		post_data+='&state_code='+state_code;
	}
	if(state_code!="" && dist_code!="")
	{
		post_data+='&dist_code='+dist_code;
	}
	$("#chart10").html('');
	var url="home/updateStageWise";	
	ajaxCall({url:url,postdata:post_data,callback:callback,loader:false});
	function callback(result)
	{		
		stagewiseChart(result.purposechart)
		$("#chart10tbl").html(result.tbl_str);
	}
}
function pendingCasesState(flag,ci_cri)
{
	var url='home/pendingCasesState';

	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='0to1')
			$('#staticBackdropLabel1').html('0 to 1 Years');
		if(flag=='1to3')
			$('#staticBackdropLabel1').html('1 to 3 Years');
		if(flag=='3to5')
			$('#staticBackdropLabel1').html('3 to 5 Years');
		if(flag=='5to10')
			$('#staticBackdropLabel1').html('5 to 10 Years');
		if(flag=='10to20')
			$('#staticBackdropLabel1').html('10 to 20 Years');
		if(flag=='20to30')
			$('#staticBackdropLabel1').html('20 to 30 Years');
		if(flag=='above30')
			$('#staticBackdropLabel1').html('Above 30 Years');
		
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
			     dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}

function pendingCasesDist(flag,state_code,state_name,ci_cri)
{
	var url='home/pendingCasesDist';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='0to1')
			$('#staticBackdropLabel2').html('0 to 1 Years / '+state_name);
		if(flag=='1to3')
			$('#staticBackdropLabel2').html('1 to 3 Years / '+state_name);
		if(flag=='3to5')
			$('#staticBackdropLabel2').html('3 to 5 Years / '+state_name);
		if(flag=='5to10')
			$('#staticBackdropLabel2').html('5 to 10 Years / '+state_name);
		if(flag=='10to20')
			$('#staticBackdropLabel2').html('10 to 20 Years / '+state_name);
		if(flag=='20to30')
			$('#staticBackdropLabel2').html('20 to 30 Years / '+state_name);
		if(flag=='above30')
			$('#staticBackdropLabel2').html('Above 30 Years / '+state_name);
		$('#modal-body-dist').html(result.tbl_str);
		//$('#tbl_dist').DataTable({		});
		gridview('_tbl_dist');
	}
}
function pendingCasesEst(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/pendingCasesEst';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	var case_type=$("#stagewise_case_type").val();
	if(case_type!='')
		postdata+='&case_type='+case_type;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='0to1')
			$('#staticBackdropLabel3').html('0 to 1 Years / '+state_name+' / '+dist_name);
		if(flag=='1to3')
			$('#staticBackdropLabel3').html('1 to 3 Years / '+state_name+' / '+dist_name);
		if(flag=='3to5')
			$('#staticBackdropLabel3').html('3 to 5 Years / '+state_name+' / '+dist_name);
		if(flag=='5to10')
			$('#staticBackdropLabel3').html('5 to 10 Years / '+state_name+' / '+dist_name);
		if(flag=='10to20')
			$('#staticBackdropLabel3').html('10 to 20 Years / '+state_name+' / '+dist_name);
		if(flag=='20to30')
			$('#staticBackdropLabel3').html('20 to 30 Years / '+state_name+' / '+dist_name);
		if(flag=='above30')
			$('#staticBackdropLabel3').html('Above 30 Years / '+state_name+' / '+dist_name);
		$('#modal-body-est').html(result.tbl_str);
		//$('#tbl_est').DataTable({		});
		gridview('_tbl_est');
	}
}
function pendingCases(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{
	var url='home/pendingCases1';
	
	var table=$('#tbl_cases').DataTable();
		table.destroy();
		$('#tbl_cases').DataTable( {			
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/pendingCases1",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "state_name", "value": state_name } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "dist_name", "value": dist_name } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "est_name", "value": est_name } );
					/* Column filter count */
					var postdata='';
					var c=0;
					$.each(aoData, function (k,v) {
							if(c==0)
									 postdata+=v.name+'='+v.value;
							else
									postdata+='&'+v.name+'='+v.value;
							c++;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
						if(flag=='0to1')
							$('#staticBackdropLabel4').html('0 to 1 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='1to3')
							$('#staticBackdropLabel4').html('1 to 3 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='3to5')
							$('#staticBackdropLabel4').html('3 to 5 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='5to10')
							$('#staticBackdropLabel4').html('5 to 10 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='10to20')
							$('#staticBackdropLabel4').html('10 to 20 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='20to30')
							$('#staticBackdropLabel4').html('20 to 30 Years / '+state_name+' / '+dist_name+'/ '+est_name);
						if(flag=='above30')
							$('#staticBackdropLabel4').html('Above 30 Years / '+state_name+' / '+dist_name+'/ '+est_name);
					}
		}	,
                                 buttons: [ { "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" ><span class="fas fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                                        exportOptions: { columns: ':visible'}
                                },{"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" ><span class="fas fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                                        exportOptions:{ columns: ':visible'}
                                },{"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" ><span class="fas fa-file-csv" aria-hidden="true" title="Export to csv"></span> </button>',
                                        exportOptions:{columns: ':visible'}
                                }]
  } );
}
function fetch_case_details_captcha1(casetype,casenum,caseyear,case_no,cino,court_no,jocode,state,dist,court_code,flag,get_cases_type)
{
	var div_id=$('#get_case_div').val();
	$("#"+div_id).hide();
	$("#case_history_captcha").show();
	$("#cases_tab1").hide();
        $("#regno_Wise_caseDetails_tab").hide();
	
	$('#iframe_back').show();
	var set_case_type="both";
	if(get_cases_type==2)
	{
		set_case_type="CI";
	}
	else if(get_cases_type==3)
	{
		set_case_type="CRI";
	}
	
	if(flag=='ins')
	{
			var url="https://njdg.ecourts.gov.in/njdg_public/civil/o_filing_case_history.php?es_flag=Y&state_code="+state+"&dist_code="+dist+"&court_code=1"+"&case_number="+case_no+"&type=both&objection1=totalpending_cases&matchtotal=13145&court_no="+court_no+"&cino="+cino+"&disposed_case=N";
			var append_data="state_code="+state+"&dist_code="+dist+"&court_code="+court_code+"&case_number="+case_no+"&type="+set_case_type+"&objection1=totalpending_cases&matchtotal=13145&&court_no="+court_no+"&cino="+cino+"&disposed_case=N";

			$('#case_history_captcha').html('<iframe id="case_history" src="https://njdg.ecourts.gov.in/njdg_public/civil/o_filing_case_history.php?es_flag=Y&state_code='+state+'&dist_code='+dist+'&court_code='+court_code+'&case_number='+case_no+'&type='+set_case_type+'&objection1=totalpending_cases&matchtotal=13145&court_no='+court_no+'&cino='+cino+'&disposed_case=N" style="width:150%;height:500px;"/></iframe>');
	}
	else
	{
			var url="https://njdg.ecourts.gov.in/njdg_public/civil/o_civil_case_history_es.php?es_flag=Y&state_code="+state+"&dist_code="+dist+"&court_code=1"+"&case_number="+case_no+"&type=both&objection1=totalpending_cases&matchtotal=13145&jocode="+jocode+"&court_no="+court_no+"&cino="+cino+"&disposed_case=N";
			var append_data="state_code="+state+"&dist_code="+dist+"&court_code="+court_code+"&case_number="+case_no+"&type="+set_case_type+"&objection1=totalpending_cases&matchtotal=13145&jocode="+jocode+"&court_no="+court_no+"&cino="+cino+"&disposed_case=N";

	   console.log(append_data);
		$('#case_history_captcha').html('<iframe id="case_history" src="https://njdg.ecourts.gov.in/njdg_public/civil/o_civil_case_history_es.php?es_flag=Y&state_code='+state+'&dist_code='+dist+'&court_code='+court_code+'&case_number='+case_no+'&type='+set_case_type+'&objection1=totalpending_cases&matchtotal=13145&jocode='+jocode+'&court_no='+court_no+'&cino='+cino+'&disposed_case=N" style="width:150%;height:500px;"/></iframe>');
	}
}
function pendingDist(state_code,state_name,ci_cri)
{
	var url='home/pendingDist';
	var postdata='ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		$('#staticBackdropLabel2').html(state_name);
		$('#modal-body-dist').html(result.tbl_str);
		$('#tbl_dist').DataTable({		});

	}
}

function pendingEst(state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/pendingEst';
	var postdata='ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		
		$('#staticBackdropLabel3').html(state_name+' / '+dist_name);
		$('#modal-body-est').html(result.tbl_str);
		$('#tbl_est').DataTable({		});
	}
}
function fetchCases1(state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{
	var url='home/getCases';
	
		var table=$('#tbl_cases').DataTable();
		table.destroy();
		$('#tbl_cases').DataTable( {			
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/getCases",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "state_name", "value": state_name } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "dist_name", "value": dist_name } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "est_name", "value": est_name } );
					/* Column filter count */
					var postdata='';
					var c=0;
					$.each(aoData, function (k,v) {
							if(c==0)
									 postdata+=v.name+'='+v.value;
							else
									postdata+='&'+v.name+'='+v.value;
							c++;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
						$('#staticBackdropLabel4').html(state_name+' / '+dist_name+'/ '+est_name);
					}
		}	
  } );
}

/*----------------- Function For Statewise Alerts ---------------*/

function getAlertData(flag,value)
{
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/fetchAlertStateData';
	var postdata='flag='+flag+'&ci_cri='+value;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		 
		if(flag=='listed')
			$('#staticBackdropState').html('Cases Listed Today');
		if(flag=='undated')
			$('#staticBackdropState').html('Undated Cases');
		if(flag=='pending')
			$('#staticBackdropState').html('Cases Pending Registration ');
		if(flag=='objection')
			$('#staticBackdropState').html('Cases Under Objection');
		if(flag=='excessive')
			$('#staticBackdropState').html('Excessive Dated Cases (More than 3 Months)');
		if(flag=='prelitigation')
			$('#staticBackdropState').html('Pre-Litigation');
		if(flag=='pretrial')
			$('#staticBackdropState').html('Pre-Trial');
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
			     dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}
	
/*----------------tab-----------------------20/08/2021---------*/



function delayReasonChart(charttitle,data,id,label)
{
	$('.delayReasonPendChart').html('').attr('id', 'delayReasonPendChart'+id);
	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");

	label=label.replaceAll('~',',');
	label1=label.replaceAll('#',' ');
	label1=JSON.parse("["+(label1)+"]");
	
	var mattertypeval=$("#mattertypeval").val();
	var agewiseval=$("#agewiseval").val();
	var stagewiseval=$("#stagewiseval").val();

	$('#delay_label').html(charttitle);
	var swoptions = {
          series: data,
          chart: {
          width: '80%',
          type: 'pie',
		 events: {
			markerClick: function (event, chartContext, config) {
				
				var url='home/fetchDelayReason/'+config.dataPointIndex;
				var postdata='&mattertypeval='+mattertypeval+'&agewiseval='+agewiseval+'&stagewiseval='+stagewiseval;
				ajaxCall({url:url,postdata:postdata,callback:callback});
				function callback(result)
				{		
					
					$("#delayval").val(config.dataPointIndex);
					casetypeChart(result.dynamictitle,result.dynamicdata,result.color,config.dataPointIndex,result.dynamictitle1);
					instVsDispLineChart(config.dataPointIndex,result.year,result.ins_count,result.disp_count,result.insDisptitle);
				}
				
		},
			
	},
        },
			  legend: {
			     show: false,
              position: 'bottom',
			
            },
		dataLabels: {
	  enabled: true,
	  },

        labels: label1,
		colors: ['#EDD759', '#425374', '#1DBD9D', '#ED701B', '#0B8FC0','#626365', '#C6D0DA', '#9AA0A7', '#077187'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };

        var swchart = new ApexCharts(document.querySelector("#delayReasonPendChart"+id), swoptions);
        swchart.render();
		
		
}


function casetypeChart(title,data,color,id,label){
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.casetypeChart').html('').attr('id', 'casetypeChart'+id);
	$('#casetypeChart'+id).removeClass('d-none');
	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");

	label=label.replaceAll('~',',');
	label1=label.replaceAll('#',' ');//alert(label1);
	label1=JSON.parse("["+(label1)+"]");

	var mattertypeval=$("#mattertypeval").val();
	var agewiseval=$("#agewiseval").val();
	var stagewiseval=$("#stagewiseval").val();
	var delayval=$("#delayval").val();
	var dchart='';
	$('#dynamicTitle').html(title);
	var dynamicWidth='90%'
		if(data.length > 10)
			{
				dynamicWidth='80%'
			}
			else if(data.length > 4 )
			{
				dynamicWidth='30%'
			}
			else if(data.length > 0 )
			{
				dynamicWidth='10%'
			}

	var dynamicoptions = {
			  series: [{
				 name: 'Count',
			  data:data
			}],
			  chart: {
			  type: 'bar',
			  height: 300,
				   toolbar: {
            show: false
          }, events: {
			    markerClick: function (event, chartContext, config) {
					
					var url='home/fetchInsDisp/'+config.dataPointIndex;
					var postdata='&mattertypeval='+mattertypeval+'&agewiseval='+agewiseval+'&stagewiseval='+stagewiseval+'&delayval='+delayval;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						instVsDispLineChart(11,result.year,result.ins_count,result.disp_count);
					}
					
                 },
				
			}
			},
			plotOptions: {
			  bar: {
				borderRadius: 0,
				horizontal: false,

				
			    columnWidth: dynamicWidth,
					dataLabels: {
              position: 'top', // top, center, bottom
            },
			  }
			},
				stroke: {
	  show: true,
	  width: 1,
	  colors: ['#fff']
	},
			dataLabels: {
          enabled: false,
          offsetY: -20,
			    textAnchor: 'middle',
          style: {
            fontSize: '11px',
            colors: ['#000']
          }
        },
			fill: {
  colors: [color]
},
			xaxis: {
			  categories: label1,
				   labels: {
          show: true,
			  }
			}
			};
			
			dchart = new ApexCharts(document.querySelector("#casetypeChart"+id), dynamicoptions);
			dchart.render();
	}
	function instVsDispLineChart(id,year,ins_count,disp_count,title)
	{
		year=year.replaceAll('~',',');
		year=JSON.parse("["+year+"]");
		ins_count=ins_count.replaceAll('~',',');
		ins_count=JSON.parse("["+ins_count+"]");
		disp_count=disp_count.replaceAll('~',',');
		disp_count=JSON.parse("["+disp_count+"]");
		$('#dynamicTitleIns').html(title);
	
		$('.instVsDispLineChart').html('').attr('id', 'instVsDispLineChart'+id);
		
		var instVsDispLineoptions = {
          series: [
          {
            name: "Institution",
             data: ins_count
          },
          {
            name: "Disposal",
            data:disp_count
          }
        ],
          chart: {
          height: 350,
          type: 'line',
          dropShadow: {
            enabled: true,
            color: '#000',
            top: 18,
            left: 7,
            blur: 10,
            opacity: 0.2
          },
			toolbar: {
			show: true,
  
		}
        },
        colors: ['#78C193', '#FF4560'],
        dataLabels: {
          enabled: true,
        },
        stroke: {
          curve: 'smooth',
			  width: 2
        },
        /*grid: {
          borderColor: '#e7e7e7',
          row: {
            colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0.5
          },
        },*/
        markers: {
          size: 1
        },
        xaxis: {
          categories: year,
         /* title: {
            text: 'Month'
          }*/
        },
        yaxis: {
          labels: {
    formatter: function(value) {
      var val = Math.abs(value)
      if (val >= 1000) {
        val = (val / 1000).toFixed(0) + ' K'
      }
      return val
    }
  }
        },

        legend: {
          position: 'top',
          horizontalAlign: 'right',
          floating: true,
          offsetY: -25,
          offsetX: -5
        }
        };

        var chart = new ApexCharts(document.querySelector("#instVsDispLineChart"+id), instVsDispLineoptions);
        chart.render();

}

function setDynamicChart(str)
{
		
	var mattertypeval=$("#mattertypeval").val();
	var agewiseval=$("#agewiseval").val();
	var stagewiseval=$("#stagewiseval").val();
	var delayval=$("#delayval").val();
	var postdata='str='+str+'&mattertypeval='+mattertypeval+'&agewiseval='+agewiseval+'&stagewiseval='+stagewiseval+'&delayval='+delayval;
	var url='home/dynamicCharts';
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		if(str=='C')
			casetypeChart(result.dynamictitle,result.dynamicdata,result.color,22,result.dynamictitle1);
		else if(str=='A')
			ageLineChart(1,result.agewise_year,result.agewise_line,result.agetitle);
		else if(str=='S')
			stageBarChart(result.stagetitle,result.purpose_count,result.color,33,result.purpose_name);
		else if(str=='D')
			delayLineChart(1,result.delaytitle,result.year,result.year_count);
	}
}
function delayLineChart(id,title,year,year_count){
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.delayLineChart').html('').attr('id', 'delayLineChart'+id);
	$('#delayLineChart'+id).removeClass('d-none');
	$('#delayLineChart').html('');
	var	aachart ='';
	var abc ;
	yeararr=year.split("#");
	yearcnt=year_count.split("#");

	var seriesdata=[];
	var seriesLabel=[];
	/*$.each( yeararr, function( key, value ) {
		yeararr1=value.split("@");
		year_val=yeararr1[1].replaceAll('~',',');//alert(civ_pend);
		year_val=JSON.parse("["+year_val+"]");
		
		yearcnt=yearcnt[key].toString();
		alert(yearcnt)
		if(yearcnt.indexOf('~') != -1){
			yearcnt=yearcnt.replaceAll('~',',');//alert(civ_pend);
		}
		yearcnt=JSON.parse("["+yearcnt+"]");
	
		seriesdata.push( { "name": yeararr[0], "data": yearcnt } );
		});
	*/
	var minyear=2025;
	var maxyear=1951;
	for(var i=0; i<yeararr.length; i++)
	{
		yeararr1=yeararr[i].split("@");
		year_val=yeararr1[1].replaceAll('~',',');
		year_val=JSON.parse("["+year_val+"]");

		yearcnt1=yearcnt[i].replaceAll('~',',');
		//alert('aaaa'+yearcnt1)
		yearcnt2=JSON.parse("["+yearcnt1+"]");

		if(minyear>Math.min.apply(Math,year_val))
			minyear=Math.min.apply(Math,year_val);
		if(maxyear<Math.max.apply(Math,year_val))
			maxyear=Math.max.apply(Math,year_val);
		//var seriesdata1=[{ "name": 'aaaa', "data": [1,2,3,4,5,6] },{ "name": 'bbb', "data": [9,5,3,4,2,6] },{ "name": 'ccc', "data": [4,5,1,6,2,6] }]
		seriesdata.push( { "name": yeararr1[0], "data": yearcnt2 } );
	}
	//alert(minyear+'======'+maxyear)
	for(var i=maxyear;i>=minyear;i--)
	{
		seriesLabel.push(i);
	}
	console.dir(seriesLabel);
	
	 abc = {
		series: seriesdata,
		  chart: {
		  height: 350,
		  type: 'line',
		  dropShadow: {
			enabled: true,
			color: '#000',
			top: 18,
			left: 7,
			blur: 10,
			opacity: 0.2
		  },
		  toolbar: {
			show: false
		  }
		},
		colors: ['#78C193', '#FF4560', '#3EC1D3', '#303A52'],
		dataLabels: {
		  enabled: false,
		},
		stroke: {
		  curve: 'smooth',
			  width: 2
		},
			
		/*grid: {
		  borderColor: '#e7e7e7',
		  row: {
			colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
			opacity: 0.5
		  },
		},*/
		markers: {
		  size: 1
		},
		xaxis: {
		  categories: seriesLabel,
		 /* title: {
			text: 'Month'
		  }*/
		},
		/*yaxis: {
		  title: {
			text: 'Temperature'
		  },
		  min: 5,
		  max: 40
		},*/
		legend: {
		  show:false,
		  position: 'top',
		  horizontalAlign: 'center',
		  floating: true,
		  offsetY: -25,
		  offsetX: -5
		}
	};
	
		
    aachart = new ApexCharts(document.querySelector("#delayLineChart"+id), abc);
    aachart.render();
	
}
function ageLineChart(id,year,data,title){
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.ageChart').html('').attr('id', 'ageChart'+id);
	$('#ageChart'+id).removeClass('d-none');
	$('#ageChart').html('');
	$('#dynamicTitle').html(title);

	year=year.replaceAll('~',',');
	year=JSON.parse("["+year+"]");

	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");
	var ageLineoptions = {
          series: [{
          name: '',
          data: data
        }],
          chart: {
          type: 'area',
          height: 300,
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: true
        },
        stroke: {
          curve: 'straight'
        },
        
       /* title: {
          text: 'Fundamental Analysis of Stocks',
          align: 'left'
        },
        subtitle: {
          text: 'Price Movements',
          align: 'left'
        },*/

        xaxis: {
          categories:year,
        },
        yaxis: {
          opposite: false
        },
        legend: {
          horizontalAlign: 'right'
        }
        };
		
    aachart = new ApexCharts(document.querySelector("#ageChart"+id), ageLineoptions);
    aachart.render();
	
}
function stageBarChart(title,data,color,id,label){
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.stageChart').html('').attr('id', 'stageChart'+id);
	$('#stageChart'+id).removeClass('d-none');
	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");

	label=label.replaceAll('~',',');
	label=label.replaceAll('#',' ');
	label=JSON.parse("["+label+"]");

	var dchart='';
	$('#dynamicTitle').html(title);

	var dynamicoptions = {
			  series: [{
				 name: 'Count',
			  data:data
			}],
			  chart: {
			  type: 'bar',
			  height: 300
			},
			plotOptions: {
			  bar: {
				borderRadius: 0,
				horizontal: false,
			  }
			},
				stroke: {
	  show: true,
	  width: 1,
	  colors: ['#EE964B']
	},
			dataLabels: {
          enabled: true,
          offsetX: -6,
          style: {
            fontSize: '12px',
            colors: ['#fff']
          }
        },
			fill: {
  colors: [color]
},
			xaxis: {
			  categories: label,
				   labels: {
          show: true,
			  }
			}
			};
			
			dchart = new ApexCharts(document.querySelector("#stageChart"+id), dynamicoptions);
			dchart.render();
	}
	function pending_dashboard()
	{
		
		$("#refresh_pend").removeClass("d-none");
		$("#sel_year_chosen").hide();
		var state_code=$("#state_code").val();
		var dist_code=$("#dist_code").val();
		var url='home/fetchPendingDashboard';
		var postdata='';
		if(state_code!='')
			postdata+='state_code='+state_code;
		if(dist_code!='')
			postdata+='&dist_code='+dist_code;

		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			var casetype=result.mattertype_count;
			casetype=casetype.replaceAll('~',',');
			casetype=JSON.parse("["+casetype+"]");
			matterType('Matter Type Pendency',casetype);
			pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
			//stageChart('Stage Wise Pendency',result.stagewise_count,111,result.purposename);
			delayReasonChart('Delay Reason',result.delayCount,'',result.delayName);
			casetypeChart('Case Type',result.casetype_count,'#FEB019',11,result.casetype_name);

			instVsDispLineChart(11,result.year,result.ins_count,result.disp_count);
			statewisePendency(result.state_name_arr,result.state_civ,result.state_cri,result.state_tot);
			
			$("#chart12tbl").html(result.tabledata);
			$('#stateWPDashboard').DataTable(
	 {
				//responsive:true
				}
    );

		}
	}
	function updateInsDisp(url,val)
	{
		var year=$("#year").val();
		var postdata='year='+year;
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
		$(".instVsDispLineChart").html('');
			$("#instVsDispLineChart11").html('');
			instVsDispLineChart(12,result.year_ins,result.ins_count1,result.disp_count1);
		}
	}
	
	/*function matterTypePendecy(url,val)
	{
		var ci_cri=$('input[name=flexRadioDefault]:checked').val();
		var case_type_val = $("#matterCaseType").val();
		//alert(case_type_val);
		var postdata='ci_cri='+ci_cri+'&case_type_val='+case_type_val;
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			var casetype=result.mattertype_count;
			casetype=casetype.replaceAll('~',',');
			casetype=JSON.parse("["+casetype+"]");
			matterType('Matter Type Pendency',casetype);
			pendingCasesChartT2('Age Wise Pendency',result.agewise_count,'#63B881',1111);
			stageChart('Stage Wise Pendency',result.stagewise_count,111,result.purposename);
			delayReasonChart('Delay Reason',result.delayCount,'',result.delayName);
			casetypeChart('Original Case Type Wise',result.casetype_count,'#008FFB',11,result.casetype_name);
			instVsDispLineChart(11,result.year,result.ins_count,result.disp_count);
		}
	}*/
	/*function delayPendency(url,val)
	{
		var ci_cri=$('input[name=flexRadioDefaultDelay]:checked').val();
		var postdata='ci_cri='+ci_cri;
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			delayReasonChart('Delay Reason',result.delayCount,'',result.delayName);
		}
	}*/
	function disposed_dashboard(ci_cri)
	{
		$("#sel_year_chosen").show();
		$("#refresh_pend").removeClass("d-none");
		var state_code=$("#state_code").val();
		var dist_code=$("#dist_code").val();
		var year=$("#sel_year").val();
		var url='home/fetchDisposedDashboard';
		var postdata='year='+year+'&ci_cri='+ci_cri;
		if(state_code!='')
			postdata+='&state_code='+state_code;
		if(dist_code!='')
			postdata+='&dist_code='+dist_code;

		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			var casetype=result.mattertype_count;
			casetype=casetype.replaceAll('~',',');
			casetype=JSON.parse("["+casetype+"]");
			dispmatterType('Matter Type Pendency',casetype);
			disppendingCasesChartT2('Age Wise Pendency',result.agewise_count,'#63B881',1111);
			dispcasetypeChart('Original Case Type Wise',result.casetype_count,'#008FFB',11,result.casetype_name);
			disposalNature('Nature Wise Disposal',result.natureCount,result.natureName);
			timeToDispositionChart('Time To Disposition',result.dispCount,'#008FFB',22,result.naturedispName);
		}

	}

	function dispmatterType(dynamictitle,data)
{
	color= ['#008FFB', '#00E396', '#FEB019', '#FF4560'];
	$('#dispmatterTypeTitle').html(dynamictitle);
	var mattertypeval=$("#dispmattertypeval").val();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var year=$("#sel_year").val();
	var mtoptions = {
		series: data,
		chart: {
		width: '80%',
		type: 'pie',

			events: {
			    markerClick: function (event, chartContext, config) {
					
					var url='home/fetchdispMatterType';
					var postdata='mattertypeval='+config.dataPointIndex+'&year='+year;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{		
						$("#dispmattertypeval").val(config.dataPointIndex);
						disppendingCasesChartT2(result.agetitle,result.agewise_count,result.color,1111);
						dispcasetypeChart(result.casetypetitle,result.casetype_count,result.color,11,result.casetype_name);
						disposalNature(result.naturetitle,result.natureCount,result.natureName);
						timeToDispositionChart(result.disptitle,result.dispCount,result.color,22,result.naturedispName);
					}
					
                 },
				
			}
        },
			  legend: {
			   show: false,
              position: 'bottom'
            },
        labels: ['Original', 'Appeal', 'Application', 'Execution'],
		colors:color,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        };

        var mtchart = new ApexCharts(document.querySelector("#dispmatterTypeChart"), mtoptions);
        mtchart.render();
}
function disppendingCasesChartT2(title,tot_pend,color,id)
{
	$('.dispageWiseChart').html('').attr('id', 'dispageWiseChart'+id);
	tot_pend=tot_pend.replaceAll('~',',');
	tot_pend=JSON.parse("["+tot_pend+"]");
	$('#dispageTitle').html(title);
	var mattertypeval=$("#dispmattertypeval").val();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var year=$("#sel_year").val();

	var ageoptions = {
	  series: [ {
	  name: 'Total',
	  data: tot_pend
	}],
	  chart: {
	  type: 'bar',
	  height: '80%',
		  toolbar: {
            show: false
          }
			, events: {
			    markerClick: function (event, chartContext, config) {
					$("#dispagewiseval").val(config.dataPointIndex);
					var url='home/fetchDispAgewise';
					var postdata='agewiseval='+config.dataPointIndex+'&mattertypeval='+mattertypeval+'&year='+year;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						dispcasetypeChart(result.casetypetitle,result.casetype_count,result.color,11,result.casetype_name);
						disposalNature(result.naturetitle,result.natureCount,result.natureName);
						timeToDispositionChart(result.disptitle,result.dispCount,result.color,22,result.naturedispName);
					}
					
                 },
				
			}
	},
	plotOptions: {
	  bar: {
		horizontal: true,
		dataLabels: {
		  position: 'top',
		},
	  }
	},
	dataLabels: {
	  enabled: false,
	  offsetX: 0,
	  style: {
		fontSize: '8px',
		colors: ['#fff']
	  }
	},
	stroke: {
	  show: false,
	  width: 1,
	  colors: ['#fff']
	},
	tooltip: {
	  shared: false,
	  intersect: false
	},
		  fill: {
  colors: [color]
},
	xaxis: {
	   categories: ['0 to 3 Years', '3 to 5 Years', '5 to 10 Years', 'Above 10 Years'],
		   labels: {
          show: true,
          rotate: -25,
          rotateAlways: true,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
              colors: [],
              fontSize: '11px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },}
	},

	};

	var agechart1 = new ApexCharts(document.querySelector("#dispageWiseChart"+id), ageoptions);
	agechart1.render();

}
function dispcasetypeChart(title,data,color,id,label){
	
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.dispcasetypeChart').html('').attr('id', 'dispcasetypeChart'+id);
	$('#dispcasetypeChart'+id).removeClass('d-none');
	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");

	label=label.replaceAll('~',',');
	label1=label.replaceAll('#',' ');
	label1=JSON.parse("["+(label1)+"]");

	var mattertypeval=$("#dispmattertypeval").val();
	var dispagewiseval=$("#dispagewiseval").val();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var year=$("#sel_year").val();

	var dchart='';
	$('#dispdynamicTitle').html(title);
	var dynamicWidth='90%'
		if(data.length > 10)
			{
				dynamicWidth='80%'
			}
			else if(data.length > 4 )
			{
				dynamicWidth='30%'
			}
			else if(data.length > 0 )
			{
				dynamicWidth='10%'
			}

	var dynamicoptions = {
			  series: [{
				 name: 'Count',
			  data:data
			}],
			  chart: {
			  type: 'bar',
			  height: 250,
				   toolbar: {
            show: false
          }, events: {
			    markerClick: function (event, chartContext, config) {
					$("#disp_case_type").val(config.dataPointIndex);
					var url='home/fetchCaseType';
					var postdata='casetype='+config.dataPointIndex+'&mattertypeval='+mattertypeval+'&year='+year+'&agewiseval='+dispagewiseval;
					if(state_code!='')
						postdata+='&state_code='+state_code;
					if(dist_code!='')
						postdata+='&dist_code='+dist_code;
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	
						disposalNature(result.naturetitle,result.natureCount,result.natureName);
						timeToDispositionChart(result.disptitle,result.dispCount,'#008FFB',22,result.naturedispName);
					}
					
                 },
				
			}
			},
			plotOptions: {
			  bar: {
				borderRadius: 0,
				horizontal: false,

				
			    columnWidth: dynamicWidth,
					dataLabels: {
              position: 'top', // top, center, bottom
            },
			  }
			},
				stroke: {
	  show: true,
	  width: 1,
	  colors: ['#fff']
	},
			dataLabels: {
          enabled: false,
          offsetY: -20,
			    textAnchor: 'middle',
          style: {
            fontSize: '8px',
            colors: ['#000']
          }
        },
			fill: {
  colors: [color]
},
			xaxis: {
			  categories: label1,
				   labels: {
          show: true,
			  }
			}
			};
			
			dchart = new ApexCharts(document.querySelector("#dispcasetypeChart"+id), dynamicoptions);
			dchart.render();
	}
function dispDynamicChart(str)
{
	var year=$("#sel_year").val();
	var postdata='str='+str+'&year='+year;
	var url='home/dynamicChartsDisp';
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		if(str=='C')
			dispcasetypeChart(result.dynamictitle,result.dynamicdata,result.color,22,result.dynamictitle1);
		else if(str=='A')
			dispageLineChart(1,result.agewise_year,result.agewise_line,'Age Wise Pendency(Original)');
	}
}
	function dispageLineChart(id,year,data,title){
	$('.dynamicChart-cls').addClass('d-none');
	
	$('.dispageChart').html('').attr('id', 'dispageChart'+id);
	$('#dispageChart'+id).removeClass('d-none');
	$('#dispageChart').html('');
	$('#dispdynamicTitle').html(title);

	year=year.replaceAll('~',',');
	year=JSON.parse("["+year+"]");

	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");
	var ageLineoptions = {
          series: [{
          name: "Securing Presence",
          data: data
        }],
          chart: {
          type: 'area',
          height: 300,
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: true
        },
        stroke: {
          curve: 'straight'
        },
        
       /* title: {
          text: 'Fundamental Analysis of Stocks',
          align: 'left'
        },
        subtitle: {
          text: 'Price Movements',
          align: 'left'
        },*/

        xaxis: {
          categories:year,
        },
        yaxis: {
          opposite: false
        },
        legend: {
          horizontalAlign: 'right'
        }
        };
		
    aachart = new ApexCharts(document.querySelector("#dispageChart"+id), ageLineoptions);
    aachart.render();
	
}


function timeToDispositionChart(title,data,color,id,label){
	$('.dispositioncasetypeChart').html('').attr('id', 'timeToDisposition'+id);
	$('#dispositioncasetypeChart'+id).removeClass('d-none');
	data=data.replaceAll('~',',');
	data=JSON.parse("["+data+"]");

	label=label.replaceAll('~',',');
	label1=label.replaceAll('#',' ');
	label1=JSON.parse("["+(label1)+"]");
	var dchart='';
	$('#dispositiondynamicTitle').html(title);
	var dynamicWidth='90%'
	/*	if(data.length > 10)
			{
				dynamicWidth='80%'
			}
			else if(data.length > 4 )
			{
				dynamicWidth='30%'
			}
			else if(data.length > 0 )
			{
				dynamicWidth='10%'
			}*/

	var dynamicoptions = {
			  series: [{
				 name: 'Count',
			  data:data
			}],
			  chart: {
			  type: 'bar',
			  height: 300,
				   toolbar: {
            show: false
          },/* events: {
			    markerClick: function (event, chartContext, config) {
					
					var url='home/fetchMatterType/'+config.dataPointIndex;
					var postdata='';
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{	
					}
					
                 },
				
			}*/
			},
			plotOptions: {
			  bar: {
				borderRadius: 0,
				horizontal: false,

				
			    columnWidth: dynamicWidth,
					dataLabels: {
              position: 'top', // top, center, bottom
            },
			  }
			},
				stroke: {
	  show: true,
	  width: 1,
	  colors: ['#fff']
	},
			dataLabels: {
          enabled: false,
          offsetY: -20,
			    textAnchor: 'middle',
          style: {
            fontSize: '11px',
            colors: ['#000']
          }
        },
			fill: {
  colors: [color]
},
			xaxis: {
			  categories: label1,
				   labels: {
          show: true,
			  }
			}
			};
			
			dchart = new ApexCharts(document.querySelector("#timeToDisposition"+id), dynamicoptions);
			dchart.render();
	}

function totalJudge()
{
	$('#case_listed').show();
	$('#example_wrapper').hide();
	var get_state_code=$("#state_code").val();
	var res = get_state_code.split("~");
	var state=res[1];
	if(typeof state==="undefined")
		var state=$("#sessstate").val();

	var distcode=$("#dist_code").val();

	var val_objection1="totaljudges";
    var val_type="ci";
	var url_state_dist="";

	if(state!='')
	{

		if(distcode>0)
		{
			val_detail="detail.php";
			val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
			url_state_dist+="&state_code="+state+"&dist_code="+distcode;
		}
		else
		{
			val_detail="state_detail.php";
			val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
			url_state_dist+="&state_code="+state;
		}
	}
    var url=host_name+val_url+"objection1="+val_objection1+"&type="+val_type+url_state_dist;
    $('#case_listed').html('<iframe id="case_history1" src="'+url+'" style="width:150%;height:500px;"/></iframe>');

}

function excessiveDatedCases(value)
{
	$('#case_listed').show();
	$('#example_wrapper').hide();

	var get_state_code=$("#state_code").val();
	var res = get_state_code.split("~");
	var state=res[1];
	if(typeof state==="undefined")
        var state=$("#sessstate").val();
	
	var distcode=$("#dist_code").val();
	var val_objection1="excessive_cases";
	var val_type="";

	if(value=='civ')
	{
		val_type="ci";
	}
	else if(value=='cri')
	{
		val_type=value;
	}
	else if(value=='both')
	{
		val_type=value;
	}

	var url_state_dist="";
	if(state!='')
	{
	 
	if(distcode>0)
			{
					val_detail="detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state+"&dist_code="+distcode;
			}
			else
			{
			 val_detail="state_detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state;
			}
	}
	var url=host_name+val_url+"objection1="+val_objection1+"&type="+val_type+url_state_dist;
	$('#case_listed').html('<iframe id="case_history1" src="'+url+'" style="width:150%;height:500px;"/></iframe>');
}

function underObjectionCases(value)
{
	$('#case_listed').show();
	$('#example_wrapper').hide();
	
	var get_state_code=$("#state_code").val();
	var res = get_state_code.split("~");
	var state=res[1];
	if(typeof state==="undefined")
                var state=$("#sessstate").val();
	
	var distcode=$("#dist_code").val();
	var val_objection1="objection";
	var val_type="";

	if(value=='civ')
	{
		val_type="ci";
	}
	else if(value=='cri')
	{
		val_type=value;
	}
	else if(value=='both')
	{
		val_type=value;
	}

	var url_state_dist="";
	if(state!='')
	{

	 if(distcode>0)
			{
					val_detail="detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state+"&dist_code="+distcode;
			}
			else
			{
			 val_detail="state_detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state;
			}
	}
	var url=host_name+val_url+"objection1="+val_objection1+"&type="+val_type+url_state_dist;
	$('#case_listed').html('<iframe id="case_history1" src="'+url+'" style="width:100%;height:500px;"/></iframe>');
}
function undatedCases(value)
{
	$('#case_listed').show();
	$('#example_wrapper').hide();

	var get_state_code=$("#state_code").val();
	var res = get_state_code.split("~");
	var state=res[1];
	if(typeof state==="undefined")
                var state=$("#sessstate").val();
	
	var distcode=$("#dist_code").val();
	var val_objection1="undated_cases";
	var val_type="";

	if(value=='civ')
	{
		val_type="ci";
	}
	else if(value=='cri')
	{
		val_type=value;
	}
	else if(value=='both')
	{
		val_type=value;
	}

	var url_state_dist="";
	if(state!='')
	{

	 if(distcode>0)
			{
					val_detail="detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state+"&dist_code="+distcode;
			}
			else
			{
			 val_detail="state_detail.php";
					val_url="stat_reports/"+val_detail+"?es=Y&intra=Y&";
					url_state_dist+="&state_code="+state;
			}
	}
	var url=host_name+val_url+"objection1="+val_objection1+"&type="+val_type+url_state_dist;
	$('#case_listed').html('<iframe id="case_history1" src="'+url+'" style="width:100%;height:500px;"/></iframe>');
}
/*function delay_dashboard()
{
	$.session.set("active_tab",'delay');
	 $("#sel_year_chosen").hide();
	$("#toggleLayout").hide();
	$("#refresh_pend").hide();
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/fetchDelayDashboard';
	var postdata='';
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;

	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#delayReasonList").html(result.reportrow);
		var civ_res = result.civ_per;
		var civ_per=civ_res.split("~");
		$.each( civ_per, function( key, value ) {
			$("#civ_per"+key).html(' '+value+'%');
		});


		var cri_res = result.cri_per;
		var cri_per=cri_res.split("~");
		$.each( cri_per, function( key, value ) {
			$("#cri_per"+key).html(' '+value+'%');
		});
	}
}*/



function delay_dashboard(ci_cri,tab_val)
{
	$("#statediv").show();
	if(ci_cri==2)
	{
		$("#civDelaybtn").addClass('active');
		$("#criDelaybtn").removeClass('active');
		$("#bothDelaybtn").removeClass('active');
	}
	if(ci_cri==3)
	{
		$("#criDelaybtn").addClass('active');
		$("#civDelaybtn").removeClass('active');
		$("#bothDelaybtn").removeClass('active');
	}
	if(ci_cri==1)
	{
		$("#bothDelaybtn").addClass('active');
		$("#criDelaybtn").removeClass('active');
		$("#civDelaybtn").removeClass('active');
	}
	$.session.set("active_tab", tab_val);
	$('#Stageready3').prop('checked',true);
	$("#casetype").val('');
	$("#case_type_breadcrumb").hide();
	$("#age_breadcrumb1").hide();
	 $("#toggleLayout").show();
        $("#refresh_pend").show();
	 
		$("#set_year_li").hide();
		$(".stagereadygrp").show();
		$("#sel_year").hide();
		$("#dv_inst_disp_select").removeClass('d-none');
		$("#dv_disp_nature_pie").addClass('d-none');
		$("#title_3").html('Delay Reason');
		$("#title_4").html('Institution Vs Disposal');
		$("#labelReady").html('Ready');
                $("#labelUnready").html('Unready');
		$("#stage_heading1").html('Case Type');
		$("#div_ins_disp").show();
		$("#div_delay").addClass("col-xl-6").removeClass("col-xl-12");
		var stage_ready=$('input[name="Stagereadyradio"]:checked').val();
		 $('#sel_year').chosen('destroy');
		//$("#sel_year").val(2024);
		var currentTime = new Date();
		$("#sel_year").val(currentTime.getFullYear());
		 $('#sel_year').chosen();
 
	$("input[name=Agewisebtnradio]").prop('checked',false);
	$("input[name=Stagewisebtnradio]").prop('checked',false);
	$("#ins_year").val('');
	 $('#ins_year').trigger("chosen:updated");
	$("#refresh_pend").removeClass("d-none");
	$("#sel_year_chosen").hide();
	$("#ci_cri").val(ci_cri);
	//$(".apexcharts-canvas").css("height", "100vh");
	stage_ready=3;
	$('#Stageready3').attr('checked',true);
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	//alert(dist_code)
	var url='home/fetchDelayDashboard';
	var postdata='ci_cri='+ci_cri+'&stage_ready='+stage_ready+'&active_tab='+tab_val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	 $("#agewisetbl1").hide();
  
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{		
		$("#case_type_select").html(result.caseType_options);
		$("#case_type_select").trigger("chosen:updated")

	    $('#arrdelayId1').val(result.arrDelayID);
		//alert(result.arrDelayID);
		ageData=result.ageDelaywise_total;
		nationalCaseType1(result.delay_name,result.delay_count,result.delay_full_name); 	
		$(".apexcharts-series").find("path[selected=true]").css("fill", "rgba(107,146,173,0.8)");//alert('111111');	 
	 
			 $("#div_delay").show();
			$("#chartstbl").html('');
			$('#chartstbl').append(result.delaywiseCount);  	
			$("#tblDelaywisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }],
				"ordering": false});
		 
		 	agewiseLineChart1(result.delaywise_year,result.delaywise_count);
			ageData=result.agewise_count;
			pendingCasesDelayChartT2('Age Wise Pendency ',result.ageDelaywise_total,'#78C193',1111);

		$("#ageBarInDropdowntbl1").html('');
		$('#ageBarInDropdowntbl1').append(result.ageDelayChartcounts);
		$("#tblAgeChartcount1").DataTable({
		dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});


		$("#agewisetbl1").html('');
		$('#agewisetbl1').append(result.agewiseDelayCount);	 
		$("#tblAgewisecount1").DataTable({dom: 'lrfBtip',
	      buttons: [
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]});
		 	$("#ageline1").val(result.delaywise_year);
	 		$("#agelinecount1").val(result.delaywise_count); 

					stageWiseBarChart1(result.delayCasetype_name,result.delayCasetype_count);	
						$("#stagetbl1").html('');
						$('#stagetbl1').append(result.delayCasecount);
						$("#tblCasetype1").DataTable({dom: 'lrfBtip',
			  buttons: [
				{ 
					"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
					exportOptions: {
						columns: ':visible'
					}
				},
				{
					"extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
					exportOptions:{
						columns: ':visible'
					}
				},
				{
					"extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
					exportOptions:{
						columns: ':visible'
					}
				}]});
			 
	
	}
}
 
	function fetchDelayCasesCaptcha(state_code,dist_code,est_code,ci_cri,val,delay_name,flag,caseType_val)
	{ 
			var url='home/fetchCaseCaptcha';
			var post_data='';
			$("#est_tab").hide();
			ajaxCall({url:url,postdata:post_data,callback:callback});
	 
			function callback(result)
			{  
					 $('#modal-body-case-captcha').html(result.filename);
					  $("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:allDelayCases(\""+state_code+"\",\""+dist_code+"\",\""+est_code+"\",\""+ci_cri+"\",\""+val+"\",\""+delay_name+"\",\""+flag+"\",\""+caseType_val+"\")\'data-bs-toggle='modal' data-bs-target='#modal_delay_cases'>" ); 
			}
	}

//function allDelayCases(delay_id,delay_name,ci_cri)
function allDelayCases(state_code,dist_code,est_code,ci_cri,val,delay_name,flag,caseType_val) 
{   
	var delay_id=val;
	 
	$("#statediv").show();
	 
	/*if(state_code!='')
		$("#th_state").html('District');*/
	 $("#delay_header").html(delay_name);
	var url='home/fetchAllDelayCases';
	var table=$('#tbl_delay_cases').DataTable();
		table.destroy();

         if(delay_id==1)
   {
        $('#tbl_delay_cases .ex_th1').html('From Date');
   }
   else if(delay_id==3)
   {
     $('#tbl_delay_cases .ex_th1').html('Police Station');
         $('#tbl_delay_cases .ex_th2').html('Fir No. / Year');
         $('#tbl_delay_cases .ex_th3').html('Accused Names -First Process Issued Date');

   }
   else if(delay_id==4)
   {
                $('#tbl_delay_cases .ex_th1').html('SC Case Number');
                $('#tbl_delay_cases .ex_th2').html('From Date');
   }
   else if(delay_id==5)
   {
         $('#tbl_delay_cases .ex_th1').html('HC Case Number');
                 $('#tbl_delay_cases .ex_th2').html('From Date');
   }
   else if(delay_id==6)
   {
         $('#tbl_delay_cases .ex_th3').show();
     $('#tbl_delay_cases .ex_th1').html('District Court/Other Court');
         $('#tbl_delay_cases .ex_th2').html('Case Number');
         $('#tbl_delay_cases .ex_th3').html('From Date');
   }
   else if(delay_id==7)
   {
         $('#tbl_delay_cases .ex_th1').html('Remarks');
                 $('#tbl_delay_cases .ex_th2').html('From Date');
   }
 else if(delay_id==8)
   {
         $('#tbl_delay_cases .ex_th1').html('First Process Issued Date');
   }
   else  if(delay_id==9)
   {
        $('#tbl_delay_cases .ex_th1').html('Case Number');
                $('#tbl_delay_cases .ex_th2').html('Filing Date ');
   }
   else  if(delay_id==10)
   {
        $('#tbl_delay_cases .ex_th1').html('Document Type');
                $('#tbl_delay_cases .ex_th2').html('From Date');
   }
   else  if(delay_id==11)
   {
         $('#tbl_delay_cases .ex_th1').html('First Process Issued Date');
   }
   else  if(delay_id==12)
   {
         $('#tbl_delay_cases .ex_th1').html('Reason');
         $('#tbl_delay_cases .ex_th2').html('First Process Issued Date');
   }
   else  if(delay_id==14)
   {
         $('#tbl_delay_cases .ex_th1').html('Reason');
         $('#tbl_delay_cases .ex_th2').html('Not Available Since');
   }
   else  if(delay_id==17)
   {
         $('#tbl_delay_cases .ex_th1').html('Remark');
   }
   else  if(delay_id==18)
   {
         $('#tbl_delay_cases .ex_th1').html('Petitioner/Respondent');
         $('#tbl_delay_cases .ex_th2').html('Remark');
   }
   else  if(delay_id==20)
   {
         $('#tbl_delay_cases .ex_th1').html('Number of Witness ');
   }

   var captcha_val=$('#captcha1').val();





		$('#tbl_delay_cases').DataTable( {			
			dom: 'lrBtip',

			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[ 25, 50,100,1000], [ 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/fetchAllDelayCases",
			 "bAutoWidth": false,
			 "columnDefs": [{ targets: 'no-sort', orderable: false }],
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "delay_id", "value": delay_id } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "caseType_val", "value": caseType_val } );
					aoData.push( { "name": "captcha_val", "value": captcha_val } );

					/* Column filter count */
					var postdata='';
					var c=0;
					$.each(aoData, function (k,v) {
							if(c==0)
									 postdata+=v.name+'='+v.value;
							else
									postdata+='&'+v.name+'='+v.value;
							c++;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						//alert(result.output);
						if(result.msg=='')
						{  
								setTimeout(function(){ 
								$("#modal_delay_cases").modal('show');	 
								$("#modal_casedata_captcha").modal('hide');
								},100 );	
								fnCallback(result.output);
								var table=$('#tbl_delay_cases').DataTable();
								if($("#state_code").val()!='')
										table.columns([1]).visible(false);
								if($("#dist_code").val()!='')
										table.columns([2]).visible(false);
								
								if(delay_id==1)
							   {
								  table.columns([8,9,10]).visible(false);
							   }
							   else if(delay_id==3)
							   {
								  table.columns([10]).visible(false);
							   }
								else  if(delay_id==4)
							   {
									 table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==5)
							   {
									 table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==6)
							   {
									table.columns([10]).visible(false);
							   }
							   else  if(delay_id==7)
							   {
									table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==8)
							   {
									 table.columns([8,9,10]).visible(false);
							   }
							   else  if(delay_id==9)
							   {
								  table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==10)
							   {
								   table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==11)
							   {
								   table.columns([8,9,10]).visible(false);
							   }
								else  if(delay_id==12)
							   {
									table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==14)
							   {
									 table.columns([9,10]).visible(false);
							   }
							   else  if(delay_id==17)
							   {
									 table.columns([8,9,10]).visible(false);
							   }
							   else  if(delay_id==18)
							   {
									 table.columns([9,10]).visible(false);
							   }
								else  if(delay_id==20)
							   {
									 table.columns([8,9,10]).visible(false);
							  }
						}
						else
						{ 
							setTimeout(function(){
								$("#modal_delay_cases").hide();
								$('#captcha1').val('');
								$("#modal_dashcaselist").modal('hide');
								 $("#modal_casedata_captcha").show();	
								$("#modal_casedata_captcha").modal('show');	
							},50);								 
							errorAlert('Invalid Captcha!!');
							$('.modal-backdrop').remove();
								document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
								return false; 
						} 
							}
						}	,
			 buttons:[	      	     
	        { 
	      		"extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" ><span class="fas fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
	      		exportOptions: {
                    columns: ':visible'
                }
	        },
	      	{
	      		"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" ><span class="fas fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	        	}
	        },
	      	{
	      		"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" ><span class="fas fa-file-csv" aria-hidden="true" title="Export to csv"></span> </button>',
	      		exportOptions:{
	                columns: ':visible'
	            }
	        }]
  } );

}
function get_district(url)
{
	var state_code=$("#state_code").val();
	var postdata='state_code='+state_code;
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#dist_code").html(result.dist_options);
		sortSelectOptions('#dist_code',true);
		$("#dist_code").trigger("chosen:updated");
		
	}

}
function get_district_disp(url)
{
	var state_code=$("#state_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var postdata='state_code='+state_code+'&ci_cri='+ci_cri;
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#dist_code_disp").html(result.dist_options);
		sortSelectOptions('#dist_code_disp',true);
		$("#dist_code_disp").trigger("chosen:updated")

		$("#case_type_disp").html(result.caseType_options);
		sortSelectOptions('#case_type_disp',true);
		$("#case_type_disp").trigger("chosen:updated");
		
	}

}
function get_caseType(url)
{
	var ci_cri=$("#ci_cri_disp").val();
	var postdata='ci_cri='+ci_cri;
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		
		$("#case_type_disp").html(result.caseType_options);
		sortSelectOptions('#case_type_disp',true);
		$("#case_type_disp").trigger("chosen:updated");
		
	}

}
function get_est_disp(url)
{
	var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var postdata='state_code='+state_code+'&dist_code='+dist_code+'&ci_cri='+ci_cri;
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#est_code_disp").html(result.est_options);
		sortSelectOptions('#est_code_disp',true);
		$("#est_code_disp").trigger("chosen:updated");

		$("#case_type_disp").html(result.caseType_options);
		sortSelectOptions('#case_type_disp',true);
		$("#case_type_disp").trigger("chosen:updated");
		
	}

}

function case_load()
{
	$("#statediv").show();
	$.session.set("active_tab",'caseLoad');
	var table=$('#tbl_caseLoad').DataTable({
		});
		table.destroy();
	
	var url="home/caseLoadDashboard";
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var postdata='';
	if(state_code!='')
		postdata+='state_code='+state_code;
	if(dist_code!='')
		postdata+='dist_code='+dist_code;
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#caseloadList").html(result.output);
		$('#tbl_caseLoad').DataTable({
		});
	}
}
function fetchAlertDistRecords(flag,state_code,state_name,ci_cri)
{
	$("#statediv").show();
	var url='home/fetchAlertDistData';
	var dist_code=$("#dist_code").val();
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	 
	$('#modal-body-dist').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='disposed')
			$('#staticBackdropLabel2').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name);
		if(flag=='listed')
			$('#staticBackdropLabel2').html('Cases Listed Today / '+state_name);
		if(flag=='undated')
			$('#staticBackdropLabel2').html('Undated Cases / '+state_name);
		if(flag=='pending')
			$('#staticBackdropLabel2').html('Cases Pending Registration  / '+state_name);
		if(flag=='objection')
			$('#staticBackdropLabel2').html('Cases Under Objection / '+state_name);
		if(flag=='excessive')
			$('#staticBackdropLabel2').html('Excessive Dated Cases (More than 3 Months) / '+state_name);
		if(flag=='prelitigation')
			$('#staticBackdropLabel2').html('Pre-Litigation / '+state_name);
		if(flag=='pretrial')
			$('#staticBackdropLabel2').html('Pre-Trial / '+state_name);
		$('#modal-body-dist').html(result.tbl_str);
		//$('#tbl_dist').DataTable({		});
		gridview('_tbl_dist');
	}
}
function fetchAlertEstRecords(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/fetchAlertEstData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='disposed')
			$('#staticBackdropLabel3').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name);
		if(flag=='listed')
			$('#staticBackdropLabel3').html('Cases Listed Today / '+state_name+' / '+dist_name);
		if(flag=='undated')
			$('#staticBackdropLabel3').html('Undated Cases / '+state_name+' / '+dist_name);
		if(flag=='pending')
			$('#staticBackdropLabel3').html('Cases Pending Registration  / '+state_name+' / '+dist_name);
		if(flag=='objection')
			$('#staticBackdropLabel3').html('Cases Under Objection / '+state_name+' / '+dist_name);
		if(flag=='excessive')
			$('#staticBackdropLabel3').html('Excessive Dated Cases (More than 3 Months) / '+state_name+' / '+dist_name);
		if(flag=='prelitigation')
			$('#staticBackdropLabel3').html('Pre-Litigation / '+state_name+' / '+dist_name);
		if(flag=='pretrial')
			$('#staticBackdropLabel3').html('Pre-Trial / '+state_name+' / '+dist_name);
		
		$('#modal-body-est').html(result.tbl_str);
		gridview('_tbl_est');
	}
}
function fetchCourtRecords1(flag,ci_cri)
{
	var url='home/fetchAlertCourtData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='disposed')
			$('#staticBackdropLabel4').html('Cases Disposed In Last Month(more than 10 years old) ');
		if(flag=='listed')
			$('#staticBackdropLabel4').html('Cases Listed Today ');
		if(flag=='undated')
			$('#staticBackdropLabel4').html('Undated Cases ');
		if(flag=='pending')
			$('#staticBackdropLabel4').html('Cases Pending Registration ');
		if(flag=='objection')
			$('#staticBackdropLabel4').html('Cases Under Objection ');
		if(flag=='excessive')
			$('#staticBackdropLabel4').html('Excessive Dated Cases (More than 3 Months) ');
		if(flag=='prelitigation')
			$('#staticBackdropLabel4').html('Pre-Litigation ');
		if(flag=='pretrial')
			$('#staticBackdropLabel4').html('Pre-Trial ');
		
		$('#modal-body-case').html(result.tbl_str);
		$('#tbl_court').DataTable({
			 dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		});
	}
}

function fetchCourtRecords(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri,state)
{
        var url='home/fetchAlertCourtData';
        var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name+'&est_code='+est_code+'&est_name='+est_name+'&state='+state;
      
        ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
                if(flag=='disposed')
                        $('#staticBackdropLabelCourt').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='listed')
                        $('#staticBackdropLabelCourt').html('Cases Listed Today / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='undated')
                        $('#staticBackdropLabelCourt').html('Undated Cases / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='pending')
                        $('#staticBackdropLabelCourt').html('Cases Pending Registration  / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='objection')
                        $('#staticBackdropLabelCourt').html('Cases Under Objection / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='excessive')
                        $('#staticBackdropLabelCourt').html('Excessive Dated Cases (More than 3 Months) / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='prelitigation')
                        $('#staticBackdropLabelCourt').html('Pre-Litigation / '+state_name+' / '+dist_name+' / '+est_name);
                if(flag=='pretrial')
                        $('#staticBackdropLabelCourt').html('Pre-Trial / '+state_name+' / '+dist_name+' / '+est_name);
                
                $('#modal-body-court').html(result.tbl_str);
                $('#tbl_court').DataTable({
					 dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
                });
        }
} 

function fetchCaseAlertCaptcha(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri,court,judge_name,state,court_no,jocode)
{ 
        var url='home/fetchCaseCaptcha';
        var post_data='';
        $("#est_tab").hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
 
        function callback(result)
        {  
				 $('#modal-body-case-captcha').html(result.filename);
$("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:fetchAlertCasesRecords(\""+flag+"\",\""+state_code+"\",\""+state_name+"\",\""+dist_code+"\",\""+dist_name+"\",\""+est_code+"\",\""+est_name+"\",\""+ci_cri+"\",\""+court+"\",\""+judge_name+"\",\""+state+"\",\""+court_no+"\",\""+jocode+"\")\'data-bs-toggle='modal' data-bs-target='#modal_alertcase_data'>" ); 
        }
} 

function fetchAlertCasesRecords(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri,court,judge_name,state,court_no,jocode)
{
        var url='home/fetchAlertCasesData';
		
		var search_by=$("#sel_search_by3 option:selected").val();

		if(flag!='' && flag!=undefined)
                $("#flag").val(flag);
        else
                flag=$("#flag").val();

        if(ci_cri!='' && ci_cri!=undefined)
                $("#ci_cri").val(ci_cri);
        else
                ci_cri=$("#ci_cri").val();

        if(judge_code!='' && judge_code!=undefined)
                $("#judge_code").val(judge_code);
        else
                judge_code=$("#judge_code").val();

        if(state_code!='' && state_code!=undefined)
                $("#state_code2").val(state_code);
        else
                var state_code=$("#state_code2").val();
 
        if(dist_code!='' && dist_code!=undefined)
                $("#dist_code2").val(dist_code);
        else
                var dist_code=$("#dist_code2").val();

		 if(state_name!='' && state_name!=undefined)
                $("#txt_state_name").val(state_name);
        else
                var state_name=$("#txt_state_name").val();

		if(est_code!='' && est_code!=undefined)
			$("#txt_est_code").val(est_code);
		else
			est_code=$("#txt_est_code").val();  

		if(est_name!='' && est_name!=undefined)
			$("#txt_est_name").val(est_name);
		else
			est_name=$("#txt_est_name").val();  

		if(state!='' && state!=undefined)
			$("#state").val(state);
		else
			state=$("#state").val();

		if(est_name!='' && est_name!=undefined)
			$("#est_name").val(est_name);
		else
			est_name=$("#est_name").val();	
		
		if(est_code!='' && est_code!=undefined)
			$("#est_code").val(est_code);
		else
			est_code=$("#est_code").val();

		if(court!='' && court!=undefined)
			$("#court").val(court);
		else
			court=$("#court").val();
				
		if(judge_name!='' && judge_name!=undefined)
			$("#judge_name").val(judge_name);
		else
			judge_name=$("#judge_name").val();
			
		if(court_no!='' && court_no!=undefined)
			$("#court_no").val(court_no);
		else
			court_no=$("#court_no").val();
			
		if(jocode!='' && jocode!=undefined)
			$("#jocode").val(jocode);
		else
			jocode=$("#jocode").val();

		var captcha_val=$('#captcha1').val();

 //var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name+'&est_code='+est_code+'&est_name='+est_name+'&court='+court+'&judge_name='+judge_name+'&state='+state;
		 
                var table=$('#tbl_cases_pending').DataTable();
                table.destroy();
				labelCourt=court;
				court=encodeURIComponent(court)
                $('#tbl_cases_pending').DataTable({
                        dom: 'lrfBtip',
                        "pagingType": "full",
                        "paging": true,
                        "lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
                        "bProcessing": true,
                        "bServerSide": true,
                        "sAjaxSource": "home/fetchAlertCasesData",
                         "bAutoWidth": false,
                        fnServerData: function ( sSource, aoData, fnCallback ) {
                                        aoData.push( { "name": "flag", "value": flag } );
                                        aoData.push( { "name": "state_code", "value": state_code } );
                                        aoData.push( { "name": "state_name", "value": state_name } );
                                        aoData.push( { "name": "dist_code", "value": dist_code } );
                                        aoData.push( { "name": "ci_cri", "value": ci_cri } );
                                        aoData.push( { "name": "dist_name", "value": dist_name } );
                                        aoData.push( { "name": "est_code", "value": est_code } );
                                        aoData.push( { "name": "est_name", "value": est_name } );
										aoData.push( { "name": "court", "value": court } );
										aoData.push( { "name": "judge_name", "value": judge_name } );
										aoData.push( { "name": "state", "value": state } );
										aoData.push( { "name": "court_no", "value": court_no } );
										aoData.push( { "name": "jocode", "value": jocode } );
										aoData.push( { "name": "captcha_val", "value": captcha_val } );
										aoData.push( { "name": "search_by", "value": search_by } );
                                       
                                        var postdata='';
                                        var c=0;
									$.each(aoData, function (k,v) {
									/*if(c==0)
											 postdata+=v.name+'='+v.value;
									else*/
											postdata+='&'+v.name+'='+v.value;
									c++;
							});
  
							ajaxCall({url:url,postdata:postdata,callback:callback});
							function callback(result)
							{ 
								/*fnCallback(result.output);
							 if(flag=='disposed')
								$('#staticBackdropLabel6').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='listed')
									$('#staticBackdropLabel6').html('Cases Listed Today / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='undated')
									$('#staticBackdropLabel6').html('Undated Cases / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='pending')
									$('#staticBackdropLabel6').html('Cases Pending Registration  / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='objection')
									$('#staticBackdropLabel6').html('Cases Under Objection / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='excessive')
									$('#staticBackdropLabel6').html('Excessive Dated Cases (More than 3 Months) / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='prelitigation')
									$('#staticBackdropLabel6').html('Pre-Litigation / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
							if(flag=='pretrial')
								$('#staticBackdropLabel6').html('Pre-Trial / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);*/
								 
							if(result.msg_alert==undefined)
								result.msg_alert='';

								if(result.msg_alert=='')
								{   fnCallback(result.output);
								 
									setTimeout(function(){ 
									$("#modal_alertcase_data").modal('show');
									$("#modal_casedata_captcha").modal('hide');},50 );	
						
									  
										if(flag=='disposed')
												$('#staticBackdropLabel6').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='listed')
												$('#staticBackdropLabel6').html('Cases Listed Today / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='undated')
												$('#staticBackdropLabel6').html('Undated Cases / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='pending')
												$('#staticBackdropLabel6').html('Cases Pending Registration  / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='objection')
												$('#staticBackdropLabel6').html('Cases Under Objection / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='excessive')
												$('#staticBackdropLabel6').html('Excessive Dated Cases (More than 3 Months) / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='prelitigation')
												$('#staticBackdropLabel6').html('Pre-Litigation / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);
										if(flag=='pretrial')
												$('#staticBackdropLabel6').html('Pre-Trial / '+state_name+' / '+dist_name+' / '+est_name+' / '+labelCourt);						   												  					
								}
								else
								{ 
										setTimeout(function(){
											$("#modal_alertcase_data").hide();
											$('#captcha1').val('');
											$("#modal_alertcase_data").modal('hide');
											 $("#modal_casedata_captcha").show();	
											$("#modal_casedata_captcha").modal('show');	
										},50);	
										 
										errorAlert('Invalid Captcha'); 
										$('.modal-backdrop').remove();		 
											document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
											return false; 
								}
						}
                }, 
						 buttons: [ { "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" ><span class="fas fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
								exportOptions: { columns: ':visible'}
						},{"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" ><span class="fas fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
								exportOptions:{ columns: ':visible'}
						},{"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" ><span class="fas fa-file-csv" aria-hidden="true" title="Export to csv"></span> </button>',
								exportOptions:{columns: ':visible'}
						}] 
		  } );
		}

function fetchAlertCasesRecords1(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri,court,judge_name,state)
{
        var url='home/fetchAlertCasesData';
        var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name+'&est_code='+est_code+'&est_name='+est_name+'&court='+court+'&judge_name='+judge_name+'&state='+state;
        ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
                if(flag=='disposed')
                        $('#staticBackdropLabel6').html('Cases Disposed In Last Month(more than 10 years old) / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='listed')
                        $('#staticBackdropLabel6').html('Cases Listed Today / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='undated')
                        $('#staticBackdropLabel6').html('Undated Cases / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='pending')
                        $('#staticBackdropLabel6').html('Cases Pending Registration  / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='objection')
                        $('#staticBackdropLabel6').html('Cases Under Objection / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='excessive')
                        $('#staticBackdropLabel6').html('Excessive Dated Cases (More than 3 Months) / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='prelitigation')
                        $('#staticBackdropLabel6').html('Pre-Litigation / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);
                if(flag=='pretrial')
                        $('#staticBackdropLabel6').html('Pre-Trial / '+state_name+' / '+dist_name+' / '+est_name+' / '+court);

                $('#modal-body-alertcase').html(result.tbl_str);
                //$('#tbl_est').DataTable({                });
				$('#tbl_cases_pending').DataTable({
				 dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
				});
        }
}

function fetchCasesList(state_code,dist_code,ci_cri,val,flag,tab_val)
{
        var url='home/getCasesList';
        var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&dist_code='+dist_code+'&flag='+flag+'&tab_val='+tab_val+'&val='+val;
        ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
        }
}



/*function fetchAlertCasesRecords(flag,ci_cri)
{
	var url='home/fetchAlertCasesData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri;
	var table=$('#tbl_cases').DataTable();
		table.destroy();
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='disposed')
			$('#staticBackdropLabel6').html('Cases Disposed In Last Month(more than 10 years old) ');
		if(flag=='listed')
			$('#staticBackdropLabel6').html('Cases Listed Today  ');
		if(flag=='undated')
			$('#staticBackdropLabel6').html('Undated Cases ');
		if(flag=='pending')
			$('#staticBackdropLabel6').html('Cases Pending Registration  ');
		if(flag=='objection')
			$('#staticBackdropLabel6').html('Cases Under Objection  ');
		if(flag=='excessive')
			$('#staticBackdropLabel6').html('Excessive Dated Cases (More than 3 Months) ');
		if(flag=='prelitigation')
			$('#staticBackdropLabel6').html('Pre-Litigation  ');
		if(flag=='pretrial')
			$('#staticBackdropLabel6').html('Pre-Trial ');
		
		$('#modal-body-alertcase').html(result.tbl_str);
		$('#tbl_cases').DataTable();
	}
}

function fetchCasesList(state_code,dist_code,ci_cri,val,flag,tab_val)
{
	var url='home/getCasesList';
        var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&dist_code='+dist_code+'&flag='+flag+'&tab_val='+tab_val+'&val='+val;
	ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
	}
}*/




		/*------------------*/

/*---------------------*/

/*---------------------*/



/*------------------------*/

		/*----------mgnt start-----*/

function show_dist(report_type)
{
	//alert(state_code);
	
	var state_code=$("#est_state_code").val();
	

	var postdata='state_code='+state_code+"&report_type="+report_type;

	if(state_code=='')
	{
		alert("Please Select State");
		return false;
	}
	
	if(report_type!='')
	{
		var url='information_mgnt/show_dist';
		
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			//alert(result.dist_options);
			$("#est_dist_code").chosen('destroy');
			$("#divOutput").html('');
			$("#est_dist_code").html(result.dist_options);
			$("#est_dist_code").chosen({width:'100%'});
			$("#report_type").chosen({width:'100%'});
			
		}
	} else{ 
		$("#divOutput").html('');
		$("#est_dist_code").val('');
		$("#est_dist_code").html('');
		$("#est_dist_code").trigger("chosen:updated");
			
	}

}

function cleardata()
{
	//alert("in fun");
	$("#divOutput").html('');
	$("#report_type").val('');
	$("#est_dist_code").val('');
	$("#report_type").chosen('destroy');
	$("#est_dist_code").chosen('destroy');
	$("#est_dist_code").chosen({width:'100%'});
	$("#report_type").chosen({width:'100%'});
	
}




function show_data_level2(state_code,state_name)
{

	var url='information_mgnt/show_data_level2';

	$('#moda_body_levelone').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code+'&state_name='+state_name;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.tbl_str);
		//if(result.status)
		{	
			$('#modal_body_levelone').html(result.tbl_str);
			
			//var tbl=$('#statetable').DataTable().destroy();		
			/*$('#statetable').DataTable({
				responsive:true,
				 rowGroup: {
				dataSrc: [1],
			  },
			columnDefs: [{
				targets: [1],
				visible: false
			  }],
				});*/
		}
	}
	
}
function show_judge_data_level2(state_code,state_name)
{

	var url='information_mgnt/show_judge_data_level2';

	//$('#modal_body_levelone').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code+'&state_name='+state_name;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#modal_judge_level_2").html(result.tbl_str);
	}
}

function show_judge_data_level3(state_code,dist_code)
{

	var url='information_mgnt/show_judge_data_level3';

	//$('#modal_body_levelone').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code+'&dist_code='+dist_code;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.tbl_str);
		//if(result.status)
		{	
			$("#modal_judge_level_3").html(result.tbl_str);
		}
	}
	
}

function show_estwise_data(dist_code)
{
	var state_code  = $("#est_state_code").val();
	var report_type = $("#report_type").val();

	var postdata='state_code='+state_code+"&dist_code="+dist_code+"&report_type="+report_type;

	if(state_code=='')
	{
		alert("Please Select State");
		return false;
	}

	if(dist_code=='')
	{
		alert("Please Select District");
		return false;
	}

	if(report_type=='')
	{
		alert("Please Select Report Type");
		return false;
	}

	var url='information_mgnt/show_estwise_data';
	
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.dist_options);
		$("#divOutput").html(result.tbl_str);
		
		
	}
}




function show_dist_trialdata(state_code)
{
	//var state_code=$("#est_state_code").val();
	var url='under_trail/show_dist_trialdata';

	//$('#modal_body_levelone').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.tbl_str);
		//if(result.status)
		{	
			$("#modal-body-dist-trial-data").html(result.tbl_str);
		}
	}
	
}


function show_court_judgeData()
{

	   $.session.set("active_tab",'information management');
        var state_code=$("#state_code").val();
        var dist_code=$("#dist_code").val();
	    //alert(state_code+dist_code);
		$('#divOutput').html('');
		$("#natmast").html('');
        var url='information_mgnt/show_court_judgeData';
        var postdata='';
        if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;

	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

       ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
			//alert(result.tbl_str);
			$("#imtab02").html(result.tbl_str);
		}
} 

/*function show_statewise_national_master(state_code)
{


	$("#natmast_state_code").chosen('destroy');

	var url='information_mgnt/show_statewise_national_master';
	var postdata='';
	if(state_code!='')
	postdata+='&state_code='+state_code;
	if(dist_code!='')
	postdata+='&dist_code='+dist_code;

		requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		alert(result.tbl_str);
		//$("#imtab03").html(result.tbl_str);
		$("#natmast").html(result.tbl_str);
		
	}
}*/

function show_national_mast_data_level2(state_code)
{

	var url='information_mgnt/show_national_mast_data_level2';
	$("#natmast").html('');
	//$('#modal-body-nat-mast-data').html('');
	var postdata=$('#frm').serialize()+"&state_code="+state_code;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.tbl_str);
		//if(result.status)
		{	//alert(result.tbl_str);
			//$("#modal-body-nat-mast-data").html(result.tbl_str);
			$("#natmast").html(result.tbl_str);
		}
	}
	
}

function show_national_master(state_code='')
{
	$.session.set("active_tab",'information management');
	/*var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	//alert(state_code+dist_code);*/
	$('#divOutput').html('');
	$("#natmast_state_code").chosen('destroy');
	$("#est_dist_code").chosen('destroy');

	var url='information_mgnt/show_national_master';
	var postdata='';
	if(state_code!='')
	postdata+='&state_code='+state_code;
	if(dist_code!='')
	postdata+='&dist_code='+dist_code;

	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		//alert(result.state_list);
		$("#imtab03").html(result.tbl_str);
		$("#natmast_state_code").html(result.state_list);
		$('#natmast_state_code').chosen({width:'100%'});
		$('#divOutput').html('');
	}
}

function show_est_data()
{
	$.session.set("active_tab",'information management');
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();

	$("#natmast").html('');

	
	
	var url='information_mgnt/show_est_data';
	var postdata='';
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;

	$("#est_state_code").chosen('destroy');
	$("#est_dist_code").chosen('destroy');
	//$('#report_type').chosen('');
	//$("#report_type").chosen('destroy');

	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		
		$("#est_state_code").html(result.state_list);
		$('#est_state_code').chosen({width:'100%'});
		
	}
	
}

function show_est_trialdata(state_code='') //,
{	
	if(state_code!='')
	{
		$("#underest_dist_code").html('');
	}
	$("#divOutputunder").html("");
	$.session.set("active_tab",'information management');
	
	var state_code=$("#underest_state_code").val();
	var dist_code=$("#underest_dist_code").val();
		
		
	if(	String(state_code).trim()!='' ){

		$("#underest_dist_code").chosen('destroy');
	
		//$("#underest_dist_code").html("");

		
		
		var url='under_trail/show_est_trialdata';
		var postdata='';
		if(state_code!='')
			postdata+='&state_code='+state_code;

		if(dist_code!='')
			postdata+='&dist_code='+dist_code;
		//var postdata=$('#frm').serialize()+"&state_code="+state_code+'&dist_code='+dist_code;
		//alert(postdata);
		//$("#modal_trail_level_3").html('');
		
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			//alert(result.tbl_str);
			//if(result.status)
			{	
				
				$("#underest_dist_code").html(result.dist_code_options);
				$('#underest_dist_code').chosen({width:'100%'});
				$("#divOutputunder").html(result.tbl_str);
				
			}
		}
	} else { 
		$("#underest_dist_code").chosen('destroy');
		$("#underest_dist_code").html("");
		$("#divOutputunder").html("");
	}
}

function show_under_trail()
{
		$("#divOutputunder").html('');
		$("#natmast").html('');
		$("#divOutput").html('');
	 $.session.set("active_tab",'information management');
       // var state_code=$("#state_code").val();
        //var dist_code=$("#dist_code").val();
	    //alert(state_code+dist_code);
			
			$("#underest_state_code").chosen('destroy');
			$("#underest_dist_code").chosen('destroy');
			$("#underest_dist_code").html('');
			
        var url='under_trail/show_under_trail';
        var postdata='';
       /* if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;*/
		
	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');
//alert(postdata);
       ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
			//alert(result.state_list);
			//$("#imtab01")
			$("#imtab05").html(result.tbl_str);
			$("#underest_state_code").html(result.state_list);
			$('#underest_state_code').chosen({width:'100%'});
			
			

		}
}
function show_dist_trialdata()
{
		$("#underest_dist_code").chosen('destroy');
		var state_code=$("#underest_state_code").val();
        var url='under_trail/show_dist_trialdata';
        var postdata='&state_code='+state_code;
       /* if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;*/
		
	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');
//alert(postdata);
       ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
		//	alert(result.dist_code_options);
			//$("#imtab01")
			//$("#imtab05").html(result.tbl_str);
			$("#underest_dist_code").html(result.dist_code_options);
			$('#underest_dist_code').chosen({width:'100%'});
		}

}
function infomgnt_dashboard()
{
		
		//$("#statediv").html();
		$("#statediv").hide();
		$("#sel_year_chosen").hide();
 
        $.session.set("active_tab",'information management');
        var state_code=' ';//$("#state_code").val();
        var dist_code=' ';//$("#dist_code").val();
	   // alert(state_code+dist_code);
        var url='information_mgnt/fetchInfMgtDashboard';
		//var url='home/fetchInfMgtDashboard';
        var postdata='';
        if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;

	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

       ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
			//alert(result.tbl_str);
			$("#imtab01").html(result.tbl_str);
			
		}
}



function infomgnt_dashboard_old()
{
        $.session.set("active_tab",'information management');
        var state_code=$("#state_code").val();
        var dist_code=$("#dist_code").val();
	   // alert(state_code+dist_code);

        //var url='information_mgnt/fetchInfMgtDashboard';
		var url='home/fetchInfMgtDashboard';
        var postdata='';
        if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;

	//	requestUri('information_mgnt/fetchInfMgtDashboard&state_code='+state_code+'&dist_code='+$("#dist_code").val()+'&flag=info');

       ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
			//alert(result.tbl_str);
			//$("#imtab01").html(result.tbl_str);
			//alert(result.courtComplex);
				$("#ctCmplx").html(result.courtComplex);
                $("#ctEst").html(result.courtEst);
                $("#dataNtTransferred").html(result.dataNotTransfer);
                $("#ordersNtUploaded").html(result.orderNotUpdated);
                $("#undtCases").html(result.undtCases);
                $("#exceDated").html(result.exceDated);
                $("#listedToday").html(result.listedToday);
                $("#totalJudiOfficers").html(result.totalJudiOfficers);
                $("#totalCourts").html(result.totalCourts);
                $("#presidingOfficers").html(result.presidingOfficers);
                $("#justisAppUsed").html(result.justisAppUsed);
                $("#bailiffsOnboarded").html(result.bailiffsOnboarded);
                $("#processGenerated").html(result.processGenerated);
                $("#processAllocated").html(result.processAllocated);
                $("#processDelivered").html(result.processDelivered);
                $("#received").html(result.received);
                $("#proceedingsDone").html(result.proceedingsDone);
                $("#contested").html(result.contested);
                $("#paidChallans").html(result.paidChallans);
                $("#amount").html(result.amount);
                $("#establishments").html(result.establishments);
                $("#courtFeeCases").html(result.courtFeeCases);
                $("#courtFeeAmt").html(result.courtFeeAmt);
                $("#fineEstablishments").html(result.fineEstablishments);
                $("#fineCases").html(result.fineCases);
                $("#fineAmt").html(result.fineAmt);
                $("#penaltyEstablishments").html(result.penaltyEstablishments);
                $("#penaltyCases").html(result.penaltyCases);
                $("#penaltyAmt").html(result.penaltyAmt);
                $("#judiDepositeEstablishments").html(result.judiDepositeEstablishments);
                $("#judiDepositeCases").html(result.judiDepositeCases);
                $("#judiDepositeAmt").html(result.judiDepositeAmt);
                $("#estFir").html(result.estFir);
                $("#estChargesheets").html(result.estChargesheets);
                $("#consumedFir").html(result.consumedFir);
                $("#consumedChargesheets").html(result.consumedChargesheets);
                $("#verifiedFir").html(result.verifiedFir);
                $("#verifiedChargesheets").html(result.verifiedChargesheets);
                $("#chrgShtsFir").html(result.chrgShtsFir);
                $("#chrgShtsChrgSht").html(result.chrgShtsChrgSht);
		$("#nwCasesFnlSmtd").html(result.nwCasesFnlSmtd);
                $("#nwCasesCnsmdCIS").html(result.nwCasesCnsmdCIS);
                $("#applFnlSmtd").html(result.applFnlSmtd);
                $("#applCnsmdCIS").html(result.applCnsmdCIS);
                $("#docinNwCases").html(result.docinNwCases);
                $("#docinExistingCases").html(result.docinExistingCases);
                $("#advTtlRegd").html(result.advTtlRegd);
                $("#advVerified").html(result.advVerified);
		$("#undatedCasesPerc").html(result.undatedCasesPerc);
                $("#exceDatedPerc").html(result.exceDatedPerc);
                $("#listedTodayPerc").html(result.listedTodayPerc);
                $("#establishmentsPerc").html(result.establishmentsPerc);
                $("#courtFeeCasesPerc").html(result.courtFeeCasesPerc);
                $("#fineEstablishmentsPerc").html(result.fineEstablishmentsPerc);
                $("#fineCasesPerc").html(result.fineCasesPerc);
                $("#penaltyEstablishmentsPerc").html(result.penaltyEstablishmentsPerc);
                $("#penaltyCasesPerc").html(result.penaltyCasesPerc);
                $("#judiDepositeEstablishmentsPerc").html(result.judiDepositeEstablishmentsPerc);
                $("#judiDepositeCasesPerc").html(result.judiDepositeCasesPerc);
                $("#estChargesheetsPerc").html(result.estChargesheetsPerc);
                $("#consumedChargesheetsPerc").html(result.consumedChargesheetsPerc);
                $("#verifiedChargesheetsPerc").html(result.verifiedChargesheetsPerc);
                $("#chrgShtsChrgShtPerc").html(result.chrgShtsChrgShtPerc);
                $("#nwCasesFnlSmtdPerc").html(result.nwCasesFnlSmtdPerc);
                $("#nwCasesCnsmdCISPerc").html(result.nwCasesCnsmdCISPerc);
                $("#applFnlSmtdPerc").html(result.applFnlSmtdPerc);
                $("#applCnsmdCISPerc").html(result.applCnsmdCISPerc);
                $("#docinNwCasesPerc").html(result.docinNwCasesPerc);
                $("#docinExistingCasesPerc").html(result.docinExistingCasesPerc);
                $("#advTtlRegdPerc").html(result.advTtlRegdPerc);
                $("#advVerifiedPerc").html(result.advVerifiedPerc);
		$("#undatedCasesWidth").width(result.undatedCasesPerc);
                $("#exceDatedWidth").width(result.exceDatedPerc);
                $("#listedTodayWidth").width(result.listedTodayPerc);
                $("#establishmentsWidth").width(result.establishmentsPerc);
                $("#courtFeeCasesWidth").width(result.courtFeeCasesPerc);
                $("#fineEstablishmentsWidth").width(result.fineEstablishmentsPerc);
                $("#fineCasesWidth").width(result.fineCasesPerc);
                $("#penaltyEstablishmentsWidth").width(result.penaltyEstablishmentsPerc);
                $("#penaltyCasesWidth").width(result.penaltyCasesPerc);
                $("#judiDepositeEstablishmentsWidth").width(result.judiDepositeEstablishmentsPerc);
                $("#judiDepositeCasesWidth").width(result.judiDepositeCasesPerc);
                $("#estChargesheetsWidth").width(result.estChargesheetsPerc);
                $("#consumedChargesheetsWidth").width(result.consumedChargesheetsPerc);
                $("#verifiedChargesheetsWidth").width(result.verifiedChargesheetsPerc);
                $("#chrgShtsChrgShtWidth").width(result.chrgShtsChrgShtPerc);
                $("#nwCasesFnlSmtdWidth").width(result.nwCasesFnlSmtdPerc);
                $("#nwCasesCnsmdCISWidth").width(result.nwCasesCnsmdCISPerc);
                $("#applFnlSmtdWidth").width(result.applFnlSmtdPerc);
                $("#applCnsmdCISWidth").width(result.applCnsmdCISPerc);
                $("#docinNwCasesWidth").width(result.docinNwCasesPerc);
                $("#docinExistingCasesWidth").width(result.docinExistingCasesPerc);
                $("#advTtlRegdWidth").width(result.advTtlRegdPerc);
                $("#advVerifiedWidth").width(result.advVerifiedPerc);
				$("#smsSent").html(result.smsSent);
                $("#emailSent").html(result.emailSent);
	}
}

       
	
	
	function fetchAgeWise()
	{
		var age=$('input[name=Agewisebtnradio]:checked').val();
		var state_code=$("#state_code").val();
		var dist_code=$("#dist_code").val();
		var url='home/updateAgeWise';
		var ci_cri=$("#ci_cri").val();
		var case_type=$("#casetype").val();
		var postdata='ci_cri='+ci_cri+'&age='+age;
		if(state_code!='')
			postdata+='&state_code='+state_code;
		if(dist_code!='')
			postdata+='&dist_code='+dist_code;
		if(case_type!='')
			postdata+='&case_type='+case_type;
//alert(postdata)
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			agewiseLineChart(result.year,result.year_count); 
		}
	}
	
	
	function submit_caseType11(control)
	{
		var checked_ids1=[];
		var List1 = [];
		$("#treeview").hummingbird("getChecked",{
		  attr:"id",
		  list: List1,
		  OnlyFinalInstance:true
	});

		$.each(List1, function( index, value ) {
		var get_id=value;
		var get_val=$("#"+get_id).val();
		if(get_val!='on')
		{
			if($("#"+get_id).is(':checked'))
			{		
				checked_ids1.push(get_val);
			}
			else
			{
				checked_ids1 = checked_ids.filter(function(elem){
		   			return elem != get_val; 
				});
			}	
		}					
	});
	var get_id1=control.id;
	var get_val1=control.value;	
	//==== Find the above checbox value into (checked_ids1-[array])  

	if ($.inArray(get_val1, checked_ids1)!='-1') 
	{
    	//alert(name + ' is in the array!');
	} 
	else
	{
    	if($("#"+get_id1).is(':checked'))
		{		
			if(get_val1!='on')   
				checked_ids1.push(get_val1);
		}
		else
		{
			checked_ids1 = checked_ids1.filter(function(elem){
	   			return elem != get_val1; 
			});
		}
	}	

	$("#casetype").val(checked_ids1);
		var ci_cri=$("#ci_cri").val();
		var state_code=$("#state_code").val();
		var dist_code=$("#dist_code").val();
		var url='home/fetchCaseTypeWise';
		//alert(url);
		var postdata='ci_cri='+ci_cri+'&checked_id='+checked_ids1;
		if(state_code!='')
			postdata+='&state_code='+state_code;
		if(dist_code!='')
			postdata+='&dist_code='+dist_code;
		ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{
			if(active_tab=='pending')
				agewiseLineChart(result.year,result.year_count);
			else
				dispPendAgeChart(result.pend_age_year,result.pend_age_cnt,result.year_count);
			stageWiseBarChart(result.purpose_name,result.purpose_count);
			delayReasonBarChart(result.delayName,result.delay_count);
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
		}
	}

/******************************************************/
	function statewise_case_details(state_code_drill,dist_code_drill,ci_cri,active_tab,val,flag,casetypeval,stageReady,monthInsDisp,delayName,caseType_value)
	{  
			var table=$('#tblStatewisecount').DataTable();
			table.destroy();
			var disp_year=$("#sel_year").val();
			var case_type_select=$("#case_type_select").val();
			var delayId =$('#arrdelayId1').val();
			var mattertypeval='';
			//var regCasetype=$("#regCasetype").val();
			var mattertypeval=$("#regCasetype").val();
			 
			if(mattertypeval=='')
					var mattertypeval=$("#case_type_gr").val();

			var case_type=$("#casetype").val();					

			var url='home/fetchPendCaseData';
		var		postdata='ci_cri='+ci_cri+'&active_tab='+active_tab+'&state_code_drill='+state_code_drill+'&dist_code_drill='+dist_code_drill+'&val='+val+'&flag='+flag+'&casetypeval='+casetypeval+'&stageReady='+stageReady+'&monthInsDisp='+monthInsDisp+'&delayName='+delayName+'&caseType_val='+caseType_value+'&delayId='+delayId;
		if(disp_year!='')
					postdata+='&disp_year='+disp_year;
	 
		if(mattertypeval!='')
					postdata+='&mattertypeval='+mattertypeval; 
		/*if(regCasetype!='')
					postdata+='&regCasetype='+regCasetype; */
		if(case_type_select!='')
				postdata+='&case_type_select='+case_type_select;	 

		if(case_type!='')
				postdata+='&case_type='+case_type;

					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
					$('#modal-body-statewise-data').html(result.statetbl);
					//alert(result.pendCaseData);
					  $('#tblStatewisecount').DataTable({dom: 'lrfBtip',
              buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]});
				}
	}

	function distwise_case_details(state_code,dist_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp,delayName,caseType_value)
    {
		var disp_year=$("#sel_year").val();
		var delayId =$('#arrdelayId1').val();
		var case_type_select=$("#case_type_select").val();
		var url='home/fetchPendDistData';
		//var regCasetype=$("#regCasetype").val();

		//if(regCasetype =='')
				//	var mattertypeval=$("#case_type_gr").val();

				var mattertypeval=$("#regCasetype").val();
			 
				if(mattertypeval=='')
						var mattertypeval=$("#case_type_gr").val();
		var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab+'&state_code='+state_code+'&dist_code='+dist_code+'&val='+val+'&flag='+flag+'&casetypeval='+casetypeval+'&monthInsDisp='+monthInsDisp+'&disp_year='+disp_year+'&delayName='+delayName+'&caseType_val='+caseType_value+'&delayId='+delayId;

		if(disp_year!='')
					postdata+='&disp_year='+disp_year;
		if(regCasetype!='')
					postdata+='&regCasetype='+regCasetype;
		if(mattertypeval!='')
					postdata+='&mattertypeval='+mattertypeval; 
		if(case_type_select!='')
					postdata+='&case_type_select='+case_type_select;

                ajaxCall({url:url,postdata:postdata,callback:callback});
                function callback(result)
                {
                $('#modal-body-distwise-data').html(result.statetbl);
                //alert(result.pendCaseData);
                $('#tbldistwisecount').DataTable({dom: 'lrfBtip',
				buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]});
                }
        }

	function estwise_case_details(state_code,dist_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp,delayName,caseType_value)
	{
		var disp_year=$("#sel_year").val();
	//	var regCasetype=$("#regCasetype").val();
		var mattertypeval=$("#regCasetype").val();
			 
			if(mattertypeval=='')
					var mattertypeval=$("#case_type_gr").val();
		var delayId =$('#arrdelayId1').val();
		var case_type_select=$("#case_type_select").val();
		if(regCasetype =='')
					var mattertypeval=$("#case_type_gr").val();
		var url='home/fetchPendEstData';
                var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab+'&state_code='+state_code+'&dist_code='+dist_code+'&val='+val+'&flag='+flag+'&casetypeval='+casetypeval+'&monthInsDisp='+monthInsDisp+'&disp_year='+disp_year+'&delayName='+delayName+'&caseType_val='+caseType_value+'&delayId='+delayId;
				if(disp_year!='')
					postdata+='&disp_year='+disp_year;
		if(regCasetype!='')
					postdata+='&regCasetype='+regCasetype;
		if(mattertypeval!='')
					postdata+='&mattertypeval='+mattertypeval; 
		if(case_type_select!='')
					postdata+='&case_type_select='+case_type_select;

                ajaxCall({url:url,postdata:postdata,callback:callback});
                function callback(result)
                {
                $('#modal-body-estwise-data').html(result.statetbl);
                //alert(result.pendCaseData);
                $('#tblestwisecount').DataTable({dom: 'lrfBtip',
				buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]});
                }
	}


	function fetchCasesListCaptcha(state_code,dist_code,est_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp,delayName,caseType_value)
	{ 
			var url='home/fetchCaseCaptcha';
			var post_data='';
			$("#est_tab").hide();
			ajaxCall({url:url,postdata:post_data,callback:callback});
	 
			function callback(result)
			{  
					 $('#modal-body-case-captcha').html(result.filename);
					  $("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:casewise_case_details(\""+state_code+"\",\""+dist_code+"\",\""+est_code+"\",\""+ci_cri+"\",\""+active_tab+"\",\""+val+"\",\""+flag+"\",\""+casetypeval+"\",\""+monthInsDisp+"\",\""+delayName+"\",\""+caseType_value+"\")\'data-bs-toggle='modal' data-bs-target='#modal_dashcaselist'>" ); 
			}
	}



	function casewise_case_details(state_code,dist_code,est_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp,delayName,caseType_value)
	{  
		//alert(state_code+','+dist_code+','+est_code);
		var url='home/casewiseList';
		//var disp_year=$("#ins_year").val();
		var disp_year=$("#sel_year").val();
		
		var case_type_select=$("#case_type_select").val();
		if(flag!='' && flag!=undefined)
			$("#flag_caselist").val(flag);
		else
			flag=$("#flag_caselist").val();

		if(state_code!='' && state_code!=undefined)
			$("#state_code2").val(state_code);
		else
			state_code=$("#state_code2").val();

		if(dist_code!='' && dist_code!=undefined)
			$("#dist_code2").val(dist_code);
		else
			dist_code=$("#dist_code2").val();
 
 if(est_code!='' && est_code!=undefined)
		$("#txt_est_name").val(est_code);
	else
		est_code=$("#txt_est_name").val(); 

	if(ci_cri!='' && ci_cri!=undefined)
		$("#ci_cri_caselist").val(ci_cri);
	else
		ci_cri=$("#ci_cri_caselist").val();

	if(active_tab!='' && active_tab!=undefined)
		$("#active_tab").val(active_tab);
	else
		active_tab=$("#active_tab").val();

	if(val!='' && val!=undefined)
		$("#val").val(val);
	else
		val=$("#val").val();

	if(casetypeval!='' && casetypeval!=undefined)
		$("#casetypeval").val(casetypeval);
	else
		casetypeval=$("#casetypeval").val();

		var delayId =$('#arrdelayId1').val();
		//var regCasetype=$("#regCasetype").val();
		//if(regCasetype=='')
					var mattertypeval=$("#case_type_gr").val(); 
		var search_by=			$("#sel_search_by1 option:selected").val(); 

	   var captcha_val=$('#captcha1').val();

	var table=$('#tbl_cases_dash').DataTable();
	table.destroy();
		$('#tbl_cases_dash').DataTable({
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/casewiseList",
			 "bAutoWidth": false,
				  //responsive:true,
								  
						   /*   columnDefs: [ {
									targets: [1,2,3],
									visible: false
							  }],*/

			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "est_code", "value": est_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "val", "value": val } );
					aoData.push( { "name": "active_tab", "value": active_tab } );
					aoData.push( { "name": "casetypeval", "value": casetypeval } );
					aoData.push( { "name": "monthInsDisp","value": monthInsDisp });
					aoData.push( { "name": "disp_year","value": disp_year });
					aoData.push( { "name": "search_by", "value": search_by } );
					aoData.push( { "name": "delayId", "value": delayId } );
					aoData.push( { "name": "regCasetype", "value": regCasetype } );
					aoData.push( { "name": "mattertypeval", "value": mattertypeval } );
					aoData.push( { "name": "caseType_value","value": case_type_select });
					aoData.push( { "name": "captcha_val", "value": captcha_val } );
					//aoData.push( { "name": "search_by", "value": get_search_by } );  
					/* Column filter count */
					var postdata='';
					var c=0;
					$.each(aoData, function (k,v) {
							if(c==0)
									 postdata+=v.name+'='+v.value;
							else
									postdata+='&'+v.name+'='+v.value;
							c++;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
					function callback(result)
					{ 
						if(result.msg=='')
						{  
								setTimeout(function(){ 
								$("#modal_dashcaselist").modal('show');	 
								$("#modal_casedata_captcha").modal('hide');
								},100 );	
								
								 fnCallback(result.output);       
								 var table=$('#tbl_cases_dash').DataTable(); 
								 if(active_tab=='disposed')
								{
									if(flag!='dispAgeYear')
									{
										table.columns([8,9]).visible(false);
										table.columns([10,11]).visible(true);
									}
									else
									{
										table.columns([8,9]).visible(true);
										table.columns([10,11]).visible(false);
									}
								}
								else
								{
									table.columns([8,9]).visible(true);
									table.columns([10,11]).visible(false);
								}
						}
						else
						{ 
							setTimeout(function(){
								$("#modal_dashcaselist").hide();
								$('#captcha1').val('');
								$("#modal_dashcaselist").modal('hide');
								 $("#modal_casedata_captcha").show();	
								$("#modal_casedata_captcha").modal('show');	
							},50);								 
							errorAlert('Invalid Captcha!!');
							$('.modal-backdrop').remove();
								document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
								return false; 
						}
					}
				},
				buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<span class="visually-hidden">XLS</span><button class="btn btn-default dgreenBtn  xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<span class="visually-hidden">CSV</span><button class="btn btn-default dgreenBtn blueBtn  csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
		} );		
	}
	/*---------------------*/
function timeToDispositionChart(dispYear,dispCount)
{
	$("#timetodispositionchart").html('');
	dispCount=dispCount.replaceAll('~',',');
	data=JSON.parse("["+dispCount+"]");

	label=dispYear.replaceAll('~',',');
	
	label1=label.replaceAll('#',' '); 
	label1=JSON.parse("["+(label1)+"]");

	
	//alert(total.length);
	var dynamicWidth1='400%'
	if(label1.length > 20)
	{
		dynamicWidth1='400%'
	}
	else 
	{
		dynamicWidth1='100%';
	}

	var dispositionwise1options = {
          series: [{
			   name: "Count",
          data: data
        }],
          chart: {
          type: 'bar',
          height: 250,
		width:dynamicWidth1,
			  toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            borderRadius: 0,
            horizontal: false,
          }
        },
		colors: ['#2D92BD', '#00ff00'],
        dataLabels: {
          enabled: false
        },
        xaxis: {
          categories:label1,
			  		labels: {
			  rotate: -25,
          rotateAlways: true,
          style: {
              colors: [],
              fontSize: '10px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
          },


      },
        },
			  yaxis:{
		  labels: {
          show: true,
			},
		  }
        };
	
	var chart = new ApexCharts(document.querySelector("#timetodispositionchart"), dispositionwise1options);

        chart.render();

}
function dispPendAgeChart(year,pend_count,disposed_count)
{	
		//var pendvsdispchart='';
        year=year.replaceAll('~',',');
        year=JSON.parse("["+year+"]");
        pend_count=pend_count.replaceAll('~',',');
        pend_count=JSON.parse("["+pend_count+"]");
        disposed_count=disposed_count.replaceAll('~',',');
        disposed_count=JSON.parse("["+disposed_count+"]");
	//alert(pend_count+'---'+disposed_count);
	total=JSON.parse("["+pend_count+"]");

        $('#agewise1chart').show();
		$("#agewisechartbtn").hide();
		$("#agewiseTblbtn").show();
        $('#agewisetbl').hide();

	 var dynamicWidth1='200%'
        if(total.length > 10)
        {
                dynamicWidth1='200%'
        }
        else
        {
                dynamicWidth1='100%';
        }
        var pendVsDispoptions = {
         
		series: [
                {
                        name: "Pending",
                        data: pend_count
                },
                {
                        name: "Disposed",
                        data: disposed_count
                }
                ],
                chart: {
                        height: 250,
                        width: dynamicWidth1,
                        type: 'area',
                        dropShadow: {
                        enabled: true,
                        color: '#000',
                        top: 18,
                        left: 7,
                        blur: 10,
                        opacity: 0.2
                        },
                        toolbar: {
                                show: true
                        },
                },
						tooltip: {
						  enabled: true,
						  shared: true,
							},
            //    colors: ['#3e8e7e', '#b85252'],
		colors: ['#009dae', '#a9333a'],
                dataLabels: {
                        enabled: true,
                },
                stroke: {
                        curve: 'smooth',
                        width: 2
                },
		grid: {
                        borderColor: '#e7e7e7',
                        row: {
                                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                                opacity: 0.5
                        }
                },
                markers: {
                        size: 1
                },
                        xaxis: {
                        categories: year,
                        labels: {
                                style: {
                                colors: [],
                                fontSize: '10px',
                                fontFamily: 'Helvetica, Arial, sans-serif',
                                fontWeight: 400,
                                cssClass: 'apexcharts-xaxis-label',
                                }
                        }
                },
                legend: {
                 show: true,
			    position: "top", 
					 horizontalAlign: 'left'

                }
        };

        if(pendvsdispchart==undefined || pendvsdispchart=='')
        {
                $("#agewise1chart").html('');
                pendvsdispchart =  new ApexCharts(document.querySelector("#agewise1chart"), pendVsDispoptions);
                 pendvsdispchart.render();
        }
        else
        { $("#agewise1chart").html('');
                pendvsdispchart.updateOptions(pendVsDispoptions);
        }
}
/*-------------- Pre-Trial / Pre-litigation Chart ---------------------------------------------------*/
function preTrialLitigationChart(pre_civ,pre_cri,pre_tot,pre_tot_morethan1yr)
{	
	//var per_civ = pre_civ*100/pre_tot;
	var per3=0;
	if(pre_tot>0)
	 per3 = pre_tot_morethan1yr*100/pre_tot;
	/*var optionsPre = {
        series: [pre_civ,pre_cri], 
		labels: ["Civil", "Criminal"],
	chart: { 
	  width:230,
          type: 'donut',
        },
        plotOptions: {
          pie: {
            startAngle: -90,
            endAngle: 90,
            offsetY: -10
          }
        },
        grid: {
          padding: {
            bottom:-125
          }
        },
        dataLabels: {
            enabled: true,
        },
	colors: ['#009dae', '#F76C82'],
	 legend: {
              position: 'top'
            },


        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'top'
            }
          }
        }]
        };

        var chartPre = new ApexCharts(document.querySelector("#chartPreLit"), optionsPre);
        chartPre.render();*/
		/*-------------------------civil cases pie chart--------------------*/
        // var per3 = pre_civ*100/pre_civ;

	 var chart3options = {
          series: [per3.toFixed(2)],
          chart: {
          type: 'radialBar',
          offsetY: -10,
          sparkline: {
            enabled: true
          }
        },
			colors:['#F76C82'],
        plotOptions: {
          radialBar: {
            startAngle: -90,
            endAngle: 90,
            track: {
              background: "#e7e7e7",
              strokeWidth: '97%',
              margin: 5, // margin is in pixels
              dropShadow: {
                enabled: true,
                top: 2,
                left: 0,
                color: '#999',
                opacity: 1,
                blur: 2
              }
            },
            dataLabels: {
              name: {
                show: true
              },
              value: {
                offsetY: -40,
                fontSize: '16px'
              }
            }
          }
        },
        grid: {
          padding: {
            top: 0
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 53, 91]
          },
        },
        labels: ['> 1 Year old'],
		subtitle: {
			text: ['More Than 1 Year Old: '+pre_tot_morethan1yr],
			align: 'center',
			margin: 5,
			offsetX: 0,
			offsetY: 10,
			floating: true,
				style: {
				  fontSize:  '16px',
				  fontWeight:  'bold',
				  fontFamily:  undefined,
				  color:  '#EAA531'
				},
		}
        };

        var chart3 = new ApexCharts(document.querySelector("#chartPreLit"), chart3options);
        chart3.render();


}



/*  ---------------------------------------------------------------------  */
function gridview(id)
{
        var table=$('#example'+id).DataTable();
        table.destroy();
        $('#example'+id).dataTable({
                        dom: 'lrfBtip',
                         buttons: [
                {
                        "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: {
                    columns: ':visible'
                }
                },
                {
                        "extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                        }
                },
                {
                        "extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{
                        columns: ':visible'
                    }
                }]
        });
}

function fetchYearData(tot,val)
{
        //$("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},'fast');
        get_cases_type=val;

        var url='home/fetchYearData';
        var post_data='tot='+tot+'&val='+val;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#year_tab').show();
        $('#cur_tab').hide();
	$('#Cases_data').hide();
//	$('#pills-delayDash').hide();
//	$('#pills-alerts').hide();
//setTimeout(function(){$("#Cases_data").hide()},500);	 
//        ajaxCall(url,post_data,callbk);
		//$('#modal-body-year').html('');
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $('#modal-body-year').html(result.reportrow);
				$('#staticBackdropLabelYear').html(result.label);
				gridview('_year');

      //   $('#example_year').DataTable();
        }
}

function fetchData(label,tot,val,year)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        $('#get_year').val(year);
        var url='home/fetchStatewiseData';
		const btn = document.getElementById("yearBtn");

		if (flag === 'ins' || flag === 'disp' || flag === 'citizen' || flag === 'women' || flag === 'delay') 
		{ 
			document.getElementById("yearBtn").removeAttribute("data-bs-toggle");
			document.getElementById("yearBtn").removeAttribute("data-bs-target");
		}
		else
		{ 
			document.getElementById("yearBtn").setAttribute("data-bs-toggle", "modal");
			document.getElementById("yearBtn").setAttribute("data-bs-target", "#modal_year_data");
		}

        var post_data='total='+tot+'&val='+val+'&year='+year+'&label='+label;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#state_tab').show();
        $('#year_tab').hide();
        //ajaxCall(url,post_data,callbk);
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        { 
                $('#modal-body-state').html(result.reportrow);
				$('#staticBackdropState').html(result.lab);
				//$('#example_state').DataTable();
                gridview('_state');
        }
//alert(post_data);
}

function fetchDistRecords1(label,state_code,state_name,ci_cri,col_name,)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');

        $("#txt_state_name").val(state_name);
        $("#txt_state_code").val(state_code);
        $("#txt_col_name").val(col_name);
        var year=$("#get_year").val();
        var url='home/fetchDistrictwiseData';
        var post_data='state_name='+state_name+'&ci_cri='+ci_cri+'&col_name='+col_name+'&year='+year+'&label='+label;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
//alert(post_data);

        $('#dist_tab').show();
        $('#state_tab').hide();
        //ajaxCall(url,post_data,callbk);
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $('#modal-body-dist').html(result.reportrow);
				$('#staticBackdropLabel2').html(result.lab);
				$('#example_dist').DataTable();                 
        }
}

function fetchEstRecords1(label,dist_code,dist_name,ci_cri,col_name)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');

        var get_state_name=$("#txt_state_name").val();
        $("#txt_dist_name").val(dist_name);
        $("#txt_dist_code").val(dist_code);
        var year=$("#get_year").val();
        var url='home/fetchEst';
        var post_data='dist_name='+dist_name+'&get_state_name='+get_state_name+'&ci_cri='+ci_cri+'&col_name='+col_name+'&year='+year+'&label='+label;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#est_tab').show();
        $('#dist_tab').hide();
//        ajaxCall(url,post_data,callbk);

	ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $('#modal-body-est').html(result.reportrow);
				$('#staticBackdropLabel3').html(result.lab);
				$('#example_est').DataTable();
               
        }
}

function fetchCasesCaptcha(label,est_code,ci_cri,col_name)
{ 
        var url='home/fetchCaseCaptcha';
        var post_data='';
        $("#est_tab").hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
 
        function callback(result)
        {  
				 $('#modal-body-case-captcha').html(result.filename);
                  $("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:fetchCases(\""+label+"\",\""+est_code+"\",\""+ci_cri+"\",\""+col_name+"\")\'data-bs-toggle='modal' data-bs-target='#modal_case_data'>" );

				//  $reportrow.="<td><a href='#' onclick=\"javascript:fetchCasesCaptcha('$lab','$est','$this->ci_cri','$this->col_name')\"; data-bs-toggle='modal' data-bs-target='#modal_casedata_captcha'>".$doc_count."</td>";
//<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick='fetchCases(\""+label+"\",\""+est_code+"\",\""+ci_cri+"\",\""+col_name+"\");'>");
        }
}


function fetchCases(label,est_code,ci_cri,col_name)
{ 
        $("#modal_case_data").modal('show');
         $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},
        'fast');
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        var year=$("#get_year").val(); 
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val(); 
        $('#get_case_div').val('cases_tab1');
        var captcha_val=$('#captcha1').val();
		var search_by=$("#sel_search_by option:selected").val();
	
		if(getState!='' && getState!=undefined)
			$("#state_code2").val(getState);
		else
			getState=$("#state_code2").val();

		if(getDist!='' && getDist!=undefined)
			$("#dist_code2").val(getDist);
		else
			getDist=$("#dist_code2").val();
 
		if(est_code!='' && est_code!=undefined)
			$("#txt_est_name").val(est_code);
		else
			est_code=$("#txt_est_name").val();  
	 
		if(ci_cri!='' && ci_cri!=undefined)
			$("#ci_cri_caselist").val(ci_cri);
		else
			ci_cri=$("#ci_cri_caselist").val();

		if(active_tab!='' && active_tab!=undefined)
			$("#active_tab").val(active_tab);
		else
			active_tab=$("#active_tab").val();

		if(col_name!='' && col_name!=undefined)
			$("#col_name").val(col_name);
		else
			col_name=$("#col_name").val();

		if(label!='' && label!=undefined)
			$("#label").val(label);
		else
			label=$("#label").val();

		url = 'home/fetchCases',
        $('#est_tab').hide();
                var table=$('#tbl_cases').DataTable();
        table.destroy();
		
		$('#tbl_cases').DataTable( {
                        dom: 'lrfBtip',
                        "pagingType": "full",
                        "paging": true,
                        "lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
                        "bProcessing": true,
                        "bServerSide": true,
                        "sAjaxSource": "home/fetchCases",
                         "bAutoWidth": false,
                        fnServerData: function ( sSource, aoData, fnCallback ) {
                                        aoData.push( { "name": "year", "value": year } );
                                        aoData.push( { "name": "est_code", "value": est_code } );
                                        aoData.push( { "name": "get_dist_name", "value": get_dist_name } );
                                        aoData.push( { "name": "get_state_name", "value": get_state_name } );
                                        aoData.push( { "name": "ci_cri", "value": ci_cri } );
                                        aoData.push( { "name": "col_name", "value": col_name } );
                                        aoData.push( { "name": "label", "value": label } );
                                        aoData.push( { "name": "stateCode", "value": getState } );
                                        aoData.push( { "name": "distCode", "value": getDist } );
                                        aoData.push( { "name": "captcha_val", "value": captcha_val } );
										aoData.push( { "name": "search_by", "value": search_by } );


                                           /* Column filter count */
                                        var postdata='';
                                        var c=0;
										$.each(aoData, function (k,v) {
												if(c==0)
														 postdata+=v.name+'='+v.value;
												else
														postdata+='&'+v.name+'='+v.value;
												c++;
										});
  
					ajaxCall({url:url,postdata:postdata,callback:callback});
//					ajaxCall(sSource,postdata,callback);

                                        function callback(result)
                                        { 
                                                if(result.msg=='')
                                                {   
													setTimeout(function(){
													//$("#modal_case_data").show();	
													$("#modal_case_data").modal('show');	
													//$("#modal_casedata_captcha").hide();
													$("#modal_casedata_captcha").modal('hide');
													},50);	
										
                                                   fnCallback(result.output);
												   $('#staticBackdropLabel4').html(result.lab);											   												  
													 
                                                }
                                                else
                                                { 
													setTimeout(function(){
														$("#modal_case_data").hide();
														//$("#modal_casedata_captcha").show();	
														$("#modal_casedata_captcha").modal('show');	
													},50);	
													$("#modal_casedata_captcha").show();
													errorAlert('Invalid Captcha');
													$("#modal_case_data").hide();	
													$('.modal-backdrop').remove();													
																								
                                                        document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
                                                        return false;
                                                       
                                                }
                                        }
				},
                   buttons: [
                { "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: { columns: ':visible' }
                },
                {"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{columns: ':visible'}
                },
                {"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{ columns: ':visible' }
                }]
  } );

}
 

function fetch_case_details(get_type,val)
{
         
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},  'fast');
        get_cases_type=val;

        var url='home/fetchCaseDetails';
        var post_data='get_type='+get_type+'&val='+val;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $("#txt_get_lbl_type").val(get_type);
        $('#caseDetails_tab').show();
        $('#cur_tab').hide();
		$('#Cases_data').hide();

        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $("#caseDetails_tab").html(result.reportrow);
                gridview('_caseDetails');
        }
}

function stateWise_case_det(label,get_type,val)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_stateWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var post_data='get_pendency_type='+get_pendency_type+'&case_type='+get_type+'&val='+val+'&label='+label;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $("#txt_case_name").val(get_type);
        $('#stateWise_caseDetails_tab').show();
        $('#caseDetails_tab').hide();
		ajaxCall({url:url,postdata:post_data,callback:callback});

        function callback(result)
        {
                $("#stateWise_caseDetails_tab").html(result.reportrow);
                gridview('_stateWise_caseDetails');
        }
}


function distWise_case_det(label,state_code,get_type,val)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_distWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        $("#txt_state_name").val(get_type);
        $("#txt_state_code").val(state_code);
        var post_data='get_pendency_type='+get_pendency_type+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#distWise_caseDetails_tab').show();
        $('#stateWise_caseDetails_tab').hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $("#distWise_caseDetails_tab").html(result.reportrow);
                gridview('_distWise_caseDetails');
        }
}

function estCodeWise_case_det(label,dist_code,get_type,val)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_estCodeWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        $("#txt_dist_name").val(get_type);
        $("#txt_dist_code").val(dist_code);
        var post_data='get_pendency_type='+get_pendency_type+'&get_state_name='+get_state_name+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label;

        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#estCodeWise_caseDetails_tab').show();
        $('#distWise_caseDetails_tab').hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $("#estCodeWise_caseDetails_tab").html(result.reportrow);
                gridview('_estCodeWise_caseDetails');
        }
}


function regYearWise_case_det(label,get_type,val,est_name)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_regYearWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        $("#txt_est_name").val(get_type);
        var post_data='get_pendency_type='+get_pendency_type+'&get_dist_name='+get_dist_name+'&get_state_name='+get_state_name+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label+'&est_name='+est_name;
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        if(getState!="")
        {
                post_data+="&stateCode="+getState;
        }
        if(getDist!="")
        {
                post_data+="&distCode="+getDist;
        }
        $('#regYearWise_caseDetails_tab').show();
        $('#get_case_div').val('regYearWise_caseDetails_tab');

        $('#estCodeWise_caseDetails_tab').hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                $("#regYearWise_caseDetails_tab").html(result.reportrow);
                gridview('_regYearWise_caseDetails');
        }
}


function regno_Wise_case_det(label,get_type,val,case_val)
{
  $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},'fast');
        get_cases_type=val;
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        var est_code=$("#txt_est_name").val();
        $('#regno_Wise_caseDetails_tab').show();
        $('#get_case_div').val('regno_Wise_caseDetails_tab');
        $('#regYearWise_caseDetails_tab').hide();
	var url='home/fetch_regno_WiseCaseDetails';

        var table=$('#example_regnoWise_caseDetails').DataTable();
        table.destroy();
        $('#example_regnoWise_caseDetails').DataTable( {
                dom: 'lrfBtip',
                "pagingType": "full",
                "paging": true,
                "lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
                "bProcessing": true,
                "bServerSide": true,
                "sAjaxSource": "home/fetch_regno_WiseCaseDetails",
                 "bAutoWidth": false,
                 fnServerData: function ( sSource, aoData, fnCallback ) {
                        aoData.push( { "name": "get_pendency_type", "value": get_pendency_type } );
                        aoData.push( { "name": "est_code", "value": est_code } );
                        aoData.push( { "name": "get_dist_name", "value": get_dist_name } );
                        aoData.push( { "name": "get_state_name", "value": get_state_name } );
                        aoData.push( { "name": "get_case_name", "value": get_case_name } );
                        aoData.push( { "name": "get_type", "value": get_type } );
                        aoData.push( { "name": "label", "value": label } );
                        aoData.push( { "name": "val", "value": val } );
                        aoData.push( { "name": "case_val", "value": case_val } );

                                /* Column filter count */
                                var postdata='';
                                var c=0;
								$.each(aoData, function (k,v) {
										if(c==0)
												 postdata+=v.name+'='+v.value;
										else
												postdata+='&'+v.name+'='+v.value;
										c++;
								});
//alert(postdata);
                            //    ajaxCall(sSource,postdata,fnCallback1);
                                ajaxCall({url:url,postdata:postdata,callback:callback});
                                function callback(result)
                                {
									//alert(result.output);
                                         fnCallback(result.output);
                                }
        },
 buttons: [
                { "extend": 'pdf',"title":"Report", "text":'<span class="visually-hidden">PDF</span><button class="btn btn-default dgreenBtn pdf_btn" aria-label="Export to pdf"><span class="fa fa-file-pdf" aria-hidden="true" title="Export to pdf" ></span> </button>',
                        exportOptions: { columns: ':visible' }
                },
                {"extend": 'excel', "title":"Report", "text":'<button class="btn btn-default dgreenBtn xls_btn" aria-label="Export to xls"><span class="fa fa-file-excel" aria-hidden="true" title="Export to xls"></span> </button>',
                        exportOptions:{columns: ':visible'}
                },
                {"extend": 'csv', "title":"Report", "text":'<button class="btn btn-default dgreenBtn blueBtn csv_btn" aria-label="Export to csv"><span class="fa fa-file-excel" aria-hidden="true" title="Export to csv"></span> </button>',
                        exportOptions:{ columns: ':visible' }
                }]
  } );
}


function fetch_case_details_captcha(casetype,casenum,caseyear,case_no,cino,court_no,jocode,state,dist,court_code,flag,get_cases_type)
{
 
      // alert(flag);
        var div_id=$('#get_case_div').val();
        $("#"+div_id).hide();
        $("#case_history_captcha").show();
	$("#cases_tab1").hide();
	$("#regno_Wise_caseDetails_tab").hide();

        $('#iframe_back').show();
        var set_case_type="both";
        if(get_cases_type==2)
        {
                set_case_type="CI";
        }
        else if(get_cases_type==3)
        {
                set_case_type="CRI";
        }

  
	
		var url='o_civil_case_history_es/index';
 
      var postdata="state="+state+"&dist_code="+dist+"&court_code="+court_code+"&case_number="+case_no+"&type="+set_case_type+"&objection1=totalpending_cases&court_no="+court_no+"&jocode="+jocode+"&cino="+cino+"&flag="+flag+"&disposed_case=N";
       
                //var postdata='state='+state+'&dist_code='+dist_code+'&court_code='+court_code+'&case_number='+case_no+'&type='+type+'&objection1='+objection1+'&matchtotal=13145&frmAction=modify&court_no='+court_no+'&jocode='+jocode+'&cino='+cino+'&disposed_case='+disposed_case;
				
		ajaxCall({url:url,postdata:postdata,callback:callback});
        $('#modal-body-history').html('');
        function callback(result)
        {
				//create initial sum
				
				$('#case_history_captcha1').show();
                $('#case_history_captcha1').html(result.tbl_str);				
                $('#div_captcha_cnr').html(result.div_captcha);
        }
 
}

function fetchAlertHistory(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,type,court_code,jocode,cino,disposed_case,case_no,court_no,searchflag)
{
	//alert(court_code);
	 if(flag=='disposed')
		objection1="lastmonth10yesrdisposal";
	else if(flag=='listed')
		objection1="listtoday";
	else if(flag=='undated')
		objection1="undated_cases";
	else if(flag=='pending')
		objection1="unregistered_cases";
	else if(flag=='excessive')
		objection1="excessive_cases";
	else if(flag=='prelitigation')
		objection1="pre_litig";
	else if(flag=='pretrial')
		objection1="pre_trial"; 
	else
		objection1 ='';

	var fcaptcha = $("#captcha_code").val(); 
	$("#flag_add").val(searchflag); 

	$('#case_history').html('');
	$('#modal-body-history').html('');
	var url='o_civil_case_history_es/showHistory';
	var postdata='state='+state_code+'&dist_code='+dist_code+'&court_code='+court_code+'&case_number='+case_no+'&type='+type+'&objection1='+objection1+'&court_no='+court_no+'&jocode='+jocode+'&cino='+cino+'&disposed_case='+disposed_case+"&captcha="+fcaptcha+"&flagadd="+searchflag;
	 
	 ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {  
			if(result.status==false)
			{ 	 
				$('#modal_captcha_data1').modal('show');
				$('#modal-body-history1').html(result.tbl_str);
				$('#div_captcha_cnr1').html(result.div_captcha);
				
			} else {

				 $('#modal_captcha_data').modal('show');
				//$('#modal_captcha_data').show();				
				$('#modal-body-history').html('');				
				$('#modal-body-history').html(result.tbl_str);
				$('#case_history').html(result.tbl_str);
				/*if(flag=='listed' || flag=='undated' || flag=='excessive')
				{
					$("#history_back").hide();
					$("#history_back1").show();
				}
				else
				{
					$("#history_back").show();
					$("#history_back1").hide();
				}*/				
			}
			
		}

 
}

function show_business(flag1,court_code,dist_code,n_dt,case_number,state_code,businessStatus,todays_date1,court_no,judge_code,flag,cino)
{
	//alert("in fun");return false;
	if(flag=='disposed')
		 objection1="lastmonth10yesrdisposal";
	else if(flag=='listed')
		objection1="listtoday";
	else if(flag=='undated')
		objection1="undated_cases";
	else if(flag=='pending')
		objection1="unregistered_cases";
	else if(flag=='excessive')
		objection1="excessive_cases";
	else if(flag=='prelitigation')
		objection1="pre_litig";
	else if(flag=='pretrial')
		objection1="pre_trial";

   var url='o_civil_case_history_es/viewbusiness';
   var postdata='state_code='+state_code+'&dist_code='+dist_code+'&court_code='+court_code+'&case_number='+case_number+'&businessStatus='+businessStatus+'&objection1='+objection1+'&court_no='+court_no+'&todays_date1='+todays_date1+'&judge_code='+judge_code+'&nextdate1='+n_dt+'&cino='+cino; 

	//alert(postdata); 
	ajaxCall({url:url,postdata:postdata,callback:callback});
	
	function callback(result)
	{
		//alert(result.tbl_str);
		//$('#modal_history').show();
		$('#modal-body-business').html(result.tbl_str);
	}

}

function displayPdf(normal_v,case_num,court_code,ofilename,appFlag)
{
	
	var url='o_civil_case_history_es/display_pdf';
	var postdata="&normal_v="+normal_v+"&case_val="+case_num+"&court_code="+court_code+"&filename="+ofilename+"&appFlag="+appFlag;
	//alert(postdata);
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callbk});
	function callbk(result)
	{
		if(result.status)
		{
			$("#modal_order_body").show().html(result.order);
			var myModal = new bootstrap.Modal($('#modalOders'), {
				backdrop: "static", //remove ability to close modal with click
				keyboard: false, //remove option to close with keyboard
				show: true //Display loader!
			});
			myModal.toggle();
		}
	}
}			

function back_data(val)
{
       $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},'fast'); 

        if(val==1)
        {
                //$('#pills-alerts').show();
				$('#Cases_data').show();
                $('#caseDetails_tab').hide();
        }
        else if(val==2)
        {
                $('#caseDetails_tab').show();
                $('#stateWise_caseDetails_tab').hide();
        }
        else if(val==3)
        {
                $('#distWise_caseDetails_tab').hide();
                $('#stateWise_caseDetails_tab').show();
        }
        else if(val==4)
        {
                $('#estCodeWise_caseDetails_tab').hide();
                $('#distWise_caseDetails_tab').show();
        }
        else if(val==5)
        {
                $('#regYearWise_caseDetails_tab').hide();
                $('#estCodeWise_caseDetails_tab').show();
        }
        else if(val==6)
        {
                $('#regno_Wise_caseDetails_tab').hide();
                $('#regYearWise_caseDetails_tab').show();
        }
        else if(val==7)
        {
                $('#cur_tab').show();
                $('#citizen_stateDetails_tab').hide();
        }

}

function pendingAgewiseBarChart(label,civilCount,criminalCount,id,percentageCount)
{      
	 civilCount=civilCount.replaceAll('~',',');
	 civ_cnt=JSON.parse("["+civilCount+"]");
	
	criminalCount=criminalCount.replaceAll('~',',');
	 cri_cnt=JSON.parse("["+criminalCount+"]");

	 percentageCount=percentageCount.replaceAll('~',',');
	 percentageCount=percentageCount.replaceAll('#',' ');
	 per_cnt=JSON.parse("["+percentageCount+"]");
	//console.dir(per_cnt);
        var options = {
        series: [
		{
          name: 'Civil',
          data: civ_cnt
		}, 
		{
          name: 'Criminal',
          data: cri_cnt
        } ],
		dataLabels: {
  style: {
    colors: ['#000', '#000']
  }
},
          chart: {
          type: 'bar',
          height: 450,
		  width:400,
          stacked: true,
	      stackType: "100%",
		  toolbar: {
            show: false
          }
        },	
		colors:["#B692C2","#50B498"],
        plotOptions: {
          bar: {
            horizontal: true,
            dataLabels: {
              total: {
                enabled: true,
                offsetX: 0,
                style: {
                  fontSize: '13px',
                  fontWeight: 900,
				  color:'#000'
                }
              }
            }
          },
        },
        stroke: {
          width: 2,
          colors: ['#fff']
        },        
        xaxis: {
          categories: [['Less than ','one Year ',per_cnt[0]],['1 to 3 Years',per_cnt[1]],['3 to 5 Years',per_cnt[2]],['5 to 10','Years'+per_cnt[3]],['Above 10','Years '+per_cnt[4]]],
           labels: {
				 maxWidth: 360,
				 width:300,
          style: {      
              fontSize: '13px',   //  increase font size here
              fontWeight: 400,
              cssClass: 'apexcharts-xaxis-label',
			 
          },
				 
			},

    axisBorder: {
      show: true
    },
    axisTicks: {
      show: true
    }
        },
        yaxis: {
          title: {
            text: undefined
          },
				 labels: {
          style: {      
              fontSize: '12px',   //  increase font size here
              fontWeight: 900,
              cssClass: 'apexcharts-xaxis-label',
          },},
        },
       
        fill: {
          opacity: 1
        },
        legend: {
         show: true,
			position: 'top'
        },
		itemMargin: {
		  horizontal: 5,
		  vertical: 0
      }
        };

        var chart = new ApexCharts(document.querySelector("#agewisePendchart"), options);
        chart.render();
      
}

function back(val)
{  
        if(val==1)
        {
                $('#state_report_body').html('');
                $('#year_tab').show();
                $('#state_tab').hide();
        }
        else if(val==2)
        {
                $('#dist_report_body').html('');
                $('#state_tab').show();
                $('#dist_tab').hide();
        }
        else if(val==3)
        {
                $('#est_tab').hide();
                $('#state_tab').hide();
                $('#cur_tab').hide();
                $('#dist_tab').show();
        }
        else if(val==4)
        {
                $('#est_tab').show();
                $('#cases_tab1').hide();
                $('#state_tab').hide();
                $('#cur_tab').hide();
                $('#dist_tab').hide();
        }
        else if(val==5)
        {
                $('#cur_tab').show();
		$('#Cases_data').show();
                $('#year_tab').hide();
        }
        else if(val==6)
        {
                $('#case_history_captcha').hide();
                $('#iframe_back').hide();
                var div_id=$('#get_case_div').val();
                $('#'+div_id).show();
        }
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},
        'fast');

}

function back_modal()
{
	var flag = $("#flag_add").val();
	//alert(flag);
	if(flag=='ins' || flag=='disp' || flag=='women' || flag=='citizen')
	{

		 $('#modal_captcha_data').hide();
		 $('#modal_captcha_data').modal('hide');

		 $('#modal_case_data1').show();
		 $('#modal_case_data1').modal('show');

	}
	else if(flag=='listed' || flag=='undated' || flag=='excessive')
	{
		
		 $('#modal_captcha_data').hide();
		 $('#modal_captcha_data').modal('hide');

		 $('#modal_alertcase_data').show();
		 $('#modal_alertcase_data').modal('show');

	}
}


// Indian Number Format Function
function moneyFormatIndia(num) {
    num = num.toString();

    let afterPoint = '';
    
    // Decimal handle karne ke liye
    if (num.indexOf('.') > 0) {
        afterPoint = num.substring(num.indexOf('.'), num.length);
    }

    num = Math.floor(num).toString();

    if (num.length > 3) {
        let lastThree = num.substring(num.length - 3);
        let otherNumbers = num.substring(0, num.length - 3);

        if (otherNumbers !== '') {
            lastThree = ',' + lastThree;
        }

        return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + afterPoint;
    } else {
        return num + afterPoint;
    }
}

function get_details()
{
	var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var fromDate=$("#fromDate").val();
	var toDate=$("#toDate").val();
	var url='home/getDisposalDetails';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&fromDate='+fromDate+'&toDate='+toDate;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;

	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#ins_last_week").html(result.ins_last_week);
		$("#disp_last_week").html(result.disp_last_week);
		$("#per_last_week").html(result.per_last_week);
		$("#ins_last_month").html(result.ins_last_month);
		$("#disp_last_month").html(result.disp_last_month);
		$("#per_last_month").html(result.per_last_month);
		$("#ins_this_year").html(result.ins_this_year);
		$("#disp_this_year").html(result.disp_this_year);
		$("#per_this_year").html(result.per_this_year);
		$("#ins_last_year").html(result.ins_last_year);
		$("#disp_last_year").html(result.disp_last_year);
		$("#per_last_year").html(result.per_last_year);


		$("#phy_efile_last_week").html(result.phy_efile_last_week);
		$("#efile_last_week").html(result.efile_last_week);
		$("#efile_per_last_week").html(result.efile_per_last_week);
		$("#phy_efile_last_month").html(result.phy_efile_last_month);
		$("#efile_last_month").html(result.efile_last_month);
		$("#efile_per_last_month").html(result.efile_per_last_month);
		$("#phy_efile_this_year").html(result.phy_efile_this_year);
		$("#efile_this_year").html(result.efile_this_year);
		$("#efile_per_this_year").html(result.efile_per_this_year);
		$("#phy_efile_last_year").html(result.phy_efile_last_year);
		$("#efile_last_year").html(result.efile_last_year);
		$("#efile_per_last_year").html(result.efile_per_last_year);

		$("#con_last_week").html(result.con_last_week);
		$("#uncon_last_week").html(result.uncon_last_week);
		$("#con_last_month").html(result.con_last_month);
		$("#uncon_last_month").html(result.uncon_last_month);
		$("#con_last_year").html(result.con_last_year);
		$("#uncon_last_year").html(result.uncon_last_year);
		$("#con_this_year").html(result.con_this_year);
		$("#uncon_this_year").html(result.uncon_this_year);
		$("#tot_con").html(result.tot_con);
		$("#tot_uncon").html(result.tot_uncon);


$("#week_under_1").html(result.week_under_1);
$("#week_1_to_5").html(result.week_1_to_5);
$("#week_over_5").html(result.week_over_5);

$("#month_under_1").html(result.month_under_1);
$("#month_1_to_5").html(result.month_1_to_5);
$("#month_over_5").html(result.month_over_5);

$("#this_yr_under_1").html(result.this_yr_under_1);
$("#this_yr_1_to_5").html(result.this_yr_1_to_5);
$("#this_yr_over_5").html(result.this_yr_over_5);

$("#last_yr_under_1").html(result.last_yr_under_1);
$("#last_yr_1_to_5").html(result.last_yr_1_to_5);
$("#last_yr_over_5").html(result.last_yr_over_5);

$("#tot_under_1").html("<strong>" + result.tot_under_1 + "</strong>");
$("#tot_1_to_5").html("<strong>" + result.tot_1_to_5 + "</strong>");
$("#tot_over_5").html("<strong>" + result.tot_over_5 + "</strong>");


	}
}

/*function getStatewiseDisp(flag,val)
{
	var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var fromDate=$("#fromDate").val();
	var toDate=$("#toDate").val();
	var url='home/getStatewiseDisposal';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&fromDate='+fromDate+'&toDate='+toDate+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#StateDisposalModal_body").html(result.reportrow);
		gridview('_state');
		
	}
}*/
function getStatewiseDisp(flag,val)
{
	$("#StateDisposalModal_body").html('');
	var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var url='home/getStatewiseDisposal';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#StateDisposalModal_body").html(result.reportrow);
		gridview('_state');
		
	}
}

function fetchDistwiseDisp(flag,val,state_code,state_name)
{
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var url='home/getDistwiseDisposal';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#DistrictDisposalModal_body").html(result.reportrow);
		gridview('_dist');
		
	}
}
function fetchEstwiseDisp(flag,val,state_code,dist_code)
{
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var url='home/getEstwiseDisposal';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#EstablishmentDisposalModal_body").html(result.reportrow);
		gridview('_est');
		
	}
}
function fetchcasewiseDisp(flag,val,state_code,dist_code,est_code)
{
	var url='home/casewiseListDisposal';
	var ci_cri=$("#ci_cri_disp").val();
	var table=$('#tbl_cases').DataTable();
		table.destroy();
		var table=$('#tbl_cases_disposal').DataTable();
		table.destroy();
		$('#tbl_cases_disposal').DataTable({
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/casewiseListDisposal",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "val", "value": val } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "est_code", "value": est_code } );
					/* Column filter count */
					var postdata='';
					  var c=0;
                        $.each(aoData, function (k,v) {
                                if(c==0)
                                         postdata+=v.name+'='+v.value;
                                else
                                        postdata+='&'+v.name+'='+v.value;
                                c++;
                        });
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
					
					}
		}	
  } );
}


function getStatewiseAgeWiseDisp(flag,val)
{
	var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	$("#StateDisposalModal_body").html('');
	var url='home/getStatewiseAgeWiseDisp';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#StateDisposalModal_body").html(result.reportrow);
		gridview('_state_agewise');
		
	}
}

function getDistwiseAgeWiseDisp(flag,state_code)
{
	if(state_code=='' || state_code=='undefined')
		var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var url='home/getDistwiseAgeWiseDisp';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#DistrictDisposalModal_body").html(result.reportrow);
		gridview('_dist_agewise');
		
	}
}
function getEstwiseAgeWiseDisp(flag,state_code,dist_code)
{
	
	if(state_code=='' || state_code=='undefined')
		var state_code=$("#state_code_disp").val();

	//alert(state_code);
	if(dist_code==''  &&  dist_code=='undefined')
		var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	var url='home/getEstwiseAgeWiseDisp';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	//alert(postdata);
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#EstablishmentDisposalModal_body").html(result.reportrow);
		gridview('_est_agewise');
		
	}
}


function getStatewiseDisposedCases(flag,val)
{
	
		var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	$("#StateDisposalModal_body").html('');
	var url='home/getStatewiseDisposedCases';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#StateDisposalModal_body").html(result.reportrow);
		gridview('_state');
		
	}
}
function getDistwiseDisposedCases(flag,val,state_code)
{
	if(state_code=='' || state_code=='undefined')
		var state_code=$("#state_code_disp").val();
	var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	$("#DistrictDisposalModal_body").html('');
	var url='home/getDistwiseDisposedCases';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#DistrictDisposalModal_body").html(result.reportrow);
		gridview('_dist');
		
	}
}
function getEstwiseDisposedCases(flag,val,state_code,dist_code)
{
	if(state_code=='' || state_code=='undefined')
		var state_code=$("#state_code_disp").val();
	if(dist_code=='' || dist_code=='undefined')
		var dist_code=$("#dist_code_disp").val();
	var case_type=$("#case_type_disp").val();
	var est_code=$("#est_code_disp").val();
	var ci_cri=$("#ci_cri_disp").val();
	var est_code=$("#est_code_disp").val();
	$("#EstablishmentDisposalModal_body").html('');
	var url='home/getEstwiseDisposedCases';
	var postdata='ci_cri='+ci_cri+'&case_type='+case_type+'&est_code='+est_code+'&flag='+flag+'&val='+val;
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{
		$("#EstablishmentDisposalModal_body").html(result.reportrow);
		gridview('_est');
		
	}
}
function getCasewiseDisposedCases(flag,val,state_code,dist_code,est_code)
{
	var url='home/getCasewiseDisposedCases';
	var ci_cri=$("#ci_cri_disp").val();
	var table=$('#tbl_cases').DataTable();
		table.destroy();
		var table=$('#tbl_cases_disposal').DataTable();
		table.destroy();
		$('#tbl_cases_disposal').DataTable({
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/getCasewiseDisposedCases",
			 "bAutoWidth": false,
			fnServerData: function ( sSource, aoData, fnCallback ) {
					aoData.push( { "name": "flag", "value": flag } );
					aoData.push( { "name": "val", "value": val } );
					aoData.push( { "name": "state_code", "value": state_code } );
					aoData.push( { "name": "dist_code", "value": dist_code } );
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "est_code", "value": est_code } );
					/* Column filter count */
					var postdata='';
					  var c=0;
                        $.each(aoData, function (k,v) {
                                if(c==0)
                                         postdata+=v.name+'='+v.value;
                                else
                                        postdata+='&'+v.name+'='+v.value;
                                c++;
                        });
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						fnCallback(result.output);
					
					}
		}	
  } );
}

function printContent()
{
	//$('#staticBackdropLabel6').hide();
	var divContents = document.getElementById("modal-body-business").innerHTML;

	var printWindow = window.open("", "", "width=900,height=700");

	printWindow.document.write("<html><head><title></title></head><body>");
	printWindow.document.write(divContents);
	printWindow.document.write("</body></html>");

   
}


$(document).ready(function(){

var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
  return new bootstrap.Popover(popoverTriggerEl)
})
 
	$(document).on('input', '#ageRange', function() {
		$('#slider_value').html( $(this).val() );
	}); 

	$("#state_code").chosen('destroy');
	$("#sel_year_chosen").hide();
	$("#state_code").chosen();
	$("#dist_code").trigger("chosen:updated");

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
	$('#alertDashboard').DataTable();
	 //{responsive:true}    );

    $("#toggleLayout").click(function(){
	  $(".mainFourDivs .col-xl-6").toggleClass("col-xl-12");
	});
	
	$("#alerts-tab").click(function(){
		
		state_code =$("#state_code").val();
        dist_code =$("#dist_code").val();
		  $("#refresh_pend").addClass("d-none");
		  $("#sel_year").hide();
		  $("#sel_year_chosen").hide();
		   $("#drillDown_tbl").hide();
		  $.session.set("active_tab","");
        requestUri('home/index&state_code='+state_code+'&dist_code='+$("#dist_code").val());
	});
});
var stagebarchart,casetypepiechart,matterTchart,matterTypeData,agechart,ageData,swchart,stagePieData,agelinechart,delaybarchart,instvsdispchart,dispnaturepiechart,disposalPieData,instvsdispchart1,pendvsdispchart,prechart;

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
		
		nationalCaseType(result.mattertype,result.cases_count);
		matterTypeData=JSON.parse("["+casetype+"]");
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		stageWiseBarChart(result.purpose_name,result.purpose_count);
		agewiseLineChart(result.year,result.year_count);
		
		if(tab_val=='pending')
		{
			//delayReasonBarChart(result.delayName,result.delay_count);
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

function fetchPendDashboard(ci_cri,tab_val,disp_year)
{
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

	$('#case_type_gr  option[value=10]').prop("selected", true);
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
		if(disp_year=='' || disp_year==undefined)
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
		//$("#sel_year").val(2025);
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
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	if(disp_year!='')
		postdata+='&disp_year='+disp_year;	 
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
		ageData=result.agewise_count;
		stagePieData=result.stagewise_count;
		disposalPieData=result.dispNatureCount;
	
		matterType('Matter Type Pendency',casetype);

  
		pendingCasesChartT2('Age Wise Pendency ',result.agewise_count,'#78C193',1111);
		nationalCaseType(result.mattertype,result.cases_count,''); 	
		
		/*$("#MatterTypeInDropdowntbl").html('');
		$('#MatterTypeInDropdowntbl').append(result.caseChartcount);
		$("#tblCaseCharttype").DataTable();*/

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
		$("#tblCaseCharttype").DataTable();


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

        	
			 
		if(tab_val=='pending')
		{
			$("#div_delay").hide();
			agewiseLineChart(result.year,result.year_count);
			$("#ageline").val(result.year);
			$("#agelinecount").val(result.year_count);

			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
			stageWiseBarChart(result.purpose_name,result.purpose_count);	
			$("#delaytbl").html('');
			$('#delaytbl').append(result.delaywiseCount);  	

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


					if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
					else
					{
						$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
					}
                                        
				 }		 
			$('#instVsDisptbl').append(' </tbody> ');
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
					
							if(state_code=='' && dist_code=='')
							{
								$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
							}
							else if(state_code!='' && dist_code=='' )
							{
								$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
							}
							else
							{
								$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+tab_val+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
							}
                                
                 }
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable();

			 delayReasonBarChart(result.dispYear,result.dispCount); 
			stageWiseBarChart(result.subNatureName,result.subNatureCount);		
			stageChart('Disposal Nature Category',result.dispNatureCount,111,result.dispNatureName);
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
				               
				                b=b+parseInt(a[i]);
				        }
	                $("#delaytbl").hide();
	                $("#delayWise1chart").show();
	                $("#delaychartbtn").hide();
	                $("#delayTblbtn").show();

	        if(data.length > 10)
		        {
				                dynamicWidth1='200%'
				        }
	        else if(data.length < 5 && data.length> 0)
		        {
				                dynamicWidth1='50%'
				        }
	        else
		        {	           dynamicWidth1='100%';
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
						                    offsetY: -  50,
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
	if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;
	 
	if(active_tab=='disposed')
	{
		var disp_year=$("#sel_year").val();
		postdata+='&disp_year='+disp_year;
	}
	 
	$("#casetype").val('');
	$('#case_type_gr  option[value=10]').prop("selected", true);
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
		nationalCaseType(result.mattertype,result.cases_count,'');
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
		
		$("#StageWisePInDropdowntbl").html('');
		$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
	 	$("#stageCharttbl").DataTable();
		
		$("#MatterTypeInDropdowntbl").html('');
		$('#MatterTypeInDropdowntbl').append(result.caseChartcount);
	 	//$("#tblCaseCharttype").DataTable();

		$("#ageBarInDropdowntbl").html('');
		$('#ageBarInDropdowntbl').append(result.ageChartcount);
		$("#tblAgeChartcount").DataTable();
		  
		if(active_tab=='pending')
		{
			stageWiseBarChart(result.purpose_name,result.purpose_count);
			 
			instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);

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
			 
				/*if(state_code=='' && dist_code=='')
				{
                                	$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
                                }
                                else if(state_code!='' && dist_code=='' )
                                {
                                        $('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
                                }
                                else
                                {
                                        $('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
                                }*/

								if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
					else
					{
						$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
					}

			 }
			$('#instVsDisptbl').append(' </tbody>');
			$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_instwise+'</th><th>'+tot_dispwise+'</th> </tr> </tfoot></table>');
		//	$("#tblInstDispCount").DataTable();
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
                }]})
		}
		else
		{			 
			stageWiseBarChart(result.subNatureName,result.subNatureCount);
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
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
                                }
                                else if(state_code!='' && dist_code=='' )
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
                                }
                                else
                                {
                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
                                }
                        }
                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable();

			delayReasonBarChart(result.dispYear,result.dispCount); 
			$("#delaytbl").html('');
			$('#delaytbl').append(result.timetoDispCount);  	
			$("#tblTimetoDispcount").DataTable();

		/*	$("#instVsDisptbl").html('');
			$('#instVsDisptbl').append(result.natureOfDispCount);  	
			$("#tblnatureOfDispcount").DataTable();*/

			$("#stagetbl").html('');
                        $('#stagetbl').append(result.natureOfDispCount);
                        $("#tblnatureOfDispcount").DataTable();

			$("#StageWisePInDropdowntbl").html('');
                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
                        $("#tblnatureOfDispPIcount").DataTable();

			 
			/*$("#disaposalNatureChartTbl").html('');
			$('#disaposalNatureChartTbl').append(result.natureOfDispPICount);  	
			$("#tblnatureOfDispPIcount").DataTable();*/
			 
		}
	}
}

function nationalCaseType(name,datacount,case_gr)
{
	if(case_gr=='' || case_gr=='undefined')
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
		dynamicWidth1='100%'
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
					
					//agewiseLineChart(result.year,result.year_count);
					//alert(result.year_count);
					//stageWiseBarChart(result.purpose_name,result.purpose_count);
					 

					$("#agewisetbl").html('');
					$('#agewisetbl').append(result.agewiseCount);
					$("#tblAgewisecount").DataTable();

					$("#stagetbl").html('');
					$('#stagetbl').append(result.stagewiseCount);
				//	alert(result.stagewiseCount);
					$("#tblStagewisecount").DataTable();  				
					
					$("#StageWisePInDropdowntbl").html('');
					$('#StageWisePInDropdowntbl').append(result.stagewisePICount);
					$("#stageCharttbl").DataTable();

					$("#ageBarInDropdowntbl").html('');
					$('#ageBarInDropdowntbl').append(result.ageChartcount);
					$("#tblAgeChartcount").DataTable();
	  
					if(active_tab=='pending')
					{
						 //stageChart('stage Category',result.stagewise_count,111,result.purposename);
						 stageWiseBarChart(result.purpose_name,result.purpose_count);
						 agewiseLineChart(result.year,result.year_count);
						 $("#ageline").val(result.year);
						 $("#agelinecount").val(result.year_count);
						 
						instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
									
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

							$('#instVsDisptbl').append('<table id="tblInstDispCount" class="table table-bordered bg-light" style="width:100%,;overflow-y: auto;max-height:90vh;"><thead><tr><th>Years</th><th>Institution</th><th>Disposal</th></tr></thead><tbody>  ');
							 for(i=0; i<year_arr.length; i++)
								 {
										tot_instwise		=		(+tot_instwise) + (+inst_count[i]);
										tot_dispwise		=		(+tot_dispwise) + (+dispo_count[i]);		
							//$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td>'+inst_count[i]+'</td><td>'+dispo_count[i]+'</td></tr> ');
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
								 }
								$('#instVsDisptbl').append(' </tbody>');
								$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_instwise+'</th><th>'+tot_dispwise+'</th> </tr> </tfoot></table>');
								$("#tblInstDispCount").DataTable();
						}
						else
						{
							 
							disposalNatureBarChart(result.subNatureName,result.subNatureCount);
							stageWiseBarChart(result.subNatureName,result.subNatureCount);
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
		
								if(state_code=='' && dist_code=='')
								{
									$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
								}
								else if(state_code!='' && dist_code=='' )
								{
									$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">' +yearwise_count[i]+'</a></td></tr> ');
								}
								else
								{
									$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
								}
							}

                $('#agewisetbl').append(' </tbody>');
                $('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
                $("#tblAgewisecount").DataTable();



							delayReasonBarChart(result.dispYear,result.dispCount); 
							$("#delaytbl").html('');
							$('#delaytbl').append(result.timetoDispCount);  	
							$("#tblTimetoDispcount").DataTable();

							/*$("#instVsDisptbl").html('');
							$('#instVsDisptbl').append(result.natureOfDispCount);  	
							$("#tblnatureOfDispcount").DataTable();*/


							$("#stagetbl").html('');
				                        $('#stagetbl').append(result.natureOfDispCount);
				                        $("#tblnatureOfDispcount").DataTable();

				                        $("#StageWisePInDropdowntbl").html('');
				                        $('#StageWisePInDropdowntbl').append(result.natureOfDispPICount);
				                        $("#tblnatureOfDispPIcount").DataTable();
							 
/*							$("#disaposalNatureChartTbl").html('');
							$('#disaposalNatureChartTbl').append(result.natureOfDispPICount);  	
							$("#tblnatureOfDispPIcount").DataTable();*/
							 
						}
				}
				
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
	//color= ['#3DAAAF','#6f917b','#d6b17b','#a6695b','#88b6ca','#e66571'];
	color= ['#22577A','#748E63','#E06C9F','#E1AA74','#00B2CA','#533A71','#3A445D','#59344F','#AE445A','#3085C3'];
	$('#matterTypeTitle').html(dynamictitle);

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
					var url='home/fetchMatterType';
					var active_tab=$.session.get("active_tab");
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

					$("#regCasetype").val(config.dataPointIndex);

					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{		
						$('#case_type_gr').chosen('destroy');
						$('#case_type_gr  option[value='+config.dataPointIndex+']').prop("selected", true);
						nationalCaseType(result.mattertype,result.cases_count,result.case_gr); 
						
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
			stageWiseBarChart(result.purpose_name,result.purpose_count);
			 instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
			//stageChart('Stage Category',result.stagewise_count,111,result.purposename);

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
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
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
			stageWiseBarChart(result.subNatureName,result.subNatureCount);
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
                                       $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
									// $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
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

			delayReasonBarChart(result.dispYear,result.dispCount); 
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
			
		labels: ['Writ Petition', 'Second Appeal', 'First Appeal', 'Appeal','Case/Petition','Revision','Reference','Suit','Review','Application'],
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
		
		 
	if(matterTchart==undefined)
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
 
				if(state_code==null)
				{state_code='';}
				if(dist_code==null)
				{dist_code='';}
 
				if(state_code==' ')
				{state_code='';}
				if(dist_code==' ')
				{dist_code='';}

				
				var postdata='mattertypeval='+get_val+'&ci_cri='+ci_cri+'&active_tab='+active_tab;
				if(state_code!='')
					postdata+='&state_code='+state_code;
				if(dist_code!='')
					postdata+='&dist_code='+dist_code;
				if(disp_year!='' || disp_year!=undefined)
					postdata+='&disp_year='+disp_year;

				$("#mattertypeval").val(get_val); 

				ajaxCall({url:url,postdata:postdata,callback:callback});
		function callback(result)
		{		
			nationalCaseType(result.mattertype,result.cases_count,result.case_gr);						
			$("#chart9tbl").html('');
			$('#chart9tbl').append(result.casecount);	 
			$("#tblCasetype").DataTable();				 
  
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
				stageWiseBarChart(result.purpose_name,result.purpose_count);
				 instVsDispPendChart(result.insyear,result.ins_count,result.disp_count);
				//stageChart('Stage Category',result.stagewise_count,111,result.purposename);


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
								$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
						}
						else if(state_code!='' && dist_code=='' )
						{
								$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
						}
						else
						{
								$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","ins")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+year_arr[i]+'","disp")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
						}
				 }
				$('#instVsDisptbl').append(' </tbody>');
				$('#tblInstDispCount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_instwise+'</th><th>'+tot_dispwise+'</th> </tr> </tfoot></table>');
				$("#tblInstDispCount").DataTable();
			}
			else
			{
				stageWiseBarChart(result.subNatureName,result.subNatureCount);
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
								$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
						}
						else if(state_code!='' && dist_code=='' || (state_code!='' && dist_code==null))
						{
								$('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
						}
						else
						{
							  $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
							// $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:estwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year")\'; data-bs-toggle="modal" data-bs-target="#modal_estwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
						}
					}
					$('#agewisetbl').append(' </tbody>');
					$('#tblAgewisecount').append('<tfoot> <tr> <th style="text-align:right;">Total:</th> <th>'+tot_pendAge+'</th><th>'+tot_yearwise+'</th> </tr> </tfoot></table>');
					$("#tblAgewisecount").DataTable();

				delayReasonBarChart(result.dispYear,result.dispCount); 
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


function pendingCasesChartT2(title,tot_pend1,color,id)
{
	
	ageData=tot_pend1;
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
							//alert(result.year)
							$("#age_breadcrumb").show();
							if(active_tab=='pending')
							{
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
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+yearwise_count[i]+'</a></td></tr> ');
                                                                }
                                                                else if(state_code!='' && dist_code=='' )
                                                                {
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +yearwise_count[i]+'</a></td></tr> ');
                                                                }
                                                                else
                                                                {
                                                                        $('#tblAgewisecount tbody').append(' <tr><td>'+pendAge_year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","dispAgeYear","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+pendAge_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+pendAge_year_arr[i]+'","year","'+config.dataPointIndex+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+yearwise_count[i]+'</a></td></tr> ');
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
	if(agechart==undefined)
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
	 
	stagePieData=data;
	
	data=stagePieData.replaceAll('~',',');
	 //alert(data)
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
							//stageWiseBarChart(result.purpose_name,result.purpose_count);
							stageWiseBarChart(result.purpose_name,result.purpose_count);

							 $("#stagetbl").html('');
							 $('#stagetbl').append(result.stagewiseCount);				 
					         $("#tblStagewisecount").DataTable();  
						}
						else
						{
							stageWiseBarChart(result.subNatureName,result.subNatureCount);		
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
		colors: ['#EE964B', '#dfb00c', '#28AFB0', '#19647E', '#1F271B'],
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
		
		if(swchart==undefined)
		{
			$("#StageWisePInDropdown").html('');
			swchart = new ApexCharts(document.querySelector("#StageWisePInDropdown"), swoptions);
		    swchart.render();	 
		}
		else
		{
			setTimeout(function(){swchart.updateSeries(data)},500);
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

function stageWiseBarChart(purpose_name,purpose_data)
{
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
	
		$("#stagetbl").hide();
		$("#stageWise1chart").show(); 
		$("#stagechartbtn").hide();
		$("#stageTblbtn").show();
	
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
		  intersect: false
		},
		colors: ['#a9333a', '#00ff00'],
        
		
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
        colors: ['#009dae', '#00ff00'],
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
          categories: year,
		labels: {
          rotate: -45,
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
		if(agelinechart==undefined)
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
 
function instVsDispPendChart(year,ins_count,disp_count)
{
	console.log(year+"====================="+ins_count+"+++++++++++++++++="+disp_count)
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
	  
	  
	if(instvsdispchart==undefined)
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
	var active_tab=$.session.get("active_tab");
	var mattertypeval=$("#mattertypeval").val();
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

					
 
					 if(state_code=='' && dist_code=='')
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:statewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_statewiseCase_data">'+dispo_count[i]+'</a></td></tr> ');
					}
					else if(state_code!='' && dist_code=='' )
					{
							$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:distwise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_distwiseCase_data">' +dispo_count[i]+'</a></td></tr> ');
					}
					else
					{
						$('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
					}
            //   $('#tblInstDispCount tbody').append(' <tr><td>'+year_arr[i]+'</td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","ins","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+inst_count[i]+'</a></td><td><a href="#" onclick=\'javascript:casewise_case_details("'+state_code+'","'+dist_code+'","'+ci_cri+'","'+active_tab+'","'+yearInsDisp+'","disp","'+case_type+'","'+year_arr[i]+'")\'; data-bs-toggle="modal" data-bs-target="#modal_dashcaselist">'+dispo_count[i]+'</a></td></tr> ');
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
	var active_tab=$.session.get("active_tab");
	if(active_tab=='pending' || active_tab=='disposed')
	{
		fetchPendDashboard('2',active_tab);
//alert(active_tab)
	}
	else if(active_tab=='caseLoad')
		case_load();
	else if(active_tab=='delay')
		delay_dashboard();
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
			colors:['#439A97'],
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
				  color:  '#62B6B7'
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
			colors:['#863A6F'],
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
				  color:  '#863A6F'
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
		colors:['#0D4C92'],
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
				  color:  '#0D4C92'
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
	$("#caseTypechartbtn").hide();
	$("#agewisechartbtn").hide();
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
		updateStageChart();
	}); 

	$("#agewiseTblbtn").click(function(){
		$("#agewise1chart").hide();
		$("#agewisetbl").show(); 
		$("#agewiseTblbtn").hide();
		$("#agewisechartbtn").show(); 
	});
	$("#agewisechartbtn").click(function(){
		$("#agewisetbl").hide();
		$("#agewise1chart").show(); 
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
	$('#modal-body-state').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='ins')
			$('#staticBackdropLabelStatewise').html('Cases Instituted in Last Month');
		if(flag=='disp')
			$('#staticBackdropLabelStatewise').html('Cases Disposed in Last Month');
		if(flag=='citizen')
			$('#staticBackdropLabelStatewise').html('Filed Cases By Senior Citizen');
		if(flag=='women')
			$('#staticBackdropLabelStatewise').html('Filed Cases By Woman');
		if(flag=='delay')
			$('#staticBackdropLabelStatewise').html('Delay Reason');
		if(flag=='insCurr')
			$('#staticBackdropLabelStatewise').html('Cases Instituted in Current Year');
		if(flag=='dispCurr')
			$('#staticBackdropLabelStatewise').html('Cases Disposed in Current Year');
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_est').DataTable({
		});
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
					$.each(aoData, function (k,v) {
						//alert(v.name+'---'+v.value)
						postdata+='&'+v.name+'='+v.value;
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
function fetchDistWiseRecords(flag,state_code,state_name,ci_cri)
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_est').DataTable({
		});
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
					$.each(aoData, function (k,v) {
						//alert(v.name+'---'+v.value)
						postdata+='&'+v.name+'='+v.value;
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
function fetchEstWiseRecords(flag,state_code,state_name,dist_code,dist_name,ci_cri)
{
	var url='home/fetchEstData';
	 if(dist_code=="")
     {		var dist_code=$("#dist_code").val();}
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name+'&dist_code='+dist_code+'&dist_name='+dist_name; 
	 
	$('#modal-body-est').html('');
	ajaxCall({url:url,postdata:postdata,callback:callback});
	function callback(result)
	{	
		if(flag=='ins')
			$('#staticBackdropLabelEstwise').html('Cases Instituted in Last Month / '+state_name);
		if(flag=='disp')
			$('#staticBackdropLabelEstwise').html('Cases Disposed in Last Month / '+state_name);
		if(flag=='citizen')
			$('#staticBackdropLabelEstwise').html('Filed Cases By Senior Citizen / '+state_name);
		if(flag=='women')
			$('#staticBackdropLabelEstwise').html('Filed Cases By Woman / '+state_name);
		if(flag=='delay')
			$('#staticBackdropLabelEstwise').html('Delay Reason / '+state_name);
		if(flag=='insCurr')
			$('#staticBackdropLabelEstwise').html('Cases Instituted in Current Year / '+state_name);
		if(flag=='dispCurr')
			$('#staticBackdropLabelEstwise').html('Cases Disposed in Current Year / '+state_name);
		$('#modal-body-est').html(result.tbl_str);
		$('#tbl_est').DataTable({
		});
	}
}

function fetchCasesRecords(flag,state_code,state_name,dist_code,dist_name,est_code,est_name,ci_cri)
{ 
        var url='home/fetchCaseData';
 
                var table=$('#tbl_cases_list').DataTable();
                table.destroy();
                $('#tbl_cases_list').DataTable( {
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
								/* Column filter count */
								var postdata='';
								$.each(aoData, function (k,v) {
										//alert(v.name+'---'+v.value)
										postdata+='&'+v.name+'='+v.value;
								});
								ajaxCall({url:url,postdata:postdata,callback:callback});
								function callback(result)
								{  
										fnCallback(result.output);												 
										if(flag=='ins')
											$('#staticBackdropLabelCases').html('Cases Instituted in Last Month / '+state_name+' / '+est_name);
										if(flag=='disp')
												$('#staticBackdropLabelCases').html('Cases Disposed in Last Month / '+state_name+' / '+est_name);
										if(flag=='citizen')
												$('#staticBackdropLabelCases').html('Filed Cases By Senior Citizen / '+state_name+' / '+est_name);
										if(flag=='women')
												$('#staticBackdropLabelCases').html('Filed Cases By Woman / '+state_name+' /  '+est_name);
										if(flag=='delay')
												$('#staticBackdropLabelCases').html('Delay Reason / '+state_name+' /  '+est_name);
										if(flag=='insCurr')
												$('#staticBackdropLabelCases').html('Cases Instituted in Current Year  / '+state_name+' /  '+est_name);
										if(flag=='dispCurr')
												$('#staticBackdropLabelCases').html('Cases Disposed in Current Year  / '+state_name+' /  '+est_name);
										if(flag=='regCourt')
												$('#staticBackdropLabelCases').html('');
								}
                }
  } );
}

function fetchCasesRecords_1(flag,ci_cri,judge_code)
{// alert(judge_code);
	var url='home/fetchCaseData';
	var search_by=$("#sel_search_by option:selected").val();
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
		var table=$('#tbl_cases').DataTable();
		table.destroy();
		$('#tbl_cases').DataTable( {			
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
					aoData.push( { "name": "ci_cri", "value": ci_cri } );
					aoData.push( { "name": "judge_code", "value": judge_code } );	
					aoData.push( { "name": "search_by", "value": search_by } );
					/* Column filter count */
					var postdata='';
					$.each(aoData, function (k,v) {
						//alert(v.name+'---'+v.value)
						postdata+='&'+v.name+'='+v.value;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
					function callback(result)
					{
						fnCallback(result.output);
						if(flag=='ins')
						$('#staticBackdropLabel4').html('Cases Instituted in Last Month  ');
						if(flag=='disp')
							$('#staticBackdropLabel4').html('Cases Disposed in Last Month ');
						/*if(flag=='citizen')
							$('#staticBackdropLabel4').html('Filed Cases By Senior Citizen ');
						if(flag=='women')
							$('#staticBackdropLabel4').html('Filed Cases By Woman ');
						if(flag=='delay')
							$('#staticBackdropLabel4').html('Delay Reason ');*/
						if(flag=='insCurr')
							$('#staticBackdropLabel4').html('Cases Instituted in Current Year');
						if(flag=='dispCurr')
							$('#staticBackdropLabel4').html('Cases Disposed in Current Year');

						if(flag=='regCourt')
							$('#staticBackdropLabel4').html('');

					}
		}	
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_est').DataTable({
		});
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
					$.each(aoData, function (k,v) {
						//alert(v.name+'---'+v.value)
						postdata+='&'+v.name+'='+v.value;
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
		}	
  } );
}
function fetch_case_details_captcha1(casetype,casenum,caseyear,case_no,cino,court_no,jocode,state,dist,court_code,flag,get_cases_type)
{
	var div_id=$('#get_case_div').val();
	$("#"+div_id).hide();
	$("#case_history_captcha").show();
	
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_est').DataTable({
		});
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
					$.each(aoData, function (k,v) {
						postdata+='&'+v.name+'='+v.value;
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
		if(flag=='disposed')
			$('#staticBackdropLabel1').html('Cases Disposed In Last Month(more than 10 years old)');
		if(flag=='listed')
			$('#staticBackdropLabel1').html('Cases Listed Today');
		if(flag=='undated')
			$('#staticBackdropLabel1').html('Undated Cases');
		if(flag=='pending')
			$('#staticBackdropLabel1').html('Cases Pending Registration ');
		if(flag=='objection')
			$('#staticBackdropLabel1').html('Cases Under Objection');
		if(flag=='excessive')
			$('#staticBackdropLabel1').html('Excessive Dated Cases (More than 3 Months)');
		if(flag=='prelitigation')
			$('#staticBackdropLabel1').html('Pre-Litigation');
		if(flag=='pretrial')
			$('#staticBackdropLabel1').html('Pre-Trial');
		$('#modal-body-state').html(result.tbl_str);
		$('#tbl_ins_cases').DataTable({
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
			$('#stateWPDashboard').DataTable();
				//{responsive:true}    );
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
function delay_dashboard()
{
	$.session.set("active_tab",'delay');
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
	var url='home/fetchDelayDashboard';
	var postdata='';
	/*if(state_code!='')
		postdata+='&state_code='+state_code;
	if(dist_code!='')
		postdata+='&dist_code='+dist_code;*/

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
}
function allDelayCases(delay_id,delay_name)
{//alert(1);
	var state_code=$("#state_code").val();
	var dist_code=$("#dist_code").val();
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
					aoData.push( { "name": "delay_id", "value": delay_id } );
					/* Column filter count */
					var postdata='';
					$.each(aoData, function (k,v) {
						//alert(v.name+'---'+v.value)
						postdata+='&'+v.name+'='+v.value;
					});
					ajaxCall({url:url,postdata:postdata,callback:callback});
					function callback(result)
					{
						//alert(result.output);
						fnCallback(result);
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
		$("#dist_code").trigger("chosen:updated")
		
	}

}
function case_load()
{
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
	var url='home/fetchAlertDistData';
	var postdata='flag='+flag+'&ci_cri='+ci_cri+'&state_code='+state_code+'&state_name='+state_name;
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
		$('#tbl_dist').DataTable({
		});
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
		$('#tbl_est').DataTable({
		});
	}
}
function fetchCourtRecords(flag,ci_cri)
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
		});
	}
}

function fetchAlertCasesRecords(flag,ci_cri)
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
}


function fetchAlertHistory(flag,state_code,dist_code,court_code,case_no,type,jocode,court_no,cino,disposed_case,searchflag)
{
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
		//alert(objection1);

		var objection1='';
		$("#flag_add").val(searchflag); 

		$("#cases_tab1").hide();
		//$('#modal_history').show();
		//$("#modal-body-history").show();
		var fcaptcha = $("#captcha_code").val(); 
	//alert(fcaptcha);
	var url='o_civil_case_history/showHistory';
	var postdata='state='+state_code+'&dist_code='+dist_code+'&court_code='+court_code+'&case_number='+case_no+'&type='+type+'&objection1='+objection1+'&court_no='+court_no+'&jocode='+jocode+'&cino='+cino+'&disposed_case='+disposed_case+"&captcha="+fcaptcha+"&flagadd="+searchflag;;
	//alert(postdata);
	
	//$('#case_history').html('');
	//$('#modal-body-history').html('');
	 ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        { 
			//alert(result.tbl_str);
			
			if(result.status==false)
			{ 
				//alert(1+"captch="+fcaptcha);
				//alert(result.div_captcha);	
				$('#modal_history').hide();
				$('#modal_history').modal('hide');
				$("#modal_captcha").hide();
				$('#modal_captcha').modal('hide');

				$("#div_captcha_cnr").html('');
				$('#modal_captcha_data1').modal('show');				
				$('#modal-body-history1').html(result.tbl_str);
				$('#div_captcha_cnr1').html(result.div_captcha);
				
							
			} else {
				//alert("else");
				//alert(result.tbl_str);		
				
				 $('#modal_history').show();
				 $('#modal-body-history').show();
				 //$("#modal-body-history").show();
				 //$('#modal-body-history1').hide();
				$("#modal_captcha_data1").hide();
				$('#modal_captcha_data1').modal('hide');
				
				$('#modal-body-history').html('');	
				$('#modal-body-history').html(result.tbl_str);
				$('#case_history').html(result.tbl_str);
				
			//	$('#div_captcha_cnr').html(result.div_captcha);
				//$('#case_history').html(result.tbl_str);
			}
			
		}
	
}
			
			
function show_business(court_code,dist_code,n_dt,case_number,state_code,businessStatus,todays_date1,court_no,srno,cino)
{
	//alert("in fun");return false;
	/*if(flag=='disposed')
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
		objection1="pre_trial";*/

	var objection1='';


   var url='o_civil_case_history/viewbusiness';
   var postdata='state_code='+state_code+'&dist_code='+dist_code+'&court_code='+court_code+'&case_number='+case_number+'&businessStatus='+businessStatus+'&objection1='+objection1+'&court_no='+court_no+'&todays_date1='+todays_date1+'&judge_code='+judge_code+'&nextdate1='+n_dt+'&cino='+cino; 

	//alert(postdata); 
	ajaxCall({url:url,postdata:postdata,callback:callback});
	
	function callback(result)
	{
		//alert(result.tbl_str);
	//	$('#modal-body-history').html('');
		$('#modal-body-business').html(result.tbl_str);
	}

}

function displayPdf(url)
{
	
	//var url='cnr_status/checkStatus';
	var postdata='';
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

		/*------------------*/

/*---------------------*/

/*---------------------*/



/*------------------------*/

		/*---------------*/


function infmgt_dashboard()
{
        $.session.set("active_tab",'information management');
        var state_code=$("#state_code").val();
        var dist_code=$("#dist_code").val();
  //    alert(state_code);

        var url='home/fetchInfMgtDashboard';
        var postdata='';
        if(state_code!='')
                postdata+='&state_code='+state_code;
        if(dist_code!='')
                postdata+='&dist_code='+dist_code;

        ajaxCall({url:url,postdata:postdata,callback:callback});
        function callback(result)
        {
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
	
 

/******************************************************/
function statewise_case_details(state_code,dist_code,ci_cri,active_tab,val,flag,casetypeval,stageReady,monthInsDisp)
        {
		var table=$('#tblStatewisecount').DataTable();
        table.destroy();
		var disp_year=$("#sel_year").val();

		var mattertypeval=$("#regCasetype").val();
			 
			if(mattertypeval=='')
					var mattertypeval=$("#case_type_gr").val();
	 
                var url='home/fetchPendCaseData';
                var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab+'&state_code='+state_code+'&dist_code='+dist_code+'&val='+val+'&flag='+flag+'&casetypeval='+casetypeval+'&stageReady='+stageReady+'&monthInsDisp='+monthInsDisp+'&disp_year='+disp_year;

				if(disp_year!='')
					postdata+='&disp_year='+disp_year;
		if(regCasetype!='')
					postdata+='&regCasetype='+regCasetype;
		if(mattertypeval!='')
					postdata+='&mattertypeval='+mattertypeval; 
 
                ajaxCall({url:url,postdata:postdata,callback:callback});
                function callback(result)
                {
                $('#modal-body-statewise-data').html(result.statetbl);
                //alert(result.pendCaseData);
		$('#tblStatewisecount').DataTable({
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
		function distwise_case_details(state_code,dist_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp)
        {
			var url='home/fetchPendDistData';
		var disp_year=$("#sel_year").val();
		var mattertypeval=$("#regCasetype").val();
			 
			if(mattertypeval=='')
					var mattertypeval=$("#case_type_gr").val();
					
                var postdata='ci_cri='+ci_cri+'&active_tab='+active_tab+'&state_code='+state_code+'&dist_code='+dist_code+'&val='+val+'&flag='+flag+'&casetypeval='+casetypeval+'&monthInsDisp='+monthInsDisp;

				if(disp_year!='')
					postdata+='&disp_year='+disp_year;
				if(regCasetype!='')
							postdata+='&regCasetype='+regCasetype;
				if(mattertypeval!='')
					postdata+='&mattertypeval='+mattertypeval; 

                ajaxCall({url:url,postdata:postdata,callback:callback});
                function callback(result)
                {
                $('#modal-body-distwise-data').html(result.statetbl);
                //alert(result.pendCaseData);
                $('#tbldistwisecount').DataTable();
                }
        }

	function casewise_case_details(state_code,dist_code,ci_cri,active_tab,val,flag,casetypeval,monthInsDisp)
	{
		var url='home/casewiseList';
		var disp_year=$("#sel_year").val();
		var regCasetype=$("#regCasetype").val();
		
		if(regCasetype =='')
					var mattertypeval=$("#case_type_gr").val();
		$("#sel_search_by1").chosen('destroy');
		$("#sel_search_by1").chosen();
		$("#sel_search_by1").html();

		var search_by=$("#sel_search_by1 option:selected").val();
		if(flag!='' && flag!=undefined)
			$("#flag_caselist").val(flag);
		else
			flag=$("#flag_caselist").val();

		/*if(state_code!='' && state_code!=undefined)
			$("#state_code").val(state_code);
		else
			state_code=$("#state_code").val();

		if(dist_code!='' && dist_code!=undefined)
			$("#dist_code").val(dist_code);
		else
			dist_code=$("#dist_code").val();*/

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

		if(state_code!='' && state_code!=undefined)
			$("#state_code2").val(state_code);
		else
			state_code=$("#state_code2").val();

		if(dist_code!='' && dist_code!=undefined)
			$("#dist_code2").val(dist_code);
		else
			dist_code=$("#dist_code2").val();

	if(flag=='timetoDisp')
	{
	    postdata='flag='+flag+'&search_by='+search_by+'&ci_cri='+ci_cri+'&val='+val+'&active_tab='+active_tab+'&casetypeval='+casetypeval+'&monthInsDisp='+monthInsDisp+'&disp_year='+disp_year+'&state_code='+state_code+'&dist_code='+dist_code+'&regCasetype='+regCasetype+'&mattertypeval='+mattertypeval;
        	ajaxCall({url:url,postdata:postdata,callback:callback});
        	function callback(result)
       		{
			$("#modal-body-dashcaselist1").html(result.output);	
			$('#tbl_cases_dash1').DataTable();
			$("#sel_search_by1_chosen").hide();
		} 
	}	
	else
	{
		var table=$('#tbl_cases_dash').DataTable();
		table.destroy();
		$('#tbl_cases_dash').DataTable( {
			dom: 'lrfBtip',
			"pagingType": "full",
			"paging": true,
			"lengthMenu": [[10, 25, 50,100,1000], [10, 25, 50,100,1000]],
			"bProcessing": true,
			"bServerSide": true,
			"sAjaxSource": "home/stagewiseCases",
			 "bAutoWidth": false,
				//responsive:true,
				fnServerData: function ( sSource, aoData, fnCallback ) {
				aoData.push( { "name": "flag", "value": flag } );
				aoData.push( { "name": "state_code", "value": state_code } );
				aoData.push( { "name": "dist_code", "value": dist_code } );
				aoData.push( { "name": "ci_cri", "value": ci_cri } );
				aoData.push( { "name": "val", "value": val } );
				aoData.push( { "name": "active_tab", "value": active_tab } );
				aoData.push( { "name": "casetypeval", "value": casetypeval } );
				aoData.push( { "name": "monthInsDisp","value": monthInsDisp });
				aoData.push( { "name": "disp_year","value": disp_year });
				aoData.push( { "name": "search_by", "value": search_by } );
				aoData.push( { "name": "regCasetype", "value": regCasetype } );
				aoData.push( { "name": "mattertypeval", "value": mattertypeval } );
				/* Column filter count */
				var postdata='';
				$.each(aoData, function (k,v) {
					postdata+='&'+v.name+'='+v.value;
				});
					ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
					function callback(result)
					{
						 fnCallback(result.output);       
						 var table=$('#tbl_cases_dash').DataTable();
						/*if(active_tab=='pending')
							table.columns([11,12]).visible(false);
						else
									table.columns([11,12]).visible(true);*/
					}
				}
			} );	
	}	
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

	

        year=year.replaceAll('~',',');
        year=JSON.parse("["+year+"]");
        pend_count=pend_count.replaceAll('~',',');
        pend_count=JSON.parse("["+pend_count+"]");
        disposed_count=disposed_count.replaceAll('~',',');
        disposed_count=JSON.parse("["+disposed_count+"]");
	
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
			horizontalAlign: 'left',
                }
        };


        if(pendvsdispchart==undefined)
        {
                $("#agewise1chart").html('');
                pendvsdispchart =  new ApexCharts(document.querySelector("#agewise1chart"), pendVsDispoptions);
                 pendvsdispchart.render();
        }
        else
        {
                pendvsdispchart.updateOptions(pendVsDispoptions);
        }
}
/*-------------- Pre-Trial / Pre-litigation Chart ---------------------------------------------------*/
function preTrialLitigationChart(pre_civ,pre_cri,pre_tot)
{	
	var per_civ = pre_civ*100/pre_tot;
	var per_cri = pre_cri*100/pre_tot;
	var optionsPre = {
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
        chartPre.render();

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
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},'fast');
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
	 
//	$('#pills-delayDash').hide();
//	$('#pills-alerts').hide();
//setTimeout(function(){$("#Cases_data").hide()},500);	 
//        ajaxCall(url,post_data,callbk);
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        { 
             // $("#year_tab").html(result.reportrow);                gridview('_year');
			$('#modal-body-year').html(result.reportrow);
		 	$('#staticBackdropLabel1').html(result.label);
          $('#example_year').DataTable();
        }
}

function fetchData(label,tot,val,year,flag)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        $('#get_year').val(year);
        var url='home/fetchStatewiseData';
        var post_data='total='+tot+'&val='+val+'&year='+year+'&label='+label+'&flag='+flag;
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
    //    $('#state_tab').show();
      //  $('#year_tab').hide();
		$('#modal-body-state').html('');
        //ajaxCall(url,post_data,callbk);
        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {		
				$('#modal-body-state').html(result.reportrow);		 
				$('#staticBackdropLabelStatewise').html(result.lab);
				$('#example_state').DataTable();
                //gridview('_state');
        }
 
}

function fetchDistRecords(label,state_code,state_name,ci_cri,col_name)
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
                $("#dist_tab").html(result.reportrow);
                gridview('_dist');
        }
}

function fetchEstRecords(label,state_code,state_name,dist_code,dist_name,ci_cri,col_name,flag)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');

		$("#txt_state_name").val(state_name);
        $("#txt_state_code").val(state_code);
        $("#txt_col_name").val(col_name);
		$("#flag").val(flag);

     //   var get_state_name=$("#txt_state_name").val();
        $("#txt_dist_name").val(dist_name);
        $("#txt_dist_code").val(dist_code);
        var year=$("#get_year").val();
        var url='home/fetchEst';
        var post_data='state_name='+state_name+'&ci_cri='+ci_cri+'&col_name='+col_name+'&year='+year+'&label='+label+'&flag='+flag;
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
			$('#staticBackdropLabelEstwise').html(result.lab);
              //  $("#est_tab").html(result.reportrow);
                gridview('_est');
        }
}

function fetchCasesCaptcha(label,est_code,ci_cri,col_name,flag)
{//alert(col_name);
        var url='home/fetchCaseCaptcha';
        var post_data='';
        $("#est_tab").hide();
		$("#captcha_label").hide();
        ajaxCall({url:url,postdata:post_data,callback:callback});
//alert('==========')
        function callback(result)
        {
			$("#captcha_label").hide();
			$('#modal-body-case-captcha').html(result.filename);
			$("#modal-body-case-captcha").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:fetchCases(\""+label+"\",\""+est_code+"\",\""+ci_cri+"\",\""+col_name+"\")\'data-bs-toggle='modal' data-bs-target='#modal_alertcase_data'>" );

			// alert(result.filename);
             //     $("#cases_captcha_tab").show();
		//  $("#cases_captcha_tab").html(result.filename);
            //      $("#cases_captcha_tab").append("<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick=\'javascript:fetchCases(\""+label+"\",\""+est_code+"\",\""+ci_cri+"\",\""+col_name+"\")\'>");
//<input type='button' href='#' class='btn btn-success col-auto btn-sm' value='Submit'  onclick='fetchCases(\""+label+"\",\""+est_code+"\",\""+ci_cri+"\",\""+col_name+"\");'>");
        }
}


function fetchCases(label,est_code,ci_cri,col_name)
{
        
          $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},
        'fast');
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        var year=$("#get_year").val();
        $("#txt_est_code").val(est_code);
        var getState=$("#state_code").val();
        var getDist=$("#dist_code").val();
        $('#cases_tab1').show();
        $('#get_case_div').val('cases_tab1');
        var captcha_val=$('#captcha1').val();
		var flag=$("#flag").val();

	url = 'home/fetchCases',
        $('#est_tab').hide();
                var table=$('#tbl_cases_list').DataTable();
        table.destroy();
	$('#tbl_cases_list').DataTable( {
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
										 aoData.push( { "name": "flag", "value": flag } ); 

                                            /* Column filter count */
                                        var postdata='';
                                        $.each(aoData, function (k,v) {
                                                postdata+='&'+v.name+'='+v.value;
                                        });
  
					ajaxCall({url:url,postdata:postdata,callback:callback});
//					ajaxCall(sSource,postdata,callback); 
						function callback(result)
						{
								$("#captcha1").html('');
								if(result.msg=='')
								{ 
									setTimeout(function(){
													//$("#modal_case_data").show();	
													$("#modal_alertcase_data").modal('show');	
													//$("#modal_casedata_captcha").hide();
													$("#modal_casedata_captcha").modal('hide');
													},50);	
								   fnCallback(result.output);
								   $("#modal_alertcase_data").show();	
									$('#label').html(result.label);
									$('#staticBackdropLabelCases').html(result.label);
								}
								else
								{
									setTimeout(function(){
														//$("#modal_casedata_captcha").show();	
														$("#modal_casedata_captcha").modal('show');	
													},50);

									$("#modal_casedata_captcha").modal('show');
									$("#modal_alertcase_data").hide();
									$('.modal-backdrop').remove();
										document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
										errorAlert('Invalid Captcha');
										alert('Invalid Captcha');return false;
										$("#cases_tab1").hide();
								}
								/*if(result.msg=='')
								{
										   $('#cases_tab1').show();
										   $("#cases_captcha_tab").hide();
										 fnCallback(result.output);
										$('#label').html(result.label);
								}
								else
								{
										document.getElementById('captcha_image1').src = 'securimage/securimage_show.php? ' + Math.random(); this.blur();
										alert('Invalid Captcha');return false;
										$("#cases_tab1").hide();

								}*/


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
        //$('#caseDetails_tab').show();
        $('#cur_tab').hide();
		//$('#Cases_data').hide();
        /*$('#pills-delayDash').hide();
        $('#pills-alerts').hide();*/

        ajaxCall({url:url,postdata:post_data,callback:callback});
        function callback(result)
        {
                //$("#caseDetails_tab").html(result.reportrow);
                 gridview('_caseDetails');
				$('#modal-body-casetype').html(result.reportrow);
		 		$('#staticBackdropLabelCasetype').html(result.label);
				$('#example_caseDetails').DataTable();
        }
}

function stateWise_case_det(label,get_type,val,case_val,flag)
{ 
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;		 

        var url='home/fetch_stateWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var post_data='get_pendency_type='+get_pendency_type+'&case_type='+get_type+'&val='+val+'&label='+label+'&case_val='+case_val+'&flag='+flag;
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
//        ajaxCall(url,post_data,callbk);
	ajaxCall({url:url,postdata:post_data,callback:callback});

        function callback(result)
        { 
               // $("#stateWise_caseDetails_tab").html(result.reportrow);
				$('#modal-body-statewise').html(result.reportrow);
				$('#staticBackdropLabelState').html(result.label);
                gridview('_stateWise_caseDetails');
        }
}
 
function distWise_case_det(label,state_code,get_type,val,case_val)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_distWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        $("#txt_state_name").val(get_type);
        $("#txt_state_code").val(state_code);
        var post_data='get_pendency_type='+get_pendency_type+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label+'&case_val='+case_val;
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
                //$("#distWise_caseDetails_tab").html(result.reportrow);
				$('#modal-body-distwise').html(result.reportrow);
                gridview('_distWise_caseDetails');
        }
}

function estCodeWise_case_det(label,state_code,state_name,dist_code,get_type,val,case_val,flag)
{ 
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;
		$("#txt_state_name").val(state_name);
        $("#txt_state_code").val(state_code);

        var url='home/fetch_estCodeWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        
        var post_data='get_pendency_type='+get_pendency_type+'&state_code='+state_code+'&get_state_name='+get_state_name+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label+'&case_val='+case_val+'&flag='+flag;

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
                //$("#estCodeWise_caseDetails_tab").html(result.reportrow);
				$('#modal-body-estwise').html(result.reportrow);
				$('#staticBackdropLabelEst').html(result.label);
                gridview('_estCodeWise_caseDetails');
        }
}


function regYearWise_case_det(label,get_type,val,est_name,case_val,flag)
{
        $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top}, 'fast');
        get_cases_type=val;

        var url='home/fetch_regYearWiseCaseDetails';
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        $("#txt_est_code").val(get_type);
        var post_data='get_pendency_type='+get_pendency_type+'&get_dist_name='+get_dist_name+'&get_state_name='+get_state_name+'&get_case_name='+get_case_name+'&get_type='+get_type+'&val='+val+'&label='+label+'&est_name='+est_name+'&case_val='+case_val+'&flag='+flag;
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
                //$("#regYearWise_caseDetails_tab").html(result.reportrow);
				$('#modal-body-regYearwise').html(result.reportrow);
				$('#staticBackdropLabelRegyear').html(result.label);
                gridview('_regYearWise_caseDetails');
        }
}


function regno_Wise_case_det(label,get_type,val,case_val,flag)
{
//alert("=========");
  $("html, body").animate({ scrollTop: $(".dataTables_info").offset().top},'fast');
        get_cases_type=val;
        var get_pendency_type=$("#txt_get_lbl_type").val();
        var get_case_name=$("#txt_case_name").val();
        var get_state_name=$("#txt_state_name").val();
        var get_dist_name=$("#txt_dist_name").val();
        var est_code=$("#txt_est_code").val();
        //$('#regno_Wise_caseDetails_tab').show();
        $('#get_case_div').val('regno_Wise_caseDetails_tab');
        $('#regYearWise_caseDetails_tab').hide();
		var url='home/fetch_regno_WiseCaseDetails';

        var table=$('#tbl_caseList').DataTable();
        table.destroy();
        $('#tbl_caseList').DataTable( {
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
						aoData.push( { "name": "flag", "value": flag } );

                                /* Column filter count */
                                var postdata='';
                                $.each(aoData, function (k,v) {
                                        postdata+='&'+v.name+'='+v.value;
                                });
 
                            //    ajaxCall(sSource,postdata,fnCallback1);
                                ajaxCall({url:url,postdata:postdata,callback:callback});
                                function callback(result)
                                {
                                         fnCallback(result.output);
										 $('#staticBackdropLabelregNo').html(result.label);
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


function fetch_case_details_captcha(casetype,casenum,caseyear,case_no,cino,court_no,jocode,state,dist,court_code,get_cases_type,flag)
{      
        var div_id=$('#get_case_div').val();
        $("#"+div_id).hide();
        $("#case_history_captcha1").show();
		$("#case_history_captcha").show();
 
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
		else 
			set_case_type='BOTH';	 

     
		var url='o_civil_case_history/index';
 
                var postdata="state="+state+"&dist_code="+dist+"&court_code="+court_code+"&case_number="+case_no+"&type="+set_case_type+"&objection1=totalpending_cases&matchtotal=13145&court_no="+court_no+"&jocode="+jocode+"&cino="+cino+"&flag="+flag+"&disposed_case=N";
         
				 $('#modal-body-history').html('');
		ajaxCall({url:url,postdata:postdata,callback:callback});
       
        function callback(result)
        { 
			//$('#regno_Wise_caseDetails_tab').html('');
			$('#regno_Wise_caseDetails_tab').hide();
			$("#case_history_captcha1").show();
			$('#case_history_captcha1').html(result.tbl_str);
			$('#div_captcha_cnr').html(result.div_captcha);
			$("#cases_tab1").hide();
			
			//$("#case_history_captcha").html(result.tbl_str);
			//$("#case_history_captcha").show();

			

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
        console.dir(per_cnt);
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
          categories: [['Less than ','one Year ',per_cnt[0]],['1 to 3 Years',per_cnt[1]],['3 to 5 Years',per_cnt[2]],['5 to 10','Years'+per_cnt[3]],['Above 10'+per_cnt[4]]],
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

function back_fun()
{
	$("#cases_tab1").show();
}

function back_modal()
{
	
	var flag = $("#flag_add").val();	 
	if(flag=='ins' || flag=='insCurr' || flag=='dispCurr' || flag=='disp' || flag=='pendingYearwise')
	{
		//alert(1);
		 $('#modal_regNo_data').hide();
		 $('#modal_regNo_data').modal('hide');

		 $('#modal_alertcase_data').show();
		 $('#modal_alertcase_data').modal('show');

	}
	else if(flag=='CaseType')
	{
		//alert(2);
		
		 $('#modal_regNo_data').show();
		 $('#modal_regNo_data').modal('show');

		$('#modal_alertcase_data').hide();
		 $('#modal_alertcase_data').modal('hide');
	}
}
 
function fetchSummaryReport()
{
	var url='home/fetchSummaryReport';
	var ci_cri=$("input[name='ci_cri']:checked").val();
	var postdata="ci_cri="+ci_cri;

	ajaxCall({url:url,postdata:postdata,callback:callback});

	function callback(result)
	{
		$("#summaryReport").html(result.output);
		$('#tblStatewisecount').DataTable({
				dom: 'lrfBtip',
				"pagingType": "simple",
				"paging": true,
				"lengthMenu": [[ 25, 50], [25, 50]],	});
		summaryChart(result.state_name_arr,result.pend_cnt,result.disp_cnt)
	}
}

function summaryChart(label,pend_cnt,disp_cnt)
{

	pend_cnt=pend_cnt.replaceAll('~',',');
	pend_cnt=JSON.parse("["+pend_cnt+"]");

	disp_cnt=disp_cnt.replaceAll('~',',');
	disp_cnt=JSON.parse("["+disp_cnt+"]");

	label=label.replaceAll('~',',');
	label=label.replaceAll('#',' ');
	state_name=JSON.parse("["+label+"]");
	var summaryChart='';
	var options = {
          series: [{
          name: 'Pending',
          data: pend_cnt
        }, {
          name: 'Disposed',
          data: disp_cnt
        }],
          chart: {
          type: 'bar',
          height: 450,
          stacked: true,
          toolbar: {
            show: true
          },
          zoom: {
            enabled: true
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            legend: {
              position: 'top',
              offsetX: -10,
              offsetY: 0
            }
          }
        }],
		colors:["#FFAE49","#44B7C2"],
        plotOptions: {
          bar: {
            horizontal: false,
            borderRadius: 0,
            borderRadiusApplication: 'end', // 'around', 'end'
            borderRadiusWhenStacked: 'last', // 'all', 'last'
            dataLabels: {
              total: {
                enabled: true,
                style: {
                  fontSize: '13px',
                  fontWeight: 900
                }
              }
            }
          },
        },
			  grid: {
				  padding: {
					left: 10,
					bottom: 20
				  }
				},
			  dataLabels: {
          enabled: false,
          style: {
            fontSize: '9px',
            colors: ["#333333"]
          },
				background: {
				enabled: true,
				foreColor: '#333333',
				padding: 1,
				borderRadius: 1,
				borderWidth: 1,
				borderColor: '#fff',
				opacity: 0.1,
				dropShadow: {
				  enabled: false,
				  top: 1,
				  left: 1,
				  blur: 1,
				  color: '#000',
				  opacity: 0.25
				}
			  }
        },
        xaxis: {
          categories: state_name,
        },
		yaxis: {
          title: {
            text: 'Cases',
          },
        },
        legend: {
          position: 'top',
          offsetX: 10
        },
        fill: {
          opacity: 1
        }
        };


		if(summaryChart==undefined || summaryChart=='')
		{
			$("#summary_report").html('');
			summaryChart = new ApexCharts(document.querySelector("#summary_report"), options);
			summaryChart.render();
		}
		else
		{
			summaryChart.updateOptions(options);
		}
        // summaryChart = new ApexCharts(document.querySelector("#summary_report"), options);
        //chart.render();
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

var casesImported = "";
var casesRefreshed = false;
var exportArrTemp=[];
var CNR_Numbers_ef,CNR_Numbers_HC_ef;
//This function used to add cases imported from external file to mycases table

function fetchmycaseData(){
    var url="portfolio/getMyCasesData/";

    var postdata = "configuration="+window.sessionStorage.SELECTED_COURT;
    function callbackAddCase(obj){
        cnrNumbersArray = obj.mycases_dc;
		
		CNR_Numbers_ef = JSON.stringify(obj.mycases_dc);
		
		try{
			hccnrNumbersArray = obj.mycases_hc;
			CNR_Numbers_HC_ef = JSON.stringify(obj.mycases_hc);
		}catch (e) {
				// Handle the error
			 console.error('localStorage error: ', e);
	}
		
    }
    ajaxCall({url:url,postdata:postdata,callback:callbackAddCase,connection:'N'});
	
	
}

function insertIntoMycases(importedCnrNumbersArray){
    var strpost = encodeURIComponent(JSON.stringify(importedCnrNumbersArray));
    var url="portfolio/insertIntoMyCases/";
    var configuration = "D";
    if(importExportFor == "importHC") {
        configuration = "H"
    }
    $("#importCasesModal").modal('hide');
    // $("#importCasesModal").hide();
    // $(".modal-backdrop").remove();
    var postdata = "casesImported="+ strpost+"&configuration="+configuration;
    function callbackImportCases(obj){
        var casesNotAdded = importedCnrNumbersArray.length - obj.length;
        if(casesNotAdded > 0){
            errorAlert("Unable to add "+casesNotAdded+" cases");
        }
        getData();
		
        showHideDivsIfCasesExist();
        $(document).trigger("dashboardChange");
		$(document).trigger("calendarChange");		
    }
    ajaxCall({url:url,postdata:postdata,callback:callbackImportCases,connection:'N',loader:true});

}

function updateIntoMycases(importedCnrNumbersArray){
    var strpost = encodeURIComponent(JSON.stringify(importedCnrNumbersArray));
    var url="portfolio/updateIntoMyCases/";
    var configuration = "D";
    if(importExportFor == "importHC") {
        configuration = "H"
    }
    $("#importCasesModal").modal('hide');
    // $("#importCasesModal").hide();
    // $(".modal-backdrop").remove();
    var postdata = "casesImported="+ strpost+"&configuration="+configuration;
    function callbackImportCases(obj){
        
        getData();
        showHideDivsIfCasesExist();
        $(document).trigger("dashboardChange");
    }
    ajaxCall({url:url,postdata:postdata,callback:callbackImportCases,connection:'N',loader:true});

}


//This function refresh array of imported cnr numbers
function updateImportedCases(callbackfunction,cnrNumbers, importedCnrNumbersArray, importedFromFile) {
    //importedCnrNumbersArray = (casesImported);
    if (importedCnrNumbersArray !== null) {
     //   var cnrNumbers = "";
        /*for (var i = 0; i < importedCnrNumbersArray.length; i++) {
            var caseInfo = JSON.parse(importedCnrNumbersArray[i]);
            var cino = caseInfo.cino;//cnrNumbersArray[i];
            cnrNumbers += (i !== 0 ? "," : "") + cino;
        }*/
		if($('#sessionlangid').val()==1)
			bilingual = 1;
		else
			bilingual = 0;
        var encrypted_data4 = (localStorage.LANGUAGE_FLAG) ? (localStorage.LANGUAGE_FLAG) : "english";
        var encrypted_data5 = bilingual;
        var selectedcourt = "D";
        if(importExportFor == "importHC"){
            selectedcourt = "H";
        }
        var url = "portfolio/refreshMyCases/";
        var postdata = "cnr_numbers=" + (cnrNumbers) + "&action_code=" + ('list') + "&version_number=" + (window.sessionStorage.CURRENT_APP_VERSION) + "&language_flag=" + encrypted_data4.toString() + "&bilingual_flag=" + encrypted_data5.toString() + "&selected_court="+selectedcourt;

        function callbackRefreshImportedCases(obj) {
            data = obj;
            if (data.todaysCiNos) {
                var decoded_todaysCiNos = (data.todaysCiNos);
				if(importedCnrNumbersArray.length == decoded_todaysCiNos.length){
					casesRefreshed = true;
				}
                $.each(decoded_todaysCiNos, function (key, val) {
                    if (val) {
                        var index = importedCnrNumbersArray.containsSubStringOrHasSubstringOf(val.cino);
                        if (index != -1) {
                            var obj = {};
							if(importedFromFile){
								obj = JSON.parse(importedCnrNumbersArray[index]);
							}else{
								obj = importedCnrNumbersArray[index];
							}
                            var jsonobj = {};
                            jsonobj["type_name"] = val.type_name;
                            jsonobj["state_code"] = val.state_code;
                            jsonobj["district_code"] = val.district_code;
                            jsonobj["establishment_name"] = val.court_name;
                            jsonobj["establishment_code"] = val.est_code;
                            jsonobj["state_name"] = val.state_name;
                            jsonobj["district_name"] = val.district_name;
                            jsonobj["case_no"] = val.case_no;
                            jsonobj["reg_year"] = val.reg_year;
                            jsonobj["reg_no"] = val.reg_no;

                            //19-10-2020
                            jsonobj["fil_year"] = val.fil_year;
                            jsonobj["fil_no"] = val.fil_no;
                            //

                            jsonobj["date_next_list"] = val.date_next_list == "5000-01-01" ? "Date Not Given" : val.date_next_list;
                            jsonobj["date_last_list"] = val.date_last_list;
                            jsonobj["date_of_decision"] = val.date_of_decision;
                            jsonobj["updated"] = "";
                            jsonobj["desgname"] = val.courtno + "-" + val.desgname;
                            jsonobj["ltype_name"] = val.ltype_name;
                            jsonobj["pet_name"] = obj.petparty_name ? obj.petparty_name : obj.pet_name;
                            jsonobj["res_name"] = obj.resparty_name ? obj.resparty_name : obj.res_name;
                            jsonobj["lpet_name"] = val.lpet_name;
                            jsonobj["lres_name"] = val.lres_name;
                            jsonobj["lestablishment_name"] = val.lcourt_name;
                            jsonobj["lstate_name"] = val.lstate_name;
                            jsonobj["ldistrict_name"] = val.ldistrict_name;
                            jsonobj["ldesgname"] = val.courtno + "-" + val.ldesgname;
                            jsonobj["purpose_name"] = val.purpose_name;
                            jsonobj["lpurpose_name"] = val.lpurpose_name;
                            jsonobj["purpose_cd"] = val.purpose_next;
                            jsonobj["registration_date"] = val.dt_regis;
                            jsonobj["ci_cri"] = val.ci_cri;
                            jsonobj["cino"] = val.cino;
                            importedCnrNumbersArray[index] = (JSON.stringify(jsonobj));

                        }
                    }
                });
                callbackfunction(importedCnrNumbersArray);
            }
        }
        ajaxCall({url:url,postdata:postdata,callback:callbackRefreshImportedCases,loader:true});


    }
}


function onImportClick(){
	importedCnrNumbersArray = casesImported;
	var cnrNumbers = "";
	for (var i = 0; i < importedCnrNumbersArray.length; i++) {
		var caseInfo = JSON.parse(importedCnrNumbersArray[i]);
		var cino = caseInfo.cino;//cnrNumbersArray[i];
		cnrNumbers += (i !== 0 ? "," : "") + cino;
	}
    updateImportedCases(insertIntoMycases, cnrNumbers, casesImported, true);
}
function openImport(){
    // $("#importCasesModal").show();
    $("#importCasesModal").modal('show');
}

function openDelete(){
    // $("#importCasesModal").show();
    $("#deleteCasesModal").modal('show');
}

function onDeleteMycasesClick(){
    var url="portfolio/deleteMyCases/";
    var postdata = "";
    function callbackEST(obj){
        $("#deleteCasesModal").modal('hide');
        if(obj.option === 'success') {
            // updateAllCasesAcordion();
            //window.localStorage.setItem("CNR Numbers ef", "[]");
            //window.localStorage.setItem("CNR Numbers HC ef", "[]");
			CNR_Numbers_ef=[];
			CNR_Numbers_HC_ef=[];
            $(document).trigger("mycasesChange");
			$(document).trigger("dashboardChange");
			$(document).trigger("calendarChange");			
        }
    }
    ajaxCall({url:url,postdata:postdata,callback:callbackEST,connection:'N'});
}

// function importCancelClicked(){
//     $("#importCasesModal").modal('hide');
// }

// function exportCancelClicked(){
//     $("#exportCasesConfirm").modal('hide');
// }

function onExportClick(){
	
	//alert(CNR_Numbers_ef);
	$("#exportCasesConfirm").modal('show');
    createMyCasesToExport();
	 
	
	
    // alert("export");
}

$("input[name='radOpt-export']").change(function(){
    createMyCasesToExport();
});

function createMyCasesToExport(){
    var hcdcRadVal = $("input[name='radOpt-export']:checked").val();
    importExportFor = hcdcRadVal ;
	//alert(importExportFor);
	
    var textToExport = createJsonArrayToExport();
    var data = new Blob([textToExport], {type: 'text/plain'});
    var url = window.URL.createObjectURL(data);
    if(importExportFor == "exportDC") {
        $("#download_link").show();
        $("#download_link_hc").hide();
        document.getElementById('download_link').href = url;
    }else if(importExportFor == "exportHC") {
        $("#download_link").hide();
        $("#download_link_hc").show();
        document.getElementById('download_link_hc').href = url;
    }
}

function createJsonArrayToExport() {
	fetchmycaseData();
	//var aa=fetchmycaseData();
	//alert(aa.dcData);
    var caseInfoArray = [];
	
    if(importExportFor == "exportDC") {
        var text = CNR_Numbers_ef;
    }else if(importExportFor == "exportHC"){
        var text = CNR_Numbers_HC_ef;
    }
	//alert(CNR_Numbers_ef);
    var cnrNumbersArray = JSON.parse(text);
    for (var i = 0; i < cnrNumbersArray.length; i++) {
        var jsonObj = cnrNumbersArray[i];
        // }
        // var text1 = JSON.stringify(text);
        var jsonData = {};
        jsonData["cino"] = jsonObj.cino;
        jsonData["type_name"] = jsonObj.type_name;
        jsonData["case_no"] = jsonObj.case_no;
        jsonData["reg_year"] = jsonObj.reg_year;
        jsonData["reg_no"] = jsonObj.reg_no;
        jsonData["petparty_name"] = jsonObj.pet_name;
        jsonData["resparty_name"] = jsonObj.res_name;
        jsonData["fil_year"] = jsonObj.fil_year;
        jsonData["fil_no"] = jsonObj.fil_no;
        jsonData["establishment_name"] = jsonObj.establishment_name;
        jsonData["establishment_code"] = jsonObj.establishment_code;
        jsonData["state_code"] = jsonObj.state_code;
        jsonData["district_code"] = jsonObj.district_code;
        jsonData["state_name"] = jsonObj.state_name;
        jsonData["district_name"] = jsonObj.district_name;
        jsonData["date_next_list"] = jsonObj.date_next_list == "5000-01-01" ? "Date Not Given" : jsonObj.date_next_list;
        jsonData["date_of_decision"] = jsonObj.date_of_decision;
        jsonData["date_last_list"] = jsonObj.date_last_list;
        jsonData["updated"] = true;
        jsonData["court_no_desg_name"] = jsonObj.desg_name;

        jsonData["ltype_name"] = jsonObj.ltype_name;
        jsonData["lpetparty_name"] = jsonObj.lpet_name;
        jsonData["lresparty_name"] = jsonObj.lres_name;
        jsonData["lestablishment_name"] = jsonObj.lestablishment_name;
        jsonData["lstate_name"] = jsonObj.lstate_name;
        jsonData["ldistrict_name"] = jsonObj.ldistrict_name;
        jsonData["lcourt_no_desg_name"] = jsonObj.ldesgname;

        jsonData["updated"] = "";

        var caseInfoStr = JSON.stringify(jsonData);

        caseInfoArray.push(caseInfoStr);

    }
	exportArrTemp = caseInfoArray;
    var casesToExport = JSON.stringify(caseInfoArray);
    return casesToExport;
}

function downloadclicked(){
    $("#exportCasesConfirm").modal('hide');
	var hcdcRadVal = $("input[name='radOpt-export']:checked").val();
	//alert(hcdcRadVal);
	if(exportArrTemp.length==0 && hcdcRadVal == "exportHC"){
		//$("#download_link_hc").attr("disabled", false);
		$("#download_link_hc").attr("disabled", "disabled");
		$("#download_link_hc").removeAttr("href");
		errorAlert("No Cases to Export");
		return;
	}
	
	if(exportArrTemp.length==0 && hcdcRadVal == "exportDC"){		
		errorAlert("No Cases to Export");
		$("#download_link").attr("disabled", "disabled");
		$("#download_link").removeAttr("href");
		return;
	}	
}

function checkImportFile(e){
	var filename = e.target.files[0].name;
    var file = e.target.files[0];
    var hcdcRadVal = $("input[name='radOpt-import']:checked").val();
    importExportFor = hcdcRadVal ;
    if(hcdcRadVal == "importDC" && filename != "myCases.txt"){
        errorAlert("Please select file myCases.txt");
        $("#myCasesFile1").val("");
        $("#myCasesFile1").attr('placeholder',"Choose file");
        return;
    }else if(hcdcRadVal == "importHC" && filename != "hcMyCases.txt"){
        errorAlert("Please select file hcMyCases.txt");
        $("#myCasesFile1").val("");
        $("#myCasesFile1").attr('placeholder',"Choose file");
        return;
    }else {
        var reader = new FileReader();
        reader.onload = function (e) {
				alert(0);
            if (reader.result == null) {
				alert(1);
                showErrorMessage("File " + fileName + " Not Found");
            } else {
				alert(2);
                var result = "";
                try {
                    result = JSON.parse(reader.result);
                } catch (err) {
                    errorAlert("Incorrect file format");
                    return;
                }
                $("#importCases").attr("disabled", false);
                casesImported = result;

            }
        }

        reader.readAsText(file);
    }
}

$("#myCasesFile1").change(function (e) {
    var filename = e.target.files[0].name;
    var file = e.target.files[0];
    var hcdcRadVal = $("input[name='radOpt-import']:checked").val();
    importExportFor = hcdcRadVal ;
    if(hcdcRadVal == "importDC" && filename != "myCases.txt"){
        errorAlert("Please select file myCases.txt");
        $("#myCasesFile1").val("");
        $("#myCasesFile1").attr('placeholder',"Choose file");
        return;
    }else if(hcdcRadVal == "importHC" && filename != "hcMyCases.txt"){
        errorAlert("Please select file hcMyCases.txt");
        $("#myCasesFile1").val("");
        $("#myCasesFile1").attr('placeholder',"Choose file");
        return;
    }else {
        var reader = new FileReader();
        reader.onload = function (e) {
				//alert(0);
            if (reader.result == null) {
				alert(1);
                showErrorMessage("File " + fileName + " Not Found");
            } else {
				//alert(2);
                var result = "";
                try {
                    result = JSON.parse(reader.result);
                } catch (err) {
                    errorAlert("Incorrect file format");
                    return;
                }
                $("#importCases").attr("disabled", false);
                casesImported = result;
            }
        }
        reader.readAsText(file);
    }
});

function showHideDivsIfCasesExist(){
    $("#showCaseDiv").hide();
    $("#searchInMyCasesDivId").hide();
    $("#tr_case1").hide();
    $("#pendingDisposedDiv").hide();
    $("#datewiseDistrictwiseDiv").hide();
    $("#highcourtcasestxt").hide();
    $("#districtcourtcasestxt").hide();
    $("#nocasestxt").show();
    if((cnrNumbersArray) || (hccnrNumbersArray)) {
        if ((cnrNumbersArray !== null) && (cnrNumbersArray.length != 0)) {
            $("#showCaseDiv").show();
            $("#searchInMyCasesDivId").show();
            $("#tr_case1").show();
            $("#pendingDisposedDiv").show();
            $("#datewiseDistrictwiseDiv").show();
            $("#districtcourtcasestxt").show();
            $("#nocasestxt").hide();
            $("#addextrapartypet").show();
        }

        if ((hccnrNumbersArray !== null) && (hccnrNumbersArray.length != 0)) {
            $("#showCaseDiv").show();
            $("#searchInMyCasesDivId").show();
            $("#tr_case1").show();
            $("#pendingDisposedDiv").show();
            $("#tr_case1").show();
            $("#datewiseDistrictwiseDiv").show();
            $("#highcourtcasestxt").show();
            $("#nocasestxt").hide();
            $("#addextrapartypet").show();

        }
    }
}


Array.prototype.containsSubStringOrHasSubstringOf = function( text ){
    for ( var i = 0; i < this.length; ++i )
    {
        if (    this[i].toString().indexOf( text.toString() ) != -1
            || text.toString().indexOf( this[i].toString() ) != -1 )
            return i;
    }
    return -1;
}

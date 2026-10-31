$(document).ready(function(){
      $("#toggleBtn").click(function(){
      if($('#currentPage').val()==1)
		  getCategory2();
	  else if($('#currentPage').val()==2)
		  getCategory1();
      });
	  
   
	getCategory1();

	setInterval(function(){
      getCategory2();
	  setTimeout(function(){
	  getCategory1();
	  },20000)
    }, 40000);
	

	setInterval(function(){
      const d = new Date();
	  const date_format = { day: '2-digit', month: '2-digit', year: 'numeric' };
      document.getElementById("date").innerHTML = d.toLocaleDateString('en-GB', date_format);
      document.getElementById("time").innerHTML = d.toLocaleTimeString();
      document.getElementById("day").innerHTML = d.toLocaleString('en-us', {weekday: 'long'});
    }, 100);


	var labels_array;
	var buttons_array;
	var alerts_array;
	$('.sidebar-nav').height($(window).height())-50;

	    $('[type="submit"]').attr('type', 'button');

    var hasErrors = $('#pageData').data('has-errors');

    if (hasErrors === true || hasErrors === 'true') {
        $('#successIcon').addClass('d-none');
        $('#errorIcon').removeClass('d-none');
        $('#validateError').modal('show');
    }
 });

 /*document.getElementById("fest_code").addEventListener("click", function () {
    getCount(this.values, 'S');
});*/

/* function getCount(val,type)
 {
	if($('#currentPage').val()==1)
		getCategory1(type);
	else if($('#currentPage').val()==2)
		getCategory2(type);
      
 }*/

 function getCount(val, type) {
    if ($('#currentPage').val() == 1) {
        getCategory1(type);
    } else if ($('#currentPage').val() == 2) {
        getCategory2(type);
    }
}

$(document).ready(function () {
	$('#fstate_code').on('change', function () {
        getCount(this.value, 'S');
    });
	$('#fdist_code').on('change', function () {
        getCount(this.value, 'D');
    });
	$('#fest_code').on('change', function () {
        getCount(this.value, 'E');
    });
});

function getCategory1(type="")
{
	if(type=='S')
	{
		$('#fdist_code').val(null);
		$('#fest_code').val(null);
	}
	if(type=='D')
	{
		$('#fest_code').val(null);
	}
	var fstate_code=$('#fstate_code').val();
	var fdist_code=$('#fdist_code').val();
	var fest_code=$('#fest_code').val();
	if(fstate_code==null)
		fstate_code='';
	if(fdist_code==null)
		fdist_code='';
	if(fest_code==null)
		fest_code='';
	var url='home/getCategory1';
	var postdata='fstate_code='+fstate_code+'&fdist_code='+fdist_code+'&fest_code='+fest_code;
	//alert(postdata)
	ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
	function callback(result)
	{
		if(result.status)
		{
			if(result.state_name!='')
				$("#sp_state").html(result.state_name);
			if(result.state_opt!='' && fstate_code=='')
				$("#fstate_code").html(result.state_opt);
			if(result.dist_opt!='' && fdist_code=='')
				$("#fdist_code").html(result.dist_opt);
			if(result.est_opt!='' && fest_code=='')
				$("#fest_code").html(result.est_opt);
			$("#div_cat").html(result.str);
			$('#currentPage').val(1);
			$('#title').html('INSTITUTION, DISPOSAL & CASE CLEARANCE RATE');
			
		}
		
	}
}
function getCategory2(type="")
{
	if(type=='S')
	{
		$('#fdist_code').val(null);
		$('#fest_code').val(null);
	}
	if(type=='D')
	{
		$('#fest_code').val(null);
	}
	var url='home/getCategory2';
	var fstate_code=$('#fstate_code').val();
	var fdist_code=$('#fdist_code').val();
	var fest_code=$('#fest_code').val();
	if(fstate_code==null)
		fstate_code='';
	if(fdist_code==null)
		fdist_code='';
	if(fest_code==null)
		fest_code='';
	
	var url='home/getCategory2';
	var postdata='fstate_code='+fstate_code+'&fdist_code='+fdist_code+'&fest_code='+fest_code;
	ajaxCall({url:url,postdata:postdata,callback:callback,loader:false});
	function callback(result)
	{
		if(result.status)
		{
			if(result.state_name!='')
				$("#sp_state").html(result.state_name);
			if(result.state_opt!='' && fstate_code=='')
				$("#fstate_code").html(result.state_opt);
			if(result.dist_opt!='' && fdist_code=='')
				$("#fdist_code").html(result.dist_opt);
			if(result.est_opt!='' && fest_code=='')
				$("#fest_code").html(result.est_opt);
			$("#div_cat").html(result.str);
			
			$('#currentPage').val(2);
			$('#title').html('AGEWISE PENDENCY & LISTED TODAY');
		}
		
	}
}

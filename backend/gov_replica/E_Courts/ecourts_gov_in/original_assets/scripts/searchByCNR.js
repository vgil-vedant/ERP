$(document).ready(function () {
$('.sidebarMainMenu .nav-link').removeAttr('aria-current');
$("#leftPaneMenuCnr").attr("aria-current", "page");
	$('#cino, #fcaptcha_code').on('input', function () {
    $(this).val($(this).val().replace(/[^a-zA-Z0-9 ]/g, ''));
  });
});


function funViewCinoHistory()
{
		$('#history_cnr').show();
		var cino = $("#cino").val();
		$('#history_cnr').html('');
		var fcaptcha_code=$('#fcaptcha_code').val();
	/*	if(fcaptcha_code=='')
		{
			
			errorAlert(alerts_array[475]);
			return false;
		}*/
		var cinolen=cino.length;

     		if(cinolen !=16 )
    		{
       			errorAlert(alerts_array[262]);    
      			return false;
    		}

		 if(fcaptcha_code=='')
                {

                        errorAlert(alerts_array[475]);
                        return false;
                }

    		//var cino = cino.toUpperCase();
    		/*if(cino=='0000000000000000')
   		 {
      			errorAlert("Enter valid CNR Number");
      			return false;

   		 }
    		if(cino!="")
    		{
      			if (!cino.match(/^[a-zA-Z0-9]+$/) && cino!="")
      		{
        		errorAlert(alerts_array[263]);        
        		return false;
        
      		}	
   		 }	*/
		var url="cnr_status/searchByCNR/";	
		var postdata = "cino="+ cino+"&fcaptcha_code="+fcaptcha_code ;			
		ajaxCall({url:url,postdata:postdata,callback:callbackEST});
		$('#cnr_div').hide();
		$('#help_cnr').hide();
		$('#main_back_cnr').show();
		function callbackEST(result)
		{
			$('#history_cnr').html('');

			$('#div_captcha_cnr').html(result.div_captcha);		
			if(result.status==0)
	
			{
				$('#cino').val('');
				$("#fcaptcha_code").val('');
				captcha_image_audioObj.refresh();
				document.getElementById('captcha_image').src = 'vendor/securimage/securimage_show.php? ' + Math.random(); this.blur();
				return false;
				}
				else if(result.status==1)
			{
				$('#history_cnr').html(result.casetype_list);
				$('#cino').val('');
				$("#fcaptcha_code").val('');
				$('#main_back_cnr').show();
				$('#cnr_div').hide();

			}else{
				 $('#history_cnr').html(result.casetype_list);

			}
		/*	if(result.casetype_list=='' || result.casetype_list==null)
			{
					$('#history_cnr').html('<div align="center"><br><br><span>This Case Code does not exists</span></div>');
			}else{
					$('#history_cnr').html(result.casetype_list);
					$('#main_back_cnr').show();
					$('#cnr_div').hide();
			}*/
		}
	
}
function resetCNR() {

    $('#cino').val('');
    $('#fcaptcha_code').val('');
    if (typeof captcha_image_audioObj !== 'undefined' && captcha_image_audioObj.refresh) {
        captcha_image_audioObj.refresh();
    }
    var captchaImg = document.getElementById('captcha_image');
    if (captchaImg) {
        captchaImg.src = 'vendor/securimage/securimage_show.php?' + Math.random();
    }

    // Clear first so screen readers re-announce
  	$('#sr-alert').text('');

  	setTimeout(function () {
    		$('#sr-alert').text('Form has been reset');
  	}, 100);	
}


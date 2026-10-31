$(document).ready(function () {
    $(".loader").fadeOut("slow");
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('#back-to-top').fadeIn();
        } else {
            $('#back-to-top').fadeOut();
        }
    });
    // scroll body to 0px on click
    $('#back-to-top').click(function () {
        $('#back-to-top').tooltip('hide');
        $('body,html').animate({
            scrollTop: 0
        }, 800);
        return false;
    });

    $('#back-to-top').tooltip('show');

});


//$(document).ready(function () {
//    $('.counter-value').each(function () {
//        $(this).prop('Counter', 0).animate({
//            Counter: $(this).text()
//        }, {
//            duration: 3500,
//            easing: 'swing',
//            step: function (now) {
//                $(this).text(now);
//            }
//        });
//    });
//});
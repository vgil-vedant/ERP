// $(document).ready(function() { 
//     const body = document.body;
//     const button = document.getElementById('Highcontrast');
//     $('#incresefont').click(function(){	   
//         curSize= parseInt($('body').css('font-size')) + 2;
//     if(curSize<=22)
//         $('body').css('font-size', curSize);
//         });  

//     $('#decresefont').click(function(){	   
//         curSize= parseInt($('body').css('font-size')) - 2;
//     if(curSize>=12)
//         $('body').css('font-size', curSize);
//         }); 

//     $("#normalfont").click(function(){
//     curSize= 14;
//     $("body").css("font-size",curSize);
//     });
// });

// if (sessionStorage.getItem('isInverted') === 'true') {
//     body.classList.add('inverted');
// }

// // Toggle invert mode on button click
// button.addEventListener('click', () => {
//     alert("Aditya");
//     body.classList.toggle('inverted');
//     // Save the current state
//     const isInverted = body.classList.contains('inverted');
//     sessionStorage.setItem('isInverted', isInverted);
// });



$(document).ready(function() {
    const body = document.body;
    const button = document.getElementById('Highcontrast');

    // Restore previous contrast state
    if (sessionStorage.getItem('isInverted') === 'true') {
        body.classList.add('inverted');
    }

    // Font size handlers
    $('#incresefont').on('click', function(e){
        e.preventDefault();
        let curSize = parseInt($('body').css('font-size'), 10) + 2;
        if (curSize <= 22) $('body').css('font-size', curSize + 'px');
    });

    $('#decresefont').on('click', function(e){
        e.preventDefault();
        let curSize = parseInt($('body').css('font-size'), 10) - 2;
        if (curSize >= 12) $('body').css('font-size', curSize + 'px');
    });

    $('#normalfont').on('click', function(e){
        e.preventDefault();
        $('body').css('font-size', '14px');
    });

    // Contrast toggle — guard in case element is missing
    if (button) {
        button.addEventListener('click', function(e){
            e.preventDefault();
            body.classList.toggle('inverted');
            sessionStorage.setItem('isInverted', body.classList.contains('inverted'));
        });
    } else {
        // optional: console.warn('Highcontrast element not found');
    }
});
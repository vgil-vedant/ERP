(function($) {
  "use strict"; // Start of use strict

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 54)
        }, 1000, "easeInOutExpo");
        return false;
      }
    }
  });

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
  /*$('body').scrollspy({
    target: '#mainNav1',
    offset: 56
  });*/

	$('#nav-menu li a').on('click', function(){
		$('#nav-menu li a.Menuactive').removeClass('Menuactive');
		$(this).addClass('Menuactive');
	});

    // Scroll to top button appear
    $(document).on('scroll', function() {
      var scrollDistance = $(this).scrollTop();
      if (scrollDistance > 100) {
        $('.scroll-to-top').fadeIn();
      } else {
        $('.scroll-to-top').fadeOut();
      }
    });
      // Smooth scrolling using jQuery easing
  $(document).on('click', 'a.scroll-to-top', function(e) {
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top)
    }, 1000, 'easeInOutExpo');
    e.preventDefault();
  });

  // Collapse Navbar
  var navbarCollapse = function() {
    /*if ($("#mainNav1").offset().top > 100) {
      $("#mainNav1").addClass("navbar-shrink");
    } else {
      $("#mainNav1").removeClass("navbar-shrink");
    }
	if ($("#mainNav").offset().top > 100) {
      $("#mainNav").addClass("navbar-shrink");
    } else {
      $("#mainNav").removeClass("navbar-shrink");
    }*/
  };
  // Collapse now if page is not at top
  //navbarCollapse();
  // Collapse the navbar when page is scrolled
  $(window).scroll(navbarCollapse);

})(jQuery); // End of use strict

$(document).on('draw.dt', function () {

    $('.paginate_button.disabled')
        .attr('tabindex', '-1')
        .blur();

    $('.paginate_button.current')
        .attr({
            'aria-current': 'page',
            'tabindex': '0'
    });

    $('#example1_paginate, #example_paginate, #DataTables_Table_1_paginate, #DataTables_Table_0_paginate, #example3_paginate, #example3')
        .attr('aria-label', 'Pagination')
		.attr('role', 'region');
	
    $('.paginate_button.previous')
        .attr('aria-label', 'Go to previous page');

    $('.paginate_button.next')
        .attr('aria-label', 'Go to next page');

    $('#example3_wrapper')
        .attr('aria-label', 'Search')
		    .attr('role', 'navigation');
});


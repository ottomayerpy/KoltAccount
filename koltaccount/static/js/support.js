$(function() {
    $('.simple-tabs').on('click', function() {
        $('.swiper-container div').removeClass('active');
        $('.swiper-container div[data-tabs="' + $(this).attr('data-tabs-id') + '"]').addClass('active');
    });

    $('.simple-tabs').on('click', function() {
        $('html, body').animate({
            scrollTop: $('.swiper-container').offset().top - 60
        }, {
            duration: 370, // по умолчанию «400»
            easing: "linear" // по умолчанию «swing»
        });

        return false;
    });
});
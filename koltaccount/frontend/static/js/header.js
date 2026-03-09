$(document).ready(function() {
    const $toggle = $('.mobile-menu-toggle');
    const $mobileNav = $('.mobile-nav');
    
    $toggle.on('click', function() {
        $(this).toggleClass('active');
        $mobileNav.toggleClass('active');
    });
    
    // Закрыть меню при клике на ссылку
    $('.mobile-nav .nav-link').on('click', function() {
        $toggle.removeClass('active');
        $mobileNav.removeClass('active');
    });
});

$(document).ready(function () {
    const $toggle = $('.k-mobile-menu-toggle');
    const $mobileNav = $('.k-mobile-nav');

    $toggle.on('click', function () {
        $(this).toggleClass('active');
        $mobileNav.toggleClass('active');
    });

    // Закрыть меню при клике на ссылку
    $('.k-mobile-nav .k-mobile-link').on('click', function () {
        $toggle.removeClass('active');
        $mobileNav.removeClass('active');
    });

    // Закрыть при клике вне меню (опционально)
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.k-mobile-nav, .k-mobile-menu-toggle').length) {
            $toggle.removeClass('active');
            $mobileNav.removeClass('active');
        }
    });

    $('.k-dropdown-toggle').on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Закрываем все другие dropdown
        $('.k-dropdown').not($(this).closest('.k-dropdown')).removeClass('active');

        // Открываем/закрываем текущий
        $(this).closest('.k-dropdown').toggleClass('active');
    });

    // Закрыть dropdown при клике вне его
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.k-dropdown').length) {
            $('.k-dropdown').removeClass('active');
        }
    });
});

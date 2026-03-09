$(document).ready(function() {
    const $body = $('body');
    const $tablesorter = $('.tablesorter');
    const $toggle = $('#theme-toggle');
    const $icon = $toggle.find('.theme-toggle__icon');

    function animateThemeToggle() {
        $toggle.addClass('spin');
        setTimeout(() => {
            $toggle.removeClass('spin');
        }, 600);
    }

    function setTheme(theme) {
        if (theme === 'dark') {
            $tablesorter.removeClass('tablesorter-blue').addClass('tablesorter-dark');
            $body.addClass('dark-theme');
            $icon.text('☀️');
        } else {
            $tablesorter.removeClass('tablesorter-dark').addClass('tablesorter-blue');
            $body.removeClass('dark-theme');
            $icon.text('🌙');
        }
        localStorage.setItem('siteTheme', theme);
    }

    const savedTheme = localStorage.getItem('siteTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    }

    $toggle.on('click', function() {
        const isDark = $body.hasClass('dark-theme');
        animateThemeToggle();
        setTheme(isDark ? 'light' : 'dark');
    });
});

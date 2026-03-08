$(document).ready(function() {
    const $window = $(window);
    const $button = $('.scrollup-wrapper .scrollup-btn');
    const $htmlBody = $('html, body');
    const SCROLL_THRESHOLD = 300;
    const ANIMATION_SPEED = 600;
    
    if (!$button.length) return;
    
    let ticking = false;
    
    $window.on('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                $button.toggleClass('visible', $window.scrollTop() > SCROLL_THRESHOLD);
                ticking = false;
            });
            ticking = true;
        }
    });
    
    $button.on('click', function(e) {
        e.preventDefault();
        if ($window.scrollTop() === 0) return;
        $htmlBody.stop().animate({ scrollTop: 0 }, ANIMATION_SPEED);
    });
    
    $window.trigger('scroll');
});

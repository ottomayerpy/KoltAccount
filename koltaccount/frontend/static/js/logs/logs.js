$(function() {
    $('#in-search_type').on('keyup', function() {
        /* Событие отжатия клавиши (Ввода текста в поле поиска) */
        search($(this).val(), 'type');
    });

    $('#in-search_user').on('keyup', function() {
        /* Событие отжатия клавиши (Ввода текста в поле поиска) */
        search($(this).val(), 'user');
    });

    $('#in-search_date').on('keyup', function() {
        /* Событие отжатия клавиши (Ввода текста в поле поиска) */
        search($(this).val(), 'date');
    });

    function search(value, label) {
        let log = $('.js-log_item');
        if (value == '') {
            log.fadeIn(100);
        } else {
            let td = $('.js-log_item .js-' + label + ':contains(' + value + ')');
            log.fadeOut(100);
            td.parent().parent().fadeIn(100);
        }
    }
});

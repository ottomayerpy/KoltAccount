/* Форма изменения почты */

$(function() {
    let pattern_email = /^[a-z0-9_-]+@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/i,
        is_email = false;

    $('#id_email').on('input', function() {
        /* Валидация почты */
        if ($(this).val().search(pattern_email) == 0) {
            $(this).removeClass('input-invalid');
            is_email = true;
        } else {
            $(this).addClass('input-invalid');
            is_email = false;
        }
    });

    $('form').on('submit', function() {
        if (!is_email) {
            return false;
        }
    });
});
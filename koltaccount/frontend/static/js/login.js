/* Авторизация */

$(function() {
    $('.js-show_password').on('click', function() {
        /* Показать пароль в поле ввода пароля */
    	password = $('#id_password');
        password.attr('type', password.attr('type') === 'password' ? 'text' : 'password');
    });
});
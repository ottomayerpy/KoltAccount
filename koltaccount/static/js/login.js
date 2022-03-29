/* Авторизация */

$(function() {
    $('.js-show_password').on('click', function() {
        /* Показать пароль в поле ввода пароля */
    	password = $('#id_password');
        password.attr('type', password.attr('type') === 'password' ? 'text' : 'password');
    });

    // Получаем информацию о пользователе

    let system = browserInfo.os,
    	browser = browserInfo.browser + ' ' + browserInfo.browserMajorVersion;

    if (browserInfo.osVersion != 'Unknown') {
    	system += ' ' + browserInfo.osVersion
    }

    $('#id_system').val(system);
    $('#id_browser').val(browser);
});
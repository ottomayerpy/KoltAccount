/* Обработчик сообщений форм */

$(function() {
    let form_message = $('#form_message').val(),
        password_change_error = $('#error_1_id_old_password strong').text();

    if (form_message) {
        switch (form_message) {
            case 'None':
                break;

                // lk.html
            case 'email confirm complite':
                swal('Успех', 'На указанную почту отправленно письмо, с инструкцией по подтверждению.');
                break;

                // login.html
            case 'Login error':
                swal('Ошибка', 'Пожалуйста, введите правильные имя пользователя и пароль. Оба поля могут быть чувствительны к регистру.');
                break;

                // master_password_reset.html
            case 'Password is not valid':
                swal('Ошибка', 'Введенный пароль не верный.');
                break;

                // registration/register.html
            case 'username error':
                swal('Ошибка', 'Введенное имя уже используейтся, введите другое.');
                break;
            case 'broken rule [pass == pass2]':
                swal('Ошибка валидации', 'Пароли не совпадают');
                break;
            case 'broken rule [len > 8]':
                swal('Ошибка валидации', 'Длинна пароля должна быть больше 8 символов');
                break;
            case 'broken rule [a-z]':
                swal('Ошибка валидации', 'Пароль должен содержать как минимум одну маленькую букву');
                break;
            case 'broken rule [A-Z]':
                swal('Ошибка валидации', 'Пароль должен содержать как минимум одну заглавную букву');
                break;
            case 'broken rule [0-9]':
                swal('Ошибка валидации', 'Пароль должен содержать как минимум одну цифру');
                break;

            default:
                swal('Критическая ошибка', error);
                break;
        }
    }

    // password_change_form.html
    if (password_change_error) {
        switch (password_change_error) {
            case 'Ваш старый пароль введен неправильно. Пожалуйста, введите его снова.':
                swal('Ошибка', password_change_error);
                break;
            default:
                swal('Критическая ошибка', password_change_error);
                break;
        }
    }
});
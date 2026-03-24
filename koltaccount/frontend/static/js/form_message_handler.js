/* Обработчик сообщений форм */

$(function () {
    let form_message = $("#form_message").val(),
        password_change_error = $("#error_1_id_old_password strong").text();

    if (form_message) {
        switch (form_message) {
            case "None":
                break;

            // lk.html
            case "email confirm complite":
                swal("Успех", "На указанную почту отправленно письмо, с инструкцией по подтверждению.", "success");
                break;

            // login.html
            case "Login error":
                swal("Ошибка", "Введите правильные имя пользователя и пароль. Оба поля могут быть чувствительны к регистру.", "warning");
                break;

            // master_password_reset.html
            case "Password is not valid":
                swal("Ошибка", "Введенный пароль не верный.", "warning");
                break;

            // registration/register.html
            case "username error":
                swal("Ошибка", "Пользователь с таким именем уже существует", "warning");
                break;
            case "registration error":
                swal("Ошибка", "Произошла ошибка при регистрации. Попробуйте позже.", "error");
                break;
            case "broken rule [password == repeat_password]":
                swal("Ошибка", "Пароли не совпадают", "warning");
                break;
            case "broken rule [len > 8]":
                swal("Ошибка", "Длина пароля должна быть больше 8 символов", "warning");
                break;
            case "broken rule [a-z]":
                swal("Ошибка", "Пароль должен содержать как минимум одну маленькую букву", "warning");
                break;
            case "broken rule [A-Z]":
                swal("Ошибка", "Пароль должен содержать как минимум одну заглавную букву", "warning");
                break;
            case "broken rule [0-9]":
                swal("Ошибка", "Пароль должен содержать как минимум одну цифру", "warning");
                break;

            default:
                swal("Критическая ошибка", error, "error");
                break;
        }
    }

    // password_change_form.html
    if (password_change_error) {
        switch (password_change_error) {
            case "Ваш старый пароль введен неправильно. Пожалуйста, введите его снова.":
                swal("Ошибка", password_change_error, "warning");
                break;
            default:
                swal("Критическая ошибка", password_change_error, "error");
                break;
        }
    }
});

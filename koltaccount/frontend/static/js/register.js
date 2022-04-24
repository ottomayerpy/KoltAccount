/* Регистрация */

$(function() {
    let username = $('#in-hide-username').val(),
        email = $('#in-hide-email').val();

    $('#id_username').val(username);
    $('#id_email').val(email);

    let pattern_email = /^[a-z0-9_-]+@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/i,

        is_email = false,
        is_password = false,
        is_password2 = false,

        is_form_submit = false;

    $('#id_email').on('input', function() {
        if ($(this).val().search(pattern_email) == 0) {
            $(this).removeClass('input-invalid');
            is_email = true;
        } else {
            $(this).addClass('input-invalid');
            is_email = false;
        }
    });

    $('.js-show_password').on('click', function() {
        /* Показать пароль в поле ввода пароля */
        password = $('#id_password1');
        password.attr('type', password.attr('type') === 'password' ? 'text' : 'password');
    });

    $('form').on('submit', function() {
        preload_show();
        let username = $("#id_username").val();

        if (!is_form_submit) {
            $.ajax({
                url: 'check_username/',
                type: 'POST',
                data: {
                    username: username
                },
                success: function(result) {
                    if (result['status'] == 'success') {
                        let is_exist_username = result['is_exist_username'];

                        if ($('#id_username').val() == '') {
                            swal("Ошибка!", 'Заполните поле "Имя".');
                        } else if (is_exist_username) {
                            swal("Ошибка", 'Введенное имя уже используейтся, введите другое.');
                        } else if (!is_email) {
                            $('#id_email').addClass('input-invalid');
                        } else if (!is_password) {
                            $('#id_password1').addClass('input-invalid');
                        } else if (is_password2) {
                            is_form_submit = true;
                            $('form').submit();
                        }

                        preload_hide();
                    } else {
                        preload_hide();
                        swal('Ошибка!', res['result']);
                    }
                },
                error: function(jqXHR, text, error) {
                    if (error == 'Forbidden') {
                        swal(
                            'Ошибка 403',
                            'Этот сайт требует наличия файла cookie CSRF при отправке форм.' +
                            ' Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie,' +
                            ' включите их снова, по крайней мере, для этого сайта.'
                        )
                        preload_hide();
                    }
                }
            });

            return false;
        }
    });

    $('.js-generate_password').on('touchstart mousedown', function() {
        /* Генерация пароля для поля ввода пароля */
        let params = {
            //score: // (number) - Надежность пароля (диапазон 1-4)
            //reliabilityPercent: // - Надежность пароля в % (диапазон 1-100)
            letters: 4, // (number) - Количество букв в пароле
            lettersUpper: 3, // (number) - Количество заглавных букв в пароле
            numbers: 3, // (number) - Количество цифр в пароле
            //symbols: // (number) - Количество спец. символов в пароле
        }
        let password = PassGenJS.getPassword(params);
        $('#id_password1').val(password);
        swal('Генератор', 'Ваш пароль: ' + password + '\nСтарайтесь избегать хранения паролей на электронных устройствах в открытом виде.');
        check_password_is_correct();
    });

    $('#id_password1').on('input', function() {
        check_password_is_correct();
    }).focus(function() {
        $('#password_info').show();
    }).blur(function() {
        $('#password_info').hide();
    });

    $('#id_password2').on('input', function() {
        check_password2_is_correct();
    });

    function check_password_is_correct() {
        /* Проверить правильность пароля */
        let password = $('#id_password1').val(),

            is_length = false,
            is_letter = false,
            is_capital = false,
            is_number = false;

        if (password.length < 8) {
            $('#length').removeClass('valid').addClass('invalid');
            is_length = false;
        } else {
            $('#length').removeClass('invalid').addClass('valid');
            is_length = true;
        }

        if (password.match(/[a-z]/)) {
            $('#letter').removeClass('invalid').addClass('valid');
            is_letter = true;
        } else {
            $('#letter').removeClass('valid').addClass('invalid');
            is_letter = false;
        }

        if (password.match(/[A-Z]/)) {
            $('#capital').removeClass('invalid').addClass('valid');
            is_capital = true;
        } else {
            $('#capital').removeClass('valid').addClass('invalid');
            is_capital = false;
        }

        if (password.match(/[0-9]/)) {
            $('#number').removeClass('invalid').addClass('valid');
            is_number = true;
        } else {
            $('#number').removeClass('valid').addClass('invalid');
            is_number = false;
        }

        if (is_length && is_letter && is_capital && is_number) {
            $('#id_password1').removeClass('input-invalid');
            is_password = true;
        } else {
            $('#id_password1').addClass('input-invalid');
            is_password = false;
        }

        check_password2_is_correct();

    }

    function check_password2_is_correct() {
        /* Проверить правильность второго пароля */
        let password = $('#id_password1').val(),
            password2 = $('#id_password2').val();

        if (password == password2) {
            $('#id_password2').removeClass('input-invalid');
            is_password2 = true;
        } else {
            $('#id_password2').addClass('input-invalid');
            is_password2 = false;
        }
    }
});
/* Валидация полей для ввода пароля */

$(function() {
	$('#hint_id_new_password1').css('display', 'none');

	let is_password = false,
        is_password2 = false;

	$('form').on('submit', function() {
		if (!(is_password && is_password2)) {
			return false;
		}
	});

	$('#id_new_password1').on('input', function() {
        check_password();
    }).focus(function() {
        $('#password_info').show();
    }).blur(function() {
        $('#password_info').hide();
    });

    $('#id_new_password2').on('input', function() {
        check_password2();
    });

    function check_password() {
        let password = $('#id_new_password1').val(),

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
            $('#id_new_password1').removeClass('input-invalid');
            is_password = true;
        } else {
            $('#id_new_password1').addClass('input-invalid');
            is_password = false;
        }

        check_password2();

    }

    function check_password2() {
        let password = $('#id_new_password1').val(),
            password2 = $('#id_new_password2').val();

        if (password == password2) {
            $('#id_new_password2').removeClass('input-invalid');
            is_password2 = true;
        } else {
            $('#id_new_password2').addClass('input-invalid');
            is_password2 = false;
        }
    }
});
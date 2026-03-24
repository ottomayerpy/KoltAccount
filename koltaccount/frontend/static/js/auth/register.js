/* Регистрация */

$(function () {
    // DOM элементы
    const $username = $("#id_username");
    const $email = $("#id_email");
    const $password = $("#id_password");
    const $repeatPassword = $("#id_repeat_password");

    // Состояния
    let isEmailValid = false;
    let isPasswordValid = false;
    let isRepeatPasswordValid = false;
    let isFormSubmitting = false;

    // Восстанавливаем значения из скрытых полей (если есть)
    $username.val($("#in-hide-username").val());
    $email.val($("#in-hide-email").val());

    // Регулярка для проверки формата email
    const EMAIL_PATTERN = /^[a-z0-9_-]+@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/i;

    // Валидация формата email
    $email.on("input", function () {
        isEmailValid = EMAIL_PATTERN.test($(this).val());
        $(this).toggleClass("input-invalid", !isEmailValid);
    });

    // Показать/скрыть пароль
    $(".js-show_password").on("click", function () {
        const type = $password.attr("type") === "password" ? "text" : "password";
        $password.attr("type", type);
    });

    // Генерация пароля
    $(".js-generate_password").on("touchstart mousedown", function () {
        const password = PassGenJS.getPassword({
            letters: 4,
            lettersUpper: 3,
            numbers: 3,
        });
        $password.val(password);
        swal("Генератор", `Ваш пароль: ${password}\nСтарайтесь избегать хранения паролей на электронных устройствах в открытом виде.`, "info");
        validatePassword();
    });

    // Валидация пароля
    $password
        .on("input", validatePassword)
        .focus(() => $("#password_info").show())
        .blur(() => $("#password_info").hide());

    // Валидация повторного пароля
    $repeatPassword.on("input", validateRepeatPassword);

    function validatePassword() {
        const password = $password.val();
        const rules = {
            length: password.length >= 8,
            letter: /[a-z]/.test(password),
            capital: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
        };

        // Обновляем UI
        updateRuleStatus("#length", rules.length);
        updateRuleStatus("#letter", rules.letter);
        updateRuleStatus("#capital", rules.capital);
        updateRuleStatus("#number", rules.number);

        // Общая валидность
        isPasswordValid = Object.values(rules).every(Boolean);
        $password.toggleClass("input-invalid", !isPasswordValid);

        // Перепроверяем повторный пароль
        validateRepeatPassword();
    }

    function validateRepeatPassword() {
        const isValid = $password.val() === $repeatPassword.val();
        isRepeatPasswordValid = isValid;
        $repeatPassword.toggleClass("input-invalid", !isValid);
    }

    function updateRuleStatus(selector, isValid) {
        const $el = $(selector);
        $el.removeClass("valid invalid").addClass(isValid ? "valid" : "invalid");
    }

    // Отправка формы
    $("form").on("submit", function (e) {
        if (isFormSubmitting) return;

        preloadShow();

        const username = $username.val().trim();

        if (!username) {
            swal('Заполните поле "Имя"', "", "info");
        } else if (!isEmailValid) {
            $email.addClass("input-invalid");
        } else if (!isPasswordValid) {
            $password.addClass("input-invalid");
        } else if (isRepeatPasswordValid) {
            isFormSubmitting = true;
            return true; // Отправляем форму
        }

        preloadHide();
        return false;
    });
});

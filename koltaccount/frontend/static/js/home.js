/* Главная страница с таблицей аккаунтов */
import {
    setCryptoSettings,
    enMP,
    deMP,
    encrypt,
    decrypt,
} from "./kolt_crypto.js";
import { saveJSONToFile } from "./save_json_to_file.js";

$(function () {
    let masterPassword = "", // Хранит мастер пароль для расшифровки данных таблицы
        enMasterPassword = "", // Хранит исходный мастер пароль
        cs = {}, // Хранит персональные настройки шифрования
        defaultCs = {}, // Хранит стандартные настройки шифрования
        pressTimer = 0, // Хранит значение таймера для события долгого нажатия кнопки "Пароль"
        isAllowCopy = true, // Разрешает копирование при долгом нажатии кнопки "Пароль"
        isAllowShowPage = false; // Разрешает отображение страницы

    const LOGIN_TYPE = "login";
    const PASSWORD_TYPE = "password";

    getMasterPassword();

    function reloadPage() {
        /* Перезагрузка страницы */
        location.href = location.href;
    }

    // Прячем копирайт чтобы не мешал
    $(".footer-urls").hide();

    function getMasterPassword() {
        /* Получение мастер пароля */
        preloadShow();

        $.ajax({
            url: "get_master_password/",
            type: "GET",
            success: function (result) {
                masterPassword = result["result"];
                enMasterPassword = result["result"];
                cs = result["cs"];
                defaultCs = JSON.parse(result["default_cs"]);
                if (masterPassword != "doesnotexist") {
                    // Открываем модальное окно ввода ключа/мастер пароля
                    $("#EnterKeyModal").modal("show");
                } else {
                    /* При первом посещении страницы, а также исходя из результата "doesnotexist", мастер пароля в базе не существует, поэтому... */
                    // Отключаем поле ввода старого пароля в модальном окне изменения пароля
                    $("#in-old_password")
                        .attr("disabled", "disabled")
                        .css("display", "none");
                    $('label[for="in-old_password"]').css("display", "none");
                    $("#pesonal-crypto-settings").css("display", "block");
                    $(".modal-body-master-password").css("height", "560px");
                    $("#btn-send_master_password").text("Создать");
                    $("#MasterPasswordModal .modal-title").text(
                        "Конфигурация шифрования",
                    );
                    // Открываем модальное окно изменения пароля
                    $("#MasterPasswordModal").modal("show");
                }
                preloadHide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                    );
                    preloadHide();
                }
            },
        });
    }

    $("#btn_master_password_modal").on("click", function () {
        $(".modal-body-master-password").css("height", "615px");
        $("#pesonal-crypto-settings").css("display", "block");
    });

    function createAccount(data) {
        /* Добавление нового аккаунта в таблице */
        preloadShow();

        let site, description, login, password;

        if (data) {
            site = data.site;
            description = data.description;
            login = encrypt(data.login, masterPassword);
            password = encrypt(data.password, masterPassword);
        } else {
            site = $("#in-site").val();
            description = $("#in-description").val();
            login = encrypt($("#in-login").val(), masterPassword);
            password = encrypt($("#in-password").val(), masterPassword);
        }

        $.ajax({
            url: "create_account/",
            type: "POST",
            data: {
                site: encrypt(site, masterPassword),
                description: encrypt(description, masterPassword),
                login: login,
                password: password,
            },
            success: function (result) {
                let accountId = result["account_id"];

                if (result["status"] == "success") {
                    let newRow =
                        '<tr data-toggle="modal" data-target="#AccountModal" data-id="' +
                        accountId +
                        '">' +
                        '<td class="td-favicon"><img data-id="' +
                        accountId +
                        '" class="favicon-sites" height="16" width="16" alt="icon" ' +
                        'src="https://favicon.yandex.net/favicon/' +
                        site +
                        '"></td>' +
                        '<td class="td-site" data-id="' +
                        accountId +
                        '">' +
                        site +
                        "</td>" +
                        '<td class="td-description" data-id="' +
                        accountId +
                        '">' +
                        description +
                        "</td>" +
                        '<td class="td-login td-hide" data-id="' +
                        accountId +
                        '">' +
                        login +
                        "</td>" +
                        '<td class="td-password td-hide" data-id="' +
                        accountId +
                        '">' +
                        password +
                        "</td>" +
                        "</tr>";

                    $("tbody").append(newRow);

                    // Обновляем счетчик аккаунтов
                    $("#js-account-counter").text(
                        parseInt($("#js-account-counter").text()) + 1,
                    );

                    sortTable();

                    if (!data) {
                        // Закрываем модальное окно
                        $("#CreateAccountModal").modal("hide");

                        // Подсветка новой строки
                        highlightRow(accountId);

                        // Чистим поля
                        $("#in-site").val("");
                        $("#in-description").val("");
                    }
                } else if (result["status"] == "error") {
                    if (result["message"] == "accountlimitreached") {
                        swal("Ошибка", "Достигнут лимит в 200 аккаунтов");
                    } else {
                        swal("Ошибка", result["message"]);
                    }
                } else {
                    swal("Ошибка", result["result"]);
                }

                preloadHide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                    );
                    preloadHide();
                }
            },
        });
    }

    function highlightRow(accountId) {
        setTimeout(function () {
            let $newRow = $("tr[data-id='" + accountId + "']");
            if ($newRow.length) {
                $("html, body").animate(
                    {
                        scrollTop: $newRow.offset().top - 100,
                    },
                    500,
                );

                $newRow.find("td").addClass("highlight-new");

                setTimeout(function () {
                    $newRow.find("td").removeClass("highlight-new");
                }, 3000);
            }
        }, 100);
    }

    function deleteAccount(accountId) {
        /* Удаление аккаунта */
        preloadShow();

        $.ajax({
            url: "delete_account/",
            type: "POST",
            data: {
                account_id: accountId,
            },
            success: function (result) {
                if (result["status"] == "success") {
                    // Скрываем запись из таблицы
                    $('tr[data-id="' + accountId + '"]').hide();
                    // Обновляем счетчик аккаунтов
                    $("#js-account-counter").text(
                        parseInt($("#js-account-counter").text()) - 1,
                    );
                    // Закрываем модальное окно удаления аккаунта
                    $("#AccountModal").modal("hide");
                } else {
                    if (result["result"] == "doesnotexist") {
                        swal("Ошибка", "Аккаунт не найден");
                    } else {
                        swal("Ошибка", result["result"]);
                    }
                }

                preloadHide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                    );
                    preloadHide();
                }
            },
        });
    }

    function changeInfoAccount() {
        /* Изменение информации аккаунта */
        preloadShow();

        let site = $("#modal-site").val(),
            description = $("#modal-description").val(),
            newLogin = $("#modal-new_login").val(),
            newPassword = $("#modal-new_password").val(),
            accountId = $("#modal-btn-account_delete").attr("data-id");

        if (newLogin != "") {
            // Если был введен новый логин, то шифруем его
            newLogin = encrypt(newLogin, masterPassword);
        }
        if (newPassword != "") {
            // Если был введен новый пароль, то шифруем его
            newPassword = encrypt(newPassword, masterPassword);
        }

        $.ajax({
            url: "change_info_account/",
            type: "POST",
            data: {
                site: encrypt(site, masterPassword),
                description: encrypt(description, masterPassword),
                new_login: newLogin,
                new_password: newPassword,
                account_id: accountId,
            },
            success: function (result) {
                if (result["status"] == "success") {
                    // Ищем в таблице аккаунт который изменяли
                    let tr = $('tr[data-id="' + accountId + '"]');
                    // Обновляем значения в таблице
                    tr.find(".td-favicon")
                        .find("img")
                        .attr(
                            "src",
                            "https://favicon.yandex.net/favicon/" + site,
                        );
                    tr.find(".td-site").text(site);
                    tr.find(".td-description").text(description);
                    if (newLogin != "") {
                        // Если был введен логин, обновляем его в таблице
                        tr.find(".td-login").text(newLogin);
                        // Чистим поле ввода логина
                        $("#modal-new_login").val("");
                    }
                    if (newPassword != "") {
                        // Если был введен пароль, обновляем его в таблице
                        tr.find(".td-password").text(newPassword);
                        // Чистим поле ввода пароля
                        $("#modal-new_password").val("");
                    }
                    // Сортируем таблицу
                    sortTable();
                    // Скрываем модальное окно просмотра аккаунта
                    $("#AccountModal").modal("hide");
                } else {
                    if (result["result"] == "doesnotexist") {
                        swal("Ошибка", "Аккаунт не найден");
                    } else {
                        swal("Ошибка", result["result"]);
                    }
                }

                highlightRow(accountId);

                preloadHide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                    );
                    preloadHide();
                }
            },
        });
    }

    function changeOrCreateMasterPassword(newMasterPassword) {
        /* Изменить или создать мастер пароль */
        preloadShow();
        setTimeout(function () {
            const KEY = $(".key_select").val().split("/");
            const IV = $(".iv_select").val().split("/");
            const SALT = $(".salt_select").val().split("/");
            const ITERATIONS = $("#in-iterations").val();
            const CS = {
                KEY: {
                    size: KEY[0],
                    division: KEY[1],
                },
                IV: {
                    size: IV[0],
                    division: IV[1],
                },
                SALT: {
                    size: SALT[0],
                    division: SALT[1],
                },
                ITERATIONS: ITERATIONS
                    ? ITERATIONS
                    : (Math.random() * (7999 - 57) + 57).toFixed(),
            };
            setCryptoSettings(defaultCs, CS);
            const hash = enMP(newMasterPassword);
            const masterPasswordKey = hash.key;
            const result = hash.result;

            const NEW_CS = encrypt(JSON.stringify(CS), newMasterPassword);

            let sites = {},
                descriptions = {},
                logins = {},
                passwords = {},
                tds = $("td");

            if (tds.length > 0) {
                // Если таблица не пустая, то проходим циклом по ее элементам
                tds.each(function (index, td) {
                    let accountId = td.getAttribute("data-id");
                    if (td.className == "td-site") {
                        // Шифруем строку из ячейки и присваиваем ее массиву под индексом ее id в базе данных
                        sites[accountId] = encrypt(
                            td.innerHTML,
                            masterPasswordKey,
                        );
                    } else if (td.className == "td-description") {
                        descriptions[accountId] = encrypt(
                            td.innerHTML,
                            masterPasswordKey,
                        );
                    } else if (td.className == "td-login td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что логин хранится в ячейке в зашифрованном виде
                        logins[accountId] = encrypt(
                            decrypt(td.innerHTML, masterPassword),
                            masterPasswordKey,
                        );
                    } else if (td.className == "td-password td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что пароль хранится в ячейке в зашифрованном виде
                        passwords[accountId] = encrypt(
                            decrypt(td.innerHTML, masterPassword),
                            masterPasswordKey,
                        );
                    }
                });
            }

            $.ajax({
                url: "change_or_create_master_password/",
                type: "POST",
                data: {
                    sites: JSON.stringify(sites),
                    descriptions: JSON.stringify(descriptions),
                    logins: JSON.stringify(logins),
                    passwords: JSON.stringify(passwords),
                    new_cs: NEW_CS,
                    new_master_password: result,
                },
                success: function (result) {
                    preloadHide();
                    if (result["status"] == "success") {
                        reloadPage();
                    } else {
                        swal("Ошибка", result["result"]);
                    }
                },
                error: function (jqXHR, text, error) {
                    if (error == "Forbidden") {
                        swal(
                            "Ошибка 403",
                            "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                                " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                                " включите их снова, по крайней мере, для этого сайта.",
                        );
                        preloadHide();
                    }
                },
            });
        }, 600);
    }

    function authorize() {
        /* Авторизация (Модальное окно "Аутентификация") */
        let key = $("#in-enter_master_password").val();

        if (key == "") {
            // Если ключ/мастер пароль не был введен, то переводим фокус на input
            $("#in-enter_master_password").focus();
            // Повторяем запрос ключа
            $("#EnterKeyModal").modal("show");
        } else {
            // Расшифровываем полученый пароль введенным ключем
            preloadShow();
            setTimeout(function () {
                // Устанавливаем настройки
                setCryptoSettings(defaultCs, {});
                let decryptCs = decrypt(cs, key);
                if (decryptCs) {
                    setCryptoSettings(defaultCs, JSON.parse(decryptCs));
                    // Расшифровываем мастер пароль
                    key = deMP(enMasterPassword, key);
                } else {
                    key = "";
                }

                if (key == "") {
                    // Если расшифровка не дала результата, то чистим input ввода ключа
                    $("#in-enter_master_password").val("");
                    // Переводим фокус на input
                    $("#in-enter_master_password").focus();
                    // Повторяем запрос ключа
                    $("#EnterKeyModal").modal("show");
                } else {
                    // Присваиваем ключ/мастер пароль глобальной переменной "Мастер пароль"
                    masterPassword = key;
                    // Даем разрешение на загрузку таблицы/страницы
                    isAllowShowPage = true;
                    // Скрываем модальное окно ввода пароля
                    $("#EnterKeyModal").modal("hide");
                }

                preloadHide();
            }, 600);
        }
    }

    function showOrCopyLoginOrPassword(type) {
        /* Отобразить на экране или скопировать в буфер обмена логин или пароль аккаунта */
        let key = "";

        if (type == LOGIN_TYPE) {
            // Если нужно скопировать логин то расшифровываем логин
            key = decrypt($("#modal-login").val(), masterPassword);
        } else {
            // Если не логин, то пароль
            key = decrypt($("#modal-password").val(), masterPassword);
        }

        if (key != "") {
            // Если расшифрока дала результат
            if (isAllowCopy) {
                // и если копирование разрешено, то копируем логин или пароль в буфер обмена
                copyToClipboard(key);
            } else {
                // Если копирование не разрешено, значит нужно вывести логин или пароль на экран
                swal(key);
                // Разрешаем в дальнейшем копирование
                isAllowCopy = true;
            }
        } else {
            swal("Ошибка", "Не правильный пароль");
        }
    }

    function copyToClipboard(text) {
        /* Скопировать текст в буфер обмена */
        let $tmp = $("<input>");
        $("#AccountModal").append($tmp);
        $tmp.val(text).select();
        document.execCommand("copy");
        $tmp.remove();
    }

    $("#btn-enter_master_password").on("click", function () {
        /* Собитие нажатия кнопки "Войти" в модальном окне авторизации */
        // Проходим авторизацию
        authorize();
    });

    $("#btn-send_account").on("click", function () {
        /* Событие нажатия на кнопку "Добавить" в модальном окне добавления нового аккаунта */
        if ($("#in-site").val() == "") {
            swal('Заполните поле "Сайт"');
        } else if ($("#in-description").val() == "") {
            swal('Заполните поле "Описание"');
        } else if ($("#in-login").val() == "") {
            swal('Заполните поле "Логин"');
        } else if ($("#in-password").val() == "") {
            swal('Заполните поле "Пароль"');
        } else {
            createAccount();
        }
    });

    let isNewPasswordValid = false,
        isRepeatPasswordValid = false;

    $("#in-new_password")
        .on("input", function () {
            validateNewPassword();
        })
        .focus(function () {
            $("#password_info").show();
        })
        .blur(function () {
            $("#password_info").hide();
        });

    $("#in-repeat_new_password").on("input", function () {
        validateRepeatPassword();
    });

    function validateNewPassword() {
        let password = $("#in-new_password").val(),
            isLengthValid = false,
            hasLetter = false,
            hasCapital = false,
            hasNumber = false;

        if (password.length < 8) {
            $("#length").removeClass("valid").addClass("invalid");
            isLengthValid = false;
        } else {
            $("#length").removeClass("invalid").addClass("valid");
            isLengthValid = true;
        }

        if (password.match(/[a-z]/)) {
            $("#letter").removeClass("invalid").addClass("valid");
            hasLetter = true;
        } else {
            $("#letter").removeClass("valid").addClass("invalid");
            hasLetter = false;
        }

        if (password.match(/[A-Z]/)) {
            $("#capital").removeClass("invalid").addClass("valid");
            hasCapital = true;
        } else {
            $("#capital").removeClass("valid").addClass("invalid");
            hasCapital = false;
        }

        if (password.match(/[0-9]/)) {
            $("#number").removeClass("invalid").addClass("valid");
            hasNumber = true;
        } else {
            $("#number").removeClass("valid").addClass("invalid");
            hasNumber = false;
        }

        if (isLengthValid && hasLetter && hasCapital && hasNumber) {
            $("#in-new_password").removeClass("input-invalid");
            isNewPasswordValid = true;
        } else {
            $("#in-new_password").addClass("input-invalid");
            isNewPasswordValid = false;
        }

        validateRepeatPassword();
    }

    function validateRepeatPassword() {
        let password = $("#in-new_password").val(),
            password2 = $("#in-repeat_new_password").val();

        if (password == password2) {
            $("#in-repeat_new_password").removeClass("input-invalid");
            isRepeatPasswordValid = true;
        } else {
            $("#in-repeat_new_password").addClass("input-invalid");
            isRepeatPasswordValid = false;
        }
    }

    function submitMasterPassword() {
        /* Событие нажатия на кнопку "Изменить" в модальном окне изменения мастер пароля */
        if (
            ($("#in-old_password").val() == "" &&
                !$("#in-old_password").attr("disabled")) ||
            ($("#in-old_password").val() != "" &&
                $("#in-old_password").attr("disabled"))
        ) {
            swal('Заполните поле "Старый пароль"');
        } else if ($("#in-new_password").val() == "") {
            swal('Заполните поле "Новый пароль"');
        } else if ($("#in-repeat_new_password").val() == "") {
            swal('Заполните поле "Подтвердите новый пароль"');
        } else if (
            $("#in-new_password").val() != $("#in-repeat_new_password").val()
        ) {
            swal("Пароли не совпадают");
        } else if (
            !Boolean($("#in-old_password").attr("disabled")) &&
            deMP(enMasterPassword, $("#in-old_password").val()) == ""
        ) {
            swal("Не правильный старый пароль");
        } else if (
            $("#in-iterations").val() < 57 &&
            $("#in-iterations").val() > 7999
        ) {
            swal("Не допустимый диапазон итераций");
        } else if (isNewPasswordValid && isRepeatPasswordValid) {
            changeOrCreateMasterPassword($("#in-repeat_new_password").val());
        }
    }

    $("#btn-send_master_password").on("click", function () {
        submitMasterPassword();
    });

    $(".modal-body-master-password input").on("keypress", function (e) {
        /* Событие нажатия клавиши (Ввод текста в поле создания/изменения мастер пароля) */
        if (e.keyCode == 13) {
            // Если нажата клавиша "Enter"
            submitMasterPassword();
        }
    });

    $("#modal-btn-account_delete").on("click", function () {
        /* Событие нажатия на кнопку "Удалить" в модальном окне просмотра аккаунта */
        swal(
            {
                title: "Вы уверены?",
                text: "Эту запись потом не восстановить!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Да, удалить это!",
            },
            function () {
                // Если была нажата кнопка "Да, удалить это!", то удаляем аккаунт
                deleteAccount($("#modal-btn-account_delete").attr("data-id"));
            },
        );
    });

    $("#modal-btn-save").on("click", function () {
        /* Событие нажатия кнопки "Сохранить" в модальном окне просмотра аккаунта */
        if ($("#modal-site").val() == "") {
            swal('Заполните поле "Сайт"');
        } else if ($("#modal-description").val() == "") {
            swal('Заполните поле "Описание"');
        } else {
            changeInfoAccount();
        }
    });

    $("#modal-btn-login").on("click", function () {
        /* Событие нажатия кнопки "Логин" в модальном окне просмотра аккаунта */
        showOrCopyLoginOrPassword(LOGIN_TYPE);
    });

    $("#modal-btn-password").on("click", function () {
        /* Событие нажатия кнопки "Пароль" в модальном окне просмотра аккаунта */
        showOrCopyLoginOrPassword(PASSWORD_TYPE);
    });

    $("#AccountModal").on("show.bs.modal", function (e) {
        /* Событие перед открытием модального окна просмотра аккаунта */
        let accountId = $(e.relatedTarget).attr("data-id"),
            site = $('.td-site[data-id="' + accountId + '"]').text(),
            description = $(
                '.td-description[data-id="' + accountId + '"]',
            ).text(),
            login = $('.td-login[data-id="' + accountId + '"]').text(),
            password = $('.td-password[data-id="' + accountId + '"]').text();

        // Заполняем модальное окно
        $("#modal-site").val(site);
        $("#modal-description").val(description);
        $("#modal-login").val(login);
        $("#modal-password").val(password);
        $("#modal-new_password").val("");
        $("#modal-btn-account_delete").attr("data-id", accountId);
        $("#modal-btn-account_delete").attr("data-site", site);
    });

    $("#AccountModal").on("shown.bs.modal", function (e) {
        /* Событие после открытия модального окна просмотра аккаунта */
        account_modal_tour();
    });

    $("#EnterKeyModal").on("shown.bs.modal", function () {
        /* Событие после открытия модального окна ввода ключа/мастер пароля */
        // Ставим фокус на поле ввода мастер пароля
        $("#in-enter_master_password").focus();
    });

    $("#MasterPasswordModal").on("hide.bs.modal", function () {
        /* Событие закрытия модального окна изменения мастер пароля */
        if (masterPassword == "doesnotexist") {
            $(".js-reload_master_password_modal").show();
        }
    });

    $("#EnterKeyModal").on("hide.bs.modal", function () {
        /* Событие закрытия модального окна ввода ключа/мастер пароля */
        if (isAllowShowPage) {
            let tds = $("td");
            if (tds.length > 0) {
                // Если таблицы не пустая, то проходим циклом по всем ячейкам
                tds.each(function (index, td) {
                    if (
                        td.className != "td-login td-hide" &&
                        td.className != "td-password td-hide" &&
                        td.className != "td-favicon"
                    ) {
                        // Расшифровываем ячейки, кроме ячеек логина, пароля и иконки
                        td.innerHTML = decrypt(td.innerHTML, masterPassword);
                    }
                });

                // Конфигурируем сортировку
                $("#Accounts_table").tablesorter({
                    sortList: [
                        // Сортируем по первому столбцу, по алфавиту
                        [1, 0],
                    ],
                });
                // Сортируем еще раз
                sortTable();
            }

            // Скачиваем иконку для каждого сайта в таблице
            $(".favicon-sites").each(function () {
                $(this).attr(
                    "src",
                    "https://favicon.yandex.net/favicon/" +
                        $(
                            '.td-site[data-id="' +
                                $(this).attr("data-id") +
                                '"]',
                        ).text(),
                );
            });

            // Показываем ранее спрятанный копирайт
            $(".footer-urls").show();
            // Скрываем кнопку загрузить таблицу
            $(".js-reload_enter_key_modal").hide();
            // Показываем таблицу
            $(".account_container").show();
            // Запускаем тур по главной странице
            account_table_tour();
        } else {
            // Если модальное окно ввода ключа/мастер пароля было закрыто пользователем, то показываем кнопку загрузить таблицу
            $(".js-reload_enter_key_modal").show();
            // и чистим поле ввода ключа/мастер пароля
            $("#in-enter_master_password").val("");
        }
    });

    $("#CreateAccountModal").on("hidden.bs.modal", function () {
        /* Событие после закрытия модального окна добавления аккаунта */
        $("#in-login").val("");
        $("#in-password").val("");
    });

    $("#in-search").on("keyup", function () {
        /* Событие отжатия клавиши (Ввода текста в поле поиска) */
        let $rows = $("tbody tr");
        if ($(this).val() == "") {
            // Если поле поиска пусто, то показываем все аккаунты
            $rows.fadeIn(100);
        } else {
            // Если поле поиска не пусто, то показываем аккаунты наиболее подходящие по вводу, остальные скрываем
            let $matchingCells = $(
                ".td-site:contains(" + $(this).val().toLowerCase() + ")",
            );
            $rows.fadeOut(100);
            $matchingCells.parent().fadeIn(100);
        }
    });

    $("#in-enter_master_password").on("keydown", function (e) {
        /* Событие нажатия клавиши (Ввод текста в поле ключа/мастер пароля) */
        if (e.keyCode == 13) {
            // Если нажата клавиша "Enter", проходим авторизацию
            authorize();
        }
    });

    $("#modal-btn-password")
        /* Долгое нажатие кнопки "Пароль" клавишей мыши или сенсором телефона в модальном окне просмотра аккаунта */
        .on("touchend mouseup", function () {
            /* Событие отжатия клавиши или сенсора */
            // Очищаем таймер
            clearTimeout(pressTimer);
        })
        .on("touchstart mousedown", function () {
            /* Событие нажатия клавиши или сенсора */
            // Устанавливаем таймер
            pressTimer = window.setTimeout(function () {
                // Запрещаем копирование пароля в буфер обмена так как показываем пароль на экране
                isAllowCopy = false;
                showOrCopyLoginOrPassword(PASSWORD_TYPE);
            }, 500); // 500 миллисекунд
        });

    $("#modal-btn-login")
        /* Долгое нажатие кнопки "Пароль" клавишей мыши или сенсором телефона в модальном окне просмотра аккаунта */
        .on("touchend mouseup", function () {
            /* Событие отжатия клавиши или сенсора */
            // Очищаем таймер
            clearTimeout(pressTimer);
        })
        .on("touchstart mousedown", function () {
            /* Событие нажатия клавиши или сенсора */
            // Устанавливаем таймер
            pressTimer = window.setTimeout(function () {
                // Запрещаем копирование логина в буфер обмена так как показываем логин на экране
                isAllowCopy = false;
                showOrCopyLoginOrPassword(LOGIN_TYPE);
            }, 500); // 500 миллисекунд
        });

    $("#btn_master_import").on("change", async function () {
        if (masterPassword == "doesnotexist") {
            swal('Необходимо создать мастер пароль');
            return
        }
        preloadShow();
        $("#MasterPasswordModal").modal("hide");

        const reader = new FileReader();
        reader.readAsText(this.files[0]);

        await new Promise((resolve) => (reader.onload = resolve));

        const data = JSON.parse(reader.result);
        for (let i in data) {
            createAccount({
                site: data[i]["site"],
                description: data[i]["description"],
                login: data[i]["login"],
                password: data[i]["password"],
            });
            await new Promise((r) => setTimeout(r, 0));
        }

        sortTable();
        preloadHide();
    });

    $("#btn_master_export").on("click", function () {
        let oldPassword = $("#in-old_password").val();
        if (masterPassword == "doesnotexist") {
            swal('Необходимо создать мастер пароль');
            return
        }
        if (oldPassword == "") {
            swal('Введите пароль в поле "Старый пароль"');
        } else if (deMP(enMasterPassword, oldPassword) == "") {
            swal("Не правильный пароль");
        } else {
            exportAccounts();
        }
    });

    function sortTable() {
        let $table = $("#Accounts_table");
        $table.trigger("update");
        setTimeout(function () {
            $table.trigger("sorton", [[[1, 0]]]);
        }, 100);
    }

    function exportAccounts() {
        /* Мастер экспорт аккаунтов в json файл */
        var jsonData = [{ data: "data" }];
        let rowIndex = -1;
        let cellIndex = 0;
        $("#Accounts_table td").each(function () {
            let data = $(this).text();

            if (data == "") {
                rowIndex += 1;
                cellIndex = 0;
                jsonData[rowIndex] = {};
            } else {
                if (cellIndex == 0) {
                    jsonData[rowIndex] = { ...jsonData[rowIndex], site: data };
                } else if (cellIndex == 1) {
                    jsonData[rowIndex] = {
                        ...jsonData[rowIndex],
                        description: data,
                    };
                } else if (cellIndex == 2) {
                    jsonData[rowIndex] = {
                        ...jsonData[rowIndex],
                        login: decrypt(data, masterPassword),
                    };
                } else if (cellIndex == 3) {
                    jsonData[rowIndex] = {
                        ...jsonData[rowIndex],
                        password: decrypt(data, masterPassword),
                    };
                }

                cellIndex += 1;
            }
        });

        saveJSONToFile(jsonData, "KoltAccount dump");
    }
});

/* Главная страница с таблицей аккаунтов */
import {setCryptoSettings, enMP, deMP, encrypt, decrypt} from "./kolt_crypto.js"

$(function () {
    let master_password = "", // Хранит мастер пароль для расшифровки данных таблицы
        en_master_password = "", // Хранит исходный мастер пароль
        cs = {}, // Хранит персональные настройки шифрования
        default_cs = {}, // Хранит стандартные настройки шифрования
        press_timer = 0, // Хранит значение таймера для события долгого нажатия кнопки "Пароль"
        is_allow_copy = true, // Разрешает копирование при долгом нажатии кнопки "Пароль"
        is_allow_show_page = false; // Разрешает отображение страницы

    get_master_password();

    // Константы для функции show_or_copy_login_or_password(type_data)
    const _login = "login",
        _password = "password";

    function reload() {
        /* Перезагрузка страницы */
        location.href = location.href;
    }

    // Прячем копирайт чтобы не мешал
    $(".footer-urls").hide();

    function get_master_password() {
        /* Получение мастер пароля */
        preload_show();

        $.ajax({
            url: "get_master_password/",
            type: "GET",
            success: function (result) {
                master_password = result["result"];
                en_master_password = result["result"];
                cs = result["cs"];
                default_cs = JSON.parse(result["default_cs"]);
                if (master_password != "doesnotexist") {
                    // Открываем модальное окно ввода ключа/мастер пароля
                    $("#EnterKeyModal").modal("show");
                } else {
                    /* При первом посещении страницы, а также исходя из результата "doesnotexist", мастер пароля в базе не существует, поэтому... */
                    // Отключаем поле ввода старого пароля в модальном окне изменения пароля
                    $("#in-old_password").attr("disabled", "disabled").css("display", "none");
                    $("label[for=\"in-old_password\"]").css("display", "none");
                    $("#pesonal-crypto-settings").css("display", "block");
                    $(".modal-body-master-password").css("height", "560px");
                    $("#btn-send_master_password").text("Создать");
                    $("#MasterPasswordModal .modal-title").text("Конфигурация шифрования");
                    // Открываем модальное окно изменения пароля
                    $("#MasterPasswordModal").modal("show");
                }
                preload_hide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                        " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                        " включите их снова, по крайней мере, для этого сайта."
                    )
                    preload_hide();
                }
            }
        });
    }

    $("#btn_master_password_modal").on("click", function () {
        $(".modal-body-master-password").css("height", "615px");
        $("#pesonal-crypto-settings").css("display", "block");
    });

    function create_account() {
        /* Добавление нового аккаунта в таблице */
        preload_show();

        let site = $("#in-site").val(),
            description = $("#in-description").val(),
            login = encrypt($("#in-login").val(), master_password),
            password = encrypt($("#in-password").val(), master_password);

        $.ajax({
            url: "create_account/",
            type: "POST",
            data: {
                site: encrypt(site, master_password),
                description: encrypt(description, master_password),
                login: login,
                password: password,
            },
            success: function (result) {
                let account_id = result["account_id"];

                if (result["status"] == "success") {
                    let tr = "<tr data-toggle=\"modal\" data-target=\"#AccountModal\" data-id=\"" + account_id + "\">" +
                        "<td class=\"td-favicon\"><img data-id=\"" + account_id + "\" class=\"favicon-sites\" height=\"16\" width=\"16\" alt=\"icon\" " +
                        "src=\"https://favicon.yandex.net/favicon/" + site + "\"></td>" +
                        "<td class=\"td-site\" data-id=\"" + account_id + "\">" + site + "</td>" +
                        "<td class=\"td-description\" data-id=\"" + account_id + "\">" + description + "</td>" +
                        "<td class=\"td-login td-hide\" data-id=\"" + account_id + "\">" + login + "</td>" +
                        "<td class=\"td-password td-hide\" data-id=\"" + account_id + "\">" + password + "</td>" +
                        "</tr>"; // Формируем запись для таблицы

                    // Добавляем в конец таблицы только что созданную запись аккаунта
                    $("tbody").append(tr);
                    // Сортируем таблицу
                    $("table").trigger("sorton", [[[1, 0]]]);
                    // Закрываем модальное окно создания аккаунта
                    $("#CreateAccountModal").modal("hide");
                    // Обновляем счетчик аккаунтов
                    $("#js-account-counter").text(parseInt($("#js-account-counter").text()) + 1);
                    // Чистим поля
                    $("#in-site").val("");
                    $("#in-description").val("");
                    // Памятка: поле логина и пароля очищаются всегда при закрытии модального окна
                } else if (result["status"] == "error") {
                    if (result["message"] == "accountlimitreached") {
                        swal("Ошибка", "Достигнут лимит в 200 аккаунтов");
                    } else {
                        swal("Ошибка", result["message"]);
                    }
                } else {
                    swal("Ошибка", result["result"]);
                }

                preload_hide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                        " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                        " включите их снова, по крайней мере, для этого сайта."
                    )
                    preload_hide();
                }
            }
        });
    }

    function delete_account(account_id) {
        /* Удаление аккаунта */
        preload_show();

        $.ajax({
            url: "delete_account/",
            type: "POST",
            data: {
                account_id: account_id,
            },
            success: function (result) {
                if (result["status"] == "success") {
                    // Скрываем запись из таблицы
                    $("tr[data-id=\"" + account_id + "\"]").hide();
                    // Обновляем счетчик аккаунтов
                    $("#js-account-counter").text(parseInt($("#js-account-counter").text()) - 1);
                    // Закрываем модальное окно удаления аккаунта
                    $("#AccountModal").modal("hide");
                } else {
                    if (result["result"] == "doesnotexist") {
                        swal("Ошибка", "Аккаунт не найден");
                    } else {
                        swal("Ошибка", result["result"]);
                    }
                }

                preload_hide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                        " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                        " включите их снова, по крайней мере, для этого сайта."
                    )
                    preload_hide();
                }
            }
        });
    }

    function change_info_account() {
        /* Изменение информации аккаунта */
        preload_show();

        let site = $("#modal-site").val(),
            description = $("#modal-description").val(),
            new_login = $("#modal-new_login").val(),
            new_password = $("#modal-new_password").val(),
            account_id = $("#modal-btn-account_delete").attr("data-id");

        if (new_login != "") {
            // Если был введен новый логин, то шифруем его
            new_login = encrypt(new_login, master_password);
        }
        if (new_password != "") {
            // Если был введен новый пароль, то шифруем его
            new_password = encrypt(new_password, master_password);
        }

        $.ajax({
            url: "change_info_account/",
            type: "POST",
            data: {
                site: encrypt(site, master_password),
                description: encrypt(description, master_password),
                new_login: new_login,
                new_password: new_password,
                account_id: account_id
            },
            success: function (result) {
                if (result["status"] == "success") {
                    // Ищем в таблице аккаунт который изменяли
                    let tr = $("tr[data-id=\"" + account_id + "\"]");
                    // Обновляем значения в таблице
                    tr.find(".td-favicon").find("img").attr("src", "https://favicon.yandex.net/favicon/" + site);
                    tr.find(".td-site").text(site);
                    tr.find(".td-description").text(description);
                    if (new_login != "") {
                        // Если был введен логин, обновляем его в таблице
                        tr.find(".td-login").text(new_login);
                        // Чистим поле ввода логина
                        $("#modal-new_login").val("");
                    }
                    if (new_password != "") {
                        // Если был введен пароль, обновляем его в таблице
                        tr.find(".td-password").text(new_password);
                        // Чистим поле ввода пароля
                        $("#modal-new_password").val("");
                    }
                    // Сортируем таблицу
                    $("table").trigger("sorton", [[[1, 0]]]);
                    // Скрываем модальное окно просмотра аккаунта
                    $("#AccountModal").modal("hide");
                } else {
                    if (result["result"] == "doesnotexist") {
                        swal("Ошибка", "Аккаунт не найден");
                    } else {
                        swal("Ошибка", result["result"]);
                    }
                }

                preload_hide();
            },
            error: function (jqXHR, text, error) {
                if (error == "Forbidden") {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                        " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                        " включите их снова, по крайней мере, для этого сайта."
                    )
                    preload_hide();
                }
            }
        });
    }

    function change_or_create_master_password(new_master_password) {
        /* Изменить или создать мастер пароль */
        preload_show();
        setTimeout(function () {
            const KEY = $(".key_select").val().split("/")
            const IV = $(".iv_select").val().split("/")
            const SALT = $(".salt_select").val().split("/")
            const ITERATIONS = $("#in-iterations").val()
            const CS = {
                "KEY": {
                    "size": KEY[0],
                    "division": KEY[1]
                },
                "IV": {
                    "size": IV[0],
                    "division": IV[1]
                },
                "SALT": {
                    "size": SALT[0],
                    "division": SALT[1]
                },
                "ITERATIONS": ITERATIONS ? ITERATIONS : (Math.random() * (7999 - 57) + 57).toFixed(),
            }
            setCryptoSettings(default_cs, CS);
            const hash = enMP(new_master_password);
            const master_password_key = hash.key;
            const result = hash.result;

            const NEW_CS = encrypt(JSON.stringify(CS), new_master_password);

            let sites = {},
                descriptions = {},
                logins = {},
                passwords = {},
                tds = $("td");

            if (tds.length > 0) {
                // Если таблица не пустая, то проходим циклом по ее элементам
                tds.each(function (index, td) {
                    let account_id = td.getAttribute("data-id");
                    if (td.className == "td-site") {
                        // Шифруем строку из ячейки и присваиваем ее массиву под индексом ее id в базе данных
                        sites[account_id] = encrypt(td.innerHTML, master_password_key);
                    } else if (td.className == "td-description") {
                        descriptions[account_id] = encrypt(td.innerHTML, master_password_key);
                    } else if (td.className == "td-login td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что логин хранится в ячейке в зашифрованном виде
                        logins[account_id] = encrypt(decrypt(td.innerHTML, master_password), master_password_key);
                    } else if (td.className == "td-password td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что пароль хранится в ячейке в зашифрованном виде
                        passwords[account_id] = encrypt(decrypt(td.innerHTML, master_password), master_password_key);
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
                    new_master_password: result
                },
                success: function (result) {
                    preload_hide();
                    if (result["status"] == "success") {
                        reload();
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
                            " включите их снова, по крайней мере, для этого сайта."
                        )
                        preload_hide();
                    }
                }
            });
        }, 600);
    }

    function authorization() {
        /* Авторизация (Модальное окно "Аутентификация") */
        let key = $("#in-enter_master_password").val();

        if (key == "") {
            // Если ключ/мастер пароль не был введен, то переводим фокус на input
            $("#in-enter_master_password").focus();
            // Повторяем запрос ключа
            $("#EnterKeyModal").modal("show");
        } else {
            // Расшифровываем полученый пароль введенным ключем
            preload_show();
            setTimeout(function () {
                // Устанавливаем настройки
                setCryptoSettings(default_cs, {})
                let decrypt_cs = decrypt(cs, key)
                if (decrypt_cs) {
                    setCryptoSettings(default_cs, JSON.parse(decrypt_cs))
                    // Расшифровываем мастер пароль
                    key = deMP(master_password, key);
                } else {
                    key = ""
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
                    master_password = key;
                    // Даем разрешение на загрузку таблицы/страницы
                    is_allow_show_page = true;
                    // Скрываем модальное окно ввода пароля
                    $("#EnterKeyModal").modal("hide");
                }

                preload_hide();
            }, 600);
        }
    }

    function show_or_copy_login_or_password(type_data) {
        /* Отобразить на экране или скопировать в буфер обмена логин или пароль аккаунта */
        let key = "";

        if (type_data == _login) {
            // Если нужно скопировать логин то расшифровываем логин
            key = decrypt($("#modal-login").val(), master_password);
        } else {
            // Если не логин, то пароль
            key = decrypt($("#modal-password").val(), master_password);
        }

        if (key != "") {
            // Если расшифрока дала результат
            if (is_allow_copy) {
                // и если копирование разрешено, то копируем логин или пароль в буфер обмена
                copy_clipboard(key);
            } else {
                // Если копирование не разрешено, значит нужно вывести логин или пароль на экран
                swal(key);
                // Разрешаем в дальнейшем копирование
                is_allow_copy = true;
            }
        } else {
            swal("Ошибка", "Не правильный пароль");
        }
    }

    function copy_clipboard(text) {
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
        authorization();
    });

    $("#btn-send_account").on("click", function () {
        /* Событие нажатия на кнопку "Добавить" в модальном окне добавления нового аккаунта */
        if ($("#in-site").val() == "") {
            swal("Заполните поле \"Сайт\"");
        } else if ($("#in-description").val() == "") {
            swal("Заполните поле \"Описание\"");
        } else if ($("#in-login").val() == "") {
            swal("Заполните поле \"Логин\"");
        } else if ($("#in-password").val() == "") {
            swal("Заполните поле \"Пароль\"");
        } else {
            create_account();
        }
    });

    let is_new_password = false,
        is_repeat_new_password = false;

    $("#in-new_password").on("input", function () {
        check_new_password();
    }).focus(function () {
        $("#password_info").show();
    }).blur(function () {
        $("#password_info").hide();
    });

    $("#in-repeat_new_password").on("input", function () {
        check_repeat_new_password();
    });

    function check_new_password() {
        let password = $("#in-new_password").val(),

            is_length = false,
            is_letter = false,
            is_capital = false,
            is_number = false;

        if (password.length < 8) {
            $("#length").removeClass("valid").addClass("invalid");
            is_length = false;
        } else {
            $("#length").removeClass("invalid").addClass("valid");
            is_length = true;
        }

        if (password.match(/[a-z]/)) {
            $("#letter").removeClass("invalid").addClass("valid");
            is_letter = true;
        } else {
            $("#letter").removeClass("valid").addClass("invalid");
            is_letter = false;
        }

        if (password.match(/[A-Z]/)) {
            $("#capital").removeClass("invalid").addClass("valid");
            is_capital = true;
        } else {
            $("#capital").removeClass("valid").addClass("invalid");
            is_capital = false;
        }

        if (password.match(/[0-9]/)) {
            $("#number").removeClass("invalid").addClass("valid");
            is_number = true;
        } else {
            $("#number").removeClass("valid").addClass("invalid");
            is_number = false;
        }

        if (is_length && is_letter && is_capital && is_number) {
            $("#in-new_password").removeClass("input-invalid");
            is_new_password = true;
        } else {
            $("#in-new_password").addClass("input-invalid");
            is_new_password = false;
        }

        check_repeat_new_password();

    }

    function check_repeat_new_password() {
        let password = $("#in-new_password").val(),
            password2 = $("#in-repeat_new_password").val();

        if (password == password2) {
            $("#in-repeat_new_password").removeClass("input-invalid");
            is_repeat_new_password = true;
        } else {
            $("#in-repeat_new_password").addClass("input-invalid");
            is_repeat_new_password = false;
        }
    }

    function send_master_password() {
        /* Событие нажатия на кнопку "Изменить" в модальном окне изменения мастер пароля */
        if (
            ($("#in-old_password").val() == "" && !$("#in-old_password").attr("disabled")) ||
            ($("#in-old_password").val() != "" && $("#in-old_password").attr("disabled"))
        ) {
            swal("Заполните поле \"Старый пароль\"");
        } else if ($("#in-new_password").val() == "") {
            swal("Заполните поле \"Новый пароль\"");
        // } else if ($("#in-old_password").val() == $("#in-new_password").val()) {
        //     swal("Старый и новый пароль не могут совпадать");
        } else if ($("#in-repeat_new_password").val() == "") {
            swal("Заполните поле \"Подтвердите новый пароль\"");
        } else if ($("#in-new_password").val() != $("#in-repeat_new_password").val()) {
            swal("Пароли не совпадают");
        } else if (!Boolean($("#in-old_password").attr("disabled")) && deMP(en_master_password, $("#in-old_password").val()) == "") {
            swal("Не правильный старый пароль");
        } else if ($("#in-iterations").val() < 57 && $("#in-iterations").val() > 7999) {
            swal("Не допустимый диапазон итераций");
        } else if (is_new_password && is_repeat_new_password) {
            change_or_create_master_password($("#in-repeat_new_password").val());
        }
    }

    $("#btn-send_master_password").on("click", function () {
        send_master_password();
    });

    $(".modal-body-master-password input").on("keypress", function (e) {
        /* Событие нажатия клавиши (Ввод текста в поле создания/изменения мастер пароля) */
        if (e.keyCode == 13) {
            // Если нажата клавиша "Enter"
            send_master_password();
        }
    });

    $("#modal-btn-account_delete").on("click", function () {
        /* Событие нажатия на кнопку "Удалить" в модальном окне просмотра аккаунта */
        swal({
            title: "Вы уверены?",
            text: "Эту запись потом не восстановить!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Да, удалить это!"
        },
            function () {
                // Если была нажата кнопка "Да, удалить это!", то удаляем аккаунт
                delete_account($("#modal-btn-account_delete").attr("data-id"));
            }
        );
    });

    $("#modal-btn-save").on("click", function () {
        /* Событие нажатия кнопки "Сохранить" в модальном окне просмотра аккаунта */
        if ($("#modal-site").val() == "") {
            swal("Заполните поле \"Сайт\"");
        } else if ($("#modal-description").val() == "") {
            swal("Заполните поле \"Описание\"");
        } else {
            change_info_account();
        }
    });

    $("#modal-btn-login").on("click", function () {
        /* Событие нажатия кнопки "Логин" в модальном окне просмотра аккаунта */
        show_or_copy_login_or_password(_login);
    });

    $("#modal-btn-password").on("click", function () {
        /* Событие нажатия кнопки "Пароль" в модальном окне просмотра аккаунта */
        show_or_copy_login_or_password(_password);
    });

    $("#AccountModal").on("show.bs.modal", function (e) {
        /* Событие перед открытием модального окна просмотра аккаунта */
        let account_id = $(e.relatedTarget).attr("data-id"),
            site = $(".td-site[data-id=\"" + account_id + "\"]").text(),
            description = $(".td-description[data-id=\"" + account_id + "\"]").text(),
            login = $(".td-login[data-id=\"" + account_id + "\"]").text(),
            password = $(".td-password[data-id=\"" + account_id + "\"]").text();

        // Заполняем модальное окно
        $("#modal-site").val(site);
        $("#modal-description").val(description);
        $("#modal-login").val(login);
        $("#modal-password").val(password);
        $("#modal-new_password").val("");
        $("#modal-btn-account_delete").attr("data-id", account_id);
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
        if (master_password == "doesnotexist") {
            $(".js-reload_master_password_modal").show();
        }
    });

    $("#EnterKeyModal").on("hide.bs.modal", function () {
        /* Событие закрытия модального окна ввода ключа/мастер пароля */
        if (is_allow_show_page) {
            let tds = $("td");
            if (tds.length > 0) {
                // Если таблицы не пустая, то проходим циклом по всем ячейкам
                tds.each(function (index, td) {
                    if (td.className != "td-login td-hide" && td.className != "td-password td-hide" && td.className != "td-favicon") {
                        // Расшифровываем ячейки, кроме ячеек логина, пароля и иконки
                        td.innerHTML = decrypt(td.innerHTML, master_password);
                    }
                });

                if ($("tr").length > 1) {
                    // Если таблица не пустая, то конфигурируем
                    $("#Accounts_table").tablesorter({
                        sortList: [
                            // Сортируем по первому столбцу, по алфавиту
                            [1, 0]
                        ]
                    });
                }
            }

            // Скачиваем иконку для каждого сайта в таблице
            $(".favicon-sites").each(function () {
                $(this).attr("src", "https://favicon.yandex.net/favicon/" + $(".td-site[data-id=\"" + $(this).attr("data-id") + "\"]").text())
            });

            // Показываем ранее спрятанный копирайт
            $(".footer-urls").show();
            // Показываем спрятанный блок с именем пользователя
            $(".user-username").show();
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
        let tr = $("tbody tr");
        if ($(this).val() == "") {
            // Если поле поиска пусто, то показываем все аккаунты
            tr.fadeIn(100);
        } else {
            // Если поле поиска не пусто, то показываем аккаунты наиболее подходящие по вводу, остальные скрываем
            let td = $(".td-site:contains(" + $(this).val().toLowerCase() + ")");
            tr.fadeOut(100);
            td.parent().fadeIn(100);
        }
    });

    $("#in-enter_master_password").on("keydown", function (e) {
        /* Событие нажатия клавиши (Ввод текста в поле ключа/мастер пароля) */
        if (e.keyCode == 13) {
            // Если нажата клавиша "Enter", проходим авторизацию
            authorization();
        }
    });

    $("#modal-btn-password")
        /* Долгое нажатие кнопки "Пароль" клавишей мыши или сенсором телефона в модальном окне просмотра аккаунта */
        .on("touchend mouseup", (function () {
            /* Событие отжатия клавиши или сенсора */
            // Очищаем таймер
            clearTimeout(press_timer);
        }))
        .on("touchstart mousedown", (function () {
            /* Событие нажатия клавиши или сенсора */
            // Устанавливаем таймер
            press_timer = window.setTimeout(function () {
                // Запрещаем копирование пароля в буфер обмена так как показываем пароль на экране
                is_allow_copy = false;
                show_or_copy_login_or_password(_password);
            }, 500); // 500 миллисекунд
        }));

    $("#modal-btn-login")
        /* Долгое нажатие кнопки "Пароль" клавишей мыши или сенсором телефона в модальном окне просмотра аккаунта */
        .on("touchend mouseup", (function () {
            /* Событие отжатия клавиши или сенсора */
            // Очищаем таймер
            clearTimeout(press_timer);
        })).on("touchstart mousedown", (function () {
            /* Событие нажатия клавиши или сенсора */
            // Устанавливаем таймер
            press_timer = window.setTimeout(function () {
                // Запрещаем копирование логина в буфер обмена так как показываем логин на экране
                is_allow_copy = false;
                show_or_copy_login_or_password(_login);
            }, 500); // 500 миллисекунд
        }));
});
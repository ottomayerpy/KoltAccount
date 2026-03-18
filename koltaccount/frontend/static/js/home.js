/* Главная страница с таблицей аккаунтов */
import { setCryptoSettings, enMP, deMP, encrypt, decrypt } from "./kolt_crypto.js";
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
                    $("#in-old_password").attr("disabled", "disabled").css("display", "none");
                    $('label[for="in-old_password"]').css("display", "none");
                    $("#pesonal-crypto-settings").css("display", "block");
                    $(".modal-body-master-password").css("height", "560px");
                    $("#btn-send_master_password").text("Создать");
                    $("#MasterPasswordModal .modal-title").text("Конфигурация шифрования");
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
                        "error",
                    );
                    preloadHide();
                }
            },
        });
    }

    $("#btn_master_password_modal").on("click", function () {
        $("#pesonal-crypto-settings").css("display", "block");
    });

    function createCandy() {
        /* Добавление новой конфетки */
        preloadShow();

        let site = $("#in-site").val(),
            description = $("#in-description").val(),
            login = encrypt($("#in-login").val(), masterPassword),
            password = encrypt($("#in-password").val(), masterPassword);

        $.ajax({
            url: "create_candy/",
            type: "POST",
            data: {
                site: encrypt(site, masterPassword),
                description: encrypt(description, masterPassword),
                login: login,
                password: password,
            },
            success: function (result) {
                // Получаем ID новой конфетки из ответа сервера
                let candyId = result["candy_id"];
                // Создаем DOM элемент новой строки
                let $newRow = createNewRowElement(candyId, site, description, login, password);

                // Скрываем строку перед добавлением в таблицу
                $newRow.hide();

                // Добавляем строку в таблицу
                let $table = $("#Accounts_table");
                $table.children("tbody").first().append($newRow);

                // Закрываем модальное окно создания
                $("#CreateAccountModal").modal("hide");

                // Плавно показываем новую строку
                $newRow.fadeIn(150, function () {
                    // Обновляем tablesorter и добавляем сортировку
                    $table.trigger("update", [
                        true,
                        function () {
                            // Увеличиваем счетчик конфеток
                            const candyCount = parseInt($("#js-account-counter div").text());
                            $("#js-account-counter div").text(candyCount + 1);
                            // Очищаем поля ввода (логин и пароль очищаются всегда при закрытии модалки)
                            $("#in-site, #in-description").val("");
                            // Подсвечиваем только что добавленную строку
                            highlightRow(candyId);
                        },
                    ]);
                });
            },
            // TODO: Добавить обработку ошибок из View
            error: function (jqXHR) {
                if (jqXHR.status === 403) {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                        "warning",
                    );
                } else {
                    let result = jqXHR.responseJSON;
                    swal("Ошибка", result?.result || "Что-то пошло не так", "error");
                }
            },
            complete: function () {
                preloadHide();
            },
        });
    }

    function createNewRowElement(candyId, site, description, login, password) {
        /* Вспомогательная функция для создания элемента строки */
        return $("<tr>", {
            "data-toggle": "modal",
            "data-target": "#AccountModal",
            "data-id": candyId,
            role: "row",
        }).append(
            $("<td>", { class: "td-favicon" }).append(
                $("<img>", {
                    "data-id": candyId,
                    class: "favicon-sites",
                    height: "16",
                    width: "16",
                    alt: "icon",
                    src: "https://favicon.yandex.net/favicon/" + site,
                }),
            ),
            $("<td>", {
                class: "td-site",
                "data-id": candyId,
                text: site,
            }),
            $("<td>", {
                class: "td-description",
                "data-id": candyId,
                text: description,
            }),
            $("<td>", {
                class: "td-login td-hide",
                "data-id": candyId,
                text: login,
            }),
            $("<td>", {
                class: "td-password td-hide",
                "data-id": candyId,
                text: password,
            }),
        );
    }

    function highlightRow(candyId) {
        setTimeout(function () {
            let $newRow = $('tr[data-id="' + candyId + '"]');
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

    function deleteCandy(candyId) {
        /* Удалить конфетку */
        preloadShow();

        $.ajax({
            url: "delete_candy/",
            type: "POST",
            data: {
                candy_id: candyId,
            },
            success: function () {
                // Закрываем модальное окно удаления
                $("#AccountModal").modal("hide");

                // Плавно скрываем удаляемую строку
                $(`tr[data-id="${candyId}"]`).fadeOut(150, function () {
                    // После завершения анимации удаляем строку из DOM
                    $(this).remove();
                    // Уменьшаем счетчик конфеток
                    const currentCount = parseInt($("#js-account-counter").text()) || 0;
                    $("#js-account-counter").text(currentCount - 1);
                });
            },
            // TODO: Добавить обработку ошибок из View
            error: function (jqXHR) {
                if (jqXHR.status === 403) {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                        "warning",
                    );
                } else {
                    let result = jqXHR.responseJSON;
                    swal("Ошибка", result?.result || "Что-то пошло не так", "error");
                }
            },
            complete: function () {
                preloadHide();
            },
        });
    }

    function changeCandy() {
        /* Изменение информации аккаунта */
        preloadShow();

        // Получаем данные из формы
        let site = $("#modal-site").val(),
            description = $("#modal-description").val(),
            newLogin = $("#modal-new_login").val(),
            newPassword = $("#modal-new_password").val(),
            candyId = $("#modal-btn-account_delete").attr("data-id");

        // Шифруем логин и пароль если они были изменены
        if (newLogin != "") {
            newLogin = encrypt(newLogin, masterPassword);
        }
        if (newPassword != "") {
            newPassword = encrypt(newPassword, masterPassword);
        }

        $.ajax({
            url: "change_candy/",
            type: "POST",
            data: {
                site: encrypt(site, masterPassword), // Сайт всегда шифруем
                description: encrypt(description, masterPassword), // Описание всегда шифруем
                new_login: newLogin,
                new_password: newPassword,
                candy_id: candyId,
            },
            success: function () {
                // Находим строку с измененной конфеткой
                let tr = $(`tr[data-id="${candyId}"]`);

                // Обновляем favicon
                tr.find(".td-favicon img").attr("src", "https://favicon.yandex.net/favicon/" + site);
                // Обновляем название сайта и описание
                tr.find(".td-site").text(site);
                tr.find(".td-description").text(description);

                // Если логин был изменен - обновляем и очищаем поле
                if (newLogin != "") {
                    tr.find(".td-login").text(newLogin);
                    $("#modal-new_login").val("");
                }

                // Если пароль был изменен - обновляем и очищаем поле
                if (newPassword != "") {
                    tr.find(".td-password").text(newPassword);
                    $("#modal-new_password").val(""); // Не обязательно, но оставим
                }

                // Сортируем таблицу по первому столбцу
                $("#Accounts_table").trigger("sorton", [[[1, 0]]]);
                // Закрываем модальное окно
                $("#AccountModal").modal("hide");

                // Подсвечиваем измененную строку
                highlightRow(candyId);
            },
            // TODO: Добавить обработку ошибок из View
            error: function (jqXHR) {
                if (jqXHR.status === 403) {
                    swal(
                        "Ошибка 403",
                        "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                            " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                            " включите их снова, по крайней мере, для этого сайта.",
                        "warning",
                    );
                } else {
                    let result = jqXHR.responseJSON;
                    swal("Ошибка", result?.result || "Что-то пошло не так", "error");
                }
            },
            complete: function () {
                preloadHide();
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
                ITERATIONS: ITERATIONS ? ITERATIONS : (Math.random() * (7999 - 57) + 57).toFixed(),
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
                        sites[accountId] = encrypt(td.innerHTML, masterPasswordKey);
                    } else if (td.className == "td-description") {
                        descriptions[accountId] = encrypt(td.innerHTML, masterPasswordKey);
                    } else if (td.className == "td-login td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что логин хранится в ячейке в зашифрованном виде
                        logins[accountId] = encrypt(decrypt(td.innerHTML, masterPassword), masterPasswordKey);
                    } else if (td.className == "td-password td-hide") {
                        // Тоже самое, только предварительно расшировать, потому что пароль хранится в ячейке в зашифрованном виде
                        passwords[accountId] = encrypt(decrypt(td.innerHTML, masterPassword), masterPasswordKey);
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
                        swal("Ошибка", result["result"], "error");
                    }
                },
                error: function (jqXHR, text, error) {
                    if (error == "Forbidden") {
                        swal(
                            "Ошибка 403",
                            "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                                " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                                " включите их снова, по крайней мере, для этого сайта.",
                            "error",
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
            swal("Ошибка", "Не правильный пароль", "warning");
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
            swal('Заполните поле "Сайт"', "", "info");
        } else if ($("#in-description").val() == "") {
            swal('Заполните поле "Описание"', "", "info");
        } else if ($("#in-login").val() == "") {
            swal('Заполните поле "Логин"', "", "info");
        } else if ($("#in-password").val() == "") {
            swal('Заполните поле "Пароль"', "", "info");
        } else {
            createCandy();
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
        if (($("#in-old_password").val() == "" && !$("#in-old_password").attr("disabled")) || ($("#in-old_password").val() != "" && $("#in-old_password").attr("disabled"))) {
            swal('Заполните поле "Старый пароль"', "", "info");
        } else if ($("#in-new_password").val() == "") {
            swal('Заполните поле "Новый пароль"', "", "info");
        } else if ($("#in-repeat_new_password").val() == "") {
            swal('Заполните поле "Подтвердите новый пароль"', "", "info");
        } else if ($("#in-new_password").val() != $("#in-repeat_new_password").val()) {
            swal("Пароли не совпадают", "", "warning");
        } else if (!Boolean($("#in-old_password").attr("disabled")) && deMP(enMasterPassword, $("#in-old_password").val()) == "") {
            swal("Не правильный старый пароль", "", "Warning");
        } else if ($("#in-iterations").val() < 57 && $("#in-iterations").val() > 7999) {
            swal("Не допустимый диапазон итераций", "", "Warning");
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
                deleteCandy($("#modal-btn-account_delete").attr("data-id"));
            },
        );
    });

    $("#modal-btn-save").on("click", function () {
        /* Событие нажатия кнопки "Сохранить" в модальном окне просмотра аккаунта */
        if ($("#modal-site").val() == "") {
            swal('Заполните поле "Сайт"', "", "info");
        } else if ($("#modal-description").val() == "") {
            swal('Заполните поле "Описание"', "", "info");
        } else {
            changeCandy();
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
            description = $('.td-description[data-id="' + accountId + '"]').text(),
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
        // account_modal_tour(); (Удалено, потом новый сделаем)
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
                    if (td.className != "td-login td-hide" && td.className != "td-password td-hide" && td.className != "td-favicon") {
                        // Расшифровываем ячейки, кроме ячеек логина, пароля и иконки
                        td.innerHTML = decrypt(td.innerHTML, masterPassword);
                    }
                });
            }

            configureTable();

            // Скачиваем иконку для каждого сайта в таблице
            $(".favicon-sites").each(function () {
                $(this).attr("src", "https://favicon.yandex.net/favicon/" + $('.td-site[data-id="' + $(this).attr("data-id") + '"]').text());
            });

            // Показываем ранее спрятанный копирайт
            $(".footer-urls").show();
            // Скрываем кнопку загрузить таблицу
            $(".js-reload_enter_key_modal").hide();
            // Показываем таблицу
            $(".account_container").show();
            // Запускаем тур по главной странице
            // account_table_tour(); (Удалено, потом новый сделаем)
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
            let $matchingCells = $(".td-site:contains(" + $(this).val().toLowerCase() + ")");
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
            swal("Необходимо создать мастер пароль", "", "info");
            return;
        }

        preloadShow();
        $("#MasterPasswordModal").modal("hide");

        const reader = new FileReader();
        reader.readAsText(this.files[0]);

        await new Promise((resolve) => (reader.onload = resolve));

        try {
            const accounts = JSON.parse(reader.result);

            // Шифруем логины и пароли для отображения в таблице
            const accountsForTable = accounts.map((account) => ({
                site: account.site,
                description: account.description,
                login: encrypt(account.login, masterPassword),
                password: encrypt(account.password, masterPassword),
            }));

            // Шифруем сайты и описания для отправки на сервер
            const accountsForServer = accountsForTable.map((account) => ({
                site: encrypt(account.site, masterPassword),
                description: encrypt(account.description, masterPassword),
                login: account.login,
                password: account.password,
            }));

            $.ajax({
                url: "import_accounts/",
                type: "POST",
                data: {
                    accounts: JSON.stringify(accountsForServer),
                },
                success: function (result) {
                    // 4. Добавляем в таблицу
                    addImportedAccountsToTable(result.imported, accountsForTable);

                    // Обновляем счетчик
                    const currentCount = parseInt($("#js-account-counter div").text());
                    $("#js-account-counter div").text(currentCount + result.success_count);

                    let message = `Импортировано: ${result.success_count} из ${result.total}`;
                    if (result.error_count > 0) {
                        message += `\nОшибок: ${result.error_count}`;
                        console.error("Ошибки импорта:", result.errors);
                    }

                    swal(result.error_count > 0 ? "Импорт завершен с ошибками" : "Импорт успешно завершен", message, result.error_count > 0 ? "warning" : "success");

                    // Сортируем таблицу
                    $("#Accounts_table").trigger("sorton", [[[1, 0]]]);
                },
                error: function (jqXHR, text, error) {
                    if (error === "Unprocessable Content") {
                        swal("Превышен лимит", "Достигнут лимит аккаунтов", "warning");
                    } else if (error === "Bad Request") {
                        swal("Ошибка", "Неверный формат JSON файла", "error");
                    } else if (error == "Forbidden") {
                        swal(
                            "Ошибка",
                            "Этот сайт требует наличия файла cookie CSRF при отправке форм." +
                                " Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie," +
                                " включите их снова, по крайней мере, для этого сайта.",
                            "error",
                        );
                    } else {
                        swal("Ошибка", error, "error");
                    }
                },
                complete: function () {
                    preloadHide();
                    $("#btn_master_import").val("");
                },
            });
        } catch (e) {
            swal("Ошибка", "Неверный формат JSON файла: " + e.message, "error");
            preloadHide();
            $("#btn_master_import").val("");
        }
    });

    function addImportedAccountsToTable(importedAccountsIds, accountsForTable) {
        let $table = $("#Accounts_table");
        let $tbody = $table.children("tbody").first();
        let fragment = document.createDocumentFragment();

        importedAccountsIds.forEach((importedAccountId) => {
            let tableData = accountsForTable[importedAccountId.index];

            let $row = createNewRowElement(importedAccountId.id, tableData.site, tableData.description, tableData.login, tableData.password);
            fragment.appendChild($row[0]);
        });

        $tbody.append(fragment);
        $table.trigger("update", [true]);
    }

    $("#btn_master_export").on("click", function () {
        let oldPassword = $("#in-old_password").val();
        if (masterPassword == "doesnotexist") {
            swal("Необходимо создать мастер пароль", "", "info");
            return;
        }
        if (oldPassword == "") {
            swal('Введите пароль в поле "Старый пароль"', "", "info");
        } else if (deMP(enMasterPassword, oldPassword) == "") {
            swal("Не правильный пароль", "", "warning");
        } else {
            exportAccounts();
        }
    });

    function configureTable() {
        let $table = $("#Accounts_table");

        // ПРАВИЛЬНАЯ ПРОВЕРКА: используем data()
        if ($table.data("tablesorter")) {
            // Уничтожаем существующий экземпляр
            $table.trigger("destroy");
            $table.removeData("tablesorter");
            $table.removeClass("tablesorter tablesorter-default");
            console.log("destroy");
        }

        // Конфигурируем сортировку
        $table.tablesorter({
            sortList: [[1, 0]], // Сортируем по второму столбцу (индекс 1), по возрастанию
            // Добавляем обработку для скрытых колонок
            textExtraction: {
                0: function (node, table, cellIndex) {
                    return $(node).text(); // favicon
                },
                1: function (node, table, cellIndex) {
                    return $(node).text(); // site
                },
                2: function (node, table, cellIndex) {
                    return $(node).text(); // description
                },
                3: function (node, table, cellIndex) {
                    return $(node).text(); // login (скрытый)
                },
                4: function (node, table, cellIndex) {
                    return $(node).text(); // password (скрытый)
                },
            },
        });
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

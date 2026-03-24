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

    function safeFaviconUrl(siteName) {
        if (!siteName || typeof siteName !== "string") {
            return "https://favicon.yandex.net/favicon/";
        }
        // Экранируем спецсимволы для URL
        const encoded = encodeURIComponent(siteName);
        return `https://favicon.yandex.net/favicon/${encoded}`;
    }

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
                enMasterPassword = result["password"];
                cs = result["crypto_settings"];
                defaultCs = JSON.parse(result["default_crypto_settings"]);

                // Открываем модальное окно для ввода мастер-пароля
                $("#EnterKeyModal").modal("show");
                preloadHide();
            },
            error: function (jqXHR) {
                if (jqXHR.status === 404) {
                    // Статус 404 - мастер-пароль не найден (первый вход)
                    defaultCs = JSON.parse(jqXHR.responseJSON["default_crypto_settings"]);

                    // Отключаем поле старого пароля
                    $("#in-old_password").attr("disabled", "disabled").css("display", "none");
                    $('label[for="in-old_password"]').css("display", "none");

                    // Меняем интерфейс на создание нового мастер-пароля
                    $("#btn-send_master_password").text("Создать");

                    // Открываем модальное окно мастер пароля
                    $("#MasterPasswordModal").modal("show");
                } else {
                    swal("Ошибка", "Что-то пошло не так", "error");
                }
            },
            complete: function () {
                preloadHide();
            },
        });
    }

    function createCandy() {
        /* Добавление новой конфетки */
        preloadShow();

        let site = $("#ccm-in-site").val();
        let description = $("#ccm-in-description").val();
        let login = encrypt($("#ccm-in-login").val(), masterPassword);
        let password = encrypt($("#ccm-in-password").val(), masterPassword);

        let data = {
            site: encrypt(site, masterPassword),
            login: login,
            password: password,
        };

        if (description) {
            data.description = encrypt(description, masterPassword);
        }

        $.ajax({
            url: "create_candy/",
            type: "POST",
            data: data,
            success: function (result) {
                // Получаем ID новой конфетки из ответа сервера
                let candyId = result["candy_id"];
                // Создаем DOM элемент новой строки
                let $newRow = createNewRowElement(candyId, site, description, login, password);

                // Скрываем строку перед добавлением в таблицу
                $newRow.hide();

                // Добавляем строку в таблицу
                let $table = $("#CandiesTable");
                $table.children("tbody").first().append($newRow);

                // Закрываем модальное окно создания конфетки
                $("#CreateCandyModal").modal("hide");

                // Плавно показываем новую строку
                $newRow.fadeIn(150, function () {
                    // Обновляем tablesorter и добавляем сортировку
                    $table.trigger("update", [
                        true,
                        function () {
                            // Увеличиваем счетчик конфеток
                            const candyCount = parseInt($("#candies_count").text());
                            $("#candies_count").text(candyCount + 1);
                            // Очищаем поля ввода (логин и пароль очищаются всегда при закрытии модалки)
                            $("#ccm-in-site, #ccm-in-description").val("");
                            // Подсвечиваем только что добавленную строку
                            highlightRow(candyId);
                        },
                    ]);
                });
            },
            error: function (jqXHR) {
                let result = jqXHR.responseJSON;
                if (jqXHR.status === 400) {
                    if (result?.result === "missing_fields") {
                        swal("Ошибка", "Заполните поля сайт, логин и пароль", "warning");
                    } else if (result?.result === "limit_reached") {
                        swal("Ошибка", "Достигнут лимит аккаунтов", "warning");
                    } else {
                        swal("Ошибка", "Что-то пошло не так", "error");
                    }
                } else {
                    swal("Ошибка", "Что-то пошло не так", "error");
                }
            },
            complete: () => preloadHide(),
        });
    }

    function createNewRowElement(candyId, site, description, login, password) {
        const $tr = $("<tr>").attr({
            "data-toggle": "modal",
            "data-target": "#CandyModal",
            "data-id": candyId,
            role: "row",
        });

        $tr.append(
            $("<td>")
                .addClass("td-favicon")
                .append(
                    $("<img>").attr({
                        "data-id": candyId,
                        class: "favicon-sites",
                        height: "16",
                        width: "16",
                        alt: "icon",
                        src: safeFaviconUrl(site || ""),
                    }),
                ),
            $("<td>")
                .addClass("td-site")
                .attr("data-id", candyId)
                .text(site || ""),
            $("<td>")
                .addClass("td-description")
                .attr("data-id", candyId)
                .text(description || ""),
            $("<td>")
                .addClass("td-login td-hide")
                .attr("data-id", candyId)
                .text(login || ""),
            $("<td>")
                .addClass("td-password td-hide")
                .attr("data-id", candyId)
                .text(password || ""),
        );

        return $tr;
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
                // Закрываем модальное окно удаления конфетки
                $("#CandyModal").modal("hide");

                // Плавно скрываем удаляемую строку
                $(`tr[data-id="${candyId}"]`).fadeOut(150, function () {
                    // После завершения анимации удаляем строку из DOM
                    $(this).remove();
                    // Уменьшаем счетчик конфеток
                    const candyCount = parseInt($("#candies_count").text());
                    $("#candies_count").text(candyCount - 1);
                });
            },
            // TODO: Добавить обработку ошибок из View
            error: function (jqXHR) {
                swal("Ошибка", "Что-то пошло не так", "error");
            },
            complete: function () {
                preloadHide();
            },
        });
    }

    function clearAllCandies() {
        preloadShow();

        $.ajax({
            url: "clear_all_candies/",
            type: "POST",
            success: function () {
                $("#CandiesTable tbody tr").fadeOut(150, function () {
                    $(this).remove();
                    $("#candies_count").text("0");
                });
            },
            error: function (jqXHR) {
                if (jqXHR.status === 404) {
                    swal("Ошибка", "Нет аккаунтов для удаления", "info");
                } else {
                    swal("Ошибка", "Что-то пошло не так", "error");
                }
            },
            complete: function () {
                preloadHide();
            },
        });
    }

    // Добавляем обработчик для кнопки очистки
    $("#btn_clear_all_candies").on("click", function () {
        let currentCount = parseInt($("#candies_count").text());

        if (currentCount === 0) {
            swal("Ошибка", "Нет аккаунтов для удаления", "info");
            return;
        }

        swal(
            {
                title: "Вы уверены?",
                text: `Будет удалено ${currentCount} аккаунт${currentCount === 1 ? "" : currentCount < 5 ? "а" : "ов"}. Это действие нельзя отменить!`,
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Да, удалить всё!",
                cancelButtonText: "Отмена",
            },
            function () {
                clearAllCandies();
            },
        );
    });

    function changeCandy() {
        preloadShow();

        let candyId = $("#modal-btn-account_delete").attr("data-id");
        let site = $("#cm-in-site").val();
        let desc = $("#cm-in-description").val();
        let newLogin = $("#cm-in-new_login").val();
        let newPass = $("#cm-in-new_password").val();

        let data = { candy_id: candyId };
        let tr = $(`tr[data-id="${candyId}"]`);

        if (site !== tr.find(".td-site").text()) data.site = encrypt(site, masterPassword);
        if (desc !== tr.find(".td-description").text()) data.description = encrypt(desc, masterPassword);
        if (newLogin) data.new_login = encrypt(newLogin, masterPassword);
        if (newPass) data.new_password = encrypt(newPass, masterPassword);

        // Если ничего не изменилось - выходим
        if (Object.keys(data).length === 1) {
            // только candy_id
            $("#CandyModal").modal("hide");
            highlightRow(candyId);
            preloadHide();
            return;
        }

        $.ajax({
            url: "change_candy/",
            type: "POST",
            data: data,
            success: function () {
                if (data.site) {
                    tr.find(".td-favicon img").attr("src", safeFaviconUrl(site));
                    tr.find(".td-site").text(site);
                }
                if (data.description) tr.find(".td-description").text(desc);
                if (data.new_login) {
                    tr.find(".td-login").text(data.new_login);
                    $("#cm-in-new_login").val("");
                }
                if (data.new_password) {
                    tr.find(".td-password").text(data.new_password);
                    $("#cm-in-new_password").val("");
                }
                $("#CandiesTable").trigger("sorton", [[[1, 0]]]);
                $("#CandyModal").modal("hide");
                highlightRow(candyId);
            },
            error: function (jqXHR) {
                if (jqXHR.status === 400) {
                    swal("Ошибка", "Не передан ID конфетки", "warning");
                } else if (jqXHR.status === 404) {
                    swal("Ошибка", "Конфетка не найдена", "warning");
                } else {
                    swal("Ошибка", "Что-то пошло не так", "error");
                }
            },
            complete: () => preloadHide(),
        });
    }

    function changeOrCreateMasterPassword(newMasterPassword) {
        /* Создает или обновляет мастер-пароль */
        preloadShow();

        // Собираем настройки шифрования из формы
        const KEY = $(".key_select").val().split("/");
        const IV = $(".iv_select").val().split("/");
        const SALT = $(".salt_select").val().split("/");
        const ITERATIONS = $("#in-iterations").val();

        const CRYPTO_SETTINGS = {
            KEY: { size: KEY[0], division: KEY[1] },
            IV: { size: IV[0], division: IV[1] },
            SALT: { size: SALT[0], division: SALT[1] },
            ITERATIONS: ITERATIONS || (Math.random() * (7999 - 57) + 57).toFixed(),
        };

        setCryptoSettings(defaultCs, CRYPTO_SETTINGS);

        // Хешируем новый мастер-пароль
        const HASH = enMP(newMasterPassword);
        const MASTER_PASSWORD_KEY = HASH.key;
        const ENCRYPTED_MASTER_PASSWORD = HASH.result;

        // Шифруем настройки новым мастер-паролем
        const ENCRYPTED_CRYPTO_SETTINGS = encrypt(JSON.stringify(CRYPTO_SETTINGS), newMasterPassword);

        let dataToSend = {
            new_cs: ENCRYPTED_CRYPTO_SETTINGS,
            new_master_password: ENCRYPTED_MASTER_PASSWORD,
        };

        if ($("td").length > 0) {
            // Собираем данные из таблицы для перешифровки
            let sites = {},
                descriptions = {},
                logins = {},
                passwords = {};

            $("td").each(function () {
                let accountId = $(this).data("id");
                if (!accountId) return;

                if ($(this).hasClass("td-site")) {
                    sites[accountId] = encrypt(this.innerHTML, MASTER_PASSWORD_KEY);
                } else if ($(this).hasClass("td-description")) {
                    descriptions[accountId] = encrypt(this.innerHTML, MASTER_PASSWORD_KEY);
                } else if ($(this).hasClass("td-login")) {
                    // Для логина: расшифровать старым ключом, зашифровать новым
                    logins[accountId] = encrypt(decrypt(this.innerHTML, masterPassword), MASTER_PASSWORD_KEY);
                } else if ($(this).hasClass("td-password")) {
                    // Для пароля: расшифровать старым ключом, зашифровать новым
                    passwords[accountId] = encrypt(decrypt(this.innerHTML, masterPassword), MASTER_PASSWORD_KEY);
                }
            });

            // Добавляем данные в отправку
            Object.assign(dataToSend, {
                sites: JSON.stringify(sites),
                descriptions: JSON.stringify(descriptions),
                logins: JSON.stringify(logins),
                passwords: JSON.stringify(passwords),
            });
        }

        $.ajax({
            url: "save_master_password/",
            type: "POST",
            data: dataToSend,
            success: function () {
                reloadPage();
            },
            error: function (jqXHR) {
                swal("Ошибка", "Что-то пошло не так", "error");
            },
            complete: function () {
                preloadHide();
            },
        });
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
            key = decrypt($("#cm-in-login").val(), masterPassword);
        } else {
            // Если не логин, то пароль
            key = decrypt($("#cm-in-password").val(), masterPassword);
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
        $("#CandyModal").append($tmp);
        $tmp.val(text).select();
        document.execCommand("copy");
        $tmp.remove();
    }

    $("#btn-enter_master_password").on("click", function () {
        /* Собитие нажатия кнопки "Войти" в модальном окне авторизации */
        // Проходим авторизацию
        authorize();
    });

    $("#btn-send_candy").on("click", function () {
        /* Событие нажатия на кнопку "Добавить" в модальном окне добавления новой конфетки */
        if ($("#ccm-in-site").val() == "") {
            swal('Заполните поле "Сайт"', "", "info");
        } else if ($("#ccm-in-login").val() == "") {
            swal('Заполните поле "Логин"', "", "info");
        } else if ($("#ccm-in-password").val() == "") {
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

    $("#btn-send_master_password").on("click", function () {
        /* Событие нажатия на кнопку "Изменить" или "Создать" в модальном окне изменения мастер пароля */
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
            setTimeout(function () {
                changeOrCreateMasterPassword($("#in-new_password").val());
            }, 600);
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
        if ($("#cm-in-site").val() == "") {
            swal('Заполните поле "Сайт"', "", "info");
        } else if ($("#cm-in-description").val() == "") {
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

    $("#CandyModal").on("show.bs.modal", function (e) {
        /* Событие перед открытием модального окна просмотра конфетки */
        let accountId = $(e.relatedTarget).attr("data-id"),
            site = $('.td-site[data-id="' + accountId + '"]').text(),
            description = $('.td-description[data-id="' + accountId + '"]').text(),
            login = $('.td-login[data-id="' + accountId + '"]').text(),
            password = $('.td-password[data-id="' + accountId + '"]').text();

        // Заполняем модальное окно и триггерим события input для обновления счетчиков
        $("#cm-in-site").val(site).trigger("input");
        $("#cm-in-description").val(description).trigger("input");
        $("#cm-in-login").val(login);
        $("#cm-in-password").val(password);
        $("#modal-btn-account_delete").attr("data-id", accountId);
        $("#modal-btn-account_delete").attr("data-site", site);
    });

    $("#CandyModal").on("hidden.bs.modal", function (e) {
        /* Событие после закрытия модального окна просмотра конфетки */
        $("#cm-in-new_login").val("").trigger("input");
        $("#cm-in-new_password").val("").trigger("input");
    });

    $("#EnterKeyModal").on("shown.bs.modal", function () {
        /* Событие после открытия модального окна ввода ключа/мастер пароля */
        // Ставим фокус на поле ввода мастер пароля
        $("#in-enter_master_password").focus();
    });

    $("#MasterPasswordModal").on("hide.bs.modal", function () {
        /* Событие до закрытия модального окна изменения мастер пароля */
        if (masterPassword == "doesnotexist") {
            $(".js-reload_master_password_modal").show();
        }
    });

    $("#EnterKeyModal").on("hide.bs.modal", function () {
        /* Событие до закрытия модального окна ввода ключа/мастер пароля */
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
                const siteText = $('.td-site[data-id="' + $(this).attr("data-id") + '"]').text();
                $(this).attr("src", safeFaviconUrl(siteText));
            });

            // Показываем ранее спрятанный копирайт
            $(".footer-urls").show();
            // Скрываем кнопку загрузить таблицу
            $(".js-reload_enter_key_modal").hide();
            // Показываем таблицу
            $(".candies_container").show();
            // Запускаем тур по главной странице
            // account_table_tour(); (Удалено, потом новый сделаем)
        } else {
            // Если модальное окно ввода ключа/мастер пароля было закрыто пользователем, то показываем кнопку загрузить таблицу
            $(".js-reload_enter_key_modal").show();
            // и чистим поле ввода ключа/мастер пароля
            $("#in-enter_master_password").val("");
        }
    });

    $("#CreateCandyModal").on("hidden.bs.modal", function () {
        /* Событие после закрытия модального окна добавления конфетки */
        $("#ccm-in-login").val("");
        $("#ccm-in-password").val("");
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
        const file = this.files[0];
        if (!file) return;

        preloadShow();

        const reader = new FileReader();
        reader.readAsText(file);
        await new Promise((resolve) => (reader.onload = resolve));

        try {
            const candies = JSON.parse(reader.result);

            if (!Array.isArray(candies)) {
                throw new Error("Файл должен содержать массив");
            }

            // Проверяем лимит
            const limitCheck = checkCandiesLimit(candies.length);
            if (!limitCheck.allowed) {
                swal("Превышен лимит", `Вы пытаетесь добавить ${candies.length} записей из ${limitCheck.available} доступных`, "warning");
                preloadHide();
                $("#btn_master_import").val("");
                return;
            }

            // Шифруем данные
            const candiesForTable = candies.map((account) => ({
                site: account.site,
                description: account.description,
                login: encrypt(account.login, masterPassword),
                password: encrypt(account.password, masterPassword),
            }));

            const candiesForServer = candiesForTable.map((account) => ({
                site: encrypt(account.site, masterPassword),
                description: encrypt(account.description, masterPassword),
                login: account.login,
                password: account.password,
            }));

            $.ajax({
                url: "import_candies/",
                type: "POST",
                data: {
                    candies: JSON.stringify(candiesForServer),
                },
                success: function (result) {
                    addImportedCandiesToTable(result.imported, candiesForTable);

                    const candyCount = parseInt($("#candies_count").text());
                    $("#candies_count").text(candyCount + result.success_count);

                    let message = `Импортировано: ${result.success_count} из ${result.total}`;
                    if (result.error_count > 0) {
                        message += `\nОшибок: ${result.error_count}`;
                    }

                    swal(result.error_count > 0 ? "Импорт завершен с ошибками" : "Импорт успешно завершен", message, result.error_count > 0 ? "warning" : "success");

                    $("#CandiesTable").trigger("sorton", [[[1, 0]]]);
                },
                error: function (jqXHR) {
                    if (jqXHR.status === 422) {
                        swal("Превышен лимит", "Достигнут лимит на добавление записей", "warning");
                    } else if (jqXHR.status === 400) {
                        swal("Ошибка", "Неверный формат JSON файла", "error");
                    } else {
                        swal("Ошибка", "Что-то пошло не так", "error");
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

    function addImportedCandiesToTable(importedCandiesIds, candiesForTable) {
        let $table = $("#CandiesTable");
        let $tbody = $table.children("tbody").first();
        let fragment = document.createDocumentFragment();

        importedCandiesIds.forEach((importedAccountId) => {
            let tableData = candiesForTable[importedAccountId.index];

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
        let $table = $("#CandiesTable");

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
        $("#CandiesTable td").each(function () {
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

    // ==========================================================================
    // Счетчики символов
    // ==========================================================================

    // Счетчики для модального окна создания
    const createCharCounters = [
        { inputId: "#ccm-in-site", counterId: "#ccm-in-site-counter", maxId: "#ccm-in-site-max" },
        { inputId: "#ccm-in-description", counterId: "#ccm-in-description-counter", maxId: "#ccm-in-description-max" },
        { inputId: "#ccm-in-login", counterId: "#ccm-in-login-counter", maxId: "#ccm-in-login-max" },
        { inputId: "#ccm-in-password", counterId: "#ccm-in-password-counter", maxId: "#ccm-in-password-max" },
    ];

    // Счетчики для модального окна редактирования
    const editCharCounters = [
        { inputId: "#cm-in-site", counterId: "#cm-in-site-counter", maxId: "#cm-in-site-max" },
        { inputId: "#cm-in-description", counterId: "#cm-in-description-counter", maxId: "#cm-in-description-max" },
        { inputId: "#cm-in-new_login", counterId: "#cm-in-new-login-counter", maxId: "#cm-in-new-login-max" },
        { inputId: "#cm-in-new_password", counterId: "#cm-in-new-password-counter", maxId: "#cm-in-new-password-max" },
    ];

    function initCharCounters(counters) {
        counters.forEach((counter) => {
            const $input = $(counter.inputId);
            const $counter = $(counter.counterId);
            const maxLength = $input.attr("maxlength");

            $(counter.maxId).text(maxLength);

            $input.on("input", function () {
                const currentLength = $(this).val().length;
                $counter.text(currentLength);

                if (currentLength >= maxLength) {
                    $counter.css("color", "#dc3545");
                } else if (currentLength >= maxLength * 0.8) {
                    $counter.css("color", "#ffc107");
                } else {
                    $counter.css("color", "var(--text-color)");
                }
            });
        });
    }

    // Инициализация
    initCharCounters(createCharCounters);
    initCharCounters(editCharCounters);

    $("#CreateCandyModal").on("show.bs.modal", function (e) {
        /* Событие перед открытием модального окна создания конфетки */
        // Обновляем счетчики
        $("#ccm-in-site, #ccm-in-description, #ccm-in-login, #ccm-in-password").trigger("input");
    });

    $("#btn_create_candy").on("click", function (e) {
        /* Событие нажатия на кнопку добавления конфетки */
        // Проверяем лимит
        const limitCheck = checkCandiesLimit(1);

        if (!limitCheck.allowed) {
            e.preventDefault();
            e.stopPropagation();

            swal({
                title: "Превышен лимит",
                text: "Удалите лишние аккаунты перед добавлением новых",
                type: "warning",
                confirmButtonText: "Понятно",
            });

            return false;
        }
    });

    $('label[for="btn_master_import"]').on("click", function (e) {
        /* Событие нажатия на кнопку импорта */
        const limitCheck = checkCandiesLimit(1);

        if (!limitCheck.allowed) {
            e.preventDefault();
            e.stopPropagation();
            swal("Превышен лимит", "Удалите лишние аккаунты перед импортом новых", "warning");
            return false;
        }
    });

    function checkCandiesLimit(additionalCount = 0) {
        const CANDIES_LIMIT = parseInt($("#candies_limit").text()) || 200;
        const currentCount = parseInt($("#candies_count").text()) || 0;
        const newCount = currentCount + additionalCount;
        const available = CANDIES_LIMIT - currentCount;

        if (newCount > CANDIES_LIMIT) {
            return {
                allowed: false,
                current: currentCount,
                limit: CANDIES_LIMIT,
                available: available,
            };
        }

        return {
            allowed: true,
            current: currentCount,
            limit: CANDIES_LIMIT,
            available: available,
        };
    }
});

/* Главная страница с таблицей аккаунтов */
import { saveJSONToFile } from "../core/save_json_to_file.js";
import { initCharCounters } from "./components/counters.js";
import { configureTable } from "./components/table.js";
import { decrypt, deMP } from "./crypto.js";
import { changeCandy, clearAllCandies, createCandy, deleteCandy, exportAccounts, importCandies } from "./services/api.js";
import { authorize, changeOrCreateMasterPassword, getMasterPassword } from "./services/crypto-service.js";
import { checkCandiesLimit } from "./services/limit.js";
import { copyToClipboard, safeFaviconUrl } from "./utils/helpers.js";

$(function () {
    let masterPassword = "";
    let enMasterPassword = "";
    let cs = {};
    let defaultCs = {};
    let pressTimer = 0;
    let isAllowCopy = true;
    let isAllowShowPage = false;

    // Константы для счетчиков
    const createCharCounters = [
        { inputId: "#ccm-in-site", counterId: "#ccm-in-site-counter", maxId: "#ccm-in-site-max" },
        { inputId: "#ccm-in-description", counterId: "#ccm-in-description-counter", maxId: "#ccm-in-description-max" },
        { inputId: "#ccm-in-login", counterId: "#ccm-in-login-counter", maxId: "#ccm-in-login-max" },
        { inputId: "#ccm-in-password", counterId: "#ccm-in-password-counter", maxId: "#ccm-in-password-max" },
    ];

    const editCharCounters = [
        { inputId: "#cm-in-site", counterId: "#cm-in-site-counter", maxId: "#cm-in-site-max" },
        { inputId: "#cm-in-description", counterId: "#cm-in-description-counter", maxId: "#cm-in-description-max" },
        { inputId: "#cm-in-new_login", counterId: "#cm-in-new-login-counter", maxId: "#cm-in-new-login-max" },
        { inputId: "#cm-in-new_password", counterId: "#cm-in-new-password-counter", maxId: "#cm-in-new-password-max" },
    ];

    // Инициализация счетчиков
    initCharCounters(createCharCounters);
    initCharCounters(editCharCounters);

    // Получение мастер-пароля
    getMasterPassword({
        success: (result) => {
            enMasterPassword = result.password;
            cs = result.crypto_settings;
            defaultCs = result.default_crypto_settings;
            $("#EnterKeyModal").modal("show");
        },
        error: (defaultCryptoSettings) => {
            defaultCs = defaultCryptoSettings;
            $("#in-old_password").attr("disabled", "disabled").css("display", "none");
            $('label[for="in-old_password"]').css("display", "none");
            $("#btn_master_export").css("display", "none");
            $("#btn-send_master_password").text("Создать");
            $("#MasterPasswordModal").modal("show");
        },
        complete: () => preloadHide(),
    });

    // Прячем копирайт
    $(".footer-urls").hide();

    // Авторизация (ввод мастер пароля на главной)
    function handleAuthorize() {
        let key = $("#in-enter_master_password").val();
        let $input = $("#in-enter_master_password");

        preloadShow();
        authorize(key, cs, defaultCs, enMasterPassword, {
            success: (newKey) => {
                masterPassword = newKey;
                isAllowShowPage = true;
                $("#EnterKeyModal").modal("hide");
            },
            error: () => {
                $input.addClass("input-error-pulse");
                setTimeout(() => {
                    $input.removeClass("input-error-pulse");
                }, 1000);
            },
        });
        preloadHide();
    }

    $("#btn-enter_master_password").on("click", handleAuthorize);
    $("#in-enter_master_password").on("keydown", (e) => {
        if (e.keyCode === 13) handleAuthorize();
    });

    // Добавление конфетки
    $("#btn-send_candy").on("click", () => {
        if ($("#ccm-in-site").val() == "") {
            swal('Заполните поле "Сайт"', "", "info");
        } else if ($("#ccm-in-login").val() == "") {
            swal('Заполните поле "Логин"', "", "info");
        } else if ($("#ccm-in-password").val() == "") {
            swal('Заполните поле "Пароль"', "", "info");
        } else {
            preloadShow();
            createCandy(masterPassword, {
                complete: () => preloadHide(),
            });
        }
    });

    // Очистка всех конфеток
    $("#btn_clear_all_candies").on("click", () => {
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
            () => {
                preloadShow();
                clearAllCandies({
                    complete: () => preloadHide(),
                });
            },
        );
    });

    // Кнопка добавления (проверка лимита)
    $("#btn_create_candy").on("click", (e) => {
        const limitCheck = checkCandiesLimit(1);
        if (!limitCheck.allowed) {
            e.preventDefault();
            e.stopPropagation();
            swal({ title: "Превышен лимит", text: "Удалите лишние аккаунты перед добавлением новых", type: "warning", confirmButtonText: "Понятно" });
            return false;
        }
    });

    // Кнопка импорта (проверка лимита)
    $('label[for="btn_master_import"]').on("click", (e) => {
        const limitCheck = checkCandiesLimit(1);
        if (!limitCheck.allowed) {
            e.preventDefault();
            e.stopPropagation();
            swal("Превышен лимит", "Удалите лишние аккаунты перед импортом новых", "warning");
            return false;
        }
    });

    // Импорт
    $("#btn_master_import").on("change", () => {
        preloadShow();
        importCandies(masterPassword, {
            complete: () => preloadHide(),
        });
    });

    // Экспорт
    $("#btn_master_export").on("click", () => {
        preloadShow();
        exportAccounts(masterPassword, enMasterPassword, saveJSONToFile, deMP, {
            complete: () => preloadHide(),
        });
    });

    // Модальные окна
    $("#CandyModal").on("show.bs.modal", (e) => {
        let accountId = $(e.relatedTarget).attr("data-id");
        $("#cm-in-site")
            .val($('.td-site[data-id="' + accountId + '"]').text())
            .trigger("input");
        $("#cm-in-description")
            .val($('.td-description[data-id="' + accountId + '"]').text())
            .trigger("input");
        $("#cm-in-login").val($('.td-login[data-id="' + accountId + '"]').text());
        $("#cm-in-password").val($('.td-password[data-id="' + accountId + '"]').text());
        $("#modal-btn-account_delete").attr("data-id", accountId);
    });

    $("#CandyModal").on("hidden.bs.modal", () => {
        $("#cm-in-new_login").val("").trigger("input");
        $("#cm-in-new_password").val("").trigger("input");
    });

    $("#CreateCandyModal").on("show.bs.modal", () => {
        $("#ccm-in-site, #ccm-in-description, #ccm-in-login, #ccm-in-password").trigger("input");
    });

    $("#CreateCandyModal").on("hidden.bs.modal", () => {
        $("#ccm-in-login").val("");
        $("#ccm-in-password").val("");
    });

    $("#EnterKeyModal").on("shown.bs.modal", () => $("#in-enter_master_password").focus());

    $("#EnterKeyModal").on("hide.bs.modal", () => {
        if (isAllowShowPage) {
            let tds = $("td");
            if (tds.length > 0) {
                tds.each((_, td) => {
                    if (!["td-login td-hide", "td-password td-hide", "td-favicon"].includes(td.className)) {
                        td.innerHTML = decrypt(td.innerHTML, masterPassword);
                    }
                });
            }
            configureTable();
            $(".favicon-sites").each(function () {
                const siteText = $('.td-site[data-id="' + $(this).attr("data-id") + '"]').text();
                $(this).attr("src", safeFaviconUrl(siteText));
            });
            $(".footer-urls").show();
            $(".js-reload_enter_key_modal").hide();
            $(".candies_container").show();
        } else {
            $(".js-reload_enter_key_modal").show();
            $("#in-enter_master_password").val("");
        }
    });

    $("#MasterPasswordModal").on("hide.bs.modal", () => {
        if (masterPassword == "doesnotexist") $(".js-reload_master_password_modal").show();
    });

    // Удаление конфетки
    $("#modal-btn-account_delete").on("click", () => {
        swal({ title: "Вы уверены?", text: "Эту запись потом не восстановить!", type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55", confirmButtonText: "Да, удалить это!" }, () => {
            preloadShow();
            deleteCandy($("#modal-btn-account_delete").attr("data-id"), {
                complete: () => preloadHide(),
            });
        });
    });

    // Сохранение изменений конфетки
    $("#modal-btn-save").on("click", () => {
        if ($("#cm-in-site").val() == "") {
            swal('Заполните поле "Сайт"', "", "info");
        } else {
            preloadShow();
            changeCandy(masterPassword, {
                complete: () => preloadHide(),
            });
        }
    });

    // Логин/пароль копирование
    $("#modal-btn-login").on("click", () => {
        let key = decrypt($("#cm-in-login").val(), masterPassword);
        if (key) {
            if (isAllowCopy) copyToClipboard(key);
            else {
                swal(key);
                isAllowCopy = true;
            }
        } else swal("Ошибка", "Не правильный пароль", "warning");
    });

    $("#modal-btn-password").on("click", () => {
        let key = decrypt($("#cm-in-password").val(), masterPassword);
        if (key) {
            if (isAllowCopy) copyToClipboard(key);
            else {
                swal(key);
                isAllowCopy = true;
            }
        } else swal("Ошибка", "Не правильный пароль", "warning");
    });

    // Долгое нажатие
    $("#modal-btn-password")
        .on("touchstart mousedown", () => {
            pressTimer = setTimeout(() => {
                isAllowCopy = false;
                $("#modal-btn-password").click();
            }, 500);
        })
        .on("touchend mouseup", () => clearTimeout(pressTimer));

    $("#modal-btn-login")
        .on("touchstart mousedown", () => {
            pressTimer = setTimeout(() => {
                isAllowCopy = false;
                $("#modal-btn-login").click();
            }, 500);
        })
        .on("touchend mouseup", () => clearTimeout(pressTimer));

    // Поиск
    $("#in-search").on("keyup", function () {
        let $rows = $("tbody tr");
        if ($(this).val() == "") {
            $rows.fadeIn(100);
        } else {
            let $matchingCells = $(".td-site:contains(" + $(this).val().toLowerCase() + ")");
            $rows.fadeOut(100);
            $matchingCells.parent().fadeIn(100);
        }
    });

    // Валидация пароля для мастер-пароля
    let isNewPasswordValid = false,
        isRepeatPasswordValid = false;

    $("#in-new_password")
        .on("input", validateNewPassword)
        .focus(() => $("#password_info").show())
        .blur(() => $("#password_info").hide());

    $("#in-repeat_new_password").on("input", validateRepeatPassword);

    function validateNewPassword() {
        let password = $("#in-new_password").val();
        let rules = {
            length: password.length >= 8,
            letter: /[a-z]/.test(password),
            capital: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
        };
        $("#length")
            .removeClass("valid invalid")
            .addClass(rules.length ? "valid" : "invalid");
        $("#letter")
            .removeClass("valid invalid")
            .addClass(rules.letter ? "valid" : "invalid");
        $("#capital")
            .removeClass("valid invalid")
            .addClass(rules.capital ? "valid" : "invalid");
        $("#number")
            .removeClass("valid invalid")
            .addClass(rules.number ? "valid" : "invalid");
        isNewPasswordValid = Object.values(rules).every(Boolean);
        $("#in-new_password").toggleClass("input-invalid", !isNewPasswordValid);
        validateRepeatPassword();
    }

    function validateRepeatPassword() {
        isRepeatPasswordValid = $("#in-new_password").val() === $("#in-repeat_new_password").val();
        $("#in-repeat_new_password").toggleClass("input-invalid", !isRepeatPasswordValid);
    }

    // Сохранение мастер-пароля
    $("#btn-send_master_password").on("click", () => {
        let hasOldPass = $("#in-old_password").attr("disabled");
        if ((!hasOldPass && $("#in-old_password").val() == "") || (hasOldPass && $("#in-old_password").val() != "")) {
            swal('Заполните поле "Старый пароль"', "", "info");
        } else if ($("#in-new_password").val() == "") {
            swal('Заполните поле "Новый пароль"', "", "info");
        } else if ($("#in-repeat_new_password").val() == "") {
            swal('Заполните поле "Подтвердите новый пароль"', "", "info");
        } else if ($("#in-new_password").val() != $("#in-repeat_new_password").val()) {
            swal("Пароли не совпадают", "", "warning");
        } else if (!hasOldPass && deMP(enMasterPassword, $("#in-old_password").val()) == "") {
            swal("Не правильный старый пароль", "", "warning");
        } else if (isNewPasswordValid && isRepeatPasswordValid) {
            preloadShow();
            changeOrCreateMasterPassword($("#in-new_password").val(), masterPassword, defaultCs, {
                success: () => (location.href = location.href),
                complete: () => preloadHide(),
            });
        }
    });
});

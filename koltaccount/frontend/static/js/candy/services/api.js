import { addImportedCandiesToTable, createNewRowElement } from "../components/table.js";
import { decrypt, encrypt } from "../crypto.js";
import { highlightRow, safeFaviconUrl } from "../utils/helpers.js";
import { checkCandiesLimit } from "./limit.js";

export function createCandy(masterPassword, callbacks) {
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
            let candyId = result["candy_id"];
            let $newRow = createNewRowElement(candyId, site, description, login, password).hide();

            $("#CandiesTable").children("tbody").first().append($newRow);
            $("#CreateCandyModal").modal("hide");

            $newRow.fadeIn(150, function () {
                $("#CandiesTable").trigger("update", [
                    true,
                    function () {
                        const candyCount = parseInt($("#candies_count").text());
                        $("#candies_count").text(candyCount + 1);
                        $("#ccm-in-site, #ccm-in-description").val("");
                        highlightRow(candyId);
                    },
                ]);
            });
            if (callbacks?.success) callbacks.success();
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
            if (callbacks?.error) callbacks.error();
        },
        complete: () => {
            if (callbacks?.complete) callbacks.complete();
        },
    });
}

export function deleteCandy(candyId, callbacks) {
    $.ajax({
        url: "delete_candy/",
        type: "POST",
        data: { candy_id: candyId },
        success: function () {
            $("#CandyModal").modal("hide");
            $(`tr[data-id="${candyId}"]`).fadeOut(150, function () {
                $(this).remove();
                const candyCount = parseInt($("#candies_count").text());
                $("#candies_count").text(candyCount - 1);
            });
            if (callbacks?.success) callbacks.success();
        },
        error: function (jqXHR) {
            if (jqXHR.status === 400) {
                swal("Ошибка", "Не передан ID записи", "warning");
            } else if (jqXHR.status === 404) {
                swal("Ошибка", "Запись не найдена", "warning");
            } else {
                swal("Ошибка", "Что-то пошло не так", "error");
            }
            if (callbacks?.error) callbacks.error();
        },
        complete: () => {
            if (callbacks?.complete) callbacks.complete();
        },
    });
}

export function clearAllCandies(callbacks) {
    $.ajax({
        url: "clear_all_candies/",
        type: "POST",
        success: function () {
            $("#CandiesTable tbody tr").fadeOut(150, function () {
                $(this).remove();
                $("#candies_count").text("0");
            });
            if (callbacks?.success) callbacks.success();
        },
        error: function (jqXHR) {
            if (jqXHR.status === 404) {
                swal("Ошибка", "Нет аккаунтов для удаления", "info");
            } else {
                swal("Ошибка", "Что-то пошло не так", "error");
            }
            if (callbacks?.error) callbacks.error();
        },
        complete: () => {
            if (callbacks?.complete) callbacks.complete();
        },
    });
}

export function changeCandy(masterPassword, callbacks) {
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

    if (Object.keys(data).length === 1) {
        $("#CandyModal").modal("hide");
        highlightRow(candyId);
        if (callbacks?.complete) callbacks.complete();
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
            if (callbacks?.success) callbacks.success();
        },
        error: function (jqXHR) {
            if (jqXHR.status === 400) {
                swal("Ошибка", "Не передан ID конфетки", "warning");
            } else if (jqXHR.status === 404) {
                swal("Ошибка", "Конфетка не найдена", "warning");
            } else {
                swal("Ошибка", "Что-то пошло не так", "error");
            }
            if (callbacks?.error) callbacks.error();
        },
        complete: () => {
            if (callbacks?.complete) callbacks.complete();
        },
    });
}

export function importCandies(masterPassword, callbacks) {
    const file = $("#btn_master_import")[0].files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = async function () {
        try {
            const candies = JSON.parse(reader.result);

            if (!Array.isArray(candies)) {
                throw new Error("Файл должен содержать массив");
            }

            const limitCheck = checkCandiesLimit(candies.length);
            if (!limitCheck.allowed) {
                swal("Превышен лимит", `Вы пытаетесь добавить ${candies.length} записей из ${limitCheck.available} доступных`, "warning");
                if (callbacks?.complete) callbacks.complete();
                return;
            }

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
                data: { candies: JSON.stringify(candiesForServer) },
                success: function (result) {
                    addImportedCandiesToTable(result.imported, candiesForTable);
                    const candyCount = parseInt($("#candies_count").text());
                    $("#candies_count").text(candyCount + result.success_count);
                    let message = `Импортировано: ${result.success_count} из ${result.total}`;
                    if (result.error_count > 0) message += `\nОшибок: ${result.error_count}`;
                    swal(result.error_count > 0 ? "Импорт завершен с ошибками" : "Импорт успешно завершен", message, result.error_count > 0 ? "warning" : "success");
                    $("#CandiesTable").trigger("sorton", [[[1, 0]]]);
                    if (callbacks?.success) callbacks.success();
                },
                error: function (jqXHR) {
                    if (jqXHR.status === 422) {
                        swal("Превышен лимит", "Достигнут лимит на добавление записей", "warning");
                    } else if (jqXHR.status === 400) {
                        swal("Ошибка", "Неверный формат JSON файла", "error");
                    } else {
                        swal("Ошибка", "Что-то пошло не так", "error");
                    }
                    if (callbacks?.error) callbacks.error();
                },
                complete: () => {
                    $("#btn_master_import").val("");
                    if (callbacks?.complete) callbacks.complete();
                },
            });
        } catch (e) {
            swal("Ошибка", "Неверный формат JSON файла: " + e.message, "error");
            $("#btn_master_import").val("");
            if (callbacks?.complete) callbacks.complete();
        }
    };
}

export function exportAccounts(masterPassword, enMasterPassword, saveJSONToFile, deMP, callbacks) {
    let oldPassword = $("#in-old_password").val();
    if (masterPassword == "doesnotexist") {
        swal("Необходимо создать мастер пароль", "", "info");
        if (callbacks?.complete) callbacks.complete();
        return;
    }
    if (oldPassword == "") {
        swal('Введите пароль в поле "Старый пароль"', "", "info");
        if (callbacks?.complete) callbacks.complete();
        return;
    }
    if (deMP(enMasterPassword, oldPassword) == "") {
        swal("Не правильный пароль", "", "warning");
        if (callbacks?.complete) callbacks.complete();
        return;
    }

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
                jsonData[rowIndex] = { ...jsonData[rowIndex], description: data };
            } else if (cellIndex == 2) {
                jsonData[rowIndex] = { ...jsonData[rowIndex], login: decrypt(data, masterPassword) };
            } else if (cellIndex == 3) {
                jsonData[rowIndex] = { ...jsonData[rowIndex], password: decrypt(data, masterPassword) };
            }
            cellIndex += 1;
        }
    });
    saveJSONToFile(jsonData, "KoltAccount dump");
    if (callbacks?.complete) callbacks.complete();
}

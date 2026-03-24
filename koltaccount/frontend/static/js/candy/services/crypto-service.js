import { decrypt, deMP, encrypt, enMP, setCryptoSettings } from "../crypto.js";

export function getMasterPassword(callbacks) {
    $.ajax({
        url: "get_master_password/",
        type: "GET",
        success: function (result) {
            callbacks.success({
                password: result.password,
                crypto_settings: result.crypto_settings,
                default_crypto_settings: JSON.parse(result.default_crypto_settings),
            });
        },
        error: function (jqXHR) {
            if (jqXHR.status === 404) {
                const defaultCs = JSON.parse(jqXHR.responseJSON.default_crypto_settings);
                callbacks.error(defaultCs);
            } else {
                swal("Ошибка", "Что-то пошло не так", "error");
            }
        },
        complete: () => callbacks.complete && callbacks.complete(),
    });
}

export function authorize(key, cs, defaultCs, enMasterPassword, callbacks) {
    if (key == "") {
        $("#in-enter_master_password").focus();
        $("#EnterKeyModal").modal("show");
        return;
    }

    setCryptoSettings(defaultCs, {});
    let decryptCs = decrypt(cs, key);
    if (decryptCs) {
        setCryptoSettings(defaultCs, JSON.parse(decryptCs));
        key = deMP(enMasterPassword, key);
    } else {
        key = "";
    }

    if (key == "") {
        $("#in-enter_master_password").val("").focus();
        $("#EnterKeyModal").modal("show");
        return false;
    }

    callbacks.success(key);
    return true;
}

export function changeOrCreateMasterPassword(newMasterPassword, masterPassword, defaultCs, enMasterPassword, callbacks) {
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

    const HASH = enMP(newMasterPassword);
    const MASTER_PASSWORD_KEY = HASH.key;
    const ENCRYPTED_MASTER_PASSWORD = HASH.result;
    const ENCRYPTED_CRYPTO_SETTINGS = encrypt(JSON.stringify(CRYPTO_SETTINGS), newMasterPassword);

    let dataToSend = {
        new_cs: ENCRYPTED_CRYPTO_SETTINGS,
        new_master_password: ENCRYPTED_MASTER_PASSWORD,
    };

    if ($("td").length > 0) {
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
                logins[accountId] = encrypt(decrypt(this.innerHTML, masterPassword), MASTER_PASSWORD_KEY);
            } else if ($(this).hasClass("td-password")) {
                passwords[accountId] = encrypt(decrypt(this.innerHTML, masterPassword), MASTER_PASSWORD_KEY);
            }
        });

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
        success: () => callbacks.success && callbacks.success(),
        error: () => swal("Ошибка", "Что-то пошло не так", "error"),
        complete: () => callbacks.complete && callbacks.complete(),
    });
}

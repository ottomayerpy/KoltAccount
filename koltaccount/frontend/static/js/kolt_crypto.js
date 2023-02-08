// CS (Crypto Settings) - Индивидуальные настройки шифрования пользователя
var CS;

function setCryptoSettings(default_CS, update_CS) {
    CS = {
        ...default_CS,
        ...update_CS
    }
}

function encrypt_Pbkdf2HmacSha256(password, salt = null) {
    // Функция шифрования алгоритмом Pbkdf2HmacSha256
    const hmac = CryptoJS.HmacSHA256(password, password);
    if (salt == null) {
        salt = CryptoJS.lib.WordArray.random(CS.SALT.size / CS.SALT.division);
        return {
            'key': CryptoJS.PBKDF2(
                hmac,
                salt,
                {
                    keySize: CS.KEY.size / CS.KEY.division,
                    iterations: CS.ITERATIONS,
                    hasher: CryptoJS.algo.SHA256
                }
            ).toString(),
            'salt': salt
        };
    } else {
        return CryptoJS.PBKDF2(
            hmac,
            salt,
            {
                keySize: CS.KEY.size / CS.KEY.division,
                iterations: CS.ITERATIONS,
                hasher: CryptoJS.algo.SHA256
            }
        ).toString();
    }
}

function enMP(password) {
    // Шифровка мастер пароля
    const hash = encrypt_Pbkdf2HmacSha256(password);
    const master_password_key = hash.key;
    const salt = hash.salt;
    const msg = CryptoJS.lib.WordArray.random(CS.SALT.size / CS.SALT.division).toString();

    const encrypted = encrypt(msg, master_password_key, salt);

    return {
        'result': encrypted,
        'key': master_password_key
    }
}

function deMP(transitmessage, password) {
    // Дешифровка мастер пароля
    const hexResult = base64ToHex(transitmessage);

    const salt = CryptoJS.enc.Hex.parse(hexResult.substring(CS.DECRYPT_SUBSTRING.mp.start, CS.DECRYPT_SUBSTRING.mp.end));
    const encrypted = hexToBase64(hexResult.substring(CS.DECRYPT_SUBSTRING.mp.end));

    const key = encrypt_Pbkdf2HmacSha256(password, salt);

    const decrypted = decrypt(encrypted, key);

    if (decrypted != '') {
        return key;
    }
    return decrypted;
}

function hexToBase64(str) {
    // HEX конвертирование в BASE64
    return btoa(String.fromCharCode.apply(null,
        str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

function base64ToHex(str) {
    // BASE64 конвертирование в HEX
    for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
        let tmp = bin.charCodeAt(i).toString(16);
        if (tmp.length === 1) tmp = "0" + tmp;
        hex[hex.length] = tmp;
    }
    return hex.join("");
}

function encrypt(msg, key, salt_master_password = null) {
    /* Шифрование строки */
    const iv = CryptoJS.lib.WordArray.random(CS.IV.size / CS.IV.division);
    const result = CryptoJS.AES.encrypt(msg, key, {
        iv: iv,
        padding: CryptoJS.pad[CS.CRYPT_STR_AES.padding],
        mode: CryptoJS.mode[CS.CRYPT_STR_AES.mode]
    }).toString();

    if (salt_master_password == null) {
        return hexToBase64(iv + base64ToHex(result));
    } else {
        return hexToBase64(salt_master_password + iv + base64ToHex(result));
    }
}

function decrypt(str, key) {
    /* Дешифрование строки */
    try {
        const hexResult = base64ToHex(str);
        const iv = CryptoJS.enc.Hex.parse(hexResult.substring(CS.DECRYPT_SUBSTRING.str.start, CS.DECRYPT_SUBSTRING.str.end));
        const encrypted = hexToBase64(hexResult.substring(CS.DECRYPT_SUBSTRING.str.end));

        return CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            padding: CryptoJS.pad[CS.CRYPT_STR_AES.padding],
            mode: CryptoJS.mode[CS.CRYPT_STR_AES.mode]
        }).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        if (e.message == 'Malformed UTF-8 data') {
            // Если были искажены данные
            return '';
        } else {
            swal('Ошибка', 'Дешифрование данных не удалось');
            throw e;
        }
    }
}

export {setCryptoSettings, enMP, deMP, encrypt, decrypt};

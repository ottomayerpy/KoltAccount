$(function() {
    const keySize = 256;
    const ivSize = 128;
    const saltSize = 256;
    const iterations = 11579;

    function encrypt_Pbkdf2HmacSha256(password, salt = null) {
        const hmac = CryptoJS.HmacSHA256(password, password);
        if (salt == null) {
            salt = CryptoJS.lib.WordArray.random(saltSize / 8);
            return {
                'key': CryptoJS.PBKDF2(hmac, salt, { keySize: keySize / 32, iterations: iterations, hasher: CryptoJS.algo.SHA256 }).toString(),
                'salt': salt
            };
        } else {
            return CryptoJS.PBKDF2(hmac, salt, { keySize: keySize / 32, iterations: iterations, hasher: CryptoJS.algo.SHA256 }).toString();
        }
    }

    window.enMP = function(password) {
        const hash = encrypt_Pbkdf2HmacSha256(password);
        const master_password_key = hash.key;
        const salt = hash.salt;
        const msg = CryptoJS.lib.WordArray.random(saltSize / 8).toString();

        const encrypted = encrypt(msg, master_password_key, salt);

        return {
            'result': encrypted,
            'key': master_password_key
        }
    }

    window.deMP = function(transitmessage, password) {
        const hexResult = base64ToHex(transitmessage);

        const salt = CryptoJS.enc.Hex.parse(hexResult.substr(0, 64));
        const encrypted = hexToBase64(hexResult.substr(64));

        const key = encrypt_Pbkdf2HmacSha256(password, salt);

        const decrypted = decrypt(encrypted, key);

        if (decrypted != '') {
            return key;
        }
        return decrypted;
    }

    function hexToBase64(str) {
        return btoa(String.fromCharCode.apply(null,
            str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    }

    function base64ToHex(str) {
        for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
            let tmp = bin.charCodeAt(i).toString(16);
            if (tmp.length === 1) tmp = "0" + tmp;
            hex[hex.length] = tmp;
        }
        return hex.join("");
    }

    window.encrypt = function(msg, key, salt_master_password = null) {
        /* Шифрование строки */
        const iv = CryptoJS.lib.WordArray.random(ivSize / 8);
        const result = CryptoJS.AES.encrypt(msg, key, {
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        }).toString();

        if (salt_master_password == null) {
            return hexToBase64(iv + base64ToHex(result));
        } else {
            return hexToBase64(salt_master_password + iv + base64ToHex(result));
        }
    }

    window.decrypt = function(str, key) {
        /* Дешифрование строки */
        try {
            const hexResult = base64ToHex(str);
            const iv = CryptoJS.enc.Hex.parse(hexResult.substr(0, 32));
            const encrypted = hexToBase64(hexResult.substr(32));

            return CryptoJS.AES.decrypt(encrypted, key, {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
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

    // console.log(decrypt(encrypt('mg','hehe'), 'hehe'));

    // const encry = enMP('health57');
    // const decry = deMP(encry.result, 'health57');

    // console.log(encry);
    // console.log("Decrypted: " + decry);

    // function encrypt(str, key) {
    //     /* Шифрование строки */
    //     return CryptoJS.AES.encrypt(str, key).toString();
    // }

    // function decrypt(str, key) {
    //     /* Дешифрование строки */
    //     try {
    //         return CryptoJS.AES.decrypt(str, key).toString(CryptoJS.enc.Utf8);
    //     } catch (e) {
    //         if (e.message == 'Malformed UTF-8 data') {
    //             // Если были искажены данные
    //             return '';
    //         } else {
    //             swal('Ошибка', 'Не удалось дешифровать строку');
    //             throw e;
    //         }
    //     }
    // }
});
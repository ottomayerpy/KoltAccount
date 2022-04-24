$(function () {
    // CS (Crypto Settings) - Индивидуальные настройки шифрования пользователя
    let CS;
    get_crypto_settings();

    function get_crypto_settings() {
        /* Получение настроек шифрования */
        $.ajax({
            url: 'get_crypto_settings/',
            type: 'GET',
            success: function (result) {
                CS = {
                    KEY: {
                        size: result['key']['size'],
                        division: result['key']['division']
                    },
                    IV: {
                        size: result['iv']['size'],
                        division: result['iv']['division']
                    },
                    SALT: {
                        size: result['salt']['size'],
                        division: result['salt']['division']
                    },
                    ITERATIONS: result['iterations']
                };
            },
            error: function (jqXHR, text, error) {
                if (error == 'Forbidden') {
                    swal(
                        'Ошибка 403',
                        'Этот сайт требует наличия файла cookie CSRF при отправке форм.' +
                        ' Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie,' +
                        ' включите их снова, по крайней мере, для этого сайта.'
                    )
                    preload_hide();
                }
            }
        });
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

    window.enMP = function (password) {
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

    window.deMP = function (transitmessage, password) {
        // Дешифровка мастер пароля
        const hexResult = base64ToHex(transitmessage);

        const salt = CryptoJS.enc.Hex.parse(hexResult.substring(0, 64));
        const encrypted = hexToBase64(hexResult.substring(64));

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

    window.encrypt = function (msg, key, salt_master_password = null) {
        /* Шифрование строки */
        const iv = CryptoJS.lib.WordArray.random(CS.IV.size / CS.IV.division);
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

    window.decrypt = function (str, key) {
        /* Дешифрование строки */
        try {
            const hexResult = base64ToHex(str);
            const iv = CryptoJS.enc.Hex.parse(hexResult.substring(0, 32));
            const encrypted = hexToBase64(hexResult.substring(32));

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
/**
 * Глобальные настройки шифрования (CRYPTO SETTINGS)
 * Хранит текущие параметры шифрования: KEY, IV, SALT, ITERATIONS, CRYPT_STR_AES, DECRYPT_SUBSTRING
 */
let cryptoState = {};

/**
 * Обновление настроек шифрования
 *
 * @param {Object} newSettings - Новые настройки (объединяются с существующими)
 */
export function updateCryptoSettings(newSettings) {
    cryptoState = { ...cryptoState, ...newSettings };
}

/**
 * Генерация ключа PBKDF2-HMAC-SHA256 из пароля
 *
 * @param {string} password - Исходный пароль
 * @param {Object|null} salt - Соль (если null - генерируется случайная)
 * @returns {Object|string}
 *          - если salt === null: { key: string, salt: Object } (новый ключ и соль)
 *          - если salt передан: string (только ключ)
 */
function deriveKeyFromPassword(password, salt = null) {
    // Хешируем пароль самим собой для усиления энтропии
    const passwordHash = CryptoJS.HmacSHA256(password, password);

    // Если соль не передана — генерируем новую
    if (salt == null) {
        const newSalt = CryptoJS.lib.WordArray.random(cryptoState.SALT.size / cryptoState.SALT.division);

        return {
            key: CryptoJS.PBKDF2(passwordHash, newSalt, {
                keySize: cryptoState.KEY.size / cryptoState.KEY.division,
                iterations: cryptoState.ITERATIONS,
                hasher: CryptoJS.algo.SHA256,
            }).toString(),
            salt: newSalt,
        };
    }

    // Если соль передана — генерируем только ключ (для проверки пароля)
    return CryptoJS.PBKDF2(passwordHash, salt, {
        keySize: cryptoState.KEY.size / cryptoState.KEY.division,
        iterations: cryptoState.ITERATIONS,
        hasher: CryptoJS.algo.SHA256,
    }).toString();
}

/**
 * Шифрование мастер-пароля для хранения в БД
 *
 * @param {string} password - Исходный мастер-пароль
 * @returns {Object} Результат шифрования
 * @returns {string} result - Зашифрованное сообщение (хранится в БД)
 * @returns {string} key - Мастер-ключ (используется для перешифровки конфеток)
 */
export function encryptMasterPassword(password) {
    // Генерируем ключ и соль из пароля
    const { key: masterKey, salt } = deriveKeyFromPassword(password);

    // Генерируем случайное сообщение для проверки корректности расшифровки
    const randomMessage = CryptoJS.lib.WordArray.random(cryptoState.SALT.size / cryptoState.SALT.division).toString();

    // Шифруем сообщение с добавлением соли
    const encrypted = encryptWithSettings(randomMessage, masterKey, salt);

    return {
        result: encrypted, // зашифрованный мастер-пароль
        key: masterKey, // мастер-ключ (используется на клиенте)
    };
}

/**
 * Дешифровка мастер-пароля для проверки введенного ключа
 *
 * @param {string} encryptedMasterPassword - Зашифрованный мастер-пароль из БД
 * @param {string} userPassword - Введенный пользователем пароль
 * @returns {string} Мастер-ключ (если пароль верный) или пустая строка
 */
export function decryptMasterPassword(encryptedMasterPassword, userPassword) {
    // Преобразуем base64 в hex
    const hexData = base64ToHex(encryptedMasterPassword);

    // Извлекаем соль из начала строки
    const salt = CryptoJS.enc.Hex.parse(hexData.substring(cryptoState.DECRYPT_SUBSTRING.mp.start, cryptoState.DECRYPT_SUBSTRING.mp.end));

    // Извлекаем зашифрованное сообщение (без соли)
    const encrypted = hexToBase64(hexData.substring(cryptoState.DECRYPT_SUBSTRING.mp.end));

    // Пытаемся восстановить ключ из пароля и соли
    const derivedKey = deriveKeyFromPassword(userPassword, salt);

    // Пытаемся расшифровать сообщение
    const decrypted = decryptWithSettings(encrypted, derivedKey);

    // Если расшифровка удалась — возвращаем ключ
    if (decrypted !== "") {
        return derivedKey;
    }

    return "";
}

/**
 * Преобразование HEX строки в BASE64
 *
 * @param {string} hexString - HEX строка (например, "48656c6c6f")
 * @returns {string} BASE64 строка
 */
function hexToBase64(hexString) {
    return btoa(
        String.fromCharCode.apply(
            null,
            hexString
                .replace(/\r|\n/g, "")
                .replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
                .replace(/ +$/, "")
                .split(" "),
        ),
    );
}

/**
 * Преобразование BASE64 строки в HEX
 *
 * @param {string} base64String - BASE64 строка
 * @returns {string} HEX строка
 */
function base64ToHex(base64String) {
    const binary = atob(base64String.replace(/[ \r\n]+$/, ""));
    const hex = [];

    for (let i = 0; i < binary.length; i++) {
        let charCode = binary.charCodeAt(i).toString(16);
        if (charCode.length === 1) charCode = "0" + charCode;
        hex.push(charCode);
    }

    return hex.join("");
}

/**
 * Шифрование строки с использованием настроек cryptoState
 *
 * @param {string} message - Исходное сообщение
 * @param {string} key - Ключ шифрования
 * @param {Object|null} salt - Соль (если передана, добавляется в начало)
 * @returns {string} Зашифрованная строка в base64
 */
export function encryptWithSettings(message, key, salt = null) {
    // Генерируем случайный вектор инициализации
    const iv = CryptoJS.lib.WordArray.random(cryptoState.IV.size / cryptoState.IV.division);

    // Шифруем сообщение AES
    const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        padding: CryptoJS.pad[cryptoState.CRYPT_STR_AES.padding],
        mode: CryptoJS.mode[cryptoState.CRYPT_STR_AES.mode],
    }).toString();

    // Формируем результат: соль + iv + зашифрованное сообщение
    const ivHex = iv.toString();
    const encryptedHex = base64ToHex(encrypted);

    if (salt == null) {
        return hexToBase64(ivHex + encryptedHex);
    } else {
        return hexToBase64(salt + ivHex + encryptedHex);
    }
}

/**
 * Дешифрование строки с использованием настроек cryptoState
 *
 * @param {string} encryptedBase64 - Зашифрованная строка в base64
 * @param {string} key - Ключ дешифрования
 * @returns {string} Расшифрованное сообщение или пустая строка при ошибке
 */
export function decryptWithSettings(encryptedBase64, key) {
    try {
        const hexData = base64ToHex(encryptedBase64);

        // Извлекаем вектор инициализации
        const iv = CryptoJS.enc.Hex.parse(hexData.substring(cryptoState.DECRYPT_SUBSTRING.str.start, cryptoState.DECRYPT_SUBSTRING.str.end));

        // Извлекаем зашифрованное сообщение
        const encrypted = hexToBase64(hexData.substring(cryptoState.DECRYPT_SUBSTRING.str.end));

        // Расшифровываем
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            padding: CryptoJS.pad[cryptoState.CRYPT_STR_AES.padding],
            mode: CryptoJS.mode[cryptoState.CRYPT_STR_AES.mode],
        }).toString(CryptoJS.enc.Utf8);

        return decrypted;
    } catch (error) {
        // Если данные повреждены
        if (error.message === "Malformed UTF-8 data") {
            return "";
        }

        // Другие ошибки
        swal("Ошибка", "Дешифрование данных не удалось", "error");
        throw error;
    }
}

// Сохраняем старые названия для обратной совместимости
export const enMP = encryptMasterPassword;
export const deMP = decryptMasterPassword;
export const encrypt = encryptWithSettings;
export const decrypt = decryptWithSettings;

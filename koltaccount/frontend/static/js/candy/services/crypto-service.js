import { decrypt, deMP, encrypt, enMP, updateCryptoSettings } from "../crypto.js";

/**
 * Получение мастер-пароля и настроек шифрования с сервера
 *
 * @param {Object} callbacks - Колбэки для обработки ответа
 * @param {Function} callbacks.success - Вызывается при успешном получении данных
 * @param {Object} callbacks.success.password - Зашифрованный мастер-пароль из БД
 * @param {Object} callbacks.success.crypto_settings - Персональные настройки шифрования пользователя
 * @param {Function} callbacks.error - Вызывается при ошибке (опционально)
 * @param {Function} callbacks.complete - Вызывается всегда после завершения запроса (для скрытия прелоадера)
 */
export function getMasterPassword(callbacks) {
    $.ajax({
        url: "get_master_password/",
        type: "GET",

        /**
         * Успешный ответ (200 OK)
         * @param {Object} result - Данные от сервера
         * @param {string} result.password - Зашифрованный мастер-пароль
         * @param {string} result.crypto_settings - Зашифрованные настройки шифрования
         * @param {string} result.default_crypto_settings - Стандартные настройки шифрования (JSON строка)
         */
        success: function (result) {
            // Устанавливаем стандартные настройки как основу
            updateCryptoSettings(JSON.parse(result.default_crypto_settings));

            // Передаем данные в колбэк
            callbacks.success({
                password: result.password, // зашифрованный мастер-пароль
                crypto_settings: result.crypto_settings, // зашифрованные персональные настройки
            });
        },

        /**
         * Обработка ошибок
         * @param {Object} jqXHR - Объект XMLHttpRequest
         */
        error: function (jqXHR) {
            // 404 - мастер-пароль еще не создан (первый вход)
            if (jqXHR.status === 404) {
                // Устанавливаем стандартные настройки (без персональных)
                updateCryptoSettings(JSON.parse(jqXHR.responseJSON.default_crypto_settings));
                // error колбэк не вызываем, так как 404 - это ожидаемая ситуация
            } else {
                // Другие ошибки (500, 403 и т.д.) - показываем сообщение
                swal("Ошибка", "Что-то пошло не так", "error");
                callbacks?.error?.();
            }
        },

        // Всегда вызывается после success или error
        complete: () => callbacks.complete?.(),
    });
}

/**
 * Авторизация пользователя по мастер-паролю
 * Расшифровывает персональные настройки и проверяет корректность введенного ключа
 *
 * @param {string} key - Введенный пользователем мастер-пароль
 * @param {string} cs - Зашифрованные персональные настройки шифрования (из БД)
 * @param {string} enMasterPassword - Зашифрованный мастер-пароль (из БД)
 * @param {Object} callbacks - Колбэки для обратной связи
 * @param {Function} callbacks.success - Вызывается при успешной авторизации, передает расшифрованный мастер-пароль
 * @param {Function} callbacks.error - Вызывается при ошибке (пустой или неверный пароль)
 * @returns {boolean} true - успешная авторизация, false - ошибка
 */
export function authorize(key, cs, enMasterPassword, callbacks) {
    // 1. Проверка пустого ввода
    if (key == "") {
        $("#in-enter_master_password").focus(); // фокус на поле ввода
        $("#EnterKeyModal").modal("show"); // показываем модалку
        callbacks?.error?.(); // вызываем колбэк ошибки
        return false;
    }

    // 2. Расшифровка персональных настроек шифрования
    //    Если ключ неверный, decrypt вернет пустую строку
    let decryptCs = decrypt(cs, key);

    if (decryptCs) {
        // 2a. Ключ верный — обновляем настройки шифрования
        updateCryptoSettings(JSON.parse(decryptCs));
        // 2b. Расшифровываем сам мастер-пароль (получаем ключ для конфеток)
        key = deMP(enMasterPassword, key);
    } else {
        // 2c. Ключ неверный — обнуляем
        key = "";
    }

    // 3. Проверка успешности расшифровки
    if (key == "") {
        // Ключ не подошел — очищаем поле и просим ввести снова
        $("#in-enter_master_password").val("").focus();
        $("#EnterKeyModal").modal("show");
        callbacks?.error?.();
        return false;
    }

    // 4. Успех — передаем расшифрованный мастер-пароль
    callbacks?.success?.(key);
    return true;
}

/**
 * Сохраняет новый мастер-пароль и перешифровывает все конфетки
 *
 * @param {Object} formData - Данные из формы создания/изменения мастер-пароля
 * @param {string} formData.oldPassword - Старый мастер-пароль (пусто, если создается впервые)
 * @param {string} formData.newPassword - Новый мастер-пароль
 * @param {string} formData.repeatPassword - Подтверждение нового мастер-пароля
 * @param {string} formData.iterations - Количество итераций PBKDF2 (пусто = случайное)
 * @param {boolean} formData.hasOldPass - Требуется ли проверка старого пароля
 * @param {Object} formData.crypto - Настройки шифрования из выпадающих списков
 * @param {string[]} formData.crypto.key - Массив [размер, делитель] для ключа (например, ["256", "8"])
 * @param {string[]} formData.crypto.iv - Массив [размер, делитель] для вектора инициализации
 * @param {string[]} formData.crypto.salt - Массив [размер, делитель] для соли
 *
 * @param {Object} context - Контекст выполнения
 * @param {string} context.masterPassword - Текущий расшифрованный мастер-пароль
 * @param {string} context.enMasterPassword - Зашифрованный мастер-пароль из БД
 * @param {Object} context.callbacks - Колбэки для обратной связи
 * @param {Function} context.callbacks.success - Вызывается при успешном сохранении
 * @param {Function} context.callbacks.complete - Вызывается всегда после завершения (для скрытия прелоадера)
 */
export function saveMasterPassword(formData, { masterPassword, enMasterPassword, callbacks }) {
    // 1. Валидация данных формы
    const error = getValidationError(formData, enMasterPassword);
    if (error) {
        const type = error.includes("Пароли") || error.includes("старый") || error.includes("итераций") ? "warning" : "info";
        swal(error, "", type);
        callbacks?.complete?.();
        return;
    }

    // 2. Формирование настроек шифрования из выбранных пользователем параметров
    const cryptoSettings = {
        KEY: { size: formData.crypto.key[0], division: formData.crypto.key[1] },
        IV: { size: formData.crypto.iv[0], division: formData.crypto.iv[1] },
        SALT: { size: formData.crypto.salt[0], division: formData.crypto.salt[1] },
        ITERATIONS: formData.iterations || randomIterations(),
    };

    // 3. Обновление глобальных настроек шифрования
    updateCryptoSettings(cryptoSettings);

    // 4. Хеширование нового мастер-пароля (получаем ключ и зашифрованное значение)
    const hash = enMP(formData.newPassword);

    // 5. Подготовка данных для отправки на сервер
    const dataToSend = {
        new_cs: encrypt(JSON.stringify(cryptoSettings), formData.newPassword), // зашифрованные настройки
        new_master_password: hash.result, // зашифрованный мастер-пароль
        ...getReencryptedData(hash.key, masterPassword), // перешифрованные конфетки
    };

    // 6. Отправка на сервер
    $.ajax({
        url: "save_master_password/",
        type: "POST",
        data: dataToSend,
        success: () => callbacks?.success?.(),
        error: () => swal("Ошибка", "Что-то пошло не так", "error"),
        complete: () => callbacks?.complete?.(),
    });
}

/**
 * Проверка корректности введенных данных
 *
 * @param {Object} data - Данные формы (те же поля, что в formData)
 * @param {string} enMasterPassword - Зашифрованный мастер-пароль из БД (нужен для проверки старого пароля)
 * @returns {string|null} Текст ошибки для пользователя или null, если все поля заполнены верно
 */
function getValidationError(data, enMasterPassword) {
    // Проверка обязательных полей
    if (data.hasOldPass && !data.oldPassword) return 'Заполните поле "Старый пароль"';
    if (!data.newPassword) return 'Заполните поле "Новый пароль"';
    if (!data.repeatPassword) return 'Заполните поле "Подтвердите новый пароль"';

    // Проверка совпадения паролей
    if (data.newPassword !== data.repeatPassword) return "Пароли не совпадают";

    // Проверка правильности старого пароля (если требуется)
    if (data.hasOldPass && deMP(enMasterPassword, data.oldPassword) === "") {
        return "Не правильный старый пароль";
    }

    // Проверка диапазона итераций (если заданы)
    const iter = parseInt(data.iterations, 10);
    if (data.iterations && (iter < 57 || iter > 7999)) {
        return "Не допустимый диапазон итераций";
    }

    return null;
}

/**
 * Генерация случайного количества итераций в допустимом диапазоне (57-7999)
 * Используется, когда пользователь оставил поле "Кол-во итераций" пустым
 *
 * @returns {string} Строка с числом итераций (например, "3421")
 */
function randomIterations() {
    return (Math.random() * (7999 - 57) + 57).toFixed();
}

/**
 * Перешифровка всех конфеток новым мастер-ключом
 *
 * Процесс перешифровки:
 * 1. Для каждой строки таблицы находим ячейки сайта, описания, логина, пароля
 * 2. Сайт и описание шифруются новым ключом напрямую
 * 3. Логин и пароль сначала расшифровываются старым ключом, затем шифруются новым
 *
 * @param {string} masterKey - Новый мастер-ключ (получен из enMP(newPassword))
 * @param {string} oldMasterPassword - Текущий расшифрованный мастер-пароль (для расшифровки логинов/паролей)
 * @returns {Object} Объект с JSON-строками перешифрованных данных
 * @returns {string} return.sites - JSON строку вида {"id1": "encrypted_site1", "id2": "encrypted_site2"}
 * @returns {string} return.descriptions - JSON строку описаний
 * @returns {string} return.logins - JSON строку логинов
 * @returns {string} return.passwords - JSON строку паролей
 */
function getReencryptedData(masterKey, oldMasterPassword) {
    const $rows = $("tr");
    if (!$rows.length) return {};

    const reencrypt = { sites: {}, descriptions: {}, logins: {}, passwords: {} };

    $rows.each(function () {
        const $tr = $(this);
        const id = $tr.data("id");
        if (!id) return;

        // Перешифровываем каждое поле:
        // - сайт и описание шифруются новым ключом
        // - логин и пароль сначала расшифровываются старым ключом, потом шифруются новым
        reencrypt.sites[id] = encrypt($tr.find(".td-site").text(), masterKey);
        reencrypt.descriptions[id] = encrypt($tr.find(".td-description").text(), masterKey);
        reencrypt.logins[id] = encrypt(decrypt($tr.find(".td-login").text(), oldMasterPassword), masterKey);
        reencrypt.passwords[id] = encrypt(decrypt($tr.find(".td-password").text(), oldMasterPassword), masterKey);
    });

    return {
        sites: JSON.stringify(reencrypt.sites),
        descriptions: JSON.stringify(reencrypt.descriptions),
        logins: JSON.stringify(reencrypt.logins),
        passwords: JSON.stringify(reencrypt.passwords),
    };
}

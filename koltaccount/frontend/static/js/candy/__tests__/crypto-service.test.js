import $ from "jquery";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Мок крипто-модуля
vi.mock("../crypto.js", async () => {
    const actual = await vi.importActual("../crypto.js");
    return {
        ...actual,
        updateCryptoSettings: vi.fn(),
        enMP: vi.fn(() => ({ key: "master_key", result: "encrypted_master" })),
        encrypt: vi.fn(() => "encrypted_data"),
        decrypt: vi.fn(() => "decrypted_data"),
        deMP: vi.fn((encrypted, password) => (password === "correct" ? "decrypted_key" : "")),
    };
});

import { deMP, enMP, encrypt, updateCryptoSettings } from "../crypto.js";
import { getReencryptedData, getValidationError, randomIterations, saveMasterPassword, getMasterPassword } from "../services/crypto-service.js";

describe("saveMasterPassword", () => {
    let ajaxSpy, swalSpy, context;

    beforeEach(() => {
        vi.clearAllMocks();

        swalSpy = vi.fn();
        global.swal = swalSpy;

        ajaxSpy = vi.fn();
        global.$ = $;
        global.$.ajax = ajaxSpy;

        context = {
            masterPassword: "old",
            enMasterPassword: "enc",
            callbacks: {
                success: vi.fn(),
                error: vi.fn(),
                complete: vi.fn(),
            },
        };
        document.body.innerHTML = "";
    });

    // ==================== ВАЛИДАЦИЯ ====================
    describe("валидация", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };

        it("пустой старый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Старый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });

        it("пустой новый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "", repeatPassword: "", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Новый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });

        it("пустое подтверждение", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "new123", repeatPassword: "", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Подтвердите новый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });

        it("пароли не совпадают", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "new123", repeatPassword: "different", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Пароли не совпадают", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });

        it("неверный старый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "wrong", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Не правильный старый пароль", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });

        it("итерации вне диапазона", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "10000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Не допустимый диапазон итераций", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
            expect(context.callbacks.complete).toHaveBeenCalled();
        });
    });

    // ==================== УСПЕШНОЕ СОХРАНЕНИЕ ====================
    describe("успешное сохранение", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };

        it("создание нового мастер-пароля", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "5000", crypto: validCrypto }, context);
            expect(updateCryptoSettings).toHaveBeenCalled();
            expect(enMP).toHaveBeenCalledWith("new123");
            expect(encrypt).toHaveBeenCalled();
            expect(ajaxSpy).toHaveBeenCalled();
        });

        it("смена существующего мастер-пароля", () => {
            deMP.mockReturnValueOnce("decrypted_key");
            saveMasterPassword({ hasOldPass: true, oldPassword: "correct", newPassword: "new123", repeatPassword: "new123", iterations: "5000", crypto: validCrypto }, context);
            expect(deMP).toHaveBeenCalledWith("enc", "correct");
            expect(ajaxSpy).toHaveBeenCalled();
        });
    });

    // ==================== КОЛБЭКИ ====================
    describe("колбэки", () => {
        it("success вызывается после успеха", () => {
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            ajaxSpy.mock.calls[0][0].success();
            expect(context.callbacks.success).toHaveBeenCalled();
        });

        it("complete вызывается всегда", () => {
            saveMasterPassword(
                { hasOldPass: true, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            expect(context.callbacks.complete).toHaveBeenCalled();
        });
    });

    // ==================== ГРАНИЧНЫЕ СЛУЧАИ ====================
    describe("граничные случаи", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };

        it("итерации = 57 (мин)", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "57", crypto: validCrypto }, context);
            expect(ajaxSpy).toHaveBeenCalled();
        });

        it("итерации = 7999 (макс)", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "7999", crypto: validCrypto }, context);
            expect(ajaxSpy).toHaveBeenCalled();
        });

        it("итерации не указаны (рандом)", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "", crypto: validCrypto }, context);
            const settings = updateCryptoSettings.mock.calls[0][0];
            expect(parseInt(settings.ITERATIONS)).toBeGreaterThanOrEqual(57);
            expect(parseInt(settings.ITERATIONS)).toBeLessThanOrEqual(7999);
        });
    });

    // ==================== НАСТРОЙКИ ШИФРОВАНИЯ ====================
    describe("настройки шифрования", () => {
        it("KEY = 128/8", () => {
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["128", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            expect(updateCryptoSettings).toHaveBeenCalledWith(expect.objectContaining({ KEY: { size: "128", division: "8" } }));
        });

        it("IV = 256/8", () => {
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["256", "8"], salt: ["256", "8"] } },
                context,
            );
            expect(updateCryptoSettings).toHaveBeenCalledWith(expect.objectContaining({ IV: { size: "256", division: "8" } }));
        });
    });

    // ==================== ПЕРЕШИФРОВКА КОНФЕТОК ====================
    describe("перешифровка конфеток", () => {
        const uuid1 = "019d1e24-74b9-7456-9007-14575c99bcc1";
        const uuid2 = "019d1e24-74bc-7583-a601-ef85a1b022e6";

        beforeEach(() => {
            document.body.innerHTML = `
                <table id="CandiesTable">
                    <tbody>
                        <tr data-id="${uuid1}">
                            <td class="td-site">site1</td>
                            <td class="td-description">desc1</td>
                            <td class="td-login td-hide">enc_login1</td>
                            <td class="td-password td-hide">enc_pass1</td>
                        </tr>
                        <tr data-id="${uuid2}">
                            <td class="td-site">site2</td>
                            <td class="td-description">desc2</td>
                            <td class="td-login td-hide">enc_login2</td>
                            <td class="td-password td-hide">enc_pass2</td>
                        </tr>
                    </tbody>
                </table>
            `;
        });

        it("перешифровка всех полей", () => {
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            expect(encrypt).toHaveBeenCalled();

            const data = ajaxSpy.mock.calls[0][0].data;
            const sites = JSON.parse(data.sites);
            const descriptions = JSON.parse(data.descriptions);

            expect(sites).toHaveProperty(uuid1);
            expect(sites).toHaveProperty(uuid2);
            expect(descriptions).toHaveProperty(uuid1);
            expect(descriptions).toHaveProperty(uuid2);
        });

        it("нет конфеток — пропуск перешифровки", () => {
            document.body.innerHTML = "";
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            const data = ajaxSpy.mock.calls[0][0].data;
            expect(data.sites).toBeUndefined();
            expect(data.descriptions).toBeUndefined();
            expect(data.logins).toBeUndefined();
            expect(data.passwords).toBeUndefined();
        });
    });

    // ==================== ОШИБКИ СЕРВЕРА ====================
    describe("ошибки сервера", () => {
        it("ошибка 500", () => {
            saveMasterPassword(
                { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                context,
            );
            ajaxSpy.mock.calls[0][0].error();
            ajaxSpy.mock.calls[0][0].complete();
            expect(swalSpy).toHaveBeenCalledWith("Ошибка", "Что-то пошло не так", "error");
            expect(context.callbacks.complete).toHaveBeenCalled();
        });
    });

    // ==================== ОТСУТСТВИЕ КОЛБЭКОВ ====================
    describe("отсутствие колбэков", () => {
        it("без callbacks — выбрасывает ошибку", () => {
            expect(() => {
                saveMasterPassword(
                    {
                        hasOldPass: false,
                        oldPassword: "",
                        newPassword: "new123",
                        repeatPassword: "new123",
                        iterations: "1000",
                        crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] },
                    },
                    { masterPassword: "old", enMasterPassword: "enc" },
                );
                const ajaxCall = ajaxSpy.mock.calls[0][0];
                ajaxCall.success({ default_crypto_settings: "{}" });
            }).toThrow();
        });
    });
});

// ==================== ВНУТРЕННИЕ ФУНКЦИИ ====================
describe("getValidationError", () => {
    it("возвращает ошибку при пустом старом пароле", () => {
        const result = getValidationError({ hasOldPass: true, oldPassword: "", newPassword: "new", repeatPassword: "new", iterations: "1000" }, "enc");
        expect(result).toBe('Заполните поле "Старый пароль"');
    });

    it("возвращает null при корректных данных", () => {
        const result = getValidationError({ hasOldPass: false, oldPassword: "", newPassword: "new", repeatPassword: "new", iterations: "1000" }, "enc");
        expect(result).toBeNull();
    });
});

describe("randomIterations", () => {
    it("возвращает число в диапазоне 57-7999", () => {
        for (let i = 0; i < 100; i++) {
            const result = parseInt(randomIterations(), 10);
            expect(result).toBeGreaterThanOrEqual(57);
            expect(result).toBeLessThanOrEqual(7999);
        }
    });
});

describe("getReencryptedData", () => {
    const uuid1 = "019d1e24-74b9-7456-9007-14575c99bcc1";
    const uuid2 = "019d1e24-74bc-7583-a601-ef85a1b022e6";

    beforeEach(() => {
        document.body.innerHTML = `
            <table id="CandiesTable">
                <tbody>
                    <tr data-id="${uuid1}">
                        <td class="td-site">site1</td>
                        <td class="td-description">desc1</td>
                        <td class="td-login td-hide">enc_login1</td>
                        <td class="td-password td-hide">enc_pass1</td>
                    </tr>
                    <tr data-id="${uuid2}">
                        <td class="td-site">site2</td>
                        <td class="td-description">desc2</td>
                        <td class="td-login td-hide">enc_login2</td>
                        <td class="td-password td-hide">enc_pass2</td>
                    </tr>
                </tbody>
            </table>
        `;
    });

    it("возвращает объект с перешифрованными данными", () => {
        const result = getReencryptedData("master_key", "old_password");

        expect(result).toHaveProperty("sites");
        expect(result).toHaveProperty("descriptions");
        expect(result).toHaveProperty("logins");
        expect(result).toHaveProperty("passwords");

        const sites = JSON.parse(result.sites);
        expect(sites).toHaveProperty(uuid1);
        expect(sites).toHaveProperty(uuid2);
    });

    it("возвращает пустой объект если нет строк", () => {
        document.body.innerHTML = "";
        const result = getReencryptedData("master_key", "old_password");
        expect(result).toEqual({});
    });
});

// ==================== GET MASTER PASSWORD ====================
describe("getMasterPassword", () => {
    let ajaxSpy, swalSpy, callbacks;

    beforeEach(() => {
        vi.clearAllMocks();

        swalSpy = vi.fn();
        global.swal = swalSpy;

        ajaxSpy = vi.fn();
        global.$ = $;
        global.$.ajax = ajaxSpy;

        callbacks = {
            success: vi.fn(),
            error: vi.fn(),
            complete: vi.fn(),
        };
    });

    it("успешный ответ — вызывает success и updateCryptoSettings", () => {
        getMasterPassword(callbacks);

        const ajaxCall = ajaxSpy.mock.calls[0][0];
        ajaxCall.success({
            password: "encrypted_password",
            crypto_settings: "encrypted_settings",
            default_crypto_settings: JSON.stringify({
                KEY: { size: "256", division: "8" },
                IV: { size: "128", division: "8" },
                SALT: { size: "256", division: "8" },
                ITERATIONS: "1000",
            }),
        });
        ajaxCall.complete();

        expect(updateCryptoSettings).toHaveBeenCalledWith({
            KEY: { size: "256", division: "8" },
            IV: { size: "128", division: "8" },
            SALT: { size: "256", division: "8" },
            ITERATIONS: "1000",
        });
        expect(callbacks.success).toHaveBeenCalledWith({
            password: "encrypted_password",
            crypto_settings: "encrypted_settings",
        });
        expect(callbacks.complete).toHaveBeenCalled();
    });

    it("ошибка 404 — первый вход, updateCryptoSettings, error не вызывается", () => {
        getMasterPassword(callbacks);

        const ajaxCall = ajaxSpy.mock.calls[0][0];
        ajaxCall.error({
            status: 404,
            responseJSON: {
                default_crypto_settings: JSON.stringify({
                    KEY: { size: "256", division: "8" },
                    IV: { size: "128", division: "8" },
                    SALT: { size: "256", division: "8" },
                    ITERATIONS: "1000",
                }),
            },
        });
        ajaxCall.complete();

        expect(updateCryptoSettings).toHaveBeenCalledWith({
            KEY: { size: "256", division: "8" },
            IV: { size: "128", division: "8" },
            SALT: { size: "256", division: "8" },
            ITERATIONS: "1000",
        });
        expect(callbacks.error).not.toHaveBeenCalled();
        expect(callbacks.complete).toHaveBeenCalled();
    });

    it("ошибка 500 — показывает swal и вызывает error", () => {
        getMasterPassword(callbacks);

        const ajaxCall = ajaxSpy.mock.calls[0][0];
        ajaxCall.error({ status: 500 });
        ajaxCall.complete();

        expect(swalSpy).toHaveBeenCalledWith("Ошибка", "Что-то пошло не так", "error");
        expect(callbacks.error).toHaveBeenCalled();
        expect(callbacks.complete).toHaveBeenCalled();
    });

    it("без callbacks — выбрасывает ошибку", () => {
        expect(() => {
            getMasterPassword(null);
            const ajaxCall = ajaxSpy.mock.calls[0][0];
            ajaxCall.success({
                default_crypto_settings: JSON.stringify({
                    KEY: { size: "256", division: "8" },
                    IV: { size: "128", division: "8" },
                    SALT: { size: "256", division: "8" },
                    ITERATIONS: "1000",
                }),
            });
        }).toThrow();
    });
});

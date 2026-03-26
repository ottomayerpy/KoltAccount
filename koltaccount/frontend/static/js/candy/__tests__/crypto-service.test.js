import $ from "jquery";
import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { saveMasterPassword } from "../services/crypto-service.js";
import { updateCryptoSettings, enMP, encrypt, deMP } from "../crypto.js";

describe("saveMasterPassword", () => {
    let ajaxSpy, swalSpy, callbacks;

    beforeEach(() => {
        vi.clearAllMocks();

        swalSpy = vi.fn();
        global.swal = swalSpy;

        ajaxSpy = vi.fn();
        global.$ = $;
        global.$.ajax = ajaxSpy;

        callbacks = { success: vi.fn(), complete: vi.fn() };
        document.body.innerHTML = "";
    });

    // ==================== ВАЛИДАЦИЯ ====================
    describe("валидация", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };
        const context = { masterPassword: "old", enMasterPassword: "enc", callbacks };

        it("пустой старый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Старый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });

        it("пустой новый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "", repeatPassword: "", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Новый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });

        it("пустое подтверждение", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "new123", repeatPassword: "", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith('Заполните поле "Подтвердите новый пароль"', "", "info");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });

        it("пароли не совпадают", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "old", newPassword: "new123", repeatPassword: "different", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Пароли не совпадают", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });

        it("неверный старый пароль", () => {
            saveMasterPassword({ hasOldPass: true, oldPassword: "wrong", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Не правильный старый пароль", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });

        it("итерации вне диапазона", () => {
            saveMasterPassword({ hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "10000", crypto: validCrypto }, context);
            expect(swalSpy).toHaveBeenCalledWith("Не допустимый диапазон итераций", "", "warning");
            expect(ajaxSpy).not.toHaveBeenCalled();
        });
    });

    // ==================== УСПЕШНОЕ СОХРАНЕНИЕ ====================
    describe("успешное сохранение", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };
        const context = { masterPassword: "old", enMasterPassword: "enc", callbacks };

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
                { masterPassword: "old", enMasterPassword: "enc", callbacks },
            );
            ajaxSpy.mock.calls[0][0].success();
            expect(callbacks.success).toHaveBeenCalled();
        });

        it("complete вызывается всегда", () => {
            saveMasterPassword(
                { hasOldPass: true, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                { masterPassword: "old", enMasterPassword: "enc", callbacks },
            );
            expect(callbacks.complete).toHaveBeenCalled();
        });
    });

    // ==================== ГРАНИЧНЫЕ СЛУЧАИ ====================
    describe("граничные случаи", () => {
        const validCrypto = { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] };
        const context = { masterPassword: "old", enMasterPassword: "enc", callbacks };

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
        const context = { masterPassword: "old", enMasterPassword: "enc", callbacks };

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
        const context = { masterPassword: "old", enMasterPassword: "enc", callbacks };

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
                { masterPassword: "old", enMasterPassword: "enc", callbacks },
            );
            ajaxSpy.mock.calls[0][0].error();
            expect(swalSpy).toHaveBeenCalledWith("Ошибка", "Что-то пошло не так", "error");
        });
    });

    // ==================== ОТСУТСТВИЕ КОЛБЭКОВ ====================
    describe("отсутствие колбэков", () => {
        it("без callbacks — не падает", () => {
            expect(() => {
                saveMasterPassword(
                    { hasOldPass: false, oldPassword: "", newPassword: "new123", repeatPassword: "new123", iterations: "1000", crypto: { key: ["256", "8"], iv: ["128", "8"], salt: ["256", "8"] } },
                    { masterPassword: "old", enMasterPassword: "enc", callbacks: null },
                );
            }).not.toThrow();
        });
    });
});

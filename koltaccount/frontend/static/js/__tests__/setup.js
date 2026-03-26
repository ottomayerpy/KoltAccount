import { vi } from "vitest";

// Глобальные моки для всех тестов
global.CryptoJS = {
    HmacSHA256: vi.fn(() => "mocked_hmac"),
    lib: {
        WordArray: {
            random: vi.fn(() => "mocked_random"),
        },
    },
    PBKDF2: vi.fn(() => "mocked_pbkdf2"),
    AES: {
        encrypt: vi.fn(() => ({ toString: () => "mocked_aes" })),
        decrypt: vi.fn(() => ({ toString: () => "mocked_decrypted" })),
    },
    pad: { Pkcs7: {}, ZeroPadding: {} },
    mode: { CBC: {}, ECB: {} },
    enc: {
        Utf8: { parse: vi.fn() },
        Hex: { parse: vi.fn() },
    },
};

global.CS = {
    SALT: { size: 256, division: 8 },
    KEY: { size: 256, division: 8 },
    IV: { size: 128, division: 8 },
    ITERATIONS: 1000,
    CRYPT_STR_AES: { padding: "Pkcs7", mode: "CBC" },
    DECRYPT_SUBSTRING: {
        str: { start: 0, end: 32 },
        mp: { start: 0, end: 32 },
    },
};

global.$ = vi.fn(() => ({
    val: () => "",
    on: () => {},
    find: () => [],
    each: () => {},
    trigger: () => {},
    modal: () => {},
    fadeIn: () => {},
    fadeOut: () => {},
    removeClass: () => {},
    addClass: () => {},
    attr: () => {},
    text: () => "",
    data: () => ({}),
}));
global.$.ajax = vi.fn();
global.swal = vi.fn();
global.preloadShow = vi.fn();
global.preloadHide = vi.fn();

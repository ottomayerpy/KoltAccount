/* Личный кабинет + Управление темами */

$(function () {
    let storage = window.localStorage;
    const $body = $("body");
    const $tablesorter = $(".tablesorter");

    // ==========================================================================
    // 1. УПРАВЛЕНИЕ ТЕМАМИ
    // ==========================================================================

    // Загружаем сохраненную тему при загрузке страницы
    loadSavedTheme();

    // Функция применения базовой темы (светлая/темная)
    function applyBaseTheme(mode) {
        if (mode === "dark") {
            $body.addClass("dark-theme");
            $tablesorter.removeClass("tablesorter-blue").addClass("tablesorter-dark");
        } else {
            $body.removeClass("dark-theme");
            $tablesorter.removeClass("tablesorter-dark").addClass("tablesorter-blue");
        }
    }

    // Функция применения цветовой схемы
    function applyColorScheme(themeClass, mode) {
        // Сначала применяем базовую тему
        applyBaseTheme(mode);

        // Убираем все классы цветовых схем
        removeAllColorClasses();

        // Добавляем выбранный класс цветовой схемы
        $body.addClass(themeClass);

        // Сохраняем текущую тему
        localStorage.setItem("currentTheme", themeClass);
    }

    // Функция применения темы с сохраненной цветовой схемой для режима
    function applyThemeWithSavedColorScheme(mode) {
        // Получаем сохраненные темы
        const lightTheme = localStorage.getItem("lightTheme") || "light-default";
        const darkTheme = localStorage.getItem("darkTheme") || "dark-default";

        // Выбираем нужную тему в зависимости от режима
        const themeToApply = mode === "light" ? lightTheme : darkTheme;

        // Применяем цветовую схему
        applyColorScheme(themeToApply, mode);
    }

    // Функция удаления всех классов цветовых схем
    function removeAllColorClasses() {
        const allThemeClasses = [
            "light-default",
            "light-mint",
            "light-lavender",
            "light-peach",
            "light-coral",
            "light-teal",
            "light-gold",
            "light-rose",
            "light-lilac",
            "light-turquoise",
            "light-lime",
            "light-cornflower",
            "dark-default",
            "dark-red",
            "dark-blue",
            "dark-green",
            "dark-orange",
            "dark-pink",
            "dark-cyan",
            "dark-magenta",
            "dark-turquoise",
            "dark-amber",
            "dark-mint",
            "dark-lavender",
        ];
        $body.removeClass(allThemeClasses.join(" "));
    }

    // Функция сохранения темы
    function saveTheme(themeClass, mode) {
        // Сохраняем текущую тему
        localStorage.setItem("currentTheme", themeClass);

        // Сохраняем отдельно для светлой и темной темы
        if (mode === "light") {
            localStorage.setItem("lightTheme", themeClass);
        } else {
            localStorage.setItem("darkTheme", themeClass);
        }
    }

    // Функция загрузки сохраненной темы
    function loadSavedTheme() {
        // Получаем сохраненные темы
        let lightTheme = localStorage.getItem("lightTheme");
        let darkTheme = localStorage.getItem("darkTheme");
        let currentTheme = localStorage.getItem("currentTheme");

        // Если нет сохраненных тем - первый визит
        if (!lightTheme && !darkTheme && !currentTheme) {
            // Устанавливаем темную тему с фиолетовой схемой по умолчанию
            lightTheme = "light-default";
            darkTheme = "dark-default";
            currentTheme = "dark-default";

            // Сохраняем настройки
            localStorage.setItem("lightTheme", lightTheme);
            localStorage.setItem("darkTheme", darkTheme);
            localStorage.setItem("currentTheme", currentTheme);
        } else {
            // Используем сохраненные значения или подставляем стандартные
            lightTheme = lightTheme || "light-default";
            darkTheme = darkTheme || "dark-default";
            currentTheme = currentTheme || darkTheme; // Если есть только darkTheme, используем его
        }

        // Определяем, какой режим был активен последним
        let activeMode = currentTheme.startsWith("light") ? "light" : "dark";
        let themeToApply = currentTheme;

        // Применяем тему
        applyColorScheme(themeToApply, activeMode);
    }

    // Функция обновления отображения в табе тем
    function updateThemesTabDisplay() {
        // Определяем текущий режим по классу body
        const isDark = $body.hasClass("dark-theme");
        const currentMode = isDark ? "dark" : "light";

        // Получаем сохраненные темы
        const lightTheme = localStorage.getItem("lightTheme") || "light-default";
        const darkTheme = localStorage.getItem("darkTheme") || "dark-default";

        // Выбираем нужную тему в зависимости от режима
        const themeToApply = currentMode === "light" ? lightTheme : darkTheme;

        // Обновляем активный класс на вкладках внутри таба
        $(".theme-tab").removeClass("active");
        $(`.theme-tab[data-theme-mode="${currentMode}"]`).addClass("active");

        // Показываем соответствующую сетку
        $(".theme-grid").removeClass("active");
        $(`.${currentMode}-themes`).addClass("active");

        // Подсвечиваем активную цветовую схему
        $(".theme-card").removeClass("active");
        $(`.theme-card[data-theme="${themeToApply}"]`).addClass("active");
    }

    // ==========================================================================
    // 2. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК МЕНЮ
    // ==========================================================================

    $(".simple-tabs").on("click", function () {
        /* Переключение вкладок меню */
        $(".swiper-container").find("div").removeClass("active");
        $('[data-tabs="' + $(this).attr("data-tabs-id") + '"]').addClass("active");

        /* Задаем активный раздел */
        storage.setItem("lk_active_swiper_tab", $(this).attr("data-tabs-id"));

        /* Если это таб с темами (id=4), обновляем отображение */
        if ($(this).attr("data-tabs-id") === "3") {
            updateThemesTabDisplay();
        }
    });

    // Активируем сохраненный раздел при загрузке
    let tab = storage.getItem("lk_active_swiper_tab");

    if (tab == null) {
        // Если значение не найдено то ставим первый раздел
        tab = "1";
        storage.setItem("lk_active_swiper_tab", tab);
    }

    // Активируем раздел
    $('.swiper-tabs[data-tabs="' + tab + '"]').addClass("active");

    // Если активный раздел - темы (id=4), обновляем отображение
    if (tab === "4") {
        setTimeout(updateThemesTabDisplay, 50);
    }

    // ==========================================================================
    // 3. ОБРАБОТЧИКИ ДЛЯ ТЕМ
    // ==========================================================================

    // Обработчик переключения вкладок светлая/темная внутри таба тем
    $(document).on("click", ".theme-tab", function () {
        const mode = $(this).data("theme-mode");

        // Обновляем активный класс на вкладках
        $(".theme-tab").removeClass("active");
        $(this).addClass("active");

        // Показываем соответствующую сетку
        $(".theme-grid").removeClass("active");
        $(`.${mode}-themes`).addClass("active");

        // Применяем тему с сохраненной цветовой схемой для этого режима
        applyThemeWithSavedColorScheme(mode);

        // Обновляем подсветку карточек
        const themeToApply = mode === "light" ? localStorage.getItem("lightTheme") || "light-default" : localStorage.getItem("darkTheme") || "dark-default";

        $(".theme-card").removeClass("active");
        $(`.theme-card[data-theme="${themeToApply}"]`).addClass("active");
    });

    // Обработчик выбора цветовой схемы
    $(document).on("click", ".theme-card", function () {
        const themeClass = $(this).data("theme");
        const mode = themeClass.startsWith("light") ? "light" : "dark";

        // Применяем выбранную цветовую схему
        applyColorScheme(themeClass, mode);

        // Сохраняем выбранную тему
        saveTheme(themeClass, mode);

        // Обновляем активный класс на карточках
        $(".theme-card").removeClass("active");
        $(this).addClass("active");

        // Обновляем активную вкладку
        $(".theme-tab").removeClass("active");
        $(`.theme-tab[data-theme-mode="${mode}"]`).addClass("active");

        // Показываем соответствующую сетку
        $(".theme-grid").removeClass("active");
        $(`.${mode}-themes`).addClass("active");
    });

    // ==========================================================================
    // 4. ФОРМАТИРОВАНИЕ ДАТ
    // ==========================================================================

    function formatDate(format_date, format_string) {
        let yyyy = format_date.getFullYear();
        let yy = yyyy.toString().substring(2);
        let m = format_date.getMonth() + 1;
        let mm = m < 10 ? "0" + m : m;
        let d = format_date.getDate();
        let dd = d < 10 ? "0" + d : d;

        let H = format_date.getHours();
        let HH = H < 10 ? "0" + H : H;
        let M = format_date.getMinutes();
        let MM = M < 10 ? "0" + M : M;
        let S = format_date.getSeconds();
        let SS = S < 10 ? "0" + S : S;

        format_string = format_string.replace(/yyyy/i, yyyy);
        format_string = format_string.replace(/yy/i, yy);
        format_string = format_string.replace(/mm/i, mm);
        format_string = format_string.replace(/m/i, m);
        format_string = format_string.replace(/dd/i, dd);
        format_string = format_string.replace(/d/i, d);
        format_string = format_string.replace(/HH/i, HH);
        format_string = format_string.replace(/H/i, H);
        format_string = format_string.replace(/ii/i, MM);
        format_string = format_string.replace(/i/i, M);
        format_string = format_string.replace(/SS/i, SS);
        format_string = format_string.replace(/S/i, S);

        return format_string;
    }

    Date.prototype.format = function (format) {
        return formatDate(this, format);
    };

    $(".js-auth-date").each(function () {
        let date = new Date(Date.parse($(this).text().replace(/\s/g, "").replace("_", "T")));
        let current_date = new Date();
        let string = "";

        if (current_date.format("dd") == date.format("dd")) {
            string = "Сегодня в " + date.format("HH:ii");
        } else if (parseInt(date.format("dd")) == parseInt(current_date.format("dd")) - 1) {
            string = "Вчера в " + date.format("HH:ii");
        } else if (current_date.format("yyyy") == date.format("yyyy")) {
            string = date.format("dd.mm") + " в " + date.format("HH:ii");
        } else {
            string = date.format("dd.mm.yyyy") + " в " + date.format("HH:ii");
        }

        $(this).text(string);
    });

    // ==========================================================================
    // 5. ПАРСИНГ USER-AGENT
    // ==========================================================================

    function parseUserAgent(userAgent) {
        if (!userAgent || userAgent === "Не определен") {
            return {
                browser: "Не определен",
                os: "Не определен",
                device: "Не определен",
                full: userAgent || "Не определен",
            };
        }

        let browser = "Неизвестный браузер";
        let os = "Неизвестная ОС";
        let device = "Неизвестное устройство";

        // Определение браузера
        if (userAgent.includes("Firefox/")) {
            const match = userAgent.match(/Firefox\/(\d+\.?\d*)/);
            browser = `Firefox ${match ? match[1] : ""}`;
        } else if (userAgent.includes("Chrome/") && !userAgent.includes("Edg/")) {
            const match = userAgent.match(/Chrome\/(\d+\.?\d*)/);
            browser = `Chrome ${match ? match[1] : ""}`;
        } else if (userAgent.includes("Edg/")) {
            const match = userAgent.match(/Edg\/(\d+\.?\d*)/);
            browser = `Edge ${match ? match[1] : ""}`;
        } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome/")) {
            const match = userAgent.match(/Safari\/(\d+\.?\d*)/);
            browser = `Safari ${match ? match[1] : ""}`;
        } else if (userAgent.includes("OPR/")) {
            const match = userAgent.match(/OPR\/(\d+\.?\d*)/);
            browser = `Opera ${match ? match[1] : ""}`;
        } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
            browser = "Internet Explorer";
        }

        // Определение ОС
        if (userAgent.includes("Windows NT 10.0")) {
            os = "Windows 10/11";
        } else if (userAgent.includes("Windows NT 6.3")) {
            os = "Windows 8.1";
        } else if (userAgent.includes("Windows NT 6.2")) {
            os = "Windows 8";
        } else if (userAgent.includes("Windows NT 6.1")) {
            os = "Windows 7";
        } else if (userAgent.includes("Mac OS X")) {
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
            if (match) {
                const version = match[1].replace(/_/g, ".");
                os = `macOS ${version}`;
            } else {
                os = "macOS";
            }
        } else if (userAgent.includes("Linux")) {
            if (userAgent.includes("Android")) {
                const match = userAgent.match(/Android (\d+\.?\d*)/);
                os = `Android ${match ? match[1] : ""}`;
            } else {
                os = "Linux";
            }
        } else if (userAgent.includes("iPhone")) {
            const match = userAgent.match(/iPhone OS (\d+[._]\d+)/);
            if (match) {
                const version = match[1].replace(/_/g, ".");
                os = `iOS ${version}`;
            } else {
                os = "iOS";
            }
        } else if (userAgent.includes("iPad")) {
            const match = userAgent.match(/iPad OS (\d+[._]\d+)/);
            if (match) {
                const version = match[1].replace(/_/g, ".");
                os = `iPadOS ${version}`;
            } else {
                os = "iPadOS";
            }
        }

        // Определение устройства
        if (userAgent.includes("Mobile") || (userAgent.includes("Android") && userAgent.includes("Mobile"))) {
            device = "Мобильное устройство";
        } else if (userAgent.includes("iPad")) {
            device = "Планшет (iPad)";
        } else if (userAgent.includes("Tablet") || userAgent.includes("Kindle")) {
            device = "Планшет";
        } else if (userAgent.includes("Windows") || userAgent.includes("Mac") || (userAgent.includes("Linux") && !userAgent.includes("Android"))) {
            device = "Компьютер";
        }

        return { browser, os, device, full: userAgent };
    }
    // ==========================================================================
    // 6. ФОРМАТИРОВАНИЕ USER-AGENT В ИСТОРИИ
    // ==========================================================================

    function formatUserAgentHistory() {
        $(".auth-item").each(function () {
            const $item = $(this);
            const userAgentText = $item.find(".auth-useragent").text().trim();

            if (userAgentText && userAgentText !== "Не определен" && userAgentText !== "") {
                const parsed = parseUserAgent(userAgentText);

                // Создаем иконку устройства
                let deviceIcon = "";
                if (parsed.device === "Компьютер") deviceIcon = "🖥️";
                else if (parsed.device === "Мобильное устройство") deviceIcon = "📱";
                else if (parsed.device.includes("Планшет")) deviceIcon = "📟";
                else deviceIcon = "🌐";

                // Добавляем отформатированную информацию
                $item.find(".auth-device").text(`${deviceIcon} ${parsed.device}`);
                $item.find(".auth-browser-os").text(`${parsed.browser} / ${parsed.os}`);

                // Добавляем полный User-Agent в tooltip
                $item.find(".auth-browser-os").attr("title", parsed.full);
            } else {
                $item.find(".auth-device").text("Не определено");
                $item.find(".auth-browser-os").text("Не определено");
            }
        });
    }

    formatUserAgentHistory();
});

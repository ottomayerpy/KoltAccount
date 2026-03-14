/* Личный кабинет + Управление темами */

$(function() {
    let storage = window.localStorage;
    const $body = $('body');
    const $tablesorter = $('.tablesorter');

    // ==========================================================================
    // 1. УПРАВЛЕНИЕ ТЕМАМИ
    // ==========================================================================

    // Загружаем сохраненную тему при загрузке страницы
    loadSavedTheme();

    // Функция применения базовой темы (светлая/темная)
    function applyBaseTheme(mode) {
        if (mode === 'dark') {
            $body.addClass('dark-theme');
            $tablesorter.removeClass('tablesorter-blue').addClass('tablesorter-dark');
        } else {
            $body.removeClass('dark-theme');
            $tablesorter.removeClass('tablesorter-dark').addClass('tablesorter-blue');
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
        localStorage.setItem('currentTheme', themeClass);
    }

    // Функция применения темы с сохраненной цветовой схемой для режима
    function applyThemeWithSavedColorScheme(mode) {
        // Получаем сохраненные темы
        const lightTheme = localStorage.getItem('lightTheme') || 'light-default';
        const darkTheme = localStorage.getItem('darkTheme') || 'dark-default';
        
        // Выбираем нужную тему в зависимости от режима
        const themeToApply = mode === 'light' ? lightTheme : darkTheme;
        
        // Применяем цветовую схему
        applyColorScheme(themeToApply, mode);
    }

    // Функция удаления всех классов цветовых схем
    function removeAllColorClasses() {
        const allThemeClasses = [
            'light-default', 'light-mint', 'light-lavender', 'light-peach', 
            'light-coral', 'light-teal', 'light-gold', 'light-rose', 
            'light-lilac', 'light-turquoise', 'light-lime', 'light-cornflower',
            'dark-default', 'dark-red', 'dark-blue', 'dark-green',
            'dark-orange', 'dark-pink', 'dark-cyan', 'dark-magenta',
            'dark-turquoise', 'dark-amber', 'dark-mint', 'dark-lavender'
        ];
        $body.removeClass(allThemeClasses.join(' '));
    }

    // Функция сохранения темы
    function saveTheme(themeClass, mode) {
        // Сохраняем текущую тему
        localStorage.setItem('currentTheme', themeClass);
        
        // Сохраняем отдельно для светлой и темной темы
        if (mode === 'light') {
            localStorage.setItem('lightTheme', themeClass);
        } else {
            localStorage.setItem('darkTheme', themeClass);
        }
    }

    // Функция загрузки сохраненной темы
    function loadSavedTheme() {
        // Получаем сохраненные темы для каждого режима
        const lightTheme = localStorage.getItem('lightTheme') || 'light-default';
        const darkTheme = localStorage.getItem('darkTheme') || 'dark-default';
        const currentTheme = localStorage.getItem('currentTheme');
        
        // Определяем, какой режим был активен последним
        let activeMode = 'light';
        let themeToApply = lightTheme;
        
        if (currentTheme) {
            // Если есть текущая тема, определяем режим по ней
            activeMode = currentTheme.startsWith('light') ? 'light' : 'dark';
            themeToApply = currentTheme;
        } else {
            // Если нет текущей темы, используем светлую по умолчанию
            themeToApply = 'light-default';
            localStorage.setItem('lightTheme', 'light-default');
            localStorage.setItem('currentTheme', 'light-default');
        }
        
        // Применяем тему
        applyColorScheme(themeToApply, activeMode);
    }

    // Функция обновления отображения в табе тем
    function updateThemesTabDisplay() {
        // Определяем текущий режим по классу body
        const isDark = $body.hasClass('dark-theme');
        const currentMode = isDark ? 'dark' : 'light';
        
        // Получаем сохраненные темы
        const lightTheme = localStorage.getItem('lightTheme') || 'light-default';
        const darkTheme = localStorage.getItem('darkTheme') || 'dark-default';
        
        // Выбираем нужную тему в зависимости от режима
        const themeToApply = currentMode === 'light' ? lightTheme : darkTheme;
        
        // Обновляем активный класс на вкладках внутри таба
        $('.theme-tab').removeClass('active');
        $(`.theme-tab[data-theme-mode="${currentMode}"]`).addClass('active');
        
        // Показываем соответствующую сетку
        $('.theme-grid').removeClass('active');
        $(`.${currentMode}-themes`).addClass('active');
        
        // Подсвечиваем активную цветовую схему
        $('.theme-card').removeClass('active');
        $(`.theme-card[data-theme="${themeToApply}"]`).addClass('active');
    }

    // ==========================================================================
    // 2. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК МЕНЮ
    // ==========================================================================

    $('.simple-tabs').on('click', function() {
        /* Переключение вкладок меню */
        $('.swiper-container').find('div').removeClass('active');
        $('[data-tabs="' + $(this).attr('data-tabs-id') + '"]').addClass('active');
        
        /* Задаем активный раздел */
        storage.setItem('lk_active_swiper_tab', $(this).attr('data-tabs-id'));
        
        /* Если это таб с темами (id=4), обновляем отображение */
        if ($(this).attr('data-tabs-id') === '4') {
            updateThemesTabDisplay();
        }
    });

    // Активируем сохраненный раздел при загрузке
    let tab = storage.getItem('lk_active_swiper_tab');

    if (tab == null) {
        // Если значение не найдено то ставим первый раздел
        tab = '1';
        storage.setItem('lk_active_swiper_tab', tab);
    }

    // Активируем раздел
    $('.js-swiper-tabs[data-tabs="' + tab + '"]').addClass('active');
    
    // Если активный раздел - темы (id=4), обновляем отображение
    if (tab === '4') {
        setTimeout(updateThemesTabDisplay, 50);
    }

    // ==========================================================================
    // 3. ОБРАБОТЧИКИ ДЛЯ ТЕМ
    // ==========================================================================

    // Обработчик переключения вкладок светлая/темная внутри таба тем
    $(document).on('click', '.theme-tab', function() {
        const mode = $(this).data('theme-mode');
        
        // Обновляем активный класс на вкладках
        $('.theme-tab').removeClass('active');
        $(this).addClass('active');
        
        // Показываем соответствующую сетку
        $('.theme-grid').removeClass('active');
        $(`.${mode}-themes`).addClass('active');
        
        // Применяем тему с сохраненной цветовой схемой для этого режима
        applyThemeWithSavedColorScheme(mode);
        
        // Обновляем подсветку карточек
        const themeToApply = mode === 'light' 
            ? localStorage.getItem('lightTheme') || 'light-default'
            : localStorage.getItem('darkTheme') || 'dark-default';
        
        $('.theme-card').removeClass('active');
        $(`.theme-card[data-theme="${themeToApply}"]`).addClass('active');
    });

    // Обработчик выбора цветовой схемы (без уведомления)
    $(document).on('click', '.theme-card', function() {
        const themeClass = $(this).data('theme');
        const mode = themeClass.startsWith('light') ? 'light' : 'dark';
        
        // Применяем выбранную цветовую схему
        applyColorScheme(themeClass, mode);
        
        // Сохраняем выбранную тему
        saveTheme(themeClass, mode);
        
        // Обновляем активный класс на карточках
        $('.theme-card').removeClass('active');
        $(this).addClass('active');
        
        // Обновляем активную вкладку
        $('.theme-tab').removeClass('active');
        $(`.theme-tab[data-theme-mode="${mode}"]`).addClass('active');
        
        // Показываем соответствующую сетку
        $('.theme-grid').removeClass('active');
        $(`.${mode}-themes`).addClass('active');
        
        // Уведомление УБРАНО!
    });

    // ==========================================================================
    // 4. ИСТОРИЯ ПОЖЕРТВОВАНИЙ
    // ==========================================================================
    
    $('.js-donate').each(function() {
        let notification_type = $(this).find('.js-donate-notification_type');
        let withdraw_amount = $(this).find('.js-donate-withdraw_amount');
        let codepro = $(this).find('.js-donate-codepro');
        let json_date = JSON.parse($(this).find('input').val());

        $(this).find('input').val('');

        if (json_date['notification_type'] == 'p2p-incoming') {
            notification_type.text('Яндекс деньги');
        } else {
            notification_type.text('Банковская карта');
        }

        if (json_date['codepro'] == 'false') {
            codepro.text('Платеж подтвержден');
        } else {
            codepro.text('Платеж не подтвержден');
        }

        withdraw_amount.text(json_date['withdraw_amount'] + ' ₽');
    });

    // ==========================================================================
    // 5. ФОРМАТИРОВАНИЕ ДАТ
    // ==========================================================================
    
    function formatDate(format_date, format_string) {
        let yyyy = format_date.getFullYear();
        let yy = yyyy.toString().substring(2);
        let m = format_date.getMonth() + 1;
        let mm = m < 10 ? '0' + m : m;
        let d = format_date.getDate();
        let dd = d < 10 ? '0' + d : d;

        let H = format_date.getHours();
        let HH = H < 10 ? '0' + H : H;
        let M = format_date.getMinutes();
        let MM = M < 10 ? '0' + M : M;
        let S = format_date.getSeconds();
        let SS = S < 10 ? '0' + S : S;

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

    Date.prototype.format = function(format) {
        return formatDate(this, format);
    }

    $('.js-auth-date').each(function() {
        let date = new Date(Date.parse($(this).text().replace(/\s/g, '').replace('_', 'T')));
        let current_date = new Date();
        let string = '';

        if (current_date.format('dd') == date.format('dd')) {
            string = 'Сегодня в ' + date.format('HH:ii');
        } else if (parseInt(date.format('dd')) == (parseInt(current_date.format('dd')) - 1)) {
            string = 'Вчера в ' + date.format('HH:ii');
        } else if (current_date.format('yyyy') == date.format('yyyy')) {
            string = date.format('dd.mm') + ' в ' + date.format('HH:ii');
        } else {
            string = date.format('dd.mm.yyyy') + ' в ' + date.format('HH:ii');
        }

        $(this).text(string);
    });
});
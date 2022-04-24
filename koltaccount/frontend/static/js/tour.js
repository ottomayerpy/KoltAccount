/* Окна с подсказками для пользователя при первом посещении сайта | Обучение */

$(function() {
    let storage = window.localStorage, // Система хранения
        // Шаблон для обычного тура
        template = '<div class="popover tour">' +
        '<div class="arrow"></div>' +
        '<h3 class="popover-title"></h3>' +
        '<div class="popover-content"></div>' +
        '<div align="center" class="popover-navigation">' +
        '<button class="btn btn-default" data-role="prev">« Назад</button>' +
        '<span data-role="separator">|</span>' +
        '<button class="btn btn-default" data-role="next">Далее »</button>' +
        '<span data-role="separator">|</span>' +
        '<button class="btn btn-default" data-role="end">Закрыть</button>' +
        '</div></div>',
        // Шаблон без кнопок "Назад" и "Далее" для тура с одним шагом
        template_one_step = '<div class="popover tour">' +
        '<div class="arrow"></div>' +
        '<h3 class="popover-title"></h3>' +
        '<div class="popover-content"></div>' +
        '<div class="popover-navigation">' +
        '<button class="btn btn-default" data-role="end">Закрыть</button>' +
        '</div></div>';

    window.account_table_tour = function() {
        /* Тур на главную страницу */
        let tour = new Tour({
            name: 'account_table_tour',
            steps: [{
                    element: '#btn_create_account_modal',
                    title: 'Кнопка "Добавить аккаунт"',
                    content: 'Нажмите чтобы открыть модальное окно в котором вы можете добавить новый аккаунт в таблицу.',
                    placement: 'bottom'
                },
                {
                    element: '#btn_master_password_modal',
                    title: 'Кнопка "Мастер пароль"',
                    content: 'Нажмите чтобы открыть модальное окно в котором вы можете изменить мастер пароль.',
                    placement: 'bottom'
                },
                {
                    element: '#in-search',
                    title: 'Текстовое поле "Поиск"',
                    content: 'При наборе текста в это поле, выполняется поиск в таблице по названию сайта, отображая в таблице наиболее подходящие варианты.',
                    placement: 'bottom'
                }
            ],
            storage: storage,
            template: template
        });

        tour.init();
        tour.start();
    };

    window.account_modal_tour = function() {
        /* Тур на модальное окно просмотра аккаунта */
        let tour = new Tour({
            name: 'account_modal_tour',
            steps: [{
                element: '#js-tour_show_account_modal_footer_buttons',
                title: 'Кнопки "Логин" и "Пароль"',
                content: 'Нажатие на кнопку копирует логин или пароль в буфер обмена, или нажмите и удерживайте для отображения логина или пароля на экране',
                placement: 'top',
                // Показать шаг, не смотря на то что элемент не отображен на экране
                // Это необходимо, потому что модальное окно открывается не сразу, и
                // тур не видит элемент
                orphan: true
            }],
            storage: storage,
            template: template_one_step
        });

        tour.init();
        tour.start();
    };
});

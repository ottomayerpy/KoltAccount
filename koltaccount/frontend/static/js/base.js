/* Базовые функции */

$(function() {
    window.main_show_preload = function() {
        /* Показать главный прелоад */
        $('#page-preload').removeClass('preload-done');
    }

    window.main_hide_preload = function() {
        /* Скрыть главный прелоад */
        $('#page-preload').addClass('preload-done');
    }

    window.preload_show = function() {
        /* Показать прелоад */
        $('#page-preload').css('background', 'rgb(0 0 0 / 0.5)');
        main_show_preload();
    }

    window.preload_hide = function() {
        /* Скрыть прелоад */
        main_hide_preload();
        setTimeout(function() {
            $('#page-preload').css('background', '#000000');
        }, 500);
    }

    window.onbeforeunload = function() {
        /* Затухание при переходах по ссылкам на сайте */
        main_show_preload();
    }

    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            main_hide_preload();
        }
    });

    function checkCookies() {
        try {
            /* Проверка того, что пользователь закрыл предупреждение об использовании куки */
            let cookieDate = localStorage.getItem('cookieDate');
            let cookieNotification = document.getElementById('cookie_notification');
            let cookieBtn = cookieNotification.querySelector('.cookie_accept');

            // Если записи про кукисы нет или она просрочена на 1 год, то показываем информацию про кукисы
            if (!cookieDate || (+cookieDate + 31536000000) < Date.now()) {
                cookieNotification.classList.add('show');
            }

            // При клике на кнопку, в локальное хранилище записывается текущая дата в системе UNIX
            cookieBtn.addEventListener('click', function() {
                localStorage.setItem('cookieDate', Date.now());
                cookieNotification.classList.remove('show');
            })
        } catch {}
    }

    /*

    // Для Orange PI
    function requestCpuTemp() {
        $.ajax({
            url: "/get_cpu_temp",
            type: "GET",
            success: function (result) {
                $("#cpu_temp").text(result);
            }
        });
    }

    $("#cpu_temp").on("click", function () {
        setInterval(requestCpuTemp, 1000);
    });

    requestCpuTemp();
    
    */

    checkCookies();
});
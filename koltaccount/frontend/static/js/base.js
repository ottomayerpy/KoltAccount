/* Базовые функции */

$(function() {
    window.mainShowPreload = function() {
        /* Показать главный прелоад */
        $('#page-preload').removeClass('preload-done');
    }

    window.mainHidePreload = function() {
        /* Скрыть главный прелоад */
        $('#page-preload').addClass('preload-done');
    }

    window.preloadShow = function() {
        /* Показать прелоад */
        $('#page-preload').css('background', 'rgb(0 0 0 / 0.5)');
        mainShowPreload();
    }

    window.preloadHide = function() {
        /* Скрыть прелоад */
        mainHidePreload();
        setTimeout(function() {
            $('#page-preload').css('background', '#000000');
        }, 500);
    }

    window.onbeforeunload = function() {
        /* Затухание при переходах по ссылкам на сайте */
        mainShowPreload();
    }

    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            mainHidePreload();
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

    // Для Orange PI
    function requestCpuTemp() {
        $.ajax({
            url: "/get_cpu_temp",
            type: "GET",
            success: function (result) {
                $("#cpu_temp").text(result);
            },
            error: function () {
                $("#cpu_temp").text("0°");
            }
        });
    }

    $("#cpu_temp").on("click", function () {
        setInterval(requestCpuTemp, 1000);
    });

    if ($("#cpu_temp").length) requestCpuTemp();

    checkCookies();
});
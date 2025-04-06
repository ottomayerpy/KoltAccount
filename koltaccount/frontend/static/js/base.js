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
        /* Затухание при преходах по ссылками на сайте */
        main_show_preload();
    }

    $(window).scroll(function() {
        if ($(this).scrollTop() > 100) {
            $('.scrollup').fadeIn();
        } else {
            $('.scrollup').fadeOut();
        }
    });

    $('.scrollup').click(function() {
        $("html, body").animate({ scrollTop: 0 }, 600);
        return false;
    });

    /*
    // Адаптация интерфейса под мобильный
    if (window.innerWidth < 768) {
        $('header').css('margin-bottom', '0');
        $('nav').removeClass('navbar-fixed-top').addClass('navbar-fixed-bottom');
        $('#EnterKeyModal.modal.fade .modal-dialog').addClass('modal-dialog_mobile');
        $('#EnterKeyModal.modal.in .modal-dialog').addClass('modal-dialog_mobile');
        $('#cookie_notification').css('bottom', '70px');
        $('.btn-reshow_modal').addClass('btn_reshow_button_mobile');
        $('.account_container').css('margin-top', '0');
        $('footer').append('<div style="height: 60px;"></div>');
    }
    */

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

    checkCookies();
    requestCpuTemp();
});
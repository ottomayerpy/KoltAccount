$(function () {
    let toggle_button;

    $("#site_in_service_button").on("change", function () {
        let button_text = "Да, открыть!",
            alert_text = "Сайт будет открыт!",
            toggle_obj = this;

        if (!$(this).attr("checked")) {
            button_text = "Да, закрыть.";
            alert_text = "Сайт будет закрыт на техническое обслуживание!";
        }

        swal(
            {
                title: "Вы уверены?",
                text: alert_text,
                type: "warning",
                showCancelButton: true,
                confirmButtonText: button_text,
            },
            function () {
                preloadShow();
                setTimeout(function () {
                    site_in_service_toggle(toggle_obj);
                }, 300);
            },
        );
    });

    $(".toggle-button").on("click", function () {
        toggle_button = $(this);
    });

    $(".sweet-alert .cancel").on("click", function () {
        if (toggle_button.hasClass("toggle-button_active")) {
            toggle_button.addClass("toggle-button_active");
        } else {
            toggle_button.removeClass("toggle-button_active");
        }
    });

    function site_in_service_toggle(toggle_obj) {
        $.ajax({
            url: "site_in_service_toggle/",
            type: "POST",
            success: function () {
                if (toggle_obj.hasAttribute("checked")) {
                    toggle_obj.removeAttribute("checked");
                    $("#site_in_service_button").removeClass("toggle-button_active");
                    $(".logo").removeClass("logo-warning").text("KoltAccount");
                } else {
                    toggle_obj.setAttribute("checked", "checked");
                    $("#site_in_service_button").addClass("toggle-button_active");
                    $(".logo").addClass("logo-warning").text("Сайт закрыт");
                }
            },
            error: function (jqXHR) {
                if (jqXHR.status === 404) {
                    swal("Ошибка", "Настройка site_in_service не найдена", "warning");
                } else if (jqXHR.status === 403) {
                    swal("Ошибка", "Недостаточно прав", "warning");
                } else {
                    swal("Ошибка", "Не удалось переключить настройку", "error");
                }
            },
            complete: function () {
                preloadHide();
            },
        });
    }
});

$(function() {
    let toggle_button;

    $("#site_in_service_button").on("change", function() {
        let is_service = "false",
            button_text = "Да, открыть!",
            alert_text = "Сайт будет открыт!",
            toggle_obj = this;

        if (!$(this).attr("checked")) {
            is_service = "true";
            button_text = "Да, закрыть.";
            alert_text = "Сайт будет закрыт на техническое обслуживание!";
        }

        swal({
                title: "Вы уверены?",
                text: alert_text,
                type: "warning",
                showCancelButton: true,
                confirmButtonText: button_text,
            },
            function() {
                preloadShow();
                setTimeout(function() {
                    site_in_service_toggle(toggle_obj, is_service);
                }, 300);
            }
        );
    });

    $(".toggle-button").on("click", function() {
        toggle_button = $(this);
    });

    $(".sweet-alert .cancel").on("click", function() {
        if (toggle_button.hasClass("toggle-button_active")) {
            toggle_button.addClass("toggle-button_active");
        } else {
            toggle_button.removeClass("toggle-button_active");
        }
    });

    function site_in_service_toggle(toggle_obj, toggle_checked) {
        $.ajax({
            url: "site_in_service_toggle/",
            type: "POST",
            data: {
                checked: toggle_checked
            },
            success: function(result) {
                if (result) {
                    toggle_obj.setAttribute("checked", "checked");
                    $("#site_in_service_button").addClass("toggle-button_active");
                    $(".logo").addClass("logo-warning").text("Сайт закрыт");
                } else {
                    toggle_obj.removeAttribute("checked");
                    $("#site_in_service_button").removeClass("toggle-button_active");
                    $(".logo").removeClass("logo-warning").text("KoltAccount");
                }
            },
            error: function (jqXHR, text, error) {
                swal("Ошибка", "Настройка site_in_service не найдена", "error");
            },
            complete: function() {
                preloadHide();
            }
        });
    }
});
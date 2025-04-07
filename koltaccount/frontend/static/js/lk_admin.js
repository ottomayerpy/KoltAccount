$(function() {
    let toggle_button;

    $('#site_in_service_button').on('change', function() {
        let is_service = 'false',
            button_text = 'Да, открыть!',
            alert_text = 'Сайт будет открыт!',
            button_color = '#64dd55',
            switch_obj = this;

        if (!$(this).attr('checked')) {
            is_service = 'true';
            button_text = 'Да, закрыть.';
            alert_text = 'Сайт будет закрыт на техническое обслуживание!';
            button_color = '#DD6B55';
        }

        swal({
                title: 'Вы уверены?',
                text: alert_text,
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: button_color,
                confirmButtonText: button_text,
            },
            function() {
                site_in_service_switch(switch_obj, is_service);
            }
        );
    });

    $('.toggle-button').on('click', function() {
        toggle_button = $(this);
    });

    $('.sweet-alert .cancel').on('click', function() {
        if (toggle_button.hasClass('toggle-button_active')) {
            toggle_button.addClass('toggle-button_active');
        } else {
            toggle_button.removeClass('toggle-button_active');
        }
    });

    function site_in_service_switch(switch_obj, toggle_checked) {
        preload_show();
        $.ajax({
            url: 'site_in_service_switch/',
            type: 'POST',
            data: {
                checked: toggle_checked
            },
            success: function(result) {
                if (result['status'] == 'success') {
                    if (result['checked'] == 'true') {
                        switch_obj.setAttribute("checked", "checked");
                        $('#site_in_service_button').addClass('toggle-button_active');
                    } else {
                        switch_obj.removeAttribute("checked");
                        $('#site_in_service_button').removeClass('toggle-button_active');
                    }
                } else if (result['result'] == 'doesnotexist') {
                    swal('Ошибка', 'Настройка site_in_service не найдена');
                } else {
                    swal('Ошибка', result['result']);
                }

                preload_hide();
            }
        });
    }
});
// admin-settings.js
$(document).ready(function() {
    
    // Сохранение пути к CPU температуре
    $('.btn-save-cpu-temp').on('click', function() {
        const $button = $(this);
        const $input = $('#cpu_temp_path_input');
        const $messageDiv = $('.cpu-temp-message');
        const path = $input.val().trim();
        const url = $button.data('url');
        
        // Валидация
        if (!path) {
            swal('Ошибка', 'Введите путь к датчику температуры', 'error');
            $input.focus();
            return;
        }
        
        // Блокируем кнопку
        $button.prop('disabled', true).text('Сохранение...');
        $messageDiv.removeClass('success error').empty();

        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                cpu_temp_path: path
            }),
            success: function(response) {
                swal("Путь успешно сохранен!", '', 'success');
            },
            error: function(xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Ошибка при сохранении';
                swal("Ошибка", errorMsg, 'error');
            },
            complete: function() {
                $button.prop('disabled', false).text('Сохранить путь');
            }
        });
    });
    
    // Сохранение по Enter
    $('#cpu_temp_path_input').on('keypress', function(e) {
        if (e.which === 13) $('.btn-save-cpu-temp').click();
    });

    // Для Orange PI
    function requestCpuTemp() {
        $.ajax({
            url: "/get_cpu_temp",
            type: "GET",
            success: function (result) {
                $(".cpu_temp").text(result);
            },
            error: function () {
                $(".cpu_temp").text("0°");
            }
        });
    }

    $(".cpu_temp").on("click", function () {
        setInterval(requestCpuTemp, 1000);
    });

    if ($(".cpu_temp").length) requestCpuTemp();
});
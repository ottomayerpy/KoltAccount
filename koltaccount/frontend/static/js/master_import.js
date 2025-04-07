/*

{% if request.user.is_staff %}
<input id="btn_master_import" type="file" value="Import" class="btn btn-primary"/>
<button id="btn_master_export" data-toggle="modal" class="btn btn-primary">Мастер экспорт</button>
{% endif %}

*/


$('#btn_master_import').on('change', function () {
    /* Мастер импорт аккаунтов из json файлов */
    var file = this.files[0],
        reader = new FileReader;

    reader.onloadend = function () {
        var data = JSON.parse(reader.result);
        for (var i in data) {
            console.log(data[i]['site']);
            _create_account(data[i]['site'], data[i]['description'], data[i]['login'], data[i]['password']);
            sleep(2000);
        }
    };

    reader.readAsText(file);
});

$('#btn_master_export').on('click', function () {
    master_export();
});

function sleep(miliseconds) {
    /* Остановить выполнение кода */
    var currentTime = new Date().getTime();
    while (currentTime + miliseconds >= new Date().getTime()) {
    }
}

function _create_account(site, description, login, password) {
    /* Добавление нового аккаунта в таблице !ТОЛЬКО ДЛЯ МАСТЕР ИМПОРТА! */
    preload_show();

    $.ajax({
        url: 'create_account/',
        type: 'POST',
        data: {
            site: encrypt(site, master_password),
            description: encrypt(description, master_password),
            login: encrypt(login, master_password),
            password: encrypt(password, master_password)
        },
        success: function (result) {
            if (result['status'] == 'success') {
                console.log(result['account_id']);
            } else if (result['status'] == 'error') {
                if (result['message'] == 'accountlimitreached') {
                    swal('Ошибка', 'Достигнут лимит в 200 аккаунтов');
                } else {
                    swal('Ошибка', result['message']);
                }
            } else {
                swal('Ошибка', result['result']);
            }

            preload_hide();
        },
        error: function (jqXHR, text, error) {
            if (error == 'Forbidden') {
                swal(
                    'Ошибка 403',
                    'Этот сайт требует наличия файла cookie CSRF при отправке форм.' +
                    ' Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie,' +
                    ' включите их снова, по крайней мере, для этого сайта.'
                )
                preload_hide();
            }
        }
    });
}

function master_export() {
    /* Мастер экспорт аккаунтов в json файл */
    var jd = [{"data": "data"}];
    let index = -1;
    let indexitem = 0;
    $('#Accounts_table td').each(function () {
        let data = $(this).text();
        
        if (data == '') {
            index += 1;
            indexitem = 0
            jd[index] = {}
        } else {
            if (indexitem == 0) {
                jd[index] = {...jd[index], site: data}
            } else if (indexitem == 1) {
                jd[index] = {...jd[index], description: data}
            } else if (indexitem == 2) {
                jd[index] = {...jd[index], login: decrypt(data, master_password)}
            } else if (indexitem == 3) {
                jd[index] = {...jd[index], password: decrypt(data, master_password)}
            } 

            indexitem += 1;
        }
        
    });

    console.log(JSON.stringify(jd));
}

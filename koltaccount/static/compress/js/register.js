$(function(){let a=$("#in-hide-username").val(),s=$("#in-hide-email").val();$("#id_username").val(a),$("#id_email").val(s);let i=/^[a-z0-9_-]+@[a-z0-9-]+\.([a-z]{1,6}\.)?[a-z]{2,6}$/i,d=!1,e=!1,l=!1,n=!1;function o(){let a=$("#id_password1").val(),s=!1,i=!1,d=!1,l=!1;a.length<8?($("#length").removeClass("valid").addClass("invalid"),s=!1):($("#length").removeClass("invalid").addClass("valid"),s=!0),a.match(/[a-z]/)?($("#letter").removeClass("invalid").addClass("valid"),i=!0):($("#letter").removeClass("valid").addClass("invalid"),i=!1),a.match(/[A-Z]/)?($("#capital").removeClass("invalid").addClass("valid"),d=!0):($("#capital").removeClass("valid").addClass("invalid"),d=!1),a.match(/[0-9]/)?($("#number").removeClass("invalid").addClass("valid"),l=!0):($("#number").removeClass("valid").addClass("invalid"),l=!1),s&&i&&d&&l?($("#id_password1").removeClass("input-invalid"),e=!0):($("#id_password1").addClass("input-invalid"),e=!1),t()}function t(){$("#id_password1").val()==$("#id_password2").val()?($("#id_password2").removeClass("input-invalid"),l=!0):($("#id_password2").addClass("input-invalid"),l=!1)}$("#id_email").on("input",function(){0==$(this).val().search(i)?($(this).removeClass("input-invalid"),d=!0):($(this).addClass("input-invalid"),d=!1)}),$(".js-show_password").on("click",function(){password=$("#id_password1"),password.attr("type","password"===password.attr("type")?"text":"password")}),$("form").on("submit",function(){preload_show();let a=$("#id_username").val();if(!n)return $.ajax({url:"check_username/",type:"POST",data:{username:a},success:function(a){if("success"==a.status){let s=a.is_exist_username;""==$("#id_username").val()?swal("Ошибка!",'Заполните поле "Имя".'):s?swal("Ошибка","Введенное имя уже используейтся, введите другое."):d?e?l&&(n=!0,$("form").submit()):$("#id_password1").addClass("input-invalid"):$("#id_email").addClass("input-invalid"),preload_hide()}else preload_hide(),swal("Ошибка!",res.result)},error:function(a,s,i){"Forbidden"==i&&(swal("Ошибка 403","Этот сайт требует наличия файла cookie CSRF при отправке форм. Если вы настроили свой браузер так, чтобы он не сохранял файлы cookie, включите их снова, по крайней мере, для этого сайта."),preload_hide())}}),!1}),$(".js-generate_password").on("touchstart mousedown",function(){let a=PassGenJS.getPassword({letters:4,lettersUpper:3,numbers:3});$("#id_password1").val(a),swal("Генератор","Ваш пароль: "+a+"\nСтарайтесь избегать хранения паролей на электронных устройствах в открытом виде."),o()}),$("#id_password1").on("input",function(){o()}).focus(function(){$("#password_info").show()}).blur(function(){$("#password_info").hide()}),$("#id_password2").on("input",function(){t()})});
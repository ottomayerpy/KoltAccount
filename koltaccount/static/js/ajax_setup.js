/* Присвоение CSRF токена для всех ajax запросов */

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (settings.type == "POST" || settings.type == "PUT" || settings.type == "DELETE") {
            function getCookie(name) {
                let cookieValue = null;
                if (document.cookie && document.cookie !== "") {
                    let cookies = document.cookie.split(";");
                    for (let i = 0; i < cookies.length; i++) {
                        let cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) == name + "=") {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        }
    }
});
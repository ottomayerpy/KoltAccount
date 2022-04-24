$(function() {
    $('.input_clear').on('click', function() {
        $('#sum').val('').focus();
    });

    $("#sum").on('keypress', function(event) {
        event = event || window.event;
        if (event.charCode && event.charCode != 0 && event.charCode != 46 && (event.charCode < 48 || event.charCode > 57))
            return false;
    });

    $('form').on('submit', function() {
        let sum = $('#sum');
        if (sum.val() == '' || sum.val() == '0' || sum.val() == '1' || sum.val()[0] == '0') {
            sum.val('');
            sum.focus();
            return false;
        }
    });
});
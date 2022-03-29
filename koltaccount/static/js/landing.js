/* Лендинг */

$(function() {
    // Демонстрация работы генератора паролей
    let params = {
        //score: // (number) - Надежность пароля (диапазон 1-4)
        //reliabilityPercent: // - Надежность пароля в % (диапазон 1-100)
        letters: 4, // (number) - Количество букв в пароле
        lettersUpper: 3, // (number) - Количество заглавных букв в пароле
        numbers: 3, // (number) - Количество цифр в пароле
        //symbols: // (number) - Количество спец. символов в пароле
    }

    // var score = PassGenJS.getScore(string) // Возвращает объект с информацией о пароле

    $('.random-string').text(PassGenJS.getPassword(params));

    setInterval(
        function() {
            $('.random-string').text(PassGenJS.getPassword(params));
        },
        2000
    );
});
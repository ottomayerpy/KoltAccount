export function safeFaviconUrl(siteName) {
    if (!siteName || typeof siteName !== "string") {
        return "https://favicon.yandex.net/favicon/";
    }
    const encoded = encodeURIComponent(siteName);
    return `https://favicon.yandex.net/favicon/${encoded}`;
}

export function copyToClipboard(text) {
    const $tmp = $("<input>");
    $("#CandyModal").append($tmp);
    $tmp.val(text).select();
    document.execCommand("copy");
    $tmp.remove();
}

export function highlightRow(candyId) {
    setTimeout(function () {
        let $newRow = $('tr[data-id="' + candyId + '"]');
        if ($newRow.length) {
            $("html, body").animate(
                {
                    scrollTop: $newRow.offset().top - 100,
                },
                500,
            );
            $newRow.find("td").addClass("highlight-new");
            setTimeout(function () {
                $newRow.find("td").removeClass("highlight-new");
            }, 3000);
        }
    }, 100);
}

import { safeFaviconUrl } from "../utils/helpers.js";

export function createNewRowElement(candyId, site, description, login, password) {
    // Проверка входных данных
    if (!candyId) {
        console.error("createNewRowElement: missing candyId");
        return $(); // возвращаем пустой jQuery объект
    }

    const $tr = $("<tr>").attr({
        "data-toggle": "modal",
        "data-target": "#CandyModal",
        "data-id": candyId,
        role: "row",
    });

    $tr.append(
        $("<td>")
            .addClass("td-favicon")
            .append(
                $("<img>").attr({
                    "data-id": candyId,
                    class: "favicon-sites",
                    height: "16",
                    width: "16",
                    alt: "icon",
                    src: safeFaviconUrl(site || ""),
                }),
            ),
        $("<td>")
            .addClass("td-site")
            .attr("data-id", candyId)
            .text(site || ""),
        $("<td>")
            .addClass("td-description")
            .attr("data-id", candyId)
            .text(description || ""),
        $("<td>")
            .addClass("td-login td-hide")
            .attr("data-id", candyId)
            .text(login || ""),
        $("<td>")
            .addClass("td-password td-hide")
            .attr("data-id", candyId)
            .text(password || ""),
    );

    return $tr;
}

export function configureTable() {
    let $table = $("#CandiesTable");

    if ($table.data("tablesorter")) {
        $table.trigger("destroy");
        $table.removeData("tablesorter");
        $table.removeClass("tablesorter tablesorter-default");
    }

    $table.tablesorter({
        sortList: [[1, 0]],
        textExtraction: {
            0: (node) => $(node).text(),
            1: (node) => $(node).text(),
            2: (node) => $(node).text(),
            3: (node) => $(node).text(),
            4: (node) => $(node).text(),
        },
    });
}

export function addImportedCandiesToTable(importedCandiesIds, candiesForTable) {
    let $table = $("#CandiesTable");
    let $tbody = $table.children("tbody").first();

    importedCandiesIds.forEach((importedAccountId) => {
        let tableData = candiesForTable[importedAccountId.index];
        if (!tableData) return;

        let $row = createNewRowElement(importedAccountId.id, tableData.site, tableData.description, tableData.login, tableData.password);

        if ($row && $row.length) {
            $tbody.append($row);
        }
    });

    $table.trigger("update", [true]);
}

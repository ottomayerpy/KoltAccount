export function initCharCounters(counters) {
    counters.forEach((counter) => {
        const $input = $(counter.inputId);
        const $counter = $(counter.counterId);
        const maxLength = $input.attr("maxlength");

        $(counter.maxId).text(maxLength);

        $input.on("input", function () {
            const currentLength = $(this).val().length;
            $counter.text(currentLength);

            if (currentLength >= maxLength) {
                $counter.css("color", "#dc3545");
            } else if (currentLength >= maxLength * 0.8) {
                $counter.css("color", "#ffc107");
            } else {
                $counter.css("color", "var(--text-color)");
            }
        });
    });
}

export function checkCandiesLimit(additionalCount = 0) {
    const CANDIES_LIMIT = parseInt($("#candies_limit").text()) || 200;
    const currentCount = parseInt($("#candies_count").text()) || 0;
    const newCount = currentCount + additionalCount;
    const available = CANDIES_LIMIT - currentCount;

    if (newCount > CANDIES_LIMIT) {
        return {
            allowed: false,
            current: currentCount,
            limit: CANDIES_LIMIT,
            available: available,
        };
    }

    return {
        allowed: true,
        current: currentCount,
        limit: CANDIES_LIMIT,
        available: available,
    };
}

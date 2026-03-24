function saveJSONToFile(data, filename = 'data.json') {
    // Преобразуем JSON в строку
    const jsonString = JSON.stringify(data, null, 2);

    // Создаем Blob с данными
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Создаем ссылку для скачивания
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Настраиваем ссылку
    link.href = url;
    link.download = filename;

    // Добавляем ссылку в документ, кликаем и удаляем
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Очищаем URL
    URL.revokeObjectURL(url);
}

export {saveJSONToFile};

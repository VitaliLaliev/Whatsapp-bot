/* script.js */
document.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const logsElement = document.getElementById('logs');

    // WebSocket для связи с сервером
    const socket = new WebSocket('ws://localhost:3000');

    // Обновление статуса
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'status') {
            statusElement.textContent = data.status;
        }

        if (data.type === 'log') {
            logsElement.value += `${data.message}\n`;
            logsElement.scrollTop = logsElement.scrollHeight;
        }
    };

    // Обработчики кнопок
    document.getElementById('start-bot').addEventListener('click', () => {
        socket.send(JSON.stringify({ action: 'start' }));
    });

    document.getElementById('stop-bot').addEventListener('click', () => {
        socket.send(JSON.stringify({ action: 'stop' }));
    });
});

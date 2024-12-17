/* server.js */
const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Статичные файлы (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '/')));

// Запуск WebSocket сервера
const wss = new WebSocket.Server({ noServer: true });

let botProcess = null;

wss.on('connection', (ws) => {
    console.log('Client connected.');

    // Отправка текущего статуса
    ws.send(JSON.stringify({ type: 'status', status: botProcess ? 'Running' : 'Idle' }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.action === 'start' && !botProcess) {
            botProcess = spawn('node', ['bot.js']); // Запуск бота

            botProcess.stdout.on('data', (data) => {
                broadcast({ type: 'log', message: data.toString() });
            });

            botProcess.stderr.on('data', (data) => {
                broadcast({ type: 'log', message: `Error: ${data.toString()}` });
            });

            botProcess.on('exit', () => {
                botProcess = null;
                broadcast({ type: 'status', status: 'Idle' });
            });

            broadcast({ type: 'status', status: 'Running' });
        }

        if (data.action === 'stop' && botProcess) {
            botProcess.kill();
            botProcess = null;
            broadcast({ type: 'status', status: 'Idle' });
        }
    });

    ws.on('close', () => console.log('Client disconnected.'));
});

// Функция для рассылки данных всем клиентам
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Установка WebSocket на сервер Express
app.server = app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

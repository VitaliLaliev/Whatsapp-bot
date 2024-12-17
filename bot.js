const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode'); // Импортируем библиотеку QR-кода

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    
    const sock = makeWASocket({
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { qr, connection } = update;

        if (qr) {
            // Генерация QR-кода
            QRCode.toFile('./qr-code.png', qr, (err) => {
                if (err) {
                    console.error('Ошибка создания QR-кода:', err);
                    return;
                }
                console.log('QR-код сохранен в файл qr-code.png. Откройте и сканируйте.');
            });
        }

        if (connection === 'open') {
            console.log('Бот успешно подключен!');
        } else if (connection === 'close') {
            console.log('Соединение закрыто. Перезапуск...');
            if (update.lastDisconnect?.error?.output?.statusCode !== 401) {
                startBot(); // Перезапускаем, если это не ошибка авторизации
            } else {
                console.log('Ошибка авторизации. Требуется повторное сканирование QR-кода.');
            }
        }
    });

    sock.ev.on('messages.upsert', async (msgUpdate) => {
        const msg = msgUpdate.messages[0];

        if (!msg.key.fromMe && msg.message) {
            console.log('Получено сообщение:', msg.message);

           // Проверка на команду #вызов
if (msg.message.conversation && msg.message.conversation.startsWith('#вызов')) {
    // Получаем метаданные группы
    const groupMeta = await sock.groupMetadata(msg.key.remoteJid); // Получаем метаданные группы
    console.log('Групповые метаданные:', groupMeta); // Логируем метаданные для отладки

    // Извлекаем список администраторов
    const admins = groupMeta.participants.filter(p => p.admin).map(p => p.id);
    console.log('Список администраторов:', admins); // Логируем список администраторов

    // Получаем ID участника, отправившего команду
    const senderId = msg.key.participant;
    console.log('ID отправителя сообщения:', senderId);

    // Проверка, является ли отправитель администратором
    if (admins.includes(senderId)) {
        console.log('Администратор отправил команду #вызов');

        // Формируем список упоминаний для отправки
        const mentions = groupMeta.participants.map(p => p.id);
        console.log('Упоминания для отправки:', mentions); // Логируем упоминания

        await sock.sendMessage(msg.key.remoteJid, {
            text: 'Внимание! Все участники!',
            mentions: mentions,
        });
    } else {
        console.log('Команду #вызов может отправлять только администратор.');
    }
}

            // Удаление участников, отправляющих ссылки
            if (msg.message.extendedTextMessage && /http[s]?:\/\/\S+/.test(msg.message.extendedTextMessage.text)) {
                const senderId = msg.key.participant;
                console.log(`Проверка участника ${senderId}, отправившего ссылку.`);

                // Получаем метаданные группы для проверки администраторов
                const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
                const admins = groupMeta.participants.filter(p => p.admin).map(p => p.id);

                // Проверяем, является ли участник администратором
                if (!admins.includes(senderId)) {
                    console.log(`Удаление пользователя ${senderId}, отправившего ссылку.`);

                    // Удаление участника с помощью метода groupParticipantsUpdate
                    await sock.groupParticipantsUpdate(msg.key.remoteJid, [senderId], 'remove'); // Удаление участника
                } else {
                    console.log('Отправивший ссылку участник является администратором, удаление не требуется.');
                }
            }
        }
    });
}

startBot().catch(err => console.error('Ошибка запуска бота:', err));

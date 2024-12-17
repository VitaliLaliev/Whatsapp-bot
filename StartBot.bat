@echo off
title WhatsApp Bot Launcher

:: Устанавливаем рабочую директорию
cd /d "%~dp0"

:: Запускаем сервер
start cmd /k "node server.js"

:: Ждём, пока сервер запустится (5 секунд)
timeout /t 5 >nul

:: Открываем интерфейс в браузере
start "" "http://localhost:3000"

:: Сообщаем пользователю, что всё запущено
echo Сервер запущен, интерфейс открыт в браузере.
pause

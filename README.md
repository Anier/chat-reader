# 📖 JSON GEMINI Chat Reader

Веб-приложение для просмотра экспортированных сессий чата с Google Gemini в форматах JSON и JSONL.

## Возможности

- **Загрузка файлов** — выберите файл через интерфейс или перетащите его в окно браузера (drag & drop)
- **Поддержка форматов** — JSON (один объект с массивом `messages`) и JSONL (первая строка — заголовок сессии, остальные — отдельные сообщения)
- **Отображение Markdown** — заголовки, код, списки, ссылки, жирный/курсивный текст
- **Сворачивание ответов Gemini** — длинные ответы Gemini можно скрывать/показывать
- **Полноэкранный режим** — удобен для чтения длинных диалогов
- **Поддержка двух языков** — интерфейс на русском, даты форматируются по стандарту России
- **API эндпоинты** — бэкенд на Hono позволяет получать список файлов из директории `jsons/` и загружать их содержимое по запросу

## Технологии

- **[Next.js](https://nextjs.org/)** 16 — React-фреймворк
- **[React](https://react.dev/)** 19
- **[TypeScript](https://www.typescriptlang.org/)** 6
- **[Tailwind CSS](https://tailwindcss.com/)** 4 — стилизация
- **[Hono](https://hono.dev/)** — API-роуты
- **[Lucide React](https://lucide.dev/)** — иконки

## Начало работы

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

## Структура проекта

```
├── app/
│   ├── api/[[...route]]/  # API роуты (Hono)
│   ├── globals.css         # глобальные стили
│   ├── layout.tsx          # корневой layout
│   └── page.tsx            # главная страница (весь UI)
├── api-chat.ts             # эндпоинт для чтения файла чата
├── api-files.ts            # эндпоинт для списка файлов и папок
├── jsons/                  # директория с JSON/JSONL файлами (для API)
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## API (Hono)

| Маршрут | Параметры | Описание |
|---|---|---|
| `GET /api/chat?file=...` | `file` — имя файла, `folder` — папка (по умолчанию `jsons`) | Возвращает содержимое сессии в формате JSON |
| `GET /api/files?folder=...` | `folder` — папка для поиска | Возвращает список доступных папок и файлов `.json` / `.jsonl` |

## Форматы файлов

### JSON

```json
{
  "sessionId": "...",
  "startTime": "2026-01-01T...",
  "lastUpdated": "2026-01-01T...",
  "messages": [
    {
      "id": "msg_1",
      "type": "user" | "gemini",
      "timestamp": "2026-01-01T...",
      "content": "текст сообщения"
    }
  ]
}
```

### JSONL

```
{"sessionId":"...","startTime":"...","lastUpdated":"..."}
{"id":"...","type":"user","timestamp":"...","content":"..."}
{"id":"...","type":"gemini","timestamp":"...","content":"..."}
```

## Лицензия

ISC
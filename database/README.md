# PostgreSQL 17 + PostGIS (Docker) для проекта

Контейнеризированная БД PostgreSQL 17 с PostGIS. Авто-инициализация создаёт роли `migrator`, `app_user`, схему `app`, расширения и таблицы под ТЗ.

## Структура
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ init/
│ ├─ 01_roles.sh
│ ├─ 02_schema_extensions.sql
│ └─ 03_tables.sql
├─ backups/ # дампы сюда (в .gitignore)
└─ README.md


## Быстрый старт

1. Установить Docker Desktop.
2. Создать **локальный** `.env` (на основе `.env.example`) и **не коммитить** его!!!!:
   POSTGRES_DB=dbforsite
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=CHANGE_ME_POSTGRES

   MIGRATOR_USER=migrator
   MIGRATOR_PASSWORD=CHANGE_ME_MIGRATOR
   APP_USER=app_user
   APP_USER_PASSWORD=CHANGE_ME_APP
   
## Сборка и запуск
docker compose up -d --build
docker compose logs -f db (вывод логов, можно не юзать)

## Подключение 
**pspl с хоста:**
psql -h 127.0.0.1 -p 5433 -U postgres -d ${POSTGRES_DB}

**внутри контейнера**
docker exec -it dbforsite-postgres psql -U postgres -d ${POSTGRES_DB}

**Через pgAdmin**
Host: 127.0.0.1
Port: 5433
DB: dbforsite (или postgres)
User: postgres
Pass: из .env

**DBeaver**
В DBeaver:
Database → New Database Connection
Выбираешь PostgreSQL
Вводишь:
Host: 127.0.0.1
Port: 5433 (из docker-compose.yml)
Database: dbforsite (или что у тебя указано в .env)
User: postgres (или migrator / app_user)
Password: из .env
Жмёшь Test Connection → должно быть Success.


## Если при запуске контейнера выскакивает ошибка о занятом порте 5433, то в файле docker-compose.yaml поменяйте порт на свободный

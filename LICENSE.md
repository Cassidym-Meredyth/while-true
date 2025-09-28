# Запуск сервиса
1. Для запуска требуется [Docker Desktop](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe?utm_source=docker&utm_medium=webreferral&utm_campaign=docs-driven-download-win-amd64)
2. В корне проекта необходимо создать два файла: .env и .dockerignore:
    - .env:
    ```
    DATABASE_URL=postgres://app_user:password@postgres:5432/dbforsite?sslmode=disable&options=-c%20search_path%3Dapp,public

    POSTGRES_DB=dbforsite
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=password

    MIGRATOR_USER=migrator
    MIGRATOR_PASSWORD=password
    APP_USER=app_user
    APP_USER_PASSWORD=password

    S3_ENDPOINT=
    S3_BUCKET=
    S3_ACCESS_KEY=
    S3_SECRET_KEY=

    KEYCLOAK_ISSUER=http://keycloak:8080/realms/icj
    KEYCLOAK_AUDIENCE=icj
    ```

    - .dockerignore:
    ```
    .git
    **/node_modules
    database/backups
    KeyCloak/*.yml
    *.md
    ```
3. Заходите в корень проекта и пишете команду `docker compose up -d`
4. В приложении Docker Desktop в containers увидите `while_true-stack`

# Просмотр базы данных
1. Необходимо зайти в pgadmin (контейнер icj-pgadmin) и войти в ЛК (admin@example.com и admin)
2. Servers => Register => Server:
    - General => Name - icj-DB
    - Conneciton => Host name/address - icj-DB; Port - 5432; Username - app_user; Password - password; Save



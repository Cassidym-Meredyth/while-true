-- Расширения, которые нужны проекту.
-- Выполняется один раз при инициализации пустой БД.

-- PostGIS — геометрия и гео-функции (точки визитов, полигоны объектов).
CREATE EXTENSION IF NOT EXISTS postgis;

-- uuid-ossp — генерация UUID (uuid_generate_v4()) для PK.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm — триграммы для быстрого поиска по текстам (описания замечаний).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- citext — регистронезависимый текст (удобно для e-mail и т.п.).
CREATE EXTENSION IF NOT EXISTS citext;


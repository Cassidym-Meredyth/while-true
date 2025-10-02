SET search_path TO app, public;

-- =======================
-- Проекты
-- =======================
CREATE TABLE IF NOT EXISTS app.project (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       text NOT NULL,
  status     text NOT NULL CHECK (status IN ('planned','active','paused','done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.project_area (
  project_id uuid PRIMARY KEY REFERENCES app.project(id) ON DELETE CASCADE,
  geom       geometry(Polygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS project_area_gix ON app.project_area USING GIST (geom);

CREATE TABLE IF NOT EXISTS app.task (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  name          text NOT NULL,
  start_planned date NOT NULL,
  end_planned   date NOT NULL,
  start_actual  date,
  end_actual    date,
  status        text NOT NULL DEFAULT 'planned'
               CHECK (status IN ('planned','in_progress','done','blocked')),
  CONSTRAINT task_dates_chk CHECK (end_planned >= start_planned)
);
CREATE INDEX IF NOT EXISTS task_proj_status_idx ON app.task(project_id, status, start_planned);

CREATE TABLE IF NOT EXISTS app.visit (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  actor_id   uuid NOT NULL,
  role       text NOT NULL CHECK (role IN ('foreman','control_service','inspector')),
  visited_at timestamptz NOT NULL DEFAULT now(),
  location   geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS visit_proj_time_idx ON app.visit(project_id, visited_at);
CREATE INDEX IF NOT EXISTS visit_loc_gix      ON app.visit USING GIST(location);

CREATE TABLE IF NOT EXISTS app.issue (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL,
  role_context text NOT NULL CHECK (role_context IN ('control_service','inspector')),
  type         text NOT NULL CHECK (type IN ('remark','violation')),
  status       text NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','in_progress','fixed','accepted','rejected')),
  description  text,
  due_at       timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  location     geometry(Point, 4326)
);
CREATE INDEX IF NOT EXISTS issue_proj_status_due_idx ON app.issue(project_id, status, due_at);
CREATE INDEX IF NOT EXISTS issue_loc_gix             ON app.issue USING GIST(location);
CREATE INDEX IF NOT EXISTS issue_desc_trgm           ON app.issue USING GIN (description gin_trgm_ops);

CREATE TABLE IF NOT EXISTS app.attachment (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid NOT NULL REFERENCES app.project(id) ON DELETE CASCADE,
  owner_table text NOT NULL,
  owner_id    uuid NOT NULL,
  file_url    text NOT NULL,
  file_type   text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attachment_owner_idx ON app.attachment(owner_table, owner_id);

-- =======================
-- Пользователи и роли
-- =======================

-- Пользователи: kc_sub как TEXT (а не uuid), active по умолчанию true
CREATE TABLE IF NOT EXISTS app.user_account (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kc_sub     text UNIQUE,                       -- sub из Keycloak (TEXT, допускаем NULL)
  username   citext UNIQUE NOT NULL,
  email      citext,
  full_name  text,
  active     boolean NOT NULL DEFAULT true,
  role_id    integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_account_kc_sub   ON app.user_account(kc_sub);
CREATE INDEX IF NOT EXISTS idx_user_account_username ON app.user_account(username);

-- Роли: и глобальные (user_id IS NULL), и персональные (user_id = пользователю)
CREATE TABLE IF NOT EXISTS app.user_role (
  id        serial PRIMARY KEY,
  code      text NOT NULL,                       -- 'admin','foreman','inspector','customer'
  title     text NOT NULL,
  user_id   uuid REFERENCES app.user_account(id) ON DELETE CASCADE,
  role_code text GENERATED ALWAYS AS (code) STORED
);

-- Уникальность:
-- 1) глобальные роли (одна запись на code, где user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS user_role_global_code_ux ON app.user_role(code) WHERE user_id IS NULL;
-- 2) персональные роли (одна запись на (user_id, code))
CREATE UNIQUE INDEX IF NOT EXISTS user_role_user_code_ux   ON app.user_role(user_id, code);

WITH seed(code, title) AS (
  VALUES
    ('admin','Administrator'),
    ('foreman','Foreman'),
    ('inspector','Inspector'),
    ('customer','Customer')
)
INSERT INTO app.user_role(code, title)
SELECT s.code, s.title
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM app.user_role ur
  WHERE ur.user_id IS NULL AND ur.code = s.code
);

-- (опционально) M:N на будущее
CREATE TABLE IF NOT EXISTS app.user_account_role (
  user_id uuid    NOT NULL REFERENCES app.user_account(id) ON DELETE CASCADE,
  role_id integer NOT NULL REFERENCES app.user_role(id)    ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- VIEW для совместимости: app.role (чтобы EXISTS(SELECT 1 FROM app.role WHERE code=$2) работал)
CREATE OR REPLACE VIEW app.role AS
SELECT code, title FROM app.user_role WHERE user_id IS NULL;

-- Владельцы/права
ALTER TABLE app.project           OWNER TO app_user;
ALTER TABLE app.project_area      OWNER TO app_user;
ALTER TABLE app.task              OWNER TO app_user;
ALTER TABLE app.visit             OWNER TO app_user;
ALTER TABLE app.issue             OWNER TO app_user;
ALTER TABLE app.attachment        OWNER TO app_user;
ALTER TABLE app.user_account      OWNER TO app_user;
ALTER TABLE app.user_role         OWNER TO app_user;
ALTER TABLE app.user_account_role OWNER TO app_user;

GRANT SELECT,INSERT,UPDATE,DELETE ON app.project, app.project_area, app.task, app.visit,
                                    app.issue, app.attachment,
                                    app.user_account, app.user_role, app.user_account_role
TO app_user;

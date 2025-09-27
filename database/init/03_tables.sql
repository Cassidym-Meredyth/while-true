-- Таблица проектов (объекты благоустройства).
CREATE TABLE app.project (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),        -- PK проекта (UUID)
  name       text NOT NULL,                                      -- название объекта
  status     text NOT NULL CHECK (status IN                      -- текущий статус
                ('planned','active','paused','done')),
  created_at timestamptz NOT NULL DEFAULT now()                  -- когда создан
);
COMMENT ON TABLE app.project IS 'Проекты/объекты благоустройства';
COMMENT ON COLUMN app.project.id         IS 'UUID проекта (PK)';
COMMENT ON COLUMN app.project.name       IS 'Название объекта';
COMMENT ON COLUMN app.project.status     IS 'Статус: planned/active/paused/done';
COMMENT ON COLUMN app.project.created_at IS 'Дата/время создания записи';

-- Геометрия проекта — полигон на карте (границы работ).
CREATE TABLE app.project_area (
  project_id uuid PRIMARY KEY                                      -- PK = FK на project
            REFERENCES app.project(id) ON DELETE CASCADE,
  geom       geometry(Polygon, 4326) NOT NULL                      -- геометрия-полигон, SRID 4326 (WGS84)
);
COMMENT ON TABLE app.project_area IS 'Полигон (границы) объекта на карте';
COMMENT ON COLUMN app.project_area.project_id IS 'ID проекта (FK → project.id)';
COMMENT ON COLUMN app.project_area.geom       IS 'Полигон границ (PostGIS, SRID 4326)';

-- Индекс по геометрии (GiST) для быстрых гео-операций (ST_Contains и т.п.).
CREATE INDEX project_area_gix ON app.project_area USING GIST (geom);
COMMENT ON INDEX project_area_gix IS 'GiST индекс на полигон объекта';

-- Задачи (узлы диаграммы Ганта) — план/факт выполнения.
CREATE TABLE app.task (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),        -- PK задачи (UUID)
  project_id    uuid NOT NULL                                       -- к какому проекту относится
                REFERENCES app.project(id) ON DELETE CASCADE,
  name          text NOT NULL,                                      -- название/тип работ
  start_planned date NOT NULL,                                      -- плановая дата начала
  end_planned   date NOT NULL,                                      -- плановая дата окончания
  start_actual  date,                                               -- фактическая дата начала
  end_actual    date,                                               -- фактическая дата окончания
  status        text NOT NULL DEFAULT 'planned'                     -- статус выполнения
                 CHECK (status IN ('planned','in_progress','done','blocked')),
  CONSTRAINT task_dates_chk CHECK (end_planned >= start_planned)    -- базовый контроль дат
);
COMMENT ON TABLE app.task IS 'Задачи (диаграмма Ганта) проекта';
COMMENT ON COLUMN app.task.project_id    IS 'ID проекта (FK → project.id)';
COMMENT ON COLUMN app.task.name          IS 'Название/вид работ';
COMMENT ON COLUMN app.task.start_planned IS 'Плановая дата начала';
COMMENT ON COLUMN app.task.end_planned   IS 'Плановая дата окончания';
COMMENT ON COLUMN app.task.start_actual  IS 'Фактическая дата начала';
COMMENT ON COLUMN app.task.end_actual    IS 'Фактическая дата окончания';
COMMENT ON COLUMN app.task.status        IS 'Статус: planned/in_progress/done/blocked';

-- Индекс для частых выборок по проекту/статусу/дате начала.
CREATE INDEX task_proj_status_idx
  ON app.task(project_id, status, start_planned);
COMMENT ON INDEX task_proj_status_idx IS 'Поиск задач по проекту/статусу/дате';

-- Визиты на объект (кто/где/когда) — подтверждают «факт посещения».
CREATE TABLE app.visit (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),        -- PK визита (UUID)
  project_id uuid NOT NULL                                       -- к какому объекту визит
            REFERENCES app.project(id) ON DELETE CASCADE,
  actor_id   uuid NOT NULL,                                      -- идентификатор пользователя/актора (из вашей auth)
  role       text NOT NULL CHECK (role IN                        -- роль посетителя
              ('foreman','control_service','inspector')),
  visited_at timestamptz NOT NULL DEFAULT now(),                 -- когда был визит
  location   geometry(Point, 4326) NOT NULL                      -- точка на карте (SRID 4326)
);
COMMENT ON TABLE app.visit IS 'Визиты на объект (кто/где/когда)';
COMMENT ON COLUMN app.visit.project_id IS 'ID проекта (FK → project.id)';
COMMENT ON COLUMN app.visit.actor_id   IS 'ID пользователя/актора в вашей системе';
COMMENT ON COLUMN app.visit.role       IS 'Роль: foreman/control_service/inspector';
COMMENT ON COLUMN app.visit.visited_at IS 'Дата/время визита';
COMMENT ON COLUMN app.visit.location   IS 'Точка визита (PostGIS Point, SRID 4326)';

-- Индексы для быстрых выборок и гео-операций.
CREATE INDEX visit_proj_time_idx ON app.visit(project_id, visited_at);
COMMENT ON INDEX visit_proj_time_idx IS 'Сортировка/фильтр визитов по проекту и времени';
CREATE INDEX visit_loc_gix ON app.visit USING GIST(location);
COMMENT ON INDEX visit_loc_gix IS 'GiST индекс на гео-точку визита';

-- Замечания/нарушения по объекту.
CREATE TABLE app.issue (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),      -- PK замечания (UUID)
  project_id   uuid NOT NULL                                     -- к какому объекту относится
                REFERENCES app.project(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL,                                    -- кто создал (ID пользователя/актора)
  role_context text NOT NULL CHECK (role_context IN              -- контекст роли автора
                ('control_service','inspector')),
  type         text NOT NULL CHECK (type IN                      -- тип записи
                ('remark','violation')),
  status       text NOT NULL DEFAULT 'open'                      -- статус жизненного цикла
                 CHECK (status IN ('open','in_progress','fixed','accepted','rejected')),
  description  text,                                             -- описание проблемы
  due_at       timestamptz,                                      -- срок устранения (если есть)
  created_at   timestamptz NOT NULL DEFAULT now(),               -- когда создано
  location     geometry(Point, 4326)                             -- геометка замечания
);
COMMENT ON TABLE app.issue IS 'Замечания и нарушения';
COMMENT ON COLUMN app.issue.project_id   IS 'ID проекта (FK → project.id)';
COMMENT ON COLUMN app.issue.created_by   IS 'ID автора (пользователь/актер вашей системы)';
COMMENT ON COLUMN app.issue.role_context IS 'Роль автора: control_service/inspector';
COMMENT ON COLUMN app.issue.type         IS 'Тип: remark (замечание) / violation (нарушение)';
COMMENT ON COLUMN app.issue.status       IS 'Статус: open/in_progress/fixed/accepted/rejected';
COMMENT ON COLUMN app.issue.description  IS 'Текстовое описание';
COMMENT ON COLUMN app.issue.due_at       IS 'Срок устранения (если задан)';
COMMENT ON COLUMN app.issue.location     IS 'Геометка проблемы (Point, SRID 4326)';

-- Индексы: дедлайны/статусы + гео + полнотекст/подобие по описанию.
CREATE INDEX issue_proj_status_due_idx ON app.issue(project_id, status, due_at);
COMMENT ON INDEX issue_proj_status_due_idx IS 'Выборка актуальных замечаний по срокам/статусу';
CREATE INDEX issue_loc_gix ON app.issue USING GIST(location);
COMMENT ON INDEX issue_loc_gix IS 'GiST индекс на гео-точку замечания';
CREATE INDEX issue_desc_trgm ON app.issue USING GIN (description gin_trgm_ops);
COMMENT ON INDEX issue_desc_trgm IS 'Триграммный индекс для поиска по описанию';

-- Вложения (ссылки на файлы: фото, PDF актов, и т.п.). Сами файлы живут в S3/MinIO/диске.
CREATE TABLE app.attachment (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),       -- PK вложения (UUID)
  project_id  uuid NOT NULL                                      -- к какому объекту файла относится
              REFERENCES app.project(id) ON DELETE CASCADE,
  owner_table text NOT NULL,                                     -- имя связанной таблицы ('issue' | 'project' | ...)
  owner_id    uuid NOT NULL,                                     -- ID записи связанной таблицы
  file_url    text NOT NULL,                                     -- ссылка на файл (S3/MinIO/путь)
  file_type   text,                                              -- тип ('photo','pdf',...)
  uploaded_by uuid NOT NULL,                                     -- кто загрузил (ID пользователя/актора)
  uploaded_at timestamptz NOT NULL DEFAULT now()                 -- когда загружено
);
COMMENT ON TABLE app.attachment IS 'Вложения (ссылки на файлы в объектном хранилище)';
COMMENT ON COLUMN app.attachment.project_id  IS 'ID проекта (FK → project.id)';
COMMENT ON COLUMN app.attachment.owner_table IS 'Имя таблицы-владельца (issue/project/...)';
COMMENT ON COLUMN app.attachment.owner_id    IS 'ID записи-владельца';
COMMENT ON COLUMN app.attachment.file_url    IS 'URL файла в хранилище';
COMMENT ON COLUMN app.attachment.file_type   IS 'Тип файла (photo/pdf/...)';
COMMENT ON COLUMN app.attachment.uploaded_by IS 'Кто загрузил (ID пользователя/актора)';
COMMENT ON COLUMN app.attachment.uploaded_at IS 'Когда загружено';

CREATE INDEX attachment_owner_idx ON app.attachment(owner_table, owner_id);
COMMENT ON INDEX attachment_owner_idx IS 'Быстрый поиск вложений по владельцу';

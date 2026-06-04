-- =============================================================
-- CasaMatch — Esquema inicial de base de datos
-- Supabase / PostgreSQL 15+
--
-- Convención de nombres: snake_case, plural para tablas
-- Todos los timestamps en TIMESTAMPTZ (UTC)
-- gen_random_uuid() nativa en PG 13+ (sin extensión requerida)
-- =============================================================


-- =============================================================
-- 0. TIPOS ENUMERADOS
-- =============================================================

CREATE TYPE rol_usuario      AS ENUM ('usuario', 'asesor', 'admin');
CREATE TYPE tipo_operacion   AS ENUM ('comprar', 'rentar', 'invertir');
CREATE TYPE tipo_interaccion AS ENUM ('like', 'nope', 'save');


-- =============================================================
-- 1. TABLA: perfiles
-- Extiende auth.users con datos del dominio CasaMatch.
-- id es exactamente el mismo UUID que Supabase Auth genera.
-- =============================================================

CREATE TABLE perfiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre         TEXT        NOT NULL,
  telefono       TEXT,
  avatar_url     TEXT,
  rol            rol_usuario NOT NULL DEFAULT 'usuario',
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  perfiles              IS 'Datos de perfil vinculados a auth.users.';
COMMENT ON COLUMN perfiles.rol          IS 'usuario = comprador/rentador, asesor = agente inmobiliario, admin = staff CasaMatch.';


-- =============================================================
-- 2. TABLA: preferencias_onboarding
-- Una fila por usuario (UNIQUE usuario_id).
-- =============================================================

CREATE TABLE preferencias_onboarding (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID           NOT NULL UNIQUE REFERENCES perfiles(id) ON DELETE CASCADE,
  tipo_operacion   tipo_operacion NOT NULL,
  presupuesto_min  NUMERIC(14, 2),
  presupuesto_max  NUMERIC(14, 2),
  ciudad           TEXT           NOT NULL,
  tipo_propiedad   TEXT,
  zonas            TEXT[],
  tags_lifestyle   TEXT[],
  -- Valores válidos de tags: 'mascotas', 'home_office', 'zona_tranquila',
  -- 'vida_social', 'escuelas', 'plusvalia', 'familias', 'lujo', 'minimalista'
  recamaras_min    SMALLINT,
  creado_en        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN preferencias_onboarding.tags_lifestyle IS
  'Etiquetas de estilo de vida seleccionadas durante el onboarding: mascotas, home_office, zona_tranquila, vida_social, escuelas, plusvalia, familias, lujo, minimalista.';


-- =============================================================
-- 3. TABLA: propiedades
-- =============================================================

CREATE TABLE propiedades (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id                 UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  titulo                    TEXT        NOT NULL,
  descripcion               TEXT,
  tipo                      TEXT        NOT NULL
    CHECK (tipo IN ('casa', 'departamento', 'terreno', 'local', 'oficina')),
  precio                    NUMERIC(14, 2) NOT NULL CHECK (precio > 0),
  ciudad                    TEXT        NOT NULL,
  ubicacion                 TEXT        NOT NULL,          -- Colonia / dirección
  recamaras                 SMALLINT    CHECK (recamaras >= 0),
  banos                     NUMERIC(3, 1) CHECK (banos >= 0),
  estacionamientos          SMALLINT    CHECK (estacionamientos >= 0),
  m2                        NUMERIC(8, 2) CHECK (m2 > 0),
  caracteristicas_lifestyle JSONB       NOT NULL DEFAULT '{}',
  -- Estructura esperada del JSONB:
  -- {
  --   "seguridad":          0-5,   (float)
  --   "trafico":            0-5,
  --   "vida_social":        0-5,
  --   "tranquilidad":       0-5,
  --   "plusvalia":          0-5,
  --   "servicios_cercanos": 0-5,
  --   "pet_friendly":       bool,
  --   "familias":           bool,
  --   "home_office":        bool
  -- }
  url_video                 TEXT,
  imagenes                  TEXT[]      NOT NULL DEFAULT '{}',
  activa                    BOOLEAN     NOT NULL DEFAULT TRUE,
  destacada                 BOOLEAN     NOT NULL DEFAULT FALSE,
  creado_en                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN propiedades.caracteristicas_lifestyle IS
  'Métricas de estilo de vida en escala 0-5: seguridad, trafico, vida_social, tranquilidad, plusvalia, servicios_cercanos. Booleanos: pet_friendly, familias, home_office.';


-- =============================================================
-- 4. TABLA: interacciones_swipes
-- UNIQUE (usuario_id, propiedad_id) garantiza un solo swipe
-- por combinación usuario-propiedad; el UPDATE cambia el tipo.
-- =============================================================

CREATE TABLE interacciones_swipes (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id       UUID             NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  propiedad_id     UUID             NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  tipo_interaccion tipo_interaccion NOT NULL,
  creado_en        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_swipe_usuario_propiedad UNIQUE (usuario_id, propiedad_id)
);


-- =============================================================
-- 5. ÍNDICES DE RENDIMIENTO
-- =============================================================

-- Propiedades
CREATE INDEX idx_propiedades_asesor    ON propiedades(asesor_id);
CREATE INDEX idx_propiedades_ciudad    ON propiedades(ciudad);
CREATE INDEX idx_propiedades_precio    ON propiedades(precio);
CREATE INDEX idx_propiedades_activas   ON propiedades(activa) WHERE activa = TRUE;
CREATE INDEX idx_propiedades_lifestyle ON propiedades USING GIN(caracteristicas_lifestyle);

-- Swipes
CREATE INDEX idx_swipes_usuario    ON interacciones_swipes(usuario_id);
CREATE INDEX idx_swipes_propiedad  ON interacciones_swipes(propiedad_id);
CREATE INDEX idx_swipes_tipo       ON interacciones_swipes(tipo_interaccion);

-- Preferencias
CREATE INDEX idx_preferencias_ciudad ON preferencias_onboarding(ciudad);


-- =============================================================
-- 6. TRIGGER: actualizar timestamp en UPDATE
-- =============================================================

CREATE OR REPLACE FUNCTION fn_actualizar_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfiles_ts
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_preferencias_ts
  BEFORE UPDATE ON preferencias_onboarding
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

CREATE TRIGGER trg_propiedades_ts
  BEFORE UPDATE ON propiedades
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();


-- =============================================================
-- 7. TRIGGER: auto-crear perfil al registrar usuario en Auth
--
-- SECURITY DEFINER es necesario porque el trigger corre en
-- auth.users (schema privado). Se restringe search_path para
-- evitar ataques de sustitución de schema.
-- =============================================================

CREATE OR REPLACE FUNCTION fn_crear_perfil_nuevo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nombre',
      split_part(NEW.email, '@', 1)
    ),
    'usuario'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Revocar ejecución directa; solo el trigger debe invocarla
REVOKE EXECUTE ON FUNCTION fn_crear_perfil_nuevo_usuario() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_auth_crear_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_crear_perfil_nuevo_usuario();


-- =============================================================
-- 8. ROW LEVEL SECURITY
-- Habilitado en todas las tablas del schema público.
-- =============================================================

ALTER TABLE perfiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferencias_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacciones_swipes    ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 8a. POLÍTICAS: perfiles
-- =============================================================

-- Cada usuario lee su propio perfil
CREATE POLICY "perfiles: leer perfil propio"
  ON perfiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Un asesor puede leer datos básicos de usuarios que hicieron
-- swipe en alguna de sus propiedades (sección de leads).
-- SEGURIDAD: solo ve usuarios relacionados a sus propiedades,
-- no perfiles arbitrarios ni de asesores competidores.
CREATE POLICY "perfiles: asesor lee sus leads"
  ON perfiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM interacciones_swipes sw
      JOIN propiedades p ON p.id = sw.propiedad_id
      WHERE sw.usuario_id = perfiles.id
        AND p.asesor_id   = auth.uid()
    )
  );

-- El trigger crea el perfil como SECURITY DEFINER;
-- el usuario también puede insertarlo manualmente al registrarse.
CREATE POLICY "perfiles: insertar perfil propio"
  ON perfiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles: actualizar perfil propio"
  ON perfiles FOR UPDATE TO authenticated
  USING    (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- =============================================================
-- 8b. POLÍTICAS: preferencias_onboarding
-- =============================================================

CREATE POLICY "preferencias: leer propias"
  ON preferencias_onboarding FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "preferencias: insertar propias"
  ON preferencias_onboarding FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "preferencias: actualizar propias"
  ON preferencias_onboarding FOR UPDATE TO authenticated
  USING    (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "preferencias: eliminar propias"
  ON preferencias_onboarding FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());


-- =============================================================
-- 8c. POLÍTICAS: propiedades
--
-- SEGURIDAD COMPETITIVA:
--   • Un asesor JAMÁS puede leer ni modificar propiedades de otro asesor.
--   • Solo puede ver sus propias propiedades (activas e inactivas).
--   • Los usuarios ven únicamente propiedades activas.
-- =============================================================

-- Cualquier usuario autenticado puede descubrir propiedades activas
CREATE POLICY "propiedades: leer activas"
  ON propiedades FOR SELECT TO authenticated
  USING (activa = TRUE);

-- El asesor dueño puede leer todas sus propiedades (incluso inactivas)
CREATE POLICY "propiedades: asesor lee las suyas"
  ON propiedades FOR SELECT TO authenticated
  USING (asesor_id = auth.uid());

-- Solo asesores o admins pueden publicar propiedades
CREATE POLICY "propiedades: asesor inserta"
  ON propiedades FOR INSERT TO authenticated
  WITH CHECK (
    asesor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM perfiles
      WHERE id  = auth.uid()
        AND rol IN ('asesor', 'admin')
    )
  );

-- El asesor solo puede modificar sus propias propiedades
CREATE POLICY "propiedades: asesor actualiza las suyas"
  ON propiedades FOR UPDATE TO authenticated
  USING    (asesor_id = auth.uid())
  WITH CHECK (asesor_id = auth.uid());

-- El asesor solo puede eliminar sus propias propiedades
CREATE POLICY "propiedades: asesor elimina las suyas"
  ON propiedades FOR DELETE TO authenticated
  USING (asesor_id = auth.uid());


-- =============================================================
-- 8d. POLÍTICAS: interacciones_swipes
--
-- SEGURIDAD CRÍTICA:
--   • Un usuario NUNCA puede ver los swipes de otro usuario.
--   • Un asesor puede ver los swipes de SUS propiedades
--     (inteligencia de leads), pero NUNCA los swipes asociados
--     a propiedades de asesores competidores.
-- =============================================================

-- El usuario lee solo sus propios swipes
CREATE POLICY "swipes: usuario lee los suyos"
  ON interacciones_swipes FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

-- El asesor lee swipes de sus propiedades para análisis de leads.
-- La subquery valida que la propiedad pertenece al asesor autenticado.
CREATE POLICY "swipes: asesor lee leads de sus propiedades"
  ON interacciones_swipes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades
      WHERE propiedades.id        = interacciones_swipes.propiedad_id
        AND propiedades.asesor_id = auth.uid()
    )
  );

-- Un usuario solo puede registrar swipes a su nombre
CREATE POLICY "swipes: usuario inserta los suyos"
  ON interacciones_swipes FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Permite cambiar 'nope' → 'save', 'like' → 'save', etc.
CREATE POLICY "swipes: usuario actualiza los suyos"
  ON interacciones_swipes FOR UPDATE TO authenticated
  USING    (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "swipes: usuario elimina los suyos"
  ON interacciones_swipes FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());


-- =============================================================
-- 9. POLÍTICAS ADMIN (usa app_metadata — no editable por usuario)
-- =============================================================

CREATE POLICY "admin: leer todos los perfiles"
  ON perfiles FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol')::text = 'admin');

CREATE POLICY "admin: leer todas las propiedades"
  ON propiedades FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol')::text = 'admin');

CREATE POLICY "admin: leer todos los swipes"
  ON interacciones_swipes FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol')::text = 'admin');


-- =============================================================
-- 10. VISTAS ANALÍTICAS
--
-- security_invoker = true: la vista se ejecuta con los permisos
-- del usuario llamante, aplicando RLS normalmente.
--
-- kpis_asesores: un asesor ve SÓLO sus propios KPIs.
-- kpis_globales: el admin ve agregados de TODA la plataforma
--                (requiere la política admin de cada tabla).
-- =============================================================

CREATE VIEW kpis_asesores
  WITH (security_invoker = true)
AS
SELECT
  p.asesor_id,
  COUNT(DISTINCT p.id)                                                          AS total_propiedades,
  COUNT(sw.id) FILTER (WHERE sw.tipo_interaccion = 'like')                     AS total_likes,
  COUNT(sw.id) FILTER (WHERE sw.tipo_interaccion = 'save')                     AS total_saves,
  COUNT(DISTINCT sw.usuario_id)
    FILTER (WHERE sw.tipo_interaccion IN ('like', 'save'))                     AS total_leads
FROM propiedades p
LEFT JOIN interacciones_swipes sw ON sw.propiedad_id = p.id
GROUP BY p.asesor_id;

COMMENT ON VIEW kpis_asesores IS
  'KPIs por asesor: total de propiedades, likes, saves y leads únicos. '
  'Con security_invoker cada asesor ve únicamente sus propios datos vía RLS.';


CREATE VIEW kpis_globales
  WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*)          FROM propiedades
   WHERE activa = TRUE)                                                         AS propiedades_activas,
  (SELECT COUNT(*)          FROM perfiles
   WHERE rol = 'asesor')                                                        AS total_asesores,
  (SELECT COUNT(*)          FROM perfiles
   WHERE rol = 'usuario')                                                       AS total_usuarios,
  (SELECT COUNT(*)          FROM interacciones_swipes
   WHERE tipo_interaccion = 'like')                                             AS total_likes,
  (SELECT COUNT(*)          FROM interacciones_swipes
   WHERE tipo_interaccion = 'save')                                             AS total_saves,
  (SELECT COUNT(DISTINCT usuario_id) FROM interacciones_swipes
   WHERE tipo_interaccion IN ('like', 'save'))                                  AS total_leads;

COMMENT ON VIEW kpis_globales IS
  'Agregados globales de la plataforma. Sólo accesible por usuarios con '
  'app_metadata.rol = admin vía las políticas RLS de admin.';


-- =============================================================
-- 11. TABLA: citas
-- cliente_id: usuario que agenda
-- asesor_id:  asesor responsable de la visita
-- estado:     pendiente → confirmada | cancelada
-- =============================================================

CREATE TABLE citas (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id     UUID        NOT NULL REFERENCES perfiles(id)    ON DELETE CASCADE,
  asesor_id      UUID        NOT NULL REFERENCES perfiles(id)    ON DELETE CASCADE,
  propiedad_id   UUID        NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  fecha_cita     TIMESTAMPTZ NOT NULL,
  estado         TEXT        NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citas_cliente   ON citas(cliente_id);
CREATE INDEX idx_citas_asesor    ON citas(asesor_id);
CREATE INDEX idx_citas_propiedad ON citas(propiedad_id);
CREATE INDEX idx_citas_fecha     ON citas(fecha_cita);

CREATE TRIGGER trg_citas_ts
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_timestamp();

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Cliente ve sus propias citas
CREATE POLICY "citas: cliente lee las suyas"
  ON citas FOR SELECT TO authenticated
  USING (cliente_id = auth.uid());

-- Asesor ve citas en sus propiedades
CREATE POLICY "citas: asesor lee las suyas"
  ON citas FOR SELECT TO authenticated
  USING (asesor_id = auth.uid());

-- Cliente crea la cita a su nombre
CREATE POLICY "citas: cliente inserta"
  ON citas FOR INSERT TO authenticated
  WITH CHECK (cliente_id = auth.uid());

-- Asesor confirma / cancela
CREATE POLICY "citas: asesor actualiza estado"
  ON citas FOR UPDATE TO authenticated
  USING    (asesor_id = auth.uid())
  WITH CHECK (asesor_id = auth.uid());

-- Cliente puede cancelar su propia cita
CREATE POLICY "citas: cliente cancela"
  ON citas FOR UPDATE TO authenticated
  USING    (cliente_id = auth.uid())
  WITH CHECK (cliente_id = auth.uid());

-- Admin lee todo
CREATE POLICY "admin: leer todas las citas"
  ON citas FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'rol')::text = 'admin');

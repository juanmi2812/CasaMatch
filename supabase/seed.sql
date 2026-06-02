-- =============================================================
-- CasaMatch — Datos de prueba (desarrollo local)
-- Ejecutar: supabase db reset  (aplica migrations + seed)
-- =============================================================

-- Extensión necesaria para hashear contraseñas
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================
-- Usuarios de prueba en auth.users
-- =============================================================

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'asesor@casamatch.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"],"rol":"asesor"}',
    '{"nombre":"Marco Fernández"}'
  ),
  (
    'b0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'usuario@casamatch.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"],"rol":"usuario"}',
    '{"nombre":"Ana Torres"}'
  ),
  (
    'c0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin@casamatch.dev',
    crypt('Password123!', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"],"rol":"admin"}',
    '{"nombre":"Admin CasaMatch"}'
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- Perfiles (el trigger los crea automáticamente, pero se
-- insertan manualmente por si el seed corre sin triggers activos)
-- =============================================================

INSERT INTO public.perfiles (id, nombre, rol) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Marco Fernández',  'asesor'),
  ('b0000000-0000-0000-0000-000000000001', 'Ana Torres',       'usuario'),
  ('c0000000-0000-0000-0000-000000000001', 'Admin CasaMatch',  'admin')
ON CONFLICT (id) DO NOTHING;

-- Actualizar rol del admin en app_metadata para que las políticas RLS funcionen
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"rol":"admin"}'
WHERE id = 'c0000000-0000-0000-0000-000000000001';


-- =============================================================
-- Propiedades con URLs de video .mp4 para el componente Reels
-- Fuentes: Google CDN (gtv-videos-bucket) — públicas y sin CORS
-- =============================================================

INSERT INTO public.propiedades (
  id, asesor_id, titulo, descripcion, tipo, precio,
  ciudad, ubicacion, recamaras, banos, m2,
  caracteristicas_lifestyle, url_video, imagenes, activa, destacada
) VALUES
  (
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Casa Residencial en Juriquilla',
    'Amplia residencia en privada con jardín, alberca y acabados de lujo. Ideal para familia.',
    'casa',
    8500000,
    'Querétaro',
    'Juriquilla, Querétaro',
    4, 3.5, 320,
    '{"seguridad":5,"trafico":4,"vida_social":3,"tranquilidad":5,"plusvalia":4,"servicios_cercanos":4,"pet_friendly":true,"familias":true,"home_office":true}',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '{}',
    TRUE, TRUE
  ),
  (
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Loft Moderno en Polanco',
    'Loft minimalista con terraza privada y vista panorámica. Edificio con amenidades premium.',
    'departamento',
    5200000,
    'Ciudad de México',
    'Polanco, CDMX',
    1, 1, 85,
    '{"seguridad":5,"trafico":2,"vida_social":5,"tranquilidad":3,"plusvalia":5,"servicios_cercanos":5,"pet_friendly":false,"familias":false,"home_office":true}',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    '{}',
    TRUE, TRUE
  ),
  (
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Casa El Campanario',
    'Casa en fraccionamiento exclusivo con acceso controlado, áreas verdes y club de golf.',
    'casa',
    12000000,
    'Querétaro',
    'El Campanario, Querétaro',
    5, 4, 480,
    '{"seguridad":5,"trafico":5,"vida_social":4,"tranquilidad":5,"plusvalia":5,"servicios_cercanos":3,"pet_friendly":true,"familias":true,"home_office":false}',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    '{}',
    TRUE, FALSE
  ),
  (
    'p0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Penthouse Chapultepec',
    'Penthouse de ultra-lujo con rooftop privado y jacuzzi. Vistas inigualables al bosque.',
    'departamento',
    22000000,
    'Ciudad de México',
    'Chapultepec, CDMX',
    3, 3, 260,
    '{"seguridad":5,"trafico":2,"vida_social":5,"tranquilidad":4,"plusvalia":5,"servicios_cercanos":5,"pet_friendly":false,"familias":false,"home_office":true}',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '{}',
    TRUE, TRUE
  ),
  (
    'p0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Townhouse Santa Fe',
    'Townhouse de tres niveles en complejo cerrado. Perfecto para familias modernas.',
    'casa',
    7800000,
    'Ciudad de México',
    'Santa Fe, CDMX',
    3, 2.5, 195,
    '{"seguridad":4,"trafico":2,"vida_social":4,"tranquilidad":4,"plusvalia":4,"servicios_cercanos":5,"pet_friendly":true,"familias":true,"home_office":true}',
    'https://www.w3schools.com/html/mov_bbb.mp4',
    '{}',
    TRUE, FALSE
  )
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- Interacciones de prueba
-- =============================================================

INSERT INTO public.interacciones_swipes (usuario_id, propiedad_id, tipo_interaccion) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'like'),
  ('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'save'),
  ('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 'nope')
ON CONFLICT (usuario_id, propiedad_id) DO NOTHING;

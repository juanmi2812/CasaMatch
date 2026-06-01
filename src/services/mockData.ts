import type { CaracteristicasLifestyle, TipoPropiedad } from '../types/database'

export interface PropiedadMock {
  id:              string
  titulo:          string
  ubicacion:       string
  ciudad:          string
  precio:          number
  tipo:            TipoPropiedad
  recamaras:       number
  banos:           number
  m2:              number
  compatibilidad:  number   // 0–100
  gradientFrom:    string
  gradientTo:      string
  emoji:           string
  tags:            string[]
  caracteristicas: CaracteristicasLifestyle
}

export const MOCK_PROPERTIES: PropiedadMock[] = [
  {
    id:           '1',
    titulo:       'Residencia Moderna en Juriquilla',
    ubicacion:    'Juriquilla, Querétaro',
    ciudad:       'queretaro',
    precio:       4_500_000,
    tipo:         'casa',
    recamaras:    4,
    banos:        3,
    m2:           280,
    compatibilidad: 94,
    gradientFrom: '#C2714F',
    gradientTo:   '#7A3E28',
    emoji:        '🏡',
    tags:         ['Zona tranquila', 'Pet friendly', 'Alta plusvalía'],
    caracteristicas: {
      seguridad:          5,
      trafico:            4,
      vida_social:        3,
      tranquilidad:       5,
      plusvalia:          5,
      servicios_cercanos: 4,
      pet_friendly:       true,
      familias:           true,
      home_office:        false,
    },
  },
  {
    id:           '2',
    titulo:       'Departamento Loft en Polanco',
    ubicacion:    'Polanco, Ciudad de México',
    ciudad:       'cdmx',
    precio:       6_800_000,
    tipo:         'departamento',
    recamaras:    2,
    banos:        2,
    m2:           115,
    compatibilidad: 87,
    gradientFrom: '#5C6E4A',
    gradientTo:   '#2F3D24',
    emoji:        '🏙️',
    tags:         ['Vida social', 'Home office', 'Rooftop'],
    caracteristicas: {
      seguridad:          4,
      trafico:            2,
      vida_social:        5,
      tranquilidad:       2,
      plusvalia:          4,
      servicios_cercanos: 5,
      pet_friendly:       false,
      familias:           false,
      home_office:        true,
    },
  },
  {
    id:           '3',
    titulo:       'Casa Jardín en El Campanario',
    ubicacion:    'El Campanario, Querétaro',
    ciudad:       'queretaro',
    precio:       3_200_000,
    tipo:         'casa',
    recamaras:    3,
    banos:        2,
    m2:           220,
    compatibilidad: 91,
    gradientFrom: '#8B6E5A',
    gradientTo:   '#4A3328',
    emoji:        '🌿',
    tags:         ['Zona familiar', 'Jardín privado', 'Escuelas cerca'],
    caracteristicas: {
      seguridad:          5,
      trafico:            4,
      vida_social:        3,
      tranquilidad:       5,
      plusvalia:          4,
      servicios_cercanos: 4,
      pet_friendly:       true,
      familias:           true,
      home_office:        false,
    },
  },
  {
    id:           '4',
    titulo:       'Penthouse Vista Chapultepec',
    ubicacion:    'Lomas de Chapultepec, CDMX',
    ciudad:       'cdmx',
    precio:       12_500_000,
    tipo:         'departamento',
    recamaras:    3,
    banos:        3,
    m2:           195,
    compatibilidad: 79,
    gradientFrom: '#2C2C3E',
    gradientTo:   '#0F0F1A',
    emoji:        '🌆',
    tags:         ['Vista panorámica', 'Concierge 24h', 'Lujo'],
    caracteristicas: {
      seguridad:          5,
      trafico:            1,
      vida_social:        4,
      tranquilidad:       3,
      plusvalia:          5,
      servicios_cercanos: 5,
      pet_friendly:       true,
      familias:           false,
      home_office:        true,
    },
  },
  {
    id:           '5',
    titulo:       'Townhouse Contemporáneo en Santa Fe',
    ubicacion:    'Santa Fe, Ciudad de México',
    ciudad:       'cdmx',
    precio:       5_900_000,
    tipo:         'casa',
    recamaras:    3,
    banos:        3,
    m2:           180,
    compatibilidad: 83,
    gradientFrom: '#4A6080',
    gradientTo:   '#1F3248',
    emoji:        '🏘️',
    tags:         ['Roof garden', 'Seguridad 24h', 'Zona corporativa'],
    caracteristicas: {
      seguridad:          5,
      trafico:            2,
      vida_social:        4,
      tranquilidad:       3,
      plusvalia:          4,
      servicios_cercanos: 5,
      pet_friendly:       false,
      familias:           true,
      home_office:        true,
    },
  },
]

-- Tabla admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla clientes
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  puntos INTEGER DEFAULT 0,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla barberos
CREATE TABLE barberos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  estado VARCHAR(20) DEFAULT 'disponible',
  activo BOOLEAN DEFAULT true,
  foto TEXT,
  especialidad TEXT
);

-- Tabla citas
CREATE TABLE citas (
  id SERIAL PRIMARY KEY,
  barbero_id INTEGER REFERENCES barberos(id),
  cliente_id INTEGER REFERENCES clientes(id),
  tipo VARCHAR(20) DEFAULT 'agendada',
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  servicio TEXT,
  estado VARCHAR(20) DEFAULT 'confirmada',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla productos
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla notificaciones
CREATE TABLE notificaciones (
  id SERIAL PRIMARY KEY,
  cita_id INTEGER REFERENCES citas(id),
  tipo VARCHAR(50),
  respuesta VARCHAR(20),
  enviado_en TIMESTAMP DEFAULT NOW(),
  respondido_en TIMESTAMP
);

-- Tabla horario_semanal
CREATE TABLE horario_semanal (
  id SERIAL PRIMARY KEY,
  dia_semana INTEGER NOT NULL,
  abre TIME,
  cierra TIME,
  activo BOOLEAN DEFAULT true
);

-- Tabla horario_excepciones
CREATE TABLE horario_excepciones (
  id SERIAL PRIMARY KEY,
  fecha DATE UNIQUE NOT NULL,
  cerrado BOOLEAN DEFAULT false,
  abre TIME,
  cierra TIME
);

-- Índices para performance
CREATE INDEX idx_citas_fecha ON citas(fecha);
CREATE INDEX idx_citas_barbero_fecha ON citas(barbero_id, fecha);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
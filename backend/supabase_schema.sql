-- Strive Personal - Supabase Schema (Fase 1)
-- Este arquivo contém o schema inicial do banco de dados

-- ============================================================================
-- 1. TABELA: tenants (Multi-tenant - Personals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  cref VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  profile_image_url VARCHAR(500),
  
  -- White-label customization
  app_name VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#06B6D4',
  logo_url VARCHAR(500),
  
  -- Subscription
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, premium
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_cref CHECK (cref ~ '^[A-Z]{2}\d{4,6}$')
);

-- ============================================================================
-- 2. TABELA: alunos (Students)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Personal Information
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  data_nascimento DATE,
  genero VARCHAR(20),
  
  -- Physical Information
  altura_cm DECIMAL(5, 2),
  peso_kg DECIMAL(6, 2),
  objetivo TEXT,
  restricoes_medicas TEXT,
  
  -- Subscription
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  frequencia_semanal INT DEFAULT 3,
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, pausado
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABELA: exercicios (Exercises - Reusable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Exercise Details
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  grupo_muscular VARCHAR(100),
  instrucoes TEXT,
  video_url VARCHAR(500),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABELA: treinos (Workout Plans)
-- ============================================================================
CREATE TABLE IF NOT EXISTS treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  
  -- Workout Details
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  dia_semana VARCHAR(20), -- segunda, terça, etc
  status VARCHAR(50) DEFAULT 'ativo', -- ativo, arquivado
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA: exercicios_treino (Workout Exercises - Junction)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exercicios_treino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID NOT NULL REFERENCES treinos(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
  
  -- Exercise Configuration
  ordem INT NOT NULL,
  series INT DEFAULT 3,
  repeticoes INT,
  tempo_segundos INT,
  carga_kg DECIMAL(8, 2),
  intervalo_descanso_segundos INT DEFAULT 60,
  instrucoes_especificas TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. TABELA: avaliacoes_fisicas (Physical Assessments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  
  -- Measurements
  peso_kg DECIMAL(6, 2),
  altura_cm DECIMAL(5, 2),
  imc DECIMAL(5, 2),
  cintura_cm DECIMAL(6, 2),
  quadril_cm DECIMAL(6, 2),
  peito_cm DECIMAL(6, 2),
  braco_cm DECIMAL(6, 2),
  coxa_cm DECIMAL(6, 2),
  
  -- Body Fat
  dobra_triceps DECIMAL(5, 2),
  dobra_biceps DECIMAL(5, 2),
  dobra_subescapular DECIMAL(5, 2),
  dobra_suprailiaca DECIMAL(5, 2),
  percentual_gordura DECIMAL(5, 2),
  
  -- Photos
  foto_frente_url VARCHAR(500),
  foto_lado_url VARCHAR(500),
  foto_costas_url VARCHAR(500),
  
  -- Notes
  observacoes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Multi-tenant Isolation
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: tenants
-- ============================================================================
CREATE POLICY "Tenants can view their own tenant" ON tenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenants can update their own tenant" ON tenants
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES: alunos
-- ============================================================================
CREATE POLICY "Tenants can view their own students" ON alunos
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert students" ON alunos
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update their own students" ON alunos
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can delete their own students" ON alunos
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: exercicios
-- ============================================================================
CREATE POLICY "Tenants can view their own exercises" ON exercicios
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert exercises" ON exercicios
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update their own exercises" ON exercicios
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can delete their own exercises" ON exercicios
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: treinos
-- ============================================================================
CREATE POLICY "Tenants can view their own workouts" ON treinos
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert workouts" ON treinos
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update their own workouts" ON treinos
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can delete their own workouts" ON treinos
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: exercicios_treino
-- ============================================================================
CREATE POLICY "Tenants can view their workout exercises" ON exercicios_treino
  FOR SELECT USING (
    treino_id IN (
      SELECT id FROM treinos 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Tenants can insert workout exercises" ON exercicios_treino
  FOR INSERT WITH CHECK (
    treino_id IN (
      SELECT id FROM treinos 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Tenants can update their workout exercises" ON exercicios_treino
  FOR UPDATE USING (
    treino_id IN (
      SELECT id FROM treinos 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Tenants can delete their workout exercises" ON exercicios_treino
  FOR DELETE USING (
    treino_id IN (
      SELECT id FROM treinos 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: avaliacoes_fisicas
-- ============================================================================
CREATE POLICY "Tenants can view their assessments" ON avaliacoes_fisicas
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can insert assessments" ON avaliacoes_fisicas
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update their assessments" ON avaliacoes_fisicas
  FOR UPDATE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can delete their assessments" ON avaliacoes_fisicas
  FOR DELETE USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- INDEXES - Performance Optimization
-- ============================================================================
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_alunos_tenant_id ON alunos(tenant_id);
CREATE INDEX idx_alunos_status ON alunos(status);
CREATE INDEX idx_exercicios_tenant_id ON exercicios(tenant_id);
CREATE INDEX idx_treinos_tenant_id ON treinos(tenant_id);
CREATE INDEX idx_treinos_aluno_id ON treinos(aluno_id);
CREATE INDEX idx_exercicios_treino_treino_id ON exercicios_treino(treino_id);
CREATE INDEX idx_avaliacoes_tenant_id ON avaliacoes_fisicas(tenant_id);
CREATE INDEX idx_avaliacoes_aluno_id ON avaliacoes_fisicas(aluno_id);

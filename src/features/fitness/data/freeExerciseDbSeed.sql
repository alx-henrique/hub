-- =========================================================================
-- BANCO DE DADOS: FREE EXERCISE DB (yuhonas/free-exercise-db)
-- TRADUÇÃO E ESTRUTURAÇÃO PARA SUPABASE / POSTGRESQL (PT-BR)
-- =========================================================================

-- 1. Habilitar extensão pgcrypto para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DDL da Tabela 'exercicios'
CREATE TABLE IF NOT EXISTS public.exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    grupo_muscular_principal TEXT NOT NULL,
    grupos_musculares_secundarios TEXT[] DEFAULT '{}',
    equipamento TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'Força',
    instrucoes TEXT[] DEFAULT '{}',
    imagem_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo_principal ON public.exercicios (grupo_muscular_principal);
CREATE INDEX IF NOT EXISTS idx_exercicios_equipamento ON public.exercicios (equipamento);
CREATE INDEX IF NOT EXISTS idx_exercicios_nome ON public.exercicios USING gin (to_tsvector('portuguese', nome));

-- Habilitar RLS e permitir leitura pública
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública de exercícios" ON public.exercicios;
CREATE POLICY "Permitir leitura pública de exercícios" 
ON public.exercicios FOR SELECT 
USING (true);

-- =========================================================================
-- 3. SEED DOS 55+ EXERCÍCIOS MAIS POPULARES DO FREE EXERCISE DB EM PT-BR
-- =========================================================================

INSERT INTO public.exercicios (
    external_id, 
    nome, 
    grupo_muscular_principal, 
    grupos_musculares_secundarios, 
    equipamento, 
    categoria, 
    instrucoes, 
    imagem_url
) VALUES
-- LEVANTAMENTO TERRA & CADEIA POSTERIOR
(
    'Barbell_Deadlift',
    'Levantamento Terra Convencional com Barra',
    'Dorsal',
    ARRAY['Posterior de Coxa', 'Glúteos', 'Antebraços', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Posicione os pés na largura do quadril com a barra encostada nas canelas.',
        'Flexione os joelhos e segure a barra com pegada pronada ou mista um pouco mais larga que as pernas.',
        'Mantenha as costas neutras, peito aberto e escápulas aduzidas travando as axilas.',
        'Empurre o chão através dos calcanhares, estendendo quadril e joelhos simultaneamente.',
        'Trave o quadril no topo contraindo glúteos e dorsais sem hiperextender a lombar.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg'
),
(
    'Sumo_Deadlift',
    'Levantamento Terra Sumô com Barra',
    'Glúteos',
    ARRAY['Quadríceps', 'Posterior de Coxa', 'Dorsal', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Adote uma base bem aberta com as pontas dos pés viradas a 45 graus para fora.',
        'Segure a barra por dentro dos joelhos com as mãos alinhadas aos ombros.',
        'Mantenha o tronco mais ereto que no terra convencional e peito inflado.',
        'Empurre o chão focando na força dos calcanhares e adutores até estender totalmente o corpo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Sumo_Deadlift/0.jpg'
),
(
    'Romanian_Deadlift',
    'Levantamento Terra Romeno com Barra (RDL)',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Dorsal', 'Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Inicie em pé segurando a barra na altura dos quadris.',
        'Com leve microflexão nos joelhos, jogue o quadril para trás enquanto desce a barra rente às pernas.',
        'Desça até sentir forte tensão nos posteriores (logo abaixo dos joelhos).',
        'Retorne à posição inicial projetando os quadris para frente e contraindo os glúteos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg'
),
(
    'Romanian_Deadlift_with_Dumbbells',
    'Levantamento Terra Romeno com Halteres',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Dorsal']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Segure um par de halteres à frente das coxas com pegada pronada.',
        'Projete o quadril para trás mantendo as escápulas recolhidas e coluna neutra.',
        'Desça os halteres rentes às canelas até a altura média da tíbia.',
        'Suba empurrando o chão e apertando os glúteos no ponto mais alto.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift_with_Dumbbells/0.jpg'
),
(
    'Trap_Bar_Deadlift',
    'Levantamento Terra com Trap Bar (Barra Hexagonal)',
    'Quadríceps',
    ARRAY['Dorsal', 'Glúteos', 'Posterior de Coxa', 'Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Fique de pé no centro da barra hexagonal e segure as manoplas neutras.',
        'Abaixe os quadris mantendo a coluna em posição neutra e o peito estufado.',
        'Empurre o solo com força equilibrada entre pernas e tronco até a posição ereta.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Trap_Bar_Deadlift/0.jpg'
),
(
    'Stiff-Legged_Barbell_Deadlift',
    'Stiff com Barra (Stiff-Leg Deadlift)',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Dorsal']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Pés na largura do quadril, joelhos praticamente estendidos com mínima folga articular.',
        'Incline o tronco à frente descendo a barra verticalmente em direção aos pés.',
        'Foco absoluto no alongamento da cadeia posterior sem curvar as costas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Stiff-Legged_Barbell_Deadlift/0.jpg'
),
(
    'Good_Morning',
    'Bom Dia com Barra',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Dorsal']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Apoie a barra sobre os trapézios como na posição de agachamento.',
        'Dobre os quadris empurrando o bumbum para trás até o tronco ficar quase paralelo ao chão.',
        'Retorne estendendo o quadril de forma controlada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Good_Morning/0.jpg'
),
-- PEITORAL
(
    'Barbell_Bench_Press',
    'Supino Reto com Barra',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Deite no banco reto, apoie firmemente os pés no chão e faça a retração escapular.',
        'Segure a barra com uma pegada um pouco mais larga que a largura dos ombros.',
        'Retire a barra do suporte e desça de forma controlada até o terço inferior do osso esterno.',
        'Empurre a barra para cima estendendo os cotovelos sem soltar as escápulas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press/0.jpg'
),
(
    'Dumbbell_Bench_Press',
    'Supino Reto com Halteres',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Sente-se na ponta do banco e deite-se trazendo os halteres na linha do peito.',
        'Cotovelos a cerca de 60 a 70 graus do corpo para preservar os ombros.',
        'Empurre os halteres para cima em trajetória convergente sem bater no topo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Bench_Press/0.jpg'
),
(
    'Barbell_Incline_Bench_Press',
    'Supino Inclinado com Barra',
    'Peitoral',
    ARRAY['Deltoides', 'Tríceps']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Posicione o banco inclinado entre 30 e 45 graus.',
        'Desça a barra controladamente em direção à parte superior do peito/clavícula.',
        'Empurre para cima focando na ativação da porção clavicular do peitoral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press/0.jpg'
),
(
    'Incline_Dumbbell_Press',
    'Supino Inclinado com Halteres',
    'Peitoral',
    ARRAY['Deltoides', 'Tríceps']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Deite no banco inclinado segurando os halteres com as palmas voltadas para a frente.',
        'Desça até obter alongamento do peitoral superior.',
        'Empurre para cima com cadência controlada concentrando a força no peito.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg'
),
(
    'Decline_Barbell_Bench_Press',
    'Supino Declinado com Barra',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Prenda as pernas na extremidade do banco declinado.',
        'Desça a barra em direção à porção inferior do peitoral.',
        'Empurre estendendo os braços com estabilidade.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg'
),
(
    'Dumbbell_Flyes',
    'Crucifixo Reto com Halteres',
    'Peitoral',
    ARRAY['Deltoides']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Deite no banco reto com os halteres estendidos acima do peito.',
        'Mantenha os cotovelos levemente flexionados e abra os braços em arco lateral.',
        'Sinta o alongamento da fáscia do peitoral e retorne abraçando um cilindro no centro.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg'
),
(
    'Cable_Crossover',
    'Crossover na Polia',
    'Peitoral',
    ARRAY['Deltoides']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Posicione as polias na parte alta e dê um passo à frente com tronco levemente inclinado.',
        'Puxe as manoplas para a frente e para baixo convergindo as mãos na altura da cintura.',
        'Contraia o peitoral com máxima tensão isométrica no final do curso.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg'
),
(
    'Dips_Chest_Version',
    'Paralelas com Foco em Peitoral',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Apoie-se nas barras paralelas inclinando o tronco cerca de 30 graus para frente.',
        'Desça até os cotovelos formarem um ângulo de 90 graus abrindo levemente os braços.',
        'Empurre de volta com foco na contração peitoral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_Chest_Version/0.jpg'
),
(
    'Pushups',
    'Flexão de Braços no Solo (Push-Up)',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides', 'Abdômen']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Em prancha com as mãos na largura dos ombros e corpo alinhado.',
        'Flexione os cotovelos descendo até o peito quase tocar o solo.',
        'Empurre o chão mantendo o abdômen e os glúteos contraídos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg'
),
-- COSTAS & DORSAIS
(
    'Barbell_Bent_Over_Row',
    'Remada Curvada com Barra',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Incline o tronco para a frente a cerca de 45 graus com as costas retas.',
        'Segure a barra com pegada pronada ou supinada na largura dos ombros.',
        'Puxe a barra em direção ao umbigo direcionando os cotovelos para trás.',
        'Aperte as escápulas no topo e desça controladamente até alongar os braços.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bent_Over_Row/0.jpg'
),
(
    'One-Arm_Dumbbell_Row',
    'Remada Unilateral com Halter (Serrote)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Apoie o joelho e a mão contrária sobre o banco mantendo a coluna plana.',
        'Segure o halter com o braço estendido apontando para o chão.',
        'Puxe o peso em direção ao quadril puxando pelo cotovelo sem girar o tronco.',
        'Desça controlando a carga até alongar totalmente o grande dorsal.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg'
),
(
    'Pullups',
    'Barra Fixa Pronada (Pull-Up)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços', 'Abdômen']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Pendure-se na barra com as palmas voltadas para a frente mais largas que os ombros.',
        'Puxe o peito em direção à barra até o queixo ultrapassar o nível dos punhos.',
        'Desça controladamente até os braços ficarem completamente estendidos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg'
),
(
    'Chin-Up',
    'Barra Fixa Supinada (Chin-Up)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Segure a barra com as palmas voltadas para você na largura dos ombros.',
        'Puxe com força dos dorsais e bíceps até o queixo passar da barra.',
        'Desça de maneira cadenciada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin-Up/0.jpg'
),
(
    'Wide-Grip_Lat_Pulldown',
    'Puxada Alta Aberta no Pulley',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Sente-se no aparelho e ajuste a almofada para travar as coxas.',
        'Segure a barra com pegada bem aberta e peito estufado.',
        'Puxe a barra em direção à parte superior do esterno levando os cotovelos para baixo e para trás.',
        'Retorne alongando a dorsal sem balançar o corpo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg'
),
(
    'Seated_Cable_Rows',
    'Remada Baixa Sentada na Polia com Triângulo',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Apoie os pés na plataforma com joelhos ligeiramente destravados.',
        'Segure a manopla triângulo mantendo a coluna ereta e abdômen firme.',
        'Puxe em direção ao abdômen aproximando as escápulas no final do percurso.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg'
),
-- OMBROS & DELTOIDES
(
    'Standing_Military_Press',
    'Desenvolvimento Militar em Pé com Barra',
    'Deltoides',
    ARRAY['Tríceps', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Em pé com pés na largura dos ombros, segure a barra apoiada na altura das clavículas.',
        'Contraia os glúteos e o core para criar uma base sólida.',
        'Empurre a barra verticalmente para cima da cabeça, projetando o queixo levemente à frente no topo.',
        'Desça de maneira controlada de volta à posição de partida.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Military_Press/0.jpg'
),
(
    'Dumbbell_Shoulder_Press',
    'Desenvolvimento com Halteres Sentado',
    'Deltoides',
    ARRAY['Tríceps']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Sente-se no banco com encosto reto segurando os halteres na altura dos ombros.',
        'Empurre os halteres para cima até os braços quase estenderem por completo.',
        'Desça com cadência até a altura dos queixos/orelhas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Shoulder_Press/0.jpg'
),
(
    'Arnold_Dumbbell_Press',
    'Desenvolvimento Arnold com Halteres',
    'Deltoides',
    ARRAY['Tríceps']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Inicie com os halteres na altura do queixo e as palmas voltadas para você.',
        'Gire os punhos para fora conforme empurra o peso acima da cabeça.',
        'No topo, as palmas ficam viradas para a frente. Reverta o movimento na descida.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg'
),
(
    'Side_Lateral_Raise',
    'Elevação Lateral com Halteres',
    'Deltoides',
    ARRAY[]::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Em pé com leve inclinação do tronco para a frente e cotovelos semiflexionados.',
        'Eleve os braços lateralmente até que fiquem paralelos ao solo na altura dos ombros.',
        'Desça devagar sem deixar os halteres colidirem na frente do corpo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg'
),
(
    'Cable_Lateral_Raise',
    'Elevação Lateral na Polia',
    'Deltoides',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Ajuste o cabo na altura mais baixa segurando com a mão oposta ao aparelho.',
        'Puxe a manopla lateralmente até a linha do ombro mantendo tensão contínua.',
        'Retorne de forma lenta resistindo ao peso da máquina.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Lateral_Raise/0.jpg'
),
(
    'Face_Pull',
    'Face Pull com Corda na Polia Alta',
    'Deltoides',
    ARRAY['Dorsal', 'Trapézio']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Ajuste a corda na polia alta na altura dos olhos.',
        'Puxe a corda em direção ao rosto abrindo as mãos e rodando os ombros externamente.',
        'Contraia os deltoides posteriores e trapézio médio no pico do movimento.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg'
),
-- QUADRÍCEPS & PERNAS
(
    'Barbell_Full_Squat',
    'Agachamento Livre com Barra',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Apoie a barra firme sobre os trapézios, pés na largura dos ombros com pontas ligeiramente abertas.',
        'Desça flexionando quadril e joelhos mantendo o peito erguido até quebrar o paralelo (90 graus).',
        'Empurre pelos calcanhares mantendo os joelhos alinhados com as pontas dos pés até ficar em pé.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Full_Squat/0.jpg'
),
(
    'Front_Barbell_Squat',
    'Agachamento Frontal com Barra',
    'Quadríceps',
    ARRAY['Glúteos', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Apoie a barra sobre a parte frontal dos ombros com cotovelos altos apontando para a frente.',
        'Agache com o tronco extremamente vertical para focar no quadríceps.',
        'Suba empurrando o chão com firmeza.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Barbell_Squat/0.jpg'
),
(
    'Leg_Press',
    'Leg Press 45 Graus',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Sente-se com as costas e a lombar completamente apoiadas no encosto.',
        'Coloque os pés na plataforma na largura dos ombros.',
        'Destrave a máquina e desça a plataforma até 90 graus sem arredondar a lombar.',
        'Empurre de volta sem hiperestender os joelhos no topo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg'
),
(
    'Hack_Squat',
    'Agachamento Hack na Máquina',
    'Quadríceps',
    ARRAY['Glúteos']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Posicione as costas e ombros firmemente nas almofadas do aparelho.',
        'Agache profundamente com estabilização guiada da coluna.',
        'Empurre a plataforma de volta à posição inicial.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg'
),
(
    'Leg_Extensions',
    'Cadeira Extensora',
    'Quadríceps',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Ajuste o encosto e a almofada sobre a parte inferior das canelas.',
        'Estenda os joelhos até a contração total segurando 1 segundo no topo.',
        'Desça controladamente resistindo ao peso da máquina.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg'
),
-- POSTERIORES & GLÚTEOS
(
    'Lying_Leg_Curls',
    'Mesa Flexora Deitada',
    'Posterior de Coxa',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Deite de bruços no aparelho com a almofada apoiada na parte de trás dos tornozelos.',
        'Flexione os joelhos trazendo os calcanhares em direção aos glúteos sem levantar a bacia.',
        'Retorne lentamente até quase estender as pernas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg'
),
(
    'Seated_Leg_Curl',
    'Cadeira Flexora Sentada',
    'Posterior de Coxa',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Sente-se com as costas apoiadas e a coxa travada pela almofada superior.',
        'Flexione as pernas para baixo contraindo os posteriores de coxa.',
        'Controle a subida para garantir tensão excêntrica profunda.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Leg_Curl/0.jpg'
),
(
    'Barbell_Hip_Thrust',
    'Elevação Pélvica com Barra (Hip Thrust)',
    'Glúteos',
    ARRAY['Posterior de Coxa', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Apoie a parte superior das costas em um banco estável com a barra acolchoada sobre o quadril.',
        'Pés no chão na largura dos ombros e joelhos flexionados a 90 graus no topo.',
        'Eleve os quadris empurrando pelos calcanhares até o corpo formar uma linha reta dos ombros aos joelhos.',
        'Aperte com força máxima os glúteos no ponto mais alto por 1 segundo antes de descer.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg'
),
-- BRAÇOS (BÍCEPS & TRÍCEPS)
(
    'Barbell_Curl',
    'Rosca Direta com Barra',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Em pé com as costas retas, segure a barra com pegada supinada na largura dos ombros.',
        'Mantenha os cotovelos colados ao lado do corpo.',
        'Flexione os braços levantando a barra em direção aos ombros sem balançar o tronco.',
        'Desça a barra controladamente até a extensão completa dos cotovelos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg'
),
(
    'Hammer_Curls',
    'Rosca Martelo com Halteres',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Segure os halteres com pegada neutra (palmas viradas uma para a outra).',
        'Flexione os braços mantendo as palmas sempre voltadas para dentro.',
        'Excelente para desenvolvimento do músculo braquial e antebraço.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg'
),
(
    'Preacher_Curl',
    'Rosca Scott com Barra W',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Apoie os braços na almofada inclinada do banco Scott com as axilas encaixadas.',
        'Flexione a barra W até a altura dos queixos isolando o bíceps de qualquer impulso corporal.',
        'Desça controladamente sem hiperestender abruptamente os cotovelos no final.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg'
),
(
    'Triceps_Pushdown',
    'Tríceps Pulley com Barra na Polia',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Em pé de frente para a polia alta, segure a barra com pegada pronada na largura dos ombros.',
        'Mantenha os cotovelos colados nas costelas.',
        'Empurre a barra para baixo estendendo os braços por completo.',
        'Retorne até formar um ângulo de 90 graus nos cotovelos sem descolá-los do tronco.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg'
),
(
    'Triceps_Pushdown_Rope_Attachment',
    'Tríceps Pulley com Corda na Polia',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Segure as pontas da corda na polia alta.',
        'Empurre para baixo e abra as pontas da corda para fora no final do movimento para contração máxima da cabeça lateral.',
        'Suba controlando o peso.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown_Rope_Attachment/0.jpg'
),
(
    'Lying_Triceps_Press',
    'Tríceps Testa com Barra W (Skull Crusher)',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Deite no banco reto segurando a barra W com os braços estendidos acima do peito.',
        'Mantendo os cotovelos fixos apontando para o teto, flexione os antebraços descendo a barra em direção à testa.',
        'Empurre a barra estendendo os cotovelos de volta à posição inicial.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Triceps_Press/0.jpg'
),
(
    'Standing_Calf_Raises',
    'Elevação de Panturrilha em Pé na Máquina',
    'Panturrilhas',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Apoie as pontas dos pés na borda da plataforma com ombros sob as almofadas.',
        'Desça os calcanhares ao máximo sentindo o alongamento da fáscia.',
        'Suba na ponta máxima dos pés e segure a contração por 1 segundo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg'
),
(
    'Ab_Roller',
    'Roda Abdominal no Solo (Ab Wheel Roller)',
    'Abdômen',
    ARRAY['Dorsal', 'Deltoides']::TEXT[],
    'Outro',
    'Força',
    ARRAY[
        'Ajoelhe-se no chão segurando as manoplas da roda abdominal.',
        'Role para a frente estendendo o tronco o mais longe possível mantendo a coluna em leve curvatura protetora.',
        'Puxe com força do abdômen para retornar à posição inicial.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Roller/0.jpg'
),
(
    'Hanging_Leg_Raise',
    'Elevação de Pernas na Barra Fixa',
    'Abdômen',
    ARRAY['Antebraços']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Pendure-se na barra fixa com pegada pronada.',
        'Mantendo as pernas estendidas ou semiflexionadas, eleve os pés até a altura do quadril ou da barra.',
        'Desça sem balançar o corpo controlando o retorno do movimento.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg'
),
(
    'Plank',
    'Prancha Isométrica no Solo',
    'Abdômen',
    ARRAY['Deltoides', 'Glúteos']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Apoie os antebraços e as pontas dos pés no chão.',
        'Mantenha o corpo em linha reta da cabeça aos calcanhares.',
        'Contraia o abdômen e os glúteos de forma constante respirando ritmicamente durante todo o tempo estipulado.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg'
),

-- -------------------------------------------------------------------------
-- EXERCÍCIOS DE HIPERTROFIA CIENTÍFICA & SUBSTITUIÇÕES (JEFF NIPPARD / RP)
-- -------------------------------------------------------------------------
(
    'Low_Incline_Dumbbell_Press',
    'Supino Inclinado com Halteres em Ângulo Baixo (15°-30°)',
    'Peitoral',
    ARRAY['Deltoides', 'Tríceps']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Ajuste o banco em inclinação moderada de 15° a 30° para foco na porção clavicular do peitoral.',
        'Mantenha as escápulas aduzidas e desça os halteres em amplitude total sentindo estiramento profundo.',
        'Empurre convergindo no topo mantendo tensão mecânica ininterrupta.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg'
),
(
    'Low_Incline_Machine_Press',
    'Supino Inclinado na Máquina Articulada',
    'Peitoral',
    ARRAY['Deltoides', 'Tríceps']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Ajuste o assento para que as manoplas fiquem na linha superior do peito.',
        'Estabilidade máxima sem necessidade de equilíbrio dos halteres, permitindo treinar próximo à falha com segurança.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Chest_Press_Machine/0.jpg'
),
(
    'Incline_Smith_Press_30',
    'Supino Inclinado no Smith Machine a 30°',
    'Peitoral',
    ARRAY['Deltoides', 'Tríceps']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Centralize o banco sob a barra guiada do Smith a 30 graus.',
        'Desça a barra controladamente rente à clavícula com cotovelos em ângulo anatômico confortável.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Smith_Machine_Incline_Bench_Press/0.jpg'
),
(
    'Converging_Chest_Press_Machine',
    'Supino Reto na Máquina Convergente Articulada',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Trajetória convergente que acompanha o vetor natural de adução horizontal das fibras peitorais.',
        'Aperte o peitoral no ponto de pico de contração.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chest_Press_Machine/0.jpg'
),
(
    'Chest_Dips_Weighted',
    'Paralelas com Tronco Inclinado para Peitoral (com Carga)',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Incline o tronco para a frente a cerca de 30 graus e afaste levemente os cotovelos.',
        'Desça até 90 graus de flexão de cotovelos e suba empurrando com as porções inferiores e médias do peitoral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chest_Dip/0.jpg'
),
(
    'High_To_Low_Cable_Fly',
    'Crossover na Polia Alta para Baixo (Foco Peitoral Inferior)',
    'Peitoral',
    ARRAY['Deltoides']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Polias no ponto mais alto. Dê um passo à frente com base firme.',
        'Puxe os cabos de cima para baixo em direção à pelve, contraindo o peitoral com máxima tensão.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg'
),
(
    'Low_To_High_Cable_Fly',
    'Crossover na Polia Baixa para Cima (Foco Peitoral Clavicular)',
    'Peitoral',
    ARRAY['Deltoides']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Polias na posição mais baixa. Puxe os cabos em arco ascendente até a linha do queixo.',
        'Foco de sobrecarga na porção superior do peitoral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Low_Cable_Crossover/0.jpg'
),
(
    'Seated_Cable_Chest_Fly',
    'Crucifixo Sentado no Cabo com Apoio Lombar',
    'Peitoral',
    ARRAY['Deltoides']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'O banco com encosto vertical anula oscilações corporais.',
        'Mantenha os cotovelos com leve flexão fixa e execute adução ampla.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Fly/0.jpg'
),
(
    'Spoto_Press_Barbell',
    'Supino Spoto com Pausa a 2cm do Peito',
    'Peitoral',
    ARRAY['Tríceps', 'Deltoides']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Desça a barra até 2 a 3cm do peitoral, segure estritamente no ar por 1 segundo e exploda para cima.',
        'Elimina o reflexo elástico e constrói força pura de partida.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press/0.jpg'
),
(
    'Constant_Tension_Lateral_Raise',
    'Elevação Lateral com Tensão Contínua com Halteres',
    'Deltoides',
    ARRAY['Trapézio']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Eleve os halteres no plano escapular até a altura dos ombros.',
        'Interrompa a descida a 25 graus do corpo antes que os halteres descansem, mantendo o deltoide sob tensão ininterrupta.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lateral_Raise/0.jpg'
),
(
    'Cross_Body_Cable_Y_Raise',
    'Elevação em Y Cruzada na Polia (Cross-Body Y-Raise)',
    'Deltoides',
    ARRAY['Trapézio']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Polia na altura do quadril, segurando os cabos cruzados pelas pontas.',
        'Puxe os braços na diagonal formando um Y acima da cabeça, alinhando a resistência com as fibras do deltoide lateral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Lateral_Raise/0.jpg'
),
(
    'Egyptian_Cable_Lateral_Raise',
    'Elevação Lateral Egípcia Inclinada na Polia',
    'Deltoides',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Segure na barra da polia e incline o tronco lateralmente a 20 graus.',
        'Puxe o cabo com o braço oposto, transferindo maior tensão mecânica para a posição mais encurtada do ombro.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Lateral_Raise/0.jpg'
),
(
    'Seated_Dumbbell_Lateral_Raise',
    'Elevação Lateral Sentado no Banco Reto com Halteres',
    'Deltoides',
    ARRAY[]::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Sentado com tronco imóvel, eliminando completamente qualquer embalo dos membros inferiores.',
        'Suba guiando pelos cotovelos com cadência controlada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lateral_Raise/0.jpg'
),
(
    'Chest_Supported_Rear_Delt_Row',
    'Remada Aberta Apoiada no Peito para Deltoide Posterior',
    'Deltoides',
    ARRAY['Dorsal', 'Trapézio']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Deite em decúbito ventral no banco inclinado a 45 graus.',
        'Puxe com os cotovelos bem abertos a 90 graus do tronco focando exclusivamente nas fibras posteriores do ombro.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Row/0.jpg'
),
(
    'Face_Pull_External_Rotation',
    'Face Pull na Polia Alta com Rotação Externa',
    'Deltoides',
    ARRAY['Dorsal', 'Trapézio']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Puxe a corda em direção aos olhos e termine girando os punhos para trás com os polegares apontando para trás.',
        'Excelente para saúde dos rotadores de ombro e hipertrofia do deltoide posterior.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg'
),
(
    'Landmine_Overhead_Press',
    'Desenvolvimento Landmine Unilateral com Barra',
    'Deltoides',
    ARRAY['Tríceps', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Empurre a ponta da barra na diagonal ascendente com tronco firme.',
        'Trajetória natural que acomoda perfeitamente a articulação glenoumeral sem atrito.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Landmine_Press/0.jpg'
),
(
    'Bayesian_Cable_Curl',
    'Rosca Bayesian no Cabo (Polia por Trás das Costas)',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Posicione a polia baixa, segure a manopla e dê dois passos para frente com o braço em extensão atrás do tronco.',
        'Estiramento máximo na cabeça longa do bíceps sob tensão constante de cabo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Curl/0.jpg'
),
(
    'Behind_Back_Cable_Curl',
    'Rosca Bíceps na Polia Baixa por Trás do Tronco Unilateral',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Mesmo perfil de ativação estirada com excelente isolamento unilateral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Curl/0.jpg'
),
(
    'Cross_Body_Hammer_Curl',
    'Rosca Martelo Cruzada no Peito com Halteres',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Segure o halter em pegada neutra e suba cruzando na frente do peito em direção ao ombro oposto.',
        'Recruta maciçamente o músculo braquial profundo, aumentando a largura do braço.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg'
),
(
    'Rope_Cable_Hammer_Curl',
    'Rosca Martelo na Polia Baixa com Corda',
    'Bíceps',
    ARRAY['Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Pegada neutra na corda, puxando com cotovelos colados ao tronco e afastando levemente no topo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Hammer_Curls_Rope/0.jpg'
),
(
    'Katana_Triceps_Extension',
    'Extensão de Tríceps Katana Bilateral na Polia Alta',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Cabos cruzados na altura do ombro com braços posicionados acima da cabeça.',
        'Estenda os cotovelos em diagonal para fora, alongando a cabeça longa do tríceps em máxima amplitude hipertrófica.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Triceps_Extension/0.jpg'
),
(
    'Single_Arm_Cross_Cable_Triceps',
    'Extensão de Tríceps Cruzada Unilateral na Polia',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Polia alta sem pegador, braço cruzado em frente ao peitoral.',
        'Estenda o braço para baixo e para o lado com isolamento absoluto do tríceps lateral e medial.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Triceps_Extension/0.jpg'
),
(
    'JM_Press_Barbell',
    'JM Press com Barra Olímpica (Híbrido Supino e Testa)',
    'Tríceps',
    ARRAY['Peitoral', 'Deltoides']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Deite no banco e posicione as mãos na largura dos ombros.',
        'Desça a barra em direção ao pescoço dobrando os cotovelos para frente e empurre com carga pesada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press/0.jpg'
),
(
    'Overhead_Cable_Rope_Triceps',
    'Tríceps Francês na Polia Alta com Corda e Afastamento',
    'Tríceps',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Tronco inclinado a 45 graus para frente, estendendo a corda além da cabeça.',
        'Abra a corda no final da extensão para contração total da cabeça longa.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Overhead_Triceps_Extension/0.jpg'
),
(
    'High_Bar_Box_Squat',
    'Agachamento no Caixote com Barra Alta (Box Squat)',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Caixote na altura paralela. Desça mantendo o tronco ereto e apoie no caixote por 1 segundo sem relaxar o abdômen.',
        'Exploda a subida quebrando a inércia, ensinando profundidade consistente.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg'
),
(
    'Low_Bar_Back_Squat',
    'Agachamento Livre com Barra Baixa Powerlifting (Low-Bar)',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa', 'Dorsal']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Barra apoiada sobre os deltoides posteriores com tronco mais inclinado à frente.',
        'Maior alavanca para os glúteos e cadeia posterior permitindo erguer maiores cargas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg'
),
(
    'Reverse_Hack_Squat',
    'Agachamento Hack Invertido na Máquina',
    'Glúteos',
    ARRAY['Posterior de Coxa', 'Quadríceps']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Posicione-se virado de frente para o apoio do Hack Squat.',
        'Agache projetando os glúteos para trás com flexão profunda de quadril.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg'
),
(
    'Reverse_Nordic_Curl',
    'Flexão Nórdica Reversa no Solo (Reto Femoral)',
    'Quadríceps',
    ARRAY['Abdômen']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Ajoelhado em colchonete com quadril estendido. Incline o corpo para trás dobrando apenas os joelhos.',
        'Tensão brutal no reto femoral em comprimento muscular alongado.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bodyweight_Squat/0.jpg'
),
(
    'Swiss_Ball_Hamstring_Curl',
    'Flexão de Pernas na Bola Suíça para Posteriores',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Abdômen']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Deite no solo com calcanhares na bola suíça e quadril suspenso.',
        'Puxe a bola flexionando os joelhos e mantendo o quadril alto.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ball_Hamstring_Curl/0.jpg'
),
(
    'Single_Leg_RDL_Dumbbell',
    'Levantamento Terra Romeno Unilateral com Halter (Single-Leg RDL)',
    'Posterior de Coxa',
    ARRAY['Glúteos', 'Abdômen']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Equilibre em uma perna segurando o halter na mão oposta.',
        'Incline o tronco à frente enquanto a perna de trás sobe reta em contrapeso.',
        'Foco extremo no estiramento do posterior e estabilidade da pelve.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single_Leg_Deadlift/0.jpg'
),
(
    'Trap_Bar_Deadlift',
    'Levantamento Terra com Barra Hexagonal (Trap Bar Deadlift)',
    'Dorsal',
    ARRAY['Quadríceps', 'Glúteos', 'Posterior de Coxa', 'Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Fique de pé no centro da barra hexagonal com pegada neutra.',
        'Empurre o chão distribuindo carga de forma mais amigável para a coluna vertebral.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Trap_Bar_Deadlift/0.jpg'
),
(
    'Deficit_Deadlift',
    'Levantamento Terra com Déficit de 5cm sobre Plataforma',
    'Dorsal',
    ARRAY['Posterior de Coxa', 'Glúteos', 'Quadríceps']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Suba sobre uma anilha ou bloco para aumentar o percurso inicial.',
        'Constrói força violenta de saída da barra do solo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg'
),
(
    'Snatch_Grip_Deadlift',
    'Levantamento Terra com Pegada Aberta (Snatch-Grip Deadlift)',
    'Dorsal',
    ARRAY['Trapézio', 'Posterior de Coxa', 'Glúteos']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Pegada bem aberta na barra olímpica exigindo agachamento mais profundo.',
        'Ativação intensa de toda a cadeia posterior e trapézio superior.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg'
),
(
    'Cable_Pull_Through',
    'Puxada de Quadril na Polia entre as Pernas (Cable Pull-Through)',
    'Glúteos',
    ARRAY['Posterior de Coxa', 'Abdômen']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'De costas para a polia baixa, segure a corda por entre as pernas e dê um passo à frente.',
        'Jogue o quadril para trás e exploda para frente contraindo os glúteos no topo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Pull_Through/0.jpg'
),
(
    'Neutral_Grip_Lat_Pulldown',
    'Puxada Alta com Pegada Neutra Fechada (Mag Grip / Triângulo)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Puxe a barra em direção ao peitoral com pegada neutra e cotovelos alinhados com o tronco.',
        'Recrutamento perfeito do grande dorsal sem desconforto no ombro.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/V-Bar_Pulldown/0.jpg'
),
(
    'Half_Kneeling_Lat_Pulldown',
    'Puxada Unilateral Semi-Ajoelhado na Polia',
    'Dorsal',
    ARRAY['Bíceps', 'Abdômen']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Ajoelhe-se em um joelho em frente ao cross.',
        'Puxe a manopla puxando o cotovelo rente à cintura com amplitude total.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_One_Arm_Pulldown/0.jpg'
),
(
    'Omni_Grip_Pull_Up',
    'Barra Fixa Multi-Pegada (Pronada, Neutra e Supinada)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços', 'Abdômen']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Alterne entre as diferentes pegadas para estímulo variado de costas e braços.',
        'Suba até o queixo ultrapassar a barra de forma controlada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pull-up/0.jpg'
),
(
    'Chest_Supported_T_Bar_Row',
    'Remada Cavalinho Articulada com Apoio no Peito (T-Bar)',
    'Dorsal',
    ARRAY['Bíceps', 'Trapézio']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Peito colado no encosto tirando o estresse da lombar.',
        'Puxe com força dorsal e aperte as escápulas no ápice da remada.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row/0.jpg'
),
(
    'Helms_Row_Incline',
    'Remada Helms com Halteres no Banco Inclinado 45°',
    'Dorsal',
    ARRAY['Bíceps', 'Deltoides', 'Trapézio']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Apoie a parte alta do tórax na ponta do banco inclinado.',
        'Remada estrita com halteres sem nenhuma trapaça lombar.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Row/0.jpg'
),
(
    'Kelso_Shrug_Bench',
    'Encolhimento Kelso com Halteres no Banco Inclinado (Trapézio Médio)',
    'Dorsal',
    ARRAY['Trapézio']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Deitado de bruços no banco inclinado.',
        'Cotovelos retos, realize retração pura das escápulas aproximando-as por 2 segundos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Row/0.jpg'
),
(
    'Seal_Row_Bench',
    'Remada Seal no Banco Reto Elevado com Barra',
    'Dorsal',
    ARRAY['Bíceps', 'Trapézio']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Deite de bruços no banco reto elevado horizontal.',
        'Puxe a barra até encostar na parte de baixo do banco.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Row/0.jpg'
),
(
    'Meadows_Row_Landmine',
    'Remada Meadows com Barra no Landmine (Pegada na Ponta)',
    'Dorsal',
    ARRAY['Bíceps', 'Antebraços']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'De pé perpendicular à barra, segure na ponta e puxe o cotovelo para trás e para cima.',
        'Foco de elite para grande dorsal e redondo maior.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row/0.jpg'
),
(
    'Cross_Body_Rear_Delt_Cable',
    'Crucifixo Invertido Cruzado na Polia Dupla',
    'Deltoides',
    ARRAY['Dorsal', 'Trapézio']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Cabos cruzados na altura do peito, abrindo os braços em arco para trás.',
        'Isolamento incomparável do deltoide posterior.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Rear_Delt_Fly/0.jpg'
),
(
    'Smith_Bulgarian_Split_Squat',
    'Agachamento Búlgaro no Smith Machine com Step',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Pé de trás apoiado no banco e pé da frente no chão ou sobre um pequeno step.',
        'A barra guiada garante foco puro na fadiga do quadríceps e glúteos sem oscilação.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Smith_Machine_Squat/0.jpg'
),
(
    'Walking_Lunges_Heavy',
    'Passada Caminhando com Halteres Pesados (Walking Lunges)',
    'Quadríceps',
    ARRAY['Glúteos', 'Posterior de Coxa', 'Panturrilhas']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Passos firmes para a frente descendo o joelho de trás quase ao chão.',
        'Empurre pelo calcanhar dianteiro avançando ritmicamente.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg'
),
(
    'Barbell_Hip_Thrust_Heavy',
    'Elevação Pélvica com Barra Olímpica e Apoio Escapular',
    'Glúteos',
    ARRAY['Posterior de Coxa', 'Abdômen']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Escápulas firmes no banco, barra acolchoada sobre o quadril.',
        'Estenda totalmente a pelve empurrando pelo calcanhar com pausa de 1 segundo no topo.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Hip_Thrust/0.jpg'
),
(
    'Machine_Hip_Thrust_Plate',
    'Elevação Pélvica Articulada na Máquina com Anilha',
    'Glúteos',
    ARRAY['Posterior de Coxa']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Ajuste o cinto acolchoado com segurança e empurre a plataforma até a extensão máxima dos glúteos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Glute_Drive/0.jpg'
),
(
    'Seated_Calf_Raise_Soleus',
    'Elevação de Panturrilha Sentado na Máquina para Sóleo',
    'Panturrilhas',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Joelhos flexionados a 90 graus isolam o músculo sóleo.',
        'Alongamento profundo com pausa de 2 segundos embaixo antes da subida.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Calf_Raise/0.jpg'
),
(
    'Donkey_Calf_Raise_Machine',
    'Elevação Burrinho de Panturrilha na Máquina',
    'Panturrilhas',
    ARRAY['Posterior de Coxa']::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Tronco a 90 graus em flexão de quadril com pernas estendidas.',
        'Maior estiramento dos gastrocnêmios e ativação muscular profunda.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Donkey_Calf_Raise/0.jpg'
),
(
    'Leg_Press_Calf_Raise_45',
    'Panturrilha no Leg Press 45°',
    'Panturrilhas',
    ARRAY[]::TEXT[],
    'Máquina',
    'Força',
    ARRAY[
        'Pontas dos pés na borda da plataforma do Leg Press.',
        'Empurre com as pontas dos pés mantendo os joelhos com leve microflexão protetora.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Calf_Press_on_Leg_Press/0.jpg'
),
(
    'Kneeling_Cable_Crunch',
    'Abdominal Crunch Ajoelhado na Polia Alta com Corda',
    'Abdômen',
    ARRAY[]::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'Ajoelhado em frente à polia com a corda junto às têmporas.',
        'Enrole o tronco aproximando as costelas do quadril sem mexer as pernas.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crunch/0.jpg'
),
(
    'Hanging_Leg_Raise_Weighted',
    'Elevação de Pernas Completa Suspenso na Barra com Peso',
    'Abdômen',
    ARRAY['Antebraços']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Suspenso na barra, eleve as pernas esticadas até 90 graus ou mais com rotação pélvica estrita.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg'
),
(
    'Roman_Chair_Leg_Raise',
    'Elevação de Pernas na Cadeira Romana / Paralela',
    'Abdômen',
    ARRAY[]::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Cotovelos apoiados, eleve as pernas ou joelhos enrolando a pelve para ativação abdominal real.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Captains_Chair_Leg_Raise/0.jpg'
),
(
    'Ab_Wheel_Rollout_Strict',
    'Roda Abdominal no Solo com Extensão Completa',
    'Abdômen',
    ARRAY['Deltoides', 'Dorsal']::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Role a roda para a frente mantendo a curvatura neutra em prancha abdominal.',
        'Puxe de volta flexionando o core.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Roller/0.jpg'
),
(
    'Pallof_Press_Cable',
    'Pallof Press na Polia (Anti-Rotação de Core)',
    'Abdômen',
    ARRAY['Peitoral', 'Deltoides']::TEXT[],
    'Polia',
    'Força',
    ARRAY[
        'De pé lateral ao cabo, empurre as mãos para frente resistindo à rotação do tronco por 2 segundos.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pallof_Press/0.jpg'
),
(
    'Decline_Weighted_Crunch',
    'Abdominal no Banco Declinado com Anilha no Peito',
    'Abdômen',
    ARRAY[]::TEXT[],
    'Peso Corporal',
    'Força',
    ARRAY[
        'Pés travados no banco declinado e anilha sobre o peito.',
        'Suba enrolando a coluna e descendo sob controle.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Crunch/0.jpg'
),
(
    'Farmer_Walk_Suitcase',
    'Caminhada da Mala Unilateral com Halter Pesado (Suitcase Carry)',
    'Antebraços',
    ARRAY['Abdômen', 'Trapézio']::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Segure um halter pesado em uma mão e caminhe com postura perfeita sem inclinar para o lado.',
        'Força de pegada e oblíquos inabalável.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Farmers_Walk/0.jpg'
),
(
    'Plate_Pinch_Grip',
    'Sustentação em Pinça de Duas Anilhas Lisas (Plate Pinch)',
    'Antebraços',
    ARRAY[]::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Segure duas anilhas juntas em pinça apenas com as pontas dos dedos por tempo cronometrado.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plate_Pinch/0.jpg'
),
(
    'Wrist_Roller_Forearm',
    'Rolo de Punho com Corda e Anilha para Antebraço',
    'Antebraços',
    ARRAY['Deltoides']::TEXT[],
    'Barra',
    'Força',
    ARRAY[
        'Enrole e desenrole a corda com rotação contínua dos punhos controlando a subida e descida da anilha.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wrist_Roller/0.jpg'
),
(
    'Seated_Wrist_Curl_Dumbbell',
    'Rosca Punho Sentado no Banco com Halteres',
    'Antebraços',
    ARRAY[]::TEXT[],
    'Halteres',
    'Força',
    ARRAY[
        'Antebraços apoiados nas coxas, flexione os punhos subindo os halteres com contração máxima dos flexores.'
    ]::TEXT[],
    'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Wrist_Curl/0.jpg'
)

ON CONFLICT (external_id) DO UPDATE SET
    nome = EXCLUDED.nome,
    grupo_muscular_principal = EXCLUDED.grupo_muscular_principal,
    grupos_musculares_secundarios = EXCLUDED.grupos_musculares_secundarios,
    equipamento = EXCLUDED.equipamento,
    categoria = EXCLUDED.categoria,
    instrucoes = EXCLUDED.instrucoes,
    imagem_url = EXCLUDED.imagem_url,
    updated_at = NOW();

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { measurements, volumeStats, activePlan, promptOverride } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({
      insight: generateLocalCoachInsight(measurements, volumeStats, activePlan),
      source: 'local_engine',
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const currentMeasurement = measurements?.[0];
    const previousMeasurement = measurements?.[1];

    const systemInstruction = `Você é um Cientista do Esporte e Treinador de Elite (AI Coach do Personal Hub). 
Seu papel é analisar a evolução de hipertrofia, consistência de treino e dados biométricos do atleta.
Forneça feedback técnico, direto, encorajador e altamente prático (em português brasileiro).
Estruture em 3 seções curtas com bullets objetivos:
1. 🎯 Diagnóstico de Composição e Balanço Energético (Hipertrofia vs Gordura)
2. ⚡ Ajustes de Carga e Volume (Dupla Progressão e Grupos Musculares em foco)
3. 🥗 Recomendações Práticas (Sono, Descanso e Meta Nutricional)`;

    const userPrompt = promptOverride || `
DADOS BIOMÉTRICOS ATUAIS:
- Peso: ${currentMeasurement?.weight_kg || 'N/D'} kg (Anterior: ${previousMeasurement?.weight_kg || 'N/D'} kg)
- Ombros: ${currentMeasurement?.shoulders_cm || 'N/D'} cm
- Braços: ${currentMeasurement?.arm_right_cm || currentMeasurement?.arms_cm || 'N/D'} cm
- Peitoral: ${currentMeasurement?.chest_cm || 'N/D'} cm
- Cintura: ${currentMeasurement?.waist_cm || 'N/D'} cm
- Coxas: ${currentMeasurement?.thigh_right_cm || currentMeasurement?.thighs_cm || 'N/D'} cm
- Panturrilhas: ${currentMeasurement?.calf_right_cm || currentMeasurement?.calves_cm || 'N/D'} cm

PLANO ATUAL: ${activePlan?.title || 'Ficha de Treino'}

DADOS DE VOLUME E PROGRESSÃO DE CARGAS:
${JSON.stringify(volumeStats || {}, null, 2)}

Por favor, elabore a análise para guiar o atleta no próximo ciclo de treinos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({
      insight: response.text || 'Análise concluída com sucesso.',
      source: 'gemini',
    });
  } catch (error: any) {
    console.error('Error in /api/coach:', error);
    return res.status(200).json({
      insight: generateLocalCoachInsight(measurements, volumeStats, activePlan),
      source: 'local_fallback',
    });
  }
}

function generateLocalCoachInsight(measurements: any[], volumeStats: any, activePlan: any): string {
  const latest = measurements?.[0];
  const weight = latest?.weight_kg ? `${latest.weight_kg}kg` : 'peso registrado';
  return `### 🎯 Diagnóstico de Composição e Hipertrofia
- Atleta em ritmo consistente com base nos registros biométricos (${weight}).
- A evolução dos grupamentos musculares sinaliza boa resposta adaptativa. Mantenha hidratação em ~35-40ml/kg.

### ⚡ Ajustes de Dupla Progressão
- Nas séries em que atingir o teto de repetições (ex: 12 reps), aumente 2kg (membros superiores) ou 4kg (membros inferiores) na próxima sessão.
- Caso não atinja a repetição mínima (ex: <8 reps), mantenha a carga e priorize a cadência excêntrica de 2 a 3 segundos.

### 🥗 Recomendações Práticas
- Garanta ingestão proteica entre 1.8g e 2.2g por kg de peso corporal.
- Priorize 7 a 8 horas de sono contínuo para regeneração do sistema nervoso central e pico de síntese proteica.`;
}

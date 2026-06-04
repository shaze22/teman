import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getGeminiModel(model = 'gemini-2.5-flash') {
  return genAI.getGenerativeModel({ model });
}

export async function geminiGenerate(prompt: string, model = 'gemini-2.5-flash'): Promise<string> {
  const geminiModel = getGeminiModel(model);
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

export async function geminiGenerateJSON<T = unknown>(prompt: string, model = 'gemini-2.5-flash'): Promise<T> {
  const text = await geminiGenerate(prompt + '\n\nRespond with valid JSON only, no markdown.', model);
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON in Gemini response');
  return JSON.parse(match[0]) as T;
}

async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  return { data: Buffer.from(buffer).toString('base64'), mimeType };
}

async function imagePrompt(imageUrl: string, prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const { data, mimeType } = await urlToBase64(imageUrl);
  const imagePart: Part = { inlineData: { data, mimeType } };
  const result = await model.generateContent([imagePart, prompt]);
  return result.response.text();
}

export interface ICAnalysis {
  isValid: boolean
  name?: string
  icNumber?: string
  dateOfBirth?: string
  confidence: 'high' | 'medium' | 'low'
  issues: string[]
}

export async function analyzeICPhoto(imageUrl: string): Promise<ICAnalysis> {
  const prompt = `Kau adalah sistem verifikasi dokumen Malaysia. Analisa gambar MyKad/IC Malaysia ini dan balas JSON sahaja:

{
  "isValid": <true jika gambar adalah IC Malaysia yang sah dan jelas>,
  "name": "<nama penuh seperti dalam IC, atau null>",
  "icNumber": "<nombor IC format 123456-78-9012, atau null>",
  "dateOfBirth": "<tarikh lahir DD/MM/YYYY, atau null>",
  "confidence": "<'high' jika jelas, 'medium' jika separuh jelas, 'low' jika kabur>",
  "issues": ["senarai masalah jika ada, contoh: 'gambar blur', 'IC tidak kelihatan penuh'"]
}

Nota keselamatan: Jangan sahkan IC palsu. Jika ragu-ragu, tetapkan confidence = 'low'.`;

  const text = await imagePrompt(imageUrl, prompt);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid AI response');
  return JSON.parse(match[0]) as ICAnalysis;
}

export interface ProfilePhotoAnalysis {
  isGenuine: boolean
  isAppropriate: boolean
  issues: string[]
}

export async function analyzeProfilePhoto(imageUrl: string): Promise<ProfilePhotoAnalysis> {
  const prompt = `Analisa gambar profil ini dan balas JSON sahaja:

{
  "isGenuine": <true jika nampak gambar orang sebenar (bukan stock photo/logo/kartun)>,
  "isAppropriate": <true jika sesuai untuk platform perkhidmatan profesional>,
  "issues": ["senarai masalah jika ada, dalam BM"]
}`;

  const text = await imagePrompt(imageUrl, prompt);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid AI response');
  return JSON.parse(match[0]) as ProfilePhotoAnalysis;
}

export async function summarizeReviews(reviews: { rating: number; comment: string }[]): Promise<string> {
  if (reviews.length === 0) return 'Belum ada ulasan.';
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const reviewText = reviews.slice(0, 20).map(r => `[${r.rating}/5] ${r.comment}`).join('\n');

  const prompt = `Berikut adalah ${reviews.length} ulasan untuk seorang provider perkhidmatan (purata: ${avgRating}/5):

${reviewText}

Tulis ringkasan 2-3 ayat dalam Bahasa Malaysia yang menonjolkan kekuatan utama dan sebarang kelemahan yang perlu diperhatikan. Tulis secara neutral dan informatif.`;

  return geminiGenerate(prompt);
}

export interface SelfieVerifyResult {
  faceMatch: boolean
  confidence: 'high' | 'medium' | 'low'
  icAuthentic: boolean
  isAdult: boolean
  issues: string[]
}

export async function compareFaceWithIC(
  icBase64: string, icMimeType: string,
  selfieBase64: string, selfieMimeType: string,
): Promise<SelfieVerifyResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const icPart: Part = { inlineData: { data: icBase64, mimeType: icMimeType } }
  const selfiePart: Part = { inlineData: { data: selfieBase64, mimeType: selfieMimeType } }
  const prompt = `Kau adalah sistem verifikasi identiti. Gambar pertama ialah MyKad/IC Malaysia. Gambar kedua ialah selfie pengguna.

Analisa dan balas JSON sahaja:
{
  "faceMatch": <true jika muka dalam selfie adalah orang yang sama dalam IC>,
  "confidence": <"high"|"medium"|"low">,
  "icAuthentic": <true jika IC nampak sah, bukan gambar skrin atau palsu>,
  "isAdult": <true jika orang nampak berumur 18 tahun ke atas>,
  "issues": ["senarai masalah jika ada"]
}`

  const result = await model.generateContent([icPart, selfiePart, prompt])
  const text = result.response.text()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid Gemini response')
  return JSON.parse(match[0]) as SelfieVerifyResult
}

// api/bhashini/tts.js — Bhashini Text-To-Speech (TTS) Endpoint (Server-Side Protected)
import axios from 'axios'

const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || process.env.BHASHINI_API_KEY
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY
const BHASHINI_INFERENCE_KEY = process.env.BHASHINI_INFERENCE_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, language = 'en', gender = 'female' } = req.body || {}

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for TTS synthesis' })
  }

  // Clean markdown tags and excessive punctuation for speech clarity
  let cleanText = text
    .replace(/[*#_`>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|[ -:|]+\|/g, '')
    .replace(/\|/g, ', ')
    .trim()

  // Phonetic normalization for flawless pronunciation in official BIS domain
  if (language === 'hi') {
    cleanText = cleanText
      .replace(/\bIS\s*(\d+)/gi, 'आई एस $1')
      .replace(/\bBIS\b/gi, 'भारतीय मानक ब्यूरो')
      .replace(/\bHUID\b/gi, 'एच यू आई डी')
      .replace(/\bISI\b/gi, 'आई एस आई')
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये')
      .replace(/%/g, ' प्रतिशत')
  } else if (language === 'mr') {
    cleanText = cleanText
      .replace(/\bIS\s*(\d+)/gi, 'आय एस $1')
      .replace(/\bBIS\b/gi, 'भारतीय मानक ब्युरो')
      .replace(/\bHUID\b/gi, 'एच यू आय डी')
      .replace(/\bISI\b/gi, 'आय एस आय')
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये')
      .replace(/%/g, ' टक्के')
  } else {
    cleanText = cleanText
      .replace(/\bIS\s*(\d+)/gi, 'Indian Standard $1')
      .replace(/\bHUID\b/gi, 'H-U-I-D')
      .replace(/\bISI\b/gi, 'I-S-I')
      .replace(/₹\s*([0-9,]+)/g, '$1 Rupees')
      .replace(/%/g, ' percent')
  }

  cleanText = cleanText.slice(0, 1000) // Keep chunk within typical Bhashini model limit

  try {
    const pipelinePayload = {
      pipelineTasks: [
        {
          taskType: 'tts',
          config: {
            language: {
              sourceLanguage: language,
            },
            gender: gender.toLowerCase() === 'male' ? 'male' : 'female',
            samplingRate: 16000,
          },
        },
      ],
      inputData: {
        input: [{ source: cleanText }],
      },
    }

    const bhashiniResp = await axios.post(
      'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
      pipelinePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': BHASHINI_INFERENCE_KEY,
          'userID': BHASHINI_USER_ID,
          'ulcaApiKey': BHASHINI_API_KEY,
        },
        timeout: 5000,
      }
    )

    const audioBase64 = bhashiniResp.data?.pipelineResponse?.[0]?.audio?.[0]?.audioContent
    if (audioBase64) {
      return res.status(200).json({
        audioContent: audioBase64,
        audioFormat: 'wav',
        language,
        gender,
        provider: 'bhashini',
      })
    }
  } catch (err) {
    console.warn('[Bhashini TTS Warning]: Upstream error, signaling client full-sentence synthesis -', err.message)
  }

  // 2. Instruct client to use high-fidelity sequential sentence-queue Web Speech synthesis (zero length cutoff)
  return res.status(200).json({
    audioContent: null,
    fallback: true,
    cleanText,
    language,
    provider: 'web-speech-fallback',
    message: 'Using high-fidelity native Indian vocal engine',
  })
}

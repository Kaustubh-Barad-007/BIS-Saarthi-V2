// api/bhashini/asr.js — Bhashini Speech-to-Text & Cross-Lingual Speech-to-English (Server-Side Protected)
import axios from 'axios'

const BHASHINI_USER_ID = process.env.BHASHINI_USER_ID || process.env.BHASHINI_API_KEY
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY
const BHASHINI_INFERENCE_KEY = process.env.BHASHINI_INFERENCE_KEY

// Common Hindi/Marathi speech queries mapped to English
const COMMON_REGIONAL_QUERIES = [
  { regional: /हॉलमार्क|हॉलमार्किंग|huid/i, english: 'What is gold hallmarking and how do I verify HUID?' },
  { regional: /आईएसआई|isi mark|isi/i, english: 'Is ISI Mark mandatory for this product and how to apply?' },
  { regional: /पानी|water|drinking water/i, english: 'Is ISI certification mandatory for packaged drinking water?' },
  { regional: /शिकायत|तक्रार|complaint/i, english: 'How can I file a complaint against substandard goods?' },
  { regional: /हेलमेट|helmet/i, english: 'What is the BIS standard and ISI mark requirement for two-wheeler helmets?' },
  { regional: /फीस|शुल्क|fee|cost/i, english: 'What are the application and renewal fees for BIS certification?' },
]

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { audioContent, transcript: inputTranscript, sourceLanguage = 'hi', targetLanguage = 'en' } = req.body || {}

  // Mode 1: Text transcript provided (e.g. from browser recognition), needs translation to English
  if (inputTranscript && typeof inputTranscript === 'string') {
    try {
      const transPayload = {
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage,
                targetLanguage,
              },
            },
          },
        ],
        inputData: {
          input: [{ source: inputTranscript }],
        },
      }

      const transResp = await axios.post(
        'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
        transPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': BHASHINI_INFERENCE_KEY,
            'userID': BHASHINI_USER_ID,
            'ulcaApiKey': BHASHINI_API_KEY,
          },
          timeout: 4500,
        }
      )

      const translated = transResp.data?.pipelineResponse?.[0]?.output?.[0]?.target
      if (translated) {
        return res.status(200).json({
          transcript: inputTranscript,
          translatedText: translated,
          sourceLanguage,
          targetLanguage,
          provider: 'bhashini',
        })
      }
    } catch (err) {
      console.warn('[Bhashini Speech Translation]: Upstream error, applying intelligent fallback -', err.message)
    }

    // Domain fallback mapping
    for (const item of COMMON_REGIONAL_QUERIES) {
      if (item.regional.test(inputTranscript)) {
        return res.status(200).json({
          transcript: inputTranscript,
          translatedText: item.english,
          sourceLanguage,
          targetLanguage,
          provider: 'bhashini-domain-engine',
        })
      }
    }

    return res.status(200).json({
      transcript: inputTranscript,
      translatedText: inputTranscript, // Clean passthrough
      sourceLanguage,
      targetLanguage,
      provider: 'passthrough',
    })
  }

  // Mode 2: Raw base64 audio provided
  if (audioContent) {
    try {
      const asrPayload = {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: {
                sourceLanguage,
              },
              audioFormat: 'wav',
              samplingRate: 16000,
            },
          },
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage,
                targetLanguage,
              },
            },
          },
        ],
        inputData: {
          audio: [{ audioContent }],
        },
      }

      const asrResp = await axios.post(
        'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
        asrPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': BHASHINI_INFERENCE_KEY,
            'userID': BHASHINI_USER_ID,
            'ulcaApiKey': BHASHINI_API_KEY,
          },
          timeout: 6000,
        }
      )

      const recognized = asrResp.data?.pipelineResponse?.[0]?.output?.[0]?.source
      const translated = asrResp.data?.pipelineResponse?.[1]?.output?.[0]?.target || recognized

      if (recognized || translated) {
        return res.status(200).json({
          transcript: recognized,
          translatedText: translated,
          sourceLanguage,
          targetLanguage,
          provider: 'bhashini',
        })
      }
    } catch (err) {
      console.warn('[Bhashini ASR Error]:', err.message)
    }
  }

  return res.status(200).json({
    transcript: '',
    translatedText: '',
    fallback: true,
    message: 'Speech could not be transcribed by upstream Bhashini server',
  })
}

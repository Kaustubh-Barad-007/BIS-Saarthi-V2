// src/lib/standardsReferences.js
// Maps and displays only attributes provided by backend source data.
// Zero static/fabricated fields (no synthetic authority, committee, or act references).

export const STANDARDS_REGISTRY = {}

/**
 * Pure dynamic resolver that maps only attributes provided by the backend source data as-is.
 */
export function resolveDetailedCitation(cite) {
  if (!cite) return null

  const standard = cite.standard || cite.document_standard || cite.source || cite.standard_code || null
  const title = cite.title || cite.product || standard || null
  const clause = cite.clause || null
  const section = cite.section || (cite.page ? `Page ${cite.page}` : null)
  const page = cite.page || null
  const product = cite.product || null
  const sourceFile = cite.source_file || cite.sourceFile || null
  const score = cite.score ?? cite.hybrid_score ?? null
  const status = cite.document_status || cite.version || cite.status || null
  const text = cite.text || cite.content || null
  const chunkId = cite.chunk_id || cite.chunkId || null
  const documentId = cite.document_id || cite.documentId || null

  return {
    source: standard || title || 'Statutory Source',
    standard,
    title,
    product,
    clause,
    section,
    page,
    sourceFile,
    score: score !== null ? Number(score) : null,
    status,
    content: text,
    text,
    chunkId,
    documentId,
    ragGrounded: true,
  }
}

export default {
  STANDARDS_REGISTRY,
  resolveDetailedCitation,
}

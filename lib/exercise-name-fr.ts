function replaceInsensitive(value: string, pattern: RegExp, replacement: string) {
  return value.replace(pattern, replacement)
}

export function localizeExerciseNameFr(name: string) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return trimmed

  const normalized = trimmed.toLowerCase()

  // Keep terms that are commonly used as-is in French gym vocabulary.
  if (normalized.includes('curl')) return trimmed

  let output = trimmed

  const phraseReplacements: Array<[RegExp, string]> = [
    [/\bmountain climbers?\b/gi, 'Grimpeurs'],
    [/\bjumping jacks?\b/gi, 'Sauts etoiles'],
    [/\bjump squats?\b/gi, 'Squats sautes'],
    [/\brussian twists?\b/gi, 'Rotation russe'],
    [/\bside plank\b/gi, 'Planche laterale'],
    [/\bpush[\s-]?ups?\b/gi, 'Pompes'],
    [/\bbench press\b/gi, 'Developpe couche'],
    [/\bchest press\b/gi, 'Developpe poitrine'],
    [/\bshoulder press\b/gi, 'Developpe epaules'],
    [/\bincline press\b/gi, 'Developpe incline'],
    [/\bdeadlift\b/gi, 'Souleve de terre'],
    [/\bleg extension\b/gi, 'Extension des jambes'],
    [/\bleg press\b/gi, 'Presse a cuisses'],
    [/\bleg curl\b/gi, 'Leg curl'],
    [/\bab wheel\b/gi, 'Roue abdominale'],
    [/\bab scissors\b/gi, 'Ciseaux abdominaux'],
    [/\bback extension\b/gi, 'Extensions lombaires'],
    [/\bwall sit\b/gi, 'Chaise murale'],
    [/\bstep-ups?\b/gi, 'Montee sur banc'],
    [/\browing\b/gi, 'Tirage'],
    [/\brow\b/gi, 'Tirage'],
    [/\blunges?\b/gi, 'Fentes'],
    [/\bplank\b/gi, 'Planche'],
    [/\bfull body\b/gi, 'Corps complet'],
  ]

  const wordReplacements: Array<[RegExp, string]> = [
    [/\bdumbbells?\b/gi, 'halteres'],
    [/\bbarbells?\b/gi, 'barre'],
    [/\bcable\b/gi, 'poulie'],
    [/\bbodyweight\b/gi, 'poids du corps'],
    [/\bsmith machine\b/gi, 'machine smith'],
  ]

  phraseReplacements.forEach(([pattern, replacement]) => {
    output = replaceInsensitive(output, pattern, replacement)
  })

  wordReplacements.forEach(([pattern, replacement]) => {
    output = replaceInsensitive(output, pattern, replacement)
  })

  return output
}

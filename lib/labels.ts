const labelMap: Record<string, string> = {
  Debutant: 'Débutant',
  Intermediaire: 'Intermédiaire',
  Avance: 'Avancé',
  Elastiques: 'Élastiques',
  Halteres: 'Haltères',
  'Aucun materiel': 'Aucun matériel',
  Mobilite: 'Mobilité',
  Developpement: 'Développement',
}

export function labelize(value: string) {
  return labelMap[value] ?? value
}

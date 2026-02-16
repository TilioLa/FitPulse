const labelMap: Record<string, string> = {
  Debutant: 'Débutant',
  Débutant: 'Débutant',
  Intermediaire: 'Intermédiaire',
  Intermédiaire: 'Intermédiaire',
  Avance: 'Avancé',
  Avancé: 'Avancé',
  Elastiques: 'Élastiques',
  Élastiques: 'Élastiques',
  Halteres: 'Haltères',
  Haltères: 'Haltères',
  'Aucun materiel': 'Aucun matériel',
  'Aucun matériel': 'Aucun matériel',
  Mobilite: 'Mobilité',
  Mobilité: 'Mobilité',
  Developpement: 'Développement',
  Développement: 'Développement',
}

export function labelize(value: string) {
  return labelMap[value] ?? value
}

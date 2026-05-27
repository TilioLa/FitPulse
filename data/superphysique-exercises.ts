import type { ExerciseCatalogItem } from './exercises'

const SUPERPHYSIQUE_SOURCE_URL = 'https://www.superphysique.org/musculation/exercices_musculation'

type SuperphysiqueLevel = 'base' | 'advanced' | 'finishing'

type SuperphysiqueGroup = {
  muscle: string
  base: string[]
  advanced: string[]
  finishing: string[]
}

const muscleTags: Record<string, string> = {
  pectoraux: 'Chest',
  'deltoïdes': 'Shoulders',
  'trapèzes': 'Traps',
  dorsaux: 'Lats',
  triceps: 'Triceps',
  biceps: 'Biceps',
  'avants-bras': 'Forearms',
  abdominaux: 'Abdominals',
  fessiers: 'Glutes',
  quadriceps: 'Quadriceps',
  'ischio-jambiers': 'Hamstrings',
  mollets: 'Calves',
  lombaires: 'Lower Back',
}

const superphysiqueGroups: SuperphysiqueGroup[] = [
  {
    muscle: 'pectoraux',
    base: [
      'Développé assis à la machine convergente',
      'Développé couché avec haltères',
      'Développé couché à la barre',
      'Développé couché à la machine convergente',
      'Développé décliné avec haltères',
      'Développé décliné à la barre',
      'Développé incliné avec haltères',
      'Développé incliné à la barre',
      'Développé incliné à la machine convergente',
      'Dips prise large buste penché',
      'Pull over avec barre ou haltère',
      'Pull over en travers d’un banc avec barre ou haltère',
    ],
    advanced: [
      'Écarté couché avec haltères',
      'Écarté décliné avec haltères',
      'Écarté incliné avec haltères',
      'Écarté pectoraux à la machine',
      'Pompes prise large au sol',
      'Pull over à la poulie basse',
    ],
    finishing: [
      'Écarté à la poulie vis à vis basse',
      'Écarté à la poulie vis à vis haute',
      'Développé couché à la machine',
    ],
  },
  {
    muscle: 'deltoïdes',
    base: [
      'Élévation latérale à la poulie',
      'Développé épaules avec haltères',
      'Développé épaules à la machine convergente',
      'Développé militaire avec barre',
      'Développé nuque avec barre',
      'Oiseau à la poulie basse',
      'Oiseau/Rowing avec haltères',
      'Rowing assis à la machine coudes ouverts',
      'Rowing assis à la poulie basse coudes ouverts',
      'Rowing à la poulie basse sur banc incliné coudes ouverts',
      'Rowing à la poulie haute sur banc incliné coudes ouverts',
      'Rowing à la T-bar coudes ouverts',
      'Rowing barre coudes ouverts',
      'Rowing debout à la poulie basse',
      'Rowing debout prise large avec barre',
    ],
    advanced: [
      'Élévation latérale avec haltères',
      'Élévation latérale à un bras penché sur le côté',
      'Élévation latérale à un bras sur banc incliné',
      'Développé épaules Arnold avec haltères',
      'Développé épaules à la machine',
      'Développé inversé au poids de corps',
      'Oiseau avec haltères',
      'Oiseau à la machine',
      'Oiseau à la poulie haute',
      'Oiseau à un bras allongé',
      'Oiseau sur banc incliné avec haltères',
      'Pompes indiennes',
    ],
    finishing: [
      'Élévation frontale avec haltères',
      'Élévation frontale avec une barre',
      'Élévation frontale à la poulie',
      'Élévation frontale sur banc incliné avec barre ou haltères',
      'Élévation latérale à la machine',
      'L-Fly allongé à la poulie basse',
      'L-Fly assis à la poulie basse',
      'L-Fly avec haltère',
      'L-Fly debout à la poulie',
      'Rotation externe debout avec barre',
      'Rotation interne allongé à la poulie basse',
      'Rotation interne assis à la poulie basse',
      'Rotation interne avec haltère',
      'Rotation interne debout à la poulie',
    ],
  },
  {
    muscle: 'trapèzes',
    base: [
      'Rowing à la T-bar',
      'Rowing à un bras avec haltère',
      'Rowing à un bras à la machine',
      'Rowing barre à la Yates en pronation',
      'Rowing barre à la Yates en supination',
      'Rowing barre buste penché en pronation',
      'Rowing barre en supination',
      'Soulevé de terre partiel avec barre',
    ],
    advanced: [
      'Rowing assis à la machine',
      'Rowing assis à la poulie basse à un bras',
      'Rowing assis à la poulie basse en pronation',
      'Rowing assis à la poulie basse en supination',
      'Rowing assis à la poulie basse prise neutre',
      'Rowing à la poulie basse sur banc incliné',
      'Rowing à la poulie haute à un bras',
      'Rowing à la poulie haute en prise neutre',
      'Rowing à la poulie haute en pronation',
      'Rowing à la poulie haute en supination',
      'Rowing à la T-bar à la machine',
      'Rowing à un bras à la poulie basse',
      'Rowing barre allongé sur banc',
      'Rowing debout prise serrée avec barre',
    ],
    finishing: [
      'Rowing inversé au poids de corps',
      'Shrug avec barre',
      'Shrug avec haltères',
      'Shrug à la machine',
      'Shrug à la machine à mollets',
      'Shrug à la machine convergente',
      'Shrug à la poulie',
    ],
  },
  {
    muscle: 'dorsaux',
    base: [
      'Traction prise large devant à la barre fixe',
      'Traction prise large nuque à la barre fixe',
      'Traction prise neutre à la barre fixe',
      'Traction prise serrée en pronation à la barre fixe',
      'Traction prise supination cambré à la barre fixe',
    ],
    advanced: [
      'Pull over assis à la machine',
      'Traction à la machine convergente',
      'Traction à la poulie haute à un bras',
      'Traction à la poulie haute devant',
      'Traction à la poulie haute nuque',
      'Traction à la poulie haute prise neutre',
      'Traction à la poulie haute prise serrée en pronation',
      'Traction à la poulie haute prise supination',
    ],
    finishing: ['Pull over debout à la poulie haute', 'Traction à la machine'],
  },
  {
    muscle: 'triceps',
    base: [
      'Barre au front allongé à la poulie basse',
      'Barre au front triceps avec barre ou haltères',
      'Développé couché prise serrée à la barre',
      'Dips à la machine',
      'Dips entre deux bancs',
      'Dips prise serrée',
      'Extension des triceps à la poulie haute à genoux',
      'Extension des triceps contre un mur au poids de corps',
      'Extension nuque avec barre ou haltère',
      'Extension nuque à la poulie',
      'Extension nuque à un bras avec haltère',
      'Magic tRYCeps avec barre ou haltère',
      'Pull over Press avec barre ou haltère',
    ],
    advanced: [
      'Extension des triceps à la machine',
      'Extension des triceps bras à 180 degrés avec barre ou haltères',
      'Extension des triceps buste penché à la poulie haute',
      'Pompes prise serrée au sol',
      'Tate Press avec haltères',
      'Tate Press à un bras avec haltère',
    ],
    finishing: [
      'Extension des triceps à la poulie avec la corde',
      'Extension des triceps à la poulie à un bras',
      'Extension des triceps à la poulie coudes écartés',
      'Extension des triceps à la poulie en pronation',
      'Extension des triceps à la poulie en supination',
      'Kickback avec haltère',
      'Kickback à la poulie',
    ],
  },
  {
    muscle: 'biceps',
    base: [
      'Curl au pupitre avec barre',
      'Curl incliné avec haltères',
      'Curl marteau en travers avec haltères',
      'Traction prise supination non cambré à la barre fixe',
    ],
    advanced: [
      'Curl allongé à la poulie basse',
      'Curl allongé à la poulie haute',
      'Curl araignée avec barre',
      'Curl au pupitre à la poulie',
      'Curl avec haltères',
      'Curl à la barre',
      'Curl à la poulie basse',
      'Curl marteau avec haltères',
      'Curl marteau à la poulie basse',
    ],
    finishing: ['Curl au pupitre à la machine', 'Curl à la poulie vis à vis', 'Curl concentré avec haltère'],
  },
  {
    muscle: 'avants-bras',
    base: [],
    advanced: [
      'Curl inversé allongé à la poulie basse',
      'Curl inversé allongé à la poulie haute',
      'Curl inversé au pupitre avec barre',
      'Curl inversé au pupitre à la poulie',
      'Curl inversé avec barre',
      'Curl inversé à la poulie',
    ],
    finishing: [
      'Bobine Andrieux - Extension',
      'Bobine Andrieux - Flexion',
      'Extension des poignets avec barre',
      'Flexion des poignets avec barre',
    ],
  },
  {
    muscle: 'abdominaux',
    base: [
      'Crunch abdominaux avec l’Abmat',
      'Crunch à la poulie haute',
      'Enroulement de bassin au sol avec l’Abmat',
      'Enroulement de bassin suspendu à la barre fixe',
      'Obliques sur banc à lombaires',
    ],
    advanced: [
      'Crunch abdominaux au sol',
      'Crunch abdominaux à la machine',
      'Crunch abdominaux sur la Swiss Ball',
      'Crunch oblique au sol',
      'Enroulement de bassin au sol',
      'Obliques avec l’Abmat',
      'Obliques sur la Swiss Ball',
      'Obliques suspendu à la barre fixe',
      'Rotation à la machine',
      'Vacuum',
    ],
    finishing: [
      'Crunch abdominaux avec rotation au sol',
      'Drapeau du dragon',
      'Flexion latérale avec haltère',
      'Gainage abdominal frontal',
      'Gainage abdominal oblique',
      'Rotation debout avec balais',
    ],
  },
  {
    muscle: 'fessiers',
    base: ['Hip thrust à la barre', 'Soulevé de terre avec barre', 'Soulevé de terre sumo avec barre'],
    advanced: ['Extension inversé à la machine', 'Fente arrière glissée avec Valslide', 'Fente à la Smith machine'],
    finishing: [
      'Abducteurs allongé avec lest cheville',
      'Abducteurs assis à la machine',
      'Abducteurs à la machine',
      'Abducteurs à la poulie',
      'Extension de la hanche à la machine',
      'Fente avec barre',
      'Fente en marchant avec barre ou haltères',
      'Fente en reculant avec barre ou haltères',
    ],
  },
  {
    muscle: 'quadriceps',
    base: [
      'Hack squat à la machine',
      'Presse à cuisses allongé',
      'Presse à cuisses assis',
      'Presse à cuisses incliné',
      'Squat avant avec barre',
      'Squat avec barre derrière la nuque',
      'Squat sumo avec barre',
    ],
    advanced: [
      'Fente latérale avec barre',
      'Gobelet Squat avec haltère',
      'Hack squat avec une barre',
      'Montée sur banc avec barre ou haltères',
      'Squat avec ceinture de lest',
      'Squat à la machine',
      'Squat à la machine à mollets',
      'Squat à la Smith machine',
      'Squat à une jambe au poids de corps',
      'Squat bulgare avec barre ou haltères',
    ],
    finishing: [
      'Adducteurs assis à la machine',
      'Adducteurs à la machine',
      'Adducteurs à la poulie',
      'Flexion de la hanche à une jambe à la machine',
      'Leg extension allongé à la machine',
      'Leg extension assis à la machine',
      'Relevé de buste au sol ou sur banc incliné',
      'Relevé de genoux allongé au sol ou sur banc incliné',
      'Relevé de genoux sur banc',
      'Relevé de genoux suspendu à la barre fixe',
      'Sissy squat',
      'Sissy squat à la presse allongé',
      'Squat avec haltères',
      'Squat indien',
    ],
  },
  {
    muscle: 'ischio-jambiers',
    base: [
      'Glute Ham Raise au banc',
      'Leg curl assis à la machine',
      'Soulevé de terre jambes tendues avec barre ou haltères',
    ],
    advanced: [
      'Extension au banc à lombaires à 45 degrés',
      'Good Morning avec barre',
      'Leg curl allongé à la machine',
      'Leg curl debout à une jambe à la machine',
      'Leg curl debout à une jambe à la poulie',
      'Soulevé de terre jambes tendues à la poulie',
    ],
    finishing: ['Extension au banc à lombaires à 90 degrés'],
  },
  {
    muscle: 'mollets',
    base: ['Chameau à la machine', 'Mollets assis jambes tendues à la machine', 'Mollets à la presse à cuisses'],
    advanced: ['Mollets debout à la machine', 'Mollets debout à une jambe avec haltère'],
    finishing: ['Mollets assis à la machine'],
  },
  {
    muscle: 'lombaires',
    base: [
      'Soulevé de terre avec barre',
      'Soulevé de terre jambes tendues avec barre ou haltères',
      'Soulevé de terre sumo avec barre',
    ],
    advanced: [
      'Enroulement/Déroulement au banc à lombaires',
      'Good Morning avec barre',
      'Soulevé de terre jambes tendues à la poulie',
    ],
    finishing: ['Superman au sol'],
  },
]

function slugifyExercise(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function inferEquipment(name: string) {
  const normalized = name.toLowerCase()
  const equipment = new Set<string>()

  if (normalized.includes('poulie')) equipment.add('Cable')
  if (normalized.includes('smith')) equipment.add('Smith Machine')
  if (normalized.includes('machine') || normalized.includes('presse')) equipment.add('Machine')
  if (normalized.includes('haltère')) equipment.add('Dumbbell')
  if (normalized.includes('barre') && !normalized.includes('barre fixe')) equipment.add('Barbell')
  if (
    normalized.includes('poids de corps') ||
    normalized.includes('pompes') ||
    normalized.includes('dips') ||
    normalized.includes('gainage') ||
    normalized.includes('barre fixe') ||
    normalized.includes('superman') ||
    normalized.includes('vacuum') ||
    normalized.includes('squat indien')
  ) {
    equipment.add('Bodyweight')
  }
  if (
    normalized.includes('swiss ball') ||
    normalized.includes('abmat') ||
    normalized.includes('valslide') ||
    normalized.includes('lest cheville') ||
    normalized.includes('balais') ||
    normalized.includes('ceinture de lest')
  ) {
    equipment.add('Accessory')
  }

  return Array.from(equipment.size ? equipment : ['Bodyweight'])
}

function flattenLevel(group: SuperphysiqueGroup, level: SuperphysiqueLevel) {
  return group[level].map((name) => ({
    id: `sp-${slugifyExercise(name)}`,
    name,
    equipment: inferEquipment(name),
    tags: [muscleTags[group.muscle] || group.muscle],
    source: 'SuperPhysique',
    sourceUrl: SUPERPHYSIQUE_SOURCE_URL,
    sourceLevel: level,
  }))
}

const flattened = superphysiqueGroups.flatMap((group) => [
  ...flattenLevel(group, 'base'),
  ...flattenLevel(group, 'advanced'),
  ...flattenLevel(group, 'finishing'),
])

export const superphysiqueExerciseCatalog: ExerciseCatalogItem[] = Array.from(
  flattened
    .reduce<Map<string, ExerciseCatalogItem>>((acc, item) => {
      const key = slugifyExercise(item.name)
      const existing = acc.get(key)

      if (!existing) {
        acc.set(key, item)
        return acc
      }

      acc.set(key, {
        ...existing,
        equipment: Array.from(new Set([...existing.equipment, ...item.equipment])),
        tags: Array.from(new Set([...existing.tags, ...item.tags])),
      })

      return acc
    }, new Map())
    .values()
)

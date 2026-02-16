const styleMap: Record<string, string> = {
  'Poids du corps': 'bg-emerald-100 text-emerald-700',
  Elastiques: 'bg-purple-100 text-purple-700',
  Élastiques: 'bg-purple-100 text-purple-700',
  Machines: 'bg-orange-100 text-orange-700',
  Halteres: 'bg-slate-100 text-slate-700',
  Haltères: 'bg-slate-100 text-slate-700',
  'Aucun materiel': 'bg-teal-100 text-teal-700',
  'Aucun matériel': 'bg-teal-100 text-teal-700',
}

export default function EquipmentBadge({
  equipment,
  label,
}: {
  equipment: string
  label?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        styleMap[equipment] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {label || equipment}
    </span>
  )
}

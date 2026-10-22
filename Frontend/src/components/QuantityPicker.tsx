interface Props {
  label: string
  value: number
  max?: number
  onChange: (next: number) => void
}

export default function QuantityPicker({ label, value, max = 10, onChange }: Props) {
  return (
    <div>
      <span>{label}</span>
      <button type="button" aria-label={`Minska ${label}`} disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <span>{value}</span>
      <button type="button" aria-label={`Öka ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}
interface Props {
  label: string
  value: number
  max?: number
  onChange: (next: number) => void
}

export default function QuantityPicker({ label, value, max = 10, onChange }: Props) {
  return (
    <div className="fv-quantity">
      <span className="fv-quantity__label">{label}</span>
      <div className="fv-quantity__controls">
        <button
          type="button"
          className="fv-quantity__btn"
          aria-label={`Minska ${label}`}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <span className="fv-quantity__value">{value}</span>
        <button
          type="button"
          className="fv-quantity__btn"
          aria-label={`Öka ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
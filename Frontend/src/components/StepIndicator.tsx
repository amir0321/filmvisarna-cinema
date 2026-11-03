const STEPS = ['Biljetter', 'Välj platser', 'Bekräftelse']

interface Props {
  current: 1 | 2 | 3
}

export default function StepIndicator({ current }: Props) {
  return (
    <ol className="fv-steps" aria-label="Bokningssteg">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'todo'
        return (
          <li
            key={label}
            className={`fv-steps__item fv-steps__item--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="fv-steps__num">{state === 'done' ? '✓' : n}</span>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
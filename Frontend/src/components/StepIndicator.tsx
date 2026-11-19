import { useTranslation } from '../context/LocaleContext'
const STEPS = ['steps.tickets', 'steps.seats', 'steps.confirmation'] as const

interface Props {
  current: 1 | 2 | 3
}

export default function StepIndicator({ current }: Props) {
  const { t } = useTranslation()
  return (
    <ol className="fv-steps" aria-label={t('steps.label')}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'todo'
        return (
          <li
            key={t(label)}
            className={`fv-steps__item fv-steps__item--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="fv-steps__num">{state === 'done' ? '✓' : n}</span>
            <span className="fv-steps__label">{t(label)}</span>
            {n < STEPS.length && <span className="fv-steps__line" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}

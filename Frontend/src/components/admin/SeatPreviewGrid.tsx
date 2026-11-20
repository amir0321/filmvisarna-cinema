import { useTranslation } from '../../context/LocaleContext'

interface SeatPreviewGridProps {
  rows: number
  seatsPerRow: number
  // Wheelchair seats as "A-1" (row-number)
  wheelchairSeats?: ReadonlySet<string>
}

export default function SeatPreviewGrid({
  rows,
  seatsPerRow,
  wheelchairSeats,
}: SeatPreviewGridProps) {
  const { t } = useTranslation()

  return (
    <div className="fv-seatpreview">
      <div className="fv-seatpreview__screen" aria-hidden="true" />
      <div className="fv-seatpreview__rows" role="img" aria-label={t('admin.cinemas.mapTitle')}>
        {Array.from({ length: rows }, (_, r) => {
          const label = String.fromCharCode(65 + r)
          return (
            <div key={label} className="fv-seatpreview__row">
              <span className="fv-seatpreview__label" aria-hidden="true">{label}</span>
              <div className="fv-seatpreview__seats">
                {Array.from({ length: seatsPerRow }, (_, i) => {
                  const number = seatsPerRow - i
                  const isWheelchair = wheelchairSeats?.has(`${label}-${number}`) ?? false
                  return (
                    <span
                      key={number}
                      className={`fv-seatpreview__seat${isWheelchair ? ' fv-seatpreview__seat--wheelchair' : ''}`}
                    />
                  )
                })}
              </div>
              <span className="fv-seatpreview__label" aria-hidden="true">{seatsPerRow}</span>
            </div>
          )
        })}
      </div>
      <ul className="fv-seatpreview__legend">
        <li><span className="fv-seatpreview__seat" aria-hidden="true" /> {t('admin.cinemas.legendAvailable')}</li>
        <li><span className="fv-seatpreview__seat fv-seatpreview__seat--wheelchair" aria-hidden="true" /> {t('admin.cinemas.legendWheelchair')}</li>
      </ul>
    </div>
  )
}
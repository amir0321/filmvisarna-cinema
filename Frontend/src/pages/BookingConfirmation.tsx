import { Link, useParams } from 'react-router'
import BookingTicket from '../components/BookingTicket'
import { loadConfirmation } from '../utils/confirmationStorage'

export default function BookingConfirmation() {
  const { kod } = useParams()
  const data = kod ? loadConfirmation(kod) : null

  return (
    <section className="fv-ticket">
      <div className="fv-ticket__top">
        <div className="fv-ticket__check" aria-hidden="true">
          <i className="bi bi-check-lg" />
        </div>
        <h1>Tack för din bokning!</h1>
        <p>
          En bekräftelse skickas till <strong>{data?.email || 'din e-post'}</strong>
        </p>
      </div>

      <BookingTicket bookingRef={kod ?? ''} data={data} />

      <div className="fv-ticket__footer">
        <Link to="/" className="fv-ticket__home">
          Tillbaka till startsidan
        </Link>
      </div>
    </section>
  )
}

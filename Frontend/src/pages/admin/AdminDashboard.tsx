import { Link } from 'react-router'

export default function AdminDashboard() {
  const cards = [
    {
      title: 'Bokningar & Kassa',
      description: 'Hantera bokningar, checka in gäster och ta emot betalningar.',
      path: '/admin/bookings',
      icon: 'bi-ticket-perforated',
      badge: 'Live',
    },
    {
      title: 'Visningsschema',
      description: 'Schemalägg nya filmvisningar och hantera tider för salongerna.',
      path: '/admin/screenings',
      icon: 'bi-calendar3',
      badge: 'Schema',
    },
    {
      title: 'Filmarkiv',
      description: 'Lägg till och uppdatera filmer, genres och information.',
      path: '/admin/movies',
      icon: 'bi-film',
      badge: 'Arkiv',
    },
    {
      title: 'Salonger',
      description: 'Se salongskartor, stolsindelning och rullstolsplatser.',
      path: '/admin/cinemas',
      icon: 'bi-display',
      badge: 'Salonger',
    },
  ]

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Backoffice Översikt</h2>
          <p className="text-secondary mb-0">Välkommen till Filmvisarnas administrationspanel.</p>
        </div>
      </div>

      <div className="row g-4">
        {cards.map((c) => (
          <div key={c.path} className="col-12 col-md-6 col-lg-3">
            <div className="card h-100 bg-card border-secondary border-opacity-25 shadow-sm">
              <div className="card-body d-flex flex-column p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <i className={`bi ${c.icon} text-danger fs-2`}></i>
                  <span className="badge bg-secondary">{c.badge}</span>
                </div>
                <h5 className="card-title fw-bold text-white mb-2">{c.title}</h5>
                <p className="card-text text-secondary small flex-grow-1">{c.description}</p>
                <Link to={c.path} className="btn btn-outline-danger btn-sm mt-3 w-100">
                  Öppna modul &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

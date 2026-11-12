import { Link } from 'react-router'

interface AdminPageHeaderProps {
  title: string
  subtitle: string
}

export default function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div>
        <h1 className="admin-page-header__title">{title}</h1>
        <p className="admin-page-header__subtitle">{subtitle}</p>
      </div>
      <nav aria-label="Brödsmulor">
        <ol className="admin-breadcrumb">
          <li><Link to="/admin">Backoffice</Link></li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
    </header>
  )
}

import { Link } from 'react-router'

interface BrandLogoProps {
  to?: string
  className?: string
  onClick?: () => void
}

export default function BrandLogo({
  to = '/',
  className = '',
  onClick,
}: BrandLogoProps) {
  const logoClasses = ['brand-logo', 'text-decoration-none', className]
    .filter(Boolean)
    .join(' ')

  return (
    <Link
      to={to}
      className={logoClasses}
      onClick={onClick}
    >
      FILMVISARNA
    </Link>
  )
}

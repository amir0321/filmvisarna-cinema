import { NavLink } from 'react-router'
import { navLinks } from '../routes'

const header = () => {
  return (
    <header className="header">
      <nav>
        <ul>
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavLink to={link.path}>{link.name}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default header

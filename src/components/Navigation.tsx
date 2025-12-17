import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { setLastVisitedPath } from '../utils/storage'
import { NAV_ITEMS, ROUTES } from '../config/constant'
import './Navigation.css'

export const Navigation = () => {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname !== ROUTES.HOME) {
      setLastVisitedPath(location.pathname)
    }
  }, [location.pathname])

  return (
    <nav className="global-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <img src="/reown.svg" alt="Logo" className="nav-logo-img" />
          <span className="nav-title">Ethan Dapp V2</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

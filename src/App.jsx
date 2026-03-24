import { useState, useEffect } from 'react'
import MapComponent from './components/MapComponent'

function App() {
  const [locations, setLocations] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
  }, [])

  return (
    <div className="app">
      <header className="header">
        <a className="header-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span className="header-wordmark">Hitch</span>
        </a>
        <div className="header-divider" />
        <span className="header-subtitle">York Region District School Board</span>
      </header>

      <div className="body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <p className="sidebar-title">Schools &mdash; {locations.length}</p>
          </div>
          <ul className="school-list">
            {locations.map(loc => (
              <li
                key={loc.id}
                className={`school-item ${selected?.id === loc.id ? 'active' : ''}`}
                onClick={() => setSelected(prev => prev?.id === loc.id ? null : loc)}
              >
                <span className="school-dot" />
                <span className="school-name">{loc.name}</span>
              </li>
            ))}
          </ul>
        </aside>

        <main className="map-area">
          <MapComponent
            locations={locations}
            selectedLocation={selected}
            onSelectLocation={setSelected}
          />
        </main>
      </div>
    </div>
  )
}

export default App

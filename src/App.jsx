import { useState, useEffect } from 'react'
import MapComponent from './components/MapComponent'

const SCHOOLS = [
  { id: 1,  name: "Dr. G.W. Williams Secondary School",    lat: 44.0046, lng: -79.4656 },
  { id: 2,  name: "Newmarket High School",                 lat: 44.0370, lng: -79.4613 },
  { id: 3,  name: "Huron Heights Secondary School",        lat: 44.0453, lng: -79.4858 },
  { id: 4,  name: "Unionville High School",                lat: 43.8655, lng: -79.3246 },
  { id: 5,  name: "Markham District High School",          lat: 43.8742, lng: -79.2612 },
  { id: 6,  name: "Richmond Hill High School",             lat: 43.9056, lng: -79.4280 },
  { id: 7,  name: "Maple High School",                     lat: 43.8490, lng: -79.5073 },
  { id: 8,  name: "Stouffville District Secondary School", lat: 43.9742, lng: -79.2469 },
  { id: 9,  name: "King City Secondary School",            lat: 43.9278, lng: -79.5237 },
  { id: 10, name: "Hodan Nalayeh Secondary School",        lat: 43.8197, lng: -79.4463 },
]

function App() {
  const [locations] = useState(SCHOOLS)
  const [selected, setSelected] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [otherUsers, setOtherUsers] = useState([])
  const [carpoolRequests, setCarpoolRequests] = useState([])
  const [myRequest, setMyRequest] = useState(null)
  const [activeTab, setActiveTab] = useState('schools')
  const [showCarpoolForm, setShowCarpoolForm] = useState(false)
  const [carpoolSchool, setCarpoolSchool] = useState('')
  const [carpoolMsg, setCarpoolMsg] = useState('')

  // Persistent user identity
  const [userId] = useState(() => {
    let id = localStorage.getItem('hitch_uid')
    if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem('hitch_uid', id) }
    return id
  })
  const [userName, setUserName] = useState(() => localStorage.getItem('hitch_name') || '')
  const [nameInput, setNameInput] = useState('')

  // Broadcast own location to server every 15 s
  useEffect(() => {
    if (!userName || !userLocation) return
    const send = () => fetch('/api/users/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name: userName, lat: userLocation.lat, lng: userLocation.lng }),
    })
    send()
    const id = setInterval(send, 15000)
    return () => clearInterval(id)
  }, [userName, userLocation, userId])

  // Poll other users every 10 s
  useEffect(() => {
    if (!userName) return
    const fetch_ = () =>
      fetch('/api/users/locations').then(r => r.json()).then(data =>
        setOtherUsers(data.filter(u => u.user_id !== userId))
      )
    fetch_()
    const id = setInterval(fetch_, 10000)
    return () => clearInterval(id)
  }, [userName, userId])

  // Poll carpool requests every 10 s
  useEffect(() => {
    if (!userName) return
    const fetch_ = () =>
      fetch('/api/carpool/requests').then(r => r.json()).then(data => {
        setCarpoolRequests(data)
        setMyRequest(data.find(r => r.user_id === userId) || null)
      })
    fetch_()
    const id = setInterval(fetch_, 10000)
    return () => clearInterval(id)
  }, [userName, userId])

  const saveName = () => {
    const n = nameInput.trim()
    if (!n) return
    localStorage.setItem('hitch_name', n)
    setUserName(n)
  }

  const submitCarpoolRequest = () => {
    if (!carpoolSchool || !userLocation) return
    const school = locations.find(l => l.id === parseInt(carpoolSchool))
    if (!school) return
    fetch('/api/carpool/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId, name: userName,
        lat: userLocation.lat, lng: userLocation.lng,
        school_id: school.id, school_name: school.name,
        message: carpoolMsg,
      }),
    }).then(r => r.json()).then(req => {
      setMyRequest(req)
      setCarpoolRequests(prev => [...prev.filter(r => r.user_id !== userId), req])
      setShowCarpoolForm(false)
      setCarpoolMsg('')
      setCarpoolSchool('')
    })
  }

  const cancelCarpoolRequest = () => {
    if (!myRequest) return
    fetch(`/api/carpool/request/${myRequest.id}`, { method: 'DELETE' }).then(() => {
      setMyRequest(null)
      setCarpoolRequests(prev => prev.filter(r => r.id !== myRequest.id))
    })
  }

  // ── Name gate ──────────────────────────────────────────────────────────────
  if (!userName) {
    return (
      <div className="app">
        <div className="name-modal-overlay">
          <div className="name-modal">
            <div className="name-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <h2 className="name-modal-title">Welcome to Hitch</h2>
            <p className="name-modal-sub">Enter your name so peers can find you.</p>
            <input
              className="name-input"
              placeholder="Your name"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              autoFocus
            />
            <button className="btn-primary btn-full" onClick={saveName}>Get started</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  const otherCarpools = carpoolRequests.filter(r => r.user_id !== userId)

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
        <div style={{ flex: 1 }} />
        <div className="header-presence">
          <span className="presence-dot" />
          <span className="presence-name">{userName}</span>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${activeTab === 'schools' ? 'active' : ''}`}
              onClick={() => setActiveTab('schools')}
            >
              Schools
            </button>
            <button
              className={`sidebar-tab ${activeTab === 'carpools' ? 'active' : ''}`}
              onClick={() => setActiveTab('carpools')}
            >
              Carpools
              {carpoolRequests.length > 0 && (
                <span className="tab-badge">{carpoolRequests.length}</span>
              )}
            </button>
          </div>

          {activeTab === 'schools' && (
            <>
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
            </>
          )}

          {activeTab === 'carpools' && (
            <div className="carpool-panel">
              {!myRequest && !showCarpoolForm && (
                <button
                  className="btn-primary btn-full"
                  onClick={() => setShowCarpoolForm(true)}
                  disabled={!userLocation}
                  title={!userLocation ? 'Waiting for your location…' : undefined}
                >
                  + Request a Carpool
                </button>
              )}

              {showCarpoolForm && (
                <div className="carpool-form">
                  <label className="form-label">Destination school</label>
                  <select
                    className="form-select"
                    value={carpoolSchool}
                    onChange={e => setCarpoolSchool(e.target.value)}
                  >
                    <option value="">Select school…</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <label className="form-label">Message <span className="form-optional">(optional)</span></label>
                  <input
                    className="form-input"
                    placeholder="e.g. Leaving at 8:15 am"
                    value={carpoolMsg}
                    onChange={e => setCarpoolMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitCarpoolRequest()}
                  />
                  <div className="form-actions">
                    <button className="btn-ghost" onClick={() => { setShowCarpoolForm(false); setCarpoolSchool(''); setCarpoolMsg('') }}>
                      Cancel
                    </button>
                    <button
                      className="btn-primary"
                      onClick={submitCarpoolRequest}
                      disabled={!carpoolSchool || !userLocation}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {myRequest && (
                <div className="my-request-card">
                  <div className="req-header">
                    <span className="req-label">Your request</span>
                    <button className="btn-danger-sm" onClick={cancelCarpoolRequest}>Cancel</button>
                  </div>
                  <p className="req-school">{myRequest.school_name}</p>
                  {myRequest.message && <p className="req-msg">&ldquo;{myRequest.message}&rdquo;</p>}
                </div>
              )}

              {otherCarpools.length === 0 && !showCarpoolForm ? (
                <p className="empty-msg">No other carpool requests yet.</p>
              ) : (
                otherCarpools.map(req => (
                  <div key={req.id} className="carpool-card">
                    <div className="carpool-card-top">
                      <span className="carpool-avatar">{req.name[0].toUpperCase()}</span>
                      <div>
                        <p className="carpool-peer-name">{req.name}</p>
                        <p className="carpool-dest">{req.school_name}</p>
                      </div>
                    </div>
                    {req.message && <p className="carpool-msg">&ldquo;{req.message}&rdquo;</p>}
                  </div>
                ))
              )}

              {otherUsers.length > 0 && (
                <div className="peers-section">
                  <p className="sidebar-title">Online now &mdash; {otherUsers.length}</p>
                  {otherUsers.map(u => (
                    <div key={u.user_id} className="peer-row">
                      <span className="peer-avatar">{u.name[0].toUpperCase()}</span>
                      <span className="peer-row-name">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        <main className="map-area">
          <MapComponent
            locations={locations}
            selectedLocation={selected}
            onSelectLocation={setSelected}
            onLocationChange={setUserLocation}
            otherUsers={otherUsers}
            carpoolRequests={carpoolRequests}
            userId={userId}
          />
        </main>
      </div>
    </div>
  )
}

export default App

import './ConciergeDashboard.css'

function LoadingCard({ title }) {
  return (
    <div className="concierge-card concierge-card--loading">
      <div className="card-header">
        <div className="card-title">{title}</div>
      </div>
      <div className="card-body">
        <div className="skeleton skeleton--l" />
        <div className="skeleton skeleton--m" />
        <div className="skeleton skeleton--s" />
      </div>
    </div>
  )
}

export default function ConciergeDashboard({ reportData, isLoading }) {
  if (!reportData && !isLoading) return null

  return (
    <section className="concierge" aria-label="AI concierge recommendations">
      <div className="concierge__header">
        <h2 className="concierge__title">AI Concierge</h2>
        <p className="concierge__subtitle">Lifestyle guidance tailored to current conditions</p>
      </div>

      <div className="concierge-grid">
        {isLoading ? (
          <>
            <LoadingCard title="Outfit & Styling" />
            <LoadingCard title="Adverse Exposure" />
            <LoadingCard title="Dynamic Hydration" />
            <LoadingCard title="Dermal Protection" />
          </>
        ) : (
          <>
            <div className="concierge-card card-style" style={{ '--accent-color': '#60a5fa' }}>
              <div className="card-header">
                <h3 className="card-title">Outfit & Styling</h3>
              </div>
              <div className="card-body">{reportData.outfit}</div>
            </div>

            <div className="concierge-card card-avoid" style={{ '--accent-color': '#f87171' }}>
              <div className="card-header">
                <h3 className="card-title">Adverse Exposure</h3>
              </div>
              <div className="card-body">{reportData.avoid}</div>
            </div>

            <div className="concierge-card card-hydration" style={{ '--accent-color': '#34d399' }}>
              <div className="card-header">
                <h3 className="card-title">Dynamic Hydration</h3>
              </div>
              <div className="card-body">{reportData.hydration}</div>
            </div>

            <div className="concierge-card card-skincare" style={{ '--accent-color': '#fbbf24' }}>
              <div className="card-header">
                <h3 className="card-title">Dermal Protection</h3>
              </div>
              <div className="card-body">{reportData.skincare}</div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

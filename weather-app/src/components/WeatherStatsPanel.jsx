import './WeatherStatsPanel.css'

function scoreLabel(score) {
  if (score >= 85) return { label: 'Excellent', tone: 'good' }
  if (score >= 70) return { label: 'Good', tone: 'good' }
  if (score >= 50) return { label: 'Moderate', tone: 'warn' }
  return { label: 'Poor', tone: 'bad' }
}

export default function WeatherStatsPanel({ weatherData }) {
  if (!weatherData) return null

  const { label, tone } = scoreLabel(weatherData.comfortScore)

  return (
    <section className="weather-panel" aria-label="Weather statistics">
      <header className="weather-panel__header">
        <div className="weather-panel__place">
          <h2 className="weather-panel__city">
            {weatherData.city}
            <span className="weather-panel__country"> {weatherData.country}</span>
          </h2>
          <p className="weather-panel__desc">
            {weatherData.condition}
            <span className="weather-panel__desc-sep">•</span>
            {weatherData.description}
          </p>
        </div>

        <div className="weather-panel__temp">
          <div className="weather-panel__temp-main">
            {weatherData.temp}
            <span className="weather-panel__deg">°C</span>
          </div>
          <div className="weather-panel__temp-sub">Feels like {weatherData.feelsLike}°C</div>
        </div>
      </header>

      <div className="weather-panel__grid" role="list">
        <div className="weather-panel__stat" role="listitem">
          <div className="weather-panel__stat-k">Humidity</div>
          <div className="weather-panel__stat-v">{weatherData.humidity}%</div>
        </div>
        <div className="weather-panel__stat" role="listitem">
          <div className="weather-panel__stat-k">Wind</div>
          <div className="weather-panel__stat-v">{weatherData.wind} km/h</div>
        </div>
        <div className="weather-panel__stat" role="listitem">
          <div className="weather-panel__stat-k">Pressure</div>
          <div className="weather-panel__stat-v">{weatherData.pressure} hPa</div>
        </div>
        <div className="weather-panel__stat" role="listitem">
          <div className="weather-panel__stat-k">Visibility</div>
          <div className="weather-panel__stat-v">{weatherData.visibility} km</div>
        </div>
      </div>

      <div className={`comfort-meter comfort-meter--${tone}`} aria-label="Comfort score">
        <div className="comfort-meter__row">
          <div className="comfort-meter__title">Environmental Comfort</div>
          <div className="comfort-meter__value">
            {weatherData.comfortScore}/100 <span className="comfort-meter__label">{label}</span>
          </div>
        </div>
        <div className="comfort-meter__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weatherData.comfortScore}>
          <div className="comfort-meter__bar-fill" style={{ width: `${weatherData.comfortScore}%` }} />
        </div>
      </div>
    </section>
  )
}

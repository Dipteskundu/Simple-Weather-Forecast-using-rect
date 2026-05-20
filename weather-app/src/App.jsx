import { useEffect, useMemo, useState } from 'react'
import ConciergeDashboard from './components/ConciergeDashboard.jsx'
import WeatherStatsPanel from './components/WeatherStatsPanel.jsx'
import './App.css'

function fallbackReport(weatherData) {
  return {
    outfit: `Today's temperature is ${weatherData.temp}°C and the humidity is ${weatherData.humidity}%. We recommend lightweight, breathable cotton clothing to maintain maximum comfort and body temperature regulation.`,
    avoid: `Due to a Comfort Score of ${weatherData.comfortScore}/100, avoid heavy cardiovascular workouts in direct sunlight. Keep active hours early or late in the day.`,
    hydration: `With humidity at ${weatherData.humidity}% and a feels-like temperature of ${weatherData.feelsLike}°C, ensure you consume at least 250ml of cool water every hour.`,
    skincare: `To combat solar exposure at ${weatherData.temp}°C, apply SPF 50 sunscreen. Wear protective sunglasses and stay in shaded areas whenever possible.`,
  }
}

function tryParseJson(text) {
  if (typeof text !== 'string') return null

  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null

    const maybeJson = trimmed.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(maybeJson)
    } catch {
      return null
    }
  }
}

function normalizeReportData(maybeReport, weatherData) {
  if (
    !maybeReport ||
    typeof maybeReport !== 'object' ||
    typeof maybeReport.outfit !== 'string' ||
    typeof maybeReport.avoid !== 'string' ||
    typeof maybeReport.hydration !== 'string' ||
    typeof maybeReport.skincare !== 'string'
  ) {
    return fallbackReport(weatherData)
  }

  return {
    outfit: maybeReport.outfit.trim(),
    avoid: maybeReport.avoid.trim(),
    hydration: maybeReport.hydration.trim(),
    skincare: maybeReport.skincare.trim(),
  }
}

export default function App() {
  const [city, setCity] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [isLlmLoading, setIsLlmLoading] = useState(false)

  const openWeatherApiKey = useMemo(() => import.meta.env.VITE_WEATHER_API_KEY || '', [])
  const geminiApiKey = useMemo(() => import.meta.env.VITE_GEMINI_API_KEY || '', [])

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name.')
      return
    }
    const isWeatherKeyUnset =
      !openWeatherApiKey || openWeatherApiKey.toLowerCase().includes('your_openweathermap_key_here')

    if (isWeatherKeyUnset) {
      setError('Missing VITE_WEATHER_API_KEY. Add it to weather-app/.env and restart the dev server.')
      return
    }

    setIsLoading(true)
    setError('')
    setReportData(null)

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${openWeatherApiKey}&units=metric`,
      )
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid OpenWeatherMap API key. Update VITE_WEATHER_API_KEY in weather-app/.env.')
        }
        if (response.status === 404) {
          throw new Error('City not found. Please try again.')
        }
        throw new Error('Weather request failed. Please try again.')
      }

      const data = await response.json()

      const humidityImpact = Math.max(0, 100 - Math.abs(data.main.humidity - 45) * 1.8)
      const windImpact = Math.max(0, 100 - data.wind.speed * 4.5)
      const comfortScore = Math.round(humidityImpact * 0.6 + windImpact * 0.4)

      setWeatherData({
        city: data.name,
        country: data.sys.country,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        wind: Math.round(data.wind.speed * 3.6),
        pressure: data.main.pressure,
        visibility: (data.visibility / 1000).toFixed(1),
        condition: data.weather?.[0]?.main || 'Unknown',
        description: data.weather?.[0]?.description || 'Unknown',
        comfortScore,
      })
    } catch (err) {
      setWeatherData(null)
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!weatherData) return

    const controller = new AbortController()

    const fetchReport = async () => {
      setIsLlmLoading(true)

      const prompt = `Act as an elite personal health, style, and skin advisor.
Analyze the current weather data for ${weatherData.city}:
- Temperature: ${weatherData.temp}°C
- Feels Like: ${weatherData.feelsLike}°C
- Humidity: ${weatherData.humidity}%
- Wind speed: ${weatherData.wind} km/h
- Environmental Comfort Score: ${weatherData.comfortScore}/100

You must respond strictly with a valid JSON object matching the requested schema. No conversational preamble.

Explain how the metrics (specifically quoting humidity, temperature, and wind) affect the advice.`

      const isGeminiKeyUnset = !geminiApiKey || geminiApiKey.toLowerCase().includes('your_gemini_api_key_here')

      if (isGeminiKeyUnset) {
        setReportData(fallbackReport(weatherData))
        setIsLlmLoading(false)
        return
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    outfit: { type: 'STRING' },
                    avoid: { type: 'STRING' },
                    hydration: { type: 'STRING' },
                    skincare: { type: 'STRING' },
                  },
                  required: ['outfit', 'avoid', 'hydration', 'skincare'],
                },
              },
            }),
          },
        )

        const result = await response.json()
        const textResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        const parsedData = tryParseJson(textResponse)
        setReportData(normalizeReportData(parsedData, weatherData))
      } catch (err) {
        if (err?.name === 'AbortError') return
        console.error('Gemini Parse Error: Falling back to template compiler', err)
        setReportData(fallbackReport(weatherData))
      } finally {
        setIsLlmLoading(false)
      }
    }

    fetchReport()

    return () => controller.abort()
  }, [weatherData, geminiApiKey])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchWeather()
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">
          <div className="app-title__name">Weather Command Center</div>
          <div className="app-title__tag">OpenWeatherMap + Gemini diagnostics</div>
        </div>

        <div className="search-row">
          <label className="search-row__label" htmlFor="city-input">
            City
          </label>
          <div className="search-row__controls">
            <input
              id="city-input"
              className="search-row__input"
              type="text"
              placeholder="Search a city (e.g., Dhaka)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-row__button" type="button" onClick={fetchWeather} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Search'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        ) : null}
      </header>

      <main className="layout">
        <div className="layout__left">
          {weatherData ? (
            <WeatherStatsPanel weatherData={weatherData} />
          ) : (
            <div className="empty-state">
              <div className="empty-state__title">Search a city to begin</div>
              <div className="empty-state__subtitle">
                You’ll see live telemetry, a comfort score, and AI-powered lifestyle guidance.
              </div>
            </div>
          )}
        </div>

        <div className="layout__right">
          <ConciergeDashboard reportData={reportData} isLoading={!!weatherData && isLlmLoading} />
        </div>
      </main>

      <footer className="app-footer">
        <span>
          Tip: Add keys in <code>weather-app/.env</code> (see <code>weather-app/.env.example</code>).
        </span>
      </footer>
    </div>
  )
}

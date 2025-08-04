import { useState, useEffect } from 'react'
import { Link, Copy, Trash2, ExternalLink, LogOut, User, Settings, BarChart3, Shield, Zap } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import AuthModal from './components/AuthModal'
import SettingsModal from './components/SettingsModal'
import QRCodeDisplay from './components/QRCodeDisplay'
import apiService from './services/api'
import config from './config'
import './App.css'

function AppContent() {
    const [url, setUrl] = useState('')
    const [customCode, setCustomCode] = useState('')
    const [shortenedUrls, setShortenedUrls] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    const { currentUser, token,logout } = useAuth()
    const { darkMode, setDarkMode } = useTheme()

  // Load user's URLs when user changes
  useEffect(() => {
    if (currentUser) {
      if (config.USE_BACKEND_API) {
        loadUrlsFromBackend()
      } else {
          setShortenedUrls([])
      }
    } else {
        
        console.log("Backend error")
    }
  }, [currentUser])

  // Load URLs from backend
  const loadUrlsFromBackend = async () => {
    try {
      if (!token) {
        setShortenedUrls([])
        return
      }
      
      const urls = await apiService.getAllUrls()
      const transformedUrls = urls.map(url => ({
        id: url.id,
        originalUrl: url.originalUrl,
        shortUrl: `${config.DEFAULT_SHORT_DOMAIN}/${url.shortenedUrl}`,
        shortCode: url.shortenedUrl,
        clicks: 0,
        createdAt: url.createdAt,
        isCustom:  IsCustomAlias()||false
      }))
      setShortenedUrls(transformedUrls)
    } catch (error) {
      console.error('Failed to load URLs from backend:', error)
      // If unauthorized, logout user
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        logout()
      }
      setShortenedUrls([])
    }
  }


  // Validate URL format
  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  // Add protocol if missing
  const normalizeUrl = (url) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url
    }
    return url
  }

  // Handle URL shortening
  const handleShortenUrl = async () => {
    if (!currentUser) {
      setShowAuthModal(true)
      return
    }

    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }

    const normalizedUrl = normalizeUrl(url.trim())
    
    if (!isValidUrl(normalizedUrl)) {
      alert('Please enter a valid URL')
      return
    }

    setIsLoading(true)

      try {
          if (config.USE_BACKEND_API) {
              // Use backend API
              const result = await apiService.createShortenedUrl(normalizedUrl, customCode.trim())

              const newShortenedUrl = {
                  id: result.id,
                  originalUrl: result.originalUrl,
                  shortUrl: `https://localhost:8888/gateway/urls/redirect/${result.shortenedUrl}`,
                  shortCode: result.shortenedUrl,
                  clicks: 0,
                  createdAt: result.createdAt,
                  isCustom: result.isCustom || !!customCode.trim()
              }
              console.log('✅ Adding to frontend state:', newShortenedUrl)
              setShortenedUrls(prev => [newShortenedUrl, ...prev])
          } else {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500))

        let shortCode = customCode.trim()
        if (!shortCode) {
          // Generate random code if no custom code provided
          do {
            shortCode = generateShortCode()
          } while (isShortCodeTaken(shortCode))
        }

        const shortUrl = `${config.DEFAULT_SHORT_DOMAIN}/${shortCode}`
        
        const newShortenedUrl = {
          id: Date.now(),
          originalUrl: normalizedUrl,
          shortUrl: shortUrl,
          shortCode: shortCode,
          clicks: 0,
          createdAt: new Date().toISOString(),
          isCustom: !!customCode.trim()
        }

        setShortenedUrls(prev => [newShortenedUrl, ...prev])
      }
      
      setUrl('')
      setCustomCode('')
    } catch (error) {
      console.error('Failed to shorten URL:', error)
      alert('Failed to shorten URL: ${error.message}')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle copying to clipboard
  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Copied to clipboard!')
    }
  }

  // Handle URL deletion
  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this shortened URL?')) {
      try {
        if (config.USE_BACKEND_API) {
          await apiService.deleteUrl(id)
        }
        setShortenedUrls(prev => prev.filter(item => item.id !== id))
      } catch (error) {
        console.error('Failed to delete URL:', error)
        alert('Failed to delete URL. Please try again.')
      }
    }
  }

  // Handle short URL click (simulate tracking)
  const handleShortUrlClick = (id) => {
    setShortenedUrls(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, clicks: item.clicks + 1 }
          : item
      )
    )
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    handleShortenUrl()
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    setShortenedUrls([])
  }

  return (
    <div className="app">
      {/* Header/Navigation */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <Link size={32} color="#646cff" />
            <span className="logo-text">LinkShort</span>
          </div>
          
          <nav className="nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#terms" className="nav-link">Terms</a>
            <a href="#about" className="nav-link">About</a>
          </nav>
          
          <div className="auth-buttons">
            {currentUser ? (
              <div className="user-menu">
                <div className="user-info">
                  <User size={18} />
                  <span>{currentUser.username}</span>
                </div>
                <button onClick={() => setShowSettingsModal(true)} className="settings-btn">
                  <Settings size={16} />
                  Settings
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="login-btn"
              >
                <User size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-container">
            <h1 className="hero-title">
              Shorten URLs with
              <span className="gradient-text"> Style & Analytics</span>
            </h1>
            <p className="hero-subtitle">
              Transform your long URLs into short, shareable links with QR codes, 
              custom aliases, and detailed analytics. Perfect for social media, 
              marketing campaigns, and professional use.
            </p>
            
            {!currentUser && (
              <div className="hero-cta">
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="cta-button"
                >
                  Get Started Free
                </button>
                <p className="cta-subtitle">No credit card required</p>
              </div>
            )}
          </div>
        </section>

        {currentUser ? (
          <>
            {/* URL Shortener Form */}
            <section className="shortener-section">
              <div className="container">
                <form onSubmit={handleSubmit} className="url-form">
                  <div className="form-card">
                    <div className="url-inputs">
                      <div className="input-group">
                        <label htmlFor="url-input" className="input-label">Enter your URL</label>
                        <input
                          id="url-input"
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="https://example.com/very-long-url-that-needs-shortening"
                          className="url-input"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="custom-code" className="input-label">Custom alias (optional)</label>
                        <input
                          id="custom-code"
                          type="text"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                          placeholder="my-custom-link"
                          className="custom-code-input"
                          disabled={isLoading}
                          maxLength={20}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="shorten-btn"
                      disabled={isLoading || !url.trim()}
                    >
                      {isLoading ? (
                        <>
                          <div className="spinner"></div>
                          Shortening...
                        </>
                      ) : (
                        <>
                          <Link size={18} />
                          Shorten URL
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* URL List */}
            {shortenedUrls.length > 0 && (
              <section className="url-list-section">
                <div className="container">
                  <div className="section-header">
                    <h2>Your Shortened URLs</h2>
                    <span className="url-count">{shortenedUrls.length} links</span>
                  </div>
                  <div className="url-grid">
                    {shortenedUrls.map((item) => (
                      <div key={item.id} className="url-card">
                        <div className="url-card-header">
                          <div className="original-url">
                            <span className="url-label">Original:</span>
                            <span className="url-text">{item.originalUrl}</span>
                          </div>
                          {item.isCustom && <span className="custom-badge">Custom</span>}
                        </div>
                        
                        <div className="short-url-container">
                          <div className="short-url">
                            <span className="url-label">Short:</span>
                            <span className="url-text">{item.shortUrl}</span>
                          </div>
                          <div className="url-actions">
                            <button
                              onClick={() => handleCopy(item.shortUrl)}
                              className="action-btn copy-btn"
                              title="Copy to clipboard"
                            >
                              <Copy size={16} />
                            </button>
                            <QRCodeDisplay 
                              url={item.shortUrl} 
                              shortCode={item.shortCode}
                            />
                            <button
                              onClick={() => {
                                handleShortUrlClick(item.id)
                                window.open(item.originalUrl, '_blank')
                              }}
                              className="action-btn visit-btn"
                              title="Visit original URL"
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="action-btn delete-btn"
                              title="Delete URL"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="url-stats">
                          <div className="stat">
                            <BarChart3 size={14} />
                            <span>{item.clicks} clicks</span>
                          </div>
                          <div className="stat">
                            <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {shortenedUrls.length === 0 && (
              <section className="empty-state-section">
                <div className="container">
                  <div className="empty-state">
                    <Link size={64} color="#646cff" />
                    <h3>No shortened URLs yet</h3>
                    <p>Create your first shortened URL using the form above!</p>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            {/* Features Section */}
            <section id="features" className="features-section">
              <div className="container">
                <h2 className="section-title">Why Choose LinkShort?</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Zap size={32} />
                    </div>
                    <h3>Lightning Fast</h3>
                    <p>Generate shortened URLs instantly with our optimized platform. No waiting, no delays.</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <BarChart3 size={32} />
                    </div>
                    <h3>Detailed Analytics</h3>
                    <p>Track clicks, monitor performance, and gain insights into your link engagement.</p>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon">
                      <Shield size={32} />
                    </div>
                    <h3>Secure & Reliable</h3>
                    <p>Your data is safe with us. Enterprise-grade security for all your shortened links.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Terms of Service Section */}
            <section id="terms" className="terms-section">
              <div className="container">
                <h2 className="section-title">Terms of Service</h2>
                <div className="terms-content">
                  <div className="terms-card">
                    <h3>Acceptable Use</h3>
                    <p>LinkShort may only be used for legitimate purposes. Prohibited uses include spam, malware distribution, phishing, or any illegal activities.</p>
                  </div>
                  <div className="terms-card">
                    <h3>Data Privacy</h3>
                    <p>We respect your privacy. Your shortened URLs and analytics data are stored securely and are not shared with third parties.</p>
                  </div>
                  <div className="terms-card">
                    <h3>Service Availability</h3>
                    <p>While we strive for 99.9% uptime, LinkShort is provided "as is" without warranties. We reserve the right to modify or discontinue features.</p>
                  </div>
                  <div className="terms-card">
                    <h3>Account Responsibility</h3>
                    <p>You are responsible for maintaining the security of your account and all activities that occur under your account.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
              <div className="container">
                <div className="cta-content">
                  <h2>Ready to get started?</h2>
                  <p>Join thousands of users who trust LinkShort for their URL shortening needs.</p>
                  <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="cta-button"
                  >
                    Create Free Account
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <Link size={24} color="#646cff" />
                <span className="logo-text">LinkShort</span>
              </div>
              <p>The professional URL shortener for modern teams.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#terms">Terms of Service</a>
                <a href="#api">API</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <a href="#careers">Careers</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#docs">Documentation</a>
                <a href="#status">Status</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 LinkShort. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
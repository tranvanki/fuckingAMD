import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, Save, X } from 'lucide-react'

const QRCodeDisplay = ({ url, shortCode }) => {
  const [showQR, setShowQR] = useState(false)
  const [qrSize, setQrSize] = useState(200)

  useEffect(() => {
    const updateQrSize = () => {
      if (window.innerWidth <= 768) {
        setQrSize(160)
      } else {
        setQrSize(200)
      }
    }

    updateQrSize()
    window.addEventListener('resize', updateQrSize)
    return () => window.removeEventListener('resize', updateQrSize)
  }, [])

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${shortCode}`)
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `qr-${shortCode}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (!showQR) {
    return (
      <button
        onClick={() => setShowQR(true)}
        className="action-btn qr-btn"
        title="Show QR Code"
      >
        <QrCode size={16} />
      </button>
    )
  }

  return (
    <div className="qr-modal-overlay" onClick={() => setShowQR(false)}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h3>QR Code for {url}</h3>
          <div className="qr-modal-actions-header">
            <button
              onClick={downloadQR}
              className="qr-save-btn"
              title="Save QR Code"
            >
              <Save size={16} />
            </button>
            <button
              onClick={() => setShowQR(false)}
              className="qr-modal-close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="qr-code-container">
          <QRCode
            id={`qr-${shortCode}`}
            value={url}
            size={qrSize}
            style={{ 
              height: `${qrSize}px`, 
              width: `${qrSize}px`,
              display: 'block'
            }}
            viewBox="0 0 256 256"
            level="M"
          />
        </div>
      </div>
    </div>
  )
}

export default QRCodeDisplay
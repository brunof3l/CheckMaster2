import React from 'react'

export default function SimpleModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0 as any, zIndex: 60 }}>
      <div
        style={{ position: 'absolute', inset: 0 as any, background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          margin: '6vh auto',
          maxWidth: 900,
          background: '#0b0f13',
          padding: 24,
          borderRadius: 14,
        }}
      >
        {title && <h3>{title}</h3>}
        <div style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          {children}
        </div>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
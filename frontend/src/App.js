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
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh', zIndex: 999999,
            background: '#1a1030',
            overflow: 'hidden',
            fontFamily: 'Montserrat, sans-serif',
            animation: 'aacdFadeIn 0.4s ease',
          }}
        >
          <div
            data-testid="home-donate-modal"
            style={{ position: 'absolute', inset: 0 }}
          >
            <img
              src="/images/teleton-bg.webp"
              alt="Camila Vitória, paciente da AACD"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(10,6,20,0.78) 0%, rgba(10,6,20,0.35) 38%, rgba(10,6,20,0.15) 60%, rgba(10,6,20,0.55) 100%)',
            }} />

            <button
              data-testid="home-donate-modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Fechar"
              style={{
                position: 'absolute', top: '18px', right: '20px', zIndex: 5,
                width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
                color: '#fff', fontSize: '24px', lineHeight: 1, cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.32)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
            >
              ×
            </button>

            <img
              src="/images/aacd-teleton-logo.png"
              alt="AACD Teleton"
              style={{
                position: 'absolute', top: '32px', left: '5vw', zIndex: 3,
                width: 'clamp(150px, 16vw, 240px)', height: 'auto',
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.4))',
              }}
            />

            <div style={{
              position: 'absolute', zIndex: 3,
              left: '5vw', bottom: 'clamp(48px, 12vh, 140px)',
              maxWidth: '620px', color: '#fff',
            }}>
              <h1 style={{
                margin: 0, fontWeight: 800, color: '#fff',
                fontSize: 'clamp(40px, 7vw, 84px)', lineHeight: 0.95,
                letterSpacing: '-1px', textShadow: '0 2px 24px rgba(0,0,0,0.45)',
              }}>
                O QUE TE MOVE?
              </h1>
              <p style={{
                margin: '6px 0 0', fontWeight: 400, color: '#f1e9ff',
                fontSize: 'clamp(22px, 3.4vw, 40px)', lineHeight: 1,
                textShadow: '0 2px 18px rgba(0,0,0,0.45)',
              }}>
                levar futuro
              </p>

              <button
                data-testid="home-donate-modal-cta"
                onClick={handleModalDonate}
                style={{
                  marginTop: 'clamp(24px, 4vh, 40px)',
                  border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #f7971e 0%, #eb1941 100%)',
                  color: '#fff', fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
                  fontSize: 'clamp(16px, 1.6vw, 20px)', textTransform: 'uppercase',
                  letterSpacing: '0.5px', padding: '16px 48px', borderRadius: '999px',
                  boxShadow: '0 12px 32px rgba(235,25,65,0.45)',
                  transition: 'transform 0.15s ease, filter 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
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
            zIndex: 999990,
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
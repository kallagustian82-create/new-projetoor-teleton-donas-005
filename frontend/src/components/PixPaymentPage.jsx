import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const API = '/api';

const SuccessPage = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12" data-testid="success-page">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Left - Girl celebrating image */}
          <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 relative">
            <img
              src="https://customer-assets.emergentagent.com/job_f5bcd7a8-9528-443f-93d7-f900fc3f2ceb/artifacts/d8uqctuo_menina-comemorando.png"
              alt="Celebracao"
              className="w-full h-full object-contain"
              data-testid="success-image"
            />
          </div>

          {/* Right - Text and sharing */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight" style={{ fontFamily: "'Nunito', sans-serif" }} data-testid="success-title">
              Sua colaboração foi realizada com sucesso!
            </h1>

            <p className="text-base md:text-lg text-gray-600 mb-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Compartilhe com seus amigos e ajude ainda mais essa campanha a decolar:
            </p>

            {/* Social Icons - decorative only */}
            <div className="flex items-center gap-4 mb-8" data-testid="social-share-icons">
              <div className="w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#3b5998">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10" fill="#1DA1F2">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#e53e3e" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
            </div>

            {/* Doar novamente link */}
            <button
              onClick={() => navigate('/')}
              className="text-pink-600 underline text-base hover:text-pink-800 transition-colors"
              data-testid="donate-again-link"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Doar novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PixPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const donParam = searchParams.get('don');
  const donor = location.state?.donor || null;
  const taxDeduction = location.state?.taxDeduction || false;
  const institution = location.state?.institution || '';

  const [donationValue, setDonationValue] = useState(location.state?.value || 50);
  const [timer, setTimer] = useState(300);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [donationId, setDonationId] = useState(null);
  const [pixCode, setPixCode] = useState('');
  const [loadingPix, setLoadingPix] = useState(true);
  const [pixError, setPixError] = useState('');
  const endTimeRef = useRef(Date.now() + 300 * 1000);

  // Buscar codigo PIX do backend
  const hasCreated = useRef(false);
  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    // Fluxo via link do e-mail: reconstruir sessao a partir do donation_id
    const loadExistingDonation = async () => {
      try {
        const res = await axios.get(`${API}/admin/donation/${donParam}`);
        setDonationValue(res.data.value);
        setPixCode(res.data.pix_code);
        setDonationId(res.data.donation_id);
        setLoadingPix(false);
      } catch (error) {
        setPixError('Doação não encontrada ou expirada. Faça uma nova doação.');
        setLoadingPix(false);
      }
    };

    const fetchPixCode = async () => {
      try {
        const response = await axios.get(`${API}/admin/pix/generate`, {
          params: { value: donationValue }
        });
        const code = response.data.pix_code;
        setPixCode(code);
        setLoadingPix(false);

        // Registrar doacao
        try {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          const donRes = await axios.post(`${API}/admin/donations`, {
            value: donationValue,
            pix_code: code,
            donor_name: donor?.name || '',
            donor_document: donor?.document || '',
            donor_phone: donor?.phone || '',
            donor_email: donor?.email || '',
            device: isMobile ? 'Mobile' : 'Desktop',
            tax_deduction: taxDeduction,
            origin: institution || window.location.hostname
          });
          setDonationId(donRes.data.donation_id);
        } catch (err) {
          // Error handling for donation registration
        }
      } catch (error) {
        // Error handled by pixError state
        setPixError('Chave PIX não configurada. Contate o administrador.');
        setLoadingPix(false);
      }
    };

    if (donParam) {
      loadExistingDonation();
    } else {
      fetchPixCode();
    }
  }, [donationValue, donParam]);

  // Timer countdown using real timestamps (works even when tab is backgrounded on mobile)
  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setTimer(remaining);
    };

    const interval = setInterval(updateTimer, 1000);

    // Multiple event listeners to catch ALL mobile resume scenarios
    const handleResume = () => updateTimer();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleResume);
    window.addEventListener('pageshow', handleResume);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('pageshow', handleResume);
    };
  }, []);

  // Show success page when timer ends AND code was copied
  useEffect(() => {
    if (timer === 0 && copied) {
      setShowSuccess(true);
    }
  }, [timer, copied]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [copiedVisual, setCopiedVisual] = useState(false);

  const handleCopyCode = async () => {
    // Copy com fallback para contextos nao seguros (HTTP)
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pixCode);
        ok = true;
      } else {
        // Fallback classico usando textarea invisivel + execCommand
        const ta = document.createElement('textarea');
        ta.value = pixCode;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, pixCode.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch (e) {
      ok = false;
    }

    if (ok) {
      setCopied(true);
      setCopiedVisual(true);
      setTimeout(() => setCopiedVisual(false), 2000);

      if (donationId) {
        try {
          await axios.patch(`${API}/admin/donations/${donationId}`, { copied: true });
        } catch (error) {
          // Status update error - non-critical
        }
      }
    } else {
      // Se ainda assim falhar, selecionamos o texto para o usuario copiar manualmente
      alert('Nao foi possivel copiar automaticamente. O codigo foi selecionado — pressione Ctrl+C (ou toque em Copiar) para copiar manualmente.');
    }
  };

  const handleSendEmail = () => {
    alert('QR Code sera enviado para seu e-mail');
  };

  if (showSuccess) {
    return <SuccessPage navigate={navigate} />;
  }

  if (pixError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12" data-testid="pix-error-page">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8">
              <p className="text-red-600 text-lg font-semibold mb-4" data-testid="pix-error-message">{pixError}</p>
              <Button
                onClick={() => navigate(-1)}
                className="bg-pink-500 text-white hover:bg-pink-600 rounded-full px-8 py-3"
                data-testid="pix-error-back-button"
              >
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f4f4', fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, sans-serif" }} data-testid="pix-payment-page">
      {/* AACD Header */}
      <header
        className="border-b border-gray-200"
        style={{ background: 'linear-gradient(to right, #ffffff 0%, #ffffff 30%, #d9efef 100%)' }}
      >
        <div className="container mx-auto px-4 md:px-10 py-3">
          <a href="/" className="inline-flex items-center" data-testid="aacd-logo-link">
            <img
              src="https://aacd.vtexassets.com/assets/vtex/assets-builder/aacd.store/0.0.49/logo-aacd___07c4f535c1d9859db0b880c512993be9.png"
              alt="AACD - vida é movimento"
              style={{ height: '52px', width: 'auto', display: 'block' }}
            />
          </a>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Title block */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-extrabold leading-tight" style={{ color: '#323232' }}>
              Falta pouco! Sua colaboração será confirmada após a transferência PIX
            </h1>
            <div className="h-1 w-16 mt-3 mb-4 rounded-full" style={{ backgroundColor: '#eb1941' }}></div>
            <p className="text-sm md:text-base text-gray-600">
              Escolha uma das opções para concluir seu pagamento de{' '}
              <span className="font-bold" style={{ color: '#eb1941' }}>
                R$ {donationValue.toFixed(2).replace('.', ',')}
              </span>
            </p>
          </div>

          {/* Timer card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wider font-semibold">
                Aguardando pagamento
              </p>
              <p className="text-3xl md:text-4xl font-extrabold mt-1" style={{ color: '#323232' }} data-testid="pix-timer">
                {formatTime(timer)}
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xs"
              style={{ backgroundColor: '#eb1941' }}
              aria-hidden="true"
            >
              PIX
            </div>
          </div>

          {/* Two Columns Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {/* Left Column - QR Code */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-extrabold mb-5" style={{ color: '#323232' }}>QR Code</h2>

              <ol className="space-y-2.5 mb-5 text-gray-700 text-sm">
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>1.</span>
                  <span>Abra o aplicativo ou site do seu banco pelo celular</span>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>2.</span>
                  <span>Entre no PIX e selecione <span className="font-bold">pagar com QR Code</span></span>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>3.</span>
                  <span>Escaneie o QR Code abaixo e confirme o pagamento</span>
                </li>
              </ol>

              {/* QR Code Real */}
              <div className="bg-gray-50 rounded-xl p-5 flex justify-center mb-3" data-testid="qr-code-container">
                {loadingPix ? (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={pixCode}
                    size={220}
                    level="M"
                    includeMargin={true}
                    data-testid="qr-code-svg"
                  />
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">Código válido por 24hrs</p>
            </div>

            {/* Right Column - PIX Copia e Cola */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-extrabold mb-5" style={{ color: '#323232' }}>PIX copia e cola</h2>

              <div className="mb-5">
                <p className="flex mb-3 text-sm">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>1.</span>
                  <span className="text-gray-700">Copie o código abaixo</span>
                </p>

                <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Código</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-2 mb-1" data-testid="pix-code-container">
                  {loadingPix ? (
                    <div className="flex-1 flex items-center justify-center py-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-700 break-all flex-1 font-mono leading-relaxed" data-testid="pix-code-text">
                        {pixCode}
                      </p>
                      <button
                        onClick={handleCopyCode}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:brightness-110"
                        style={{ backgroundColor: '#eb1941' }}
                        data-testid="copy-pix-code-button"
                        aria-label="Copiar código PIX"
                      >
                        {copiedVisual ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <ol className="space-y-2.5 mb-5 text-gray-700 text-sm">
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>2.</span>
                  <span>Abra o aplicativo ou site do seu banco</span>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>3.</span>
                  <span>Entre no PIX e selecione <span className="font-bold">PIX copia e cola</span></span>
                </li>
                <li className="flex">
                  <span className="font-bold mr-2" style={{ color: '#eb1941' }}>4.</span>
                  <span>Cole o código e confirme o pagamento</span>
                </li>
              </ol>

              <p className="text-xs text-gray-500 mb-5">Código válido por 24hrs</p>

              {/* QR Code mobile (aparece apenas no mobile) */}
              <div className="md:hidden bg-gray-50 rounded-xl p-5 flex justify-center mb-5" data-testid="qr-code-mobile">
                {!loadingPix && (
                  <QRCodeSVG
                    value={pixCode}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                )}
              </div>

              <Button
                onClick={() => navigate('/')}
                className="w-full bg-transparent hover:bg-pink-50 py-4 text-sm font-bold uppercase tracking-wide transition-all duration-200"
                style={{
                  borderRadius: '8px',
                  border: '2px solid #eb1941',
                  color: '#eb1941',
                  letterSpacing: '1px'
                }}
                data-testid="donate-again-button"
              >
                Doar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentPage;

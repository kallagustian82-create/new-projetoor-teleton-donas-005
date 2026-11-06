import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, RefreshCw, DollarSign, TrendingUp, Copy, Trash2, X, Send, Settings, LayoutDashboard, Eye, Download, Zap, HelpCircle, Save, ExternalLink, Mail } from 'lucide-react';

const API = '/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ total_value: 0, total_donations: 0, copied_count: 0, copied_value: 0 });
  const [pixKey, setPixKey] = useState('');
  const [newPixKey, setNewPixKey] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [city, setCity] = useState('');
  const [savingPix, setSavingPix] = useState(false);
  const [pixSaveStatus, setPixSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [modal, setModal] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [savingTg, setSavingTg] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState('');
  const [detectingTelegram, setDetectingTelegram] = useState(false);
  const [visits, setVisits] = useState([]);
  const [visitsTotal, setVisitsTotal] = useState(0);
  const [visitsModal, setVisitsModal] = useState(false);
  const [originFilter, setOriginFilter] = useState('all');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [confirmReminders, setConfirmReminders] = useState(false);

  const token = localStorage.getItem('admin_token');

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [donationsRes, statsRes, configRes, telegramRes, visitsRes] = await Promise.all([
        axios.get(`${API}/admin/donations`, { headers }),
        axios.get(`${API}/admin/stats`, { headers }),
        axios.get(`${API}/admin/config`, { headers }),
        axios.get(`${API}/admin/config/telegram`, { headers }).catch(() => ({ data: { chat_id: '', bot_token: '', enabled: true } })),
        axios.get(`${API}/admin/visits`, { headers }).catch(() => ({ data: [] }))
      ]);
      setDonations(donationsRes.data);
      setStats(statsRes.data);
      setPixKey(configRes.data.pix_key || '');
      setNewPixKey(configRes.data.pix_key || '');
      setBeneficiaryName(configRes.data.beneficiary_name || '');
      setCity(configRes.data.city || '');
      setTelegramChatId(telegramRes.data.chat_id || '');
      setTelegramBotToken(telegramRes.data.bot_token || '');
      setTelegramEnabled(telegramRes.data.enabled !== false);
      setVisits(visitsRes.data.visits || []);
      setVisitsTotal(visitsRes.data.total || 0);
      setLoading(false);
      setLastUpdate(new Date());
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        navigate('/donaspainel');
      }
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) { navigate('/donaspainel'); return; }
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [token, navigate, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/donaspainel');
  };

  const handleUpdatePixKey = async () => {
    setSavingPix(true);
    setPixSaveStatus('');
    try {
      await axios.put(`${API}/admin/config/pix-key`, {
        pix_key: newPixKey,
        beneficiary_name: beneficiaryName,
        city: city,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPixKey(newPixKey);
      setPixSaveStatus('Chave PIX salva com sucesso!');
      setTimeout(() => setPixSaveStatus(''), 3000);
    } catch (error) {
      setPixSaveStatus('Erro ao salvar');
    }
    setSavingPix(false);
  };

  const handleSaveTelegram = async () => {
    setSavingTg(true);
    setTelegramStatus('');
    try {
      await axios.put(`${API}/admin/config/telegram`, {
        chat_id: telegramChatId,
        bot_token: telegramBotToken,
        enabled: telegramEnabled,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setTelegramStatus('Configurações do Telegram salvas!');
      setTimeout(() => setTelegramStatus(''), 3000);
    } catch (err) {
      setTelegramStatus(err.response?.data?.detail || 'Erro ao salvar');
    }
    setSavingTg(false);
  };

  const handleClearData = async () => {
    try {
      await axios.delete(`${API}/admin/donations`, { headers: { Authorization: `Bearer ${token}` } });
      setConfirmClear(false);
      fetchData();
    } catch (error) { console.error('Erro ao limpar dados'); }
  };

  const handleDeleteDonation = async (donationId) => {
    try {
      await axios.delete(`${API}/admin/donations/${donationId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (error) { console.error('Erro ao remover doação'); }
  };

  const handleSendReminders = async () => {
    setConfirmReminders(false);
    setSendingReminders(true);
    setReminderResult(null);
    try {
      const res = await axios.post(`${API}/admin/send-reminders`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setReminderResult({ success: true, ...res.data });
    } catch (error) {
      setReminderResult({ success: false, message: error.response?.data?.detail || 'Erro ao enviar lembretes' });
    }
    setSendingReminders(false);
  };

  const handleDetectTelegram = async () => {
    setDetectingTelegram(true);
    setTelegramStatus('');
    try {
      const res = await axios.post(`${API}/admin/config/telegram/detect`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTelegramChatId(res.data.chat_id);
      setTelegramStatus(res.data.message);
    } catch (err) {
      setTelegramStatus(err.response?.data?.detail || 'Erro ao detectar grupo');
    }
    setDetectingTelegram(false);
  };

  const handleTestTelegram = async () => {
    try {
      await axios.post(`${API}/admin/config/telegram/test`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTelegramStatus('Mensagem de teste enviada!');
    } catch (err) {
      setTelegramStatus(err.response?.data?.detail || 'Erro ao enviar teste');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR');

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const copiedDonations = donations.filter(d => d.copied);
  const origins = [...new Set(donations.map(d => d.origin).filter(Boolean))];
  const filteredDonations = originFilter === 'all' ? donations : donations.filter(d => d.origin === originFilter);

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-gray-50">
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">{modal.title}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600" data-testid="modal-close-button"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {modal.items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum registro encontrado</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Nome</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Valor</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.items.map((d, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm text-gray-700">{d.donor_name || <span className="text-gray-400 italic">Anônimo</span>}</td>
                        <td className="py-2 px-3 font-bold text-pink-500 text-sm">{formatCurrency(d.value)}</td>
                        <td className="py-2 px-3 text-sm text-gray-500">{formatDate(d.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {modal.items.length > 0 && (
                <div className="border-t-2 border-gray-200 mt-3 pt-3 text-right">
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="font-bold text-pink-500 text-lg">{formatCurrency(modal.items.reduce((sum, d) => sum + d.value, 0))}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visits Modal */}
      {visitsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setVisitsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">Últimos Acessos</h3>
              <button onClick={() => setVisitsModal(false)} className="text-gray-400 hover:text-gray-600" data-testid="visits-modal-close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {visits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum acesso registrado</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Dispositivo</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Data/Hora</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">IP</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Local</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.map((v, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm">
                          {v.device === 'Mobile' ? (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">Mobile</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">Desktop</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-500">{formatDate(v.created_at)}</td>
                        <td className="py-2 px-3 text-sm text-gray-700 font-mono">{v.ip || '-'}</td>
                        <td className="py-2 px-3 text-sm text-gray-700">{v.location || '-'}</td>
                        <td className="py-2 px-3 text-sm">
                          {v.origin ? (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">{v.origin}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {visits.length > 0 && (
              <div className="p-4 border-t flex justify-end">
                <Button onClick={async () => { await axios.delete(`${API}/admin/visits`, { headers: { Authorization: `Bearer ${token}` } }); setVisits([]); setVisitsTotal(0); }} className="bg-gray-500 text-white hover:bg-gray-600 rounded-lg px-4 py-2 flex items-center gap-2 text-sm" data-testid="clear-visits-button">
                  <Trash2 className="w-4 h-4" /> Limpar acessos
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Reminder result modal */}
      {reminderResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReminderResult(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()} data-testid="reminder-result-modal">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${reminderResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
              <Mail className={`w-7 h-7 ${reminderResult.success ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            {reminderResult.success ? (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Lembretes enviados!</h3>
                <p className="text-gray-600 text-sm mb-1" data-testid="reminder-result-message">
                  {reminderResult.sent} lembrete(s) enviado(s) de {reminderResult.total_recipients} doador(es) com e-mail.
                </p>
                {reminderResult.failed > 0 && (
                  <p className="text-red-500 text-xs mb-4">{reminderResult.failed} falharam no envio.</p>
                )}
                {reminderResult.total_recipients === 0 && (
                  <p className="text-gray-500 text-xs mb-4">Nenhum doador com e-mail cadastrado ainda.</p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Erro no envio</h3>
                <p className="text-gray-600 text-sm mb-4" data-testid="reminder-result-message">{reminderResult.message}</p>
              </>
            )}
            <Button onClick={() => setReminderResult(null)} className="w-full bg-gray-800 text-white hover:bg-gray-900 rounded-lg py-2.5 mt-2" data-testid="reminder-result-close">Fechar</Button>
          </div>
        </div>
      )}

      {confirmClear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmClear(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Limpar todos os dados?</h3>
            <p className="text-gray-600 text-sm mb-6">Esta ação é irreversível. Todas as doações registradas serão removidas.</p>
            <div className="flex gap-3">
              <Button onClick={handleClearData} className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-lg py-3" data-testid="confirm-clear-button">Sim, limpar tudo</Button>
              <Button onClick={() => setConfirmClear(false)} className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg py-3" data-testid="cancel-clear-button">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/aacd-favicon.png" alt="Teleton AACD" className="h-9 w-9" />
              <div className="flex flex-col leading-tight">
                <h1 className="text-lg md:text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                <span className="text-xs md:text-sm font-bold text-[#eb1941] tracking-wide">Teleton AACD</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span data-testid="last-update-time" className="text-xs text-gray-400 hidden md:block">
                  Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
                </span>
              )}
              <Button data-testid="refresh-button" onClick={fetchData} className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4" /></Button>
              <Button data-testid="logout-button" onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600 rounded-lg px-4 py-2 flex items-center gap-2">
                <LogOut className="w-4 h-4" /><span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 md:px-6 pt-4">
        <div className="flex gap-1 bg-gray-200 rounded-lg p-1 max-w-xs">
          <button
            data-testid="tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            data-testid="tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4" /> Configurações
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* ========== DASHBOARD TAB ========== */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div data-testid="stat-total-value" className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModal({ title: 'Detalhes - Total Arrecadado', items: donations })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Arrecadado</p>
                    <p data-testid="stat-total-value-amount" className="text-2xl md:text-3xl font-bold text-pink-500">{formatCurrency(stats.total_value)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-pink-500 opacity-20" />
                </div>
              </div>
              <div data-testid="stat-total-donations" className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total de Doações</p>
                    <p data-testid="stat-total-donations-count" className="text-2xl md:text-3xl font-bold text-purple-500">{stats.total_donations}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-purple-500 opacity-20" />
                </div>
              </div>
              <div data-testid="stat-copied-count" className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setModal({ title: 'Detalhes - Códigos Copiados', items: copiedDonations })}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Códigos Copiados</p>
                    <p data-testid="stat-copied-value" className="text-2xl md:text-3xl font-bold text-green-500">
                      R$ {(stats.copied_value || 0).toFixed(2).replace('.', ',')}
                    </p>
                    <p data-testid="stat-copied-count-value" className="text-xs text-gray-500 mt-1">
                      {stats.copied_count} {stats.copied_count === 1 ? 'código copiado' : 'códigos copiados'}
                    </p>
                  </div>
                  <Copy className="w-10 h-10 text-green-500 opacity-20" />
                </div>
              </div>
              <div data-testid="stat-visits" className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setVisitsModal(true)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Acessos</p>
                    <p data-testid="stat-visits-count" className="text-2xl md:text-3xl font-bold text-blue-500">{visitsTotal}</p>
                  </div>
                  <Eye className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Donations Table */}
            <div data-testid="donations-table-container" className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-bold text-gray-800">Doações Geradas</h2>
                <div className="flex items-center gap-3">
                  {origins.length > 0 && (
                    <select
                      data-testid="origin-filter"
                      value={originFilter}
                      onChange={(e) => setOriginFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-pink-500"
                    >
                      <option value="all">Todos os sites</option>
                      {origins.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                  <Button data-testid="send-reminders-button" onClick={handleSendReminders} disabled={sendingReminders} className="bg-[#eb1941] text-white hover:brightness-110 disabled:opacity-60 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Mail className={`w-4 h-4 ${sendingReminders ? 'animate-pulse' : ''}`} /> {sendingReminders ? 'Enviando...' : 'Enviar lembrete'}
                  </Button>
                  <Button data-testid="download-data-button" onClick={() => {
                    const lines = ['DADOS DOS DOADORES', '='.repeat(50), ''];
                    filteredDonations.forEach((d, i) => {
                      lines.push(`Doador #${i + 1}`);
                      lines.push(`Nome: ${d.donor_name || 'Anônimo'}`);
                      lines.push(`E-mail: ${d.donor_email || '-'}`);
                      lines.push(`Telefone: ${d.donor_phone || '-'}`);
                      lines.push(`CPF/CNPJ: ${d.donor_document || '-'}`);
                      lines.push(`Valor: R$ ${d.value?.toFixed(2)}`);
                      lines.push(`Origem: ${d.origin || '-'}`);
                      lines.push('-'.repeat(30));
                      lines.push('');
                    });
                    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'doadores.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }} className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" /> Baixar dados
                  </Button>
                  <Button data-testid="clear-data-button" onClick={() => setConfirmClear(true)} className="bg-gray-500 text-white hover:bg-gray-600 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
                    <Trash2 className="w-4 h-4" /> Limpar dados
                  </Button>
                </div>
              </div>
              <div className="scroll-top">
                <table className="min-w-[1400px] w-full" data-testid="donations-table">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nome</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">E-mail</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">CPF/CNPJ</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Telefone</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Valor</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data/Hora</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Dispositivo</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Local</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Origem</th>
                      <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.length === 0 ? (
                      <tr><td colSpan="11" data-testid="no-donations-message" className="text-center py-8 text-gray-500">Nenhuma doação registrada ainda</td></tr>
                    ) : (
                      filteredDonations.map((donation, index) => (
                        <tr key={donation.donation_id || index} data-testid={`donation-row-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                            {donation.donor_name ? (
                              donation.tax_deduction ? <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{donation.donor_name}</span> : donation.donor_name
                            ) : <span className="text-gray-400 italic">Anônimo</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{donation.donor_email || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{donation.donor_document || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{donation.donor_phone || '-'}</td>
                          <td className="py-3 px-4 whitespace-nowrap"><span className="font-bold text-pink-500">{formatCurrency(donation.value)}</span></td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {donation.copied ? (
                              <span data-testid={`donation-status-copied-${index}`} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Copiado</span>
                            ) : (
                              <span data-testid={`donation-status-pending-${index}`} className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">Pendente</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">{formatDate(donation.created_at)}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {donation.device?.includes('Mobile') ? (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Mobile</span>
                            ) : donation.device?.includes('Desktop') ? (
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">Desktop</span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                            {donation.location || (donation.device?.includes(' - ') ? donation.device.split(' - ').slice(1).join(' - ') : '-')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                            {donation.origin ? (
                              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">{donation.origin}</span>
                            ) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="py-3 px-2 whitespace-nowrap">
                            <button
                              data-testid={`delete-donation-${index}`}
                              onClick={() => handleDeleteDonation(donation.donation_id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <p data-testid="auto-refresh-indicator" className="text-center text-sm text-gray-500 mt-4">Atualização automática a cada 60 segundos</p>
          </>
        )}

        {/* ========== SETTINGS TAB ========== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Header da secao */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Configurações</h1>
              <p className="text-gray-500 text-sm">Configure a chave PIX e as notificações do Telegram.</p>
            </div>

            {/* Chave PIX Config */}
            <div data-testid="pix-key-config" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chave PIX</h2>
                  <p className="text-sm text-gray-500 mt-1">Cadastre a chave PIX que vai receber as doações.<br />Aceita CPF, CNPJ, e-mail, telefone ou chave aleatória.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">CHAVE PIX <span className="text-pink-500">*</span></label>
                  <input
                    data-testid="pix-key-input"
                    type="text"
                    value={newPixKey}
                    onChange={(e) => setNewPixKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors font-mono text-sm"
                    placeholder="ex: seuemail@dominio.com ou 12345678900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">NOME DO BENEFICIÁRIO</label>
                    <input
                      data-testid="pix-name-input"
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors text-sm"
                      placeholder="ex: AACD"
                      maxLength={25}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">CIDADE</label>
                    <input
                      data-testid="pix-city-input"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors text-sm"
                      placeholder="ex: Porto Alegre RS"
                      maxLength={15}
                    />
                  </div>
                </div>

                {pixSaveStatus && (
                  <p className={`text-sm ${pixSaveStatus.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>{pixSaveStatus}</p>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    data-testid="pix-key-save-button"
                    onClick={handleUpdatePixKey}
                    disabled={savingPix}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {savingPix ? 'Salvando...' : 'Salvar chave PIX'}
                  </button>
                </div>
              </div>
            </div>

            {/* Telegram Config */}
            <div data-testid="telegram-config" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notificações Telegram</h2>
                  <p className="text-sm text-gray-500 mt-1">Receba uma mensagem no seu bot/grupo do Telegram sempre que uma nova doação for gerada.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">BOT TOKEN <span className="text-pink-500">*</span></label>
                  <input
                    data-testid="telegram-token-input"
                    type="text"
                    value={telegramBotToken === '__ENV__' ? '' : telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors font-mono text-sm"
                    placeholder={telegramBotToken === '__ENV__' ? '••• Configurado via variável de ambiente •••' : 'ex: 8389464233:AAH0K9sNTDdDiX0...'}
                  />
                  {telegramBotToken === '__ENV__' && (
                    <p className="text-xs text-gray-500 mt-1">O token está configurado no servidor. Digite um novo para substituir.</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-2">CHAT ID (GRUPO OU USUÁRIO) <span className="text-pink-500">*</span></label>
                  <input
                    data-testid="telegram-chat-id-input"
                    type="text"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 focus:outline-none transition-colors font-mono text-sm"
                    placeholder="ex: -1003742872851"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 tracking-wider mb-3">STATUS DAS NOTIFICAÇÕES</label>
                  <div className="flex items-center gap-3">
                    <button
                      data-testid="telegram-toggle"
                      onClick={() => setTelegramEnabled(!telegramEnabled)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${telegramEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${telegramEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-xs font-bold tracking-wider ${telegramEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {telegramEnabled ? 'ATIVO — VOCÊ RECEBERÁ NOTIFICAÇÃO A CADA NOVA DOAÇÃO' : 'INATIVO — NOTIFICAÇÕES DESLIGADAS'}
                    </span>
                  </div>
                </div>

                {/* Caixa de instrucoes */}
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-bold text-purple-900">Como obter Bot Token e Chat ID?</h4>
                  </div>
                  <ol className="text-sm text-purple-900 space-y-2 pl-1">
                    <li><span className="font-bold">1.</span> Crie um bot conversando com <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">@BotFather</code> no Telegram (comando <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">/newbot</code>) — ele te dará o <b>Bot Token</b>.</li>
                    <li><span className="font-bold">2.</span> Adicione o bot ao seu <b>grupo</b> e envie qualquer mensagem.</li>
                    <li><span className="font-bold">3.</span> Acesse <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs break-all">https://api.telegram.org/bot&lt;SEU_TOKEN&gt;/getUpdates</code> no navegador.</li>
                    <li><span className="font-bold">4.</span> Copie o valor de <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">chat.id</code> (grupos começam com sinal de menos, ex.: <code className="bg-purple-100 px-1.5 py-0.5 rounded text-xs">-100...</code>).</li>
                    <li><span className="font-bold">5.</span> Cole os valores acima e clique em <b>Salvar</b>.</li>
                  </ol>
                </div>

                {telegramStatus && (
                  <p className={`text-sm ${telegramStatus.toLowerCase().includes('sucesso') || telegramStatus.toLowerCase().includes('salv') || telegramStatus.toLowerCase().includes('detect') || telegramStatus.toLowerCase().includes('enviad') ? 'text-green-600' : 'text-red-600'}`}>
                    {telegramStatus}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <button
                    data-testid="telegram-detect-button"
                    onClick={handleDetectTelegram}
                    disabled={detectingTelegram}
                    className="inline-flex items-center justify-center gap-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 font-semibold rounded-lg px-4 py-2.5 transition-colors text-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${detectingTelegram ? 'animate-spin' : ''}`} />
                    {detectingTelegram ? 'Detectando...' : 'Detectar grupo'}
                  </button>
                  <button
                    data-testid="telegram-test-button"
                    onClick={handleTestTelegram}
                    className="inline-flex items-center justify-center gap-2 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-lg px-4 py-2.5 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Testar envio
                  </button>
                  <button
                    data-testid="telegram-save-button"
                    onClick={handleSaveTelegram}
                    disabled={savingTg}
                    className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-lg px-5 py-2.5 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    {savingTg ? 'Salvando...' : 'Salvar Telegram'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

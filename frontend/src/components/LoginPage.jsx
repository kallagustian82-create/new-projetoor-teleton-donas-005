import React, { useState } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = '/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_username', response.data.username);
      navigate('/donaspainel/dashboard');
    } catch (err) {
      setError('Credenciais invalidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="min-h-screen bg-gradient-to-br from-[#eb1941] via-[#c21338] to-[#7a0c22] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/aacd-favicon.png" alt="Teleton AACD" className="h-16 w-16 mb-3" data-testid="login-logo" />
          <h1 className="text-2xl font-bold text-gray-800 text-center">Painel Administrativo</h1>
          <p className="text-[#eb1941] font-bold text-center mt-1 tracking-wide">Teleton AACD</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuario
            </label>
            <input
              data-testid="login-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#eb1941] focus:outline-none transition-colors"
              placeholder="Digite seu usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Senha
            </label>
            <input
              data-testid="login-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-[#eb1941] focus:outline-none transition-colors"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div data-testid="login-error-message" className="bg-red-50 border-2 border-red-500 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            data-testid="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-[#eb1941] text-white hover:bg-[#c21338] rounded-lg py-3 font-semibold transition-all duration-300 hover:scale-105"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

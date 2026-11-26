import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/ui';

export default function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    setResetUrl('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.get('email') });
      setMessage(response.data.message);
      setResetUrl(response.data.resetUrl || '');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not request a password reset. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page"><section className="auth-card">
    <span className="eyebrow">ACCOUNT RECOVERY</span><h1>Forgot your password?</h1>
    <p>Enter the email address on your account and we’ll send instructions to reset your password.</p>
    <form onSubmit={submit}>
      <Input label="Email address" name="email" type="email" autoComplete="email" maxLength="254" required />
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      {resetUrl && <p className="reset-link-notice">Local development reset link: <a href={resetUrl}>Open password reset</a></p>}
      <button className="button button-dark button-wide" disabled={busy}>{busy ? 'Sending…' : 'Send reset instructions'}</button>
    </form>
    <p className="auth-switch"><Link to="/login">Back to sign in</Link></p>
  </section></main>;
}

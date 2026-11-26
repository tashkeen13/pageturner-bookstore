import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    const password = data.get('password');
    if (password !== data.get('confirmPassword')) {
      setError('The passwords do not match.');
      setBusy(false);
      return;
    }
    try {
      await api.post('/auth/reset-password', { token, password });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Could not reset your password. Request a new link and try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page"><section className="auth-card">
    <span className="eyebrow">ACCOUNT RECOVERY</span><h1>Choose a new password.</h1>
    {complete ? <><p className="form-success" role="status">Your password has been reset. You can now sign in.</p><Link className="button button-dark button-wide reset-signin" to="/login">Go to sign in</Link></> : <>
      <p>Choose a new password with at least 8 characters.</p>
      <form onSubmit={submit}>
        <label>New password<input name="password" type="password" autoComplete="new-password" minLength="8" maxLength="72" required /></label>
        <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" maxLength="72" required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark button-wide" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
      </form>
      <p className="auth-switch"><Link to="/forgot-password">Request a new reset link</Link></p>
    </>}
  </section></main>;
}

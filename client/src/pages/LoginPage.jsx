import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Input, PasswordField } from '../components/ui';

// Keep account recovery reachable directly from the sign-in form.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const user = await login({ email: form.get('email'), password: form.get('password') });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Could not reach the sign-in service. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">WELCOME BACK</span><h1>Good to see you.</h1><p>Sign in to pick up where your next story begins.</p><form onSubmit={submit}><Input label="Email address" name="email" type="email" autoComplete="email" maxLength="254" required /><PasswordField name="password" autoComplete="current-password" minLength="8" required />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="forgot-password-link"><Link to="/forgot-password">Forgot password?</Link></p></form><p className="auth-switch">New to PageTurner? <Link to="/register" state={location.state}>Create an account</Link></p></section></main>;
}

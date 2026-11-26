import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { PasswordField } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const password = form.get('password');
    if (password !== form.get('confirmPassword')) {
      setError('Those passwords do not match.');
      setBusy(false);
      return;
    }
    try {
      await register({ name: form.get('name'), email: form.get('email'), password });
      toast.success('Your account is ready. Happy reading!');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Account creation failed.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="auth-page"><section className="auth-card"><span className="eyebrow">JOIN OUR LITTLE BOOKSHOP</span><h1>Make yourself at home.</h1><p>Create an account and keep your favorite reads close.</p><form onSubmit={submit}><label>Your name<input name="name" autoComplete="name" minLength="2" maxLength="80" required /></label><label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required /></label><PasswordField name="password" label="Password" autoComplete="new-password" minLength="8" maxLength="72" required /><PasswordField name="confirmPassword" label="Confirm password" autoComplete="new-password" minLength="8" maxLength="72" required />{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></form><p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Sign in</Link></p></section></main>;
}

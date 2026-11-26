import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [details, setDetails] = useState({ name: user?.name || '', email: user?.email || '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [savedAddresses, setSavedAddresses] = useState(user?.savedAddresses || []);
  const [addressDraft, setAddressDraft] = useState({ label: 'Home', fullName: user?.name || '', address: '', city: '', postalCode: '', country: '' });
  const [addressBusy, setAddressBusy] = useState(false);
  const [editingAddress, setEditingAddress] = useState(-1);

  useEffect(() => {
    let active = true;
    api.get('/users/profile')
      .then(response => {
        if (!active) return;
        updateUser(response.data.user);
        setDetails({ name: response.data.user.name, email: response.data.user.email });
        setSavedAddresses(response.data.user.savedAddresses || []);
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || 'We could not load your profile. Please try again.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [updateUser]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await api.patch('/users/profile', { ...details, savedAddresses });
      updateUser({ ...user, ...response.data.user });
      setDetails({ name: response.data.user.name, email: response.data.user.email });
      toast.success('Your profile was updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'We could not update your profile.');
    } finally {
      setBusy(false);
    }
  };

  const saveAddresses = async nextAddresses => {
    setAddressBusy(true);
    try {
      const response = await api.patch('/users/profile', { ...details, savedAddresses: nextAddresses });
      setSavedAddresses(response.data.user.savedAddresses || []);
      updateUser({ ...user, ...response.data.user });
      toast.success('Saved addresses updated.');
      return true;
    } catch (requestError) {
      toast.error(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Addresses could not be saved.');
      return false;
    } finally { setAddressBusy(false); }
  };

  const addAddress = async event => {
    event.preventDefault();
    if (editingAddress < 0 && savedAddresses.length >= 10) { toast.error('You can save up to 10 addresses.'); return; }
    const nextAddresses = [...savedAddresses];
    if (editingAddress >= 0) nextAddresses[editingAddress] = addressDraft;
    else nextAddresses.push(addressDraft);
    if (await saveAddresses(nextAddresses)) {
      setAddressDraft({ label: 'Home', fullName: details.name, address: '', city: '', postalCode: '', country: '' });
      setEditingAddress(-1);
    }
  };

  const submitPasswordChange = async event => {
    event.preventDefault();
    setPasswordError('');
    setPasswordBusy(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    const currentPassword = values.get('currentPassword');
    const newPassword = values.get('newPassword');
    const confirmPassword = values.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordBusy(false);
      return;
    }

    try {
      const response = await api.patch('/users/password', { currentPassword, newPassword, confirmPassword });
      form.reset();
      toast.success(response.data.message || 'Password changed successfully.');
    } catch (requestError) {
      setPasswordError(requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Password could not be changed.');
    } finally {
      setPasswordBusy(false);
    }
  };

  return <main className="page-shell">
    <div className="page-heading"><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile.</h1><p>Keep your account details and security up to date.</p></div>
    {loading ? <div className="loading-state"><span className="spinner" />Loading your profile...</div> : <div className="profile-sections">
      <form className="profile-form" onSubmit={submit}>
        <h2>Account details</h2>
        <label>Your name<input name="name" autoComplete="name" minLength="2" maxLength="80" required value={details.name} onChange={event => setDetails({ ...details, name: event.target.value })} /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required value={details.email} onChange={event => setDetails({ ...details, email: event.target.value })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-dark" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
      </form>

      <section className="password-change-section">
        <div><span className="eyebrow">ACCOUNT SECURITY</span><h2>Change password</h2><p>Choose a new password with at least 8 characters.</p></div>
        <form className="profile-form password-change-form" onSubmit={submitPasswordChange}>
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" required /></label>
          <label>New password<input name="newPassword" type="password" autoComplete="new-password" minLength="8" maxLength="72" required /></label>
          <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" maxLength="72" required /></label>
          {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
          <button className="button button-dark" disabled={passwordBusy}>{passwordBusy ? 'Updating password...' : 'Update password'}</button>
        </form>
      </section>

      <section className="password-change-section saved-addresses-section">
        <div><span className="eyebrow">DELIVERY DETAILS</span><h2>Saved addresses</h2><p>Keep up to 10 addresses ready for checkout.</p></div>
        <div className="saved-address-list">{savedAddresses.map((address, index) => <article className="saved-address-card" key={address._id || index}><div><strong>{address.label || `Address ${index + 1}`} · {address.fullName}</strong><p>{address.address}, {address.city}, {address.postalCode}, {address.country}</p></div><div className="saved-address-actions"><button className="text-link" type="button" disabled={addressBusy} onClick={() => { setAddressDraft({ ...address }); setEditingAddress(index); }}>Edit</button><button className="text-link" type="button" disabled={addressBusy} onClick={async () => { if (await saveAddresses(savedAddresses.filter((_, itemIndex) => itemIndex !== index)) && editingAddress === index) { setEditingAddress(-1); setAddressDraft({ label: 'Home', fullName: details.name, address: '', city: '', postalCode: '', country: '' }); } }}>Remove</button></div></article>)}{savedAddresses.length === 0 && <p className="muted">No saved addresses yet.</p>}</div>
        <form className="profile-form saved-address-form" onSubmit={addAddress}>
          <h3>{editingAddress >= 0 ? 'Edit saved address' : 'Add an address'}</h3>
          <label>Label<input value={addressDraft.label} maxLength="40" required onChange={event => setAddressDraft({ ...addressDraft, label: event.target.value })} /></label>
          <label>Full name<input value={addressDraft.fullName} autoComplete="name" maxLength="100" required onChange={event => setAddressDraft({ ...addressDraft, fullName: event.target.value })} /></label>
          <label>Street address<input value={addressDraft.address} autoComplete="street-address" maxLength="200" required onChange={event => setAddressDraft({ ...addressDraft, address: event.target.value })} /></label>
          <div className="form-row"><label>City<input value={addressDraft.city} maxLength="100" required onChange={event => setAddressDraft({ ...addressDraft, city: event.target.value })} /></label><label>Postal code<input value={addressDraft.postalCode} maxLength="30" required onChange={event => setAddressDraft({ ...addressDraft, postalCode: event.target.value })} /></label></div>
          <label>Country<input value={addressDraft.country} autoComplete="country-name" maxLength="100" required onChange={event => setAddressDraft({ ...addressDraft, country: event.target.value })} /></label>
          <div className="address-form-actions"><button className="button button-dark" disabled={addressBusy || (editingAddress < 0 && savedAddresses.length >= 10)}>{addressBusy ? 'Saving...' : editingAddress >= 0 ? 'Save address changes' : 'Save address'}</button>{editingAddress >= 0 && <button className="button button-light" type="button" onClick={() => { setEditingAddress(-1); setAddressDraft({ label: 'Home', fullName: details.name, address: '', city: '', postalCode: '', country: '' }); }}>Cancel</button>}</div>
        </form>
      </section>
    </div>}
  </main>;
}

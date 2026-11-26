import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const content = {
  about: { eyebrow: 'OUR STORY', title: 'A bookshop for curious minds.', intro: 'PageTurner helps readers find thoughtful stories, discover new authors, and keep their next favorite close.', sections: [['A slower kind of discovery', 'Browse a considered catalog, explore genres, and hear from readers who have already turned the last page.'], ['Made for readers', 'Save books for later, keep your order history in one place, and return whenever you are ready for another story.']] },
  contact: { eyebrow: 'WE ARE HERE TO HELP', title: 'Get in touch.', intro: 'Questions about an order, a book, or your account? We would be glad to help.', sections: [['Order support', 'Open My Orders to check your delivery progress or cancel an order while it is processing. Include your order number when contacting your store support team.'], ['Account support', 'Visit Profile to update your contact information, password, and saved delivery addresses.']] },
  faq: { eyebrow: 'A FEW QUICK ANSWERS', title: 'Frequently asked questions.', intro: 'Helpful details for your next PageTurner order.', faqs: [['How do I place an order?', 'Add books to your bag, continue to checkout, enter a delivery address, and choose Stripe test checkout or cash on delivery.'], ['Can I cancel my order?', 'Orders can be cancelled while their status is processing. Open My Orders, select the order, and choose Cancel order.'], ['How do I track an order?', 'Sign in and visit My Orders. Each order shows its processing, shipped, or delivered progress.'], ['How do I save a book?', 'Select the heart on a book card or book details page. Your wishlist is available from the account navigation.'], ['How can I contact PageTurner?', 'Use the Contact page form to send a message to the PageTurner team.'], ['Is Stripe checkout live?', 'This project is configured for Stripe test mode. Test mode does not charge a real card.']] },
  privacy: { eyebrow: 'YOUR INFORMATION', title: 'Privacy Policy.', intro: 'PageTurner uses account and order information to provide the bookstore service.', sections: [['Information we store', 'Your account name and email, saved addresses, wishlist, reviews, orders, and any contact messages you send are stored so the service can work. Passwords are stored as secure hashes.'], ['How information is used', 'Information is used to sign you in, process orders, respond to support requests, and operate customer features. Payment card information is handled by Stripe and is not stored by PageTurner.'], ['Your choices', 'You can update your profile and saved addresses while signed in. Contact the PageTurner team with questions about a contact message or your account information.']] },
  terms: { eyebrow: 'PLEASE READ', title: 'Terms of Service.', intro: 'By using PageTurner, you agree to use the service lawfully and provide accurate account and delivery information.', sections: [['Orders and pricing', 'Prices and stock are checked by the server at checkout. An order is confirmed after the selected payment step succeeds. Cash on delivery orders are payable to the delivery provider.'], ['Accounts and reviews', 'Keep your sign-in details private. Reviews should relate to the book and follow applicable laws. PageTurner may remove abusive or unlawful content.'], ['Contact requests', 'Information submitted through the contact form should be accurate and relevant to your request. Do not submit sensitive payment or password information.'], ['Availability', 'Catalog availability, delivery timing, and site features may change as the bookstore is maintained.']] }
};

export default function InfoPage() {
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState('');
  const { pathname } = useLocation();
  const key = pathname.split('/').filter(Boolean)[0];
  const page = content[key] || content.about;
  const submitContact = async event => {
    event.preventDefault();
    setContactError('');
    setSending(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await api.post('/contact', {
        name: values.get('name'),
        email: values.get('email'),
        message: values.get('message')
      });
      form.reset();
      toast.success(response.data.message || 'Your message was sent.');
    } catch (requestError) {
      const message = requestError.response?.data?.details?.join(' ') || requestError.response?.data?.message || 'Your message could not be sent. Please try again.';
      setContactError(message);
      toast.error(message);
    } finally { setSending(false); }
  };
  return <main className="page-shell info-page"><div className="page-heading"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.intro}</p></div>
    {key === 'contact' ? <div className="contact-layout"><form className="contact-form" onSubmit={submitContact}>
      <label>Name<input name="name" type="text" autoComplete="name" minLength="2" maxLength="80" required /></label>
      <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
      <label>Message<textarea name="message" rows="7" minLength="10" maxLength="5000" required placeholder="How can we help?" /></label>
      {contactError && <p className="form-error" role="alert">{contactError}</p>}
      <button className="button button-dark" disabled={sending}>{sending ? 'Sending message...' : 'Send message'}</button>
    </form><aside className="info-content contact-note">{page.sections.map(([heading, body]) => <article className="info-section" key={heading}><h2>{heading}</h2><p>{body}</p></article>)}</aside></div>
      : page.faqs ? <section className="info-content">{page.faqs.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section> : <section className="info-content">{page.sections.map(([heading, body]) => <article className="info-section" key={heading}><h2>{heading}</h2><p>{body}</p></article>)}</section>}
    <p className="info-back"><Link className="text-link" to="/books">Browse the books</Link></p>
  </main>;
}

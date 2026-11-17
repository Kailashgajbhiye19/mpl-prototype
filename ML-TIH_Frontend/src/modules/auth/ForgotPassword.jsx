import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => (
  <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f8fafc' }}>
    <section aria-labelledby="password-help-title" style={{ width: 'min(100%, 440px)', padding: '32px', borderRadius: '16px', background: '#fff', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.1)' }}>
      <h1 id="password-help-title" style={{ marginTop: 0, color: '#0f172a' }}>Password help</h1>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>
        For your protection, password resets require identity verification. Contact your system administrator to reset a forgotten password.
      </p>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>
        If you know your current password, you can change it from the <Link to="/change-password">change password page</Link>.
      </p>
      <Link to="/login">Back to login</Link>
    </section>
  </main>
);

export default ForgotPassword;

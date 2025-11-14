import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api'; // Import our new api service

const RegisterPage = () => {
  // --- State ---
  // Use 'useState' to store what the user types in
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To store any error messages

  // 'useNavigate' lets us redirect the user after a successful registration
  const navigate = useNavigate();

  // --- Handler Function ---
  // This function runs when the user clicks the "Register" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the form from refreshing the page
    setError(null); // Clear any old errors

    try {
      // Make the API call to our backend
      const response = await api.post('/users/register', {
        email: email,
        password: password,
      });

      console.log('Registration successful:', response.data);

      // If registration is successful, automatically redirect to the login page
      navigate('/login');

    } catch (err) {
      // If the API returns an error (like "Email already registered")
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please try again.');
      }
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>

      {/* --- Form --- */}
      {/* We add the 'onSubmit' handler to the form */}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            required
            value={email} // Link input to state
            onChange={(e) => setEmail(e.target.value)} // Update state on change
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            required
            value={password} // Link input to state
            onChange={(e) => setPassword(e.target.value)} // Update state on change
          />
        </div>

        {/* --- Error Message --- */}
        {/* If 'error' is not null, display it */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Register</button>
        <div className="link">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
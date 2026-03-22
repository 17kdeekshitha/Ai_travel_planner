import React, { useState } from 'react';
import '../styles/auth.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
  
     try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      console.log('Login successful:', response.data);
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('userProfile', JSON.stringify(response.data.user));
      }

     
      navigate('/planner');
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      alert(errorMessage);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="username@gmail.com"
          title="Use a Gmail address (example: username@gmail.com)"
          pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
      <div className="link">
        Don't have an account? <a href="/register">Register</a>
      </div>
    </div>
  );
}

export default LoginForm;

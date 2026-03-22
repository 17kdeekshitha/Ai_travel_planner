import React, { useState } from 'react';
import '../styles/auth.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

function RegisterForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();


  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister =  async e => {
    e.preventDefault();
     try {
    const response = await axios.post('http://localhost:5000/api/auth/register', form);

    console.log('Registration successful:', response.data);
    localStorage.setItem('token', response.data.token);
    if (response.data.user) {
      localStorage.setItem('userProfile', JSON.stringify(response.data.user));
    }

    
    navigate('/planner');}
    catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || "Registration failed. Please try again.";
    alert(errorMessage);
  }
  };
  

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="text" name="name" placeholder="Name" required onChange={handleChange} />
        <input
          type="email"
          name="email"
          placeholder="username@gmail.com"
          title="Use a Gmail address (example: username@gmail.com)"
          pattern="^[a-zA-Z0-9._%+-]+@gmail\.com$"
          required
          onChange={handleChange}
        />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} />
        <button type="submit">Register</button>
      </form>
      <div className="link">
        Have an account? <a href="/login">Login</a>
      </div>
    </div>
  );
}

export default RegisterForm;

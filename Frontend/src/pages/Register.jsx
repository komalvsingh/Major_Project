import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const auth = getAuth();

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleEmailPasswordRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(email, password);
      navigate('/'); 
    } catch (err) {
      setError('Failed to register. This email may already be in use.');
      console.error(err);
    }
  };
  
  const handleGoogleRegister = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      setError('Failed to register with Google.');
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Register</h2>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleEmailPasswordRegister}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="submit"
            className="w-full p-3 mb-2 font-semibold text-white rounded-lg bg-gray-800 hover:bg-gray-900 transition-all duration-300 transform hover:scale-105"
          >
            Register
          </button>
        </form>
        
        <div className="text-center my-4">
          <span className="text-gray-500">or</span>
        </div>

        <button
          onClick={handleGoogleRegister}
          className="w-full p-3 font-semibold text-white rounded-lg bg-red-500 hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
        >
          Register with Google
        </button>
      </div>
    </div>
  );
};

export default Register;

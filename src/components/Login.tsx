import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { LoginApiService } from '../api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: userLoading } = useUser();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !userLoading) {
      navigate('/');
    }
  }, [isAuthenticated, userLoading, navigate]);

  // Form validation
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!LoginApiService.validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    const passwordValidation = LoginApiService.validatePassword(password);
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || 'Invalid password');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Sanitize inputs
      const sanitizedEmail = LoginApiService.sanitizeInput(email);
      const sanitizedPassword = LoginApiService.sanitizeInput(password);

      const success = await login(sanitizedEmail, sanitizedPassword);
      
      if (success) {
        // Navigation will be handled by useEffect when isAuthenticated changes
        console.log('✅ Login successful');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear email error when user starts typing
    if (emailError) {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear password error when user starts typing
    if (passwordError) {
      setPasswordError('');
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: '#666',
            margin: 0
          }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${emailError ? '#dc3545' : '#ddd'}`,
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease'
              }}
              placeholder="Enter your email address"
              required
              autoComplete="email"
              disabled={isLoading}
            />
            {emailError && (
              <div style={{
                color: '#dc3545',
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {emailError}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '45px',
                  border: `1px solid ${passwordError ? '#dc3545' : '#ddd'}`,
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '18px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={isLoading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {passwordError && (
              <div style={{
                color: '#dc3545',
                fontSize: '14px',
                marginTop: '4px'
              }}>
                {passwordError}
              </div>
            )}
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || userLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (isLoading || userLoading) ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: (isLoading || userLoading) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {(isLoading || userLoading) && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {(isLoading || userLoading) ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
    </>
  );
};

export default Login;
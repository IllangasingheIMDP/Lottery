'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
export default function Login() {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!gmail) {
      alert('Please enter your email address first.');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gmail }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Password recovery email sent! Check your inbox (and spam folder).');
      } else {
        alert(data.error || 'Failed to send recovery email.');
      }
    } catch (error) {
      alert('An error occurred while sending the email.');
      console.error(error);
    } finally {
      setIsSendingEmail(false);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail, password }),
      });
      
      if (res.ok) {
        router.push('/');
      } else {
        alert('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again later.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"
    style={{
      backgroundImage: "url('/bg3.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
    
      <div className="sm:w-full w-fit max-w-md p-8 space-y-8 bg-white/50 backdrop-blur-md rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-900">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="space-y-4 ">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 ">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  className="appearance-none block w-full    px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-teal-950 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                  placeholder="your.email@gmail.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-teal-950 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            

          <div className="text-sm">
              <button
                onClick={handleForgotPassword}
                disabled={isSendingEmail}
                className="font-medium text-[#253433] hover:text-teal-900 disabled:opacity-50"
              >
                {isSendingEmail ? 'Sending...' : 'Forgot your password?'}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group backdrop-blur-md relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        
        
        
      </div>
    </div>
  );
}
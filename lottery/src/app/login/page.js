'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gmail, password }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h1>Login</h1>
      <input
        type="email"
        value={gmail}
        onChange={(e) => setGmail(e.target.value)}
        placeholder="Gmail"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '../api/auth.service';
import api from '@/api/axios';

export const LoginPage = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const formData = new FormData();
    formData.append('username', mobile);
    formData.append('password', password);

    // 1. Get the token
    const data = await authService.login(formData);
    const token = data.access_token;

    // 2. IMMEDIATE FETCH: Pass the token directly to the me call 
    // to bypass the state-delay in the interceptor for this first call.
    const user = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data);
    
    // 3. Now save both to the store
    setAuth(user, token);
    
    // 4. Navigate home
    navigate('/');
  } catch (err: any) {
    console.error("Login Error:", err);
    setError(err.response?.data?.detail || 'Invalid mobile number or password');
  } finally {
    setLoading(false);
  }
};
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const formData = new FormData();
//       formData.append('username', mobile);
//       formData.append('password', password);

//       const data = await authService.login(formData);
//       // After getting token, fetch user profile
//       const user = await authService.getMe();
      
//       setAuth(user, data.access_token);
//       navigate('/');
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Invalid mobile number or password');
//     } finally {
//       setLoading(false);
//     }
//   };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Fresh clothes are just a few taps away.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-soft border border-slate-100 rounded-premium sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input 
              label="Mobile Number" 
              type="tel" 
              placeholder="050 XXX XXXX" 
              required 
              value={mobile} onChange={e => setMobile(e.target.value)}
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              required 
             value={password} onChange={e => setPassword(e.target.value)}
            />
{error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="flex items-center justify-end">
              <Link to="/forgot-password" size="sm" className="text-sm font-medium text-brand-primary hover:text-blue-500">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={loading} icon={LogIn}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-primary hover:text-blue-500">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
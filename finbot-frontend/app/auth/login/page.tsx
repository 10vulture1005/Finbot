"use client"
import React, { useState } from 'react';
import FloatingNavbar from '../../land/navbar';
import api from '@/app/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/app/services/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { TokenResponse } from '@/app/types/models';
import { toast } from 'sonner';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
    const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();


    try {
      const res = await api.post<TokenResponse>("/auth/signin", {
        email,
        password,
      });

      if (res.success && res.data) {
          const { access_token } = res.data;
          console.log(res.data);
          
          if (access_token) {
            if (rememberMe) {
              localStorage.setItem("access_token", access_token);
            } else {
              sessionStorage.setItem("access_token", access_token);
            }
             
            // 👇 Log into Firebase
            await signInWithEmailAndPassword(auth, email, password);

             // ✅ redirect
            router.push("/dashboard");
          } else {
              toast.error("Login successful but NO TOKEN in response?");
          }
      } else {
          console.error("Login Error:", res.error);
          toast.error("Login Failed: " + (res.error || res.message || "Unknown error"));
      }

    } catch (err: any) {
      console.log(
        err?.message || "Invalid email or password"
      );
      toast.error("Login Failed: " + (err?.message || "Unknown error"));
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" 
         style={{
           background: 'linear-gradient(200deg, #010A4B 30%, #05A4FF 100%)'
         }}>
      <FloatingNavbar/>
      <div className="flex w-full max-w-6xl bg-transparent rounded-3xl overflow-hidden shadow-2xl h-[700px]">
        
        {/* Left Section with Background Image */}
        <div className="flex-1 relative p-16 flex flex-col justify-between text-white overflow-hidden">
          {/* Background Image */}
          <img 
            src="/authcard.jpg" 
            alt="Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="w-14 h-14 bg-transparent rounded-full mb-10 flex items-center justify-center">
              {/* <span className="text-blue-600 font-bold text-2xl"></span> */}
            </div>
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              <span className='text-7xl'>Welcome,</span><br />back!
            </h1>
            <p className="text-blue-100 mb-10 mt-10 max-w-md text-lg">
              Sign in to access your dashboard and continue where you left off.
            </p>
          </div>

          <div className="relative z-10">
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex-1 p-16 flex flex-col justify-center bg-white/90">
          <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleLogin} className="space-y-8">
              {/* Email Input */}
              <div>
                <label className="block text-base text-gray-500 mb-3">Email address</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3 7l9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@mail.com"
                    className="w-full pl-14 pr-5 py-4 text-lg text-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-base text-gray-500 mb-3">Password</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M12 17v-3" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-14 pr-5 py-4 text-lg text-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-base text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-base text-blue-600 hover:text-blue-700">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                onClick={handleLogin}
                className="w-full text-white py-4 rounded-xl font-semibold text-lg transition transform hover:scale-[1.02] shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #040D59 0%, #07A2FE 100%)'
                }}
              >
                Login
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-10 text-center">
              <p className="text-base text-gray-600">
                Not a member yet?{' '}
                <Link href="/auth/signup" className="text-blue-600 font-semibold hover:text-blue-700">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
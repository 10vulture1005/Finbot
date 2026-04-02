"use client"
import React, { useState } from 'react';
import FloatingNavbar from '../../land/navbar';
import api from '@/app/libs/api';
import { useRouter } from 'next/navigation';
import { log } from 'console';
import { toast } from 'sonner';

const SignUpForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
const router = useRouter()
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  

  if (!agreeTerms) {
    console.error("You must agree to the terms and conditions");
    return;
  }

  if (password !== confirmPassword) {
    console.error("Passwords do not match");
    return;
  }

  

  try {
    // 👇 use centralized api.ts
    const res = await api.post("/auth/signup-init", {
      name,
      email,
      password,
    });

    const { access_token } = res.data;
    console.log(res.data)
    // // ⚠️ Only if backend returns token in response
    // if (access_token) {
    //   localStorage.setItem("access_token", access_token);
    // }

    // ✅ redirect after successful signup
    router.push("/payement");
    } catch (err: any) {
    console.log(
      err?.response?.data?.detail || "Sign up failed"
    );
    toast.error(err?.response?.data?.detail || "Sign up failed")
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
              Join us<br />today!
            </h1>
            <p className="text-blue-100 mb-10 max-w-md text-lg">
              Create your account and start your journey with us. Get access to exclusive features and benefits.
            </p>
            
          </div>

          <div className="relative z-10">
          </div>
        </div>

        {/* Right Section - Sign Up Form */}
        <div className="flex-1 p-16 flex flex-col justify-center bg-white/90">
          <div className="w-full max-w-md mx-auto">
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-base text-gray-500 mb-3">Full Name</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-14 pr-5 py-4 text-lg text-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

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

              {/* Confirm Password Input */}
              <div>
                <label className="block text-base text-gray-500 mb-3">Confirm Password</label>
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-14 pr-5 py-4 text-lg text-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1"
                />
                <label className="ml-3 text-base text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Terms & Conditions
                  </a>
                </label>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full text-white py-4 rounded-xl font-semibold text-lg transition transform hover:scale-[1.02] shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #040D59 0%, #07A2FE 100%)'
                }}
              >
                Sign up
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-base text-gray-600">
                Already have an account?{' '}
                <a href="#" className="text-blue-600 font-semibold hover:text-blue-700">
                  Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
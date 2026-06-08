import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { postData } from '../../services/FetchNodeServices';
import { useAuth } from '../../contexts/AuthContext';
export default function ForgetPasswordPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearError = () => setError('');

 

  
      const { forgotPassword } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const res = await forgotPassword(email);

  if (res.success) {
    setSuccess(res.message);
  } else {
    setError(res.message);
  }
};


  const emailError = submitted && !email ? "Email is required" : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-800 flex items-center justify-center p-4">
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4f46e5]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#4f46e5] flex items-center justify-center mb-4 shadow-lg">
              <img
                src="https://public.readdy.ai/ai/img_res/562db67e-18cd-4892-ada1-aa9c5633c1ae.png"
                alt="InvenPro"
                className="w-9 h-9 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Forgot Password</h1>
            <p className="text-sm text-[#64748b] mt-1 text-center">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex justify-between">
              {error}
              <button onClick={clearError}>✕</button>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#64748b] uppercase">
                Email Address *
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                data-nav-index="0"
                className={`w-full h-10 mt-1 px-3 rounded-lg border text-sm ${
                  emailError ? 'border-red-400' : 'border-[#e2e8f0]'
                }`}
              />

              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              data-nav-index="1"
              className="w-full h-10 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-[#4f46e5] hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-5">
          InvenPro ERP © 2025
        </p>
      </div>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams();

  const formRef = useRef<HTMLFormElement>(null);
  useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const clearError = () => setError('');

  const { resetPassword } = useAuth(); // 🔥 from context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid or expired token");
      return;
    }

    setIsLoading(true);

    const res = await resetPassword(token, password);

    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.message);
    }

    setIsLoading(false);
  };

  const passwordError = submitted && !password ? "Password is required" : "";
  const confirmError = submitted && !confirmPassword ? "Confirm password is required" : "";

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
            <h1 className="text-2xl font-bold text-[#1e293b]">Reset Password</h1>
            <p className="text-sm text-[#64748b] mt-1 text-center">
              Enter your new password
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

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-[#64748b] uppercase">
                New Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-nav-index="0"
                className={`w-full h-10 mt-1 px-3 rounded-lg border text-sm ${
                  passwordError ? 'border-red-400' : 'border-[#e2e8f0]'
                }`}
              />
              {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold text-[#64748b] uppercase">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-nav-index="1"
                className={`w-full h-10 mt-1 px-3 rounded-lg border text-sm ${
                  confirmError ? 'border-red-400' : 'border-[#e2e8f0]'
                }`}
              />
              {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              data-nav-index="2"
              className="w-full h-10 bg-[#4f46e5] text-white rounded-lg text-sm font-semibold flex items-center justify-center"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Back */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-[#4f46e5] hover:underline"
            >
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          InvenPro ERP © 2025
        </p>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification State
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationType, setVerificationType] = useState('register'); // 'register' | 'login'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, register, verifyEmail, verifyLoginOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Cooldown countdown effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const result = await register(name, email, password);
      setLoading(false);
      if (result?.requireVerification) {
        setVerificationEmail(result.email || email);
        setVerificationType('register');
        setOtp('');
        setStep('verify');
        setResendCooldown(60);
      } else if (result?.success) {
        navigate(from, { replace: true });
      }
    } else {
      const result = await login(email, password);
      setLoading(false);
      if (result?.requireVerification) {
        setVerificationEmail(result.email || email);
        setVerificationType('register');
        setOtp('');
        setStep('verify');
        setResendCooldown(60);
      } else if (result?.requireOtp) {
        setVerificationEmail(result.email || email);
        setVerificationType('login');
        setOtp('');
        setStep('verify');
        setResendCooldown(60);
      } else if (result?.success) {
        navigate(from, { replace: true });
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) return;

    setLoading(true);
    let result;
    if (verificationType === 'register') {
      result = await verifyEmail(verificationEmail, cleanOtp);
    } else {
      result = await verifyLoginOtp(verificationEmail, cleanOtp);
    }
    setLoading(false);

    if (result?.success) {
      navigate(from, { replace: true });
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    const res = await resendOtp(verificationEmail, verificationType);
    setLoading(false);
    if (res?.success) {
      setResendCooldown(60);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 py-16 overflow-hidden">
      {/* Background cinematic backdrop with dark wash */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg"
          alt="Cinematic backdrop"
          className="w-full h-full object-cover object-center filter blur-sm brightness-[0.22] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-950/85 to-cinema-900" />
      </div>

      {/* Main Auth Container */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <BrandLogo size="lg" to={null} className="justify-center mb-2" />
          <p className="text-xs text-slate-400 mt-1">
            Personalized Movie Recommendation Engine & Streaming Hub
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-cinema-700/80 shadow-2xl backdrop-blur-xl">
          {step === 'form' ? (
            <>
              {/* Tab Switcher */}
              <div className="flex p-1 rounded-xl bg-cinema-900/90 border border-cinema-750 mb-6">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    !isRegister
                      ? 'bg-cinema-800 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    isRegister
                      ? 'bg-cinema-800 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Privacy Notice Banner */}
              <div className="mb-5 px-3 py-2 rounded-xl bg-cinema-800/60 border border-cinema-700/60 flex items-center gap-2 text-[11px] text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isRegister 
                    ? 'Registration requires 6-digit email verification via secure Gmail SMTP.' 
                    : 'Protected by encrypted JWT sessions & email authentication.'}
                </span>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        id="auth-name"
                        type="text"
                        required={isRegister}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900/80 border border-cinema-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cinema-accent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900/80 border border-cinema-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cinema-accent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cinema-900/80 border border-cinema-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cinema-accent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-cinema-700 text-cinema-accent focus:ring-0 bg-cinema-900"
                    />
                    <span>Remember session</span>
                  </label>
                  <span className="text-slate-400">SMTP Verified</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cinema-accent to-rose-700 hover:from-cinema-accentHover hover:to-rose-800 text-white font-bold text-sm shadow-lg shadow-cinema-accent/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isRegister ? 'Send Verification Code' : 'Sign In to Movie+'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Guarantee Notice */}
              <div className="mt-6 pt-4 border-t border-cinema-700/60 text-center">
                <p className="text-[11px] text-slate-400">
                  Protected with encrypted JWT sessions & secure email verification.
                </p>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* STEP 2: EMAIL OTP VERIFICATION SCREEN                     */
            /* ========================================================= */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cinema-cyan/15 border border-cinema-cyan/30 text-cinema-cyan shadow-lg shadow-cinema-cyan/20 mb-1">
                  <Mail className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  Verify Your Email
                </h2>
                <p className="text-xs text-slate-300">
                  We sent a 6-digit verification code to:
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-cinema-800 border border-cinema-700 text-xs font-mono font-bold text-cinema-cyan">
                  {verificationEmail}
                </div>
              </div>

              {/* Security OTP Input Form */}
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label htmlFor="auth-otp" className="block text-center text-xs font-semibold text-slate-300 mb-2">
                    Enter 6-Digit Security Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                    <input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-center pl-10 pr-4 py-3 rounded-xl bg-cinema-900/90 border-2 border-cinema-accent/70 text-white placeholder-slate-600 font-mono text-2xl font-bold tracking-[0.4em] focus:outline-none focus:border-cinema-cyan focus:ring-2 focus:ring-cinema-cyan/20 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    Code expires in 10 minutes. Check your Spam folder if not in Inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.trim().length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cinema-accent to-rose-700 hover:from-cinema-accentHover hover:to-rose-800 text-white font-bold text-sm shadow-lg shadow-cinema-accent/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{verificationType === 'register' ? 'Verify & Create Account' : 'Verify & Sign In'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Resend and Back Controls */}
              <div className="flex flex-col items-center gap-3 pt-2 border-t border-cinema-700/60 text-xs">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-cinema-cyan hover:underline font-semibold disabled:text-slate-500 disabled:no-underline flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend verification code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back / Change Email</span>
                </button>
              </div>

              {/* Privacy badge */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] text-center">
                🛡️ <strong>Privacy Protection Active:</strong> Accounts are confirmed with ownership verification to prevent impersonation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

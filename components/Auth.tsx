import React, { useState } from 'react';
import { AuthService } from '../services/storage';
import { Button } from './ui/Button';
import { CubeLogo } from './ui/Logo';
import { User, Mail, Lock, Phone, ChevronRight, AlertCircle } from 'lucide-react';

interface AuthProps {
  onAuthComplete: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthComplete }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await AuthService.signIn(email, password);
      } else {
        // Capture all profile details
        await AuthService.signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber,
        });
      }
      onAuthComplete();
    } catch (err: any) {
      console.error("Auth Component Error:", err);
      // Sanitize error messages - don't expose sensitive information
      let message = 'Authentication failed. Please check your credentials.';
      
      if (err?.message) {
        // Only show safe error messages
        const safeMessage = err.message.toLowerCase();
        if (safeMessage.includes('invalid') || safeMessage.includes('credentials')) {
          message = 'Invalid email or password. Please try again.';
        } else if (safeMessage.includes('email')) {
          message = 'Please enter a valid email address.';
        } else if (safeMessage.includes('password')) {
          message = 'Password must be at least 8 characters with uppercase, lowercase, and a number.';
        } else if (safeMessage.includes('already registered')) {
          message = 'An account with this email already exists.';
        } else {
          message = 'Something went wrong. Please try again.';
        }
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
      <div className="w-full max-w-[420px] space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-[22%] shadow-xl shadow-iosBlue/10 border border-iosDivider/20 rotate-[-5deg]">
              <CubeLogo size={52} color="#007AFF" />
            </div>
          </div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-black">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-iosGray text-[17px]">
            {isLogin ? 'Sign in to manage your inventory' : 'Join WhoHasWhat today'}
          </p>
        </div>

        <div className="bg-white rounded-[28px] shadow-2xl shadow-black/5 border border-iosDivider/20 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {!isLogin && (
              <div className="space-y-4 animate-slide-up">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/60" size={18} />
                    <input
                      type="text"
                      placeholder="First Name *"
                      className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-iosBg focus:bg-white focus:ring-2 focus:ring-iosBlue/20 outline-none text-[16px] transition-all"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Last Name *"
                      className="w-full px-4 py-3.5 rounded-[14px] bg-iosBg focus:bg-white focus:ring-2 focus:ring-iosBlue/20 outline-none text-[16px] transition-all"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/60" size={18} />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-iosBg focus:bg-white focus:ring-2 focus:ring-iosBlue/20 outline-none text-[16px] transition-all"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>

              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/60" size={18} />
                <input
                  type="email"
                  placeholder="Email Address *"
                  className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-iosBg focus:bg-white focus:ring-2 focus:ring-iosBlue/20 outline-none text-[16px] transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/60" size={18} />
                <input
                  type="password"
                  placeholder="Password *"
                  className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-iosBg focus:bg-white focus:ring-2 focus:ring-iosBlue/20 outline-none text-[16px] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
                  title="Password must be at least 8 characters with uppercase, lowercase, and a number"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-[16px] bg-red-50 border border-red-100 animate-shake flex items-start gap-3">
                <AlertCircle className="text-[#FF3B30] shrink-0 mt-0.5" size={18} />
                <p className="text-[#FF3B30] text-[13px] font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <Button 
              fullWidth 
              type="submit" 
              disabled={loading} 
              className="mt-2 py-4 shadow-lg shadow-iosBlue/20 rounded-[16px] relative overflow-hidden group"
            >
              <span className={`transition-all duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
              {!loading && <ChevronRight className="w-5 h-5 absolute right-4 group-hover:translate-x-1 transition-transform" />}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </Button>
          </form>

          <div className="bg-iosBg/30 p-6 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-iosBlue text-[15px] font-semibold active:opacity-50 transition-colors"
            >
              {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[12px] text-iosGray/60 px-8">
          By continuing, you agree to our terms of service and privacy policy for community asset management.
        </p>
      </div>
    </div>
  );
};
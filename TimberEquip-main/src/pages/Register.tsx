import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, Mail, Lock, 
  ArrowRight, ShieldCheck, Globe, 
  Clock, User, Building, Crown,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { Seo } from '../components/Seo';
import { auth } from '../firebase';
import { getRecaptchaToken, assessRecaptcha } from '../services/recaptchaService';
import { type AccountOnboardingChoice } from '../services/billingService';
import { isPrivilegedAdminEmail } from '../utils/privilegedAdmin';

const ACCOUNT_OPTIONS: Array<{
  id: AccountOnboardingChoice;
  title: string;
  price: string;
  summary: string;
  icon: typeof User;
}> = [
  {
    id: 'free_member',
    title: 'Free Member',
    price: '$0',
    summary: 'Create an account to save searches, bookmark inventory, and manage your profile.',
    icon: User,
  },
  {
    id: 'individual_seller',
    title: 'Owner-Operator',
    price: '$39/MO',
    summary: 'Activate an owner-operator account and post one active machine at a time.',
    icon: UserPlus,
  },
  {
    id: 'dealer',
    title: 'Dealer Ad Package',
    price: '$499/MO',
    summary: 'Run a dealer storefront with up to 50 active listings and managed seats.',
    icon: Building,
  },
  {
    id: 'fleet_dealer',
    title: 'Pro Dealer Ad Package',
    price: '$999/MO',
    summary: 'Support high-volume inventory with 150 listings and team access.',
    icon: Crown,
  },
];

export function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountOnboardingChoice>('free_member');
  const [formData, setFormData] = useState({
    displayName: '',
    company: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const postRegistrationPath = selectedAccountType === 'free_member'
    ? '/profile'
    : `/ad-programs?plan=${encodeURIComponent(selectedAccountType)}&startCheckout=1`;

  const handleNext = () => setStep(prev => prev + 1);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const rcToken = await getRecaptchaToken('REGISTER');
      if (rcToken) {
        const pass = await assessRecaptcha(rcToken, 'REGISTER');
        if (!pass) {
          setError('Security check failed. Please try again.');
          setLoading(false);
          return;
        }
      }
      const registrationResult = await register({ ...formData, onboardingIntent: selectedAccountType });

      if (!registrationResult.emailVerified) {
        navigate(
          `/login?verifyEmailSent=${registrationResult.verificationEmailSent ? '1' : '0'}&email=${encodeURIComponent(formData.email.trim())}&redirect=${encodeURIComponent(postRegistrationPath)}`,
          { replace: true }
        );
        return;
      }

      if (isPrivilegedAdminEmail(formData.email)) {
        navigate('/admin', { replace: true });
        return;
      }

      navigate(postRegistrationPath, { replace: true });
    } catch (err: any) {
      if (auth.currentUser) {
        const createdEmail = formData.email.trim();
        if (!auth.currentUser.emailVerified) {
          navigate(`/login?verifyEmailSent=0&email=${encodeURIComponent(createdEmail)}&redirect=${encodeURIComponent(postRegistrationPath)}`, { replace: true });
          return;
        }
        navigate(postRegistrationPath, { replace: true });
        return;
      }

      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        try {
          await login(formData.email.trim(), formData.password);
          if (auth.currentUser && !auth.currentUser.emailVerified) {
            setError('That account exists but email is not verified yet. Verify your email, then sign in.');
            navigate(`/login?verifyEmailSent=1&email=${encodeURIComponent(formData.email.trim())}&redirect=${encodeURIComponent(postRegistrationPath)}`, { replace: true });
            return;
          }
          navigate(postRegistrationPath, { replace: true });
          return;
        } catch {
          setError('That email is already registered. Try logging in instead.');
        }
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Account creation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      <Seo
        title="Create Account | Forestry Equipment Sales"
        description="Register for a free account to browse, bookmark, and inquire on forestry equipment. Sellers can subscribe to list machines."
        canonicalPath="/register"
        robots="noindex, nofollow"
      />
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 skew-x-12 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-accent/5 -skew-x-12 -translate-x-1/2"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-bg border border-line shadow-2xl relative z-10"
      >
        <div className="bg-[#0a0a0a] text-white p-12 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-2">Account Registration</span>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none text-white">New <br /> <span className="text-accent">Operator</span></h1>
          </div>
          <div className="w-16 h-16 bg-accent flex items-center justify-center rounded-sm">
            <UserPlus className="text-white" size={32} />
          </div>
        </div>

        <div className="p-12">
          <form onSubmit={handleRegister} className="space-y-8">
            {step === 1 ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="label-micro">Account Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ACCOUNT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedAccountType === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedAccountType(option.id)}
                          className={`text-left border rounded-sm p-4 transition-all ${isSelected ? 'border-accent bg-accent/5' : 'border-line bg-surface hover:border-accent/40'}`}
                        >
                          <div className={`mb-3 ${isSelected ? 'text-accent' : 'text-muted'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink">{option.title}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">{option.price}</span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed">{option.summary}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="label-micro">Full Name</label>
                  <div className="flex items-center bg-surface border border-line p-1 rounded-sm focus-within:border-accent transition-colors">
                    <div className="p-3 text-muted">
                      <User size={18} />
                    </div>
                    <input 
                      required
                      type="text" 
                      placeholder="OPERATOR NAME" 
                      className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 uppercase tracking-wider"
                      value={formData.displayName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="label-micro">Company Name (Optional)</label>
                  <div className="flex items-center bg-surface border border-line p-1 rounded-sm focus-within:border-accent transition-colors">
                    <div className="p-3 text-muted">
                      <Building size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="ENTITY NAME" 
                      className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 uppercase tracking-wider"
                      value={formData.company}
                      onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.displayName.trim()}
                  className="btn-industrial btn-accent w-full py-5 text-base flex items-center justify-center"
                >
                  Continue to Credentials
                  <ArrowRight className="ml-3" size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-surface border border-line rounded-sm px-4 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted block mb-1">Selected Account</span>
                  <span className="text-sm font-black uppercase tracking-tight text-ink">
                    {ACCOUNT_OPTIONS.find((option) => option.id === selectedAccountType)?.title || 'Free Member'}
                  </span>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="label-micro">Email Address</label>
                  <div className="flex items-center bg-surface border border-line p-1 rounded-sm focus-within:border-accent transition-colors">
                    <div className="p-3 text-muted">
                      <Mail size={18} />
                    </div>
                    <input 
                      required
                      type="email" 
                      placeholder="YOUR@EMAIL.COM" 
                      className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 uppercase tracking-wider"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="label-micro">Access Key (Password)</label>
                  <div className="flex items-center bg-surface border border-line p-1 rounded-sm focus-within:border-accent transition-colors">
                    <div className="p-3 text-muted">
                      <Lock size={18} />
                    </div>
                    <input 
                      required
                      type="password" 
                      placeholder="••••••••••••" 
                      className="flex-1 bg-transparent border-none py-4 text-sm font-bold focus:ring-0 tracking-widest"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start space-x-3 bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
                    <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs font-medium text-red-500">{error}</p>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <input type="checkbox" required className="w-4 h-4 border-line rounded-sm accent-accent" id="terms" />
                  <label htmlFor="terms" className="text-[10px] font-bold text-muted uppercase tracking-widest cursor-pointer leading-relaxed">
                    I accept the Forestry Equipment Sales <span className="text-accent underline">Terms of Service</span> and <span className="text-accent underline">Privacy Policy</span>.
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={() => setStep(1)} className="btn-industrial py-5 px-8 bg-surface">Back</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-industrial btn-accent flex-1 py-5 text-base flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-3" size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-line flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Already Registered?</span>
              <Link to="/login" className="text-[10px] font-black text-accent uppercase hover:underline">Log In</Link>
            </div>
            
            <div className="bg-surface p-4 border border-line flex items-start space-x-4">
              <ShieldCheck className="text-data flex-shrink-0" size={18} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest mb-1">Secure Registration</span>
                <p className="text-[9px] font-medium text-muted leading-relaxed">
                  Your identity is protected via AES-256 encryption. 
                  Forestry Equipment Sales does not share operator data with unauthorized third parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

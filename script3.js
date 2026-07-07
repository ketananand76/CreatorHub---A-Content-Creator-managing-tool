const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ResetPassword.jsx', 'utf8');

// Remove resetPassword from useAuth
code = code.replace(/const \{ forgotPassword, resetPassword \} = useAuth\(\);/, 'const { forgotPassword } = useAuth();');

// Since token is not needed if we don't render the token form
// Replace the return statement to only render the email form
const renderReplacement = `  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#070b14] px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-premium p-8 rounded-3xl z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Logo size={42} showText={true} textClassName="text-3xl font-bold font-outfit text-gradient tracking-wide" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
            {sent ? 'Check your email' : 'Reset your password'}
          </p>
        </div>

        {sent ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-lg shadow-green-500/10">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-black font-outfit text-slate-800 dark:text-white">Email Sent!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              We've sent a password reset link to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
            </p>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/login"
                className="w-full py-3 inline-block text-sm font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendReset} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="alex@creatorhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-slate-500 hover:text-brand-500 dark:text-slate-400 transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}`;

code = code.replace(/return \([\s\S]*\}\;/m, renderReplacement);

fs.writeFileSync('frontend/src/pages/ResetPassword.jsx', code);
console.log('ResetPassword.jsx updated successfully!');

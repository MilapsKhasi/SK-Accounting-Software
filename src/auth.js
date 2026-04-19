import { supabase } from './lib/supabase';

export function renderAuth(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-[#f8f9fb] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Poppins']">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-16 h-16 flex items-center justify-center">
            <img src="/logo.svg" alt="Logo" class="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-black text-gray-900 tracking-tighter uppercase">
          SK Accounting
        </h2>
        <p class="mt-2 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
          Sign in to manage your business
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 sm:px-10 border border-gray-200">
          <form id="auth-form" class="space-y-6">
            <div>
              <label for="email" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Email address
              </label>
              <div class="mt-1">
                <input id="email" name="email" type="email" required 
                  class="appearance-none block w-full px-4 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1e2a38] text-sm font-bold transition-all"
                  placeholder="you@example.com">
              </div>
            </div>

            <div>
              <label for="password" class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Password
              </label>
              <div class="mt-1">
                <input id="password" name="password" type="password" required 
                  class="appearance-none block w-full px-4 py-2 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#1e2a38] text-sm font-bold transition-all"
                  placeholder="••••••••">
              </div>
            </div>

            <div id="auth-error" class="hidden p-3 bg-red-50 border border-red-200 flex items-center gap-2 text-[#f44336] text-[10px] font-bold uppercase tracking-widest">
              <i data-lucide="alert-circle" class="w-4 h-4"></i>
              <span id="error-message"></span>
            </div>

            <div class="flex flex-col gap-3 pt-2">
              <button type="submit" id="signin-btn"
                class="w-full flex justify-center py-3 px-4 text-xs font-bold text-white bg-[#1e2a38] hover:bg-[#2c3e50] focus:outline-none uppercase tracking-widest transition-all">
                Sign In
              </button>
              <button type="button" id="signup-btn"
                class="w-full flex justify-center py-3 px-4 border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none uppercase tracking-widest transition-all">
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  window.renderIcons();

  const form = document.getElementById('auth-form');
  const errorDiv = document.getElementById('auth-error');
  const errorMessage = document.getElementById('error-message');
  const signinBtn = document.getElementById('signin-btn');
  const signupBtn = document.getElementById('signup-btn');

  const handleAuth = async (type) => {
    const email = form.email.value;
    const password = form.password.value;
    
    errorDiv.classList.add('hidden');
    const btn = type === 'signin' ? signinBtn : signupBtn;
    const originalText = btn.innerText;
    btn.innerText = 'Processing...';
    btn.disabled = true;

    try {
      const { error } = type === 'signin' 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;
    } catch (err) {
      errorDiv.classList.remove('hidden');
      errorMessage.innerText = err.message;
      btn.innerText = originalText;
      btn.disabled = false;
    }
  };

  signinBtn.onclick = (e) => {
    e.preventDefault();
    handleAuth('signin');
  };

  signupBtn.onclick = (e) => {
    e.preventDefault();
    handleAuth('signup');
  };
}

import { supabase } from './lib/supabase';

export function renderAuth(container) {
  container.innerHTML = `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <i data-lucide="building-2" class="text-white w-8 h-8"></i>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          SK Accounting
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your business
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form id="auth-form" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div class="mt-1">
                <input id="email" name="email" type="email" required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="you@example.com">
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div class="mt-1">
                <input id="password" name="password" type="password" required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                  placeholder="••••••••">
              </div>
            </div>

            <div id="auth-error" class="hidden p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
              <i data-lucide="alert-circle" class="w-4 h-4"></i>
              <span id="error-message"></span>
            </div>

            <div class="flex flex-col gap-3">
              <button type="submit" id="signin-btn"
                class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                Sign In
              </button>
              <button type="button" id="signup-btn"
                class="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
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

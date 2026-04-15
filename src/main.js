import './index.css';
import { supabase } from './lib/supabase';
import { renderAuth } from './auth';
import { renderDashboard } from './dashboard';
import { state, initData } from './state';
import { createIcons, icons } from 'lucide';

const app = document.getElementById('app');

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    renderAuth(app);
  } else {
    state.session = session;
    await initData();
    renderDashboard(app);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (!session) {
      renderAuth(app);
    } else {
      initData().then(() => renderDashboard(app));
    }
  });
}

init();

// Global helper for icons
window.renderIcons = () => {
  createIcons({ icons });
};

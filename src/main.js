import './index.css';
import { supabase } from './lib/supabase';
import { renderAuth } from './auth';
import { renderDashboard } from './dashboard';
import { state, initData } from './state';
import { createIcons, icons } from 'lucide';
import './payments';

const app = document.getElementById('app');

let isDashboardRendered = false;

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    isDashboardRendered = false;
    renderAuth(app);
  } else {
    state.session = session;
    await initData();
    isDashboardRendered = true;
    renderDashboard(app);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    const sessionChanged = (!!session !== !!state.session) || (session?.user?.id !== state.session?.user?.id);
    state.session = session;
    
    if (!session) {
      isDashboardRendered = false;
      renderAuth(app);
    } else if (sessionChanged || !isDashboardRendered || event === 'SIGNED_IN') {
      // Only re-init and re-render if session actually changed or not yet rendered
      initData().then(() => {
        isDashboardRendered = true;
        renderDashboard(app);
      });
    }
  });
}

init();

// Global helper for icons
window.renderIcons = () => {
  createIcons({ icons });
};

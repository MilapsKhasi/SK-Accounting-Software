import './index.css';
import { supabase } from './lib/supabase';
import { renderAuth } from './auth';
import { renderDashboard } from './dashboard';
import { state, initData } from './state';
import { renderCompanies } from './companies';
import { createIcons, icons } from 'lucide';
import './payments';

const app = document.getElementById('app');

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    renderAuth(app);
  } else {
    state.session = session;
    await initData();
    renderAppContent();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (!session) {
      renderAuth(app);
    } else {
      initData().then(() => renderAppContent());
    }
  });
}

function renderAppContent() {
  if (!state.selectedCompany) {
    renderCompanies(app);
  } else {
    renderDashboard(app);
  }
}

// Subscribe to state changes to handle company switching
state.listeners.push(() => {
  const isDashboardVisible = !!document.getElementById('content-area');
  const shouldShowDashboard = !!state.selectedCompany;

  // Only re-render if the state doesn't match the current view
  if (isDashboardVisible !== shouldShowDashboard) {
    renderAppContent();
  }
});

init();

// Global helper for icons
window.renderIcons = () => {
  createIcons({ icons });
};

'use strict';

function notify(message, type = 'info', duration = 4000) {
  const colors = { success:'var(--a3)', error:'var(--ar)', info:'var(--ag)', warn:'var(--aw)' };
  const icons  = { success:'✓', error:'✕', info:'ℹ', warn:'⚠' };
  const toast  = document.createElement('div');
  toast.className = 'electro-toast';
  const offset = document.querySelectorAll('.electro-toast').length * 64;
  toast.style.cssText = `position:fixed;bottom:${24+offset}px;right:24px;z-index:9999;max-width:340px;padding:12px 16px;background:var(--bg3);border-radius:8px;border-left:3px solid ${colors[type]};box-shadow:0 4px 20px rgba(0,0,0,.4);font-family:var(--body);font-size:13px;color:var(--t);display:flex;align-items:flex-start;gap:10px;animation:slideIn .2s ease;transition:opacity .3s,transform .3s;`;
  toast.innerHTML = `<span style="color:${colors[type]};font-size:14px;flex-shrink:0">${icons[type]}</span><span>${message}</span>`;
  if (!document.getElementById('toast-styles')) {
    const s = document.createElement('style');
    s.id = 'toast-styles';
    s.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
  }
  document.body.appendChild(toast);
  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

function formatBytes(b) {
  if (b < 1024)    return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
  });
}

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

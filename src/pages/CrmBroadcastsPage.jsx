import React, { useState, useEffect, useRef } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmToast } from '../context/CrmToastContext';
import { useCrmAuth } from '../context/CrmAuthContext';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import {
  FiRadio,
  FiBell,
  FiSend,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiExternalLink,
  FiX,
  FiSun,
  FiMoon,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiRefreshCw,
  FiSave,
  FiCode,
  FiEye,
} from 'react-icons/fi';

export function CrmBroadcastsPage() {
  const { addToast } = useCrmToast();
  const { isManagerOrAdmin } = useCrmAuth();

  const [activeTab, setActiveTab] = useState('middle'); // 'middle' | 'notification'
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
  const [editorView, setEditorView] = useState('html'); // 'html' | 'body'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Center Modal Card state
  const [middleCard, setMiddleCard] = useState({
    id: '',
    title: 'Happy Diwali from Invio & Timrio!',
    subtitle: 'Wishing your business brilliant prosperity, boundless growth, and joyful success this festive season.',
    badge: 'Festive Greeting',
    plan: 'all',
    ctaLabel: 'Visit Website',
    actionUrl: 'https://invio.timrio.com',
    htmlContent: `<h2>✨ Wishing You a Joyous & Prosperous Diwali!</h2>
<p>As festival lights illuminate homes and shops across the country, the entire team at Invio extends our warmest blessings to you and your family.</p>
<blockquote>May this auspicious season bring boundless growth, smooth operations, and higher profits to your business!</blockquote>
<p><strong>Special Festive Notice:</strong></p>
<ul>
  <li>Our servers and automatic backups operate 24/7 uninterrupted.</li>
  <li>Priority support desk remains open throughout the holidays.</li>
  <li>Share invoices with festive greetings via WhatsApp in 1-tap.</li>
</ul>
<p>Thank you for letting Invio be a part of your daily billing journey. Have a sparkling celebration!</p>`,
    active: true,
  });

  // Notification Card state
  const [noticeCard, setNoticeCard] = useState({
    id: '',
    title: 'Happy Festive Season!',
    message: 'Wishing you and your business immense joy, growth, and prosperity from the Invio team! ✨',
    badge: 'Festive Wishes',
    actionType: 'info', // 'info' | 'success' | 'warning' | 'danger'
    actionLabel: 'Learn more',
    actionUrl: 'https://invio.timrio.com',
    active: true,
  });

  const textareaRef = useRef(null);

  // Load existing broadcasts from backend
  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getBroadcasts();
      if (res && res.success && res.broadcasts) {
        if (res.broadcasts.currentCampaign) {
          const c = res.broadcasts.currentCampaign;
          setMiddleCard({
            id: c.id || '',
            title: c.title || '',
            subtitle: c.subtitle || '',
            badge: c.badge || '',
            plan: c.plan || 'all',
            ctaLabel: c.ctaLabel || 'Check on Website',
            actionUrl: c.actionUrl || '',
            htmlContent: c.htmlContent || '',
            active: c.active !== false,
          });
        }
        if (res.broadcasts.currentNotice) {
          const n = res.broadcasts.currentNotice;
          setNoticeCard({
            id: n.id || '',
            title: n.title || '',
            message: n.message || '',
            badge: n.badge || '',
            actionType: n.actionType || 'info',
            actionLabel: n.actionLabel || '',
            actionUrl: n.actionUrl || '',
            active: n.active !== false,
          });
        }
      }
    } catch (err) {
      addToast(err?.message || 'Failed to load broadcasts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  // HTML Toolbar helper
  const insertHtmlTag = (openTag, closeTag = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = activeTab === 'middle' ? middleCard.htmlContent : noticeCard.message;
    const selected = text.substring(start, end);

    const replacement = selected
      ? `${openTag}${selected}${closeTag}`
      : `${openTag}${closeTag}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);

    if (activeTab === 'middle') {
      setMiddleCard((prev) => ({ ...prev, htmlContent: newText }));
    } else {
      setNoticeCard((prev) => ({ ...prev, message: newText }));
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
    }, 0);
  };

  // Save handler
  const handleSave = async () => {
    try {
      setSaving(true);
      if (activeTab === 'middle') {
        const payload = {
          id: middleCard.id || undefined,
          title: middleCard.title,
          subtitle: middleCard.subtitle,
          badge: middleCard.badge,
          plan: middleCard.plan,
          ctaLabel: middleCard.ctaLabel,
          actionUrl: middleCard.actionUrl,
          htmlContent: middleCard.htmlContent,
          active: middleCard.active,
          createNewVersion: true,
        };
        const res = await crmApi.updateMiddleCard(payload);
        if (res && res.success) {
          addToast(res.message || 'Center Modal Card broadcast updated & activated!', 'success');
          if (res.campaign?.id) {
            setMiddleCard((prev) => ({ ...prev, id: res.campaign.id }));
          }
        }
      } else {
        const payload = {
          id: noticeCard.id || undefined,
          title: noticeCard.title,
          message: noticeCard.message,
          badge: noticeCard.badge,
          actionType: noticeCard.actionType,
          actionLabel: noticeCard.actionLabel,
          actionUrl: noticeCard.actionUrl,
          active: noticeCard.active,
          createNewVersion: true,
        };
        const res = await crmApi.updateNotificationCard(payload);
        if (res && res.success) {
          addToast(res.message || 'Notification Card notice updated & activated!', 'success');
          if (res.notice?.id) {
            setNoticeCard((prev) => ({ ...prev, id: res.notice.id }));
          }
        }
      }
    } catch (err) {
      addToast(err?.message || 'Failed to save broadcast', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 font-sans">
      {/* Scoped Desktop App Styling & Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fluidArtShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }

        /* Scoped Desktop Inner Sheet */
        .desktop-card-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          width: min(520px, 100%);
          min-width: 0;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          border-radius: 20px !important;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28) !important;
          isolation: isolate;
          animation: slideInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-theme-light .desktop-card-inner {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
        }

        .desktop-theme-dark .desktop-card-inner {
          background: #0b0f19;
          border: 1px solid #2a3352;
          color: #f1f5f9;
        }

        /* Header Fluid Art */
        .desktop-art-header {
          position: relative;
          z-index: 1;
          flex: none;
          height: 140px;
          overflow: hidden;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4f46e5 100%);
          background-size: 200% 200%;
          animation: fluidArtShift 10s ease infinite;
        }

        .desktop-theme-dark .desktop-art-header {
          background: linear-gradient(135deg, #4338ca 0%, #312e81 45%, #1e1b4b 100%);
          background-size: 200% 200%;
          animation: fluidArtShift 10s ease infinite;
        }

        .desktop-head-block {
          position: absolute;
          inset: 0;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px 32px 10px;
        }

        .desktop-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #ea580c;
          background: rgba(234, 88, 12, 0.12);
          border: 1px solid rgba(234, 88, 12, 0.25);
          padding: 3px 10px;
          border-radius: 9999px !important;
          margin-bottom: 6px;
        }

        .desktop-card-title {
          margin: 0 0 6px;
          font-family: Georgia, 'Times New Roman', serif !important;
          font-size: 21px;
          font-weight: 600;
          line-height: 1.25;
          color: #ffffff;
          text-shadow: 0 1px 14px rgba(76, 60, 180, 0.5);
          text-wrap: balance;
        }

        .desktop-card-subtitle {
          margin: 0;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 12.5px;
          line-height: 1.45;
          color: rgba(255, 255, 255, 0.94);
          text-shadow: 0 1px 10px rgba(76, 60, 180, 0.45);
          max-width: 52ch;
          text-wrap: balance;
        }

        .desktop-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9999px !important;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(14px) saturate(140%);
          color: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .desktop-close-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.05);
        }

        .desktop-body-wrap {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          background: transparent;
          padding: 14px 24px 20px;
          gap: 16px;
          overflow-y: auto;
        }

        /* Formatted HTML Container */
        .desktop-html-container {
          margin: 0 0 16px;
          padding: 16px 20px;
          border-radius: 14px !important;
          max-height: 250px;
          overflow-y: auto;
          font-size: 13px;
          line-height: 1.55;
          text-align: left;
        }

        .desktop-theme-light .desktop-html-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          color: #475569;
        }

        .desktop-theme-dark .desktop-html-container {
          background: #151928;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          color: #cbd5e1;
        }

        .desktop-html-container h1,
        .desktop-html-container h2,
        .desktop-html-container h3,
        .desktop-html-container h4 {
          font-family: Georgia, 'Times New Roman', serif !important;
          margin: 0 0 8px;
          font-weight: 700;
          line-height: 1.3;
        }

        .desktop-theme-light .desktop-html-container h1,
        .desktop-theme-light .desktop-html-container h2,
        .desktop-theme-light .desktop-html-container h3,
        .desktop-theme-light .desktop-html-container h4 {
          color: #0f172a;
        }

        .desktop-theme-dark .desktop-html-container h1,
        .desktop-theme-dark .desktop-html-container h2,
        .desktop-theme-dark .desktop-html-container h3,
        .desktop-theme-dark .desktop-html-container h4 {
          color: #f8fafc;
        }

        .desktop-html-container h2 { font-size: 16px; }
        .desktop-html-container h3 { font-size: 14px; }

        .desktop-html-container p { margin: 0 0 10px; }
        .desktop-html-container p:last-child { margin-bottom: 0; }

        .desktop-html-container ul,
        .desktop-html-container ol {
          margin: 0 0 10px;
          padding-left: 20px;
        }

        .desktop-html-container li { margin-bottom: 4px; }

        .desktop-html-container a {
          color: #8646f4;
          text-decoration: underline;
          font-weight: 600;
        }

        .desktop-html-container blockquote {
          margin: 10px 0;
          padding: 8px 14px;
          border-left: 3px solid #8646f4;
          background: rgba(134, 70, 244, 0.05);
          border-radius: 0 8px 8px 0;
          font-style: italic;
        }

        .desktop-html-container .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px !important;
          font-size: 11px;
          font-weight: 700;
          background: #ede9fe;
          color: #8646f4;
        }

        /* Action Buttons */
        .desktop-claim-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #8646f4;
          color: #ffffff;
          border: none;
          border-radius: 8px !important;
          padding: 11px 20px;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: filter 0.15s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(134, 70, 244, 0.35);
        }

        .desktop-claim-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        .desktop-maybe-later-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 11.5px;
          cursor: pointer;
          padding: 4px;
          text-align: center;
          transition: color 0.15s ease;
        }

        .desktop-theme-light .desktop-maybe-later-btn:hover { color: #0f172a; }
        .desktop-theme-dark .desktop-maybe-later-btn:hover { color: #f1f5f9; }

        /* Notification Card */
        .desktop-notice-card {
          width: 320px;
          max-width: 100%;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          border-radius: 14px !important;
          padding: 13px 15px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          overflow: hidden;
          text-align: left;
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .desktop-theme-light .desktop-notice-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        }

        .desktop-theme-dark .desktop-notice-card {
          background: #181920;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5);
        }

        .desktop-notice-glow {
          position: absolute;
          top: -20px;
          right: -20px;
          width: 90px;
          height: 90px;
          background: radial-gradient(circle, rgba(134, 70, 244, 0.22) 0%, transparent 70%);
          pointer-events: none;
          animation: glowPulse 4s ease-in-out infinite;
        }

        .desktop-notice-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
          display: flex;
          align-items: center;
        }

        .desktop-theme-light .desktop-notice-title { color: #0f172a; }
        .desktop-theme-dark .desktop-notice-title { color: #f8fafc; }

        .desktop-notice-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 7px;
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-radius: 9999px !important;
          background: #ede9fe;
          color: #8646f4;
          border: 1px solid rgba(134, 70, 244, 0.25);
          margin-left: 6px;
          flex-shrink: 0;
        }

        .desktop-theme-dark .desktop-notice-badge {
          background: rgba(134, 70, 244, 0.2);
          color: #c4b5fd;
          border-color: rgba(134, 70, 244, 0.4);
        }

        .desktop-notice-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Avenir Next', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 11.5px;
          font-weight: 600;
          color: #8646f4;
          background: transparent;
          border: none;
          padding: 4px 0;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .desktop-notice-action-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>

      {/* Header Bar */}
      <div className="h-14 flex-shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FiRadio className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">In-App Cards & Broadcasts</h1>
            <p className="text-[11px] text-slate-500 leading-tight">
              Manage multi-purpose announcements, festival wishes, release alerts, and promos live in desktop app
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBroadcasts}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 flex items-center gap-1.5 transition"
            title="Refresh current broadcast data"
          >
            <FiRefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? <FiRefreshCw className="size-3 animate-spin" /> : <FiSave className="size-3" />}
              <span>Publish & Activate</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('middle')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'middle'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FiSend className="size-3.5" />
            <span>Center Modal Card (Middle Dialog / Wishes & Updates)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                middleCard.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {middleCard.active ? 'Active' : 'Disabled'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notification')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'notification'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FiBell className="size-3.5" />
            <span>Notification Card (Bottom-Right Floating Alert)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                noticeCard.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {noticeCard.active ? 'Active' : 'Disabled'}
            </span>
          </button>
        </div>

        {/* Preview Theme Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setPreviewTheme('light')}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
              previewTheme === 'light' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiSun className="size-3 text-amber-500" />
            <span>Light Preview</span>
          </button>
          <button
            onClick={() => setPreviewTheme('dark')}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
              previewTheme === 'dark' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FiMoon className="size-3 text-indigo-400" />
            <span>Dark Preview</span>
          </button>
        </div>
      </div>

      {/* Main Body: Two Columns (Left Editor, Right Live Desktop Preview) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Form & HTML Editor */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto p-5 border-r border-slate-200 space-y-4">
          {/* Form Fields for Middle Card */}
          {activeTab === 'middle' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  CARD METADATA & AUDIENCE
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-600">Active Broadcast:</span>
                  <input
                    type="checkbox"
                    checked={middleCard.active}
                    onChange={(e) => setMiddleCard({ ...middleCard, active: e.target.checked })}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Header</label>
                  <input
                    type="text"
                    value={middleCard.title}
                    onChange={(e) => setMiddleCard({ ...middleCard, title: e.target.value })}
                    placeholder="e.g. Happy Diwali from Invio & Timrio!"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Pill Text</label>
                  <input
                    type="text"
                    value={middleCard.badge}
                    onChange={(e) => setMiddleCard({ ...middleCard, badge: e.target.value })}
                    placeholder="e.g. Festive Greeting or Release v1.0.2"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Summary</label>
                <textarea
                  rows={2}
                  value={middleCard.subtitle}
                  onChange={(e) => setMiddleCard({ ...middleCard, subtitle: e.target.value })}
                  placeholder="Short engaging subtitle shown below the title..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={middleCard.plan}
                    onChange={(e) => setMiddleCard({ ...middleCard, plan: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">🌟 All Users (Free, Plus, Pro)</option>
                    <option value="free">Free Users Only</option>
                    <option value="plus">Plus Users Only</option>
                    <option value="pro">Pro Users Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Button CTA</label>
                  <input
                    type="text"
                    value={middleCard.ctaLabel}
                    onChange={(e) => setMiddleCard({ ...middleCard, ctaLabel: e.target.value })}
                    placeholder="e.g. Check on Website"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CTA Action URL</label>
                  <input
                    type="url"
                    value={middleCard.actionUrl}
                    onChange={(e) => setMiddleCard({ ...middleCard, actionUrl: e.target.value })}
                    placeholder="https://invio.timrio.com"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Rich HTML Content Section with Code vs Body Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Card HTML Content (Formatted Body)
                    </label>
                    <div className="text-[11px] text-slate-400">
                      Click toolbar items to insert tags
                    </div>
                  </div>

                  {/* Toggle between HTML code and Formatted Body */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setEditorView('html')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                        editorView === 'html'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FiCode className="size-3" />
                      <span>HTML Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('body')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                        editorView === 'body'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FiEye className="size-3" />
                      <span>Formatted Body</span>
                    </button>
                  </div>
                </div>

                {/* Toolbar */}
                {editorView === 'html' ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-2 rounded-t-lg border border-slate-300 border-b-0">
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h2>', '</h2>')}
                        className="px-2 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 bg-white"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h3>', '</h3>')}
                        className="px-2 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 bg-white"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<p>', '</p>')}
                        className="px-2 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-medium transition border border-slate-200 bg-white"
                        title="Paragraph"
                      >
                        P
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<blockquote>', '</blockquote>')}
                        className="px-2 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-xs italic transition border border-slate-200 bg-white"
                        title="Quote Callout"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<span class="badge">', '</span>')}
                        className="px-2 py-0.5 rounded hover:bg-slate-200 text-indigo-700 bg-indigo-50 text-xs font-semibold transition border border-indigo-200"
                        title="Badge Tag"
                      >
                        Badge
                      </button>

                      <div className="h-4 w-px bg-slate-300 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 bg-white"
                        title="Bold"
                      >
                        <FiBold className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs italic transition border border-slate-200 bg-white"
                        title="Italic"
                      >
                        <FiItalic className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<u>', '</u>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs underline transition border border-slate-200 bg-white"
                        title="Underline"
                      >
                        <FiUnderline className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n  <li>Second item</li>\n</ul>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs transition border border-slate-200 bg-white"
                        title="Bullet List"
                      >
                        <FiList className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<a href="https://invio.timrio.com">', '</a>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs transition border border-slate-200 bg-white"
                        title="Link"
                      >
                        <FiLink className="size-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={9}
                      value={middleCard.htmlContent}
                      onChange={(e) => setMiddleCard({ ...middleCard, htmlContent: e.target.value })}
                      placeholder="Write HTML content here..."
                      className="w-full text-xs font-mono px-3 py-2.5 rounded-b-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-emerald-400 selection:bg-indigo-700 leading-relaxed"
                    />
                  </>
                ) : (
                  <div
                    className="w-full min-h-[220px] max-h-[280px] overflow-y-auto p-4 rounded-lg border border-slate-300 bg-white text-slate-700 desktop-html-container shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(middleCard.htmlContent || '<p>No content entered yet.</p>'),
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Form Fields for Notification Card */
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  NOTIFICATION PROPERTIES
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-600">Active Notice:</span>
                  <input
                    type="checkbox"
                    checked={noticeCard.active}
                    onChange={(e) => setNoticeCard({ ...noticeCard, active: e.target.checked })}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Header</label>
                  <input
                    type="text"
                    value={noticeCard.title}
                    onChange={(e) => setNoticeCard({ ...noticeCard, title: e.target.value })}
                    placeholder="e.g. Cloud Maintenance"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity / Style</label>
                  <select
                    value={noticeCard.actionType}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionType: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="info">🔵 Info (Blue)</option>
                    <option value="success">🟢 Success / Festive (Green)</option>
                    <option value="warning">🟡 Warning / Advisory (Amber)</option>
                    <option value="danger">🔴 Danger / Critical (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Pill Text</label>
                  <input
                    type="text"
                    value={noticeCard.badge}
                    onChange={(e) => setNoticeCard({ ...noticeCard, badge: e.target.value })}
                    placeholder="e.g. Advisory or Notice"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Action Button Text</label>
                  <input
                    type="text"
                    value={noticeCard.actionLabel}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionLabel: e.target.value })}
                    placeholder="e.g. Learn more"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Action Button URL</label>
                  <input
                    type="url"
                    value={noticeCard.actionUrl}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionUrl: e.target.value })}
                    placeholder="https://invio.timrio.com"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Message Content Section with Code vs Body Toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Message Content (Formatted Body)
                    </label>
                    <div className="text-[11px] text-slate-400">
                      Renders in 320px floating card
                    </div>
                  </div>

                  {/* Toggle between HTML code and Formatted Body */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setEditorView('html')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                        editorView === 'html'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FiCode className="size-3" />
                      <span>HTML Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('body')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                        editorView === 'body'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FiEye className="size-3" />
                      <span>Formatted Body</span>
                    </button>
                  </div>
                </div>

                {editorView === 'html' ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-2 rounded-t-lg border border-slate-300 border-b-0">
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 bg-white"
                        title="Bold"
                      >
                        <FiBold className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs italic transition border border-slate-200 bg-white"
                        title="Italic"
                      >
                        <FiItalic className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<a href="https://invio.timrio.com">', '</a>')}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs transition border border-slate-200 bg-white"
                        title="Link"
                      >
                        <FiLink className="size-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={5}
                      value={noticeCard.message}
                      onChange={(e) => setNoticeCard({ ...noticeCard, message: e.target.value })}
                      placeholder="Enter notification message here..."
                      className="w-full text-xs font-mono px-3 py-2.5 rounded-b-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-emerald-400 selection:bg-indigo-700 leading-relaxed"
                    />
                  </>
                ) : (
                  <div
                    className="w-full min-h-[140px] p-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs leading-relaxed shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(noticeCard.message || 'No notification message entered.'),
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Desktop App Preview */}
        <div className={`w-full lg:w-1/2 h-full overflow-y-auto p-6 flex flex-col items-center justify-center relative ${
          previewTheme === 'dark' ? 'desktop-theme-dark bg-[#0f172a]' : 'desktop-theme-light bg-slate-200/80'
        }`}>
          {/* Preview Dimensions Badge */}
          <div className="w-full max-w-[520px] flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Desktop UI Preview ({previewTheme === 'dark' ? 'Dark Theme' : 'Light Theme'})</span>
            </span>
            <span className="font-mono text-[11px] bg-slate-300/80 px-2 py-0.5 rounded text-slate-700">
              {activeTab === 'middle' ? 'Width: 520px · Radius: 20px' : 'Width: 320px · Radius: 14px'}
            </span>
          </div>

          {/* PREVIEW CONTAINER */}
          {activeTab === 'middle' ? (
            /* Center Modal Card Live Preview */
            <div className="desktop-card-inner">
              {/* Header Fluid Wave Art (140px) */}
              <div className="desktop-art-header">
                <div className="desktop-head-block">
                  {/* Badge Pill */}
                  {middleCard.badge ? (
                    <span className="desktop-pill-badge">
                      {middleCard.badge}
                    </span>
                  ) : null}

                  {/* Title */}
                  <h2 className="desktop-card-title">
                    {middleCard.title || 'Try Invio Plus'}
                  </h2>

                  {/* Subtitle */}
                  {middleCard.subtitle ? (
                    <p className="desktop-card-subtitle">
                      {middleCard.subtitle}
                    </p>
                  ) : null}
                </div>

                {/* Close Button X */}
                <button
                  type="button"
                  className="desktop-close-btn"
                  title="Close"
                  aria-label="Close"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Modal Body & HTML Container */}
              <div className="desktop-body-wrap">
                <div
                  className="desktop-html-container"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(middleCard.htmlContent || '<p>No content provided</p>'),
                  }}
                />

                {/* Action Buttons */}
                <div className="offerUpsellCard__actions">
                  <button
                    type="button"
                    className="desktop-claim-btn"
                  >
                    <span>{middleCard.ctaLabel || 'Check on Website'}</span>
                  </button>

                  <button
                    type="button"
                    className="desktop-maybe-later-btn"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Notification Card Live Preview (Exact 320px width) */
            <aside className="desktop-notice-card">
              <div className="desktop-notice-glow" />

              <div className="flex items-center justify-between gap-2 min-h-[20px]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`size-4 inline-flex items-center justify-center flex-shrink-0 ${
                      noticeCard.actionType === 'danger'
                        ? 'text-red-500'
                        : noticeCard.actionType === 'warning'
                        ? 'text-amber-500'
                        : noticeCard.actionType === 'success'
                        ? 'text-emerald-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {noticeCard.actionType === 'danger' ? (
                      <FiAlertCircle size={16} />
                    ) : noticeCard.actionType === 'warning' ? (
                      <FiAlertTriangle size={16} />
                    ) : noticeCard.actionType === 'success' ? (
                      <FiCheckCircle size={16} />
                    ) : (
                      <FiInfo size={16} />
                    )}
                  </span>

                  <h4 className="desktop-notice-title truncate">
                    {noticeCard.title || 'System notification'}
                  </h4>

                  {noticeCard.badge ? (
                    <span className="desktop-notice-badge">
                      {noticeCard.badge}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="desktop-close-btn !relative !top-auto !right-auto !size-5 !bg-transparent !border-none !text-slate-400 hover:!text-slate-600"
                  title="Dismiss notification"
                >
                  <FiX size={14} />
                </button>
              </div>

              {/* Message Content */}
              <div
                className="text-[12px] leading-[1.45] text-slate-600 desktop-theme-dark:text-slate-300"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(noticeCard.message || 'Notification content...'),
                }}
              />

              {/* Action Button */}
              {noticeCard.actionLabel ? (
                <div className="pt-0.5 flex items-center">
                  <button
                    type="button"
                    className="desktop-notice-action-btn"
                  >
                    <span>{noticeCard.actionLabel}</span>
                    <FiExternalLink size={12} />
                  </button>
                </div>
              ) : null}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

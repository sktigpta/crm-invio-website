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
  FiChevronDown,
  FiCheck,
} from 'react-icons/fi';

export function CrmBroadcastsPage() {
  const { addToast } = useCrmToast();
  const { isManagerOrAdmin } = useCrmAuth();

  const [activeTab, setActiveTab] = useState('middle'); // 'middle' | 'notification'
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
  const [editorView, setEditorView] = useState('html'); // 'html' | 'body'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Center Modal Card state
  const [middleCard, setMiddleCard] = useState({
    id: '',
    title: 'Happy Festive Season from Invio & Timrio',
    subtitle: 'Wishing your business continued prosperity, seamless billing operations, and ongoing growth.',
    badge: 'Festive Greeting',
    plan: 'all',
    ctaLabel: 'Visit Website',
    actionUrl: 'https://invio.timrio.com',
    htmlContent: `<h2>Wishing You a Joyous & Prosperous Festive Season</h2>
<p>The entire team at Invio extends our warmest blessings to you and your business operations.</p>
<blockquote>May this season bring steady growth, streamlined operations, and higher billing efficiency to your business.</blockquote>
<p><strong>Highlights & Features:</strong></p>
<ul>
  <li>Continuous 24/7 high-speed cloud synchronization and automated local backups.</li>
  <li>Priority support desk available throughout all working hours.</li>
  <li>Instant WhatsApp invoice delivery with automated tax breakdowns.</li>
</ul>
<p>Thank you for partnering with Invio for your daily billing journey.</p>`,
    active: true,
  });

  // Notification Card state
  const [noticeCard, setNoticeCard] = useState({
    id: '',
    title: 'Scheduled System Maintenance',
    message: 'Invio cloud services will undergo scheduled infrastructure optimization on Sunday, 02:00 AM UTC. Desktop local billing remains fully functional.',
    actionType: 'info', // 'info' | 'success' | 'warning' | 'danger'
    actionLabel: 'Learn more',
    actionUrl: 'https://invio.timrio.com',
    active: true,
  });

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          addToast(res.message || 'Center Modal Card broadcast updated & activated.', 'success');
          if (res.campaign?.id) {
            setMiddleCard((prev) => ({ ...prev, id: res.campaign.id }));
          }
        }
      } else {
        const payload = {
          id: noticeCard.id || undefined,
          title: noticeCard.title,
          message: noticeCard.message,
          actionType: noticeCard.actionType,
          actionLabel: noticeCard.actionLabel,
          actionUrl: noticeCard.actionUrl,
          active: noticeCard.active,
          createNewVersion: true,
        };
        const res = await crmApi.updateNotificationCard(payload);
        if (res && res.success) {
          addToast(res.message || 'Notification Card notice updated & activated.', 'success');
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
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 font-sans select-none m-0 p-0">
      {/* Scoped Desktop App Styles & Keyframes */}
      <style>{`
        @keyframes desktopSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes desktopArtShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes desktopGlowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.06); }
        }

        .desktop-preview-modal {
          animation: desktopSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .desktop-preview-header {
          background-size: 200% 200%;
          animation: desktopArtShift 12s ease infinite;
        }

        .desktop-html-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .desktop-html-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .desktop-html-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 9999px;
        }
        .desktop-html-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>

      {/* Merged Unified Top Control Bar */}
      <div className="h-13 flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-5 flex items-center justify-between gap-3 z-20">
        {/* Left: Title & Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-7.5 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <FiRadio className="size-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-slate-900 leading-none truncate">
              In-App Cards & Broadcasts
            </h1>
            <p className="text-[10.5px] text-slate-500 leading-tight truncate hidden sm:block mt-0.5">
              Manage multi-purpose announcements, festival wishes, release alerts, and promos live in desktop app
            </p>
          </div>
        </div>

        {/* Center: Dropdown Selector for Slot */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            {activeTab === 'middle' ? (
              <FiSend className="size-3.5 text-indigo-600 flex-shrink-0" />
            ) : (
              <FiBell className="size-3.5 text-indigo-600 flex-shrink-0" />
            )}
            <span className="font-semibold text-slate-900">
              {activeTab === 'middle'
                ? 'Center Modal Card (Middle Dialog / Wishes & Updates)'
                : 'Notification Card (Bottom-Right Floating Alert)'}
            </span>
            <span
              className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                (activeTab === 'middle' ? middleCard.active : noticeCard.active)
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {(activeTab === 'middle' ? middleCard.active : noticeCard.active) ? 'ACTIVE' : 'DISABLED'}
            </span>
            <FiChevronDown
              className={`size-3.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-96 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('middle');
                  setDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition cursor-pointer ${
                  activeTab === 'middle' ? 'bg-indigo-50/70 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <FiSend className={`size-4 mt-0.5 flex-shrink-0 ${activeTab === 'middle' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-semibold text-slate-900 leading-tight">Center Modal Card</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Middle Dialog / Wishes & Updates</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                      middleCard.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {middleCard.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  {activeTab === 'middle' && <FiCheck className="size-3.5 text-indigo-600" />}
                </div>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={() => {
                  setActiveTab('notification');
                  setDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition cursor-pointer ${
                  activeTab === 'notification' ? 'bg-indigo-50/70 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <FiBell className={`size-4 mt-0.5 flex-shrink-0 ${activeTab === 'notification' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-semibold text-slate-900 leading-tight">Notification Card</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Bottom-Right Floating Alert</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                      noticeCard.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {noticeCard.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                  {activeTab === 'notification' && <FiCheck className="size-3.5 text-indigo-600" />}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Only Logo Preview Toggle, Refresh, Publish & Activate */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Logo-only Theme Toggle (Sun / Moon) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewTheme('light')}
              title="Light Preview"
              aria-label="Light Preview"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                previewTheme === 'light'
                  ? 'bg-white text-amber-600 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FiSun className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewTheme('dark')}
              title="Dark Preview"
              aria-label="Dark Preview"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                previewTheme === 'dark'
                  ? 'bg-slate-900 text-indigo-300 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FiMoon className="size-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadBroadcasts}
            disabled={loading}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title="Refresh broadcast state"
          >
            <FiRefreshCw className={`size-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Publish & Activate Button */}
          {isManagerOrAdmin && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? <FiRefreshCw className="size-3.5 animate-spin" /> : <FiSave className="size-3.5" />}
              <span>Publish & Activate</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Left Editor | Right Live Desktop Preview */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Side: CARD METADATA & AUDIENCE */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto p-4 md:p-5 border-r border-slate-200 space-y-4 bg-white select-text">
          {activeTab === 'middle' ? (
            /* Center Modal Card Form */
            <div className="space-y-4">
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    CARD METADATA & AUDIENCE
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configuration and targeting parameters for middle dialog card
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Active Status</span>
                  <input
                    type="checkbox"
                    checked={middleCard.active}
                    onChange={(e) => setMiddleCard({ ...middleCard, active: e.target.checked })}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Title & Badge Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Header</label>
                  <input
                    type="text"
                    value={middleCard.title}
                    onChange={(e) => setMiddleCard({ ...middleCard, title: e.target.value })}
                    placeholder="e.g. Happy Festive Season from Invio"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Pill Text</label>
                  <input
                    type="text"
                    value={middleCard.badge}
                    onChange={(e) => setMiddleCard({ ...middleCard, badge: e.target.value })}
                    placeholder="e.g. Festive Greeting or Release v1.0.2"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Summary</label>
                <textarea
                  rows={2}
                  value={middleCard.subtitle}
                  onChange={(e) => setMiddleCard({ ...middleCard, subtitle: e.target.value })}
                  placeholder="Short engaging summary displayed below title..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition resize-none"
                />
              </div>

              {/* Audience, Primary CTA, CTA URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={middleCard.plan}
                    onChange={(e) => setMiddleCard({ ...middleCard, plan: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition cursor-pointer"
                  >
                    <option value="all">All Users (Free, Plus, Pro)</option>
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
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CTA Action URL</label>
                  <input
                    type="url"
                    value={middleCard.actionUrl}
                    onChange={(e) => setMiddleCard({ ...middleCard, actionUrl: e.target.value })}
                    placeholder="https://invio.timrio.com"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Formatted HTML Body Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-800">
                      Card Content (HTML)
                    </label>
                    <span className="text-[11px] text-slate-400 block">
                      Formatting tools apply directly to text selection
                    </span>
                  </div>

                  {/* Toggle View: HTML Code vs Formatted Body */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditorView('html')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        editorView === 'html'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FiCode className="size-3" />
                      <span>HTML Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('body')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        editorView === 'body'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FiEye className="size-3" />
                      <span>Preview Body</span>
                    </button>
                  </div>
                </div>

                {editorView === 'html' ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600">
                    {/* HTML Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-50 px-2 py-1.5 border-b border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h2>', '</h2>')}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-200/80 transition"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h3>', '</h3>')}
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-200/80 transition"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<p>', '</p>')}
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-200/80 transition"
                        title="Paragraph"
                      >
                        P
                      </button>

                      <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<blockquote>', '</blockquote>')}
                        className="px-2 py-0.5 rounded text-[11px] italic text-slate-700 hover:bg-slate-200/80 transition"
                        title="Quote Callout"
                      >
                        Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<span class="badge">', '</span>')}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-200"
                        title="Badge Tag"
                      >
                        Badge
                      </button>

                      <div className="h-3.5 w-px bg-slate-300 mx-0.5" />

                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Bold"
                      >
                        <FiBold className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Italic"
                      >
                        <FiItalic className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<u>', '</u>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Underline"
                      >
                        <FiUnderline className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n  <li>Item 2</li>\n</ul>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Bullet List"
                      >
                        <FiList className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<a href="https://invio.timrio.com">', '</a>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Link"
                      >
                        <FiLink className="size-3" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={10}
                      value={middleCard.htmlContent}
                      onChange={(e) => setMiddleCard({ ...middleCard, htmlContent: e.target.value })}
                      placeholder="Write HTML content here..."
                      className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 focus:outline-none selection:bg-indigo-600 leading-relaxed resize-none"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full min-h-[220px] max-h-[300px] overflow-y-auto p-4 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs leading-relaxed desktop-html-scroll"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(middleCard.htmlContent || '<p>No content provided</p>'),
                    }}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Notification Card Form */
            <div className="space-y-4">
              {/* Header Box */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    NOTIFICATION PROPERTIES
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configuration for bottom-right floating desktop alert card
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700">Active Notice</span>
                  <input
                    type="checkbox"
                    checked={noticeCard.active}
                    onChange={(e) => setNoticeCard({ ...noticeCard, active: e.target.checked })}
                    className="size-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Title & Severity Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Header</label>
                  <input
                    type="text"
                    value={noticeCard.title}
                    onChange={(e) => setNoticeCard({ ...noticeCard, title: e.target.value })}
                    placeholder="e.g. Scheduled System Maintenance"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity / Style</label>
                  <select
                    value={noticeCard.actionType}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionType: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition cursor-pointer"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success / Festive (Emerald)</option>
                    <option value="warning">Warning / Advisory (Amber)</option>
                    <option value="danger">Danger / Critical (Rose)</option>
                  </select>
                </div>
              </div>

              {/* Button Text & Button URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Action Button Text</label>
                  <input
                    type="text"
                    value={noticeCard.actionLabel}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionLabel: e.target.value })}
                    placeholder="e.g. Learn more"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Action Button URL</label>
                  <input
                    type="url"
                    value={noticeCard.actionUrl}
                    onChange={(e) => setNoticeCard({ ...noticeCard, actionUrl: e.target.value })}
                    placeholder="https://invio.timrio.com"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white text-slate-800 transition"
                  />
                </div>
              </div>

              {/* Message Content with Code vs Body Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-800">
                      Message Content (HTML)
                    </label>
                    <span className="text-[11px] text-slate-400 block">
                      Renders in 320px floating card
                    </span>
                  </div>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditorView('html')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        editorView === 'html'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FiCode className="size-3" />
                      <span>HTML Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorView('body')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                        editorView === 'body'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FiEye className="size-3" />
                      <span>Preview Body</span>
                    </button>
                  </div>
                </div>

                {editorView === 'html' ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600">
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 border-b border-slate-200">
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Bold"
                      >
                        <FiBold className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Italic"
                      >
                        <FiItalic className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<a href="https://invio.timrio.com">', '</a>')}
                        className="p-1.5 rounded text-slate-700 hover:bg-slate-200/80 transition"
                        title="Link"
                      >
                        <FiLink className="size-3" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={6}
                      value={noticeCard.message}
                      onChange={(e) => setNoticeCard({ ...noticeCard, message: e.target.value })}
                      placeholder="Enter notification message here..."
                      className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 focus:outline-none selection:bg-indigo-600 leading-relaxed resize-none"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full min-h-[140px] p-3 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs leading-relaxed desktop-html-scroll"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(noticeCard.message || '<p>No content entered.</p>'),
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Desktop App Preview */}
        <div
          className={`w-full lg:w-1/2 h-full overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-center relative transition-colors duration-200 ${
            previewTheme === 'dark' ? 'bg-[#0b0f19]' : 'bg-slate-100/90'
          }`}
        >
          {activeTab === 'middle' ? (
            /* Center Modal Card Live Preview (Exact Desktop Replica) */
            <div
              className={`desktop-preview-modal w-full max-w-[480px] rounded-2xl overflow-hidden border shadow-2xl transition-all duration-200 ${
                previewTheme === 'dark'
                  ? 'bg-[#131826] border-slate-700/80 text-slate-100 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)]'
                  : 'bg-white border-slate-200 text-slate-900 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)]'
              }`}
            >
              {/* Header Fluid Art Wave */}
              <div
                className={`desktop-preview-header h-34 relative flex flex-col items-center justify-center p-5 text-center text-white ${
                  previewTheme === 'dark'
                    ? 'bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700'
                }`}
              >
                {/* Close Button X */}
                <button
                  type="button"
                  className="absolute top-3.5 right-3.5 size-7.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white text-xs backdrop-blur-xs transition cursor-pointer"
                  title="Close"
                  aria-label="Close"
                >
                  <FiX className="size-4" />
                </button>

                {/* Badge Pill */}
                {middleCard.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 border border-white/30 px-2.5 py-0.5 rounded-full mb-1.5 shadow-2xs">
                    {middleCard.badge}
                  </span>
                )}

                {/* Title */}
                <h3
                  className="text-lg md:text-xl font-bold leading-tight max-w-sm"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  {middleCard.title || 'Try Invio Plus'}
                </h3>

                {/* Subtitle */}
                {middleCard.subtitle && (
                  <p className="text-xs text-white/90 line-clamp-2 mt-1 max-w-sm">
                    {middleCard.subtitle}
                  </p>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div
                  className={`text-xs leading-relaxed max-h-52 overflow-y-auto p-4 rounded-xl border desktop-html-scroll ${
                    previewTheme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-150 text-slate-700'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(middleCard.htmlContent || '<p>No content provided</p>'),
                  }}
                />

                {/* Buttons with Real UI Effects */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md transition-all duration-150 cursor-pointer"
                  >
                    {middleCard.ctaLabel || 'Check on Website'}
                  </button>

                  <button
                    type="button"
                    className="w-full py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Notification Notice Card Live Preview (320px) */
            <div
              className={`desktop-preview-modal w-80 rounded-xl p-4 shadow-xl border relative transition-all duration-200 ${
                previewTheme === 'dark'
                  ? 'bg-[#151928] border-slate-700/80 text-slate-100 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.5)]'
                  : 'bg-white border-slate-200 text-slate-800 shadow-[0_16px_36px_-8px_rgba(15,23,42,0.14)]'
              }`}
            >
              {/* Severity Glow */}
              <div
                className={`absolute -top-4 -right-4 size-20 rounded-full blur-xl pointer-events-none opacity-40 ${
                  noticeCard.actionType === 'danger'
                    ? 'bg-rose-500'
                    : noticeCard.actionType === 'warning'
                    ? 'bg-amber-500'
                    : noticeCard.actionType === 'success'
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
                style={{ animation: 'desktopGlowPulse 4s ease-in-out infinite' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-2 relative z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`size-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                      noticeCard.actionType === 'danger'
                        ? 'text-rose-500'
                        : noticeCard.actionType === 'warning'
                        ? 'text-amber-500'
                        : noticeCard.actionType === 'success'
                        ? 'text-emerald-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {noticeCard.actionType === 'danger' ? (
                      <FiAlertCircle className="size-4" />
                    ) : noticeCard.actionType === 'warning' ? (
                      <FiAlertTriangle className="size-4" />
                    ) : noticeCard.actionType === 'success' ? (
                      <FiCheckCircle className="size-4" />
                    ) : (
                      <FiInfo className="size-4" />
                    )}
                  </span>
                  <h4 className="text-xs font-bold truncate">
                    {noticeCard.title || 'System Notification'}
                  </h4>
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                  title="Dismiss"
                  aria-label="Dismiss"
                >
                  <FiX className="size-3.5" />
                </button>
              </div>

              {/* Message */}
              <div
                className={`text-xs leading-relaxed mb-3 desktop-html-scroll max-h-36 overflow-y-auto relative z-10 ${
                  previewTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(noticeCard.message || 'Notification content...'),
                }}
              />

              {/* Action Button */}
              {noticeCard.actionLabel && (
                <div className="pt-0.5 flex items-center relative z-10">
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{noticeCard.actionLabel}</span>
                    <FiExternalLink className="size-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

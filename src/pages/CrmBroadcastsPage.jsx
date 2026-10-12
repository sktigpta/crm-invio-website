import React, { useState, useEffect, useRef } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmToast } from '../context/CrmToastContext';
import { useCrmAuth } from '../context/CrmAuthContext';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import {
  FiRadio,
  FiBell,
  FiSend,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
  FiCheckCircle,
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
  FiImage,
  FiType,
  FiFileText,
  FiRefreshCw,
  FiSave,
} from 'react-icons/fi';

const MIDDLE_CARD_TEMPLATES = [
  {
    name: '🪔 Diwali Festival Wish',
    badge: 'Festive Greeting',
    title: 'Happy Diwali from Invio & Timrio!',
    subtitle: 'Wishing your business brilliant prosperity, boundless growth, and joyful success this festive season.',
    ctaLabel: 'Visit Website',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
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
  },
  {
    name: '🎉 New Year 2026 Celebration',
    badge: 'New Year Special',
    title: 'Happy New Year 2026!',
    subtitle: 'Ready to make 2026 your most profitable business year yet? Here is what is coming to Invio.',
    ctaLabel: 'See 2026 Roadmap',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
    htmlContent: `<h2>🚀 Welcome to 2026 with Invio!</h2>
<p>Cheers to new milestones and fresh opportunities. Thank you for powering your billing and inventory with us throughout the past year.</p>
<p><strong>Coming in Early 2026:</strong></p>
<ul>
  <li>Enhanced multi-branch stock synchronization across stores.</li>
  <li>AI-assisted invoice categorization and expenditure insights.</li>
  <li>Faster Bluetooth thermal printing & barcode scanner latency.</li>
</ul>
<p>Wishing you, your staff, and your families health, peace, and immense business growth!</p>`,
  },
  {
    name: '🌙 Eid Mubarak Greeting',
    badge: 'Festive Blessing',
    title: 'Eid Mubarak to You & Your Family!',
    subtitle: 'May this blessed occasion shower your home and enterprise with happiness, health, and harmony.',
    ctaLabel: 'Visit Invio',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
    htmlContent: `<h2>🌙 Warmest Eid Greetings!</h2>
<p>Sending heartfelt greetings and peace to all our valued merchants and their families celebrating around the world.</p>
<blockquote>May your efforts be blessed with continuous abundance, harmony, and prosperity.</blockquote>
<p>Our cloud services and offline POS billing are running smoothly to ensure your festive sales rush is effortless.</p>`,
  },
  {
    name: '🎄 Christmas & Holiday Season',
    badge: "Season's Greetings",
    title: 'Merry Christmas & Happy Holidays!',
    subtitle: 'Sending cheer, peace, and heartfelt gratitude to all our wonderful merchants and partners.',
    ctaLabel: 'Holiday Notes',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
    htmlContent: `<h2>🎄 Season's Greetings from Team Invio!</h2>
<p>During this joyful holiday season, we want to express our deepest gratitude for your continued trust and partnership.</p>
<ul>
  <li>Ensure your year-end tax ledgers and reports are exported under <strong>Reports → Tax Summary</strong>.</li>
  <li>Holiday customer support remains active via ticket and email.</li>
</ul>
<p>Wishing you cozy holidays and a wonderful start to the coming year!</p>`,
  },
  {
    name: '🚀 Product Release v1.0.2',
    badge: 'Release v1.0.2',
    title: 'Invio v1.0.2 is Here!',
    subtitle: 'Supercharged with POS customer displays, instant thermal receipt auto-cut, and lightning sync.',
    ctaLabel: 'Check on Website',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
    htmlContent: `<h2>✨ What's New in v1.0.2</h2>
<p>We've polished Invio from the ground up to give you the fastest, most reliable local-first POS billing experience:</p>
<ul>
  <li><strong>Dual-Screen POS Display:</strong> Real-time customer-facing display with dynamic UPI QR payment.</li>
  <li><strong>Thermal Printing:</strong> Seamless 58mm and 80mm roll formatting with auto-paper cut.</li>
  <li><strong>Instant WhatsApp Billing:</strong> Pre-filled paid invoices delivered to clients in seconds.</li>
  <li><strong>Local Resilience:</strong> 100% offline billing that safeguards your records during internet drops.</li>
</ul>
<p>Update is automatically available for your platform today.</p>`,
  },
  {
    name: '⚠️ Scheduled Maintenance Advisory',
    badge: 'System Advisory',
    title: 'Scheduled Cloud Maintenance',
    subtitle: 'Upgrading cloud sync infrastructure on Sunday night. Local offline billing is 100% unaffected.',
    ctaLabel: 'System Status',
    actionUrl: 'https://invio.timrio.com',
    plan: 'all',
    htmlContent: `<h2>🛠️ Cloud Sync Infrastructure Upgrade</h2>
<p>We are performing scheduled maintenance on our PostgreSQL synchronization cluster to improve connection latency and database backup speeds.</p>
<blockquote><strong>Maintenance Window:</strong> Sunday, 2:00 AM – 3:30 AM IST</blockquote>
<p><strong>Good News:</strong></p>
<p>Invio operates <em>Local-First</em>. You can continue creating bills, printing receipts, and managing inventory offline as normal. Once maintenance concludes, cloud sync will resume automatically.</p>`,
  },
  {
    name: '⭐ Try Invio Plus Offer',
    badge: 'Power Features',
    title: 'Try Invio Plus',
    subtitle: 'Unlock thermal printing, POS billing, WhatsApp sharing, automated GST, and unlimited invoicing.',
    ctaLabel: 'Check on Website',
    actionUrl: 'https://invio.timrio.com/pricing',
    plan: 'free',
    htmlContent: `<h2>Upgrade Your Business with Plus</h2>
<p>Take your billing and inventory management to the professional level with Invio Plus:</p>
<ul>
  <li>Unlimited products, customers, and invoice generations.</li>
  <li>Thermal receipt printing (58mm and 80mm rolls) with auto-cut.</li>
  <li>Automated 1-click WhatsApp and Gmail delivery.</li>
  <li>Customer-facing POS screen with dynamic UPI payment QR.</li>
  <li>PostgreSQL multi-store cloud database synchronization.</li>
</ul>
<p>Annual plans start at an unbeatable price with full priority support.</p>`,
  },
];

const NOTIFICATION_CARD_TEMPLATES = [
  {
    name: '🪔 Festive Season Greeting',
    title: 'Happy Festive Season!',
    message: 'Wishing you and your business immense joy, growth, and prosperity from the Invio team! ✨',
    badge: 'Festive Wishes',
    actionType: 'success',
    actionLabel: 'Learn more',
    actionUrl: 'https://invio.timrio.com',
  },
  {
    name: '🚀 New Update v1.0.2 Ready',
    title: 'Invio v1.0.2 Available',
    message: 'Enjoy second-screen customer POS displays, 58mm/80mm thermal rolls, and ultra-fast offline billing.',
    badge: 'Update',
    actionType: 'info',
    actionLabel: 'Release Notes',
    actionUrl: 'https://invio.timrio.com',
  },
  {
    name: '⚠️ Cloud Maintenance Notice',
    title: 'Cloud Maintenance Advisory',
    message: 'Scheduled cloud database upgrade tonight 2:00 AM IST. Local offline billing continues without interruption.',
    badge: 'Advisory',
    actionType: 'warning',
    actionLabel: 'Check Status',
    actionUrl: 'https://invio.timrio.com',
  },
  {
    name: '🚨 Payment Gateway Alert',
    title: 'Banking Gateway Latency',
    message: 'Upstream banking delays observed on UPI networks. Kindly verify customer receipts on transaction screen.',
    badge: 'Alert',
    actionType: 'danger',
    actionLabel: 'Details',
    actionUrl: 'https://invio.timrio.com',
  },
];

export function CrmBroadcastsPage() {
  const { addToast } = useCrmToast();
  const { isManagerOrAdmin } = useCrmAuth();

  const [activeTab, setActiveTab] = useState('middle'); // 'middle' | 'notification'
  const [previewTheme, setPreviewTheme] = useState('light'); // 'light' | 'dark'
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
    htmlContent: `<h2>✨ Wishing You a Joyous & Prosperous Diwali!</h2>\n<p>May this festive season illuminate your business with immense growth, joy, and prosperity.</p>`,
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

  // Preset Template Selectors
  const applyMiddleTemplate = (tmpl) => {
    setMiddleCard((prev) => ({
      ...prev,
      title: tmpl.title,
      subtitle: tmpl.subtitle,
      badge: tmpl.badge,
      ctaLabel: tmpl.ctaLabel,
      actionUrl: tmpl.actionUrl,
      plan: tmpl.plan || 'all',
      htmlContent: tmpl.htmlContent,
      active: true,
    }));
    addToast(`Loaded preset template: "${tmpl.name}"`, 'info');
  };

  const applyNoticeTemplate = (tmpl) => {
    setNoticeCard((prev) => ({
      ...prev,
      title: tmpl.title,
      message: tmpl.message,
      badge: tmpl.badge,
      actionType: tmpl.actionType,
      actionLabel: tmpl.actionLabel,
      actionUrl: tmpl.actionUrl,
      active: true,
    }));
    addToast(`Loaded preset notice: "${tmpl.name}"`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
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

      {/* Main Body: Two Columns (Left Editor, Right Live Preview) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Form & HTML Editor */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto p-5 border-r border-slate-200 space-y-4">
          {/* Preset Templates Quick Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FiFileText className="size-3.5 text-indigo-500" />
                <span>Load Preset Template</span>
              </span>
              <span className="text-[11px] text-slate-400">Instantly populate pre-formatted festive & advisory cards</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeTab === 'middle'
                ? MIDDLE_CARD_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => applyMiddleTemplate(tmpl)}
                      className="text-left text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition cursor-pointer font-medium leading-tight"
                    >
                      {tmpl.name}
                    </button>
                  ))
                : NOTIFICATION_CARD_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => applyNoticeTemplate(tmpl)}
                      className="text-left text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition cursor-pointer font-medium leading-tight"
                    >
                      {tmpl.name}
                    </button>
                  ))}
            </div>
          </div>

          {/* Form Fields for Middle Card */}
          {activeTab === 'middle' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Card Metadata & Audience
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title Header</label>
                  <input
                    type="text"
                    value={middleCard.title}
                    onChange={(e) => setMiddleCard({ ...middleCard, title: e.target.value })}
                    placeholder="e.g. Happy Diwali from Invio!"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              {/* Rich HTML Editor & Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Card HTML Content (Formatted Body)
                  </label>
                  <span className="text-[11px] text-slate-400">Click toolbar items to insert tags</span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-t-lg border border-slate-300 border-b-0">
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<strong>', '</strong>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    title="Bold"
                  >
                    <FiBold className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<em>', '</em>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs italic transition"
                    title="Italic"
                  >
                    <FiItalic className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<u>', '</u>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs underline transition"
                    title="Underline"
                  >
                    <FiUnderline className="size-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<h2>', '</h2>')}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<h3>', '</h3>')}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<p>', '</p>')}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                    title="Paragraph"
                  >
                    P
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<ul>\n  <li>', '</li>\n  <li>Second item</li>\n</ul>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs transition"
                    title="Bullet List"
                  >
                    <FiList className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<blockquote>', '</blockquote>')}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-slate-700 text-[11px] italic transition"
                    title="Quote Callout"
                  >
                    Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<span class="badge">', '</span>')}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-200 text-indigo-700 bg-indigo-50 text-[11px] font-semibold transition"
                    title="Badge Tag"
                  >
                    Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<a href="https://invio.timrio.com" target="_blank">', '</a>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs transition"
                    title="Link"
                  >
                    <FiLink className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600" alt="Festive banner" />')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs transition"
                    title="Image"
                  >
                    <FiImage className="size-3.5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  value={middleCard.htmlContent}
                  onChange={(e) => setMiddleCard({ ...middleCard, htmlContent: e.target.value })}
                  placeholder="Write HTML content here..."
                  className="w-full text-xs font-mono px-3 py-2 rounded-b-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-emerald-400 selection:bg-indigo-700 leading-relaxed"
                />
              </div>
            </div>
          ) : (
            /* Form Fields for Notification Card */
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Notification Properties
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={noticeCard.badge}
                    onChange={(e) => setNoticeCard({ ...noticeCard, badge: e.target.value })}
                    placeholder="e.g. Advisory or Notice"
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Message Editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Message Content (HTML Allowed)</label>
                  <span className="text-[11px] text-slate-400">Renders in 320px floating card</span>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-t-lg border border-slate-300 border-b-0">
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<strong>', '</strong>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    title="Bold"
                  >
                    <FiBold className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<em>', '</em>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs italic transition"
                    title="Italic"
                  >
                    <FiItalic className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtmlTag('<a href="https://invio.timrio.com">', '</a>')}
                    className="p-1 rounded hover:bg-slate-200 text-slate-700 text-xs transition"
                    title="Link"
                  >
                    <FiLink className="size-3.5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={4}
                  value={noticeCard.message}
                  onChange={(e) => setNoticeCard({ ...noticeCard, message: e.target.value })}
                  placeholder="Enter notification message here..."
                  className="w-full text-xs font-mono px-3 py-2 rounded-b-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-emerald-400 selection:bg-indigo-700 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Desktop App Preview */}
        <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-slate-200/70 p-6 flex flex-col items-center justify-center relative">
          <div className="w-full max-w-xl flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Desktop UI Preview ({previewTheme === 'dark' ? 'Dark Mode' : 'Light Mode'})</span>
            </span>
            <span className="font-mono text-[11px] bg-slate-300/80 px-2 py-0.5 rounded text-slate-700">
              {activeTab === 'middle' ? 'Width: 520px · Radius: 20px' : 'Width: 320px · Radius: 14px'}
            </span>
          </div>

          {/* PREVIEW CONTAINER */}
          {activeTab === 'middle' ? (
            /* Center Modal Card Live Preview */
            <div
              className={`w-full max-w-[520px] rounded-[20px] shadow-2xl overflow-hidden transition-all duration-300 relative border ${
                previewTheme === 'dark'
                  ? 'bg-[#0b0f19] text-white border-slate-700/60 shadow-[0_24px_64px_rgba(0,0,0,0.6)]'
                  : 'bg-white text-slate-900 border-slate-200 shadow-[0_24px_64px_rgba(15,23,42,0.22)]'
              }`}
            >
              {/* Fluid Radial Header (140px) */}
              <div
                className="relative h-[140px] px-8 flex flex-col items-center justify-center text-center overflow-hidden"
                style={{
                  background:
                    previewTheme === 'dark'
                      ? 'linear-gradient(135deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 60%, #5b21b6 100%)',
                }}
              >
                {/* Glow sphere effect */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.35) 0%, transparent 60%)',
                  }}
                />

                {/* Badge Pill */}
                {middleCard.badge && (
                  <span className="relative z-10 mb-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white/20 text-white backdrop-blur-md border border-white/30 shadow-xs">
                    {middleCard.badge}
                  </span>
                )}

                {/* Title */}
                <h2 className="relative z-10 text-[20px] font-bold text-white leading-tight drop-shadow-sm">
                  {middleCard.title || 'Broadcast Title'}
                </h2>

                {/* Subtitle */}
                {middleCard.subtitle && (
                  <p className="relative z-10 text-[12px] text-white/90 leading-snug mt-1.5 max-w-md line-clamp-2 drop-shadow-2xs">
                    {middleCard.subtitle}
                  </p>
                )}

                {/* Close X Icon top right */}
                <button
                  type="button"
                  className="absolute top-3.5 right-3.5 size-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                  title="Simulate Close"
                >
                  <FiX className="size-4" />
                </button>
              </div>

              {/* Modal Body & HTML Container */}
              <div className="p-6 flex flex-col gap-4">
                {/* Sanitized HTML Content Body */}
                <div
                  className={`rounded-[14px] p-4 text-[13px] leading-relaxed max-h-[220px] overflow-y-auto border ${
                    previewTheme === 'dark'
                      ? 'bg-[#151928] text-slate-300 border-slate-700/50'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(middleCard.htmlContent || '<p>No content provided</p>'),
                  }}
                />

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-md transition transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    }}
                  >
                    <span>{middleCard.ctaLabel || 'Check on Website'}</span>
                    <FiExternalLink className="size-3" />
                  </button>

                  <button
                    type="button"
                    className={`text-xs py-1 transition cursor-pointer text-center font-medium ${
                      previewTheme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Bottom-Right Notification Card Live Preview */
            <div
              className={`w-[320px] rounded-[14px] p-3.5 shadow-xl transition-all duration-300 relative border flex flex-col gap-2 ${
                previewTheme === 'dark'
                  ? 'bg-[#181920] text-white border-slate-700/60 shadow-[0_14px_30px_rgba(0,0,0,0.5)]'
                  : 'bg-white text-slate-900 border-slate-200/90 shadow-[0_12px_28px_rgba(15,23,42,0.14)]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Icon according to type */}
                  <span
                    className={`size-4 flex items-center justify-center flex-shrink-0 ${
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
                      <FiAlertCircle className="size-4" />
                    ) : noticeCard.actionType === 'warning' ? (
                      <FiAlertTriangle className="size-4" />
                    ) : noticeCard.actionType === 'success' ? (
                      <FiCheckCircle className="size-4" />
                    ) : (
                      <FiInfo className="size-4" />
                    )}
                  </span>

                  <h4 className="text-[13px] font-bold truncate leading-tight">
                    {noticeCard.title || 'System Notification'}
                  </h4>

                  {noticeCard.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 flex-shrink-0">
                      {noticeCard.badge}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Dismiss"
                >
                  <FiX className="size-3.5" />
                </button>
              </div>

              {/* Body */}
              <div
                className={`text-[12px] leading-relaxed ${
                  previewTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(noticeCard.message || 'Notification message...'),
                }}
              />

              {/* Footer CTA */}
              {noticeCard.actionLabel && (
                <div className="pt-1 flex items-center">
                  <a
                    href={noticeCard.actionUrl || '#'}
                    onClick={(e) => e.preventDefault()}
                    className="text-[11.5px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{noticeCard.actionLabel}</span>
                    <FiExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

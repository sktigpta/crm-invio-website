import { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../services/crmApi';
import { useCrmAuth } from '../context/CrmAuthContext';
import { useCrmToast } from '../context/CrmToastContext';
import {
  PackageIcon,
  SearchIcon,
  RefreshCwIcon,
  PlusIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FilterIcon,
} from '../components/CrmIcons';

const TIER_COLORS = {
  free: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Free Tier',
    border: 'border-emerald-200',
  },
  plus: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    label: 'Plus Tier',
    border: 'border-purple-200',
  },
  enterprise: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    label: 'Enterprise Tier',
    border: 'border-indigo-200',
  },
  paid: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Paid Add-on',
    border: 'border-amber-200',
  },
};

const STATUS_COLORS = {
  ready: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Ready / Live',
  },
  coming_soon: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Coming Soon',
  },
  disabled: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Disabled',
  },
};

export function CrmExtensionsPage() {
  const { isManagerOrAdmin, isSuperAdmin } = useCrmAuth();
  const { addToast } = useCrmToast();

  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'create' | 'edit'
  const [activeExt, setActiveExt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    version: '1.0.0',
    tier: 'plus',
    status: 'ready',
    category: 'General',
    description: '',
    price: 0,
    isAvailable: true,
    minEngineVersion: '>=1.0.0',
    featuresText: '',
  });

  const loadExtensions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await crmApi.getExtensions();
      if (res?.success && Array.isArray(res.extensions)) {
        setExtensions(res.extensions);
      } else {
        throw new Error(res?.error || 'Failed to fetch extensions');
      }
    } catch (err) {
      console.error('Error fetching extensions:', err);
      addToast(err.message || 'Could not load extensions catalog', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        ext.id.toLowerCase().includes(q) ||
        ext.name.toLowerCase().includes(q) ||
        (ext.description || '').toLowerCase().includes(q) ||
        (ext.category || '').toLowerCase().includes(q);

      const matchTier = selectedTier === 'all' || ext.tier === selectedTier;
      const matchStatus = selectedStatus === 'all' || ext.status === selectedStatus;

      return matchSearch && matchTier && matchStatus;
    });
  }, [extensions, search, selectedTier, selectedStatus]);

  const stats = useMemo(() => {
    const total = extensions.length;
    const free = extensions.filter((e) => e.tier === 'free').length;
    const plus = extensions.filter((e) => e.tier === 'plus').length;
    const enterprise = extensions.filter((e) => e.tier === 'enterprise').length;
    const active = extensions.filter((e) => e.isAvailable && e.status === 'ready').length;
    const totalDownloads = extensions.reduce((sum, e) => sum + (e.downloadCount || 0), 0);
    return { total, free, plus, enterprise, active, totalDownloads };
  }, [extensions]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveExt(null);
    setFormData({
      id: '',
      name: '',
      version: '1.0.0',
      tier: 'plus',
      status: 'ready',
      category: 'General',
      description: '',
      price: 0,
      isAvailable: true,
      minEngineVersion: '>=1.0.0',
      featuresText: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ext) => {
    setModalMode('edit');
    setActiveExt(ext);
    setFormData({
      id: ext.id,
      name: ext.name,
      version: ext.version,
      tier: ext.tier || 'plus',
      status: ext.status || 'ready',
      category: ext.category || 'General',
      description: ext.description || '',
      price: ext.price || 0,
      isAvailable: ext.isAvailable !== false,
      minEngineVersion: ext.minEngineVersion || '>=1.0.0',
      featuresText: Array.isArray(ext.features) ? ext.features.join('\n') : '',
    });
    setModalOpen(true);
  };

  const handleToggleAvailability = async (ext) => {
    if (!isManagerOrAdmin) {
      addToast('You do not have permission to modify extensions', 'error');
      return;
    }

    setTogglingId(ext.id);
    try {
      const res = await crmApi.toggleExtension(ext.id);
      if (res?.success && res.extension) {
        setExtensions((prev) =>
          prev.map((item) => (item.id === ext.id ? res.extension : item))
        );
        addToast(
          `Extension "${ext.name}" ${res.extension.isAvailable ? 'enabled' : 'disabled'} successfully`,
          'success'
        );
      } else {
        throw new Error(res?.error || 'Failed to toggle extension');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      addToast(err.message || 'Error updating extension status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmitModal = async (e) => {
    e.preventDefault();
    if (!isManagerOrAdmin) {
      addToast('Permission denied', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const features = formData.featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        version: formData.version.trim(),
        tier: formData.tier,
        status: formData.status,
        category: formData.category.trim(),
        description: formData.description.trim(),
        price: Number(formData.price) || 0,
        isAvailable: Boolean(formData.isAvailable),
        minEngineVersion: formData.minEngineVersion.trim(),
        features,
      };

      if (modalMode === 'create') {
        const createPayload = {
          ...payload,
          id: formData.id.trim().toLowerCase(),
        };
        const res = await crmApi.createExtension(createPayload);
        if (res?.success && res.extension) {
          setExtensions((prev) => [...prev, res.extension]);
          addToast(`Extension "${res.extension.name}" registered successfully`, 'success');
          setModalOpen(false);
        } else {
          throw new Error(res?.error || 'Failed to create extension');
        }
      } else {
        const res = await crmApi.updateExtension(activeExt.id, payload);
        if (res?.success && res.extension) {
          setExtensions((prev) =>
            prev.map((item) => (item.id === activeExt.id ? res.extension : item))
          );
          addToast(`Extension "${res.extension.name}" updated successfully`, 'success');
          setModalOpen(false);
        } else {
          throw new Error(res?.error || 'Failed to update extension');
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      addToast(err.message || 'Error saving extension', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="size-6 text-purple-600" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Extensions Management
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Configure official extension subscription classifications, pricing, availability, and inspect download statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadExtensions(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCwIcon className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isManagerOrAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 shadow-sm transition cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              Register Extension
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{stats.total}</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-lg p-3 shadow-xs bg-emerald-50/20">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Free Tier</span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">{stats.free}</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-lg p-3 shadow-xs bg-purple-50/20">
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Plus Tier</span>
          <p className="text-lg font-bold text-purple-700 mt-0.5">{stats.plus}</p>
        </div>
        <div className="bg-white border border-indigo-200 rounded-lg p-3 shadow-xs bg-indigo-50/20">
          <span className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider">Enterprise</span>
          <p className="text-lg font-bold text-indigo-700 mt-0.5">{stats.enterprise}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active</span>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{stats.active}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Downloads</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{stats.totalDownloads}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search extensions by name, ID, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FilterIcon className="size-3.5" />
            <span>Tier:</span>
          </div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="plus">Plus</option>
            <option value="enterprise">Enterprise</option>
            <option value="paid">Paid</option>
          </select>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready / Live</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Extensions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredExtensions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <PackageIcon className="size-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No extensions found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || selectedTier !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your search criteria or filter options.'
              : 'No extensions have been registered yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExtensions.map((ext) => {
            const tierStyle = TIER_COLORS[ext.tier] || TIER_COLORS.plus;
            const statusStyle = STATUS_COLORS[ext.status] || STATUS_COLORS.ready;

            return (
              <div
                key={ext.id}
                className={`bg-white border ${tierStyle.border} rounded-lg p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="size-9 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold border border-purple-100">
                        <PackageIcon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-slate-900">{ext.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">v{ext.version}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{ext.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierStyle.badge}`}>
                        {tierStyle.label}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2">
                    {ext.description || 'No description provided.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                      Category: {ext.category || 'General'}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                      Engine: {ext.minEngineVersion || '>=1.0.0'}
                    </span>
                    {ext.price > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 font-semibold">
                        ₹{ext.price}
                      </span>
                    )}
                  </div>

                  {/* Features preview */}
                  {Array.isArray(ext.features) && ext.features.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {ext.features.slice(0, 2).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <CheckCircleIcon className="size-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Metrics & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>
                      Downloads: <strong className="text-slate-800">{ext.downloadCount || 0}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Status:{' '}
                      <strong className={ext.isAvailable ? 'text-emerald-600' : 'text-rose-600'}>
                        {ext.isAvailable ? 'Active' : 'Disabled'}
                      </strong>
                    </span>
                  </div>

                  {isManagerOrAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAvailability(ext)}
                        disabled={togglingId === ext.id}
                        className={`text-xs px-2.5 py-1 rounded border font-medium transition cursor-pointer ${
                          ext.isAvailable
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === ext.id ? 'Updating...' : ext.isAvailable ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(ext)}
                        className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition shadow-2xs cursor-pointer"
                      >
                        Configure
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Extension Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <PackageIcon className="size-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {modalMode === 'create' ? 'Register New Extension' : `Configure "${formData.name}"`}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-5 space-y-4">
              {/* ID & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Extension ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="publisher.extension-name"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="POS Display & Kiosk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Version & Min Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Min Invio Version
                  </label>
                  <input
                    type="text"
                    placeholder=">=1.0.0"
                    value={formData.minEngineVersion}
                    onChange={(e) => setFormData({ ...formData, minEngineVersion: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Subscription Classification & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subscription Tier
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="free">Free (All Users)</option>
                    <option value="plus">Plus (Plus & Enterprise)</option>
                    <option value="enterprise">Enterprise Only</option>
                    <option value="paid">Paid Add-on</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Release Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="ready">Ready / Live</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Category & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="Point of Sale, Communication..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of what this extension provides..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Features (one per line) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Features (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Automated dispatch&#10;OS Keychain credential storage&#10;Offline delivery queue"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-[11px]"
                />
              </div>

              {/* Availability Switch */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs font-semibold text-slate-800">Available to Customers</span>
                  <p className="text-[11px] text-slate-500">
                    If disabled, users will not be able to download or activate this extension.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="size-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : modalMode === 'create' ? 'Register Extension' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CrmExtensionsPage;

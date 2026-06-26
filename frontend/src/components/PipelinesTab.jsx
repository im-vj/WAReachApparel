import { useState, useEffect } from 'react';
import { Workflow, Play, Pause, Trash2, Plus, Clock, Filter, Layers, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';

export default function PipelinesTab() {
  const [pipelines, setPipelines] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'INTERVAL',
    intervalMins: 60,
    dailyTime: '10:00',
    targetStatus: 'PENDING',
    templateId: '',
    batchSize: 50,
    delayMs: 2000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pipeRes, tempRes] = await Promise.all([
        api.get('/pipelines'),
        api.get('/templates')
      ]);
      setPipelines(pipeRes.data || []);
      setTemplates(tempRes.data || []);
      if (tempRes.data?.length > 0 && !formData.templateId) {
        setFormData(prev => ({ ...prev, templateId: tempRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load automation telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.templateId) {
      toast.error('Pipeline name and template are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/pipelines', formData);
      toast.success('Automation pipeline deployed successfully!');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        triggerType: 'INTERVAL',
        intervalMins: 60,
        dailyTime: '10:00',
        targetStatus: 'PENDING',
        templateId: templates[0]?.id || '',
        batchSize: 50,
        delayMs: 2000
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create pipeline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id, name) => {
    try {
      const res = await api.put(`/pipelines/${id}/toggle`);
      toast.success(`Pipeline "${name}" toggled to ${res.data.isActive ? 'ACTIVE' : 'PAUSED'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle pipeline');
    }
  };

  const handleManualTrigger = async (id, name) => {
    const prom = api.post(`/pipelines/${id}/trigger`);
    toast.promise(prom, {
      loading: `Triggering manual batch for "${name}"...`,
      success: (res) => `Dispatched ${res.data.dispatched} automated messages!`,
      error: 'Dispatch failed'
    });
    try {
      await prom;
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.delete(`/pipelines/${deleteModal.id}`);
      toast.success('Pipeline decommissioned');
      setPipelines(pipelines.filter(p => p.id !== deleteModal.id));
    } catch (err) {
      toast.error('Failed to delete pipeline');
    } finally {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const activeCount = pipelines.filter(p => p.isActive).length;
  const totalDispatches = pipelines.reduce((acc, p) => acc + (p.totalRuns || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* KPI Telemetry Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 bg-gradient-to-br from-[#0e0f16] to-[#121420] border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Configured Loops</span>
            <Workflow className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">{pipelines.length}</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-[#0e0f16] to-[#121420] border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Operational Daemons</span>
            <Zap className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">{activeCount}</div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-[#0e0f16] to-[#121420] border-white/[0.08]">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Total Automated Cycles</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 tracking-tight">{totalDispatches}</div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] p-6 rounded-2xl border border-white/[0.06] backdrop-blur-md">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Autonomous Dispatch Pipelines
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Configure background daemons to automatically broadcast campaigns on recurring intervals.</p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary flex items-center shrink-0 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Deploy New Pipeline
        </button>
      </div>

      {/* Pipelines Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 font-mono text-xs">Scanning background telemetry...</div>
      ) : pipelines.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-white/[0.1] bg-white/[0.01]">
          <Workflow className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-bounce" />
          <h4 className="text-base font-semibold text-zinc-300">No Automation Pipelines Deployed</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Create your first automated messaging loop to continuously nurture pending contacts without manual clicking.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-secondary mt-6 text-xs"
          >
            Create Automation Loop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipe) => (
            <div
              key={pipe.id}
              className={`card flex flex-col justify-between transition-all duration-300 border ${
                pipe.isActive ? 'border-emerald-500/30 bg-[#0e111a]' : 'border-white/[0.06] bg-[#0c0d12] opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-bold text-white text-base truncate" title={pipe.name}>{pipe.name}</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                    pipe.isActive 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse' 
                      : 'bg-white/5 text-zinc-400 border-white/10'
                  }`}>
                    {pipe.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>

                {pipe.description && (
                  <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{pipe.description}</p>
                )}

                <div className="space-y-2.5 text-xs font-mono border-t border-white/[0.06] pt-4">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> Trigger:</span>
                    <span className="text-zinc-200">
                      {pipe.triggerType === 'INTERVAL' ? `Every ${pipe.intervalMins} mins` : `Daily @ ${pipe.dailyTime}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-teal-400" /> Target:</span>
                    <span className="text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">{pipe.targetStatus}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="flex items-center gap-1.5"><Workflow className="w-3.5 h-3.5 text-cyan-400" /> Template:</span>
                    <span className="text-cyan-300 truncate max-w-[140px]" title={pipe.templateName}>{pipe.templateName}</span>
                  </div>

                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Batch Throttling Ceil:</span>
                    <span className="text-zinc-300">{pipe.batchSize} msgs/run</span>
                  </div>

                  {pipe.nextRunAt && pipe.isActive && (
                    <div className="flex items-center justify-between text-zinc-400 pt-1 text-[11px] text-emerald-400/80">
                      <span>Next Cadence:</span>
                      <span>{new Date(pipe.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4 mt-6">
                <button
                  onClick={() => handleManualTrigger(pipe.id, pipe.name)}
                  title="Run Manual Batch Override Now"
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20 flex items-center gap-1 text-xs font-semibold grow justify-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger Now
                </button>

                <button
                  onClick={() => handleToggle(pipe.id, pipe.name)}
                  title={pipe.isActive ? 'Pause Pipeline' : 'Resume Pipeline'}
                  className="p-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 rounded-lg transition-colors border border-white/[0.08]"
                >
                  {pipe.isActive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => setDeleteModal({ isOpen: true, id: pipe.id, name: pipe.name })}
                  title="Decommission Pipeline"
                  className="p-2 bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors border border-white/[0.08] hover:border-rose-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card w-full max-w-lg bg-[#0e1017] border-white/[0.1] p-6 sm:p-8 relative">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-emerald-400" /> Deploy Autonomous Campaign Pipeline
            </h3>
            <p className="text-xs text-zinc-400 mb-6">Set background automation rules to continuously broadcast WhatsApp campaigns.</p>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Pipeline Identifier</label>
                <input
                  type="text"
                  className="input-field py-2 text-sm"
                  placeholder="e.g. Daily VIP Welcome Loop"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  className="input-field py-2 text-sm"
                  placeholder="Broadcast discount voucher to pending users"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Cadence Mode</label>
                  <select
                    className="input-field py-2 text-xs"
                    value={formData.triggerType}
                    onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                  >
                    <option value="INTERVAL">Recurring Interval</option>
                    <option value="DAILY_TIME">Daily Fixed Time</option>
                  </select>
                </div>

                <div>
                  {formData.triggerType === 'INTERVAL' ? (
                    <>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Interval (Minutes)</label>
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        className="input-field py-2 text-xs font-mono"
                        value={formData.intervalMins}
                        onChange={(e) => setFormData({ ...formData, intervalMins: Number(e.target.value) })}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Time (HH:MM 24hr)</label>
                      <input
                        type="time"
                        className="input-field py-2 text-xs font-mono"
                        value={formData.dailyTime}
                        onChange={(e) => setFormData({ ...formData, dailyTime: e.target.value })}
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Target Audience</label>
                  <select
                    className="input-field py-2 text-xs"
                    value={formData.targetStatus}
                    onChange={(e) => setFormData({ ...formData, targetStatus: e.target.value })}
                  >
                    <option value="PENDING">PENDING Contacts</option>
                    <option value="FAILED">FAILED Contacts (Retry)</option>
                    <option value="ALL">ALL Contacts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Batch Ceiling</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    className="input-field py-2 text-xs font-mono"
                    value={formData.batchSize}
                    onChange={(e) => setFormData({ ...formData, batchSize: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Dispatch Message Template</label>
                <select
                  className="input-field py-2 text-xs truncate font-mono"
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  required
                >
                  <option value="" disabled>-- Select Registered Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>#{t.id} - {t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/[0.08] mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary py-2 px-4 text-xs"
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs shadow-lg shadow-emerald-500/20"
                  disabled={submitting || templates.length === 0}
                >
                  {submitting ? 'Deploying...' : 'Deploy Automation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Decommission Pipeline"
        message={`Are you sure you want to permanently delete the automation loop "${deleteModal.name}"? Scheduled background executions will cease immediately.`}
        confirmText="Decommission"
        isDestructive={true}
      />
    </div>
  );
}

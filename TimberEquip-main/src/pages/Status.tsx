import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, Activity } from 'lucide-react';
import { Seo } from '../components/Seo';
import { API_BASE } from '../constants/api';

interface ComponentHealth {
  status: string;
  latencyMs: number;
}

interface HealthData {
  status: string;
  version: string;
  timestamp: string;
  uptime: number;
  components: Record<string, ComponentHealth>;
}

type OverallStatus = 'operational' | 'degraded' | 'outage' | 'loading';

const COMPONENT_LABELS: Record<string, { label: string; description: string }> = {
  server: { label: 'Web Application', description: 'Frontend and server rendering' },
  firestore: { label: 'Database', description: 'Firestore document storage' },
  stripe: { label: 'Payment Processing', description: 'Stripe billing and payments' },
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  healthy: { icon: CheckCircle2, color: 'text-data', bg: 'bg-data/10' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  unhealthy: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function deriveOverall(components: Record<string, ComponentHealth>): OverallStatus {
  const statuses = Object.values(components).map((c) => c.status);
  if (statuses.every((s) => s === 'healthy')) return 'operational';
  if (statuses.some((s) => s === 'unhealthy')) return 'outage';
  return 'degraded';
}

const OVERALL_BANNER: Record<OverallStatus, { label: string; color: string; border: string }> = {
  operational: { label: 'All Systems Operational', color: 'bg-data/10 text-data', border: 'border-data/30' },
  degraded: { label: 'Degraded Performance', color: 'bg-yellow-500/10 text-yellow-500', border: 'border-yellow-500/30' },
  outage: { label: 'Service Outage', color: 'bg-red-500/10 text-red-500', border: 'border-red-500/30' },
  loading: { label: 'Checking Systems...', color: 'bg-surface text-muted', border: 'border-line' },
};

const REFRESH_INTERVAL = 60_000;

export function Status() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [overall, setOverall] = useState<OverallStatus>('loading');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const json = await res.json();
      if (json.success && json.data) {
        setHealth(json.data);
        setOverall(deriveOverall(json.data.components));
        setError(false);
      } else {
        setError(true);
        setOverall('outage');
      }
    } catch {
      setError(true);
      setOverall('outage');
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const banner = OVERALL_BANNER[overall];

  const componentEntries = health
    ? Object.entries(health.components).map(([key, comp]) => ({
        key,
        ...(COMPONENT_LABELS[key] ?? { label: key, description: '' }),
        ...comp,
      }))
    : [];

  // Always include an API Server card derived from server component
  if (health && !health.components['api']) {
    componentEntries.push({
      key: 'api',
      label: 'API Server',
      description: 'REST API endpoints',
      status: health.status,
      latencyMs: 0,
    });
  }

  return (
    <div className="min-h-screen bg-bg py-24 px-4 md:px-8">
      <Seo
        title="System Status | Forestry Equipment Sales"
        description="Real-time system status for Forestry Equipment Sales. Check uptime, component health, and incident history."
        canonicalPath="/status"
      />
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col space-y-12">
          {/* Header */}
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Platform Health</span>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">System Status</h1>
            <p className="text-muted font-medium uppercase tracking-widest text-xs">Real-time component monitoring</p>
          </div>

          {/* Overall Banner */}
          <div className={`border ${banner.border} ${banner.color} flex items-center justify-between px-6 py-4`}>
            <div className="flex items-center gap-3">
              <Activity size={20} />
              <span className="text-sm font-black uppercase tracking-widest">{banner.label}</span>
            </div>
            {lastChecked && (
              <span className="text-xs font-mono opacity-70">
                Checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Uptime */}
          {health && (
            <div className="flex items-center gap-3 text-muted">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Uptime</span>
              <span className="font-mono text-sm text-ink">{formatUptime(health.uptime)}</span>
            </div>
          )}

          {/* Component Cards */}
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Components</span>
            {error && !health && (
              <div className="bg-red-500/10 border border-red-500/30 p-6 text-center text-sm text-red-500 font-bold uppercase tracking-widest">
                Unable to reach health endpoint
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {componentEntries.map((comp, i) => {
                const cfg = STATUS_CONFIG[comp.status] ?? STATUS_CONFIG.unhealthy;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={comp.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-surface border border-line p-6 flex flex-col space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-tight">{comp.label}</h3>
                      <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${cfg.color}`}>
                        <Icon size={14} />
                        {comp.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{comp.description}</p>
                    {comp.latencyMs > 0 && (
                      <span className="text-xs font-mono text-muted">Latency: {comp.latencyMs}ms</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchHealth}
            className="flex items-center gap-2 self-start text-xs font-bold uppercase tracking-widest text-accent hover:text-ink transition-colors"
          >
            <RefreshCw size={14} />
            Refresh Now
          </button>

          {/* Incident History */}
          <div className="flex flex-col space-y-4">
            <span className="label-micro text-accent uppercase tracking-widest">Incident History</span>
            <div className="bg-surface border border-line p-8 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-muted">No recent incidents</p>
              <p className="mt-2 text-xs text-muted">All systems have been operating normally.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

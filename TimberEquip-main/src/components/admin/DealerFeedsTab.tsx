import React, { useRef, useState, useMemo } from 'react';
import {
  Upload, Database, RefreshCw, Eye, Copy, CheckCircle2,
  Clock, AlertCircle,
} from 'lucide-react';
import { dealerFeedService, DealerFeedIngestResult, DealerFeedLog, DealerFeedProfile } from '../../services/dealerFeedService';
import {
  buildDealerFeedApiCurlSnippet,
  buildDealerFeedSampleUrl,
  DEALER_FEED_SETUP_META,
  type DealerFeedSetupMode,
  getDealerFeedSamplePayload,
  inferDealerFeedSetupModeFromFileName,
} from '../../utils/dealerFeedSetup';
import { formatLifecycleLabel } from '../../utils/adminFormatters';
import type { Account } from '../../types';

interface DealerFeedsTabProps {
  accounts: Account[];
}

export function DealerFeedsTab({ accounts }: DealerFeedsTabProps) {
  const [dfSubTab, setDfSubTab] = useState<'ingest' | 'logs'>('ingest');
  const [dfMode, setDfMode] = useState<DealerFeedSetupMode>('json');
  const [dfSource, setDfSource] = useState('');
  const [dfDealerId, setDfDealerId] = useState('');
  const [dfPayload, setDfPayload] = useState('');
  const [dfFeedUrl, setDfFeedUrl] = useState('');
  const [dfFileName, setDfFileName] = useState('');
  const [dfDryRun, setDfDryRun] = useState(true);
  const [dfLoading, setDfLoading] = useState(false);
  const [dfResult, setDfResult] = useState<DealerFeedIngestResult | null>(null);
  const [dfPreviewItems, setDfPreviewItems] = useState<Parameters<typeof dealerFeedService.ingest>[0]['items']>([]);
  const [dfPreviewCount, setDfPreviewCount] = useState(0);
  const [dfPreviewType, setDfPreviewType] = useState<'json' | 'xml' | 'csv' | ''>('');
  const [dfError, setDfError] = useState('');
  const [dfLogs, setDfLogs] = useState<DealerFeedLog[]>([]);
  const [dfLogsLoading, setDfLogsLoading] = useState(false);
  const [dfCurrentProfileId, setDfCurrentProfileId] = useState('');
  const [dfActiveProfile, setDfActiveProfile] = useState<DealerFeedProfile | null>(null);
  const [dfProfileSaving, setDfProfileSaving] = useState(false);
  const [dfCredentialNotice, setDfCredentialNotice] = useState('');
  const [dfCredentialError, setDfCredentialError] = useState('');
  const [dfRevealingCredentials, setDfRevealingCredentials] = useState(false);
  const dfFileInputRef = useRef<HTMLInputElement | null>(null);
  const setupModes = Object.keys(DEALER_FEED_SETUP_META) as DealerFeedSetupMode[];

  const dealerFeedTargetAccounts = useMemo(
    () =>
      accounts
        .filter((account) => ['dealer', 'pro_dealer'].includes(account.role))
        .sort((left, right) => {
          const leftLabel = `${left.displayName || left.name || ''} ${left.company || ''}`.trim().toLowerCase();
          const rightLabel = `${right.displayName || right.name || ''} ${right.company || ''}`.trim().toLowerCase();
          return leftLabel.localeCompare(rightLabel);
        }),
    [accounts]
  );

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://timberequip.com';
  const currentDfCurlSnippet = dfActiveProfile?.ingestUrl
    ? buildDealerFeedApiCurlSnippet({
        ingestUrl: dfActiveProfile.ingestUrl,
        apiKey: dfActiveProfile.apiKey || '',
        sourceType: dfActiveProfile.sourceType === 'csv' ? 'csv' : 'json',
      })
    : '';

  const resetDfPreview = () => {
    setDfPreviewItems([]);
    setDfPreviewCount(0);
    setDfPreviewType('');
    setDfResult(null);
    setDfError('');
  };

  const handleDealerFeedFileSelected = async (file?: File | null) => {
    if (!file) return;
    try {
      const inferredMode = inferDealerFeedSetupModeFromFileName(file.name, dfMode === 'url' ? 'json' : dfMode);
      const text = await file.text();
      setDfMode(inferredMode);
      setDfPayload(text);
      setDfFileName(file.name);
      setDfError('');
      setDfCredentialError('');
      setDfCredentialNotice('');
      resetDfPreview();
      if (!dfSource.trim()) {
        setDfSource(file.name.replace(/\.[^.]+$/u, '') || 'Dealer Feed');
      }
    } catch (error) {
      setDfError(error instanceof Error ? error.message : 'Unable to read the selected feed file.');
    }
  };

  const handleUseSampleFeed = (mode: DealerFeedSetupMode) => {
    setDfMode(mode);
    setDfFileName('');
    setDfError('');
    setDfCredentialError('');
    setDfCredentialNotice('');
    setDfResult(null);
    if (!dfSource.trim()) {
      setDfSource(mode === 'url' ? 'Sample Feed URL' : `Sample ${DEALER_FEED_SETUP_META[mode].label}`);
    }
    if (mode === 'url') {
      setDfFeedUrl(buildDealerFeedSampleUrl(appOrigin, 'json'));
      setDfPayload('');
    } else {
      setDfPayload(getDealerFeedSamplePayload(mode));
      setDfFeedUrl('');
    }
    resetDfPreview();
  };

  const handleSaveFeedProfile = async () => {
    if (!dfSource.trim()) { setDfError('Source name is required.'); return; }
    if (!dfDealerId.trim()) { setDfError('Dealer UID / ID is required.'); return; }
    if (dfMode === 'url' && !dfFeedUrl.trim()) { setDfError('Feed URL is required.'); return; }
    if (dfMode !== 'url' && !dfPayload.trim()) { setDfError('Feed payload is required.'); return; }

    setDfProfileSaving(true);
    setDfError('');
    setDfCredentialError('');
    setDfCredentialNotice('');
    try {
      const savedProfile = await dealerFeedService.saveProfile({
        id: dfCurrentProfileId || undefined,
        sellerUid: dfDealerId.trim(),
        sourceName: dfSource.trim(),
        sourceType: DEALER_FEED_SETUP_META[dfMode].sourceType,
        rawInput: dfMode === 'url' ? '' : dfPayload,
        feedUrl: dfMode === 'url' ? dfFeedUrl.trim() : '',
        nightlySyncEnabled: true,
      });
      setDfCurrentProfileId(savedProfile.id);
      setDfActiveProfile(savedProfile);
      setDfCredentialNotice('Feed profile saved. Reveal credentials to copy the direct ingest URL, API key, and webhook secret.');
    } catch (error) {
      setDfCredentialError(error instanceof Error ? error.message : 'Unable to save this dealer feed profile.');
    } finally {
      setDfProfileSaving(false);
    }
  };

  const handleRevealFeedCredentials = async () => {
    if (!dfCurrentProfileId) {
      setDfCredentialError('Save a feed profile first to generate direct API credentials.');
      setDfCredentialNotice('');
      return;
    }
    setDfRevealingCredentials(true);
    setDfCredentialError('');
    setDfCredentialNotice('');
    try {
      const detailedProfile = await dealerFeedService.getProfile(dfCurrentProfileId, { includeSecrets: true });
      setDfActiveProfile(detailedProfile);
      setDfCredentialNotice('Direct API credentials loaded for copy/paste setup.');
    } catch (error) {
      setDfCredentialError(error instanceof Error ? error.message : 'Unable to load API credentials for this dealer feed.');
    } finally {
      setDfRevealingCredentials(false);
    }
  };

  const handleCopyDealerFeedCredential = async (value: string, label: string) => {
    if (!value) { setDfCredentialError(`${label} is not available yet.`); setDfCredentialNotice(''); return; }
    try {
      await navigator.clipboard.writeText(value);
      setDfCredentialNotice(`${label} copied.`);
      setDfCredentialError('');
    } catch (error) {
      setDfCredentialError(error instanceof Error ? error.message : `Unable to copy ${label.toLowerCase()}.`);
      setDfCredentialNotice('');
    }
  };

  const handleResolveFeed = async (): Promise<Parameters<typeof dealerFeedService.ingest>[0]['items']> => {
    if (!dfSource.trim()) { setDfError('Source name is required.'); return []; }
    if (!dfDealerId.trim()) { setDfError('Dealer UID / ID is required.'); return []; }
    if (dfMode === 'url' && !dfFeedUrl.trim()) { setDfError('Feed URL is required.'); return []; }
    if (dfMode !== 'url' && !dfPayload.trim()) { setDfError('Feed payload is required.'); return []; }

    setDfLoading(true);
    setDfError('');
    setDfResult(null);
    try {
      const resolved = await dealerFeedService.resolveSource({
        sourceName: dfSource.trim(),
        sourceType: DEALER_FEED_SETUP_META[dfMode].sourceType,
        rawInput: dfMode === 'url' ? undefined : dfPayload,
        feedUrl: dfMode === 'url' ? dfFeedUrl.trim() : undefined,
      });
      setDfPreviewItems(resolved.items);
      setDfPreviewCount(resolved.itemCount);
      setDfPreviewType(resolved.detectedType);
      return resolved.items;
    } catch (error) {
      setDfPreviewItems([]);
      setDfPreviewCount(0);
      setDfPreviewType('');
      setDfError(error instanceof Error ? error.message : 'Unable to parse this feed source.');
      return [];
    } finally {
      setDfLoading(false);
    }
  };

  const handleIngest = async () => {
    setDfError('');
    setDfResult(null);
    const items = dfPreviewItems.length > 0 ? dfPreviewItems : await handleResolveFeed();
    if (items.length === 0) return;
    setDfLoading(true);
    try {
      const result = await dealerFeedService.ingest({
        sourceName: dfSource.trim(),
        dealerId: dfDealerId.trim(),
        dryRun: dfDryRun,
        items,
      });
      setDfResult(result);
    } catch (error) {
      setDfError(error instanceof Error ? error.message : 'Feed import failed.');
    } finally {
      setDfLoading(false);
    }
  };

  const handleLoadLogs = async () => {
    setDfLogsLoading(true);
    setDfError('');
    try {
      setDfLogs(await dealerFeedService.getRecentLogs(20, dfDealerId.trim() || undefined));
    } catch (error) {
      setDfError(error instanceof Error ? error.message : 'Unable to load dealer feed logs.');
    } finally {
      setDfLogsLoading(false);
    }
  };

  const formatLogTime = (timestamp: DealerFeedLog['processedAt']) => {
    if (!timestamp) return '—';
    if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp as string | number).toLocaleString();
  };

  const latestDealerFeedLog = dfLogs[0] || null;
  const dealerFeedFailureLog = dfLogs.find((log) => Array.isArray(log.errors) && log.errors.length > 0) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-line bg-surface p-6">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-ink">Dealer Feed Intake</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Configure JSON array, CSV upload, XML paste, or live API URL imports for any dealer account. Forestry Equipment Sales
            auto-detects common feed fields, resolves a preview, then lets operators run a dry import or live ingest.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-none md:auto-cols-max md:grid-flow-col md:items-center md:gap-4">
          <div className="flex items-center gap-2 rounded-sm border border-line bg-bg/70 px-3 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-black flex items-center justify-center">1</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink md:text-xs">Choose Format</span>
          </div>
          <div className="hidden h-px w-8 bg-line md:block" />
          <div className="flex items-center gap-2 rounded-sm border border-line bg-bg/70 px-3 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <span className="w-6 h-6 rounded-full bg-surface text-muted text-xs font-black flex items-center justify-center border border-line">2</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted md:text-xs">Configure</span>
          </div>
          <div className="hidden h-px w-8 bg-line md:block" />
          <div className="flex items-center gap-2 rounded-sm border border-line bg-bg/70 px-3 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <span className="w-6 h-6 rounded-full bg-surface text-muted text-xs font-black flex items-center justify-center border border-line">3</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted md:text-xs">Preview</span>
          </div>
          <div className="hidden h-px w-8 bg-line md:block" />
          <div className="flex items-center gap-2 rounded-sm border border-line bg-bg/70 px-3 py-2 md:border-0 md:bg-transparent md:px-0 md:py-0">
            <span className="w-6 h-6 rounded-full bg-surface text-muted text-xs font-black flex items-center justify-center border border-line">4</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted md:text-xs">Import</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-sm border border-line bg-surface p-4">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Last Run</div>
          <div className="mt-3 text-sm font-black text-ink">{latestDealerFeedLog ? formatLogTime(latestDealerFeedLog.processedAt) : 'No runs loaded'}</div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {latestDealerFeedLog ? `${latestDealerFeedLog.processed} processed / ${latestDealerFeedLog.upserted} upserted` : 'Load logs for operator visibility'}
          </div>
        </div>
        <div className="rounded-sm border border-line bg-surface p-4">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Current Feed Status</div>
          <div className="mt-3 text-sm font-black text-ink">
            {dfActiveProfile?.lastSyncStatus ? formatLifecycleLabel(dfActiveProfile.lastSyncStatus) : 'No profile selected'}
          </div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {dfActiveProfile?.sourceType ? `${formatLifecycleLabel(dfActiveProfile.sourceType)} / ${formatLifecycleLabel(dfActiveProfile.syncMode || 'pull')}` : 'Save or load a dealer feed profile'}
          </div>
        </div>
        <div className="rounded-sm border border-line bg-surface p-4">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Failure Reason</div>
          <div className="mt-3 text-sm font-black text-ink">
            {dealerFeedFailureLog?.errors?.[0] || dfActiveProfile?.lastSyncMessage || 'No recent failures recorded'}
          </div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {dealerFeedFailureLog ? `From ${dealerFeedFailureLog.sourceName}` : 'Operator-safe failure summary'}
          </div>
        </div>
        <div className="rounded-sm border border-line bg-surface p-4">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Profile + Sync</div>
          <div className="mt-3 text-sm font-black text-ink">{dfCurrentProfileId || 'No saved profile selected'}</div>
          <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted">
            {dfActiveProfile?.nightlySyncEnabled ? 'Nightly sync enabled' : 'Nightly sync disabled'}
          </div>
        </div>
      </div>

      <div className="flex space-x-1 rounded-sm border border-line bg-surface p-2 w-fit">
        {(['ingest', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setDfSubTab(tab);
              if (tab === 'logs' && dfLogs.length === 0) { void handleLoadLogs(); }
            }}
            className={`rounded-sm px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              dfSubTab === tab ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
            }`}
          >
            {tab === 'ingest' ? 'Resolve + Import' : 'Import Logs'}
          </button>
        ))}
      </div>

      {dfSubTab === 'ingest' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-surface border border-line p-6 rounded-sm space-y-5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink flex items-center gap-2">
                <Upload size={14} /> Feed Configuration
              </h3>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Source Name</label>
                <input type="text" value={dfSource} onChange={(e) => { setDfSource(e.target.value); resetDfPreview(); }} placeholder="e.g. JohnDeereDealerFeed" className="input-industrial w-full text-xs" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Dealer UID / ID</label>
                <input type="text" value={dfDealerId} onChange={(e) => { setDfDealerId(e.target.value); setDfCurrentProfileId(''); setDfActiveProfile(null); setDfCredentialError(''); setDfCredentialNotice(''); resetDfPreview(); }} placeholder="Firebase UID or dealer identifier" className="input-industrial w-full text-xs" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Dealer Account Picker</label>
                <select value={dfDealerId} onChange={(e) => { setDfDealerId(e.target.value); setDfCurrentProfileId(''); setDfActiveProfile(null); setDfCredentialError(''); setDfCredentialNotice(''); resetDfPreview(); }} className="input-industrial w-full text-xs">
                  <option value="">Select dealer or pro dealer account</option>
                  {dealerFeedTargetAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {`${account.displayName || account.name || account.email} ${account.company ? `- ${account.company}` : ''} (${account.role === 'pro_dealer' ? 'Pro Dealer' : 'Dealer'})`}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] text-muted">Super admins can pick the dealer account here instead of manually looking up a UID.</p>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {setupModes.map((mode) => (
                  <button key={mode} type="button" onClick={() => { setDfMode(mode); setDfFileName(''); resetDfPreview(); }} className={`rounded-sm border px-4 py-3 text-left transition-colors ${dfMode === mode ? 'border-ink bg-bg text-ink' : 'border-line bg-surface text-muted hover:text-ink'}`}>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em]">{DEALER_FEED_SETUP_META[mode].label}</div>
                    <div className="mt-1 text-[11px] leading-snug">{DEALER_FEED_SETUP_META[mode].shortDesc}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleUseSampleFeed('json')} className="btn-industrial px-3 py-2 text-[10px]">Load Sample JSON</button>
                <button type="button" onClick={() => handleUseSampleFeed('csv')} className="btn-industrial px-3 py-2 text-[10px]">Load Sample CSV</button>
                <button type="button" onClick={() => handleUseSampleFeed('url')} className="btn-industrial px-3 py-2 text-[10px]">Use Sample Feed URL</button>
              </div>

              <div className="rounded-sm border border-line bg-bg p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">API Push Setup</div>
                    <div className="mt-1 text-xs text-muted">Save a dealer feed profile once, then reveal the direct ingest URL, API key, webhook secret, and starter cURL command for server-to-server setup.</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleSaveFeedProfile()} disabled={dfProfileSaving} className="btn-industrial flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50">
                      {dfProfileSaving ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                      {dfCurrentProfileId ? 'Update Feed Profile' : 'Save Feed Profile'}
                    </button>
                    <button type="button" onClick={() => void handleRevealFeedCredentials()} disabled={dfRevealingCredentials || !dfCurrentProfileId} className="btn-industrial flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50">
                      {dfRevealingCredentials ? <RefreshCw size={12} className="animate-spin" /> : <Eye size={12} />}
                      {dfActiveProfile?.apiKey ? 'Refresh Credentials' : 'Reveal Credentials'}
                    </button>
                  </div>
                </div>
                {dfCredentialError ? (<div className="mt-4 flex items-start gap-2 rounded-sm border border-accent/30 bg-accent/10 p-3"><AlertCircle size={14} className="text-accent mt-0.5 shrink-0" /><p className="text-[10px] font-bold text-accent">{dfCredentialError}</p></div>) : null}
                {dfCredentialNotice ? (<div className="mt-4 rounded-sm border border-line bg-surface px-3 py-3 text-[10px] font-bold text-ink">{dfCredentialNotice}</div>) : null}
              </div>

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setDfDryRun(v => !v)} className={`w-10 h-5 rounded-full relative transition-colors ${dfDryRun ? 'bg-accent' : 'bg-line'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${dfDryRun ? 'right-1' : 'left-1'}`} />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Dry Run {dfDryRun ? '(preview only — no writes)' : '(disabled — will write to Firestore)'}</span>
              </div>

              {dfMode === 'url' ? (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Feed URL</label>
                  <input value={dfFeedUrl} onChange={(e) => { setDfFeedUrl(e.target.value); resetDfPreview(); }} placeholder={DEALER_FEED_SETUP_META.url.placeholder} className="input-industrial w-full text-xs" />
                </div>
              ) : (
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted">Feed Payload</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input ref={dfFileInputRef} type="file" accept={DEALER_FEED_SETUP_META[dfMode].accept} className="hidden" onChange={(e) => { void handleDealerFeedFileSelected(e.target.files?.[0] || null); e.currentTarget.value = ''; }} />
                      <button type="button" onClick={() => dfFileInputRef.current?.click()} className="btn-industrial px-3 py-2 text-[10px]">{DEALER_FEED_SETUP_META[dfMode].uploadLabel}</button>
                      {dfFileName ? (<span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{dfFileName}</span>) : null}
                    </div>
                  </div>
                  <textarea rows={12} value={dfPayload} onChange={(e) => { setDfPayload(e.target.value); if (dfFileName) setDfFileName(''); resetDfPreview(); }} spellCheck={false} className="input-industrial w-full resize-y font-mono text-[11px]" placeholder={DEALER_FEED_SETUP_META[dfMode].placeholder} />
                </div>
              )}

              {dfError && (
                <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 rounded-sm p-3">
                  <AlertCircle size={14} className="text-accent mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold text-accent">{dfError}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => void handleResolveFeed()} disabled={dfLoading} className="btn-industrial flex items-center gap-2 px-5 py-3 disabled:opacity-50">
                  {dfLoading ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />} Resolve Feed
                </button>
                <button onClick={handleIngest} disabled={dfLoading} className="btn-industrial btn-accent py-3 px-8 flex items-center gap-2 w-full justify-center disabled:opacity-50">
                  {dfLoading ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing…</> : <><Upload size={14} /> {dfDryRun ? 'Run Dry Import' : 'Import Inventory'}</>}
                </button>
                <button type="button" onClick={() => { setDfFileName(''); resetDfPreview(); }} className="btn-industrial px-5 py-3 text-[10px]">Reset Preview</button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 rounded-sm border border-line bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Direct API Credentials</h3>
                  <p className="mt-1 text-xs text-muted">Use these values for dealer and vendor automations that push inventory directly into Forestry Equipment Sales.</p>
                </div>
                {dfCurrentProfileId ? (<div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Feed ID: {dfCurrentProfileId}</div>) : null}
              </div>
              {!dfCurrentProfileId ? (
                <div className="mt-4 rounded-sm border border-dashed border-line px-4 py-4 text-xs text-muted">Save a feed profile first. That enables direct API setup for the selected dealer account.</div>
              ) : (
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Direct Ingest URL', value: dfActiveProfile?.ingestUrl || '', copyLabel: 'Direct ingest URL' },
                    { label: 'Direct Webhook URL', value: dfActiveProfile?.webhookUrl || '', copyLabel: 'Direct webhook URL' },
                    { label: 'API Key', value: dfActiveProfile?.apiKey || dfActiveProfile?.apiKeyMasked || '', copyLabel: 'API key' },
                    { label: 'Webhook Secret', value: dfActiveProfile?.webhookSecret || dfActiveProfile?.webhookSecretMasked || '', copyLabel: 'Webhook secret' },
                  ].map((entry) => (
                    <div key={entry.label} className="rounded-sm border border-line bg-bg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">{entry.label}</div>
                        <button type="button" onClick={() => void handleCopyDealerFeedCredential(entry.value, entry.copyLabel)} className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"><Copy size={12} /> Copy</button>
                      </div>
                      <div className="mt-2 break-all font-mono text-[11px] text-ink">{entry.value || 'Not available yet'}</div>
                    </div>
                  ))}
                  <div className="rounded-sm border border-line bg-bg p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">Server-to-Server cURL</div>
                      <button type="button" onClick={() => void handleCopyDealerFeedCredential(currentDfCurlSnippet, 'Sample cURL command')} className="btn-industrial flex items-center gap-1 px-2 py-1 text-[10px]"><Copy size={12} /> Copy</button>
                    </div>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-sm border border-line bg-surface p-3 font-mono text-[11px] text-ink">
                      {currentDfCurlSnippet || 'Reveal credentials to generate the starter cURL example.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {dfPreviewCount > 0 ? (
              <div className="mb-4 rounded-sm border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Resolved Feed Preview</h3>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{dfPreviewCount} items detected</div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">Detected Format</div>
                    <div className="mt-2 text-xl font-black uppercase tracking-tight text-ink">{dfPreviewType || dfMode}</div>
                  </div>
                  <div className="rounded-sm border border-line bg-bg p-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">Preview Items</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-ink">{dfPreviewCount}</div>
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto rounded-sm border border-line">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-line bg-bg text-[9px] font-black uppercase text-muted">
                        <th className="px-4 py-3">External ID</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Make / Model</th>
                        <th className="px-4 py-3">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {dfPreviewItems.slice(0, 10).map((item, index) => (
                        <tr key={`${String(item.externalId || item.title || index)}-${index}`}>
                          <td className="px-4 py-3 font-mono text-muted">{String(item.externalId || '-')}</td>
                          <td className="px-4 py-3 font-bold text-ink">{String(item.title || 'Untitled listing')}</td>
                          <td className="px-4 py-3 text-muted">{[item.manufacturer || item.make, item.model].filter(Boolean).join(' ') || '-'}</td>
                          <td className="px-4 py-3 text-muted">{String(item.category || '-')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dfPreviewCount > 10 ? (<div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted">Showing first 10 preview records of {dfPreviewCount}</div>) : null}
              </div>
            ) : null}

            {dfResult ? (
              <div className="space-y-4">
                <div className="bg-surface border border-line p-6 rounded-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={16} className="text-data" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">{dfResult.dryRun ? 'Dry Run Complete' : 'Ingest Complete'}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: 'Processed', value: dfResult.processed, color: 'text-ink' },
                      { label: 'Upserted', value: dfResult.upserted, color: 'text-data' },
                      { label: 'Skipped', value: dfResult.skipped, color: 'text-muted' },
                    ].map(s => (
                      <div key={s.label} className="bg-bg border border-line p-4 rounded-sm text-center">
                        <div className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] font-bold text-muted uppercase mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {dfResult.errors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Errors ({dfResult.errors.length})</h4>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {dfResult.errors.map((err, i) => (<li key={i} className="text-[10px] font-mono text-accent bg-accent/5 px-2 py-1 rounded-sm">{err}</li>))}
                      </ul>
                    </div>
                  )}
                  {dfResult.preview && dfResult.preview.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Preview</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                          <thead><tr className="border-b border-line text-[9px] font-black uppercase text-muted"><th className="pb-2 pr-4">External ID</th><th className="pb-2 pr-4">Title</th><th className="pb-2">Action</th></tr></thead>
                          <tbody className="divide-y divide-line">
                            {dfResult.preview.map((p, i) => (
                              <tr key={i} className="py-1">
                                <td className="py-1.5 pr-4 font-mono text-muted">{p.externalId}</td>
                                <td className="py-1.5 pr-4 font-bold text-ink truncate max-w-[140px]">{p.title}</td>
                                <td className="py-1.5"><span className={`px-2 py-0.5 rounded-sm font-black text-[9px] uppercase ${p.action === 'insert' ? 'bg-data/10 text-data' : p.action === 'update' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-line text-muted'}`}>{p.action}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-dashed border-line rounded-sm p-12 flex flex-col items-center justify-center text-center">
                <Database size={40} className="text-muted opacity-20 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Results will appear here after running an ingest</p>
              </div>
            )}
          </div>
        </div>
      )}

      {dfSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-surface p-6 border border-line rounded-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-ink">Recent Ingest Runs</h3>
            <button onClick={handleLoadLogs} disabled={dfLogsLoading} className="btn-industrial py-2 px-4 flex items-center gap-2 text-[10px] disabled:opacity-50">
              <RefreshCw size={13} className={dfLogsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {dfLogsLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
          ) : dfLogs.length === 0 ? (
            <div className="bg-surface border border-dashed border-line rounded-sm p-12 flex flex-col items-center justify-center text-center">
              <Clock size={36} className="text-muted opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">No ingest logs found</p>
            </div>
          ) : (
            <div className="bg-bg border border-line rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface/30 text-[10px] font-black uppercase tracking-widest text-muted border-b border-line">
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Dealer ID</th>
                      <th className="px-6 py-4">Processed</th>
                      <th className="px-6 py-4">Upserted</th>
                      <th className="px-6 py-4">Skipped</th>
                      <th className="px-6 py-4">Errors</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {dfLogs.map(log => (
                      <tr key={log.id} className="hover:bg-surface/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-black text-ink uppercase">{log.sourceName}</td>
                        <td className="px-6 py-4 text-[10px] font-mono text-muted truncate max-w-[100px]">{log.dealerId}</td>
                        <td className="px-6 py-4 text-xs font-black text-ink">{log.processed}</td>
                        <td className="px-6 py-4 text-xs font-black text-data">{log.upserted}</td>
                        <td className="px-6 py-4 text-xs font-black text-muted">{log.skipped}</td>
                        <td className="px-6 py-4"><span className={`text-[10px] font-black ${log.errors?.length ? 'text-accent' : 'text-data'}`}>{log.errors?.length ?? 0}</span></td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-sm ${log.dryRun ? 'bg-yellow-500/10 text-yellow-500' : 'bg-data/10 text-data'}`}>{log.dryRun ? 'Dry Run' : 'Live'}</span></td>
                        <td className="px-6 py-4 text-[10px] font-bold text-muted">{formatLogTime(log.processedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

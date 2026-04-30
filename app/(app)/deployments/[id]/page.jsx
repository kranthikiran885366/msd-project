"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  GitBranch, Globe, ChevronLeft, ExternalLink,
  Package, Server, GitCommit, User, Calendar,
  AlertTriangle, RotateCcw, Copy, Check, Play, Ban,
  Layers, Github, Link2, Settings, ChevronDown, ChevronUp
} from "lucide-react"
import apiClient from "@/lib/api-client"

const PIPELINE = [
  { id: "pending",   label: "Queued",             icon: Clock,    desc: "Waiting for a runner" },
  { id: "building",  label: "Building",            icon: Package,  desc: "Installing & compiling" },
  { id: "deploying", label: "Deploying",           icon: Server,   desc: "Starting container" },
  { id: "running",   label: "Live",                icon: Globe,    desc: "Service is running" },
]
const STATUS_ORDER = ["pending", "building", "deploying", "running"]

function pipelineIndex(status) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? (status === "failed" ? -2 : 0) : i
}

function StatusPill({ status }) {
  const map = {
    pending:      "bg-yellow-100 text-yellow-800 border-yellow-200",
    building:     "bg-blue-100 text-blue-800 border-blue-200",
    deploying:    "bg-purple-100 text-purple-800 border-purple-200",
    running:      "bg-green-100 text-green-800 border-green-200",
    failed:       "bg-red-100 text-red-800 border-red-200",
    "rolled-back":"bg-gray-100 text-gray-700 border-gray-200",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${map[status] || map.pending}`}>
      {["pending","building","deploying"].includes(status) && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {status}
    </span>
  )
}

function PipelineStep({ step, index, currentIndex, isFailed }) {
  const Icon = step.icon
  const done   = currentIndex > index
  const active = currentIndex === index
  const failed = isFailed && currentIndex + 1 === index
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
      done ? "bg-green-50/80 border-green-200" : active ? "bg-blue-50/80 border-blue-300 shadow-sm" :
      failed ? "bg-red-50/80 border-red-200" : "bg-muted/20 border-transparent"
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? "bg-green-500" : active ? "bg-blue-500" : failed ? "bg-red-500" : "bg-muted"
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4 text-white" /> :
         active ? <Loader2 className="w-4 h-4 text-white animate-spin" /> :
         failed ? <XCircle className="w-4 h-4 text-white" /> :
         <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${done?"text-green-800":active?"text-blue-800":failed?"text-red-800":"text-muted-foreground"}`}>{step.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
      </div>
      <span className={`text-xs font-medium ${done?"text-green-600":active?"text-blue-600":failed?"text-red-600":"text-muted-foreground"}`}>
        {done?"✓ Done":active?"Running…":failed?"✗ Failed":"Waiting"}
      </span>
    </div>
  )
}

function LogLine({ log }) {
  const msg = log.message || ''
  const isHeader  = msg.startsWith('==>')
  const isSuccess = msg.includes('✓') || msg.toLowerCase().includes('deployed at') || msg.toLowerCase().includes('success')
  const isError   = log.level === 'error'
  const isWarn    = log.level === 'warn'
  const isStep    = /^Step \d+\/\d+/.test(msg)
  const color = isError?"text-red-400":isWarn?"text-yellow-300":isHeader?"text-cyan-300 font-bold":isSuccess?"text-green-400":isStep?"text-blue-300":"text-gray-200"
  const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString("en-US",{hour12:false}) : ""
  return (
    <div className={`flex gap-3 py-0.5 px-1 rounded hover:bg-white/5 ${isHeader?"mt-2":""}`}>
      <span className="text-gray-600 text-xs flex-shrink-0 w-20 select-none tabular-nums">{time}</span>
      <span className={`text-xs leading-relaxed break-all font-mono ${color}`}>{msg}</span>
    </div>
  )
}

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [deployment, setDeployment] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [projectDomains, setProjectDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [domainStatus, setDomainStatus] = useState(null)
  const logsEndRef = useRef(null)
  const pollRef = useRef(null)
  const isActive = (d) => d && ["pending","building","deploying"].includes(d.status)

  const fetchAll = useCallback(async () => {
    try {
      const dep = await apiClient.getDeploymentById(id)
      setDeployment(dep)
      try {
        if (dep?.projectId?._id) {
          const domains = await apiClient.getDomains(dep.projectId._id)
          setProjectDomains(domains || [])
        }
      } catch (_) {}
      try {
        const l = await apiClient.getDeploymentLogs(id)
        if (Array.isArray(l) && l.length > 0) setLogs(l)
      } catch (_) {}
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    clearInterval(pollRef.current)
    if (deployment && isActive(deployment)) pollRef.current = setInterval(fetchAll, 2000)
    return () => clearInterval(pollRef.current)
  }, [deployment?.status, fetchAll])

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs.length])

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const action = async (key, fn) => {
    try { setActionLoading(key); await fn() }
    catch (e) { console.error(e) }
    finally { setActionLoading(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  if (!deployment) return <div className="text-center py-20 text-muted-foreground">Deployment not found</div>

  const project     = deployment.projectId
  const currentStep = pipelineIndex(deployment.status)
  const isFailed    = deployment.status === "failed"
  const isLive      = deployment.status === "running"
  const active      = isActive(deployment)
  const domain      = deployment.providerMetadata?.domain
  const appUrl      = deployment.productionUrl
  const rawUrl      = deployment.previewUrl
  const repoUrl     = project?.repository ? `https://github.com/${project.repository.owner}/${project.repository.name}` : null
  const elapsed     = deployment.createdAt ? Math.round((Date.now() - new Date(deployment.createdAt)) / 1000) : null

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">

      {/* Back */}
      <button onClick={() => router.push("/deployments")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
        <ChevronLeft className="w-4 h-4" /> All Deployments
      </button>

      {/* ── Hero card ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${isLive?"bg-green-100":isFailed?"bg-red-100":"bg-blue-100"}`}>
              {isLive ? <CheckCircle2 className="w-7 h-7 text-green-600" /> :
               isFailed ? <XCircle className="w-7 h-7 text-red-600" /> :
               <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{project?.name || "Deployment"}</h1>
                <StatusPill status={deployment.status} />
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{deployment.environment || "production"}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{deployment.gitBranch || "main"}</span>
                {deployment.gitCommit && (
                  <span className="flex items-center gap-1 font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    <GitCommit className="w-3 h-3" />{deployment.gitCommit.slice(0,7)}
                  </span>
                )}
                {deployment.gitAuthor && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{deployment.gitAuthor}</span>}
              </div>
              {deployment.commitMessage && <p className="text-sm text-muted-foreground mt-1 italic">"{deployment.commitMessage}"</p>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {repoUrl && (
              <a href={repoUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="gap-1.5"><Github className="w-3.5 h-3.5" /> Repository</Button>
              </a>
            )}
            {isLive && appUrl && (
              <>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(appUrl,'url')} className="gap-1.5">
                  {copied==='url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied==='url' ? "Copied!" : "Copy URL"}
                </Button>
                <a href={appUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" className="gap-1.5 bg-black hover:bg-gray-800 text-white">
                    <ExternalLink className="w-3.5 h-3.5" /> Visit
                  </Button>
                </a>
              </>
            )}
            {!active && (
              <Button size="sm" variant="outline" className="gap-1.5"
                disabled={actionLoading==='redeploy'}
                onClick={() => action('redeploy', async () => { const d=await apiClient.redeployDeployment(id); router.push(`/deployments/${d._id||d.id}`) })}>
                {actionLoading==='redeploy' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Instant Rollback
              </Button>
            )}
            {!active && (
              <Button size="sm" variant="outline" className="gap-1.5"
                disabled={actionLoading==='rebuild'}
                onClick={() => action('rebuild', async () => { const d=await apiClient.rebuildDeployment(id); router.push(`/deployments/${d._id||d.id}`) })}>
                {actionLoading==='rebuild' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                Rebuild
              </Button>
            )}
            {active && (
              <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                disabled={actionLoading==='cancel'}
                onClick={() => action('cancel', async () => { await apiClient.cancelDeployment(id); fetchAll() })}>
                {actionLoading==='cancel' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                Cancel
              </Button>
            )}
            {active && <Button size="sm" variant="ghost" onClick={fetchAll} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" /></Button>}
          </div>
        </div>

        {/* Domain + URL section like Vercel */}
        {(isLive || domain) && (
          <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t">
            {/* Deployment URL */}
            {appUrl && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase mb-1.5">Deployment URL</p>
                <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                  <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <a href={appUrl} target="_blank" rel="noreferrer"
                    className="text-sm font-mono text-blue-600 hover:underline truncate">{appUrl}</a>
                  <button onClick={() => copyToClipboard(appUrl,'appUrl')} className="ml-auto flex-shrink-0">
                    {copied==='appUrl' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}
            {/* Domain */}
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase mb-1.5 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Domain
              </p>
              <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-lg border">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-sm font-mono truncate">{domain || `${String(id).slice(-8)}.clouddeck.local`}</span>
                {domain && (
                  <button onClick={() => copyToClipboard(domain,'domain')} className="ml-auto flex-shrink-0">
                    {copied==='domain' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          {[
            { label:"Environment", value: deployment.environment||"production", icon: Server },
            { label:"Started",     value: deployment.createdAt ? new Date(deployment.createdAt).toLocaleTimeString() : "—", icon: Calendar },
            { label:"Build Time",  value: deployment.buildTime ? `${Math.floor(deployment.buildTime/60)}m ${deployment.buildTime%60}s` : active ? `${elapsed}s` : "—", icon: Clock },
            { label:"Framework",   value: project?.framework || "—", icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase"><Icon className="w-3.5 h-3.5" />{label}</div>
              <p className="text-sm font-semibold capitalize">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Build Pipeline ── */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold text-base mb-4">Build Pipeline</h2>
        <div className="space-y-2">
          {PIPELINE.map((step, i) => (
            <PipelineStep key={step.id} step={step} index={i} currentIndex={currentStep} isFailed={isFailed} />
          ))}
        </div>
        {isFailed && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Deployment failed</p>
              <p className="text-xs text-red-700 mt-1">{deployment.rollbackReason || "Check the build logs below for details."}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Live Build Logs ── */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Build Logs</h2>
          <div className="flex items-center gap-2">
            {logs.length > 0 && <span className="text-xs text-muted-foreground">{logs.length} lines</span>}
            {active && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> Live
              </span>
            )}
          </div>
        </div>
        <div className="bg-gray-950 rounded-xl p-4 h-80 overflow-y-auto font-mono">
          <div className="text-gray-500 text-xs mb-3 pb-3 border-b border-gray-800">
            {'==>'} {project?.name || 'app'} · {deployment.gitBranch || 'main'} · {String(id).slice(-8)}
          </div>
          {logs.length > 0 ? logs.map((log, i) => <LogLine key={i} log={log} />) : (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              {active ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Waiting for build output…</> : "No logs available."}
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* ── Deployment Settings (collapsible like Vercel) ── */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <button onClick={() => setShowSettings(p => !p)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-semibold text-sm">Deployment Settings</span>
          </div>
          {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSettings && (
          <div className="px-6 pb-6 border-t">
            <div className="mb-4">
              <label className="text-xs text-muted-foreground font-medium uppercase">Assign Domain</label>
              <div className="flex items-center gap-2 mt-2">
                <select className="flex-1 p-2 rounded border bg-card" value={selectedDomain || ''} onChange={e => setSelectedDomain(e.target.value)}>
                  <option value="">Select a domain...</option>
                  {projectDomains.map(d => <option key={d._id} value={d._id}>{d.host} {d.status!=='verified' && `(${d.status})`}</option>)}
                </select>
                <Button size="sm" onClick={async () => {
                  if (!selectedDomain) return; setActionLoading('assignDomain');
                  try { await apiClient.assignDomainToDeployment(id, selectedDomain); await fetchAll(); } catch (e) { console.error(e) }
                  finally { setActionLoading(null) }
                }} disabled={actionLoading==='assignDomain'}>
                  {actionLoading==='assignDomain' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!selectedDomain) return;
                  setActionLoading('checkDomain');
                  try { const status = await apiClient.getDomainVerificationStatus(selectedDomain); setDomainStatus(status); }
                  catch (e) { console.error(e); setDomainStatus(null); }
                  finally { setActionLoading(null); }
                }} disabled={actionLoading==='checkDomain'}>
                  {actionLoading==='checkDomain' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check DNS'}
                </Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  if (!selectedDomain) return;
                  setActionLoading('regenDomain');
                  try { await apiClient.regenerateDomainVerification(selectedDomain); const status = await apiClient.getDomainVerificationStatus(selectedDomain); setDomainStatus(status); }
                  catch (e) { console.error(e); }
                  finally { setActionLoading(null); }
                }} disabled={actionLoading==='regenDomain'}>
                  {actionLoading==='regenDomain' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerate Challenge'}
                </Button>
              </div>
              {domainStatus && (
                <div className="mt-2 text-xs rounded border bg-muted/30 p-2 space-y-1">
                  <div><span className="font-semibold">Verification:</span> {domainStatus.canVerify ? 'Ready' : 'Pending DNS propagation'}</div>
                  <div className="font-mono break-all">TXT Host: {domainStatus?.expected?.txtHost || '—'}</div>
                  <div className="font-mono break-all">TXT Value: {domainStatus?.expected?.txtValue || '—'}</div>
                  <div className="font-mono break-all">CNAME Target: {domainStatus?.expected?.cnameTarget || '—'}</div>
                </div>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm mt-4">
              {[
                { label:"Deployment ID",   value: deployment._id || id, mono: true },
                { label:"Project",         value: project?.name || "—" },
                { label:"Framework",       value: project?.framework || "—" },
                { label:"Build Type",      value: ['react','vue','static'].some(f=>(project?.framework||'').toLowerCase().includes(f)) ? 'Static' : 'Dynamic' },
                { label:"Domain",          value: domain || `${String(id).slice(-8)}.clouddeck.local`, mono: true },
                { label:"Provider",        value: deployment.provider || "custom" },
                { label:"Branch",          value: deployment.gitBranch || "main" },
                { label:"Commit",          value: deployment.gitCommit?.slice(0,7) || "—", mono: true },
                { label:"Author",          value: deployment.gitAuthor || "—" },
                { label:"Triggered by",    value: deployment.triggeredBy || "manual" },
                { label:"Install Command", value: project?.buildSettings?.installCommand || "npm install", mono: true },
                { label:"Build Command",   value: project?.buildSettings?.buildCommand || "npm run build", mono: true },
                { label:"Start Command",   value: project?.buildSettings?.startCommand || "npm start", mono: true },
                { label:"Created",         value: deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : "—" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground font-medium uppercase">{label}</dt>
                  <dd className={`font-medium truncate ${mono?"font-mono text-xs":""}`}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

    </div>
  )
}

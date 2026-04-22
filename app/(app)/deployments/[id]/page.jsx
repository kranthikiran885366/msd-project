"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  GitBranch, Github, Globe, ChevronLeft, ExternalLink,
  Package, Zap, Server, GitCommit, User, Calendar,
  AlertTriangle, RotateCcw, Copy, Check
} from "lucide-react"
import apiClient from "@/lib/api-client"

// ── Build pipeline steps matching backend status flow ──────────────────────
const PIPELINE = [
  { id: "pending",   label: "Queued",                  icon: Clock,       desc: "Waiting for a runner" },
  { id: "building",  label: "Installing & Building",   icon: Package,     desc: "npm install + npm run build" },
  { id: "deploying", label: "Deploying",               icon: Server,      desc: "Pushing to infrastructure" },
  { id: "running",   label: "Live",                    icon: Globe,       desc: "Service is running" },
]

const STATUS_ORDER = ["pending", "building", "deploying", "running"]

function pipelineIndex(status) {
  const i = STATUS_ORDER.indexOf(status)
  return i === -1 ? (status === "failed" ? -2 : 0) : i
}

function StatusPill({ status }) {
  const styles = {
    pending:      "bg-yellow-100 text-yellow-800 border-yellow-200",
    building:     "bg-blue-100 text-blue-800 border-blue-200",
    deploying:    "bg-purple-100 text-purple-800 border-purple-200",
    running:      "bg-green-100 text-green-800 border-green-200",
    failed:       "bg-red-100 text-red-800 border-red-200",
    "rolled-back":"bg-gray-100 text-gray-700 border-gray-200",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.pending}`}>
      {["pending","building","deploying"].includes(status) && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status}
    </span>
  )
}

function PipelineStep({ step, index, currentIndex, isFailed }) {
  const Icon = step.icon
  const done    = currentIndex > index
  const active  = currentIndex === index
  const failed  = isFailed && currentIndex + 1 === index
  const waiting = !done && !active && !failed

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
      done    ? "bg-green-50/80 border-green-200" :
      active  ? "bg-blue-50/80 border-blue-300 shadow-sm" :
      failed  ? "bg-red-50/80 border-red-200" :
      "bg-muted/20 border-transparent"
    }`}>
      {/* Step icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        done    ? "bg-green-500 shadow-green-200 shadow-md" :
        active  ? "bg-blue-500 shadow-blue-200 shadow-md" :
        failed  ? "bg-red-500" :
        "bg-muted"
      }`}>
        {done   ? <CheckCircle2 className="w-5 h-5 text-white" /> :
         active ? <Loader2 className="w-5 h-5 text-white animate-spin" /> :
         failed ? <XCircle className="w-5 h-5 text-white" /> :
         <Icon className="w-5 h-5 text-muted-foreground" />}
      </div>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${
          done ? "text-green-800" : active ? "text-blue-800" : failed ? "text-red-800" : "text-muted-foreground"
        }`}>{step.label}</p>
        <p className={`text-xs mt-0.5 ${
          done || active || failed ? "text-current opacity-70" : "text-muted-foreground"
        }`}>{step.desc}</p>
      </div>

      {/* Status label */}
      <span className={`text-xs font-medium flex-shrink-0 ${
        done ? "text-green-600" : active ? "text-blue-600" : failed ? "text-red-600" : "text-muted-foreground"
      }`}>
        {done ? "✓ Done" : active ? "Running…" : failed ? "✗ Failed" : "Waiting"}
      </span>
    </div>
  )
}

function LogLine({ log, index }) {
  const color =
    log.level === "error" ? "text-red-400" :
    log.level === "warn"  ? "text-yellow-400" :
    log.message?.startsWith('==>') ? 'text-cyan-400 font-semibold' :
    log.message?.startsWith('\u2713') || log.message?.includes('success') ? 'text-green-400' :
    "text-gray-300"

  const time = log.timestamp
    ? new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false })
    : ""

  return (
    <div className="flex gap-3 py-0.5 hover:bg-white/5 px-1 rounded group">
      <span className="text-gray-600 text-xs flex-shrink-0 w-20 select-none">{time}</span>
      <span className={`text-xs leading-relaxed break-all ${color}`}>{log.message}</span>
    </div>
  )
}

export default function DeploymentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [deployment, setDeployment] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef(null)
  const pollRef = useRef(null)
  const isActive = (d) => d && ["pending", "building", "deploying"].includes(d.status)

  const fetchAll = useCallback(async () => {
    try {
      const dep = await apiClient.getDeploymentById(id)
      setDeployment(dep)
      try {
        const l = await apiClient.getDeploymentLogs(id)
        if (Array.isArray(l) && l.length > 0) setLogs(l)
      } catch (_) {}
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Poll every 3s while active
  useEffect(() => {
    clearInterval(pollRef.current)
    if (deployment && isActive(deployment)) {
      pollRef.current = setInterval(fetchAll, 3000)
    }
    return () => clearInterval(pollRef.current)
  }, [deployment?.status, fetchAll])

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs.length])

  const handleCopyUrl = () => {
    if (deployment?.productionUrl) {
      navigator.clipboard.writeText(deployment.productionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRetry = async () => {
    try {
      await apiClient.rollbackDeployment(id)
      fetchAll()
    } catch (e) { console.error(e) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )

  if (!deployment) return (
    <div className="text-center py-20 text-muted-foreground">Deployment not found</div>
  )

  const project = deployment.projectId
  const currentStep = pipelineIndex(deployment.status)
  const isFailed = deployment.status === "failed"
  const isLive = deployment.status === "running"
  const active = isActive(deployment)

  // Elapsed time
  const elapsed = deployment.createdAt
    ? Math.round((Date.now() - new Date(deployment.createdAt)) / 1000)
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-16">

      {/* ── Back nav ── */}
      <button
        onClick={() => router.push("/deployments")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ChevronLeft className="w-4 h-4" /> All Deployments
      </button>

      {/* ── Hero ── */}
      <div className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isLive   ? "bg-green-100" :
              isFailed ? "bg-red-100" :
              "bg-blue-100"
            }`}>
              {isLive   ? <CheckCircle2 className="w-7 h-7 text-green-600" /> :
               isFailed ? <XCircle className="w-7 h-7 text-red-600" /> :
               <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{project?.name || "Deployment"}</h1>
                <StatusPill status={deployment.status} />
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  {deployment.gitBranch || "main"}
                </span>
                {deployment.gitCommit && (
                  <span className="flex items-center gap-1 font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    <GitCommit className="w-3 h-3" />
                    {deployment.gitCommit.slice(0, 7)}
                  </span>
                )}
                {deployment.gitAuthor && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {deployment.gitAuthor}
                  </span>
                )}
              </div>
              {deployment.commitMessage && (
                <p className="text-sm text-muted-foreground mt-1 italic">"{deployment.commitMessage}"</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLive && deployment.productionUrl && (
              <>
                <Button size="sm" variant="outline" onClick={handleCopyUrl} className="gap-1.5">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy URL"}
                </Button>
                <a href={deployment.productionUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
                    <ExternalLink className="w-3.5 h-3.5" /> Visit Site
                  </Button>
                </a>
              </>
            )}
            {isFailed && (
              <Button size="sm" variant="outline" onClick={handleRetry} className="gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </Button>
            )}
            {active && (
              <Button size="sm" variant="ghost" onClick={fetchAll} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Live URL bar */}
        {isLive && deployment.productionUrl && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
            <a
              href={deployment.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-green-700 hover:underline truncate"
            >
              {deployment.productionUrl}
            </a>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
          {[
            {
              label: "Environment",
              value: deployment.environment || "production",
              icon: Server,
            },
            {
              label: "Started",
              value: deployment.createdAt
                ? new Date(deployment.createdAt).toLocaleTimeString()
                : "—",
              icon: Calendar,
            },
            {
              label: "Build Time",
              value: deployment.buildTime
                ? `${Math.floor(deployment.buildTime / 60)}m ${deployment.buildTime % 60}s`
                : active ? `${elapsed}s elapsed` : "—",
              icon: Clock,
            },
            {
              label: "Deploy Size",
              value: deployment.buildSize
                ? `${(deployment.buildSize / 1024 / 1024).toFixed(1)} MB`
                : "—",
              icon: Package,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
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
            <PipelineStep
              key={step.id}
              step={step}
              index={i}
              currentIndex={currentStep}
              isFailed={isFailed}
            />
          ))}
        </div>

        {isFailed && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Deployment failed</p>
              <p className="text-xs text-red-700 mt-1">
                {deployment.rollbackReason || "Check the build logs below for details."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Live Build Logs ── */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Build Logs</h2>
          {active && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Live streaming
            </span>
          )}
        </div>

        <div className="bg-gray-950 rounded-xl p-4 h-80 overflow-y-auto font-mono">
          {/* Fake header like Render/Heroku */}
          <div className="text-gray-500 text-xs mb-3 pb-3 border-b border-gray-800">
            {'==>'} Deployment {id?.slice(-8)} {'·'} {project?.name || 'app'} {'·'} {deployment.gitBranch || 'main'}
          </div>

          {logs.length > 0 ? (
            logs.map((log, i) => <LogLine key={i} log={log} index={i} />)
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              {active ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Waiting for build output…
                </>
              ) : (
                "No logs available for this deployment."
              )}
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* ── Deployment Info ── */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold text-base mb-4">Deployment Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {[
            { label: "Deployment ID", value: deployment._id || id, mono: true },
            { label: "Project", value: project?.name || "—" },
            { label: "Framework", value: project?.framework || "—" },
            { label: "Provider", value: deployment.provider || "custom" },
            { label: "Branch", value: deployment.gitBranch || "main" },
            { label: "Commit", value: deployment.gitCommit?.slice(0, 7) || "—", mono: true },
            { label: "Author", value: deployment.gitAuthor || "—" },
            { label: "Created", value: deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : "—" },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground font-medium uppercase">{label}</dt>
              <dd className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

    </div>
  )
}

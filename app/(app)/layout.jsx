'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/use-app-store';
import apiClient from '@/lib/api-client';
import { Brand } from '@/components/product/brand';
import { LayoutDashboard, Box, GitBranch, Terminal, Database, Globe, Settings, Users, Plug, Menu, X, LogOut, ChevronDown, BookOpen, ArrowUpRight, Search, Layers, Activity } from 'lucide-react';
const sections = [
  { title: 'WORKSPACE', items: [['/dashboard','Overview',LayoutDashboard],['/projects','Projects',Box],['/deployments','Deployments',GitBranch],['/builds','Builds',Layers]] },
  { title: 'MANAGE', items: [['/monitoring','Logs & monitoring',Terminal],['/databases','Databases',Database],['/domains','Domains',Globe],['/env','Environment',Settings],['/providers','Providers',Plug]] },
  { title: 'ORGANIZATION', items: [['/team','Team',Users],['/settings','Settings',Settings],['/status','Platform status',Activity]] },
];
export default function AppLayout({ children }) {
  const path = usePathname(); const router = useRouter();
  const { user, setUser, setIsAuthenticated, logout } = useAppStore();
  const [open,setOpen] = useState(false); const [verified,setVerified] = useState(false);
  useEffect(()=>{let active=true;apiClient.getCurrentUser().then(result=>{if(active){setUser(result.user || result);setIsAuthenticated(true);setVerified(true);}}).catch(()=>{if(active){apiClient.clearTokens();logout();router.replace('/login');}});return()=>{active=false;};},[router,setUser,setIsAuthenticated,logout]);
  useEffect(()=>{setOpen(false);},[path]);
  const section = sections.flatMap(s=>s.items).find(([href])=>path===href || (href!='/dashboard'&&path.startsWith(href+'/')))?.[1] || 'Workspace';
  return <div className="cd-app"><a href="#workspace-content" className="cd-skip-link">Skip to content</a>{open&&<button className="cd-mobile-overlay" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <aside className={`cd-sidebar ${open?'is-open':''}`}><div className="cd-sidebar-brand"><Brand href="/dashboard"/><button className="cd-mobile-close" aria-label="Close navigation" onClick={()=>setOpen(false)}><X size={18}/></button></div><div className="cd-workspace-switch"><span className="cd-workspace-avatar">{(user?.name||'W').slice(0,1).toUpperCase()}</span><div><strong>{user?.name ? `${user.name.split(' ')[0]}’s workspace`:'Your workspace'}</strong><small>Personal workspace</small></div><ChevronDown size={14}/></div>
      <nav aria-label="Workspace navigation">{sections.map(s=><div className="cd-nav-group" key={s.title}><p>{s.title}</p>{s.items.map(([href,label,Icon])=>{const selected=path===href || (href!='/dashboard'&&path.startsWith(href+'/'));return <Link key={href} href={href} className={selected?'is-active':''} aria-current={selected?'page':undefined}><Icon size={17}/>{label}{selected&&<span className="cd-nav-active-dot"/>}</Link>;})}</div>)}</nav><div className="cd-sidebar-bottom"><Link href="/docs"><BookOpen size={16}/>Documentation<ArrowUpRight size={13}/></Link><div className="cd-sidebar-user"><span className="cd-user-avatar">{(user?.name||'U').slice(0,1).toUpperCase()}</span><div><strong>{user?.name||'Your account'}</strong><small>{user?.email||'Verifying session…'}</small></div><button aria-label="Sign out" onClick={async()=>{await apiClient.logout();logout();router.replace('/login');}}><LogOut size={16}/></button></div></div></aside>
    <div className="cd-app-main"><header className="cd-topbar"><div><button className="cd-mobile-menu" aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu size={20}/></button><span className="cd-breadcrumb">Workspace <span>/</span><strong>{section}</strong></span></div><form action="/projects" className="cd-global-search" role="search"><Search size={14}/><input name="q" placeholder="Find a project…" aria-label="Find a project"/></form><Link className="cd-topbar-docs" href="/docs">Help & docs<ArrowUpRight size={13}/></Link></header><main id="workspace-content">{verified?children:<div className="cd-session-loading" role="status">Verifying your session…</div>}</main></div></div>;
}

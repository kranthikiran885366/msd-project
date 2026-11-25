'use client';
import { useEffect,useMemo,useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus,Search,Box,ArrowUpRight,GitBranch,RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader,Status,ErrorNotice } from '@/components/product/brand';
export default function Projects() {
  const query=useSearchParams(); const [search,setSearch]=useState(query.get('q')||'');const [projects,setProjects]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  async function refresh(){setLoading(true);try{setProjects(await apiClient.getProjects());setError(null);}catch(e){setError(e);}finally{setLoading(false);}}
  useEffect(()=>{refresh();},[]);useEffect(()=>{setSearch(query.get('q')||'');},[query]);
  const filtered=useMemo(()=>projects.filter(p=>`${p.name} ${p.repository?.fullName||''}`.toLowerCase().includes(search.toLowerCase())),[projects,search]);
  return <div className="cd-page"><PageHeader eyebrow="YOUR APPLICATIONS" title="Projects" description="A focused home for every application you ship."><button className="cd-button cd-button-secondary" onClick={refresh} disabled={loading} aria-label="Refresh projects"><RefreshCw size={14}/></button><Link href="/projects/create" className="cd-button"><Plus size={15}/>New project</Link></PageHeader><ErrorNotice error={error} retry={refresh}/><div className="cd-project-toolbar"><label className="cd-search-input"><Search size={14}/><input aria-label="Search projects" placeholder="Search projects or repositories…" value={search} onChange={e=>setSearch(e.target.value)}/></label><span>{filtered.length} {filtered.length===1?'project':'projects'}</span></div>
  {loading&&!projects.length?<div className="cd-empty" role="status">Loading projects…</div>:!filtered.length?<div className="cd-panel cd-empty"><Box size={28}/><h3>{search?'No matching projects.':'Make space for your next idea.'}</h3><p>{search?'Try a different name or repository.':'Your projects will appear here once you create them.'}</p>{!search&&<Link className="cd-button" href="/projects/create">Create your first project<ArrowUpRight size={14}/></Link>}</div>:<div className="cd-project-card-grid">{filtered.map(p=><Link className="cd-project-card" key={p._id} href={`/projects/${p._id}`}><div><span className="cd-project-symbol"><Box size={21}/></span><ArrowUpRight size={15}/></div><h2>{p.name}</h2><p>{p.description||p.framework||'Application project'}</p><div className="cd-project-card-repo"><GitBranch size={12}/>{p.repository?.fullName||p.repository?.name||'No repository configured'}</div><footer><Status value={p.lastDeployment?.status||p.status}/><span>{new Date(p.updatedAt||p.createdAt).toLocaleDateString()}</span></footer></Link>)}</div>}</div>;
}

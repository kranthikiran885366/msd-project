'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, GitBranch, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { PageHeader } from '@/components/product/brand';
export default function CreateProject() {
  const router=useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const [form,setForm]=useState({ name:'', repository:'', branch:'main', framework:'Other', rootDirectory:'.', installCommand:'', buildCommand:'', startCommand:'', port:3000 });
  const field=(key,value)=>setForm(previous=>({...previous,[key]:value}));
  async function submit(event) {
    event.preventDefault();setError('');
    let repository;
    try {const url=new URL(form.repository);const parts=url.pathname.replace(/\.git$/,'').split('/').filter(Boolean);if(url.protocol!=='https:'||url.hostname!=='github.com'||url.username||url.password||url.search||url.hash||parts.length!==2||!parts.every(p=>/^[\w.-]+$/.test(p)))throw new Error();repository={ provider:'github', owner:parts[0], name:parts[1], fullName:parts.join('/'), url:`https://github.com/${parts.join('/')}.git`, branch:form.branch, deployOnPush:false };} catch {setError('Enter a GitHub HTTPS repository URL without credentials.');return;}
    setBusy(true);
    try { const project=await apiClient.createProject({name:form.name.trim(),framework:form.framework,repository,buildSettings:{rootDirectory:form.rootDirectory,installCommand:form.installCommand,buildCommand:form.buildCommand,startCommand:form.startCommand},runtimeConfig:{runtime:'auto',port:Number(form.port)},deploymentSettings:{autoDeploy:false,productionBranch:form.branch}});router.push(`/projects/${project._id}`); }
    catch(e){setError(e.message||'Could not create the project.');}finally{setBusy(false);}
  }
  return <div className="cd-page"><Link href="/projects" className="cd-text-link"><ArrowLeft size={13}/>Back to projects</Link><PageHeader eyebrow="A NEW HOME FOR YOUR CODE" title="Create a project" description="Connect your repository. Configure once. Deploy deliberately."/>
    <form className="cd-create-grid" onSubmit={submit}><div className="cd-panel cd-form-panel"><div className="cd-panel-heading"><h2>Project configuration</h2><GitBranch size={16}/></div><div className="cd-form-fields">{error&&<div role="alert" className="cd-error">{error}</div>}
      <label>Project name<input required minLength={2} maxLength={80} value={form.name} onChange={e=>field('name',e.target.value)} placeholder="Your application’s name"/></label>
      <label>GitHub repository<input type="url" required value={form.repository} onChange={e=>field('repository',e.target.value)} placeholder="https://github.com/owner/repository"/><small>Private repositories require your own connected GitHub account.</small></label>
      <div className="cd-form-pair"><label>Branch<input required value={form.branch} onChange={e=>field('branch',e.target.value)}/></label><label>Framework<select value={form.framework} onChange={e=>setForm(previous=>({...previous,framework:e.target.value,port:['React','Vue','Svelte'].includes(e.target.value)?80:3000}))}>{['Other','Next.js','React','Vue','Svelte','Express'].map(f=><option key={f}>{f}</option>)}</select></label></div>
      <div className="cd-form-pair"><label>Root directory<input required value={form.rootDirectory} onChange={e=>field('rootDirectory',e.target.value)}/></label><label>Application port<input type="number" min="1" max="65535" required value={form.port} onChange={e=>field('port',e.target.value)}/></label></div>
      <details className="cd-build-details"><summary>Build & runtime commands</summary><p>Leave blank to use runtime detection or your repository’s Dockerfile.</p>{[['installCommand','Install command'],['buildCommand','Build command'],['startCommand','Start command']].map(([key,label])=><label key={key}>{label}<input value={form[key]} onChange={e=>field(key,e.target.value)} autoComplete="off"/></label>)}</details>
      <div className="cd-form-submit"><span>Creates configuration without starting a deployment.</span><button className="cd-button" disabled={busy}>{busy?'Creating…':'Create project'}<ArrowRight size={15}/></button></div>
    </div></div><aside className="cd-create-note"><ShieldCheck size={25}/><h2>You’re in control.</h2><p>Review the project before your first deployment. Automatic deployment is off until you deliberately configure it.</p><ol><li>Connect your source</li><li>Review build configuration</li><li>Deploy to a configured worker</li></ol><Link href="/docs" className="cd-text-link">Read the setup guide ↗</Link></aside></form></div>;
}

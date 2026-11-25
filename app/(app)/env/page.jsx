'use client';
import Link from 'next/link';
import {useCallback,useState} from 'react';
import apiClient from '@/lib/api-client';
import {useResource} from '@/hooks/use-resource';
import {PageHeader,ErrorNotice} from '@/components/product/brand';

export default function EnvironmentPage(){
 const [selection,setSelection]=useState(''),[busy,setBusy]=useState(false),[actionError,setActionError]=useState(null),[notice,setNotice]=useState('');
 const loadProjects=useCallback(()=>apiClient.getProjects(),[]);
 const projects=useResource(loadProjects);
 const projectList=Array.isArray(projects.data)?projects.data:[];
 const projectId=selection||projectList[0]?._id||'';
 const loadVariables=useCallback(async()=>{
  if(!projectId)return [];
  const result=await apiClient.request('/projects/'+encodeURIComponent(projectId)+'/env');
  return result.variables;
 },[projectId]);
 const variables=useResource(loadVariables);
 async function save(event){
  event.preventDefault();const form=event.currentTarget;const fields=new FormData(form);
  setBusy(true);setActionError(null);setNotice('');
  try{
   const key=String(fields.get('key')||'').trim();
   await apiClient.request('/projects/'+encodeURIComponent(projectId)+'/env/'+encodeURIComponent(key),{method:'PUT',body:JSON.stringify({value:String(fields.get('value')||''),isSecret:true})});
   form.reset();setNotice('Variable saved. It will apply to subsequent deployments.');await variables.refresh();
  }catch(error){setActionError(error);}finally{setBusy(false);}
 }
 async function remove(key){
  if(!window.confirm('Delete '+key+' from this project?'))return;
  setBusy(true);setActionError(null);setNotice('');
  try{await apiClient.request('/projects/'+encodeURIComponent(projectId)+'/env/'+encodeURIComponent(key),{method:'DELETE'});setNotice('Variable deleted. Existing running deployments are unchanged.');await variables.refresh();}
  catch(error){setActionError(error);}finally{setBusy(false);}
 }
 return <div className="cd-page">
  <PageHeader eyebrow="PROJECT CONFIGURATION" title="Environment variables" description="Manage project configuration and secrets for subsequent deployments."/>
  <ErrorNotice error={projects.error||variables.error||actionError} retry={()=>{projects.refresh();variables.refresh();}}/>
  {notice&&<p role="status">{notice}</p>}
  {projects.loading?<p role="status">Loading projects…</p>:!projectList.length?<div className="cd-empty">Create a project before adding variables. <Link href="/projects/create">Create project</Link></div>:<>
   <section className="cd-panel"><div className="cd-form-fields"><label>Project<select value={projectId} disabled={busy} onChange={event=>{setSelection(event.target.value);setNotice('');setActionError(null);}}>{projectList.map(project=><option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
    <form onSubmit={save}><div className="cd-form-pair"><label>Variable name<input name="key" required pattern="[A-Za-z_][A-Za-z0-9_]*" autoComplete="off" maxLength={256}/></label><label>Secret value<input name="value" type="password" required autoComplete="new-password"/></label></div><button className="cd-button" disabled={busy||variables.loading}>{busy?'Saving…':'Save variable'}</button></form>
   </div></section>
   <section className="cd-panel"><div className="cd-panel-heading"><h2>Project variables</h2></div>{variables.loading?<p role="status">Loading variables…</p>:Array.isArray(variables.data)&&variables.data.length?<table><thead><tr><th>Name</th><th>Value</th><th>Action</th></tr></thead><tbody>{variables.data.map(variable=><tr key={variable.key}><td><code>{variable.key}</code></td><td>{variable.isSecret?'••••••••':variable.value}</td><td><button disabled={busy} className="cd-text-link" onClick={()=>remove(variable.key)}>Delete</button></td></tr>)}</tbody></table>:!variables.error&&<p>No variables are configured for this project.</p>}</section>
  </>}
 </div>;
}

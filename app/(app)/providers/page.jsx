'use client';
import Link from 'next/link';
import {useCallback} from 'react';
import apiClient from '@/lib/api-client';
import {useResource} from '@/hooks/use-resource';
import {PageHeader,ErrorNotice,Status} from '@/components/product/brand';
export default function ProvidersPage(){
 const loadCatalog=useCallback(()=>apiClient.request('/providers/list'),[]);
 const loadGitHub=useCallback(()=>apiClient.getGitHubConnectionStatus(),[]);
 const catalog=useResource(loadCatalog),github=useResource(loadGitHub);
 const providers=Array.isArray(catalog.data?.providers)?catalog.data.providers:[];
 return <div className="cd-page">
  <PageHeader eyebrow="CONNECTIONS" title="Providers" description="Review your source connection and available deployment providers."/>
  <ErrorNotice error={catalog.error||github.error} retry={()=>{catalog.refresh();github.refresh();}}/>
  <section className="cd-panel"><div className="cd-panel-heading"><h2>GitHub</h2>{github.loading?<span role="status">Checking connection…</span>:github.data&&<Status value={github.data.connected?'connected':'disconnected'}/>}</div>
   {github.data?.connected&&<p>Connected as {github.data.username}.</p>}
   {!github.error&&!github.loading&&!github.data?.connected&&<p>Connect GitHub to choose repositories for your projects.</p>}
   <Link href="/integrations/git" className="cd-button cd-button-secondary">Manage GitHub connection</Link>
  </section>
  <section className="cd-panel"><div className="cd-panel-heading"><h2>Deployment providers</h2></div>
   {catalog.loading?<p role="status">Loading providers…</p>:providers.length?<ul>{providers.map(provider=><li key={provider.name}><strong>{provider.displayName}</strong><p>{provider.description}</p><p>Account connection has not been verified here.</p></li>)}</ul>:!catalog.error&&<p>No deployment providers are listed.</p>}
  </section>
 </div>;
}

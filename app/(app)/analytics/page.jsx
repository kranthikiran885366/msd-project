'use client';
import {useCallback,useState} from 'react';
import apiClient from '@/lib/api-client';
import {useResource} from '@/hooks/use-resource';
import {PageHeader,ErrorNotice} from '@/components/product/brand';
export default function AnalyticsPage(){
 const [days,setDays]=useState(30);
 const load=useCallback(async()=>{const [overview,history]=await Promise.all([apiClient.request('/analytics/overview?days='+days),apiClient.request('/analytics/history?days='+days)]);return {overview:overview.data,history:history.data,observedAt:overview.observedAt};},[days]);
 const resource=useResource(load),data=resource.data;
 return <div className="cd-page"><PageHeader eyebrow="DEPLOYMENT ACTIVITY" title="Analytics" description="Deployment records for your projects, grouped by UTC day."><label>Period<select value={days} onChange={event=>setDays(Number(event.target.value))}>{[7,30,90].map(value=><option key={value} value={value}>Last {value} days</option>)}</select></label><button className="cd-button cd-button-secondary" onClick={resource.refresh}>Refresh</button></PageHeader>
  <ErrorNotice error={resource.error} retry={resource.refresh}/>
  {resource.loading?<p role="status">Loading deployment activity…</p>:data&&<>
   <div className="cd-stat-grid">{[['Deployments',data.overview.totalDeployments],['Currently running',data.overview.runningDeployments],['Failed',data.overview.failedDeployments],['In progress',data.overview.inProgressDeployments]].map(([label,value])=><div className="cd-stat" key={label}><p>{label}</p><strong>{value}</strong></div>)}</div>
   <section className="cd-panel"><div className="cd-panel-heading"><h2>Daily deployment activity</h2></div><table><thead><tr><th>Date (UTC)</th><th>Deployments</th><th>Currently failed</th></tr></thead><tbody>{data.history.map(day=><tr key={day.date}><td>{day.date}</td><td>{day.deployments}</td><td>{day.failedDeployments}</td></tr>)}</tbody></table></section>
   <p>Uptime, request latency, traffic and active-user measurements are unavailable until their collectors are configured.</p><p>Observed {new Date(data.observedAt).toLocaleString()}.</p>
  </>}
 </div>;
}

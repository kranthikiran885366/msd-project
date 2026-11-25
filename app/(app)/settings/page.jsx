import Link from 'next/link';
import {PageHeader} from '@/components/product/brand';
export default function SettingsPage(){
 const links=[['/settings/profile','Profile','Update your account profile.'],['/settings/appearance','Appearance','Choose your workspace appearance.'],['/settings/notifications','Notifications','Manage notification preferences.'],['/projects','Project configuration','Choose a project to change its build and runtime settings.'],['/env','Environment variables','Manage configuration and secrets for a selected project.']];
 return <div className="cd-page"><PageHeader eyebrow="ACCOUNT" title="Settings" description="Open the settings for your account or a specific project."/><section className="cd-panel"><ul>{links.map(([href,label,description])=><li key={href}><Link className="cd-text-link" href={href}>{label}</Link><p>{description}</p></li>)}</ul></section></div>;
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Github, Rocket, Database, BarChart3, Shield, Server, Zap, ArrowRight, Star, Users, Globe, CheckCircle, HelpCircle, Activity, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAppStore } from "@/store/use-app-store"

export default function LandingPage() {
  const { isAuthenticated, loadInitialData } = useAppStore()

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  return (
    <main className="min-h-svh flex flex-col overflow-hidden">
      {/* Enhanced Header with backdrop blur */}
      <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            <span className="sr-only">CloudDeck</span>
            ⚡ CloudDeck
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#integrations" className="text-sm font-medium hover:text-primary transition-colors">
              Integrations
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link href="/status" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Activity className="size-4" /> Status
            </Link>
            <Link href="/help" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="size-4" /> Help
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden md:inline-flex hover:bg-primary/10">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link href="/signup">Sign up</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg">
              <Link href={isAuthenticated ? "/dashboard" : "/signup"}>
                {isAuthenticated ? "Open Dashboard" : "Get started"}
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with enhanced gradients and animations */}
      <section className="relative bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 grid gap-12 md:grid-cols-2 items-center relative">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Star className="size-4" />
              Trusted by 10,000+ developers
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
              Ship faster on one 
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                unified cloud
              </span> dashboard
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-lg">
              CloudDeck brings deployments, databases, logs, analytics, domains, and more into a single, intuitive
              interface. Deploy with confidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl">
                <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                  <Rocket className="size-5 mr-2" /> {isAuthenticated ? "Go to Dashboard" : "Start free"}
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 hover:bg-primary/5">
                <Link href="/deployments">
                  <Server className="size-5 mr-2" /> View deployments
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="hover:bg-primary/10">
                <a href="https://github.com/kranthikiran885366/msd-project" target="_blank" rel="noreferrer">
                  <Github className="size-5 mr-2" /> GitHub
                </a>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Zero-config deploys</div>
                  <div className="text-xs text-muted-foreground">Deploy in seconds</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Shield className="size-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Enterprise security</div>
                  <div className="text-xs text-muted-foreground">SOC 2 compliant</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Database className="size-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Managed databases</div>
                  <div className="text-xs text-muted-foreground">Auto-scaling</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <BarChart3 className="size-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Real-time analytics</div>
                  <div className="text-xs text-muted-foreground">Live insights</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Dashboard Preview */}
          <div className="grid gap-6 animate-fade-in-up animation-delay-200">
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                      <Server className="size-4 text-green-600" />
                    </div>
                    <div className="font-semibold">Recent Deployments</div>
                  </div>
                  <Link href="/deployments" className="text-xs text-primary hover:underline font-medium">
                    See all →
                  </Link>
                </div>
                <div className="space-y-3">
                  <DeploymentRow name="clouddeck-web" status="Running" time="2m ago" />
                  <DeploymentRow name="clouddeck-api" status="Building" time="5m ago" />
                  <DeploymentRow name="docs" status="Running" time="1h ago" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <Database className="size-4 text-blue-600" />
                    </div>
                    <div className="font-semibold">Databases</div>
                  </div>
                  <Link href="/databases" className="text-xs text-primary hover:underline font-medium">
                    Manage →
                  </Link>
                </div>
                <div className="space-y-3">
                  <DatabaseRow name="PostgreSQL" region="iad1" size="Small" usage="45%" />
                  <DatabaseRow name="Redis" region="fra1" size="Small" usage="23%" />
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  <span>10,000+ developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="size-4" />
                  <span>99.9% uptime</span>
                </div>
              </div>
              <StatusSummary />
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="border-t bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
              Everything you need to 
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">operate</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From deployment to monitoring, CloudDeck provides all the tools you need to build, deploy, and scale your applications.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<Server className="size-6" />}
              title="Deployments"
              desc="Deploy on every push with zero configuration. Automatic builds, previews, and rollbacks."
              link="/deployments"
              gradient="from-green-500 to-emerald-600"
            />
            <Feature
              icon={<Database className="size-6" />}
              title="Databases"
              desc="Managed PostgreSQL and Redis with automatic backups and scaling."
              link="/databases"
              gradient="from-blue-500 to-cyan-600"
            />
            <Feature
              icon={<BarChart3 className="size-6" />}
              title="Logs & Analytics"
              desc="Real-time logs, performance metrics, and detailed analytics dashboard."
              link="/logs"
              gradient="from-purple-500 to-violet-600"
            />
            <Feature
              icon={<Shield className="size-6" />}
              title="Domains & Security"
              desc="Custom domains, SSL certificates, and advanced security controls."
              link="/domains"
              gradient="from-orange-500 to-red-600"
            />
            <Feature
              icon={<Zap className="size-6" />}
              title="Functions & Cron"
              desc="Serverless functions and scheduled jobs with automatic scaling."
              link="/functions"
              gradient="from-yellow-500 to-orange-600"
            />
            <Feature
              icon={<Rocket className="size-6" />}
              title="Projects"
              desc="Organize your work and collaborate with your team seamlessly."
              link="/projects"
              gradient="from-pink-500 to-rose-600"
            />
            <Feature
              icon={<HelpCircle className="size-6" />}
              title="Help & Support"
              desc="Comprehensive documentation, FAQs, tutorials, and dedicated support to help you succeed."
              link="/help"
              gradient="from-indigo-500 to-purple-600"
            />
            <Feature
              icon={<Activity className="size-6" />}
              title="System Status"
              desc="Real-time monitoring of all services, incident tracking, and uptime metrics."
              link="/status"
              gradient="from-teal-500 to-green-600"
            />
            <Feature
              icon={<Bell className="size-6" />}
              title="Notifications"
              desc="Stay informed with customizable alerts for deployments, incidents, and system updates."
              link="/notifications"
              gradient="from-amber-500 to-orange-600"
            />
          </div>
        </div>
      </section>

      {/* Enhanced Integrations Section */}
      <section id="integrations" className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Integrates with your favorite tools</h3>
            <p className="text-muted-foreground">Connect with the tools you already use and love</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center opacity-60">
            {['GitHub', 'GitLab', 'Bitbucket', 'Neon', 'Supabase', 'Stripe', 'Vercel', 'AWS'].map((tool) => (
              <div key={tool} className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-muted rounded-lg flex items-center justify-center font-bold text-xs">
                  {tool.slice(0, 2)}
                </div>
                <div className="text-xs font-medium">{tool}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="border-t bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4">
              Simple, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">scalable pricing</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <PricingCard 
              name="Hobby" 
              price="$0" 
              period="/month"
              features={[
                "Unlimited previews", 
                "Community support", 
                "1 Database",
                "Basic analytics",
                "SSL certificates"
              ]} 
            />
            <PricingCard 
              name="Pro" 
              price="$29" 
              period="/month"
              features={[
                "Everything in Hobby",
                "Team collaboration", 
                "Custom domains", 
                "3 Databases",
                "Advanced analytics",
                "Priority support"
              ]} 
              highlight 
            />
            <PricingCard
              name="Scale"
              price="Contact us"
              period=""
              features={[
                "Everything in Pro",
                "SAML SSO", 
                "Dedicated regions", 
                "Unlimited databases",
                "24/7 phone support",
                "Custom SLA"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                ⚡ CloudDeck
              </div>
              <p className="text-sm text-muted-foreground">
                The unified cloud dashboard for modern developers. Deploy, manage, and scale with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/deployments" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Deployments
                </Link>
                <Link href="/databases" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Databases
                </Link>
                <Link href="/functions" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Functions
                </Link>
                <Link href="/domains" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Domains
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link href="/blog" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
                <Link href="/careers" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <Link href="/docs" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
                <Link href="/help" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
                <Link href="/status" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Status
                </Link>
                <Link href="/security" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>© {new Date().getFullYear()} CloudDeck. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Add custom CSS for animations
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
    animation-fill-mode: both;
  }
  
  .bg-grid-pattern {
    background-image: radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`

// Enhanced component functions
function DeploymentRow({ name, status, time }) {
  const statusColor = status === 'Running' ? 'text-green-600' : status === 'Building' ? 'text-yellow-600' : 'text-red-600'
  const statusBg = status === 'Running' ? 'bg-green-100 dark:bg-green-900/20' : status === 'Building' ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20'
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${statusBg}`}></div>
        <span className="font-medium text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className={`font-medium ${statusColor}`}>{status}</span>
        <span className="text-muted-foreground">{time}</span>
      </div>
    </div>
  )
}

function DatabaseRow({ name, region, size, usage }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">{region}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{size}</div>
        <div className="text-xs text-muted-foreground">{usage} used</div>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc, link, gradient }) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-6">{desc}</p>
        <Button asChild variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Link href={link}>
            Explore <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function PricingCard({ name, price, period, features, highlight }) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
      highlight 
        ? "ring-2 ring-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 to-blue-600/5" 
        : "hover:ring-1 hover:ring-primary/50"
    }`}>
      {highlight && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-600"></div>
      )}
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h3 className="font-bold text-xl mb-2">{name}</h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">{price}</span>
            <span className="text-muted-foreground">{period}</span>
          </div>
        </div>
        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button 
          className={`w-full ${
            highlight 
              ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg" 
              : ""
          }`}
          variant={highlight ? "default" : "outline"}
        >
          {name === "Scale" ? "Contact Sales" : `Choose ${name}`}
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusSummary() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/status/system');
        if (!res.ok) throw new Error('Failed to fetch status');
        const data = await res.json();
        setStatus(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching status:', error);
        setError('System status unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="text-sm text-muted-foreground">Loading system status...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-100"></div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const statusColor = 
    status?.overallStatus === 'operational' ? 'text-green-600' :
    status?.overallStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600';

  const statusBg = 
    status?.overallStatus === 'operational' ? 'bg-green-100' :
    status?.overallStatus === 'degraded' ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <Link href="/status">
      <Card className="bg-card/50 hover:bg-card transition-colors">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${statusBg}`}></div>
            <div className="text-sm">
              <span className={`font-medium ${statusColor} capitalize`}>
                {status.overallStatus}
              </span>
              <span className="text-muted-foreground ml-2">
                • Updated {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

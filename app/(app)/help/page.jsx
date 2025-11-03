'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, FileText, Video, MessageSquare, ArrowRight, Code, Lightbulb } from 'lucide-react';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHelpContent = async () => {
      try {
        const [articlesRes, faqsRes, tutorialsRes] = await Promise.all([
          fetch('/api/help/articles'),
          fetch('/api/help/faqs'),
          fetch('/api/help/tutorials')
        ]);

        if (!articlesRes.ok || !faqsRes.ok || !tutorialsRes.ok) {
          throw new Error('Failed to fetch help content');
        }

        const articles = await articlesRes.json();
        const faqsData = await faqsRes.json();
        const tutorialsData = await tutorialsRes.json();

        setDocumentation(articles);
        setFaqs(faqsData);
        setTutorials(tutorialsData);
      } catch (error) {
        console.error('Error fetching help content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load help content. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHelpContent();
  }, [toast]);

  useEffect(() => {
    const searchContent = async () => {
      if (!searchQuery.trim()) return;

      try {
        const res = await fetch(`/api/help/search?query=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Search failed');

        const results = await res.json();
        setDocumentation(results);
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to perform search. Please try again.',
          variant: 'destructive',
        });
      }
    };

    const debounceTimer = setTimeout(searchContent, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, toast]);

  const [documentation, setDocumentation] = useState([
    {
      id: 1,
      title: 'Getting Started',
      description: 'Learn how to deploy your first project',
      icon: '🚀',
      topics: [
        'Creating a project',
        'Connecting your Git repository',
        'Configuring build settings',
        'Deploying your application'
      ]
    },
    {
      id: 2,
      title: 'Environment Variables',
      description: 'Manage configuration and secrets',
      icon: '⚙️',
      topics: [
        'Setting environment variables',
        'Managing secrets securely',
        'Per-environment configuration',
        'Using variables in builds'
      ]
    },
    {
      id: 3,
      title: 'Custom Domains',
      description: 'Configure custom domains and SSL',
      icon: '🌐',
      topics: [
        'Adding a custom domain',
        'Configuring DNS records',
        'SSL certificate management',
        'Subdomain routing'
      ]
    },
    {
      id: 4,
      title: 'CI/CD Pipelines',
      description: 'Automate your deployment workflow',
      icon: '🔄',
      topics: [
        'GitHub Actions integration',
        'GitLab CI/CD setup',
        'Webhook configuration',
        'Automated deployments'
      ]
    },
    {
      id: 5,
      title: 'API Reference',
      description: 'REST API documentation',
      icon: '📡',
      topics: [
        'Authentication',
        'Projects endpoint',
        'Deployments endpoint',
        'Rate limiting'
      ]
    },
    {
      id: 6,
      title: 'SDK Usage',
      description: 'Client library documentation',
      icon: '📦',
      topics: [
        'JavaScript/TypeScript SDK',
        'Python SDK',
        'Go SDK',
        'Ruby SDK'
      ]
    },
  ]);

  const [faqs, setFaqs] = useState([
    {
      question: 'How do I connect my GitHub repository?',
      answer: 'Go to Projects > New Project, select GitHub, authenticate, and choose your repository. We\'ll automatically detect your framework and build configuration.',
      category: 'Projects'
    },
    {
      question: 'What build commands are supported?',
      answer: 'We support any standard build command. Common ones include: npm run build, yarn build, pip install, etc. You can customize this in project settings.',
      category: 'Building'
    },
    {
      question: 'How do I manage environment variables?',
      answer: 'In project settings, go to Environment tab. Add variables there - they\'re scoped per environment (dev/staging/prod) and encrypted at rest.',
      category: 'Configuration'
    },
    {
      question: 'Can I rollback a deployment?',
      answer: 'Yes! Go to Deployments > select a previous deployment > click Rollback. Your site will be restored to that version immediately.',
      category: 'Deployments'
    },
    {
      question: 'How do I use the API?',
      answer: 'Get an API token from Settings > Security > API Tokens. Include it in Authorization header: Bearer sk_live_xxx. See API Reference for endpoints.',
      category: 'API'
    },
    {
      question: 'What regions are available?',
      answer: 'We offer deployments in US East, US West, EU West, and Asia Pacific. Choose during project creation or update in project settings.',
      category: 'Regions'
    },
  ]);

  const [tutorials, setTutorials] = useState([
    {
      title: 'Deploying a Next.js App',
      duration: '5 min',
      level: 'Beginner',
      thumbnail: '⚡'
    },
    {
      title: 'Setting Up Custom Domain with SSL',
      duration: '8 min',
      level: 'Intermediate',
      thumbnail: '🌐'
    },
    {
      title: 'Advanced CI/CD Configuration',
      duration: '12 min',
      level: 'Advanced',
      thumbnail: '🔄'
    },
    {
      title: 'Using Environment Variables Securely',
      duration: '6 min',
      level: 'Beginner',
      thumbnail: '🔐'
    },
  ]);

  const filteredDocs = documentation.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Find answers, learn best practices, and get the most out of your deployment platform</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search documentation, FAQ, and guides..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="docs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{doc.icon}</div>
                  <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{doc.description}</p>

                  <div className="space-y-1 mb-4">
                    {doc.topics.map((topic, idx) => (
                      <p key={idx} className="text-sm text-gray-700">• {topic}</p>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline">
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <div className="space-y-3">
            {filteredFAQs.map((faq, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                      <Badge className="mt-3">{faq.category}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {tutorials.map((tutorial, idx) => (
              <Card key={idx} className="hover:shadow-lg transition cursor-pointer">
                <CardContent className="pt-6">
                  <div className="text-5xl mb-4">{tutorial.thumbnail}</div>
                  <h3 className="font-semibold mb-3">{tutorial.title}</h3>

                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline">{tutorial.duration}</Badge>
                    <Badge className={
                      tutorial.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                      tutorial.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {tutorial.level}
                    </Badge>
                  </div>

                  <Button className="w-full" variant="outline">
                    <Video className="w-4 h-4 mr-2" /> Watch Tutorial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Chat Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Get instant help from our support team via live chat</p>
                <Button className="w-full">Start Live Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Email Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Email us with detailed questions or issues</p>
                <Button className="w-full" variant="outline">support@deployer.dev</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" /> GitHub Discussions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Join our community and discuss with other users</p>
                <Button className="w-full" variant="outline">Visit Discussions</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Feature Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">Suggest features or vote on existing ideas</p>
                <Button className="w-full" variant="outline">View Roadmap</Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Status Page</h3>
              <p className="text-sm text-gray-700 mb-3">Check the status of our services and view incident history</p>
              <Button variant="outline">status.deployer.dev</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

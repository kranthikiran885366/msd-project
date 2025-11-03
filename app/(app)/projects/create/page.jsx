'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CreateProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectName: '',
    provider: '',
    repository: '',
    branch: 'main',
    framework: '',
    buildCommand: '',
    outputDir: '',
    region: 'us-east-1',
    envVars: [],
  });

  const frameworks = [
    { id: 'nextjs', name: 'Next.js', icon: '⚡', buildCmd: 'npm run build', outDir: 'out' },
    { id: 'react', name: 'React', icon: '⚛️', buildCmd: 'npm run build', outDir: 'build' },
    { id: 'vue', name: 'Vue', icon: '💚', buildCmd: 'npm run build', outDir: 'dist' },
    { id: 'angular', name: 'Angular', icon: '🔴', buildCmd: 'npm run build', outDir: 'dist/angular' },
    { id: 'svelte', name: 'Svelte', icon: '🔥', buildCmd: 'npm run build', outDir: 'build' },
    { id: 'nuxt', name: 'Nuxt', icon: '💚', buildCmd: 'npm run build', outDir: '.output' },
  ];

  const regions = [
    { id: 'us-east-1', name: 'US East (Virginia)', latency: '5ms' },
    { id: 'us-west-1', name: 'US West (California)', latency: '10ms' },
    { id: 'eu-west-1', name: 'EU West (Ireland)', latency: '8ms' },
    { id: 'ap-south-1', name: 'Asia Pacific (Singapore)', latency: '15ms' },
  ];

  const handleFrameworkSelect = (framework) => {
    setFormData({
      ...formData,
      framework: framework.id,
      buildCommand: framework.buildCmd,
      outputDir: framework.outDir,
    });
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');

  const handleDeploy = async () => {
    if (!formData.projectName?.trim()) {
      setDeployError('Project name is required');
      return;
    }
    if (!formData.provider) {
      setDeployError('Please select a provider');
      return;
    }
    if (!formData.repository?.trim()) {
      setDeployError('Repository URL is required');
      return;
    }
    if (!formData.framework) {
      setDeployError('Please select a framework');
      return;
    }

    setDeploying(true);
    setDeployError('');
    
    try {
      const projectData = {
        name: formData.projectName.trim(),
        description: `${frameworks.find(f => f.id === formData.framework)?.name || 'Other'} project`,
        framework: frameworks.find(f => f.id === formData.framework)?.name || 'Other',
        githubRepo: formData.provider === 'GitHub' ? formData.repository : null,
        gitlabRepo: formData.provider === 'GitLab' ? formData.repository : null,
        buildCommand: formData.buildCommand,
        rootDirectory: '/',
        region: formData.region,
        autoDeploy: true
      };
      
      const result = await apiClient.createProject?.(projectData);
      if (result?.success || result) {
        router.push('/projects');
      } else {
        setDeployError('Failed to create project. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setDeployError(error?.message || 'Failed to create project. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium mb-2">
                Project Name
              </label>
              <Input
                id="projectName"
                placeholder="my-awesome-project"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                aria-label="Enter project name"
              />
            </div>
            <p className="text-sm text-gray-600">
              Choose a unique name for your project
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <label htmlFor="provider" className="block text-sm font-medium mb-2">
              Git Provider
            </label>
            <div className="grid grid-cols-3 gap-4">
              {['GitHub', 'GitLab', 'Bitbucket'].map(prov => (
                <Card
                  key={prov}
                  className={`cursor-pointer transition ${formData.provider === prov ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setFormData({ ...formData, provider: prov })}
                  role="radio"
                  aria-checked={formData.provider === prov}
                  tabIndex={0}
                >
                  <CardContent className="pt-6 text-center">
                    <p className="font-semibold">{prov}</p>
                    <Badge className="mt-3">
                      {formData.provider === prov ? 'Selected' : 'Available'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="repository" className="block text-sm font-medium mb-2">
                Repository URL
              </label>
              <Input
                id="repository"
                placeholder={`${formData.provider ? formData.provider.toLowerCase() : 'github'}.com/user/repo`}
                value={formData.repository}
                onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                aria-label="Enter repository URL"
              />
            </div>
            <div>
              <label htmlFor="branch" className="block text-sm font-medium mb-2">
                Branch
              </label>
              <Input
                id="branch"
                placeholder="main"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                aria-label="Enter git branch name"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <label htmlFor="framework" className="block text-sm font-medium mb-2">
              Select Framework
            </label>
            <div className="grid grid-cols-2 gap-3">
              {frameworks.map(fw => (
                <Card
                  key={fw.id}
                  className={`cursor-pointer transition ${formData.framework === fw.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => handleFrameworkSelect(fw)}
                  role="radio"
                  aria-checked={formData.framework === fw.id}
                  tabIndex={0}
                >
                  <CardContent className="pt-4">
                    <div className="text-2xl mb-2" aria-hidden="true">
                      {fw.icon}
                    </div>
                    <p className="font-semibold text-sm">{fw.name}</p>
                    {formData.framework === fw.id && (
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-2" aria-label="Selected" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="buildCommand" className="block text-sm font-medium mb-2">
                Build Command
              </label>
              <Input
                id="buildCommand"
                value={formData.buildCommand}
                onChange={(e) => setFormData({ ...formData, buildCommand: e.target.value })}
                aria-label="Enter build command"
              />
            </div>
            <div>
              <label htmlFor="outputDir" className="block text-sm font-medium mb-2">
                Output Directory
              </label>
              <Input
                id="outputDir"
                value={formData.outputDir}
                onChange={(e) => setFormData({ ...formData, outputDir: e.target.value })}
                aria-label="Enter output directory"
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Deploy Region
            </label>
            <div className="space-y-2">
              {regions.map(region => (
                <Card
                  key={region.id}
                  className={`cursor-pointer transition p-4 ${formData.region === region.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => setFormData({ ...formData, region: region.id })}
                  role="radio"
                  aria-checked={formData.region === region.id}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{region.name}</p>
                      <p className="text-xs text-gray-600">
                        Latency: {region.latency}
                      </p>
                    </div>
                    {formData.region === region.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" aria-label="Selected" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Review Your Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Project Name:</span>
                  <span className="font-medium">{formData.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">{formData.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repository:</span>
                  <span className="font-medium">{formData.repository}</span>
                </div>
                <div className="flex justify-between">
                  <span>Framework:</span>
                  <span className="font-medium">{frameworks.find(f => f.id === formData.framework)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Region:</span>
                  <span className="font-medium">{regions.find(r => r.id === formData.region)?.name}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Ready to deploy? Click the deploy button to start the process.</p>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Project Name',
    'Git Provider',
    'Repository',
    'Framework',
    'Build Configuration',
    'Select Region',
    'Review & Deploy'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                    index + 1 <= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition ${
                    index + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            Step {step} of {stepTitles.length}: {stepTitles[step - 1]}
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{stepTitles[step - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="min-h-64">
            {renderStep()}
          </CardContent>
          <div className="border-t p-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            {step < 7 ? (
              <Button
                onClick={handleNext}
                disabled={(() => {
                  try {
                    const key = Object.keys(formData)[step - 1];
                    return !key || !formData[key];
                  } catch (error) {
                    console.error('Error validating form field:', error);
                    return true;
                  }
                })()}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleDeploy}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Deploy Project
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

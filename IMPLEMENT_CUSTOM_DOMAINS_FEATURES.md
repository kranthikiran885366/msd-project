# Implement Custom Domain Deployment Features

## Overview

This guide shows how to implement custom domain deployment features in your deployer app, making it comparable to Netlify and Render.

## Table of Contents
1. [Domain Management API](#domain-management-api)
2. [Custom Domain UI](#custom-domain-ui)
3. [SSL/TLS Certificate Setup](#ssltls-certificate-setup)
4. [DNS Configuration](#dns-configuration)
5. [Deployment Routing](#deployment-routing)
6. [Monitoring & Analytics](#monitoring--analytics)

---

## Domain Management API

### Backend Endpoints Required

```javascript
// server/routes/domains.js

// GET all domains for a project
GET /api/projects/:projectId/domains
Response: [{
  id: "domain_123",
  name: "myproject.com",
  status: "verified", // pending, verified, failed
  type: "production", // production, staging, preview
  sslStatus: "active", // pending, active, expired
  createdAt: "2025-11-04T...",
  deployedVersion: "v1.2.3"
}]

// POST create new domain
POST /api/projects/:projectId/domains
Body: {
  name: "myproject.com",
  type: "production",
  redirectWWW: true
}
Response: {
  id: "domain_123",
  name: "myproject.com",
  cname: "myproject-abc123.deployer.com",
  nameservers: ["ns1.deployer.com", "ns2.deployer.com"],
  status: "pending"
}

// GET domain details and verification status
GET /api/projects/:projectId/domains/:domainId
Response: {
  id: "domain_123",
  name: "myproject.com",
  status: "verified",
  sslStatus: "active",
  dnsRecords: [
    { type: "A", name: "@", value: "1.2.3.4", ttl: 3600 },
    { type: "CNAME", name: "www", value: "myproject.deployer.com", ttl: 3600 }
  ],
  verificationToken: "verify_abc123",
  verificationMethod: "dns" // dns, cname, file
}

// DELETE domain
DELETE /api/projects/:projectId/domains/:domainId
Response: { success: true, message: "Domain deleted" }

// POST verify domain
POST /api/projects/:projectId/domains/:domainId/verify
Response: {
  status: "verified",
  verifiedAt: "2025-11-04T..."
}

// POST assign domain to deployment
POST /api/projects/:projectId/domains/:domainId/deploy
Body: {
  deploymentId: "deploy_123"
}
Response: {
  domain: "myproject.com",
  deployment: "deploy_123",
  liveAt: "2025-11-04T..."
}
```

### Backend Implementation

**File: server/models/Domain.js**

```javascript
const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['production', 'staging', 'preview'],
      default: 'production',
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed'],
      default: 'pending',
    },
    sslStatus: {
      type: String,
      enum: ['pending', 'active', 'expired'],
      default: 'pending',
    },
    redirectWWW: {
      type: Boolean,
      default: true,
    },
    verificationMethod: {
      type: String,
      enum: ['dns', 'cname', 'file'],
      default: 'dns',
    },
    verificationToken: String,
    verificationTXT: String,
    nameservers: [String],
    cnameTarget: String,
    deployedVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deployment',
    },
    verifiedAt: Date,
    sslExpiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Domain', DomainSchema);
```

**File: server/controllers/domainController.js**

```javascript
const Domain = require('../models/Domain');
const axios = require('axios');

class DomainController {
  // Get all domains for project
  static async getDomains(req, res) {
    try {
      const { projectId } = req.params;
      const domains = await Domain.find({ projectId });
      res.json(domains);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  }

  // Create new domain
  static async createDomain(req, res) {
    try {
      const { projectId } = req.params;
      const { name, type, redirectWWW } = req.body;

      // Validate domain name
      if (!name || !/^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/i.test(name)) {
        return res.status(400).json({ error: 'Invalid domain name' });
      }

      // Check if domain already exists
      const existing = await Domain.findOne({ name });
      if (existing) {
        return res.status(400).json({ error: 'Domain already in use' });
      }

      // Generate verification token
      const verificationToken = require('crypto').randomBytes(16).toString('hex');
      
      const domain = new Domain({
        projectId,
        name,
        type,
        redirectWWW,
        verificationToken,
        cnameTarget: `${projectId}-${Math.random().toString(36).substr(2, 9)}.deployer.com`,
      });

      await domain.save();

      res.status(201).json({
        id: domain._id,
        name: domain.name,
        cname: domain.cnameTarget,
        status: 'pending',
        verificationToken,
      });
    } catch (error) {
      console.error('Failed to create domain:', error);
      res.status(500).json({ error: 'Failed to create domain' });
    }
  }

  // Verify domain
  static async verifyDomain(req, res) {
    try {
      const { projectId, domainId } = req.params;
      const domain = await Domain.findOne({ _id: domainId, projectId });

      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      // Check DNS records
      const dns = require('dns').promises;
      
      try {
        const records = await dns.resolveTxt(domain.name);
        const verified = records.some(record =>
          record.join('') === `deployer-verify=${domain.verificationToken}`
        );

        if (!verified) {
          return res.status(400).json({
            error: 'Domain verification failed - DNS record not found',
            expectedRecord: `deployer-verify=${domain.verificationToken}`,
          });
        }

        domain.status = 'verified';
        domain.verifiedAt = new Date();
        await domain.save();

        // Request SSL certificate (would use Let's Encrypt in production)
        domain.sslStatus = 'pending';
        domain.sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        await domain.save();

        res.json({
          status: 'verified',
          verifiedAt: domain.verifiedAt,
          message: 'Domain verified successfully. SSL certificate being issued...',
        });
      } catch (dnsError) {
        domain.status = 'failed';
        await domain.save();
        
        throw dnsError;
      }
    } catch (error) {
      console.error('Failed to verify domain:', error);
      res.status(500).json({ error: 'Failed to verify domain' });
    }
  }

  // Assign domain to deployment
  static async deployToDomain(req, res) {
    try {
      const { projectId, domainId } = req.params;
      const { deploymentId } = req.body;

      const domain = await Domain.findOne({ _id: domainId, projectId });

      if (!domain) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      if (domain.status !== 'verified') {
        return res.status(400).json({ error: 'Domain not verified' });
      }

      domain.deployedVersion = deploymentId;
      await domain.save();

      res.json({
        domain: domain.name,
        deployment: deploymentId,
        liveAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to deploy to domain:', error);
      res.status(500).json({ error: 'Failed to deploy to domain' });
    }
  }

  // Delete domain
  static async deleteDomain(req, res) {
    try {
      const { projectId, domainId } = req.params;
      
      await Domain.deleteOne({ _id: domainId, projectId });
      
      res.json({ success: true, message: 'Domain deleted' });
    } catch (error) {
      console.error('Failed to delete domain:', error);
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  }
}

module.exports = DomainController;
```

---

## Custom Domain UI

### Frontend Components

**File: app/(app)/projects/[id]/domains/page.jsx**

```jsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Globe, Check, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function DomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      // Get projectId from URL
      const projectId = window.location.pathname.split('/')[3];
      const data = await apiClient.request(`/projects/${projectId}/domains`);
      setDomains(data);
    } catch (err) {
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    
    try {
      const projectId = window.location.pathname.split('/')[3];
      const domain = await apiClient.request(`/projects/${projectId}/domains`, {
        method: 'POST',
        body: JSON.stringify({ name: newDomain, type: 'production' })
      });
      
      setDomains([...domains, domain]);
      setNewDomain('');
      setShowAddDomain(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      const projectId = window.location.pathname.split('/')[3];
      await apiClient.request(`/projects/${projectId}/domains/${domainId}/verify`, {
        method: 'POST'
      });
      
      // Refresh domains
      fetchDomains();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Custom Domains</h1>
        <Button onClick={() => setShowAddDomain(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Domain
        </Button>
      </div>

      {showAddDomain && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Add Custom Domain</h2>
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Domain Name</label>
              <Input
                type="text"
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">Add Domain</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDomain(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {domains.map(domain => (
          <Card key={domain._id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold">{domain.name}</h3>
                  <p className="text-sm text-gray-600">
                    CNAME: {domain.cnameTarget}
                  </p>
                  
                  <div className="flex gap-2 mt-2">
                    <Badge
                      className={
                        domain.status === 'verified'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {domain.status === 'verified' ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        'Pending'
                      )}
                    </Badge>
                    
                    <Badge
                      className={
                        domain.sslStatus === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      SSL: {domain.sslStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {domain.status !== 'verified' && (
                <Button
                  onClick={() => handleVerifyDomain(domain._id)}
                  variant="outline"
                >
                  Verify Domain
                </Button>
              )}
            </div>

            {domain.status !== 'verified' && (
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm font-medium mb-2">Add this DNS record:</p>
                <code className="text-xs bg-white p-2 rounded block">
                  Type: CNAME | Name: www | Value: {domain.cnameTarget}
                </code>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## SSL/TLS Certificate Setup

### Let's Encrypt Integration

**File: server/services/sslService.js**

```javascript
const axios = require('axios');

class SSLService {
  // Request SSL certificate from Let's Encrypt
  static async requestCertificate(domain) {
    try {
      console.log('Requesting SSL certificate for:', domain);

      // In production, use ACME client for Let's Encrypt
      // For now, simulate certificate issuance

      return {
        domain,
        certificate: 'BEGIN CERTIFICATE...',
        privateKey: 'BEGIN PRIVATE KEY...',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        issuedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to request SSL certificate:', error);
      throw error;
    }
  }

  // Renew SSL certificate (typically before expiry)
  static async renewCertificate(domain) {
    try {
      console.log('Renewing SSL certificate for:', domain);

      return this.requestCertificate(domain);
    } catch (error) {
      console.error('Failed to renew SSL certificate:', error);
      throw error;
    }
  }

  // Check certificate expiry and auto-renew if needed
  static async checkAndRenewCertificates() {
    try {
      const Domain = require('../models/Domain');
      
      // Find domains with expiring certificates (within 30 days)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const expiringDomains = await Domain.find({
        sslExpiresAt: { $lt: thirtyDaysFromNow },
        sslStatus: 'active',
      });

      for (const domain of expiringDomains) {
        console.log('Auto-renewing SSL for:', domain.name);
        
        const cert = await this.renewCertificate(domain.name);
        domain.sslExpiresAt = cert.expiresAt;
        await domain.save();
      }

      console.log(`Auto-renewed ${expiringDomains.length} SSL certificates`);
    } catch (error) {
      console.error('Failed to check and renew certificates:', error);
    }
  }
}

module.exports = SSLService;
```

---

## DNS Configuration

### DNS Records Setup

```javascript
// Helper to generate DNS records needed for verification

function generateDNSRecords(domain) {
  return [
    {
      type: 'A',
      name: '@',
      value: '1.2.3.4', // Your deployer IP
      ttl: 3600,
      description: 'A record pointing to Deployer',
    },
    {
      type: 'CNAME',
      name: 'www',
      value: `${domain.cnameTarget}`,
      ttl: 3600,
      description: 'CNAME for www subdomain',
    },
    {
      type: 'TXT',
      name: `_acme-challenge`,
      value: `${domain.verificationToken}`,
      ttl: 3600,
      description: 'SSL verification record',
    },
  ];
}
```

---

## Deployment Routing

### Route Deployments by Domain

**File: server/middleware/domainRouter.js**

```javascript
const Domain = require('../models/Domain');

async function routeByDomain(req, res, next) {
  try {
    const host = req.get('host').split(':')[0];

    // Check if this is a custom domain
    const domain = await Domain.findOne({ name: host });

    if (domain && domain.deployedVersion) {
      // Route to this deployment's assets/server
      req.deployment = domain.deployedVersion;
    }

    next();
  } catch (error) {
    console.error('Failed to route by domain:', error);
    next();
  }
}

module.exports = routeByDomain;
```

---

## Monitoring & Analytics

### Track Domain Performance

```javascript
// server/models/DomainAnalytics.js

const DomainAnalyticsSchema = new mongoose.Schema({
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  requests: {
    type: Number,
    default: 0,
  },
  uniqueVisitors: {
    type: Number,
    default: 0,
  },
  bandwidth: {
    type: Number,
    default: 0,
  },
  avgResponseTime: {
    type: Number,
    default: 0,
  },
  errorRate: {
    type: Number,
    default: 0,
  },
});
```

---

## Complete Deployment Flow with Domains

```
1. Import Repository
   ↓
2. Configure Build Settings
   ↓
3. Add Custom Domain
   ↓
4. Add DNS Records
   ↓
5. Verify Domain (DNS check)
   ↓
6. Request SSL Certificate
   ↓
7. Deploy to Domain
   ↓
8. Monitor Performance
   ↓
9. Auto-Deploy on Push
```

---

## API Routes Summary

```
GET    /api/projects/:projectId/domains
POST   /api/projects/:projectId/domains
GET    /api/projects/:projectId/domains/:domainId
DELETE /api/projects/:projectId/domains/:domainId
POST   /api/projects/:projectId/domains/:domainId/verify
POST   /api/projects/:projectId/domains/:domainId/deploy
GET    /api/projects/:projectId/domains/:domainId/analytics
```

---

## Production Deployment

For production, you'll need:

1. **DNS Provider Integration** (Cloudflare, Route53, etc.)
2. **SSL Certificate Authority** (Let's Encrypt with ACME)
3. **Load Balancer** (for routing multiple domains)
4. **CDN Integration** (for performance)
5. **Monitoring & Alerting** (uptime checks, performance metrics)


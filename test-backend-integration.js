#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * Tests all the API endpoints for Functions, Cron Jobs, Edge Handlers, and Domains
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN = process.env.TEST_TOKEN || null;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` })
  }
});

async function testEndpoint(name, method, url, data = null) {
  try {
    console.log(`Testing ${name}...`);
    const response = await api.request({
      method,
      url,
      data
    });
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    return response.data;
  } catch (error) {
    console.log(`❌ ${name}: ${error.response?.status || 'Network Error'} - ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Integration Tests\n');

  // Test Functions endpoints
  console.log('📦 Testing Functions API...');
  await testEndpoint('Get Functions', 'GET', '/functions/project/test-project-id');
  await testEndpoint('Create Function', 'POST', '/functions/project/test-project-id', {
    name: 'test-function',
    path: '/api/test',
    runtime: 'node20',
    code: 'exports.handler = async () => ({ statusCode: 200, body: "Hello" })'
  });

  // Test Cron Jobs endpoints
  console.log('\n⏰ Testing Cron Jobs API...');
  await testEndpoint('Get Cron Jobs', 'GET', '/cronjobs/project/test-project-id');
  await testEndpoint('Create Cron Job', 'POST', '/cronjobs/project/test-project-id', {
    name: 'test-cron',
    schedule: '0 0 * * *',
    target: '/api/cleanup'
  });

  // Test Edge Handlers endpoints
  console.log('\n🌐 Testing Edge Handlers API...');
  await testEndpoint('Get Edge Handlers', 'GET', '/edge-handlers');
  await testEndpoint('Create Edge Handler', 'POST', '/edge-handlers', {
    name: 'test-handler',
    pattern: '/*',
    code: 'export default function handler(request) { return new Response("Hello Edge!") }',
    type: 'request',
    regions: ['all']
  });

  // Test Domains endpoints
  console.log('\n🌍 Testing Domains API...');
  await testEndpoint('Get Domains', 'GET', '/domains/project/test-project-id');
  await testEndpoint('Create Domain', 'POST', '/domains/project/test-project-id', {
    host: 'test.example.com'
  });

  // Test DNS endpoints
  console.log('\n🔧 Testing DNS API...');
  await testEndpoint('Get DNS Records', 'GET', '/dns/records?domainId=test-domain-id');
  await testEndpoint('Create DNS Record', 'POST', '/dns/records', {
    domainId: 'test-domain-id',
    name: 'www',
    type: 'A',
    value: '192.168.1.1',
    ttl: 3600
  });

  // Test SSL endpoints
  console.log('\n🔒 Testing SSL API...');
  await testEndpoint('Get SSL Certificates', 'GET', '/ssl/certificates?domainId=test-domain-id');

  // Test Domain Redirects endpoints
  console.log('\n↩️ Testing Domain Redirects API...');
  await testEndpoint('Get Domain Redirects', 'GET', '/domains/redirects?domainId=test-domain-id');
  await testEndpoint('Create Domain Redirect', 'POST', '/domains/test-domain-id/redirects', {
    sourceUrl: '/old-page',
    destinationUrl: 'https://example.com/new-page',
    redirectType: '301',
    enabled: true
  });

  console.log('\n✨ Backend Integration Tests Complete!');
  console.log('\nNote: Some tests may fail if authentication is required or test data doesn\'t exist.');
  console.log('This is expected behavior for a comprehensive test suite.');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };
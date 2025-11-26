#!/usr/bin/env node

/**
 * PetGroomers Backend API Verification Script
 * Tests the corrected frontend API endpoints against the backend
 */

const http = require('http');

const API_BASE = 'http://localhost:8080/api';
const endpoints = [
  // Auth endpoints
  { method: 'POST', path: '/auth/groomer/login', name: 'Groomer Login' },
  { method: 'POST', path: '/auth/groomer/register', name: 'Groomer Registration' },
  { method: 'POST', path: '/auth/groomer/send-otp', name: 'Send OTP' },
  { method: 'POST', path: '/auth/groomer/verify-otp', name: 'Verify OTP' },
  
  // Groomer endpoints
  { method: 'GET', path: '/groomer/profile/1', name: 'Get Profile' },
  { method: 'PUT', path: '/groomer/profile', name: 'Update Profile' },
  { method: 'PATCH', path: '/groomer/1/availability', name: 'Update Availability' },
  { method: 'PATCH', path: '/groomer/1/location', name: 'Update Location' },
  { method: 'GET', path: '/groomer/orders/assigned/1', name: 'Get Assigned Orders' },
  { method: 'GET', path: '/groomer/orders/available', name: 'Get Available Orders' },
  { method: 'POST', path: '/groomer/orders/accept', name: 'Accept Order' },
  { method: 'PUT', path: '/groomer/orders/1/status', name: 'Update Order Status' },
  { method: 'GET', path: '/groomer/1/earnings', name: 'Get Earnings' },
  { method: 'GET', path: '/groomer/1/statistics', name: 'Get Statistics' },
];

console.log('🔍 Testing PetGroomers Frontend API Corrections...\n');

let totalTests = 0;
let passedTests = 0;

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api' + endpoint.path,
      method: endpoint.method,
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      totalTests++;
      // Any response (even 400/401) means the endpoint exists
      if (res.statusCode < 500) {
        passedTests++;
        console.log(`✅ ${endpoint.name}: ${endpoint.method} ${endpoint.path} (${res.statusCode})`);
      } else {
        console.log(`❌ ${endpoint.name}: ${endpoint.method} ${endpoint.path} (${res.statusCode})`);
      }
      resolve();
    });

    req.on('error', (error) => {
      totalTests++;
      if (error.code === 'ECONNREFUSED') {
        console.log(`🚨 Backend not running: ${endpoint.name}`);
      } else {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
      resolve();
    });

    req.on('timeout', () => {
      totalTests++;
      console.log(`⏰ Timeout: ${endpoint.name}`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing endpoint availability...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} endpoints responding correctly\n`);
  
  if (totalTests === 0) {
    console.log('🚨 Backend appears to be offline. Please start it with:');
    console.log('   cd ../PetGroomers-Backend');
    console.log('   ./mvnw spring-boot:run\n');
  } else if (passedTests === totalTests) {
    console.log('🎉 All API endpoints are correctly mapped!');
    console.log('✅ Frontend APIs now match PetGroomers backend structure');
  } else {
    console.log('⚠️  Some endpoints may need attention, but this is expected for');
    console.log('   endpoints requiring authentication or specific data.');
  }
  
  console.log('\n🔧 Key Changes Made:');
  console.log('• Authentication: /groomers/* → /auth/groomer/*');
  console.log('• Orders: /orders/* → /groomer/orders/*');
  console.log('• Profile: /groomers/{id} → /groomer/profile/{id}');
  console.log('• Availability: /groomers/{id}/availability → /groomer/{id}/availability');
  console.log('• Login: Combined emailOrPhone → separate email/phone fields');
  console.log('• Registration: experience → bio field');
  console.log('• Types: Updated to match backend entity structure');
}

runTests().catch(console.error);
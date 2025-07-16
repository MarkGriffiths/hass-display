const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Add body parsing middleware for JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a proxy for Home Assistant requests to bypass CORS
app.use('/api/proxy', (req, res) => {
  // Use HTTP instead of HTTPS to avoid SSL issues
  const haUrl = process.env.HA_URL || 'http://10.0.0.127:8123';
  const targetUrl = haUrl + req.url.replace('/api/proxy', '');
  
  console.log(`Proxying request to: ${targetUrl}`);
  
  const options = new URL(targetUrl);
  
  // Copy all headers from the original request
  options.headers = {
    ...req.headers,
    'host': options.host, // Override host header with the target host
  };
  
  // Remove problematic headers that might cause issues
  delete options.headers['origin'];
  delete options.headers['referer'];
  delete options.headers['sec-fetch-site'];
  delete options.headers['sec-fetch-mode'];
  delete options.headers['sec-fetch-dest'];
  
  // Add authorization if it exists in the original request
  if (req.headers.authorization) {
    options.headers['Authorization'] = req.headers.authorization;
  }
  
  // For Home Assistant, we might need to add the auth token in a different format
  if (req.headers['ha-auth']) {
    options.headers['Authorization'] = 'Bearer ' + req.headers['ha-auth'];
  }
  
  // Set request options
  const requestOptions = {
    method: req.method,
    headers: options.headers,
    // Accept self-signed certificates
    rejectUnauthorized: false,
    // Add a timeout
    timeout: 30000 // Increased timeout for Home Assistant API
  };
  
  // Log the request details
  console.log(`Proxy request: ${req.method} ${targetUrl}`);
  console.log(`Headers: ${JSON.stringify(options.headers, null, 2)}`);
  
  
  const protocol = options.protocol === 'https:' ? https : http;
  
  try {
    const proxyReq = protocol.request(options, (proxyRes) => {
      // Log response status
      console.log(`Proxy response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
      
      // Forward status and headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe the response data
      proxyRes.pipe(res, { end: true });
    });
    
    // Handle request errors
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.status(500).json({
        error: 'Proxy error',
        message: err.message,
        code: err.code
      });
    });
    
    // Handle request timeout
    proxyReq.on('timeout', () => {
      console.error('Proxy request timed out');
      proxyReq.destroy();
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'Request to Home Assistant timed out'
      });
    });
    
    // Forward the request body if it exists
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.write(bodyData);
      console.log(`Forwarding request body: ${bodyData}`);
    }
    
    // End the request
    proxyReq.end();
  } catch (error) {
    console.error('Error creating proxy request:', error);
    res.status(500).json({
      error: 'Proxy setup error',
      message: error.message
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to provide environment variables to the frontend
app.get('/api/env-config', (req, res) => {
  res.json({
    haUrl: process.env.HA_URL || 'http://10.0.0.127:8123',
    accessToken: process.env.HA_ACCESS_TOKEN || '',
    entities: {
      temperature: process.env.ENTITY_TEMP_MAIN || '',
      humidity: process.env.ENTITY_HUMIDITY || '',
      pressure: process.env.ENTITY_PRESSURE || '',
      temperatureSecondary: process.env.ENTITY_TEMP_SECONDARY || ''
    }
  });
});

// Test endpoint for the secondary temperature gauge
app.get('/api/test-secondary', (req, res) => {
  console.log('Testing secondary temperature gauge');
  res.json({ success: true, message: 'Secondary temperature test initiated' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  console.log(`CORS proxy enabled for Home Assistant connections`);
});

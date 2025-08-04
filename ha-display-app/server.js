const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const zlib = require('zlib');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add CORS headers and disable caching for development
app.use((req, res, next) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Disable caching for development
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Add body parsing middleware for JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a proxy for Home Assistant API requests to avoid CORS issues
app.use('/api/proxy', (req, res) => {
  try {
    // Get the target URL from the request
    const targetUrl = new URL(req.url, process.env.HA_URL);
    
    // Replace /api/proxy with /api to preserve the API path structure
    targetUrl.pathname = targetUrl.pathname.replace('/api/proxy', '/api');
    
    // Set up headers for the proxy request
    const headers = {};
    
    // Copy selected headers from the original request
    ['accept', 'content-type', 'content-length', 'accept-encoding', 'cookie'].forEach(header => {
      if (req.headers[header]) {
        headers[header] = req.headers[header];
      }
    });
    
    // Add authorization header if ha-auth is provided
    if (req.headers['ha-auth']) {
      headers['Authorization'] = `Bearer ${req.headers['ha-auth']}`;
    }
    
    // Create the proxy request
    const proxyReq = (targetUrl.protocol === 'https:' ? https : http).request(targetUrl, {
      method: req.method,
      headers: headers,
      rejectUnauthorized: false,
      timeout: 30000
    }, (proxyRes) => {
      // Special handling for history API responses
      if (req.url.includes('/history/period')) {
        // Check if response is compressed
        const isCompressed = proxyRes.headers['content-encoding'] === 'gzip' || 
                            proxyRes.headers['content-encoding'] === 'deflate';
        
        // Collect response chunks
        const chunks = [];
        proxyRes.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        proxyRes.on('end', () => {
          try {
            // Combine chunks into a single buffer
            const buffer = Buffer.concat(chunks);
            
            // Decompress if needed
            let processedData;
            if (isCompressed && proxyRes.headers['content-encoding'] === 'deflate') {
              processedData = zlib.inflateSync(buffer);
            } else if (isCompressed && proxyRes.headers['content-encoding'] === 'gzip') {
              processedData = zlib.gunzipSync(buffer);
            } else {
              processedData = buffer;
            }
            
            // Convert buffer to string
            const responseData = processedData.toString('utf8');
            
            // Parse and stringify to ensure valid JSON
            const jsonData = JSON.parse(responseData);
            const cleanData = JSON.stringify(jsonData);
            
            // Send the response to the client with clean headers
            res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(cleanData);
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error processing history API response: ' + error.message }));
          }
        });
      } else {
        // Forward status and headers
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        // Forward the response data
        proxyRes.pipe(res);
      }
    });
    
    // Handle request errors
    proxyReq.on('error', (err) => {
      res.status(500).json({
        error: 'Proxy error',
        message: err.message
      });
    });
    
    // Handle request timeout
    proxyReq.on('timeout', () => {
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
    }
    
    // End the request
    proxyReq.end();
    
  } catch (error) {
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
    secondaryName: process.env.SECONDARY_NAME || 'Indoor',
    tertiaryName: process.env.TERTIARY_NAME || 'Office',
    entities: {
      temperature: process.env.ENTITY_TEMP_MAIN || '',
      temperatureTrend: process.env.ENTITY_TEMP_MAIN_TREND || '',
      humidity: process.env.ENTITY_HUMIDITY || '',
      pressure: process.env.ENTITY_PRESSURE || '',
      pressureTrend: process.env.ENTITY_PRESSURE_TREND || '',
      temperatureSecondary: process.env.ENTITY_TEMP_SECONDARY || '',
      temperatureSecondaryTrend: process.env.ENTITY_TEMP_SECONDARY_TREND || '',
      humiditySecondary: process.env.ENTITY_HUMIDITY_SECONDARY || '',
      co2Secondary: process.env.ENTITY_CO2_SECONDARY || '',
      temperatureTertiary: process.env.ENTITY_TEMP_TERTIARY || '',
      temperatureTertiaryTrend: process.env.ENTITY_TEMP_TERTIARY_TREND || '',
      humidityTertiary: process.env.ENTITY_HUMIDITY_TERTIARY || '',
      co2Tertiary: process.env.ENTITY_CO2_TERTIARY || '',
      weather: process.env.ENTITY_WEATHER || '',
      sun: process.env.ENTITY_SUN || '',
      rain: process.env.ENTITY_RAIN || '',
      rainLastHour: process.env.ENTITY_RAIN_LAST_HOUR || '',
      rainToday: process.env.ENTITY_RAIN_TODAY || '',
      windAngle: process.env.ENTITY_WIND_ANGLE || '',
      windSpeed: process.env.ENTITY_WIND_SPEED || '',
      gustAngle: process.env.ENTITY_GUST_ANGLE || '',
      gustSpeed: process.env.ENTITY_GUST_SPEED || ''
    }
  });
});

// Test endpoint for the secondary temperature gauge
app.get('/api/test-secondary', (req, res) => {
  res.json({ success: true, message: 'Secondary temperature test initiated' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Home Assistant proxy enabled`);
});

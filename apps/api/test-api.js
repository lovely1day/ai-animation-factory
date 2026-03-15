// Test script for API
const http = require('http');

const data = JSON.stringify({
  genre: 'comedy',
  targetAudience: 'children'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/episodes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  console.log('\n⚠️  الـ Server لا يعمل!');
  console.log('شغله يدوياً بـ: npm run dev');
});

req.write(data);
req.end();

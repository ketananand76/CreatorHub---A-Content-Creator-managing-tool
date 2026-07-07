const http = require('http');

const data = JSON.stringify({ email: 'ketanpaswan53@gmail.com' });

const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/auth/forgot-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(data);
req.end();

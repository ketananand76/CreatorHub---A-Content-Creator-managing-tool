const https = require('https');
https.get('https://www.instagram.com/forever_withyou_7/', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/<meta property="og:description" content="(.*?)"/);
    console.log(match ? match[1] : 'Not found');
  });
});

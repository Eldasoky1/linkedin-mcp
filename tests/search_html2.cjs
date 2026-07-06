const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf-8');
const lines = html.split('\n');
for(let line of lines) {
  if (line.includes('Edit profile') || line.includes('Edit intro') || line.includes('Edit"')) {
    console.log(line.substring(Math.max(0, line.indexOf('Edit') - 50), line.indexOf('Edit') + 150));
  }
}

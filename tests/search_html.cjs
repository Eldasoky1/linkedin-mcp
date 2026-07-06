const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf-8');
const matches = html.match(/aria-label="[^"]*edit[^"]*"/gi);
console.log(matches ? Array.from(new Set(matches)) : 'None');
const buttons = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
console.log("Buttons with edit:", buttons.filter(b => b.toLowerCase().includes('edit')).map(b => b.substring(0, 100)));
const links = html.match(/<a[^>]*>.*?<\/a>/gi) || [];
console.log("Links with edit:", links.filter(l => l.toLowerCase().includes('edit')).map(l => l.substring(0, 100)));

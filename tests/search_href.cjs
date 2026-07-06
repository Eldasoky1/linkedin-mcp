const fs = require('fs');
const html = fs.readFileSync('page.html', 'utf-8');
const links = html.match(/<a[^>]*href="[^"]*edit[^"]*"[^>]*>/gi) || [];
console.log("Links with edit href:", links);
const svgPencils = html.match(/<svg[^>]*data-test-icon="pencil-medium"[^>]*>.*?<\/svg>/gi) || [];
console.log("SVGs with pencil:", svgPencils.length);
// Get parents of SVGs
const svgParentMatches = html.match(/<[^>]+>[^<]*<svg[^>]*data-test-icon="pencil-medium"[^>]*>.*?<\/svg>[^<]*<\/[^>]+>/gi) || [];
console.log("SVG parents:", svgParentMatches.map(m => m.substring(0, 150)));

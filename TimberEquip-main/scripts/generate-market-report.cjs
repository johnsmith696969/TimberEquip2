/**
 * Generate Monthly Equipment Market Analytics Report
 * Creates a draft blog post in the CMS with marketplace data insights.
 * Run: node scripts/generate-market-report.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

const SA_PATH = process.env.SA_KEY_PATH || path.resolve('D:/Downloads/mobile-app-equipment-sales-eab5690d7743.json');
const sa = require(SA_PATH);

const app = admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = app.firestore('ai-studio-206e8e62-feaa-4921-875f-79ff275fa93c');

const fmt = (n) => n.toLocaleString('en-US');
const fmtPrice = (n) => n > 0 ? '$' + n.toLocaleString('en-US') : 'N/A';

async function generateReport() {
  const listingsSnap = await db.collection('listings').get();
  const listings = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.status === 'active' || !l.status);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Build category metrics
  const categoryMetrics = {};
  for (const listing of listings) {
    const cat = listing.category || 'Uncategorized';
    if (!categoryMetrics[cat]) {
      categoryMetrics[cat] = { count: 0, totalPrice: 0, minPrice: Infinity, maxPrice: 0, conditions: {}, subcategories: {}, manufacturers: {}, states: {} };
    }
    const m = categoryMetrics[cat];
    m.count++;
    const price = Number(listing.price) || 0;
    if (price > 0) { m.totalPrice += price; if (price < m.minPrice) m.minPrice = price; if (price > m.maxPrice) m.maxPrice = price; }
    const cond = listing.condition || 'Unspecified'; m.conditions[cond] = (m.conditions[cond] || 0) + 1;
    const sub = listing.subcategory || ''; if (sub) m.subcategories[sub] = (m.subcategories[sub] || 0) + 1;
    const mfg = listing.manufacturer || listing.make || ''; if (mfg) m.manufacturers[mfg] = (m.manufacturers[mfg] || 0) + 1;
    const st = listing.state || ''; if (st) m.states[st] = (m.states[st] || 0) + 1;
  }

  for (const m of Object.values(categoryMetrics)) {
    m.avgPrice = m.count > 0 ? Math.round(m.totalPrice / m.count) : 0;
    if (m.minPrice === Infinity) m.minPrice = 0;
  }

  const totalListings = listings.length;
  const totalCategories = Object.keys(categoryMetrics).length;

  // Generate report HTML
  let html = '';

  html += `<h2>Executive Summary</h2>`;
  html += `<p>The ${monthName} ${year} Forestry Equipment Sales Market Report provides a data-driven snapshot of the current state of the logging and forestry equipment marketplace. This month, Forestry Equipment Sales is tracking <strong>${fmt(totalListings)} active listing${totalListings !== 1 ? 's' : ''}</strong> across <strong>${fmt(totalCategories)} equipment categor${totalCategories !== 1 ? 'ies' : 'y'}</strong>.</p>`;
  html += `<p><em>Note: This report reflects marketplace activity on Forestry Equipment Sales and does not represent the entire forestry equipment market. Readers should consider multiple data sources when evaluating market conditions and form their own conclusions about market sentiment.</em></p>`;

  html += `<h2>Market Overview</h2>`;
  if (totalListings === 0) {
    html += `<p>The marketplace is in its early stages with inventory being onboarded. As dealer and seller participation grows, this section will include month-over-month supply trends, average market values, and demand indicators.</p>`;
  } else {
    const allPrices = listings.filter(l => Number(l.price) > 0).map(l => Number(l.price));
    if (allPrices.length > 0) {
      const overallAvg = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);
      html += `<p>The average listing price across all categories is <strong>${fmtPrice(overallAvg)}</strong>, with prices ranging from ${fmtPrice(Math.min(...allPrices))} to ${fmtPrice(Math.max(...allPrices))}.</p>`;
    } else {
      html += `<p>Pricing data is being collected as new inventory is listed.</p>`;
    }
  }

  html += `<h2>Category Breakdown</h2>`;
  const sorted = Object.entries(categoryMetrics).sort((a, b) => b[1].count - a[1].count);

  if (sorted.length === 0) {
    html += `<p>Category-level analytics will populate as inventory is added. Check back next month for detailed category insights.</p>`;
  }

  for (const [cat, m] of sorted) {
    html += `<h3>${cat}</h3>`;
    html += `<p><strong>${fmt(m.count)} active listing${m.count !== 1 ? 's' : ''}</strong>`;
    if (m.avgPrice > 0) html += ` | Average Market Value: <strong>${fmtPrice(m.avgPrice)}</strong> | Range: ${fmtPrice(m.minPrice)} – ${fmtPrice(m.maxPrice)}`;
    html += `</p>`;

    const subs = Object.entries(m.subcategories).sort((a, b) => b[1] - a[1]);
    if (subs.length > 0) html += `<p><strong>Subcategories:</strong> ${subs.map(([n, c]) => `${n} (${c})`).join(', ')}</p>`;

    const mfgs = Object.entries(m.manufacturers).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (mfgs.length > 0) html += `<p><strong>Top Manufacturers:</strong> ${mfgs.map(([n, c]) => `${n} (${c})`).join(', ')}</p>`;

    const states = Object.entries(m.states).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (states.length > 0) html += `<p><strong>Top Markets:</strong> ${states.map(([n, c]) => `${n} (${c})`).join(', ')}</p>`;

    html += `<p>`;
    if (m.count >= 10) html += `The ${cat} market shows healthy inventory levels. `;
    else if (m.count >= 3) html += `The ${cat} segment has moderate inventory available. `;
    else html += `The ${cat} segment currently has limited inventory on the platform. `;

    const usedCount = m.conditions['Used'] || 0;
    const newCount = m.conditions['New'] || 0;
    if (usedCount > 0 && newCount > 0) html += `The mix includes both new (${newCount}) and used (${usedCount}) equipment. `;
    else if (usedCount > 0) html += `Current inventory is primarily pre-owned equipment. `;

    html += `It is interesting to observe these trends, though they reflect only the inventory currently listed on Forestry Equipment Sales and may not fully represent broader market dynamics.</p>`;
  }

  html += `<h2>What to Watch</h2>`;
  html += `<ul>`;
  html += `<li><strong>Supply Trends:</strong> Monitor month-over-month listing volume changes for early indicators of market shifts.</li>`;
  html += `<li><strong>Average Market Values:</strong> Track AMV trends by category to spot appreciation or depreciation patterns.</li>`;
  html += `<li><strong>Geographic Demand:</strong> Regional inventory concentration can indicate where operational demand is strongest.</li>`;
  html += `<li><strong>Manufacturer Mix:</strong> Changes in brand representation may reflect production cycles or fleet turnover patterns.</li>`;
  html += `</ul>`;

  html += `<h2>Methodology & Disclaimer</h2>`;
  html += `<p>This report is generated from active listing data on Forestry Equipment Sales as of ${dateStr}. Market values, supply indicators, and trend observations are based solely on listings available through our platform. This data does not necessarily determine or reflect the overall logging equipment market. Readers are encouraged to consider multiple sources, consult industry professionals, and come to their own conclusions regarding market sentiment and equipment valuation.</p>`;
  html += `<p>For questions about this report or to discuss equipment market conditions, <a href="/contact">contact our team</a> or call (218) 720-0933.</p>`;

  // Save as draft blog post
  const postTitle = `Logging Equipment Market Insights — ${monthName} ${year}`;
  const postSlug = `logging-equipment-market-insights-${monthName.toLowerCase()}-${year}`;
  const postExcerpt = `Monthly market analytics report covering supply trends, average market values, and category breakdowns across the forestry equipment marketplace for ${monthName} ${year}.`;

  const postRef = db.collection('blogPosts').doc();
  await postRef.set({
    title: postTitle,
    seoTitle: `${postTitle} | Forestry Equipment Sales`,
    seoDescription: postExcerpt,
    seoSlug: postSlug,
    seoKeywords: ['logging equipment market', 'forestry equipment prices', 'equipment market report', 'timber industry', `${monthName.toLowerCase()} ${year}`],
    excerpt: postExcerpt,
    summary: postExcerpt,
    content: html,
    category: 'Market Analytics',
    tags: ['Market Report', 'Analytics', 'Equipment Prices', 'Industry Trends'],
    authorName: 'Forestry Equipment Sales',
    image: '',
    status: 'draft',
    reviewStatus: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    publishedAt: null,
    scheduledAt: null,
  });

  console.log('=== Market Report Created ===');
  console.log('Post ID:', postRef.id);
  console.log('Title:', postTitle);
  console.log('Status: draft (pending admin review)');
  console.log('Slug:', postSlug);
  console.log('Content length:', html.length, 'chars');
  console.log('Categories analyzed:', totalCategories);
  console.log('Listings analyzed:', totalListings);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Go to /admin?tab=content');
  console.log('  2. Find the draft post in the CMS editor');
  console.log('  3. Review, edit, add a cover image, then approve');
}

generateReport().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

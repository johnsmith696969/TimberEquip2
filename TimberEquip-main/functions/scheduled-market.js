/**
 * Market analytics scheduled jobs: nightly data refresh and weekly market pulse.
 * Extracted from index.js for modularity.
 */
'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { getDb, normalizeMarketplaceText } = require('./shared.js');

// ── Nightly Data Refresh (2AM CST) ─────────────────────────────────────────

exports.nightlyDataRefresh = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'America/Chicago',
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = getDb();
    const listingsSnap = await db.collection('listings')
      .where('status', '==', 'active')
      .where('approvalStatus', '==', 'approved')
      .get();

    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    let totalMarketValue = 0;
    const subcategoryAggregates = {};

    for (const listing of listings) {
      const price = parseFloat(listing.price) || 0;
      totalMarketValue += price;

      const make = normalizeMarketplaceText(listing.make || listing.manufacturer || '');
      const model = normalizeMarketplaceText(listing.model || '');
      const year = parseInt(listing.year, 10) || 0;
      const hours = parseFloat(listing.hours || (listing.specs && listing.specs.hours) || 0) || 0;
      const subcategory = normalizeMarketplaceText(listing.subcategory || listing.category || 'other');

      if (!subcategoryAggregates[subcategory]) {
        subcategoryAggregates[subcategory] = { totalPrice: 0, count: 0 };
      }
      subcategoryAggregates[subcategory].totalPrice += price;
      subcategoryAggregates[subcategory].count += 1;

      // Compute AMV: same make+model, +/-10% price, +/-10% hours, +/-2 years
      const comparables = listings.filter((comp) => {
        if (comp.id === listing.id) return false;
        if (normalizeMarketplaceText(comp.make || comp.manufacturer || '') !== make) return false;
        if (normalizeMarketplaceText(comp.model || '') !== model) return false;
        const compPrice = parseFloat(comp.price) || 0;
        const compYear = parseInt(comp.year, 10) || 0;
        const compHours = parseFloat(comp.hours || (comp.specs && comp.specs.hours) || 0) || 0;
        if (price > 0 && Math.abs(compPrice - price) > price * 0.10) return false;
        if (Math.abs(compYear - year) > 2) return false;
        if (hours > 0 && compHours > 0 && Math.abs(compHours - hours) > hours * 0.10) return false;
        return true;
      });

      if (comparables.length >= 1) {
        const amvValue = comparables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) / comparables.length;
        const roundedAmv = Math.round(amvValue);
        await db.collection('listings').doc(listing.id).update({
          computedAmv: roundedAmv,
          marketValueEstimate: roundedAmv,
          amvComparableCount: comparables.length,
          amvComputedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    const statsRef = db.collection('system').doc('stats');
    const prevSnap = await statsRef.get();
    const prevData = prevSnap.exists ? prevSnap.data() : {};

    const subcategoryStats = {};
    for (const [key, agg] of Object.entries(subcategoryAggregates)) {
      subcategoryStats[key] = {
        avgPrice: agg.count > 0 ? Math.round(agg.totalPrice / agg.count) : 0,
        supplyCount: agg.count,
      };
    }

    await statsRef.set({
      totalActiveListings: listings.length,
      totalMarketValue: Math.round(totalMarketValue),
      previousDayTotalMarketValue: prevData.totalMarketValue || 0,
      previousDayTotalActiveListings: prevData.totalActiveListings || 0,
      subcategoryStats,
      dataRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Nightly refresh: ${listings.length} listings, $${Math.round(totalMarketValue)} total value.`);
  },
);

// ── Weekly Market Pulse (Monday 3AM CST) ────────────────────────────────────

exports.weeklyMarketPulse = onSchedule(
  {
    schedule: '0 3 * * 1',
    timeZone: 'America/Chicago',
    region: 'us-central1',
    memory: '256MiB',
  },
  async () => {
    const db = getDb();
    const listingsSnap = await db.collection('listings')
      .where('status', '==', 'active')
      .where('approvalStatus', '==', 'approved')
      .get();

    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const pulseRef = db.collection('system').doc('marketPulse');
    const prevPulse = await pulseRef.get();
    const prevSubcategoryPulse = prevPulse.exists ? (prevPulse.data().subcategoryPulse || {}) : {};

    const subcategoryPulse = {};
    for (const listing of listings) {
      const price = parseFloat(listing.price) || 0;
      const key = normalizeMarketplaceText(listing.subcategory || listing.category || 'other');
      if (!subcategoryPulse[key]) subcategoryPulse[key] = { totalPrice: 0, count: 0 };
      subcategoryPulse[key].totalPrice += price;
      subcategoryPulse[key].count += 1;
    }

    const pulseData = {};
    for (const [key, agg] of Object.entries(subcategoryPulse)) {
      const avgPrice = agg.count > 0 ? Math.round(agg.totalPrice / agg.count) : 0;
      const prevAvg = prevSubcategoryPulse[key]?.avgPrice || 0;
      const prevCount = prevSubcategoryPulse[key]?.supplyCount || 0;
      const priceChangePct = prevAvg > 0 ? parseFloat(((avgPrice - prevAvg) / prevAvg * 100).toFixed(1)) : 0;
      const supplyChangePct = prevCount > 0 ? parseFloat(((agg.count - prevCount) / prevCount * 100).toFixed(1)) : 0;

      pulseData[key] = { avgPrice, supplyCount: agg.count, priceChangePct, supplyChangePct };
    }

    await pulseRef.set({
      subcategoryPulse: pulseData,
      totalListings: listings.length,
      pulseGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`Weekly market pulse: ${Object.keys(pulseData).length} subcategories analyzed.`);
  },
);

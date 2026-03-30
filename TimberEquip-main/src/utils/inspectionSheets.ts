import type { InspectionRequest, Listing } from '../types';

function safeLine(value: unknown, fallback = 'N/A'): string {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function safeFileSegment(value: unknown, fallback: string): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

export function buildInspectionSheetFileName(request: Partial<InspectionRequest>, listing?: Partial<Listing> | null): string {
  const listingSegment = safeFileSegment(request.listingId || listing?.id, 'inspection');
  const modelSegment = safeFileSegment(request.listingTitle || request.equipment || listing?.title, 'sheet');
  return `${listingSegment}-${modelSegment}-inspection-sheet.txt`;
}

export function buildInspectionSheetText(request: Partial<InspectionRequest>, listing?: Partial<Listing> | null): string {
  const title = safeLine(request.listingTitle || request.equipment || listing?.title, 'Equipment Inspection');
  const location = safeLine(request.inspectionLocation || listing?.location);
  const manufacturer = safeLine(listing?.manufacturer || listing?.make);
  const model = safeLine(listing?.model);
  const year = safeLine(listing?.year);
  const hours = safeLine(listing?.hours);
  const reference = safeLine(request.listingId || request.reference || listing?.id);
  const sellerName = safeLine(request.matchedDealerName || listing?.sellerName || listing?.sellerId);
  const specLines = Object.entries(listing?.specs || {})
    .filter(([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '')
    .slice(0, 18)
    .map(([key, value]) => {
      const label = key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return `- ${label}: ${Array.isArray(value) ? value.join(', ') : value}`;
    });

  return [
    'FORESTRY EQUIPMENT SALES',
    'EQUIPMENT-SPECIFIC INSPECTION SHEET',
    '',
    `Machine: ${title}`,
    `Listing ID: ${reference}`,
    `Manufacturer: ${manufacturer}`,
    `Model: ${model}`,
    `Year: ${year}`,
    `Hours: ${hours}`,
    `Inspection Location: ${location}`,
    `Recommended Dealer / Inspector: ${sellerName}`,
    `Requested Timeline: ${safeLine(request.timeline, 'Flexible')}`,
    specLines.length > 0 ? '' : null,
    specLines.length > 0 ? 'LISTING SPECIFICATIONS' : null,
    ...specLines,
    '',
    'REQUEST CONTEXT',
    `Requester: ${safeLine(request.requesterName, 'Pending')}`,
    `Requester Company: ${safeLine(request.requesterCompany, 'Not provided')}`,
    `Requester Email: ${safeLine(request.requesterEmail, 'Not provided')}`,
    `Requester Phone: ${safeLine(request.requesterPhone, 'Not provided')}`,
    '',
    'INSPECTOR DETAILS',
    'Inspector Name:',
    'Inspection Date:',
    'Inspection Start Time:',
    'Inspection End Time:',
    '',
    'IDENTITY CHECK',
    '- Listing ID / serial plate photographed',
    '- Hour meter photographed',
    '- Year / make / model confirmed against listing',
    '',
    'STRUCTURE / CONDITION',
    '- Frame / undercarriage reviewed',
    '- Cab / guards / glass reviewed',
    '- Boom / grapple / attachments reviewed',
    '- Tires / tracks / rollers reviewed',
    '',
    'POWERTRAIN / HYDRAULICS',
    '- Engine cold start observed',
    '- Idle / smoke / leaks checked',
    '- Hydraulic functions checked',
    '- Drive / transmission / final drives checked',
    '',
    'FUNCTION TEST',
    '- Machine moved under power',
    '- Primary functions cycled',
    '- Safety systems confirmed',
    '- Fault lights / codes recorded',
    '',
    'PHOTOS / MEDIA',
    '- Walkaround photos attached',
    '- Serial / meter photos attached',
    '- Video clips attached if needed',
    '',
    'INSPECTOR NOTES',
    safeLine(request.notes, 'No requester notes provided.'),
    '',
    'FINAL DISPOSITION',
    '- Ready for buyer review',
    '- Additional photos / data required',
    '- Repair or service recommended before sale',
    '',
    'OVERALL CONDITION SUMMARY',
    '',
    'SIGN-OFF',
    'Inspector Signature:',
    'Date:',
    '',
  ].filter((line): line is string => line !== null).join('\n');
}

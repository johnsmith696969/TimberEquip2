import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardCheck, FileDown, LoaderCircle, Mail, MapPin, Phone, Printer, ShieldCheck, Truck } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useAuth } from '../components/AuthContext';
import { equipmentService } from '../services/equipmentService';
import { userService } from '../services/userService';
import type { Listing } from '../types';
import { buildInspectionSheetFileName, buildInspectionSheetText } from '../utils/inspectionSheets';
import { buildListingPath } from '../utils/listingPath';

const SUPPORT_EMAIL = 'support@timberequip.com';

type InspectionDealer = {
  uid: string;
  name: string;
  storefrontName?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  role?: string;
  location: string;
  storefrontSlug?: string;
  distanceMiles?: number | null;
};

type ClosestDealerResponse = {
  listing?: {
    id: string;
    title: string;
    stockNumber?: string;
    location?: string;
    url?: string;
  } | null;
  targetLocation?: string;
  recommendedDealer?: InspectionDealer | null;
  alternatives?: InspectionDealer[];
  geocodingConfigured?: boolean;
  matchType?: 'distance' | 'location-fallback' | 'none';
  error?: string;
};

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openMailto(subject: string, body: string) {
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function formatDistance(distanceMiles?: number | null) {
  if (typeof distanceMiles !== 'number' || !Number.isFinite(distanceMiles)) return 'Location match';
  return `${Math.round(distanceMiles)} miles away`;
}

export function Inspections() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedListingId = String(searchParams.get('listingId') || searchParams.get('id') || '').trim();
  const canJoinInspectionNetwork = ['dealer', 'pro_dealer', 'admin', 'super_admin', 'developer'].includes(String(user?.role || '').trim().toLowerCase());
  const [requestForm, setRequestForm] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    equipment: '',
    stockNumber: '',
    inspectionLocation: '',
    timeline: '',
    notes: '',
  });
  const [dealerMatch, setDealerMatch] = useState<ClosestDealerResponse | null>(null);
  const [findingDealer, setFindingDealer] = useState(false);
  const [dealerLookupError, setDealerLookupError] = useState('');
  const [requestSubmitError, setRequestSubmitError] = useState('');
  const [requestSubmitNotice, setRequestSubmitNotice] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [prefilledListing, setPrefilledListing] = useState<Listing | null>(null);
  const [prefilledListingError, setPrefilledListingError] = useState('');
  const [partnerForm, setPartnerForm] = useState({
    company: '',
    contactName: '',
    email: '',
    phone: '',
    territory: '',
    certifications: '',
    equipmentFocus: '',
    notes: '',
  });
  const [partnerSubmitError, setPartnerSubmitError] = useState('');
  const [partnerSubmitNotice, setPartnerSubmitNotice] = useState('');
  const [submittingPartnerRequest, setSubmittingPartnerRequest] = useState(false);

  const requestChecklist = `FORESTRY EQUIPMENT SALES INSPECTION CHECKLIST

Machine Reference:
Stock Number:
Seller / Storefront:
Inspection Location:
Inspector Name:
Inspection Date:

IDENTITY
- Serial plate photographed
- Hour meter photographed
- Model and year confirmed

STRUCTURE
- Frame condition reviewed
- Boom / grapple / head condition reviewed
- Guards and panels reviewed

POWERTRAIN
- Engine start and idle checked
- Hydraulics reviewed for leaks
- Transmission / travel checked

FUNCTION TEST
- Machine moved under power
- Main functions cycled
- Safety systems checked

NOTES


FINAL DISPOSITION
- Ready for buyer review
- Additional photos required
- Service or repair recommended
`;

  const partnerPacket = `FORESTRY EQUIPMENT SALES INSPECTION PARTNER INTAKE

Company:
Primary Contact:
Email:
Phone:
Territory:
Certifications / Licenses:
Equipment Focus:
Current Capacity:
Travel Radius:
Notes:
`;

  const lookupClosestDealer = async () => {
    setFindingDealer(true);
    setDealerLookupError('');
    setRequestSubmitError('');

    try {
      const response = await fetch('/api/inspections/closest-dealer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: prefilledListing?.id || '',
          reference: requestForm.stockNumber,
          inspectionLocation: requestForm.inspectionLocation,
        }),
      });

      const payload = (await response.json()) as ClosestDealerResponse;
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to match a nearby inspection dealer yet.');
      }

      setDealerMatch(payload);
      setRequestForm((prev) => ({
        ...prev,
        equipment: prev.equipment || payload.listing?.title || prev.equipment,
        stockNumber: prev.stockNumber || payload.listing?.stockNumber || prev.stockNumber,
        inspectionLocation: prev.inspectionLocation || payload.targetLocation || prev.inspectionLocation,
      }));
    } catch (error) {
      setDealerMatch(null);
      setDealerLookupError(error instanceof Error ? error.message : 'Unable to match a nearby inspection dealer yet.');
    } finally {
      setFindingDealer(false);
    }
  };

  const submitRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setRequestSubmitError('');
    setRequestSubmitNotice('');
    setSubmittingRequest(true);

    void (async () => {
      try {
        const requestId = await equipmentService.createInspectionRequest({
          listingId: dealerMatch?.listing?.id || prefilledListing?.id,
          listingTitle: dealerMatch?.listing?.title || prefilledListing?.title || requestForm.equipment,
          listingUrl: dealerMatch?.listing?.url || (prefilledListing ? `https://timberequip.com${buildListingPath(prefilledListing)}` : ''),
          reference: prefilledListing?.id || requestForm.stockNumber,
          requesterName: requestForm.contactName,
          requesterEmail: requestForm.email,
          requesterPhone: requestForm.phone,
          requesterCompany: requestForm.company,
          equipment: requestForm.equipment,
          inspectionLocation: requestForm.inspectionLocation,
          timeline: requestForm.timeline,
          notes: requestForm.notes,
          matchedDealerUid: dealerMatch?.recommendedDealer?.uid || null,
          matchedDealerName: dealerMatch?.recommendedDealer?.name || '',
          matchedDealerLocation: dealerMatch?.recommendedDealer?.location || '',
          matchedDealerDistanceMiles: dealerMatch?.recommendedDealer?.distanceMiles ?? null,
          assignedToUid: dealerMatch?.recommendedDealer?.uid || null,
          assignedToName: dealerMatch?.recommendedDealer?.name || null,
        });

        if (!requestId) {
          throw new Error('Inspection request could not be created.');
        }

        setRequestSubmitNotice(`Inspection request ${requestId.toUpperCase()} was submitted and routed to the inspection desk.`);
        setRequestForm({
          company: user?.company || '',
          contactName: user?.displayName || '',
          email: user?.email || '',
          phone: user?.phoneNumber || '',
          equipment: '',
          stockNumber: '',
          inspectionLocation: '',
          timeline: '',
          notes: '',
        });
        setDealerMatch(null);
      } catch (error) {
        setRequestSubmitError(error instanceof Error ? error.message : 'Unable to submit inspection request right now.');
      } finally {
        setSubmittingRequest(false);
      }
    })();
  };

  React.useEffect(() => {
    if (!user) return;
    setRequestForm((prev) => ({
      ...prev,
      company: prev.company || user.company || '',
      contactName: prev.contactName || user.displayName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phoneNumber || '',
    }));
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    setPartnerForm((prev) => ({
      company: prev.company || user.company || '',
      contactName: prev.contactName || user.displayName || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phoneNumber || '',
      territory: prev.territory || user.inspectionCoverageTerritory || user.location || '',
      certifications: prev.certifications || user.inspectionCertifications || '',
      equipmentFocus: prev.equipmentFocus || user.inspectionEquipmentFocus || '',
      notes: prev.notes || user.inspectionCoverageNotes || '',
    }));
  }, [user]);

  useEffect(() => {
    if (!requestedListingId) {
      setPrefilledListing(null);
      setPrefilledListingError('');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const nextListing = await equipmentService.getListing(requestedListingId);
        if (!nextListing || cancelled) {
          if (!cancelled) {
            setPrefilledListing(null);
            setPrefilledListingError('The linked machine could not be loaded for inspection prefill.');
          }
          return;
        }

        setPrefilledListing(nextListing);
        setPrefilledListingError('');
        setRequestForm((prev) => ({
          ...prev,
          equipment: prev.equipment || nextListing.title || '',
          stockNumber: prev.stockNumber || nextListing.id || '',
          inspectionLocation: prev.inspectionLocation || nextListing.location || '',
        }));
      } catch (error) {
        if (!cancelled) {
          setPrefilledListing(null);
          setPrefilledListingError(error instanceof Error ? error.message : 'Unable to prefill the inspection request.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestedListingId]);

  const downloadMachineInspectionSheet = () => {
    const content = buildInspectionSheetText({
      listingId: prefilledListing?.id,
      listingTitle: prefilledListing?.title || requestForm.equipment,
      equipment: requestForm.equipment || prefilledListing?.title || '',
      inspectionLocation: requestForm.inspectionLocation || prefilledListing?.location || '',
      requesterName: requestForm.contactName,
      requesterCompany: requestForm.company,
      requesterEmail: requestForm.email,
      requesterPhone: requestForm.phone,
      timeline: requestForm.timeline,
      notes: requestForm.notes,
      matchedDealerName: dealerMatch?.recommendedDealer?.name || '',
    }, prefilledListing);
    const fileName = buildInspectionSheetFileName({
      listingId: prefilledListing?.id,
      listingTitle: prefilledListing?.title || requestForm.equipment,
      equipment: requestForm.equipment,
    }, prefilledListing);
    downloadTextFile(fileName, content);
  };

  const submitPartnerRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setPartnerSubmitError('');
    setPartnerSubmitNotice('');

    if (!user?.uid) {
      openMailto(
        `Inspection Partner Application: ${partnerForm.company || partnerForm.contactName || 'New Partner'}`,
        [
          'Inspection Partner Application',
          `Company: ${partnerForm.company}`,
          `Contact: ${partnerForm.contactName}`,
          `Email: ${partnerForm.email}`,
          `Phone: ${partnerForm.phone}`,
          `Territory: ${partnerForm.territory}`,
          `Certifications: ${partnerForm.certifications}`,
          `Equipment Focus: ${partnerForm.equipmentFocus}`,
          '',
          'Notes:',
          partnerForm.notes,
        ].join('\n')
      );
      return;
    }

    if (!canJoinInspectionNetwork) {
      setPartnerSubmitError('Only dealer, pro dealer, or admin accounts can join the inspection network.');
      return;
    }

    setSubmittingPartnerRequest(true);
    void (async () => {
      try {
        await userService.updateProfile(user.uid, {
          company: partnerForm.company.trim(),
          phoneNumber: partnerForm.phone.trim(),
          inspectionCoverageEnabled: true,
          inspectionCoverageTerritory: partnerForm.territory.trim(),
          inspectionEquipmentFocus: partnerForm.equipmentFocus.trim(),
          inspectionCertifications: partnerForm.certifications.trim(),
          inspectionCoverageNotes: partnerForm.notes.trim(),
          inspectionCoverageUpdatedAt: new Date().toISOString(),
        });
        setPartnerSubmitNotice('Inspection network coverage saved. Your account can now be matched for nearby requests.');
      } catch (error) {
        setPartnerSubmitError(error instanceof Error ? error.message : 'Unable to save inspection network coverage right now.');
      } finally {
        setSubmittingPartnerRequest(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-bg">
      <Seo
        title="Forestry Equipment Sales | Inspections"
        description="Inspection request intake, partner enrollment, and printable machine checklists for Forestry Equipment Sales buyers, dealers, and sellers."
        canonicalPath="/inspections"
      />

      <section className="border-b border-line bg-ink px-4 py-20 text-white md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">Inspection Desk</span>
          <h1 className="mt-4 max-w-4xl text-4xl font-black uppercase tracking-tighter md:text-6xl">
            Buyer-ready field inspections for dealers, pro dealers, and owner-operators
          </h1>
          <p className="mt-6 max-w-3xl text-sm font-medium leading-relaxed text-white/70">
            Request an inspection, let Forestry Equipment Sales match the machine to the nearest dealer coverage point, join the inspection partner network, and download a printable machine review sheet for field use.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button onClick={() => downloadTextFile('forestry-equipment-sales-inspection-checklist.txt', requestChecklist)} className="btn-industrial btn-accent px-6 py-4">
              <FileDown size={16} /> Download Checklist
            </button>
            {prefilledListing ? (
              <button onClick={downloadMachineInspectionSheet} className="btn-industrial bg-white/10 border border-white/20 px-6 py-4 hover:bg-white hover:text-ink">
                <ClipboardCheck size={16} /> Download Machine Sheet
              </button>
            ) : null}
            <button onClick={() => window.print()} className="btn-industrial bg-white/10 border border-white/20 px-6 py-4 hover:bg-white hover:text-ink">
              <Printer size={16} /> Print Review Sheet
            </button>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-industrial bg-white/10 border border-white/20 px-6 py-4 hover:bg-white hover:text-ink">
              <Mail size={16} /> Email Inspection Desk
            </a>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-[1600px] gap-1 border border-line bg-line md:grid-cols-3">
          {[
            {
              icon: ClipboardCheck,
              title: 'Inspection Requests',
              copy: 'Buyers and brokers can start a machine inspection request with equipment reference, location, and timeline.',
            },
            {
              icon: ShieldCheck,
              title: 'Partner Enrollment',
              copy: 'Dealers and pro dealers can register as inspection-capable partners and define territory and equipment specialty.',
            },
            {
              icon: Truck,
              title: 'Field-ready Reports',
              copy: 'Use the printable checklist for walkarounds, serial verification, hydraulic checks, function tests, and final disposition.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-bg p-10">
              <item.icon className="text-accent" size={26} />
              <h2 className="mt-6 text-lg font-black uppercase tracking-tight">{item.title}</h2>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 md:px-8">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-2">
          <div className="border border-line bg-surface p-8">
            <span className="label-micro text-accent">Buyer Request</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tighter">Request an inspection</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
              Match the machine to the nearest dealer first, then route the request to the Forestry Equipment Sales support desk with the recommended inspection partner included.
            </p>

            {prefilledListing ? (
              <div className="mt-6 border border-line bg-bg p-5">
                <span className="label-micro text-accent">Linked Machine</span>
                <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight">{prefilledListing.title}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted">
                      Listing ID: {prefilledListing.id} • {prefilledListing.location || 'Location pending'}
                    </p>
                  </div>
                  <Link to={buildListingPath(prefilledListing)} className="btn-industrial px-4 py-2 text-[10px]">
                    View Machine
                  </Link>
                </div>
              </div>
            ) : null}

            {prefilledListingError ? (
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-red-500">{prefilledListingError}</p>
            ) : null}

            <form onSubmit={submitRequest} className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input required type="text" placeholder="COMPANY" className="input-industrial" value={requestForm.company} onChange={(event) => setRequestForm((prev) => ({ ...prev, company: event.target.value }))} />
                <input required type="text" placeholder="CONTACT NAME" className="input-industrial" value={requestForm.contactName} onChange={(event) => setRequestForm((prev) => ({ ...prev, contactName: event.target.value }))} />
                <input required type="email" placeholder="EMAIL" className="input-industrial" value={requestForm.email} onChange={(event) => setRequestForm((prev) => ({ ...prev, email: event.target.value }))} />
                <input required type="tel" placeholder="PHONE" className="input-industrial" value={requestForm.phone} onChange={(event) => setRequestForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <input required type="text" placeholder="EQUIPMENT DESCRIPTION" className="input-industrial w-full" value={requestForm.equipment} onChange={(event) => setRequestForm((prev) => ({ ...prev, equipment: event.target.value }))} />
              <input type="text" placeholder="LISTING ID, STOCK NUMBER, OR LISTING URL" className="input-industrial w-full" value={requestForm.stockNumber} onChange={(event) => setRequestForm((prev) => ({ ...prev, stockNumber: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <input required type="text" placeholder="INSPECTION LOCATION" className="input-industrial" value={requestForm.inspectionLocation} onChange={(event) => setRequestForm((prev) => ({ ...prev, inspectionLocation: event.target.value }))} />
                <input type="text" placeholder="PREFERRED TIMELINE" className="input-industrial" value={requestForm.timeline} onChange={(event) => setRequestForm((prev) => ({ ...prev, timeline: event.target.value }))} />
              </div>
              <textarea rows={5} placeholder="SCOPE, ACCESS NOTES, OR BUYER REQUIREMENTS" className="input-industrial w-full" value={requestForm.notes} onChange={(event) => setRequestForm((prev) => ({ ...prev, notes: event.target.value }))} />

              <div className="rounded-sm border border-line bg-bg p-5">
                <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="label-micro text-accent">Dealer Matching</span>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
                      Use the machine listing reference or inspection location to recommend the nearest dealer before dispatching the request.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={lookupClosestDealer}
                    disabled={findingDealer || (!requestForm.stockNumber.trim() && !requestForm.inspectionLocation.trim())}
                    className="btn-industrial px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {findingDealer ? <LoaderCircle size={16} className="animate-spin" /> : <MapPin size={16} />}
                    {findingDealer ? 'Matching Dealer...' : 'Find Closest Dealer'}
                  </button>
                </div>

                {dealerLookupError ? (
                  <p className="mt-4 text-sm font-bold uppercase tracking-wider text-red-500">{dealerLookupError}</p>
                ) : null}

                {requestSubmitError ? (
                  <p className="mt-4 text-sm font-bold uppercase tracking-wider text-red-500">{requestSubmitError}</p>
                ) : null}

                {requestSubmitNotice ? (
                  <p className="mt-4 text-sm font-bold uppercase tracking-wider text-data">{requestSubmitNotice}</p>
                ) : null}

                {dealerMatch?.recommendedDealer ? (
                  <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr),280px]">
                    <div className="border border-line bg-surface p-5">
                      <span className="label-micro text-accent">Recommended Dealer</span>
                      <h3 className="mt-3 text-xl font-black uppercase tracking-tight">{dealerMatch.recommendedDealer.name}</h3>
                      <p className="mt-2 text-sm font-medium text-muted">{dealerMatch.recommendedDealer.company || dealerMatch.recommendedDealer.storefrontName || 'Forestry Equipment Sales dealer account'}</p>
                      <div className="mt-4 space-y-2 text-sm text-muted">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-accent" />
                          <span>{dealerMatch.recommendedDealer.location}</span>
                        </div>
                        {dealerMatch.recommendedDealer.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-accent" />
                            <span>{dealerMatch.recommendedDealer.phone}</span>
                          </div>
                        ) : null}
                        {dealerMatch.recommendedDealer.email ? (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-accent" />
                            <span>{dealerMatch.recommendedDealer.email}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="border border-line bg-bg p-5">
                      <span className="label-micro text-accent">Match Quality</span>
                      <p className="mt-3 text-2xl font-black uppercase tracking-tight">{formatDistance(dealerMatch.recommendedDealer.distanceMiles)}</p>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
                        {dealerMatch.matchType === 'distance'
                          ? 'Matched by machine and dealer coordinates.'
                          : 'Matched by closest available location text because exact coordinates were not available.'}
                      </p>
                      {dealerMatch.listing?.title ? (
                        <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
                          Source machine: <span className="text-ink">{dealerMatch.listing.title}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {dealerMatch?.alternatives?.length ? (
                  <div className="mt-4 border border-line bg-surface p-5">
                    <span className="label-micro text-accent">Backup Options</span>
                    <div className="mt-3 space-y-3">
                      {dealerMatch.alternatives.map((dealer) => (
                        <div key={dealer.uid} className="flex items-center justify-between gap-4 border-t border-line pt-3 first:border-t-0 first:pt-0">
                          <div>
                            <p className="text-sm font-black uppercase tracking-tight">{dealer.name}</p>
                            <p className="text-sm text-muted">{dealer.location}</p>
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-accent">{formatDistance(dealer.distanceMiles)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button type="submit" disabled={submittingRequest} className="btn-industrial btn-accent w-full py-4 disabled:cursor-not-allowed disabled:opacity-60">
                {submittingRequest ? 'Submitting Inspection Request...' : 'Submit Inspection Request'}
              </button>
            </form>
          </div>

          <div className="border border-line bg-surface p-8">
            <span className="label-micro text-accent">Partner Intake</span>
            <h2 className="mt-3 text-2xl font-black uppercase tracking-tighter">Join the inspection network</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted">
              Dealers and pro dealers can use this to register territory coverage, certifications, and the equipment classes they can inspect.
            </p>
            {partnerSubmitError ? (
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-red-500">{partnerSubmitError}</p>
            ) : null}
            {partnerSubmitNotice ? (
              <p className="mt-4 text-sm font-bold uppercase tracking-wider text-data">{partnerSubmitNotice}</p>
            ) : null}

            <form onSubmit={submitPartnerRequest} className="mt-8 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input required type="text" placeholder="COMPANY" className="input-industrial" value={partnerForm.company} onChange={(event) => setPartnerForm((prev) => ({ ...prev, company: event.target.value }))} />
                <input required type="text" placeholder="CONTACT NAME" className="input-industrial" value={partnerForm.contactName} onChange={(event) => setPartnerForm((prev) => ({ ...prev, contactName: event.target.value }))} />
                <input required type="email" placeholder="EMAIL" className="input-industrial" value={partnerForm.email} onChange={(event) => setPartnerForm((prev) => ({ ...prev, email: event.target.value }))} />
                <input required type="tel" placeholder="PHONE" className="input-industrial" value={partnerForm.phone} onChange={(event) => setPartnerForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <input required type="text" placeholder="PRIMARY TERRITORY" className="input-industrial w-full" value={partnerForm.territory} onChange={(event) => setPartnerForm((prev) => ({ ...prev, territory: event.target.value }))} />
              <input type="text" placeholder="CERTIFICATIONS / LICENSES" className="input-industrial w-full" value={partnerForm.certifications} onChange={(event) => setPartnerForm((prev) => ({ ...prev, certifications: event.target.value }))} />
              <input type="text" placeholder="EQUIPMENT FOCUS" className="input-industrial w-full" value={partnerForm.equipmentFocus} onChange={(event) => setPartnerForm((prev) => ({ ...prev, equipmentFocus: event.target.value }))} />
              <textarea rows={5} placeholder="CAPACITY, TRAVEL RANGE, FIELD TOOLS, AND NOTES" className="input-industrial w-full" value={partnerForm.notes} onChange={(event) => setPartnerForm((prev) => ({ ...prev, notes: event.target.value }))} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={submittingPartnerRequest} className="btn-industrial btn-accent flex-1 py-4 disabled:cursor-not-allowed disabled:opacity-60">
                  {submittingPartnerRequest ? 'Saving Inspection Coverage...' : user?.uid && canJoinInspectionNetwork ? 'Join Inspection Network' : 'Send Partner Intake'}
                </button>
                <button type="button" onClick={() => downloadTextFile('forestry-equipment-sales-inspection-partner-intake.txt', partnerPacket)} className="btn-industrial flex-1 py-4">Download Intake Template</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

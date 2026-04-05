import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import {
  getPlaceDetails,
  getPlacePredictions,
  type GooglePlacePrediction,
  type GooglePlaceSelection,
  type GooglePlacesMode,
} from '../services/placesService';

interface GooglePlacesInputProps {
  id?: string;
  mode?: GooglePlacesMode;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (place: GooglePlaceSelection) => void;
  placeholder?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  helperTextClassName?: string;
  leadingIconClassName?: string;
  disabled?: boolean;
}

export function GooglePlacesInput({
  id,
  mode = 'address',
  value,
  onChange,
  onSelect,
  placeholder,
  helperText,
  className = '',
  inputClassName = '',
  dropdownClassName = '',
  optionClassName = '',
  helperTextClassName = '',
  leadingIconClassName = '',
  disabled = false,
}: GooglePlacesInputProps) {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const requestIdRef = useRef(0);
  const normalizedValue = String(value || '').trim();
  const shouldShowDropdown = open && !disabled && normalizedValue.length >= 3;

  useEffect(() => {
    if (disabled) {
      setPredictions([]);
      setOpen(false);
      setIsLoading(false);
      return;
    }

    if (normalizedValue.length < 3) {
      setPredictions([]);
      setOpen(false);
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsLoading(true);

      const nextPredictions = await getPlacePredictions(normalizedValue, mode);
      if (requestIdRef.current !== requestId) {
        return;
      }

      setPredictions(nextPredictions);
      setOpen(true);
      setIsLoading(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, mode, value]);

  const handleSelect = async (prediction: GooglePlacePrediction) => {
    setIsSelecting(true);
    const details = await getPlaceDetails(prediction.placeId);
    const resolvedLabel = details?.formattedAddress || prediction.description;

    onChange(resolvedLabel);
    if (details && onSelect) {
      onSelect(details);
    }

    setPredictions([]);
    setOpen(false);
    setIsSelecting(false);
  };

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div className="relative">
        <div className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#5f6368] ${leadingIconClassName}`.trim()}>
          {isLoading || isSelecting ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
        </div>
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (normalizedValue.length >= 3) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 160);
          }}
          placeholder={placeholder || (mode === 'address' ? 'Search address with Google' : 'Search city with Google')}
          className={`input-industrial w-full py-3 pl-12 pr-12 placeholder:normal-case placeholder:tracking-normal ${inputClassName}`.trim()}
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setPredictions([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
          <X size={14} />
          </button>
        ) : null}

        {shouldShowDropdown ? (
          <div
            className={`absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[18px] border border-[#dadce0] bg-white shadow-[0_18px_42px_rgba(60,64,67,0.22),0_6px_18px_rgba(60,64,67,0.12)] ${dropdownClassName}`.trim()}
          >
            <div className="border-b border-[#e8eaed] px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#4285f4]">
                Google Places
              </div>
              <div className="mt-1 text-[11px] font-medium text-[#5f6368]">
                {mode === 'address'
                  ? 'Select a Google-verified address for consistent location data.'
                  : 'Select a Google-verified city or metro market.'}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {isLoading || isSelecting ? (
                <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#5f6368]">
                  <Loader2 size={15} className="animate-spin text-[#4285f4]" />
                  <span>Searching Google places…</span>
                </div>
              ) : predictions.length > 0 ? (
                predictions.map((prediction) => (
                  <button
                    key={prediction.placeId}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => void handleSelect(prediction)}
                    className={`flex w-full items-start gap-3 border-b border-[#f1f3f4] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f8f9fa] ${optionClassName}`.trim()}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#4285f4]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#202124]">
                        {prediction.mainText || prediction.description}
                      </span>
                      {prediction.secondaryText ? (
                        <span className="mt-0.5 block truncate text-xs font-medium text-[#5f6368]">
                          {prediction.secondaryText}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-sm font-medium text-[#5f6368]">
                  No Google matches yet. Try entering the street number and street name.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#e8eaed] bg-[#f8f9fa] px-4 py-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#5f6368]">
                Powered by Google
              </span>
              <span className="text-[10px] font-semibold text-[#5f6368]">
                Verified location lookup
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p className={`text-[10px] font-bold uppercase tracking-widest text-muted ${helperTextClassName}`.trim()}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

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

  useEffect(() => {
    if (disabled) {
      setPredictions([]);
      setOpen(false);
      setIsLoading(false);
      return;
    }

    const normalizedValue = String(value || '').trim();
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
      setOpen(nextPredictions.length > 0);
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
        <div className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted ${leadingIconClassName}`.trim()}>
          {isLoading || isSelecting ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
        </div>
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            if (predictions.length > 0) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 160);
          }}
          placeholder={placeholder || (mode === 'address' ? 'Search address with Google' : 'Search city with Google')}
          className={`input-industrial w-full pl-10 pr-10 ${inputClassName}`.trim()}
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

        {open && predictions.length > 0 ? (
          <div className={`absolute z-50 top-full left-0 right-0 mt-1 overflow-hidden rounded-sm border border-line bg-bg shadow-lg ${dropdownClassName}`.trim()}>
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void handleSelect(prediction)}
                className={`w-full border-b border-line px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-surface ${optionClassName}`.trim()}
              >
                <span className="block text-xs font-semibold text-ink">
                  {prediction.mainText || prediction.description}
                </span>
                {prediction.secondaryText ? (
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-muted">
                    {prediction.secondaryText}
                  </span>
                ) : null}
              </button>
            ))}
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

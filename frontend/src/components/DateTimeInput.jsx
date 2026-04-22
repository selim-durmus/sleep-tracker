import { useEffect, useState } from 'react';
import { isAndroid, isFirefox } from '../lib/platform.js';
import {
  isoToLocalInput,
  localInputToIso,
  formatTimeInput,
  applyTimeInput,
  formatDateInput,
  applyDateInput,
  autoFormatTimeDigits,
  formatDateMDInput,
  applyDateMDInput,
  autoFormatDateDigits
} from '../lib/time.js';

export default function DateTimeInput({ value, onChange }) {
  if (isAndroid()) {
    return <SplitDateTimeInput value={value} onChange={onChange} dateAsText={isFirefox()} />;
  }
  return <NativeDateTimeInput value={value} onChange={onChange} />;
}

function NativeDateTimeInput({ value, onChange }) {
  return (
    <input
      type="datetime-local"
      value={value != null ? isoToLocalInput(new Date(value).toISOString()) : ''}
      onChange={(e) => {
        if (!e.target.value) return;
        onChange(new Date(localInputToIso(e.target.value)).getTime());
      }}
      className="bg-transparent text-neutral-200 text-sm tabular-nums focus:outline-none border-b border-transparent focus:border-neutral-700 pb-0.5"
    />
  );
}

function SplitDateTimeInput({ value, onChange, dateAsText }) {
  const formatDateStr = dateAsText ? formatDateMDInput : formatDateInput;
  const applyDateStr = dateAsText ? applyDateMDInput : applyDateInput;

  const [timeStr, setTimeStr] = useState(() => formatTimeInput(value));
  const [dateStr, setDateStr] = useState(() => formatDateStr(value));

  useEffect(() => {
    setTimeStr(formatTimeInput(value));
    setDateStr(formatDateStr(value));
  }, [value, dateAsText]);

  const commitTime = () => {
    const ms = applyTimeInput(value, timeStr);
    if (ms != null) {
      if (ms !== value) onChange(ms);
    } else {
      setTimeStr(formatTimeInput(value));
    }
  };

  const commitDate = (str) => {
    const ms = applyDateStr(value, str);
    if (ms != null) {
      if (ms !== value) onChange(ms);
    } else {
      setDateStr(formatDateStr(value));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{1,2}:[0-9]{2}"
        maxLength={5}
        value={timeStr}
        onChange={(e) => setTimeStr(autoFormatTimeDigits(e.target.value))}
        onBlur={commitTime}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="bg-transparent text-neutral-200 text-sm tabular-nums focus:outline-none border-b border-neutral-800 focus:border-neutral-600 pb-0.5 w-14 text-center"
      />
      {dateAsText ? (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{1,2}/[0-9]{1,2}"
          maxLength={5}
          value={dateStr}
          onChange={(e) => setDateStr(autoFormatDateDigits(e.target.value))}
          onBlur={() => commitDate(dateStr)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          placeholder="MM/DD"
          className="bg-transparent text-neutral-300 text-xs tabular-nums focus:outline-none border-b border-neutral-800 focus:border-neutral-600 pb-0.5 w-14 text-center"
        />
      ) : (
        <input
          type="date"
          value={dateStr}
          onChange={(e) => {
            setDateStr(e.target.value);
            if (e.target.value) commitDate(e.target.value);
          }}
          className="bg-transparent text-neutral-300 text-xs tabular-nums focus:outline-none border-b border-neutral-800 focus:border-neutral-600 pb-0.5"
        />
      )}
    </div>
  );
}

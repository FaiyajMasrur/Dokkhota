// Reusable Skill Verification Badge component for Dokkhota
import React from 'react';

const VerificationBadge = ({ isVerified, label = "Verified Provider" }) => {
  if (!isVerified) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs">
      <svg className="w-3.5 h-3.5 text-sky-600 fill-current" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {label}
    </span>
  );
};

export default VerificationBadge;

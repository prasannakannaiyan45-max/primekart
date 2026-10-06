import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3F1EC] via-[#EAE6DF] to-[#DFDAD0] text-[#57554E] p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 stroke-[1.25] mb-2 opacity-70" />
        <span className="text-xs font-medium tracking-wide max-w-[18ch] truncate">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
};

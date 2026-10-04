import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function LazyImage({
  src,
  alt,
  className,
  placeholder = 'blur',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsError(true);
  };

  if (isError) {
    return (
      <div className={`flex items-center justify-center bg-[#E2F1E7] dark:bg-[#22C55E]/5 ${className}`}>
        <ImageIcon className="w-8 h-8 text-[#22C55E]/30" />
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#E2F1E7] dark:bg-[#22C55E]/5 animate-pulse" />
      )}
      <img
        src={isLoaded ? src : undefined}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
}

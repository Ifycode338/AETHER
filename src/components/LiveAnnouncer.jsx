import React, { useEffect, useRef } from 'react';

/**
 * LiveAnnouncer component for screen reader announcements
 * Announces important state changes to screen reader users
 */
export default function LiveAnnouncer({ message, clearOnAnnounce = true }) {
  const announcementRef = useRef(null);

  useEffect(() => {
    if (message && announcementRef.current) {
      announcementRef.current.textContent = message;

      if (clearOnAnnounce) {
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = '';
          }
        }, 1000);
      }
    }
  }, [message, clearOnAnnounce]);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/**
 * Hook to trigger live announcements
 */
export function useLiveAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message) => {
    setAnnouncement(message);
  }, []);

  const clearAnnouncement = React.useCallback(() => {
    setAnnouncement('');
  }, []);

  return { announcement, announce, clearAnnouncement };
}

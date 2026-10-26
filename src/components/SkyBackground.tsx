import React, { useEffect, useState } from 'react';

interface ClickPoint {
  id: number;
  x: number;
  y: number;
}

export const SkyBackground: React.FC = () => {
  const [clicks, setClicks] = useState<ClickPoint[]>([]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const id = Date.now() + Math.random();
      setClicks((prev) => [...prev.slice(-6), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setClicks((prev) => prev.filter((item) => item.id !== id));
      }, 600);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <>
      {/* Fixed Moving Sky Background Layer */}
      <div
        aria-hidden="true"
        className="sky-bg-layer fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#DDF0FC]/70 via-[#EFF8FD]/60 to-white"
      >
        {/* Atmospheric Soft Sky-Blue Moving Horizon */}
        <div className="absolute -top-24 -left-1/4 w-[150%] h-[420px] rounded-full bg-gradient-to-r from-[#A9D7F2]/35 via-[#EFF8FD]/50 to-[#A9D7F2]/35 blur-3xl animate-sky-drift-slow" />
        <div className="absolute top-1/3 -right-1/4 w-[140%] h-[360px] rounded-full bg-gradient-to-l from-[#A9D7F2]/25 via-white/60 to-[#A9D7F2]/25 blur-3xl animate-sky-drift-reverse" />

        {/* Passing Cloud Layer 1 */}
        <div className="absolute top-8 left-0 w-[380px] sm:w-[540px] opacity-60 animate-cloud-pass-1">
          <svg
            viewBox="0 0 600 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M115 165H485C526.421 165 560 131.421 560 90C560 51.6344 531.181 20.0005 493.963 15.524C476.647 -5.654 449.946 -18 420 -18C371.56 -18 331.491 17.554 323.767 63.788C307.989 52.548 288.685 46 268 46C219.866 46 180.427 83.249 176.332 130.369C161.227 122.48 144.041 118 126 118C77.3989 118 38 157.399 38 206H115V165Z"
              fill="url(#cloudGrad1)"
            />
            <defs>
              <linearGradient
                id="cloudGrad1"
                x1="300"
                y1="-18"
                x2="300"
                y2="206"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="1" stopColor="#A9D7F2" stopOpacity="0.35" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Passing Cloud Layer 2 */}
        <div className="absolute top-44 left-0 w-[320px] sm:w-[460px] opacity-50 animate-cloud-pass-2">
          <svg
            viewBox="0 0 520 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M90 145H430C465.899 145 495 115.899 495 80C495 45.45 468.055 17.185 433.998 15.118C416.322 -4.015 391.028 -16 363 -16C314.864 -16 275.34 19.308 268.255 65.414C252.87 55.025 234.331 49 214.5 49C163.966 49 123 89.966 123 140.5C123 142.014 123.037 143.519 123.111 145H90Z"
              fill="url(#cloudGrad2)"
            />
            <defs>
              <linearGradient
                id="cloudGrad2"
                x1="260"
                y1="-16"
                x2="260"
                y2="145"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="1" stopColor="#A9D7F2" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Passing Cloud Layer 3 */}
        <div className="absolute top-96 left-0 w-[420px] sm:w-[600px] opacity-45 animate-cloud-pass-3">
          <svg
            viewBox="0 0 600 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M115 165H485C526.421 165 560 131.421 560 90C560 51.6344 531.181 20.0005 493.963 15.524C476.647 -5.654 449.946 -18 420 -18C371.56 -18 331.491 17.554 323.767 63.788C307.989 52.548 288.685 46 268 46C219.866 46 180.427 83.249 176.332 130.369C161.227 122.48 144.041 118 126 118C77.3989 118 38 157.399 38 206H115V165Z"
              fill="url(#cloudGrad3)"
            />
            <defs>
              <linearGradient
                id="cloudGrad3"
                x1="300"
                y1="-18"
                x2="300"
                y2="206"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFFFFF" stopOpacity="0.85" />
                <stop offset="1" stopColor="#A9D7F2" stopOpacity="0.28" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Subtle Click Ripple Animation Layer */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden no-print"
      >
        {clicks.map((pt) => (
          <span
            key={pt.id}
            style={{ left: pt.x - 18, top: pt.y - 18 }}
            className="absolute w-9 h-9 rounded-full border-2 border-[#245B7A]/50 bg-[#A9D7F2]/30 animate-click-burst"
          />
        ))}
      </div>
    </>
  );
};

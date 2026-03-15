/**
 * Returns Tailwind-compatible CSS gradient values based on the current hour.
 * Dawn/dusk are warm, midday is bright, night is deep blue-black.
 */
export function getTimeOfDayGradient(): { className: string; style: React.CSSProperties } {
  const hour = new Date().getHours();

  // Night: 20–5
  if (hour >= 20 || hour < 5) {
    return {
      className: "",
      style: {
        background: "linear-gradient(to bottom, #020617 0%, #0a0f1e 40%, #0f172a 100%)",
      },
    };
  }

  // Dawn: 5–7
  if (hour < 7) {
    return {
      className: "",
      style: {
        background:
          "linear-gradient(to bottom, #0c1631 0%, #1e293b 30%, #3b2a4a 60%, #5b3a56 100%)",
      },
    };
  }

  // Morning: 7–10
  if (hour < 10) {
    return {
      className: "",
      style: {
        background:
          "linear-gradient(to bottom, #172554 0%, #1e3a5f 35%, #2d4a7a 70%, #3b5998 100%)",
      },
    };
  }

  // Midday: 10–15
  if (hour < 15) {
    return {
      className: "",
      style: {
        background:
          "linear-gradient(to bottom, #1e3a5f 0%, #2c5282 30%, #3b82a0 60%, #4a90b8 100%)",
      },
    };
  }

  // Afternoon: 15–18
  if (hour < 18) {
    return {
      className: "",
      style: {
        background:
          "linear-gradient(to bottom, #1e3050 0%, #2d3f60 35%, #3b4a6b 70%, #1e293b 100%)",
      },
    };
  }

  // Dusk: 18–20
  return {
    className: "",
    style: {
      background:
        "linear-gradient(to bottom, #0f172a 0%, #1a1a3e 30%, #3b2a4a 65%, #1a1025 100%)",
    },
  };
}

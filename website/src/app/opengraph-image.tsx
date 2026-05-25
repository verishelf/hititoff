import { ImageResponse } from "next/og";

import { APP_NAME, APP_SLOGAN } from "@/lib/brand";

export const alt = `${APP_NAME} — ${APP_SLOGAN}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #120810 0%, #9d1b6b 50%, #2a1830 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#ff4d8d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            H
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 64, fontWeight: 700 }}>{APP_NAME}</span>
            <span style={{ fontSize: 28, color: "#ff8fab", letterSpacing: 4 }}>
              {APP_SLOGAN.toUpperCase()}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 28, color: "#b8a0ad", maxWidth: 800, textAlign: "center" }}>
          Compatibility-first dating with personality quiz matching and local discovery
        </p>
      </div>
    ),
    { ...size },
  );
}

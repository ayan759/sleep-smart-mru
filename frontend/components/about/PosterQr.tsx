"use client";

import { QRCodeSVG } from "qrcode.react";

/** The QR code our posters and table tents carry: the live app's home page. */
export const POSTER_URL = "https://sleep-smart-mru.vercel.app";

export function PosterQr() {
  return (
    <QRCodeSVG
      value={POSTER_URL}
      size={176}
      marginSize={2}
      bgColor="#f7f5ff"
      fgColor="#0a0e1c"
      className="h-auto w-full max-w-44 rounded-xl"
      title="QR code that opens Sleep Smart MRU"
    />
  );
}

import React from 'react';

interface WabupCupLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export const WabupCupLogo: React.FC<WabupCupLogoProps> = ({
  className = 'w-10 h-10',
  size,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 620"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <defs>
        {/* Gradients for Ribbons */}
        <linearGradient id="wclRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4d0307" />
          <stop offset="15%" stopColor="#7a070e" />
          <stop offset="40%" stopColor="#db1822" />
          <stop offset="100%" stopColor="#e81d28" />
        </linearGradient>

        {/* Side bevel gradient for 3D ribbon depth */}
        <linearGradient id="wclRibbonBevel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
          <stop offset="12%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="88%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>

        {/* Circle Red Gradient */}
        <radialGradient id="wclCircleGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ff2e3b" />
          <stop offset="45%" stopColor="#eb1a25" />
          <stop offset="85%" stopColor="#c9101a" />
          <stop offset="100%" stopColor="#990b12" />
        </radialGradient>

        {/* Circle Clip */}
        <clipPath id="wclCircleClip">
          <circle cx="250" cy="180" r="150" />
        </clipPath>
      </defs>

      {/* 5 VERTICAL RED RIBBONS / STRIPES (BEHIND CIRCLE) */}
      <g id="wclRibbons">
        {/* Ribbon 1 (Leftmost, longest) */}
        <polygon points="110,180 160,180 160,545 110,570" fill="url(#wclRibbonGrad)" />
        <polygon points="110,180 160,180 160,545 110,570" fill="url(#wclRibbonBevel)" />

        {/* Ribbon 2 */}
        <polygon points="170,180 220,180 220,516 170,541" fill="url(#wclRibbonGrad)" />
        <polygon points="170,180 220,180 220,516 170,541" fill="url(#wclRibbonBevel)" />

        {/* Ribbon 3 (Middle) */}
        <polygon points="230,180 280,180 280,487 230,512" fill="url(#wclRibbonGrad)" />
        <polygon points="230,180 280,180 280,487 230,512" fill="url(#wclRibbonBevel)" />

        {/* Ribbon 4 */}
        <polygon points="290,180 340,180 340,458 290,483" fill="url(#wclRibbonGrad)" />
        <polygon points="290,180 340,180 340,458 290,483" fill="url(#wclRibbonBevel)" />

        {/* Ribbon 5 (Rightmost, shortest) */}
        <polygon points="350,180 400,180 400,429 350,454" fill="url(#wclRibbonGrad)" />
        <polygon points="350,180 400,180 400,429 350,454" fill="url(#wclRibbonBevel)" />
      </g>

      {/* CIRCLE WITH TRADITIONAL BATIK ORNAMENTS */}
      <g id="wclMedallion" clipPath="url(#wclCircleClip)">
        {/* Base Red Circle */}
        <circle cx="250" cy="180" r="150" fill="url(#wclCircleGrad)" />

        {/* Batik Pattern Elements (Deep Black/Navy) */}
        <g fill="#0b101c" stroke="#0b101c">
          {/* Top Center Fan */}
          <path d="M 220,95 C 230,65 260,50 290,55 C 295,75 285,95 270,105 C 255,90 235,90 220,95 Z" />
          <circle cx="240" cy="62" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="255" cy="55" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="270" cy="58" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="282" cy="68" r="3.5" fill="#e81d28" stroke="none" />

          {/* Top Left Curled Leaf / Petals */}
          <path d="M 175,60 C 190,40 220,45 225,70 C 205,75 190,85 180,95 C 165,85 165,70 175,60 Z" />
          <circle cx="185" cy="48" r="3" fill="#e81d28" stroke="none" />
          <circle cx="198" cy="45" r="3" fill="#e81d28" stroke="none" />
          <circle cx="212" cy="50" r="3" fill="#e81d28" stroke="none" />

          {/* Top Right Scallop Arch */}
          <path d="M 310,70 C 330,45 370,55 375,85 C 355,95 340,105 320,100 Z" />
          <circle cx="330" cy="55" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="348" cy="58" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="362" cy="70" r="3.5" fill="#e81d28" stroke="none" />

          {/* Upper Right Outer Fan Arches */}
          <path d="M 360,110 C 385,100 410,120 405,145 C 385,145 370,135 360,110 Z" />
          <circle cx="380" cy="112" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="395" cy="122" r="3.5" fill="#e81d28" stroke="none" />

          {/* Upper Left Arch and Spiral */}
          <path d="M 135,100 C 145,75 175,80 180,105 C 165,115 150,115 135,100 Z" />
          <circle cx="145" cy="85" r="3" fill="#e81d28" stroke="none" />
          <circle cx="158" cy="82" r="3" fill="#e81d28" stroke="none" />

          {/* Spiral curl */}
          <path
            d="M 145,140 C 135,120 155,95 180,105 C 195,115 190,140 170,145 C 158,145 152,135 160,128 C 168,122 178,130 172,138"
            fill="none"
            stroke="#0b101c"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="170" cy="133" r="3" fill="#e81d28" stroke="none" />

          {/* Giant Spiral Motif on Right Half */}
          <path
            d="M 330,165 C 310,165 305,140 325,130 C 350,120 375,145 365,175 C 350,210 290,210 270,165 C 255,130 280,85 330,85 C 385,85 415,135 400,195 C 385,250 315,260 270,230 C 230,205 205,215 170,240 C 140,260 125,290 100,285 C 105,255 130,240 155,220 C 190,195 230,180 260,200 C 285,218 320,222 345,195 C 365,170 355,140 330,140 C 315,140 315,155 325,160 Z"
            fill="#0b101c"
            stroke="none"
          />

          {/* Dotted Line Accents Along the Large Spiral */}
          <g fill="#e81d28" stroke="none">
            <circle cx="330" cy="148" r="3" />
            <circle cx="340" cy="158" r="3" />
            <circle cx="342" cy="172" r="3" />
            <circle cx="330" cy="182" r="3" />
            <circle cx="315" cy="180" r="3" />
            <circle cx="300" cy="170" r="3" />
            <circle cx="285" cy="150" r="3.5" />
            <circle cx="280" cy="130" r="3.5" />
            <circle cx="295" cy="110" r="3.5" />
            <circle cx="320" cy="100" r="4" />
            <circle cx="345" cy="100" r="4" />
            <circle cx="370" cy="112" r="4" />
            <circle cx="388" cy="135" r="4" />
            <circle cx="392" cy="165" r="4" />
            <circle cx="380" cy="195" r="4" />
            <circle cx="355" cy="220" r="4" />
            <circle cx="325" cy="235" r="4" />
            <circle cx="295" cy="238" r="4" />
            <circle cx="265" cy="225" r="4" />
            <circle cx="238" cy="210" r="4" />
            <circle cx="210" cy="212" r="4" />
            <circle cx="185" cy="222" r="4" />
            <circle cx="160" cy="238" r="4" />
            <circle cx="138" cy="255" r="4" />
          </g>

          {/* FLOWER BLOSSOM (LEFT SIDE - 8 PETALS) */}
          <g transform="translate(145, 175)">
            <ellipse cx="0" cy="-28" rx="9" ry="14" />
            <ellipse cx="20" cy="-20" rx="9" ry="14" transform="rotate(45 20 -20)" />
            <ellipse cx="28" cy="0" rx="14" ry="9" />
            <ellipse cx="20" cy="20" rx="9" ry="14" transform="rotate(-45 20 20)" />
            <ellipse cx="0" cy="28" rx="9" ry="14" />
            <ellipse cx="-20" cy="20" rx="9" ry="14" transform="rotate(45 -20 20)" />
            <ellipse cx="-28" cy="0" rx="14" ry="9" />
            <ellipse cx="-20" cy="-20" rx="9" ry="14" transform="rotate(-45 -20 -20)" />

            <circle cx="0" cy="0" r="15" fill="#0b101c" />
            <circle cx="0" cy="0" r="8" fill="#e81d28" stroke="none" />
            <circle cx="0" cy="0" r="3.5" fill="#0b101c" stroke="none" />

            <circle cx="0" cy="-28" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="20" cy="-20" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="28" cy="0" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="20" cy="20" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="0" cy="28" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="-20" cy="20" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="-28" cy="0" r="2.5" fill="#e81d28" stroke="none" />
            <circle cx="-20" cy="-20" r="2.5" fill="#e81d28" stroke="none" />
          </g>

          {/* Central Dot Rosette */}
          <g fill="#0b101c" stroke="none">
            <circle cx="225" cy="150" r="4.5" />
            <circle cx="215" cy="142" r="3.5" />
            <circle cx="235" cy="142" r="3.5" />
            <circle cx="215" cy="158" r="3.5" />
            <circle cx="235" cy="158" r="3.5" />
            <circle cx="225" cy="136" r="3.5" />
            <circle cx="225" cy="164" r="3.5" />
          </g>

          {/* BOTTOM-LEFT FLOWER BLOSSOM */}
          <g transform="translate(195, 290)">
            <ellipse cx="0" cy="-24" rx="8" ry="12" />
            <ellipse cx="18" cy="-16" rx="8" ry="12" transform="rotate(45 18 -16)" />
            <ellipse cx="24" cy="0" rx="12" ry="8" />
            <ellipse cx="18" cy="16" rx="8" ry="12" transform="rotate(-45 18 16)" />
            <ellipse cx="0" cy="24" rx="8" ry="12" />
            <ellipse cx="-18" cy="16" rx="8" ry="12" transform="rotate(45 -18 16)" />
            <ellipse cx="-24" cy="0" rx="12" ry="8" />
            <ellipse cx="-18" cy="-16" rx="8" ry="12" transform="rotate(-45 -18 -16)" />

            <circle cx="0" cy="0" r="12" fill="#0b101c" />
            <circle cx="0" cy="0" r="6" fill="#e81d28" stroke="none" />
          </g>

          {/* Scalloped fringe along bottom of spiral */}
          <path d="M 245,265 C 245,285 270,290 275,270 Z" />
          <circle cx="260" cy="282" r="3" fill="#e81d28" stroke="none" />

          <path d="M 275,268 C 280,292 305,295 310,272 Z" />
          <circle cx="292" cy="286" r="3" fill="#e81d28" stroke="none" />

          <path d="M 312,265 C 322,290 345,288 348,262 Z" />
          <circle cx="330" cy="280" r="3" fill="#e81d28" stroke="none" />

          {/* Scalloped fringe under right side */}
          <path d="M 350,250 C 370,270 390,255 385,235 Z" />
          <circle cx="372" cy="256" r="3" fill="#e81d28" stroke="none" />

          <path d="M 380,225 C 405,235 415,210 400,195 Z" />
          <circle cx="400" cy="220" r="3" fill="#e81d28" stroke="none" />

          {/* Bottom-most Decorative Drop Leaf */}
          <path d="M 270,285 C 290,290 310,325 285,335 C 265,325 260,295 270,285 Z" />
          <circle cx="278" cy="305" r="3.5" fill="#e81d28" stroke="none" />
          <circle cx="286" cy="318" r="3.5" fill="#e81d28" stroke="none" />
        </g>

        {/* Inner Radial Rim Shading */}
        <circle cx="250" cy="180" r="150" fill="none" stroke="#5a0408" strokeWidth="5" opacity="0.6" />
      </g>
    </svg>
  );
};
export default WabupCupLogo;

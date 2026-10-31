"use client";

import { useRef, useState, type ReactNode, type PointerEvent } from "react";

/** Button that leans toward the pointer (magnetic hover, desktop only). */
export function MagneticButton({
  children,
  className = "",
  onClick,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setOffset({
      x: ((e.clientX - r.left) / r.width - 0.5) * 14,
      y: ((e.clientY - r.top) / r.height - 0.5) * 10,
    });
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className={className}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? "transform .45s cubic-bezier(.2,.8,.3,1.4)" : "transform .08s linear",
      }}
    >
      {children}
    </button>
  );
}

/** Card that tilts in 3D following the pointer. */
export function TiltCard({
  children,
  className = "",
  max = 10,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setT({
      rx: (0.5 - py) * max,
      ry: (px - 0.5) * max,
      gx: px * 100,
      gy: py * 100,
    });
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: `perspective(900px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform .18s ease-out, box-shadow .3s ease",
        backgroundImage: `radial-gradient(circle at ${t.gx}% ${t.gy}%, rgba(255,255,255,.08), transparent 55%)`,
      }}
      onPointerMove={onMove}
      onMouseLeave={() => setT({ rx: 0, ry: 0, gx: 50, gy: 50 })}
    >
      {children}
    </div>
  );
}

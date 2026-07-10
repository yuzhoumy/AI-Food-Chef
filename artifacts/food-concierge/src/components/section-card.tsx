import type React from "react";

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

export function SectionCard({ icon: Icon, title, children }: SectionCardProps) {
  return (
    <div
      className="rounded-3xl p-6 md:p-8 flex flex-col gap-5"
      style={{
        background: "rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.22)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.12)",
      }}
    >
      <h3 className="font-display text-xl text-white font-extrabold tracking-tight drop-shadow-sm flex items-center gap-2.5">
        <Icon className="w-5 h-5 text-yellow-300 shrink-0" />
        {title}
      </h3>
      {children}
    </div>
  );
}

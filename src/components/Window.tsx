"use client";

interface WindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Window({ title, children, className = "" }: WindowProps) {
  return (
    <div className={`window slidein ${className}`}>
      <div className="window-title">
        <span>{title}</span>
        <div className="decorations">
          <div className="dot dot-red" />
          <div className="dot dot-yellow" />
          <div className="dot dot-green" />
        </div>
      </div>
      <div className="window-body">
        {children}
      </div>
    </div>
  );
}

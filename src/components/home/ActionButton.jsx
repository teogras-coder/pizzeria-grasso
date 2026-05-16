import React from 'react';

export default function ActionButton({ icon, label, onClick, href }) {
  const classes = "w-full flex items-center justify-center gap-2 bg-card/80 backdrop-blur-sm border border-primary/20 rounded-xl py-3 px-4 font-heading text-sm font-semibold text-accent tracking-wider hover:border-primary/50 hover:bg-card transition-all duration-300 active:scale-[0.98]";

  if (href) {
    return (
      <a href={href} className={classes}>
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

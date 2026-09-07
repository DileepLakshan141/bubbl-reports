import React from "react";

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
}

export const SummaryCard = ({
  label,
  value,
  icon: Icon,
  color = "text-primary",
  bgColor = "bg-primary/10",
}: SummaryCardProps) => {
  const formattedValue =
    value < 10 && value >= 0 ? `0${value}` : value.toString();

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div
        className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-40 ${bgColor}`}
      />

      <div className="relative flex flex-col justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center p-2.5 rounded-xl shrink-0 ${bgColor} ${color}`}
          >
            <Icon className="h-6 w-6" />
          </div>

          <span className="text-3xl font-extrabold tracking-tight text-foreground leading-none">
            {formattedValue}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-2">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

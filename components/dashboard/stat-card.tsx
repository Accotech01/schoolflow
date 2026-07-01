import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange";
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", iconBg: "bg-blue-100" },
  green: { bg: "bg-green-50", icon: "text-green-600", iconBg: "bg-green-100" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", iconBg: "bg-yellow-100" },
  red: { bg: "bg-red-50", icon: "text-red-600", iconBg: "bg-red-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", iconBg: "bg-purple-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", iconBg: "bg-orange-100" },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "blue",
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p className={cn("text-xs mt-1", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", colors.iconBg)}>
            <Icon className={cn("h-6 w-6", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

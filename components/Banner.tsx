import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BannerProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "gradient" | "minimal";
  icon?: ReactNode;
}

export default function Banner({ 
  title, 
  description, 
  children,
  className,
  variant = "default",
  icon
}: BannerProps) {
  const variants = {
    default: "bg-gradient-to-r from-primary/10 via-emerald-500/5 to-transparent border-0 rounded-xl shadow-md relative overflow-hidden",
    gradient: "bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 text-white rounded-xl shadow-xl relative overflow-hidden border-0",
    minimal: "bg-muted/50 border-0"
  };

  return (
    <div className={cn(
      "p-6 mb-6 relative",
      variants[variant],
      className
    )}>
      {/* Decorative background elements */}
      {variant === "default" && (
        <>
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
        </>
      )}
      {variant === "gradient" && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        </>
      )}
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-4 flex-1">
          {icon && (
            <div className={cn(
              "flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center",
              variant === "gradient" 
                ? "bg-white/25 backdrop-blur-sm shadow-lg" 
                : "bg-primary/10"
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              variant === "gradient" && "text-white"
            )} style={{ fontFamily: "'Courier New', Courier, monospace" }}>
              {title}
            </h2>
            {description && (
              <p className={cn(
                "text-sm leading-relaxed",
                variant === "gradient" ? "text-white/90" : "text-muted-foreground"
              )} style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                {description}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex-shrink-0 relative z-10">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}


import * as React from "react"
import { cn } from "@/lib/utils"

// Context to share closing state
const SheetContext = React.createContext<{ isClosing: boolean }>({ isClosing: false })

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  const [isClosing, setIsClosing] = React.useState(false)
  const [shouldRender, setShouldRender] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setShouldRender(true)
      setIsClosing(false)
      document.body.style.overflow = "hidden"
    } else if (shouldRender) {
      setIsClosing(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
        document.body.style.overflow = ""
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open, shouldRender])

  if (!shouldRender) return null

  return (
    <SheetContext.Provider value={{ isClosing }}>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
          isClosing ? "animate-fade-out" : "animate-backdrop-fade"
        )}
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </SheetContext.Provider>
  )
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children, ...props }, ref) => {
    const { isClosing } = React.useContext(SheetContext)
    
    return (
      <div
        ref={ref}
        className={cn(
          "fixed z-50 gap-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-2xl",
          side === "right" && "inset-y-0 right-0 h-full w-[85%] border-l sm:max-w-sm",
          side === "left" && "inset-y-0 left-0 h-full w-[85%] border-r sm:max-w-sm",
          side === "top" && "inset-x-0 top-0 border-b",
          side === "bottom" && "inset-x-0 bottom-0 border-t rounded-t-3xl",
          // Opening animations
          !isClosing && side === "right" && "animate-slide-in-right",
          !isClosing && side === "left" && "animate-slide-in-left",
          !isClosing && side === "top" && "animate-slide-down",
          !isClosing && side === "bottom" && "animate-slide-up",
          // Closing animations
          isClosing && side === "right" && "animate-slide-out-right",
          isClosing && side === "left" && "animate-slide-out-left",
          isClosing && side === "top" && "animate-slide-out-up",
          isClosing && side === "bottom" && "animate-slide-out-down",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }

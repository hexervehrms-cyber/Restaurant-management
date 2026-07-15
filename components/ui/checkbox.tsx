/**
 * Checkbox Component
 * Simple native HTML checkbox with custom styling
 */

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <div className="relative inline-flex">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer h-4 w-4 shrink-0 border border-primary rounded-sm cursor-pointer appearance-none bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-primary checked:border-primary",
          className
        )}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <Check className="absolute h-4 w-4 text-primary-foreground pointer-events-none top-0 left-0 opacity-0 peer-checked:opacity-100 transition-opacity" />
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }


"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

const Label = React.forwardRef(({ className, ...props }, ref) =>
  React.createElement(LabelPrimitive.Root, {
    ref,
    className: `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`.trim(),
    ...props,
  })
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

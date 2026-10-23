import { Suspense } from "react"
import { PricingSkeleton } from "./PricingClient"

export default function PricingLayout({ children }) {
  return (
    <Suspense fallback={<PricingSkeleton />}>
      {children}
    </Suspense>
  )
}
import { PricingContent, PricingSkeleton } from "./PricingClient"
import { Suspense } from "react"

export default function PricingPage({ searchParams }) {
  return (
    <Suspense fallback={<PricingSkeleton />}>
      <PricingContent searchParams={searchParams} />
    </Suspense>
  )
}
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopVendorsProps {
  vendors: Array<{ totalAmount: number; vendorName: string }>
}

const formatCurrency = (num: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(num || 0)

export function TopVendors({ vendors }: TopVendorsProps) {
  if (!vendors?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No vendor data available.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxAmount = Math.max(...vendors.map((v) => v.totalAmount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {vendors.slice(0, 5).map((vendor, index) => (
            <div
              key={`${vendor.vendorName}-${index}`}
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Vendor Name + Rank + Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {index + 1}.
                  </span>
                  <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {vendor.vendorName}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency(vendor.totalAmount)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary/40 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary/60 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${(vendor.totalAmount / maxAmount) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

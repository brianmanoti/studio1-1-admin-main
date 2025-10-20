import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopVendorsProps {
  vendors: Array<{ totalAmount: number; vendorName: string }>
}

export function TopVendors({ vendors }: TopVendorsProps) {
  const maxAmount = Math.max(...vendors.map((v) => v.totalAmount), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {vendors.slice(0, 5).map((vendor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{vendor.vendorName}</p>
                <p className="text-sm font-semibold text-primary">${vendor.totalAmount.toLocaleString()}</p>
              </div>
              <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-500"
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

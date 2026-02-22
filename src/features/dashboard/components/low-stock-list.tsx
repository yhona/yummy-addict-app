import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useDashboardStats } from "../api/analytics"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function LowStockList() {
    const { data, isLoading } = useDashboardStats()
    const lowStockItems = data?.lowStockItems || []

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>
                    {lowStockItems.length} items need attention.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {isLoading ? (
                         [1, 2, 3].map(i => <div key={i} className="flex items-center space-x-4"><div className="h-9 w-9 rounded-full bg-muted animate-pulse"/><div className="space-y-1"><div className="h-4 w-32 bg-muted animate-pulse"/><div className="h-4 w-24 bg-muted animate-pulse"/></div></div>)
                    ) : (
                        lowStockItems.length === 0 ? (
                            <div className="text-sm text-center text-muted-foreground py-4">No low stock items.</div>
                        ) : (
                            lowStockItems.map((item: any) => (
                                <div key={item.id} className="flex items-center">
                                    <Avatar className="h-9 w-9 rounded-md border">
                                        <AvatarImage src={item.image} alt={item.name} />
                                        <AvatarFallback className="rounded-md">{item.name?.[0] || 'P'}</AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4 space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none truncate max-w-[180px]">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            SKU: {item.sku}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium flex flex-col items-end gap-1">
                                         <Badge variant="destructive" className="h-5 text-[10px] px-1.5 py-0">
                                            {item.currentStock} left
                                         </Badge>
                                         <span className="text-[10px] text-muted-foreground">Min: {item.minStock}</span>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

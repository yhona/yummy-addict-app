import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDashboardStats } from "../api/analytics"
import { DollarSign, ShoppingBag, AlertTriangle } from "lucide-react" // Updated icon import to include AlertTriangle
import { formatCurrency } from "@/lib/utils"

export function StatsGrid() {
    const { data, isLoading } = useDashboardStats()
    const stats = data?.stats

    if (isLoading) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"/>)}
        </div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.salesToday || 0)}</div>
                    <p className="text-xs text-muted-foreground">Today's revenue</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.transactionsToday || 0}</div>
                    <p className="text-xs text-muted-foreground">Orders today</p>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingOrdersCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Waiting for payment</p>
                </CardContent>
            </Card>
             <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.lowStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Items below limit</p>
                </CardContent>
            </Card>
        </div>
    )
}

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useChartData } from "../api/analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SalesChart() {
    const { data, isLoading } = useChartData()

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                {isLoading ? (
                    <div className="h-[350px] bg-muted animate-pulse rounded-lg" />
                ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data || []}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `Rp ${value/1000}k`}
                        />
                         <Tooltip 
                            formatter={(value: number) => [`Rp ${value.toLocaleString()}`, 'Total']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                         />
                        <Bar
                            dataKey="total"
                            fill="currentColor"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

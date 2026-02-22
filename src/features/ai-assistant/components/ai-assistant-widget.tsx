import { useState, useMemo } from 'react'
import { Bot, X, Send, BarChart3, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useChat } from '@ai-sdk/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface ChartData {
  title: string
  data: { name: string; value: number }[]
  type: 'bar' | 'line'
}

function ChartRenderer({ content }: { content: string }) {
  try {
    const data: ChartData = JSON.parse(content)
    return (
      <div className="mt-4 h-64 w-full rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h4 className="mb-4 text-sm font-semibold">{data.title}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              className="text-muted-foreground"
            />
            <YAxis 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `Rp${value}`} 
              className="text-muted-foreground"
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  } catch (e) {
    return <pre className="whitespace-pre-wrap font-mono text-xs text-red-500">Error rendering chart: Invalid JSON</pre>
  }
}

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: 'http://localhost:3001/api/chat',
    initialMessages: [
      { id: '1', role: 'assistant', content: 'Halo! Saya asisten AI Anda. Apa yang bisa saya bantu hari ini?' }
    ]
  })

  // Helper for quick actions
  const handleQuickAction = (text: string) => {
    if (!isOpen) setIsOpen(true)
    append({ role: 'user', content: text })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="mb-4 w-96 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 md:w-[450px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-primary p-4 text-primary-foreground">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Dashboard Assistant
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[90%] rounded-lg p-3 text-sm",
                    msg.role === 'user' 
                      ? "ml-auto bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                     <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            const isChart = match && match[1] === 'json-chart'
                            
                            if (isChart) {
                                return <ChartRenderer content={String(children).replace(/\n$/, '')} />
                            }

                            return match ? (
                              <pre className="mt-2 w-full overflow-x-auto rounded bg-slate-950 p-2 text-xs text-slate-50">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-muted-foreground/20 rounded px-1 py-0.5 font-mono text-xs" {...props}>
                                {children}
                              </code>
                            )
                          },
                          table: ({node, ...props}) => <div className="my-2 w-full overflow-y-auto"><table className="w-full text-left border-collapse text-xs" {...props} /></div>,
                          th: ({node, ...props}) => <th className="border p-1 bg-muted/50 font-semibold" {...props} />,
                          td: ({node, ...props}) => <td className="border p-1" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted text-muted-foreground w-fit max-w-[80%] rounded-lg p-3 text-sm animate-pulse">
                    Sedang berpikir...
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 p-4 pt-0">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input 
                placeholder="Tanya sesuatu..." 
                value={input}
                onChange={handleInputChange}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex flex-wrap gap-1 mt-2">
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleQuickAction('Cek stok produk yang menipis')}>
                <Package className="mr-1 h-3 w-3" /> Stok
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleQuickAction('Tampilkan 5 pesanan terbaru')}>
                <ShoppingCart className="mr-1 h-3 w-3" /> Orders
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleQuickAction('Analisis performa penjualan 7 hari terakhir')}>
                <BarChart3 className="mr-1 h-3 w-3" /> Sales
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      <Button 
        size="icon" 
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  )
}

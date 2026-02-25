export type ShippingStatus = 'pending' | 'shipped' | 'delivered' | 'returned' | 'failed'
export type DeliveryMethod = 'pickup' | 'delivery'

export interface Shipment {
  id: string
  orderNumber: string
  orderDate: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  items: ShipmentItem[]
  courierId?: string
  courierName?: string
  courierCode?: string
  trackingNumber?: string
  shippingCost: number
  deliveryMethod: DeliveryMethod
  shippingStatus: ShippingStatus
  statusHistory: ShipmentStatusHistory[]
  orderStatus: string
  finalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ShipmentItem {
  productName: string
  sku: string
  qty: number
  price: number
  subtotal: number
}

export interface ShipmentStatusHistory {
  status: ShippingStatus
  date: string
  note?: string
  updatedBy?: string
}

export interface ShipmentSummary {
  pending: number
  shipped: number
  delivered: number
  returned: number
  failed: number
  totalShippingCost: number
}

export interface ShipmentsResponse {
  data: Shipment[]
  summary: ShipmentSummary
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UpdateShipmentRequest {
  courierId?: string
  courierName?: string
  trackingNumber?: string
  shippingStatus?: ShippingStatus
  shippingCost?: number
  statusNote?: string
}

export interface BulkUpdateResiRequest {
  items: {
    orderNumber: string
    courierName: string
    trackingNumber: string
  }[]
}

export interface BulkUpdateResiResponse {
  success: number
  failed: number
  errors: string[]
}

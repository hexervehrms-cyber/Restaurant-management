'use client'

import { useState } from 'react'
import { Search, Plus, Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const inventoryItems = [
  {
    id: 1,
    name: 'Saffron (Kashmiri)',
    sku: 'SF-001',
    category: 'Spices',
    quantity: 120,
    unit: 'grams',
    reorderLevel: 150,
    price: 2400,
    status: 'low-stock',
  },
  {
    id: 2,
    name: 'Ghee (Clarified Butter)',
    sku: 'GB-001',
    category: 'Oils & Fats',
    quantity: 45,
    unit: 'liters',
    reorderLevel: 30,
    price: 650,
    status: 'in-stock',
  },
  {
    id: 3,
    name: 'Cumin Seeds',
    sku: 'CS-001',
    category: 'Spices',
    quantity: 85,
    unit: 'kg',
    reorderLevel: 50,
    price: 450,
    status: 'in-stock',
  },
  {
    id: 4,
    name: 'Turmeric Powder',
    sku: 'TP-001',
    category: 'Spices',
    quantity: 22,
    unit: 'kg',
    reorderLevel: 40,
    price: 280,
    status: 'critical',
  },
  {
    id: 5,
    name: 'Paneer (Cottage Cheese)',
    sku: 'PN-001',
    category: 'Dairy',
    quantity: 8,
    unit: 'kg',
    reorderLevel: 10,
    price: 550,
    status: 'critical',
  },
  {
    id: 6,
    name: 'Basmati Rice',
    sku: 'BR-001',
    category: 'Grains',
    quantity: 200,
    unit: 'kg',
    reorderLevel: 100,
    price: 120,
    status: 'in-stock',
  },
  {
    id: 7,
    name: 'Tomato (Fresh)',
    sku: 'TM-001',
    category: 'Vegetables',
    quantity: 15,
    unit: 'kg',
    reorderLevel: 25,
    price: 60,
    status: 'low-stock',
  },
  {
    id: 8,
    name: 'Ginger-Garlic Paste',
    sku: 'GG-001',
    category: 'Pastes',
    quantity: 5,
    unit: 'kg',
    reorderLevel: 15,
    price: 180,
    status: 'critical',
  },
]

export function InventoryView() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">In Stock</Badge>
      case 'low-stock':
        return <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20">Low Stock</Badge>
      case 'critical':
        return <Badge variant="destructive" className="bg-destructive/10 hover:bg-destructive/20">Critical</Badge>
      default:
        return null
    }
  }

  const criticalCount = inventoryItems.filter((i) => i.status === 'critical').length
  const lowStockCount = inventoryItems.filter((i) => i.status === 'low-stock').length
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.quantity * item.price, 0)

  return (
    <div className="flex-1 space-y-6 p-6 pb-20">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{inventoryItems.length}</p>
            </div>
            <Package className="size-8 text-muted-foreground/50" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">₹{(totalValue / 1000).toFixed(1)}K</p>
            </div>
            <TrendingDown className="size-8 text-muted-foreground/50" />
          </div>
        </Card>
        <Card className={cn('p-4', lowStockCount > 0 && 'border-warning/50 bg-warning/5')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Low Stock Items</p>
              <p className={cn('text-2xl font-bold', lowStockCount > 0 && 'text-warning')}>
                {lowStockCount}
              </p>
            </div>
            <AlertTriangle className={cn('size-8 text-muted-foreground/50', lowStockCount > 0 && 'text-warning')} />
          </div>
        </Card>
        <Card className={cn('p-4', criticalCount > 0 && 'border-destructive/50 bg-destructive/5')}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Critical Items</p>
              <p className={cn('text-2xl font-bold', criticalCount > 0 && 'text-destructive')}>
                {criticalCount}
              </p>
            </div>
            <AlertTriangle className={cn('size-8 text-muted-foreground/50', criticalCount > 0 && 'text-destructive')} />
          </div>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                    </span>
                    {item.quantity < item.reorderLevel && (
                      <p className="text-xs text-muted-foreground">Below {item.reorderLevel}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₹{item.price}</TableCell>
                  <TableCell className="text-right font-medium">₹{(item.quantity * item.price).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No inventory items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

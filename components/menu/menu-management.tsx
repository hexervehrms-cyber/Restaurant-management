'use client'

import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Star, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { menuItems, menuCategories, type MenuItem } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

function MenuItemRow({ item }: { item: MenuItem }) {
  const [available, setAvailable] = useState(item.isAvailable)

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
      {/* Veg / non-veg */}
      <div className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-sm border-2',
        item.isVeg ? 'border-success' : 'border-destructive'
      )}>
        <div className={cn(
          'size-2 rounded-full',
          item.isVeg ? 'bg-success' : 'bg-destructive'
        )} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.name}</span>
          {item.tags?.includes('bestseller') && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">Bestseller</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
      </div>

      {/* Category */}
      <Badge variant="outline" className="hidden sm:flex text-xs capitalize shrink-0">
        {item.category}
      </Badge>

      {/* Rating */}
      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Star className="size-3 fill-warning text-warning" />
        {item.rating}
      </div>

      {/* Prep time */}
      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="size-3" />
        {item.prepTime}m
      </div>

      {/* Price */}
      <span className="text-sm font-semibold shrink-0">₹{item.price}</span>

      {/* Toggle availability */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => setAvailable((a) => !a)}
      >
        {available ? (
          <ToggleRight className="size-4 text-success" />
        ) : (
          <ToggleLeft className="size-4 text-muted-foreground" />
        )}
      </Button>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="size-7">
          <Edit2 className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7 hover:text-destructive">
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function MenuManagement() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = menuItems.filter((item) => {
    const matchCat = category === 'all' || item.category === category
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const catCounts = menuCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = cat.id === 'all'
      ? menuItems.length
      : menuItems.filter((i) => i.category === cat.id).length
    return acc
  }, {})

  return (
    <main className="flex flex-col gap-6 p-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Items', value: menuItems.length },
          { label: 'Available', value: menuItems.filter((i) => i.isAvailable).length },
          { label: 'Veg Items', value: menuItems.filter((i) => i.isVeg).length },
          { label: 'Categories', value: menuCategories.length - 1 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="pl-8 h-9"
          />
        </div>
        <Button size="sm" className="gap-1.5 h-9">
          <Plus className="size-4" />
          Add Item
        </Button>
      </div>

      {/* Category tabs */}
      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
          {menuCategories.map((cat) => (
            <TabsTrigger
              key={cat.id}
              value={cat.id}
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs h-8 px-3"
            >
              {cat.label}
              <span className="ml-1.5 text-[10px] opacity-70">({catCounts[cat.id] ?? 0})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table */}
      <Card className="overflow-hidden">
        <CardHeader className="py-0">
          <div className="flex items-center gap-4 py-3 px-4 border-b border-border bg-muted/20">
            <span className="w-4" />
            <span className="flex-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</span>
            <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-wide w-20">Category</span>
            <span className="hidden md:block text-xs font-medium text-muted-foreground uppercase tracking-wide w-12">Rating</span>
            <span className="hidden md:block text-xs font-medium text-muted-foreground uppercase tracking-wide w-12">Time</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-14 text-right">Price</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide w-8">Live</span>
            <span className="w-16" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-sm text-muted-foreground">No items found</p>
              </div>
            ) : (
              filtered.map((item) => <MenuItemRow key={item.id} item={item} />)
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

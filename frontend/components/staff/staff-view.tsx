'use client'

import { useState } from 'react'
import { Search, Plus, Users, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const staffMembers = [
  {
    id: 1,
    name: 'Chef Rajesh',
    role: 'Head Chef',
    email: 'rajesh@restaurant.com',
    phone: '+91-98765-43220',
    status: 'working',
    shiftStart: '10:00 AM',
    shiftEnd: '10:00 PM',
    joinDate: '2023-05-15',
  },
  {
    id: 2,
    name: 'Priya Verma',
    role: 'Sous Chef',
    email: 'priya@restaurant.com',
    phone: '+91-98765-43221',
    status: 'working',
    shiftStart: '12:00 PM',
    shiftEnd: '11:00 PM',
    joinDate: '2023-08-20',
  },
  {
    id: 3,
    name: 'Arjun Kumar',
    role: 'Line Cook',
    email: 'arjun@restaurant.com',
    phone: '+91-98765-43222',
    status: 'off-duty',
    shiftStart: '6:00 PM',
    shiftEnd: '2:00 AM',
    joinDate: '2023-11-10',
  },
  {
    id: 4,
    name: 'Anjali Patel',
    role: 'Server',
    email: 'anjali@restaurant.com',
    phone: '+91-98765-43223',
    status: 'working',
    shiftStart: '11:00 AM',
    shiftEnd: '11:00 PM',
    joinDate: '2024-01-08',
  },
  {
    id: 5,
    name: 'Vikram Singh',
    role: 'Server',
    email: 'vikram@restaurant.com',
    phone: '+91-98765-43224',
    status: 'off-duty',
    shiftStart: '5:00 PM',
    shiftEnd: '1:00 AM',
    joinDate: '2024-02-14',
  },
  {
    id: 6,
    name: 'Deepak Reddy',
    role: 'Manager',
    email: 'deepak@restaurant.com',
    phone: '+91-98765-43225',
    status: 'working',
    shiftStart: '9:00 AM',
    shiftEnd: '9:00 PM',
    joinDate: '2023-03-20',
  },
]

export function StaffView() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStaff = staffMembers.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Working</Badge>
      case 'off-duty':
        return <Badge variant="secondary">Off Duty</Badge>
      case 'on-leave':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">On Leave</Badge>
      default:
        return null
    }
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'Head Chef': 'bg-purple-100 text-purple-800',
      'Sous Chef': 'bg-blue-100 text-blue-800',
      'Line Cook': 'bg-orange-100 text-orange-800',
      'Manager': 'bg-green-100 text-green-800',
      'Server': 'bg-slate-100 text-slate-800',
    }
    return roleColors[role] || 'bg-slate-100 text-slate-800'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const workingCount = staffMembers.filter((s) => s.status === 'working').length
  const totalCount = staffMembers.length

  return (
    <div className="flex-1 space-y-6 p-6 pb-20">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Users className="size-8 text-muted-foreground/50" />
          </div>
        </Card>
        <Card className="p-4 border-success/50 bg-success/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Currently Working</p>
              <p className="text-2xl font-bold text-success">{workingCount}</p>
            </div>
            <Clock className="size-8 text-success/50" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Off Duty</p>
              <p className="text-2xl font-bold">{totalCount - workingCount}</p>
            </div>
            <Users className="size-8 text-muted-foreground/50" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Roles</p>
              <p className="text-2xl font-bold">{new Set(staffMembers.map(s => s.role)).size}</p>
            </div>
            <AlertCircle className="size-8 text-muted-foreground/50" />
          </div>
        </Card>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, role, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Staff
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Join Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50 cursor-pointer transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.shiftStart} - {member.shiftEnd}
                  </TableCell>
                  <TableCell>{getStatusBadge(member.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.joinDate}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No staff members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

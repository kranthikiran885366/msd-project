'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function SecurityPage() {
  const { toast } = useToast()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('roles')

  // Form states
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'roles') {
        const [rolesData, permissionsData] = await Promise.all([
          apiClient.request('/security/roles'),
          apiClient.request('/security/permissions'),
        ])
        setRoles(rolesData)
        setPermissions(permissionsData)
      } else if (activeTab === 'audit') {
        const logsData = await apiClient.request('/security/audit-logs?limit=100')
        setAuditLogs(logsData.logs)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async (e) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const newRole = await apiClient.request('/security/roles', {
        method: 'POST',
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription,
          permissions: selectedPermissions,
        }),
      })
      setRoles([...roles, newRole])
      setNewRoleName('')
      setNewRoleDescription('')
      setSelectedPermissions([])
      toast({
        title: 'Success',
        description: 'Role created successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteRole = async (roleId) => {
    try {
      await apiClient.request(`/security/roles/${roleId}`, {
        method: 'DELETE',
      })
      setRoles(roles.filter((r) => r._id !== roleId))
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: 'destructive',
      developer: 'default',
      viewer: 'secondary',
      editor: 'outline',
    }
    return colors[roleName.toLowerCase()] || 'default'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security & Access Control</h1>
      </div>

      {/* Tabs Navigation */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'roles'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Roles Management
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'audit'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Create Role Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">Create Role</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    placeholder="e.g., Developer, Manager"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="role-desc">Description</Label>
                  <Input
                    id="role-desc"
                    placeholder="Role description"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Permissions</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto border rounded p-2">
                    {permissions.map((perm) => (
                      <label key={perm._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm._id])
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter((p) => p !== perm._id)
                              )
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Role
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Roles List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Roles ({roles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {roles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No roles created yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role._id}>
                          <TableCell>
                            <Badge variant={getRoleBadgeColor(role.name)}>{role.name}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {role.description || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {role.permissions?.length || 0} permissions
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs ({auditLogs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No audit logs yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>
                            <Badge>{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.resourceType}: {log.resourceId?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {log.userId?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

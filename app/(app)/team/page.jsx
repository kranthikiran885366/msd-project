"use client"

import { useState } from "react"
import { useAppStore } from "@/store/use-app-store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Trash2, Users } from "lucide-react"

export default function TeamPage() {
  const { team, teamGroups, ssoConfig, billingContacts, inviteMember, changeRole, removeMember,
          addTeamGroup, updateTeamGroup, removeTeamGroup, updateSSOConfig, clearSSOConfig,
          addBillingContact, updateBillingContact, removeBillingContact, setDefaultBillingContact } = useAppStore()
  
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("developer")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("members")

  const [newGroup, setNewGroup] = useState({ name: "", description: "" })
  const [ssoForm, setSSOForm] = useState(ssoConfig || { provider: "google", clientId: "", clientSecret: "" })
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" })

  async function invite() {
    if (!email.trim()) return
    setLoading(true)
    try {
      await inviteMember({ email, role })
      setEmail("")
      setRole("developer")
    } finally {
      setLoading(false)
    }
  }

  async function createGroup() {
    if (!newGroup.name) return
    await addTeamGroup(newGroup)
    setNewGroup({ name: "", description: "" })
  }

  async function saveSSOConfig() {
    await updateSSOConfig(ssoForm)
  }

  async function createBillingContact() {
    if (!newContact.email) return
    await addBillingContact(newContact)
    setNewContact({ name: "", email: "", phone: "" })
  }

  const roleConfig = {
    owner: { color: "bg-purple-500", description: "Full access to all resources" },
    admin: { color: "bg-blue-500", description: "Can manage team and deployments" },
    developer: { color: "bg-green-500", description: "Can deploy and manage resources" },
    viewer: { color: "bg-gray-500", description: "Read-only access" },
  }

  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Team Management</h1>
          <p className="text-muted-foreground">Manage team members, groups, and access</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "members" ? "default" : "outline"}
            onClick={() => setActiveTab("members")}
          >
            Members
          </Button>
          <Button
            variant={activeTab === "groups" ? "default" : "outline"}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </Button>
          <Button
            variant={activeTab === "sso" ? "default" : "outline"}
            onClick={() => setActiveTab("sso")}
          >
            SSO
          </Button>
          <Button
            variant={activeTab === "billing" ? "default" : "outline"}
            onClick={() => setActiveTab("billing")}
          >
            Billing Contacts
          </Button>
        </div>
      </div>

      {activeTab === "members" && (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Invite Team Member</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="user@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={invite} disabled={loading} className="w-full bg-transparent" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    {loading ? "Inviting..." : "Send Invite"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {team.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No team members yet</p>
                  <p className="text-sm mt-2">Invite team members to collaborate</p>
                </CardContent>
              </Card>
            ) : (
              team.map((m) => {
                const config = roleConfig[m.role]
                return (
                  <Card key={m.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold">{m.email.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{m.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Invited {new Date(m.invitedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="hidden sm:block">
                            <Badge className={`${config.color} text-white whitespace-nowrap`}>
                              {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                            </Badge>
                          </div>
                          <select
                            className="border rounded px-2 py-1.5 text-xs bg-background"
                            value={m.role}
                            onChange={(e) => changeRole(m.id, e.target.value)}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="developer">Developer</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(m.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </>
      )}

      {activeTab === "groups" && (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Create Team Group</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="Group name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="Group description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createGroup} className="w-full" variant="outline">
                    Create Group
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {teamGroups.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No groups created yet</p>
                  <p className="text-sm mt-2">Create groups to organize team members</p>
                </CardContent>
              </Card>
            ) : (
              teamGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamGroup(group.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "sso" && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">SSO Configuration</h3>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium">Provider</label>
                <select
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  value={ssoForm.provider}
                  onChange={(e) => setSSOForm({ ...ssoForm, provider: e.target.value })}
                >
                  <option value="google">Google</option>
                  <option value="github">GitHub</option>
                  <option value="azure">Azure AD</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Client ID</label>
                <input
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  placeholder="Client ID from your SSO provider"
                  value={ssoForm.clientId}
                  onChange={(e) => setSSOForm({ ...ssoForm, clientId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Client Secret</label>
                <input
                  type="password"
                  className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                  placeholder="Client Secret from your SSO provider"
                  value={ssoForm.clientSecret}
                  onChange={(e) => setSSOForm({ ...ssoForm, clientSecret: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveSSOConfig} className="flex-1" variant="outline">
                  Save Configuration
                </Button>
                <Button onClick={clearSSOConfig} variant="ghost" className="text-destructive hover:bg-destructive/10">
                  Remove SSO
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "billing" && (
        <>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Add Billing Contact</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="Contact name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="Contact email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    className="border rounded-lg px-4 py-2 w-full mt-2 bg-background"
                    placeholder="Contact phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={createBillingContact} className="w-full" variant="outline">
                    Add Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {billingContacts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No billing contacts added</p>
                  <p className="text-sm mt-2">Add contacts to manage billing notifications</p>
                </CardContent>
              </Card>
            ) : (
              billingContacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                        {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        {contact.isDefault && (
                          <Badge className="bg-green-500 text-white">Default</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultBillingContact(contact.id)}
                          className={contact.isDefault ? 'invisible' : ''}
                        >
                          Set as Default
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBillingContact(contact.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <div className="grid gap-3">
        {team.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No team members yet</p>
              <p className="text-sm mt-2">Invite team members to collaborate</p>
            </CardContent>
          </Card>
        ) : (
          team.map((m) => {
            const config = roleConfig[m.role]
            return (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold">{m.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{m.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Invited {new Date(m.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="hidden sm:block">
                        <Badge className={`${config.color} text-white whitespace-nowrap`}>
                          {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                        </Badge>
                      </div>
                      <select
                        className="border rounded px-2 py-1.5 text-xs bg-background"
                        value={m.role}
                        onChange={(e) => changeRole(m.id, e.target.value)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="developer">Developer</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(m.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{config.description}</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

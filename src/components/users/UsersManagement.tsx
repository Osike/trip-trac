import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Users, Shield, Car, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  role: 'admin' | 'driver';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  IDNUMBER?: number;
  LICENSE_EXP?: string;
}

export const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "driver" as 'admin' | 'driver'
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    user_id: "",
    name: "",
    phone: "",
    IDNUMBER: "",
    LICENSE_EXP: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'driver'])
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch users');
        console.error('Error:', error);
        return;
      }

      setUsers((data || []) as Profile[]);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    // Check admin limit
    if (formData.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount >= 2) {
        toast.error('Maximum of 2 admins allowed in the system');
        return;
      }
    }

    try {
      const invokeCreate = async (nextEmail?: string | null) => {
        const payload: any = {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
        };
        if (nextEmail) payload.email = nextEmail; // only include if truthy; omit to auto-generate on server

        const { data, error } = await supabase.functions.invoke('create-user', {
          body: payload,
        });
        return { data, error } as { data: any; error: any };
      };

      let { data, error } = await invokeCreate(formData.email || undefined);

      if (error) {
        // Try to extract meaningful message from edge function error body
        let parsedMessage = error.message as string | undefined;
        try {
          const match = (error.message || '').match(/\{.*\}$/);
          if (match) {
            const json = JSON.parse(match[0]);
            if (json?.error) parsedMessage = json.error;
          }
        } catch {}

        // If duplicate email, offer auto-generated email fallback
        if (/already been registered|already exists|email_exists/i.test(error.message || '') && formData.email) {
          const proceed = confirm(
            'This email is already registered. Do you want to create this user with an auto-generated email instead?'
          );
          if (proceed) {
            ({ data, error } = await invokeCreate(undefined)); // omit email to let server auto-generate
          } else {
            toast.error(parsedMessage || 'Failed to create user account');
            return;
          }
        }

        if (error) {
          toast.error(parsedMessage || 'Failed to create user account');
          return;
        }
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data) {
        toast.success(`User created successfully! Email: ${data.email} | Password: ${data.temporaryPassword}`);
        setIsDialogOpen(false);
        setFormData({ name: '', phone: '', email: '', role: 'driver' });
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error?.message || 'An unexpected error occurred');
      console.error('Error:', error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to suspend ${userName}? This will permanently delete their account.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.message || 'Failed to delete user';
        toast.error(errorMessage);
        return;
      }

      if (data?.error) {
        console.error('Error from edge function:', data.error);
        toast.error(data.error);
        return;
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditFormData({
      id: user.id,
      user_id: user.user_id,
      name: user.name,
      phone: user.phone || "",
      IDNUMBER: user.IDNUMBER?.toString() || "",
      LICENSE_EXP: user.LICENSE_EXP || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const updateData: any = {
        name: editFormData.name,
        phone: editFormData.phone || null,
        IDNUMBER: editFormData.IDNUMBER ? parseFloat(editFormData.IDNUMBER) : null,
        LICENSE_EXP: editFormData.LICENSE_EXP || null
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', editFormData.user_id);

      if (error) {
        toast.error('Failed to update user');
        console.error('Error:', error);
        return;
      }

      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return Shield;
      case 'driver': return Car;
      default: return Users;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'destructive';
      case 'driver': return 'secondary';
      default: return 'secondary';
    }
  };

  const isLicenseExpiring = (licenseExpDate?: string) => {
    if (!licenseExpDate) return false;
    const expiryDate = new Date(licenseExpDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isLicenseExpired = (licenseExpDate?: string) => {
    if (!licenseExpDate) return false;
    const expiryDate = new Date(licenseExpDate);
    const today = new Date();
    return expiryDate < today;
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const driversWithExpiringLicenses = users.filter(
    user => user.role === 'driver' && (isLicenseExpiring(user.LICENSE_EXP) || isLicenseExpired(user.LICENSE_EXP))
  );

  return (
    <div className="space-y-6 p-6">
      {driversWithExpiringLicenses.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>License Expiry Warnings</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {driversWithExpiringLicenses.map(driver => {
                const expired = isLicenseExpired(driver.LICENSE_EXP);
                const daysUntilExpiry = driver.LICENSE_EXP 
                  ? Math.ceil((new Date(driver.LICENSE_EXP).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                return (
                  <div key={driver.id} className="text-sm">
                    <span className="font-medium">{driver.name}</span>
                    {expired ? (
                      <span className="text-destructive"> - License EXPIRED on {new Date(driver.LICENSE_EXP!).toLocaleDateString()}</span>
                    ) : (
                      <span> - License expires in {daysUntilExpiry} days ({new Date(driver.LICENSE_EXP!).toLocaleDateString()})</span>
                    )}
                  </div>
                );
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage your team members and their permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for your logistics team.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-grow pr-1 -mr-1 pb-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="user@example.com (leave empty for auto-generated)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/90">
                    Create User
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              All Users ({filteredUsers.length})
            </span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user, index) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <RoleIcon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{user.name}</h3>
                          {user.role === 'driver' ? (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                  License Expiry: {user.LICENSE_EXP ? new Date(user.LICENSE_EXP).toLocaleDateString() : 'Not set'}
                                </p>
                                {isLicenseExpired(user.LICENSE_EXP) && (
                                  <Badge variant="destructive" className="text-xs">
                                    Expired
                                  </Badge>
                                )}
                                {isLicenseExpiring(user.LICENSE_EXP) && !isLicenseExpired(user.LICENSE_EXP) && (
                                  <Badge variant="destructive" className="text-xs bg-orange-500 hover:bg-orange-600">
                                    Expiring Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{user.phone || 'No phone'}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">{user.phone || 'No phone number'}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={getRoleBadgeVariant(user.role) as any} className="capitalize">
                          {user.role}
                        </Badge>
                        <Badge variant={user.is_verified ? 'default' : 'secondary'}>
                          {user.is_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                        {user.role === 'driver' && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteUser(user.user_id, user.name)}
                            >
                              Suspend
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] h-[90vh] max-h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update driver information and license details.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-grow pr-1 -mr-1 pb-4">
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-idnumber">ID Number</Label>
                <Input
                  id="edit-idnumber"
                  type="number"
                  value={editFormData.IDNUMBER}
                  onChange={(e) => handleEditInputChange('IDNUMBER', e.target.value)}
                  placeholder="Enter ID number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-license">License Expiry Date</Label>
                <Input
                  id="edit-license"
                  type="date"
                  value={editFormData.LICENSE_EXP}
                  onChange={(e) => handleEditInputChange('LICENSE_EXP', e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary hover:bg-gradient-primary/90">
                  Update Driver
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
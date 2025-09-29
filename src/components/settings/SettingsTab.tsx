import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Camera, Key } from "lucide-react";

export const SettingsTab = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileName = `${user.id}/avatar.${file.name.split('.').pop()}`;
    
    setUploading(true);
    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile photo updated successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      
      if (error) throw error;

      toast({
        title: "Password reset sent",
        description: "Check your email for password reset instructions"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset",
        variant: "destructive"
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <Card className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md">
          <CardHeader className="bg-gray-50 rounded-t-xl border-b border-gray-100">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Camera className="h-5 w-5 text-primary" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-primary/30 rounded-full shadow-lg group-hover:border-primary transition-all duration-200">
                  <AvatarImage 
                    src={profile?.avatar_url || ""} 
                    alt={profile?.name || "Profile"} 
                  />
                  <AvatarFallback className="text-2xl">
                    {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md group-hover:scale-110 transition-transform duration-200">
                  <Camera className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mt-2">{profile?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
              <div className="mt-3 w-full">
                <Label className="mb-2 block text-center font-medium text-primary">Change Photo</Label>
                <div className="relative w-full flex justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    style={{ border: 'none', outline: 'none' }}
                  />
                  <Button type="button" className="w-40" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose Photo'}
                  </Button>
                </div>
                {uploading && <p className="text-sm text-muted-foreground mt-2 text-center">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
          {/* Password Reset Section */}
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                We'll send you an email with instructions to reset your password.
              </p>
              <Button 
                onClick={handlePasswordReset} 
                disabled={sendingReset}
                className="w-full"
              >
                {sendingReset ? "Sending..." : "Send Reset Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Logout Section */}
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LogOut className="h-5 w-5" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="w-full"
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;

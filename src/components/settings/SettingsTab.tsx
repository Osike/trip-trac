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
    <div className="max-w-xl mx-auto space-y-8 p-6">
      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={profile?.avatar_url || ""} 
                alt={profile?.name || "Profile"} 
              />
              <AvatarFallback className="text-lg">
                {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{profile?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
  );
};

export default SettingsTab;

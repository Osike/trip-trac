import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SettingsTab = ({ userProfile, onProfileUpdate, onPasswordReset }: any) => {
  const [profilePic, setProfilePic] = useState(userProfile?.avatar_url || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [picFile, setPicFile] = useState<File | null>(null);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPicFile(e.target.files[0]);
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePicUpload = () => {
    if (picFile && onProfileUpdate) {
      onProfileUpdate({ avatar: picFile });
    }
  };

  const handlePasswordReset = () => {
    if (newPassword === confirmPassword && onPasswordReset) {
      onPasswordReset(newPassword);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile Picture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <img
              src={profilePic || "/placeholder.svg"}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border"
            />
            <div>
              <Input type="file" accept="image/*" onChange={handlePicChange} />
              <Button className="mt-2" onClick={handlePicUpload}>
                Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handlePasswordReset} disabled={newPassword !== confirmPassword || !newPassword}>
              Reset Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;

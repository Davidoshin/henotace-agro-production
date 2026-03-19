import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Camera, Lock, Trash2 } from "lucide-react";
import { apiPut, apiPost, apiPost as apiPostForm, getBaseUrl } from "@/lib/api";

// Get base URL for image paths (without /api suffix)
const BASE_URL = getBaseUrl().replace(/\/api\/?$/, '');

interface ProfileLiteProps {
  user: any;
  onProfileUpdate?: (updated: any) => void;
}

export default function ProfileLite({ user, onProfileUpdate }: ProfileLiteProps){
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    socials: { twitter: "", linkedin: "", github: "", instagram: "" },
    profileImage: ""
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      bio: user.bio || "",
      socials: {
        twitter: user.socials?.twitter || "",
        linkedin: user.socials?.linkedin || "",
        github: user.socials?.github || "",
        instagram: user.socials?.instagram || ""
      },
      profileImage: user.profile_image ? (user.profile_image.startsWith('http') ? user.profile_image : `${BASE_URL}${user.profile_image}`) : ""
    });
  }, [user]);

  const saveProfile = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setBusy(true);
    try {
      const updatedData = await apiPut('profile/', {
        first_name: profile.firstName,
        last_name: profile.lastName,
        bio: profile.bio,
        socials: profile.socials,
      }) as any;
      if (updatedData) {
        setIsEditing(false);
        // Update localStorage to keep dashboard in sync
        if (updatedData) {
          localStorage.setItem('userData', JSON.stringify(updatedData));
        }
        const finalData = updatedData || { ...user, first_name: profile.firstName, last_name: profile.lastName, bio: profile.bio, socials: profile.socials, profile_image: profile.profileImage };
        onProfileUpdate?.(finalData);
      }
    } finally { setBusy(false); }
  };

  const uploadImage = async (file: File) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const fd = new FormData();
    fd.append('image', file);
    setBusy(true);
    try {
      const data = await apiPostForm('profile/image/', fd) as any;
      const url = data?.url || data?.profile_image || '';
      if (url) {
        // Ensure full URL
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
        setProfile(p => ({ ...p, profileImage: fullUrl }));
        // Also update user object
        if (user) {
          const updatedUser = { ...user, profile_image: fullUrl };
          localStorage.setItem('userData', JSON.stringify(updatedUser));
          onProfileUpdate?.(updatedUser);
          // Dispatch custom event to notify dashboard
          window.dispatchEvent(new CustomEvent('profile-updated'));
        }
      }
    } finally { setBusy(false); }
  };

  const changePassword = async () => {
    if (!passwords.next || passwords.next !== passwords.confirm) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setBusy(true);
    try {
      await apiPost('change-password/', {
        old_password: passwords.current || null,
        new_password: passwords.next
      });
      setPasswords({ current: "", next: "", confirm: "" });
    } finally { setBusy(false); }
  };

  const deactivate = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    await apiPost('account/deactivate/');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input value={profile.firstName} onChange={(e)=> setProfile(p=>({...p, firstName: e.target.value}))} disabled={!isEditing} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={profile.lastName} onChange={(e)=> setProfile(p=>({...p, lastName: e.target.value}))} disabled={!isEditing} />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={4} value={profile.bio} onChange={(e)=> setProfile(p=>({...p, bio: e.target.value}))} disabled={!isEditing} />
          </div>
          {!isEditing ? (
            <Button onClick={()=> setIsEditing(true)} variant="outline">Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={saveProfile} disabled={busy}><Save className="w-4 h-4 mr-1"/>Save</Button>
              <Button variant="outline" onClick={()=>{ setIsEditing(false); }}>Cancel</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage 
                src={profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${BASE_URL}${profile.profileImage}`) : undefined} 
                alt="Profile"
              />
              <AvatarFallback>{profile.firstName?.[0] || 'U'}{profile.lastName?.[0] || ''}</AvatarFallback>
            </Avatar>
            <input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (f) uploadImage(f); }} />
            <Button variant="outline" onClick={()=> fileRef.current?.click()}><Camera className="w-4 h-4 mr-1"/>Upload</Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Twitter</Label>
              <Input value={profile.socials.twitter} onChange={(e)=> setProfile(p=>({...p, socials:{...p.socials, twitter:e.target.value}}))} disabled={!isEditing} />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={profile.socials.linkedin} onChange={(e)=> setProfile(p=>({...p, socials:{...p.socials, linkedin:e.target.value}}))} disabled={!isEditing} />
            </div>
            <div>
              <Label>GitHub</Label>
              <Input value={profile.socials.github} onChange={(e)=> setProfile(p=>({...p, socials:{...p.socials, github:e.target.value}}))} disabled={!isEditing} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input value={profile.socials.instagram} onChange={(e)=> setProfile(p=>({...p, socials:{...p.socials, instagram:e.target.value}}))} disabled={!isEditing} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Current Password</Label>
              <Input type="password" value={passwords.current} onChange={(e)=> setPasswords(p=>({...p, current:e.target.value}))} />
            </div>
            <div>
              <Label>New Password</Label>
              <Input type="password" value={passwords.next} onChange={(e)=> setPasswords(p=>({...p, next:e.target.value}))} />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" value={passwords.confirm} onChange={(e)=> setPasswords(p=>({...p, confirm:e.target.value}))} />
            </div>
          </div>
          <Button onClick={changePassword} disabled={!passwords.next || passwords.next!==passwords.confirm}><Lock className="w-4 h-4 mr-1"/>Change Password</Button>
          <div className="pt-2 border-t">
            <Button variant="destructive" onClick={deactivate}><Trash2 className="w-4 h-4 mr-1"/>Deactivate Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



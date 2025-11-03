'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Globe, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/use-app-store';
import apiClient from '@/lib/api-client';

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (user) {
        setProfile({
          name: user.name || 'User',
          email: user.email || '',
          avatar: user.avatar || '👤',
          username: user.email?.split('@')[0] || 'user',
          bio: user.bio || '',
          location: user.location || '',
          company: user.company || '',
          website: user.website || '',
          createdAt: user.createdAt || new Date().toISOString(),
        });
        setTempProfile({
          name: user.name || 'User',
          email: user.email || '',
          avatar: user.avatar || '👤',
          username: user.email?.split('@')[0] || 'user',
          bio: user.bio || '',
          location: user.location || '',
          company: user.company || '',
          website: user.website || '',
        });
      }
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Error loading profile',
        description: error.message || 'Could not load profile data',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTempProfile({ ...tempProfile, [field]: value });
  };

  const handleSave = async () => {
    try {
      // Update via API
      const updatedUser = await apiClient.updateProfile(
        tempProfile.name,
        tempProfile.avatar
      );

      // Update store
      setUser(updatedUser);
      setProfile(tempProfile);
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error.message || 'Could not update profile',
        type: 'error',
      });
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-6">Could not load profile</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account profile and public information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="text-7xl">{profile.avatar}</div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  placeholder="Profile name"
                  value={tempProfile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-2xl font-bold mb-2"
                />
              ) : (
                <h2 className="text-3xl font-bold mb-2">{profile.name}</h2>
              )}
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" /> {profile.email}
              </p>
            </div>
            <div className="text-right">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">Contributions</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Username</label>
              {isEditing ? (
                <Input
                  value={tempProfile.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                />
              ) : (
                <p className="text-gray-700">@{profile.username}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={tempProfile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself"
                  className="w-full px-3 py-2 border rounded min-h-24"
                />
              ) : (
                <p className="text-gray-700">{profile.bio}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Location</label>
              {isEditing ? (
                <Input
                  value={tempProfile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              ) : (
                <p className="text-gray-700">{profile.location}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Company</label>
              {isEditing ? (
                <Input
                  value={tempProfile.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              ) : (
                <p className="text-gray-700">{profile.company}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Website</label>
              {isEditing ? (
                <Input
                  type="url"
                  value={tempProfile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              ) : (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                  <Globe className="w-4 h-4" /> {profile.website}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Public Profile
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Share2 className="w-4 h-4 mr-2" /> Share Profile
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Your public profile is visible to anyone on the platform. Control what information is shared below.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <label className="text-sm font-medium">Profile visibility</label>
              <Badge className="bg-green-100 text-green-800">Public</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <label className="text-sm font-medium">Show followers count</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <label className="text-sm font-medium">Show project list</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <label className="text-sm font-medium">Show email address</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </div>

          <Button className="w-full">Update Privacy Settings</Button>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">GitHub</label>
            <Input placeholder="github.com/username" defaultValue="" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">LinkedIn</label>
            <Input placeholder="linkedin.com/in/username" defaultValue="" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-2">Twitter</label>
            <Input placeholder="twitter.com/username" defaultValue="" />
          </div>
          <Button className="w-full">Save Social Links</Button>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm text-gray-600">Account Created</span>
              <span className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm text-gray-600">Email Verified</span>
              <Badge className="bg-green-100 text-green-800">Verified</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm text-gray-600">Team Role</span>
              <Badge>Owner</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <span className="text-sm text-gray-600">Plan</span>
              <Badge className="bg-blue-100 text-blue-800">Professional</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

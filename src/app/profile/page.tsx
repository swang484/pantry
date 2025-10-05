"use client";
import { useState, useRef, useEffect } from "react";
import Layout from "../components/Layout";

interface ProfileData {
    id: number;
    profilePicture: string | null;
    displayName: string;
    username: string;
    email: string;
    password: string;
    bio: string;
    socialLinks: {
        twitter: string;
        instagram: string;
        github: string;
        website: string;
    };
    stats?: {
        posts: number;
        likes: number;
        comments: number;
    };
}

export default function Profile() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({
        id: 1,
        profilePicture: null,
        displayName: "Loading...",
        username: "loading",
        email: "loading@example.com",
        password: "••••••••",
        bio: "Loading...",
        socialLinks: {
            twitter: "",
            instagram: "",
            github: "",
            website: ""
        }
    });

    const [tempPassword, setTempPassword] = useState<string>("••••••••");

    const [editData, setEditData] = useState<ProfileData>(profileData);

    // Fetch profile data on component mount
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

                // Fetch the first profile as current user (same logic as main page)
                const response = await fetch(`${backendBase}/api/profiles`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch profile: ${response.status}`);
                }

                const profiles = await response.json();
                if (profiles.length > 0) {
                    const currentProfile = profiles[0];
                    const profileInfo: ProfileData = {
                        id: currentProfile.id,
                        profilePicture: currentProfile.avatar,
                        displayName: currentProfile.name,
                        username: currentProfile.username,
                        email: currentProfile.email,
                        password: "••••••••",
                        bio: currentProfile.bio || "No bio yet. Tell us about yourself!",
                        socialLinks: {
                            twitter: "",
                            instagram: "",
                            github: "",
                            website: ""
                        },
                        stats: {
                            posts: currentProfile._count?.posts || 0,
                            likes: currentProfile._count?.likes || 0,
                            comments: currentProfile._count?.comments || 0
                        }
                    };

                    setProfileData(profileInfo);
                    setEditData(profileInfo);
                }
                setError(null);
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                setError(err.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleEdit = () => {
        setEditData(profileData);
        setTempPassword(editData.password);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

            const response = await fetch(`${backendBase}/api/profiles/${profileData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editData.displayName,
                    username: editData.username,
                    email: editData.email,
                    avatar: editData.profilePicture,
                    bio: editData.bio
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update profile: ${response.status}`);
            }

            const updatedProfile = await response.json();

            // Update local state with the response
            const updatedProfileData: ProfileData = {
                ...editData,
                id: updatedProfile.id,
                displayName: updatedProfile.name,
                username: updatedProfile.username,
                email: updatedProfile.email,
                profilePicture: updatedProfile.avatar,
                bio: updatedProfile.bio
            };

            setProfileData(updatedProfileData);
            setTempPassword("••••••••");
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleCancel = () => {
        setEditData(profileData);
        setTempPassword("••••••••");
        setIsEditing(false);
    };

    const handleInputChange = (field: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        setEditData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
    };

    const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setEditData(prev => ({
                    ...prev,
                    profilePicture: result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">👤</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Profile...</h3>
                        <p className="text-gray-600">Fetching your profile information</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto p-6">
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">❌</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Profile</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-200 to-beige-100 rounded-3xl p-8 mb-8 shadow-2xl">
                    <div className="flex items-center space-x-6">
                        {/* Profile Picture */}
                        <div className="relative">
                            {isEditing ? (
                                <div className="relative">
                                    <img
                                        src={editData.profilePicture || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face"}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl cursor-pointer"
                                        onClick={triggerFileInput}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <span className="text-2xl">📷</span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <img
                                    src={profileData.profilePicture || "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150&h=150&fit=crop&crop=face"}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                                />
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-gray-800">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editData.displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        className="text-3xl font-bold bg-white/80 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-colors"
                                        placeholder="Display Name"
                                    />
                                    <input
                                        type="text"
                                        value={editData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="text-xl bg-white/80 border border-gray-300 rounded-xl px-4 py-2 text-gray-800 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-colors"
                                        placeholder="Username"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{profileData.displayName}</h1>
                                    <p className="text-xl opacity-90">@{profileData.username}</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEdit}
                                    className="bg-white/80 hover:bg-white backdrop-blur-sm text-gray-800 font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-8">
                        {/* Account Information */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Account Information</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Email</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="your.email@example.com"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{profileData.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                                    {isEditing ? (
                                        <input
                                            type="password"
                                            value={editData.password}
                                            onChange={(e) => {
                                                handleInputChange('password', e.target.value);
                                                setTempPassword(e.target.value);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="Enter new password"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{tempPassword}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Bio</h3>
                            {isEditing ? (
                                <textarea
                                    value={editData.bio}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all resize-none"
                                    rows={4}
                                    placeholder="Tell us about yourself..."
                                />
                            ) : (
                                <p className="text-gray-800 text-lg leading-relaxed">{profileData.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Social Links */}
                    <div className="space-y-8">
                        {/* Social Links */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Social Links</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">🐦 Twitter</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.twitter}
                                            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="@your_handle"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{profileData.socialLinks.twitter}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">📷 Instagram</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.instagram}
                                            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="@your_handle"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{profileData.socialLinks.instagram}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">💻 GitHub</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.github}
                                            onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="github.com/your_username"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{profileData.socialLinks.github}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">🌐 Website</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.website}
                                            onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
                                            placeholder="yourwebsite.com"
                                        />
                                    ) : (
                                        <p className="text-gray-800 text-lg">{profileData.socialLinks.website}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Your Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{profileData.stats?.posts || 0}</p>
                                    <p className="text-sm text-gray-600">Posts Created</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{profileData.stats?.likes || 0}</p>
                                    <p className="text-sm text-gray-600">Likes Given</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{profileData.stats?.comments || 0}</p>
                                    <p className="text-sm text-gray-600">Comments Made</p>
                                </div>
                                <div className="bg-gray-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-orange-600">{profileData.stats?.posts || 0}</p>
                                    <p className="text-sm text-gray-600">Total Engagement</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

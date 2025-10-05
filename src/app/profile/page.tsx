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
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Loading Profile...</h3>
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
                        <h3 className="text-xl font-semibold text-amber-900 mb-2">Failed to Load Profile</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                <div className="bg-white rounded-3xl p-8 mb-8 shadow-lg">
                    <div className="flex items-center space-x-6">
                        {/* Profile Picture */}
                        <div className="relative">
                            {isEditing ? (
                                <div className="relative">
                                    <img
                                        src={editData.profilePicture || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face"}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg cursor-pointer"
                                        onClick={triggerFileInput}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face";
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
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
                                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                                />
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-amber-900">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editData.displayName}
                                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                                        className="text-3xl font-title bg-white/80 border border-gray-300 rounded-xl px-4 py-2 text-amber-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-colors"
                                        placeholder="Display Name"
                                    />
                                    <input
                                        type="text"
                                        value={editData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="text-xl bg-white/80 border border-gray-300 rounded-xl px-4 py-2 text-amber-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-300 transition-colors font-body"
                                        placeholder="Username"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-3xl font-title mb-2">{profileData.displayName}</h1>
                                    <p className="text-xl opacity-90 font-body">@{profileData.username}</p>
                                    <p className="text-sm text-gray-500 font-body mt-1">New York, NY  |  she/her</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-500 hover:bg-green-600 text-white font-body-bold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="bg-amber-1000 hover:bg-gray-600 text-white font-body-bold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleEdit}
                                    className="bg-white hover:bg-amber-100 text-amber-900 font-body-bold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-gray-300"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-8">
                        <h3 className="text-xl font-title text-amber-900 mb-6">Your Stats</h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-amber-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-title text-amber-900">{profileData.stats?.posts || 0}</p>
                                <p className="text-sm text-gray-600 font-body">Posts Created</p>
                            </div>
                            <div className="bg-amber-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-title text-amber-900">{profileData.stats?.likes || 0}</p>
                                <p className="text-sm text-gray-600 font-body">Likes Given</p>
                            </div>
                            <div className="bg-amber-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-title text-amber-900">{profileData.stats?.comments || 0}</p>
                                <p className="text-sm text-gray-600 font-body">Comments Made</p>
                            </div>
                            <div className="bg-amber-100 rounded-xl p-4 text-center">
                                <p className="text-2xl font-title text-amber-900">{profileData.stats?.posts || 0}</p>
                                <p className="text-sm text-gray-600 font-body">Total Engagement</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-8">
                        {/* Account Information */}
                        <div>
                            <h3 className="text-xl font-title text-amber-900 mb-6">Account Information</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3">Email</label>
                                    {isEditing ? (
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="your.email@example.com"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">{profileData.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3">Password</label>
                                    {isEditing ? (
                                        <input
                                            type="password"
                                            value={editData.password}
                                            onChange={(e) => {
                                                handleInputChange('password', e.target.value);
                                                setTempPassword(e.target.value);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="Enter new password"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">••••••••</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Social Links */}
                    <div className="space-y-8">
                        {/* Social Links */}
                        <div>
                            <h3 className="text-xl font-title text-amber-900 mb-6">Social Links</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3 flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                        <span>Twitter</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.twitter}
                                            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="@your_handle"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">{profileData.socialLinks.twitter}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3 flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                        </svg>
                                        <span>Instagram</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.instagram}
                                            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="@your_handle"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">{profileData.socialLinks.instagram}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3 flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span>GitHub</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.github}
                                            onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="github.com/your_username"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">{profileData.socialLinks.github}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-body-bold text-gray-700 mb-3 flex items-center space-x-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        <span>Website</span>
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.socialLinks.website}
                                            onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all font-body text-gray-900"
                                            placeholder="yourwebsite.com"
                                        />
                                    ) : (
                                        <p className="text-amber-900 text-lg font-body">{profileData.socialLinks.website}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Bio - Full Width */}
                <div className="mt-8">
                    <h3 className="text-xl font-title text-amber-900 mb-6">Bio</h3>
                    {isEditing ? (
                        <textarea
                            value={editData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all resize-none font-body text-gray-900"
                            rows={4}
                            placeholder="Tell us about yourself..."
                        />
                    ) : (
                        <p className="text-amber-900 text-lg leading-relaxed font-body">{profileData.bio}</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}

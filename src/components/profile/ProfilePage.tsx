"use client";

import { useState } from "react";
import { User, Mail, Calendar, Shield, Clock } from "lucide-react";
import EditProfileForm from "./EditProfileForm";
import ChangePasswordForm from "./ChangePasswordForm";

interface UserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  birthday: string;
  role: string;
  created_at: string;
}

interface ProfilePageProps {
  user: UserProfile;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: "badge-error", label: "Admin" },
      organizer: { color: "badge-primary", label: "Organizer" },
      user: { color: "badge-secondary", label: "User" },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.user;

    return (
      <span className={`badge ${config.color} badge-lg gap-1`}>
        <Shield className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Profile
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300 mb-6">
          <div className="card-body">
            {/* User Info Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-base-300">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">
                  {user.first_name} {user.last_name}
                </h2>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {getRoleBadge(user.role)}
                  <span className="badge badge-ghost badge-lg gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-base-content/60">Birthday</p>
                  <p className="font-semibold">{formatDate(user.birthday)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-base-content/60">Member Since</p>
                  <p className="font-semibold">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-200 p-1 mb-6">
              <button
                className={`tab flex-1 ${activeTab === "profile" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                Edit Profile
              </button>
              <button
                className={`tab flex-1 ${activeTab === "password" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("password")}
              >
                Change Password
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "profile" ? (
              <EditProfileForm user={user} />
            ) : (
              <ChangePasswordForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

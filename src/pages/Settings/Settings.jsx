import React, { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Save,
  User,
  X,
  Sparkles,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [userId, setUserId] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getErrorMessage = async (response) => {
    try {
      const data = await response.json();

      return (
        data?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        "Something went wrong."
      );
    } catch {
      return "Something went wrong. Please try again.";
    }
  };

  // =========================
  // LOAD CURRENT USER
  // =========================

  const loadUser = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = await response.json();

      const user = result?.data;

      if (!user) {
        throw new Error("User information could not be loaded.");
      }

      setUserId(user._id || user.id || "");

      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    } catch (err) {
      console.error("Load user error:", err);

      setError(
        err.message ||
          "Unable to load your profile. Please check your login session."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // =========================
  // PROFILE INPUT
  // =========================

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================
  // PASSWORD INPUT
  // =========================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPassword((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================
  // UPDATE PROFILE
  // =========================

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!profile.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!profile.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!userId) {
      setError("User ID is missing. Please refresh the page.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          name: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = await response.json();

      const updatedUser = result?.data;

      if (updatedUser) {
        setProfile({
          name: updatedUser.name || "",
          email: updatedUser.email || "",
          phone: updatedUser.phone || "",
        });
      }

      setSuccess("Profile information updated successfully.");
    } catch (err) {
      console.error("Update profile error:", err);

      setError(err.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // =========================
  // CHANGE PASSWORD
  // =========================

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password.currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!password.newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (password.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (password.currentPassword === password.newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Password changed successfully.");
    } catch (err) {
      console.error("Change password error:", err);

      setError(err.message || "Unable to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================
  // ALERT
  // =========================

  const Alert = () => {
    if (!error && !success) return null;

    if (error) {
      return (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3.5 text-xs font-semibold text-red-700 shadow-sm sm:mb-6 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
          <X
            size={18}
            className="mt-0.5 shrink-0 sm:h-5 sm:w-5"
          />

          <div className="min-w-0 flex-1">
            <p className="font-bold">Error</p>

            <p className="mt-0.5 break-words font-medium">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded-lg p-1 transition hover:bg-red-100 sm:rounded-xl"
          >
            <X size={16} className="sm:h-[18px] sm:w-[18px]" />
          </button>
        </div>
      );
    }

    return (
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3.5 text-xs font-bold text-emerald-800 shadow-sm sm:mb-6 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
        <Check
          size={18}
          className="mt-0.5 shrink-0 sm:h-5 sm:w-5"
        />

        <div className="min-w-0 flex-1">
          <p className="font-bold">Success</p>

          <p className="mt-0.5 break-words font-medium">
            {success}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSuccess("")}
          className="shrink-0 rounded-lg p-1 transition hover:bg-emerald-100 sm:rounded-xl"
        >
          <X size={16} className="sm:h-[18px] sm:w-[18px]" />
        </button>
      </div>
    );
  };

  // =========================
  // PASSWORD FIELD
  // =========================

  const PasswordField = ({
    label,
    name,
    value,
    placeholder,
    show,
    setShow,
  }) => {
    return (
      <div className="min-w-0">
        <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
          {label}
        </label>

        <div className="relative">
          <input
            type={show ? "text" : "password"}
            name={name}
            value={value}
            onChange={handlePasswordChange}
            placeholder={placeholder}
            autoComplete="new-password"
            className="h-11 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 pr-11 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:pr-12 sm:text-sm"
          />

          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8C8697] transition hover:bg-purple-50 hover:text-[#5E52B7] sm:right-3 sm:h-9 sm:w-9 sm:rounded-xl"
          >
            {show ? (
              <EyeOff size={16} className="sm:h-[18px] sm:w-[18px]" />
            ) : (
              <Eye size={16} className="sm:h-[18px] sm:w-[18px]" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 transition-all duration-300 sm:px-5 sm:pt-4 md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="h-6 w-28 animate-pulse rounded-lg bg-purple-100/80 sm:h-7 sm:w-32" />

            <div className="h-8 w-40 animate-pulse rounded-lg bg-purple-100/80 sm:h-9 sm:w-52" />

            <div className="h-3.5 w-full max-w-[340px] animate-pulse rounded bg-purple-50 sm:h-4 sm:w-80" />
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">
            <div className="h-[470px] animate-pulse rounded-2xl border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:h-[500px] sm:rounded-[24px]" />

            <div className="h-[470px] animate-pulse rounded-2xl border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] sm:h-[500px] sm:rounded-[24px]" />
          </div>
        </div>
      </section>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 transition-all duration-300 sm:px-5 sm:pt-4 md:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-6xl">

        {/* HEADER */}

        <div className="mb-5 sm:mb-7 lg:mb-8">
          <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#5E52B7] sm:gap-2 sm:px-3.5 sm:text-[11px] sm:tracking-[0.14em]">
            <Sparkles
              size={12}
              className="shrink-0 sm:h-[13px] sm:w-[13px]"
            />

            <span className="truncate">
              Preferences & Access
            </span>
          </div>

          <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
            Settings
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:mt-2 sm:text-sm">
            Manage your profile and account password from one
            central workspace.
          </p>
        </div>

        <Alert />

        {/* MAIN GRID */}

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 lg:gap-6">

          {/* =========================
              PROFILE INFORMATION
          ========================= */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

            {/* CARD HEADER */}

            <div className="border-b border-purple-50 px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6">
              <div className="flex items-start gap-3 sm:items-center sm:gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                  <User size={18} className="sm:h-5 sm:w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[15px] font-black text-[#24212C] sm:text-[17px]">
                    Profile Information
                  </h2>

                  <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                    Update your personal account information.
                  </p>
                </div>
              </div>
            </div>

            {/* PROFILE FORM */}

            <form
              onSubmit={handleProfileSubmit}
              className="p-4 sm:p-6 md:p-7"
            >

              {/* NAME */}

              <div className="mb-4 sm:mb-5">
                <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697] sm:left-4 sm:h-[17px] sm:w-[17px]"
                  />

                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Enter your name"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:pl-11 sm:pr-4 sm:text-sm"
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div className="mb-4 sm:mb-5">
                <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697] sm:left-4 sm:h-[17px] sm:w-[17px]"
                  />

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="Enter your email"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:pl-11 sm:pr-4 sm:text-sm"
                  />
                </div>
              </div>

              {/* PHONE */}

              <div className="mb-5 sm:mb-7">
                <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697] sm:left-4 sm:h-[17px] sm:w-[17px]"
                  />

                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:pl-11 sm:pr-4 sm:text-sm"
                  />
                </div>
              </div>

              {/* SAVE */}

              <button
                type="submit"
                disabled={savingProfile}
                className="button-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[48px] sm:rounded-2xl sm:py-3 sm:text-sm"
              >
                {savingProfile ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="sm:h-[18px] sm:w-[18px]" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* =========================
              CHANGE PASSWORD
          ========================= */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">

            {/* CARD HEADER */}

            <div className="border-b border-purple-50 px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6">
              <div className="flex items-start gap-3 sm:items-center sm:gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                  <KeyRound
                    size={18}
                    className="sm:h-5 sm:w-5"
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[15px] font-black text-[#24212C] sm:text-[17px]">
                    Change Password
                  </h2>

                  <p className="mt-0.5 text-[10px] font-medium leading-relaxed text-[#8C8697] sm:text-xs">
                    Keep your account secure with a strong password.
                  </p>
                </div>
              </div>
            </div>

            {/* PASSWORD FORM */}

            <form
              onSubmit={handlePasswordSubmit}
              className="p-4 sm:p-6 md:p-7"
            >

              {/* CURRENT PASSWORD */}

              <div className="mb-4 sm:mb-5">
                <PasswordField
                  label="Current Password"
                  name="currentPassword"
                  value={password.currentPassword}
                  placeholder="Enter current password"
                  show={showCurrentPassword}
                  setShow={setShowCurrentPassword}
                />
              </div>

              {/* NEW PASSWORD */}

              <div className="mb-4 sm:mb-5">
                <PasswordField
                  label="New Password"
                  name="newPassword"
                  value={password.newPassword}
                  placeholder="Enter new password"
                  show={showNewPassword}
                  setShow={setShowNewPassword}
                />

                <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-[#8C8697] sm:mt-2 sm:text-xs">
                  Password must be at least 6 characters.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}

              <div className="mb-5 sm:mb-7">
                <PasswordField
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={password.confirmPassword}
                  placeholder="Confirm new password"
                  show={showConfirmPassword}
                  setShow={setShowConfirmPassword}
                />
              </div>

              {/* CHANGE PASSWORD BUTTON */}

              <button
                type="submit"
                disabled={changingPassword}
                className="button-press inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[48px] sm:rounded-2xl sm:py-3 sm:text-sm"
              >
                {changingPassword ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating...
                  </>
                ) : (
                  <>
                    <KeyRound
                      size={16}
                      className="sm:h-[18px] sm:w-[18px]"
                    />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* SECURITY NOTE */}

        <div className="mt-4 rounded-2xl border border-purple-200/70 bg-purple-50/40 p-4 sm:mt-5 sm:rounded-[22px] sm:p-5 lg:mt-6">
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100/80 text-[#5E52B7] shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl">
              <Bell size={16} className="sm:h-[18px] sm:w-[18px]" />
            </div>

            <div className="min-w-0">
              <h3 className="text-xs font-extrabold text-[#33303A] sm:text-sm">
                Account Security
              </h3>

              <p className="mt-1 text-[10px] font-medium leading-relaxed text-[#6E687A] sm:text-xs">
                Your profile changes and password updates are saved
                directly through the backend API.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Settings;
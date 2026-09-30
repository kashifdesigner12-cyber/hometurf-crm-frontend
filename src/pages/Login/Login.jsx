import { useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://apihometurf.localpro1.net/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response received from server.");
      }

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Login failed. Please check your email and password."
        );
      }

      /*
       * Backend response:
       *
       * {
       *   success: true,
       *   data: {
       *     _id,
       *     name,
       *     email,
       *     role,
       *     phone,
       *     status,
       *     token
       *   }
       * }
       */

      const userData = result?.data;

      if (!userData?.token) {
        throw new Error("Login successful, but authentication token is missing.");
      }

      /*
       * Save the token immediately.
       *
       * Dashboard/API requests can then use:
       * Authorization: Bearer <token>
       */
      localStorage.setItem("token", userData.token);

      /*
       * Keep compatibility with the existing frontend auth code.
       */
      localStorage.setItem("accessToken", userData.token);

      localStorage.setItem("authToken", userData.token);

      /*
       * Store user data separately so AuthContext/API code
       * can use it if required.
       */
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: userData._id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
          status: userData.status,
        })
      );

      /*
       * Pass the backend user object to AuthContext.
       *
       * It contains the token as required by the backend.
       */
      login(userData);

      /*
       * Go to dashboard only after successful authentication.
       */
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error?.message ||
          "Unable to login. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#171717]">
            HomeTurf
          </h1>

          <p className="mt-2 text-sm text-[#777777]">
            Sign in to your CRM account
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#EAEAEA] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmit}>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#171717]">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hometurf.com"
                  autoComplete="email"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#EAEAEA] bg-white py-3 pl-10 pr-4 text-sm text-[#171717] outline-none transition-all placeholder:text-[#A0A0A0] focus:border-[#6C63FF] focus:ring-4 focus:ring-[#F0EEFF] disabled:cursor-not-allowed disabled:bg-[#F8F8F8]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-[#171717]">
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"
                />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#EAEAEA] bg-white py-3 pl-10 pr-4 text-sm text-[#171717] outline-none transition-all placeholder:text-[#A0A0A0] focus:border-[#6C63FF] focus:ring-4 focus:ring-[#F0EEFF] disabled:cursor-not-allowed disabled:bg-[#F8F8F8]"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-[#171717] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a2a2a] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="mt-5 text-center">
            <button
              type="button"
              className="text-sm font-medium text-[#6C63FF] transition-colors hover:text-[#574FE0]"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
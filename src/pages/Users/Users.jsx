import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../../services/userApi";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "Staff",
  status: "Active",
};

const roleOptions = ["Admin", "Manager", "Staff"];

const statusOptions = ["Active", "Inactive"];

const normalizeUsers = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.users || response?.data || [];
};

const Users = () => {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getUsers();
      setUsers(normalizeUsers(response));
    } catch (error) {
      setError(error.message || "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = user.name || "";
      const email = user.email || "";
      const phone = user.phone || "";
      const role = user.role || "";
      const status = user.status || "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase()) ||
        phone.toLowerCase().includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "All" || role === roleFilter;

      const matchesStatus =
        statusFilter === "All" || status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setShowPassword(false);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "Staff",
      status: user.status || "Active",
    });

    setShowPassword(false);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;

    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(initialForm);
    setShowPassword(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim()
    ) {
      setError("Name and email are required.");
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setError("Password is required when creating a new user.");
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status,
      };

      // Password is only sent while creating a new user.
      if (!editingUser) {
        payload.password = formData.password;
      }

      if (editingUser) {
        const response = await updateUser(
          editingUser._id,
          payload
        );

        const updatedUser =
          response?.user ||
          response?.data ||
          response;

        setUsers((previous) =>
          previous.map((user) =>
            user._id === editingUser._id
              ? updatedUser
              : user
          )
        );
      } else {
        const response = await createUser(payload);

        const newUser =
          response?.user ||
          response?.data ||
          response;

        setUsers((previous) => [
          newUser,
          ...previous,
        ]);
      }

      closeModal();
    } catch (error) {
      setError(
        error.message || "Unable to save user."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteUser(id);

      setUsers((previous) =>
        previous.filter(
          (user) => user._id !== id
        )
      );
    } catch (error) {
      setError(
        error.message || "Unable to delete user."
      );
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus =
      user.status === "Active"
        ? "Inactive"
        : "Active";

    try {
      setError("");

      const response = await updateUser(
        user._id,
        {
          status: newStatus,
        }
      );

      const updatedUser =
        response?.user ||
        response?.data ||
        response;

      setUsers((previous) =>
        previous.map((item) =>
          item._id === user._id
            ? updatedUser
            : item
        )
      );
    } catch (error) {
      setError(
        error.message ||
          "Unable to update user."
      );
    }
  };

  return (
    <section className="min-h-full w-full overflow-x-hidden bg-[#F8FAFC] px-3 pb-16 pt-3 sm:px-5 sm:pt-4 md:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">

        {/* Header */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-300/80 bg-purple-50/80 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:px-3.5 sm:py-1 sm:text-[11px] sm:tracking-[0.14em]">
              <Sparkles
                size={12}
                className="shrink-0 sm:h-[13px] sm:w-[13px]"
              />

              <span className="truncate">
                Access Control
              </span>
            </div>

            <h1 className="text-[28px] font-black tracking-[-0.04em] text-[#17151F] sm:text-[34px] md:text-[38px]">
              Users
            </h1>

            <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-[#6E687A] sm:mt-2 sm:text-sm">
              Manage CRM users, permissions and access
              rights from one central workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="button-press group inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(94,82,183,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(94,82,183,0.35)] sm:w-auto sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
          >
            <Plus
              size={16}
              className="transition-transform duration-300 group-hover:rotate-90 sm:h-[17px] sm:w-[17px]"
            />

            Add User
          </button>
        </div>

        {/* Error */}

        {error && !isModalOpen && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 shadow-sm sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm">
            <span className="min-w-0 break-words">
              {error}
            </span>

            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-xl p-1 hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Filters */}

        <div className="rounded-2xl border border-purple-200/70 bg-white p-3.5 shadow-[0_6px_25px_rgba(94,82,183,0.035)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(94,82,183,0.06)] sm:rounded-[22px] sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_170px]">
            <div className="relative min-w-0">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8697] sm:h-[17px] sm:w-[17px]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search users..."
                className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] pl-10 pr-4 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:text-sm"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="h-11 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
            >
              <option value="All">
                All Roles
              </option>

              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="h-11 w-full min-w-0 rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
            >
              <option value="All">
                All Status
              </option>

              {statusOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}

        <div className="overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-[0_10px_35px_rgba(94,82,183,0.04)] transition-all duration-500 hover:shadow-[0_15px_45px_rgba(94,82,183,0.08)] sm:rounded-[24px]">
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-purple-50 bg-purple-50/40">
                  <th className="whitespace-nowrap px-5 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    User
                  </th>

                  <th className="whitespace-nowrap px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Phone
                  </th>

                  <th className="whitespace-nowrap px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Role
                  </th>

                  <th className="whitespace-nowrap px-3 py-3.5 text-left text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-4 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-5 py-3.5 text-right text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8C8697] sm:px-8 sm:py-4 sm:text-[10px] sm:tracking-[0.14em]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-purple-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map(
                    (_, index) => (
                      <tr
                        key={index}
                        className="border-b border-purple-50"
                      >
                        <td className="px-5 py-4 sm:px-8 sm:py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-purple-100/80 sm:h-11 sm:w-11 sm:rounded-2xl" />

                            <div>
                              <div className="h-3.5 w-28 animate-pulse rounded-md bg-purple-100/80 sm:w-36" />

                              <div className="mt-2.5 h-3 w-32 animate-pulse rounded-md bg-purple-50 sm:w-40" />
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 sm:px-4 sm:py-5">
                          <div className="h-3.5 w-24 animate-pulse rounded-md bg-purple-100/80" />
                        </td>

                        <td className="px-3 py-4 sm:px-4 sm:py-5">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-purple-100/80" />
                        </td>

                        <td className="px-3 py-4 sm:px-4 sm:py-5">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-purple-100/80" />
                        </td>

                        <td className="px-5 py-4 sm:px-8 sm:py-5">
                          <div className="ml-auto h-9 w-24 animate-pulse rounded-xl bg-purple-100/80 sm:h-10 sm:w-28" />
                        </td>
                      </tr>
                    )
                  )
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-12 text-center sm:px-6 sm:py-16"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5E52B7] shadow-md sm:h-20 sm:w-20 sm:rounded-3xl">
                        <UserCog
                          size={24}
                          className="sm:h-7 sm:w-7"
                        />
                      </div>

                      <h3 className="mt-5 text-sm font-black text-[#33303A] sm:mt-6 sm:text-base">
                        No users found
                      </h3>

                      <p className="mt-2 text-[11px] font-medium text-[#8C8697] sm:text-xs">
                        There are no users matching
                        your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isActive =
                      user.status === "Active";

                    return (
                      <tr
                        key={user._id}
                        className="transition hover:bg-purple-50/50"
                      >
                        <td className="px-5 py-4 sm:px-8 sm:py-5">
                          <div className="flex items-center gap-3 sm:gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 text-xs font-black text-[#5E52B7] shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                              {(user.name || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[180px] truncate text-xs font-bold text-[#33303A] sm:max-w-[250px] sm:text-sm">
                                {user.name || "-"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-[10px] font-medium text-[#8C8697] sm:max-w-[250px] sm:text-xs">
                                {user.email || "-"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-4 text-xs font-medium text-[#6E687A] sm:px-4 sm:py-5 sm:text-sm">
                          <span className="whitespace-nowrap">
                            {user.phone || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-4 sm:px-4 sm:py-5">
                          <span className="inline-flex whitespace-nowrap rounded-xl border border-purple-200/80 bg-purple-50/70 px-2.5 py-1.5 text-[10px] font-bold text-[#5E52B7] sm:px-3.5 sm:text-[11px]">
                            {user.role || "-"}
                          </span>
                        </td>

                        <td className="px-3 py-4 sm:px-4 sm:py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-extrabold shadow-sm sm:px-3.5 sm:text-[11px] ${
                              isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-gray-200 bg-gray-100 text-gray-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${
                                isActive
                                  ? "bg-emerald-500"
                                  : "bg-gray-400"
                              }`}
                            />

                            {user.status || "-"}
                          </span>
                        </td>

                        <td className="px-5 py-4 sm:px-8 sm:py-5">
                          <div className="flex justify-end gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(user)
                              }
                              title={
                                isActive
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all hover:scale-110 sm:h-9 sm:w-9 sm:rounded-xl ${
                                isActive
                                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                              }`}
                            >
                              <Check
                                size={14}
                                className="sm:h-4 sm:w-4"
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(user)
                              }
                              title="Edit"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shadow-sm transition-all hover:scale-110 hover:bg-blue-600 hover:text-white sm:h-9 sm:w-9 sm:rounded-xl"
                            >
                              <Pencil
                                size={14}
                                className="sm:h-4 sm:w-4"
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(user._id)
                              }
                              title="Delete"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 shadow-sm transition-all hover:scale-110 hover:bg-red-500 hover:text-white sm:h-9 sm:w-9 sm:rounded-xl"
                            >
                              <Trash2
                                size={14}
                                className="sm:h-4 sm:w-4"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading &&
            filteredUsers.length > 0 && (
              <div className="border-t border-purple-50 bg-purple-50/30 px-4 py-2.5 text-center text-[9px] font-medium text-[#8C8697] sm:hidden">
                Swipe left or right to view all user
                details
              </div>
            )}
        </div>
      </div>

      {/* Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 px-3 py-4 backdrop-blur-[4px] sm:px-4 sm:py-6">
          <div className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-purple-200/60 bg-white shadow-[0_25px_80px_rgba(94,82,183,0.2)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[26px]">

            {/* Modal Header */}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-purple-50 bg-white px-4 py-4 sm:px-7 sm:py-6">
              <div className="min-w-0">
                <div className="mb-1.5 inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#5E52B7] sm:mb-2 sm:text-[11px] sm:tracking-[0.14em]">
                  <UserCog
                    size={12}
                    className="sm:h-[13px] sm:w-[13px]"
                  />

                  User Profile
                </div>

                <h2 className="text-lg font-black text-[#17151F] sm:text-xl">
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>

                <p className="mt-1 text-[10px] font-medium text-[#8C8697] sm:text-xs">
                  {editingUser
                    ? "Update user information"
                    : "Create a new CRM user"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#5E52B7] transition-all duration-200 hover:rotate-90 hover:bg-purple-100 sm:h-10 sm:w-10"
              >
                <X
                  size={17}
                  className="sm:h-[19px] sm:w-[19px]"
                />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-7">

                {error && (
                  <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-semibold text-red-700 shadow-sm sm:rounded-2xl sm:px-4 sm:text-sm">
                    {error}
                  </div>
                )}

                {/* Full Name */}

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
                  />
                </div>

                {/* Email */}

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
                  />
                </div>

                {/* Phone */}

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
                  />
                </div>

                {/* Password - Only for New User */}

                {!editingUser && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 pr-11 text-xs font-medium text-[#33303A] outline-none transition-all duration-200 placeholder:text-[#A09CA7] focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:pr-12 sm:text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (previous) => !previous
                          )
                        }
                        className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8C8697] transition-colors hover:bg-purple-50 hover:text-[#5E52B7] sm:right-2 sm:h-9 sm:w-9"
                        title={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className="mt-1.5 text-[10px] font-medium text-[#8C8697] sm:text-[11px]">
                      Password must be at least 6 characters.
                    </p>
                  </div>
                )}

                {/* Role & Status */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                      Role
                    </label>

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
                    >
                      {roleOptions.map(
                        (role) => (
                          <option
                            key={role}
                            value={role}
                          >
                            {role}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-[#55515F] sm:mb-2 sm:text-xs">
                      Status
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="h-11 w-full rounded-xl border border-purple-200/80 bg-[#FAFAFB] px-3.5 text-xs font-medium text-[#55515F] outline-none transition-all duration-200 focus:border-[#5E52B7] focus:bg-white focus:ring-4 focus:ring-purple-100 sm:h-12 sm:px-4 sm:text-sm"
                    >
                      {statusOptions.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}

              <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-purple-50 bg-purple-50/20 px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-7 sm:py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-purple-200/80 bg-white px-5 py-2.5 text-xs font-bold text-[#55515F] transition-all hover:bg-purple-50 hover:text-[#5E52B7] disabled:opacity-50 sm:w-auto sm:py-3 sm:text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-press inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5E52B7] to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[130px] sm:w-auto sm:py-3 sm:text-sm"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Users;
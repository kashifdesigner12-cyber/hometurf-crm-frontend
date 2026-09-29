import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  Briefcase,
  MessageSquare,
  Mail,
  Phone,
  Star,
  Zap,
  FileText,
  Bell,
  Plug,
  UserCog,
  Settings,
  Menu,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    name: "Leads",
    icon: Users,
    path: "/leads",
  },
  {
    name: "Customers",
    icon: UserRound,
    path: "/customers",
  },
  {
    name: "Appointments",
    icon: CalendarDays,
    path: "/appointments",
  },
  {
    name: "Services",
    icon: Briefcase,
    path: "/services",
  },
  {
    name: "Conversations",
    icon: MessageSquare,
    path: "/conversations",
  },
  {
    name: "Emails",
    icon: Mail,
    path: "/emails",
  },
  {
    name: "Calls",
    icon: Phone,
    path: "/calls",
  },
  {
    name: "Reviews",
    icon: Star,
    path: "/reviews",
  },
  {
    name: "Automations",
    icon: Zap,
    path: "/automations",
  },
  {
    name: "Templates",
    icon: FileText,
    path: "/templates",
  },
  {
    name: "Notifications",
    icon: Bell,
    path: "/notifications",
  },
  {
    name: "Integrations",
    icon: Plug,
    path: "/integrations",
  },
  {
    name: "Users",
    icon: UserCog,
    path: "/users",
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-white text-[#5E52B7] shadow-[0_4px_20px_rgba(0,0,0,0.12)] scale-[1.02]"
        : "text-purple-100 hover:bg-white/10 hover:text-white"
    }`;

  const iconClass = (isActive) =>
    `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
      isActive
        ? "bg-[#EDE9FE] text-[#5E52B7] font-bold shadow-sm scale-105"
        : "bg-white/10 text-purple-200 group-hover:bg-white/20 group-hover:text-white group-hover:scale-105"
    }`;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-3 top-3 z-[60] flex h-11 w-11 items-center justify-center rounded-xl bg-[#5E52B7] text-white shadow-lg transition hover:bg-[#4F46A5] sm:left-4 sm:top-4 lg:hidden"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-[70] flex h-screen h-[100dvh] w-[min(18rem,85vw)] flex-col border-r border-indigo-950/20 bg-[#5E52B7] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="relative flex h-20 shrink-0 items-center justify-between overflow-hidden px-5 sm:px-6">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />

          <div className="relative z-10 flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 font-extrabold text-purple-950 shadow-md">
              HT
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-white drop-shadow-sm">
                HomeTurf
              </h1>

              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-200 opacity-80">
                CRM Platform
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeSidebar}
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-purple-100 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebar}
                  className={navLinkClass}
                >
                  {({ isActive }) => (
                    <>
                      <div className={iconClass(isActive)}>
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.5 : 1.9}
                          className="transition-transform duration-300"
                        />
                      </div>

                      <span className="relative z-10 min-w-0 flex-1 truncate font-medium tracking-wide">
                        {item.name}
                      </span>

                      {isActive && (
                        <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#5E52B7] shadow-sm" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Settings */}
        <div className="shrink-0 border-t border-white/10 bg-purple-900/20 p-3 sm:p-4">
          <NavLink
            to="/settings"
            onClick={closeSidebar}
            className={navLinkClass}
          >
            {({ isActive }) => (
              <>
                <div className={iconClass(isActive)}>
                  <Settings
                    size={18}
                    className="transition-transform duration-500 group-hover:rotate-90"
                  />
                </div>

                <span className="relative z-10 min-w-0 flex-1 truncate font-medium tracking-wide">
                  Settings
                </span>

                {isActive && (
                  <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#5E52B7] shadow-sm" />
                )}
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
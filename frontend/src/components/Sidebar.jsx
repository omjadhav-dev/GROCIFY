import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  MessageCircle,
  User,
  LogOut,
  Leaf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "G";

  const shopkeeperLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/products", icon: ShoppingCart, label: "Browse Products" },
    { to: "/orders", icon: Package, label: "My Orders" },
    { to: "/chat", icon: MessageCircle, label: "Messages" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const wholesalerLinks = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/products", icon: Package, label: "My Products" },
    { to: "/orders", icon: ClipboardList, label: "Incoming Orders" },
    { to: "/chat", icon: MessageCircle, label: "Messages" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const links = user?.type === "wholesaler" ? wholesalerLinks : shopkeeperLinks;

  return (
    <div className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf-600 text-white">
          <Leaf size={18} />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight text-slate-900">
          GROCIFY
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-leaf-50 text-leaf-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-harvest-500 text-sm font-bold text-white">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-800">
              {user?.name}
            </div>
            <div className="truncate text-xs capitalize text-slate-400">
              {user?.type}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

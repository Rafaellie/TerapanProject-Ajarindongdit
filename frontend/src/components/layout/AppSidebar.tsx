import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Receipt, FileText, TrendingUp, Package, Boxes, BarChart3, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: Receipt, label: "Transactions" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/analytics", icon: TrendingUp, label: "Sales Analytics" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/inventory", icon: Boxes, label: "Inventory" },
  { to: "/data", icon: BarChart3, label: "Data Management" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout, apiClient, token } = useAuth();
  const handleLogout = () => {
    logout();
    toast.success("Berhasil logout");
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center gap-3">
          <div className={cn("flex shrink-0 items-center justify-center rounded-xl bg-primary", isCollapsed ? "h-8 w-8" : "h-10 w-10")}>
            <BarChart3 className={cn("text-primary-foreground", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-sidebar-foreground truncate">FinanceHub</h1>
              <p className="text-xs text-muted-foreground truncate">Sales & Analytics</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav className="space-y-1 px-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => cn("nav-item", isCollapsed && "justify-center px-2", isActive && "nav-item-active")}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Profile Section */}
        <NavLink to="/profile" className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent", isCollapsed && "justify-center px-2", isActive && "bg-sidebar-accent")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{getInitials(user?.nama || "U")}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.nama || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "user@email.com"}</p>
            </div>
          )}
        </NavLink>
        <button onClick={handleLogout} className={cn("nav-item text-destructive hover:text-destructive hover:bg-destructive/10", isCollapsed && "justify-center px-2")}>
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

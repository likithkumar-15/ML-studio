import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AppWindow,
  ChevronsLeft,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Rocket,
  Search,
  Settings,
  Sun,
  FolderKanban,
} from "lucide-react";

import { BrandLockup, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/experiments", label: "Experiments", icon: FlaskConical },
  { to: "/deployments", label: "Deployments", icon: Rocket },
  { to: "/app-builder", label: "App Builder", icon: AppWindow },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: false }}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2",
          )}
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
          }}
          title={collapsed ? label : undefined}
        >
          <Icon className="size-4 shrink-0" />
          {collapsed ? null : label}
        </Link>
      ))}
    </nav>
  );
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/projects/")) return "Project Workspace";
  if (pathname.startsWith("/experiments/")) return "Experiment";
  if (pathname.startsWith("/apps/")) return "Generated Application";
  const match = NAV.find((item) => pathname.startsWith(item.to));
  return match?.label ?? "ML Studio";
}

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, setMode, resolved } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: location.pathname } });
    }
  }, [loading, user, navigate, location.pathname]);

  useEffect(() => {
    setCollapsed(localStorage.getItem("mlstudio-sidebar") === "collapsed");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem("mlstudio-sidebar", prev ? "expanded" : "collapsed");
      return !prev;
    });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="w-full max-w-md space-y-3 px-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const initials = (user.email ?? "U").slice(0, 2).toUpperCase();

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!search.trim()) return;
    navigate({ to: "/projects", search: { q: search.trim() } });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={cn("flex items-center px-4 pb-4", collapsed && "justify-center px-2")}>
          <Link to="/dashboard">{collapsed ? <BrandMark /> : <BrandLockup />}</Link>
        </div>
        <NavLinks collapsed={collapsed} />
        <div className="mt-auto px-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground",
              collapsed && "justify-center",
            )}
            onClick={toggleCollapsed}
          >
            <ChevronsLeft
              className={cn("size-4 transition-transform", collapsed && "rotate-180")}
            />
            {collapsed ? null : "Collapse"}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 pt-4">
                <SheetTitle className="px-4 pb-4">
                  <BrandLockup />
                </SheetTitle>
                <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <h1 className="truncate text-sm font-semibold sm:text-base">
              {pageTitle(location.pathname)}
            </h1>

            <form onSubmit={submitSearch} className="ml-auto hidden md:block">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects"
                  className="h-9 w-56 pl-8"
                  aria-label="Search projects"
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Change theme">
                    {resolved === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMode("light")}>
                    <Sun className="size-4" /> Light {mode === "light" ? "·" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMode("dark")}>
                    <Moon className="size-4" /> Dark {mode === "dark" ? "·" : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMode("system")}>
                    <Monitor className="size-4" /> System {mode === "system" ? "·" : ""}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                      {initials}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="size-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

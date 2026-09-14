import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Monitor, Moon, Sun } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { queryKeys } from "@/lib/db";
import { useProfile } from "@/lib/queries";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { PROBLEM_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ML Studio" },
      {
        name: "description",
        content: "Manage your profile, appearance and default project preferences.",
      },
      { property: "og:title", content: "Settings — ML Studio" },
      { property: "og:description", content: "Manage your profile, appearance and defaults." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const THEMES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const { mode, setMode } = useTheme();

  const [fullName, setFullName] = useState("");
  const [split, setSplit] = useState(80);
  const [problemType, setProblemType] = useState("classification");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setSplit(profile.default_split);
      setProblemType(profile.default_problem_type);
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        default_split: split,
        default_problem_type: problemType,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save your settings. Please try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    toast.success("Settings saved.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, appearance and workspace defaults." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <SectionCard title="Profile" description="How you appear inside ML Studio.">
            <div className="grid gap-4 sm:max-w-md">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isLoading ? "Loading…" : "Your name"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ""} readOnly className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Your email is tied to your sign-in and can't be changed here.
                </p>
              </div>
              <Button onClick={save} disabled={saving} className="w-fit">
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="appearance" className="mt-5">
          <SectionCard title="Appearance" description="Choose how ML Studio looks.">
            <div className="grid gap-3 sm:grid-cols-3 sm:max-w-lg">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    mode === value
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border bg-surface hover:bg-accent",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferences" className="mt-5">
          <SectionCard
            title="Preferences"
            description="Defaults applied to new projects and training runs."
          >
            <div className="grid gap-6 sm:max-w-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Default train/test split</Label>
                  <span className="text-sm font-medium tabular-nums">
                    {split}% / {100 - split}%
                  </span>
                </div>
                <Slider
                  value={[split]}
                  min={50}
                  max={95}
                  step={5}
                  onValueChange={([value]) => setSplit(value ?? 80)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-type">Default problem type</Label>
                <Select value={problemType} onValueChange={setProblemType}>
                  <SelectTrigger id="default-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROBLEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={save} disabled={saving} className="w-fit">
                {saving ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="account" className="mt-5">
          <SectionCard title="Account" description="Session and sign-out.">
            <p className="text-sm text-muted-foreground">
              You're signed in as {user?.email}. Signing out keeps all your projects and data safe.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

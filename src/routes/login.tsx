import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth711 } from "@/lib/api/711-api";

export const Route = createFileRoute("/login")({ head: () => ({ meta: [{ title: "Sign in · 711 Club" }] }), component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true);
    const response = await auth711("login", { email, password });
    setBusy(false);
    if (!response.ok) { toast.error("Invalid credentials"); return; }
    void navigate({ to: "/" });
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#0d2d2a] px-4 py-10"><Card className="w-full max-w-md border-white/10 bg-white shadow-raised"><CardHeader className="p-8 pb-4"><div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">711</div><CardTitle className="text-2xl">Sign in to 711 Club</CardTitle><p className="text-sm text-muted-foreground">Operations workspace for the WhatsApp team.</p></CardHeader><CardContent className="p-8 pt-4"><form onSubmit={(event) => void submit(event)} className="space-y-4"><label className="block text-sm font-medium">Work email<Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label className="block text-sm font-medium">Password<Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><p className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" />Your session is stored in a secure httpOnly cookie. Login errors never reveal whether an account exists.</p><Button className="w-full" size="lg" disabled={busy}>{busy ? "Signing in…" : "Continue"}<ArrowRight /></Button></form></CardContent></Card></main>;
}

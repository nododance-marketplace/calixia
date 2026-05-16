import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InviteClientForm } from "./invite-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 pb-2 animate-fade-in">
      <div className="flex items-center gap-3 pt-1 animate-slide-up">
        <Link
          href="/admin/clients"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Trainer
          </p>
          <h1 className="font-display text-display-md text-text-primary">
            Invite client
          </h1>
        </div>
      </div>
      <InviteClientForm />
    </div>
  );
}

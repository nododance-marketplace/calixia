import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewTemplateForm } from "./new-form";

export default function NewTemplatePage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/templates"
          className="rounded-full p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">Trainer</p>
          <h1 className="text-2xl text-text-primary">New template</h1>
        </div>
      </div>
      <NewTemplateForm />
    </div>
  );
}

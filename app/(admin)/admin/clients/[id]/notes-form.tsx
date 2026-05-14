"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

export function TrainerNotesForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value === initial) return;
    setStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient();
      await supabase.from("profiles").update({ trainer_notes: value }).eq("id", clientId);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    }, 600);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={10}
        placeholder="Private notes — only you can see these."
      />
      <p className="mt-2 text-[11px] text-text-secondary">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved." : "Autosaves as you type."}
      </p>
    </div>
  );
}

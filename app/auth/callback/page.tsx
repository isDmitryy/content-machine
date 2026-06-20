"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        router.replace("/");
      });
    } else {
      router.replace("/");
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07070F",
        color: "#A78BFA",
        fontFamily: "monospace",
        fontSize: "13px",
        letterSpacing: "0.1em",
      }}
    >
      Входим в систему…
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#07070F",
            color: "#A78BFA",
          }}
        >
          Загрузка…
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}

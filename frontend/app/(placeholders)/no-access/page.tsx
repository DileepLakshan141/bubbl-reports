"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NoAccess = () => {
  const router = useRouter();

  return (
    <main className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6">
      <div className="flex max-w-lg flex-col items-center text-center">
        <Image
          src="/permission_required.png"
          alt="Access denied"
          width={400}
          height={300}
          className="mb-6 object-contain"
          priority
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            403 • Forbidden
          </p>

          <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>

          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page. Please return to
            a page you have access to.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft />
            Go Back
          </Button>

          <Button onClick={() => router.push("/")}>
            <Home />
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NoAccess;

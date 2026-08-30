import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-neutral-300 mb-3 tracking-tighter">404</h1>
      <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
        Page not found
      </h2>
      <p className="text-neutral-600 max-w-sm mb-6">
        The page you are looking for does not exist or has moved.
      </p>
      <Link href="/">
        <Button variant="secondary" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

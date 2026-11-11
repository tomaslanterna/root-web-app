import { RootLoader } from "@/components/ui/RootLoader";

export default function Loading() {
  return (
    <div className="flex-1 w-full flex items-center justify-center min-h-[calc(100dvh-12rem)] py-12">
      <RootLoader size="lg" />
    </div>
  );
}

import { LoadingState } from "@/components/ui/atoms/LoadingState";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState />
    </div>
  );
}

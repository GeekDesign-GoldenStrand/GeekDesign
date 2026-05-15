import { PlusIcon } from "@/components/ui/atoms/icons";

export default function MaquinaAssignButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-none gap-3 mt-3 flex items-center justify-center border border-gray-500 rounded-[7px] p-2 text-gray-500 text-[13px] max-h-[45px] hover:bg-[#f1f1f1] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.25)]"
    >
      Asignar <PlusIcon size={10} />
    </button>
  );
}

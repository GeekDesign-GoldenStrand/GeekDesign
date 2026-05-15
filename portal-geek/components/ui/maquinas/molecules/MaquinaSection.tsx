import MaquinaSubtitle from "@/components/ui/maquinas/atoms/MaquinaSubtitle";
import MaquinaText from "@/components/ui/maquinas/atoms/MaquinaText";

export default function MaquinaSection({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="my-4">
      <MaquinaSubtitle subtitle={heading} />
      <MaquinaText text={text} />
    </div>
  );
}

import { AlarmIcon } from "@phosphor-icons/react";
import { daysUntilDate } from "@/lib/utils/date";

export default function DeliveryDateTrafficLight({ deliveryDate }: { deliveryDate: string }) {
  let daysUntil = daysUntilDate(deliveryDate);
  const color = daysUntil === "soon" ? "text-amber-400" : "text-red-400";

  if (daysUntil !== "soon" && daysUntil !== "very soon") return null;

  return (
    <span className={color}>
      <AlarmIcon size={15} weight="fill" />
    </span>
  );
}

export default function MaquinaServiceBadge({ services }: { services: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 flex-1">
      {services.map((service, index) => (
        <p
          key={index}
          className="border border-gray-400 bg-gray-100 text-xs w-fit h-fit font-regular px-2 py-1 rounded-lg"
        >
          {service}
        </p>
      ))}
    </div>
  );
}

export const termsAndConditions = [
  { title: "VALIDEZ DE LA COTIZACIÓN", text: "Esta cotización es válida por un período de 5 días hábiles a partir de la fecha de emisión. Después de este período los precios pueden estar sujetos a revisión y ajuste según las condiciones del mercado." },
  { title: "CONDICIONES DE PAGO", text: "El cliente acuerda realizar el pago del 70% del total al aprobar la cotización y el resto a contra entrega del producto /servicio terminado. Se aceptan pagos mediante transferencia bancaria o tarjeta de crédito." },
  { title: "ENTREGA Y PLAZOS", text: "Los productos se entregarán en un plazo de 15 días hábiles a partir del pago final, aprobación del diseño y recepción del material si es necesario. Esto puede variar según la complejidad del proyecto y la disponibilidad de materiales." },
  { title: "ALCANCE DE LOS SERVICIOS", text: "La cotización incluye servicios de transformación sobre el diseño o logo proporcionado por el cliente si este es mencionado. El logo/diseño debe ser entregado en PDF editable, .ai, .eps, .svg, .eps (vectores). No se incluyen servicios de diseño a menos que se especifique lo contrario en la cotización, la vectorización tiene un cargo adicional." },
  { title: "IMPUESTOS Y TARIFAS", text: "Los impuestos locales están incluidos en la cotización. Cualquier tarifa adicional, como los costos de envío, se indicarán por separado si aplican." },
  { title: "COSTOS ADICIONALES", text: "Cualquier cambio en el diseño original proporcionado por el cliente después de la aprobación de la cotización puede estar sujeto a costos adicionales. Estos costos no están incluidos y se cotizarán por separado." },
  { title: "CAMBIOS DE ALCANCE", text: "Los cambios en el alcance del proyecto después de la aprobación de la cotización pueden afectar los plazos y los costos. Cualquier cambio deberá ser acordado por ambas partes antes de su implementación." },
  { title: "RESPONSABILIDAD LIMITADA", text: "La empresa no se hace responsable por el daño que pudiera ocurrir al material proporcionado por el cliente ya que es una empresa enfocada a la transformación donde se realizarán cambios importantes según el método de marcado, grabado, corte, bordado o impresión, lo cual siempre conlleva un riesgo. Al entregar su anticipo o dejar su pieza en cualquiera de las sucursales, el cliente acepta de manera automática los riesgos que los procesos conllevan." },
  { title: "CANCELACIONES", text: "Cualquier cancelación de contrato deberá ser notificada por escrito con al menos 15 días de anticipación. Se aplicará un cargo por cancelación del 20% del total acordado en los servicios o productos solicitados. Esta cancelación deberá ser aprobada por el departamento contable." },
  { title: "RESPONSABILIDAD DEL CLIENTE", text: "El cliente es responsable de proporcionar diseños listos para el corte y grabado láser. Cualquier demora en la entrega de diseños puede afectar los plazos del proyecto." },
  { title: "RESOLUCIÓN DE CONFLICTOS", text: "Cualquier disputa relacionada con esta cotización se resolverá mediante negociación de buena fe." },
  { title: "VARIACIÓN EN COLORES", text: "Es importante tener en cuenta que puede haber variaciones en los colores y tamaños de la vista previa, el diseño original proporcionado por el cliente y el producto final debido a las diferencias en las pantallas de visualización y las características de los materiales utilizados en el corte grabado láser, bordado e impresión. No podemos garantizar una coincidencia exacta de colores, aunque haremos todo lo posible para mantener la fidelidad cromática y siempre hacer el mejor uso de su diseño." },
  { title: "OBJETOS CILÍNDRICOS Y VARIACIÓN EN PROPORCIONES", text: "En el caso de objetos cilíndricos, como vasos o botellas, es posible que exista una variación en las proporciones debido a la forma tridimensional del objeto. Haremos esfuerzos para adaptar el diseño al contorno del objeto, pero la variación puede ocurrir. Recomendamos discutir sus expectativas en cuanto a la colocación y proporciones del logotipo en objetos cilíndricos antes de la producción para evitar malentendidos." },
  { title: "APROBACIÓN DEL DISEÑO", text: "El cliente es responsable de revisar y aprobar el diseño final antes de la producción. Se recomienda encarecidamente revisar cuidadosamente los diseños proporcionados para garantizar la precisión del diseño, incluidas la ortografía y las proporciones. Cualquier cambio posterior a la aprobación del diseño puede generar costos adicionales. Recomendamos mandar textos en formato editable ya que la empresa no se hace responsable por errores tipográficos o de ortografía por una mala redacción, un apunte a mano o error de tipo." },
  { title: "LIMITACIONES TÉCNICAS", text: "Es posible que algunas limitaciones técnicas impidan una reproducción exacta de ciertos detalles, especialmente en objetos cilíndricos. En tales casos, trabajaremos estrechamente con el cliente para encontrar soluciones alternativas y garantizar la mejor representación posible." },
  { title: "CAMBIOS DE TALLA", text: "Entendemos que las necesidades pueden variar, especialmente en productos de vestimenta personalizados. Sin embargo, una vez que se ha iniciado la personalización, los cambios de talla pueden tener limitaciones. Recomendamos encarecidamente proporcionar tallas precisas al realizar el pedido. En caso de solicitar un cambio después de la confirmación del pedido, se evaluará la viabilidad y se aplicarán cargos adicionales, si es necesario. Es importante ponerse en contacto con nuestro equipo lo antes posible para discutir cualquier cambio de talla." },
  { title: "PRODUCTOS PERSONALIZADOS", text: "Todos nuestros productos son personalizados según las especificaciones proporcionadas por el cliente. Una vez que se ha iniciado el proceso de personalización, los productos no pueden ser devueltos o intercambiados. Asegúrese de revisar detenidamente los detalles del pedido, incluidas las tallas y las especificaciones, antes de confirmar la compra." }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

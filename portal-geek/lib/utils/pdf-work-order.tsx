import { renderToStream } from "@react-pdf/renderer";
import React from "react";

import { WorkOrderTemplate } from "@/components/pdf/templates/WorkOrderTemplate";

/**
 * Generates the PDF Work Order as a Node.js Stream.
 * @param context The full quotation context
 */
export const generateWorkOrderPDF = async (
  context: Parameters<typeof WorkOrderTemplate>[0]["context"]
) => await renderToStream(<WorkOrderTemplate context={context} />);

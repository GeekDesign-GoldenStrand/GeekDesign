import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { WorkOrderTemplate } from '@/components/pdf/templates/WorkOrderTemplate';

/**
 * Generates the PDF Work Order as a Node.js Stream.
 * @param context The full quotation context
 */
export const generateWorkOrderPDF = async (context: any) => {
  return await renderToStream(<WorkOrderTemplate context={context} />);
};

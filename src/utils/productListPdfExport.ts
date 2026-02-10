import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { calculateNestedVariantQuantity, getVariantBreakdown } from '@/types/variants';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  variants?: any;
  is_active: boolean;
  minimum_quantity?: number;
  value?: number;
  company_id?: string;
  companies?: {
    name: string;
    client_code?: string;
  };
}

interface ExportOptions {
  products: Product[];
  inventoryData: Record<string, number>;
  title?: string;
  clientName?: string;
  clientCode?: string;
  isAdmin?: boolean;
}

const flattenVariantsForPdf = (variants: any): Array<{ path: string; quantity: number; sku?: string; minimumQuantity?: number }> => {
  if (!variants || !Array.isArray(variants)) return [];
  
  const result: Array<{ path: string; quantity: number; sku?: string; minimumQuantity?: number }> = [];
  
  const processVariant = (variant: any, parentPath: string = '') => {
    if (!variant?.values || !Array.isArray(variant.values)) return;
    const attribute = variant.attribute || 'Variant';
    for (const val of variant.values) {
      const currentPath = parentPath 
        ? `${parentPath} → ${attribute}: ${val.value || 'N/A'}`
        : `${attribute}: ${val.value || 'N/A'}`;
      
      if (val.subVariants && Array.isArray(val.subVariants) && val.subVariants.length > 0) {
        for (const sub of val.subVariants) {
          processVariant(sub, currentPath);
        }
      } else {
        result.push({
          path: currentPath,
          quantity: Number(val.quantity) || 0,
          sku: val.sku,
          minimumQuantity: val.minimumQuantity,
        });
      }
    }
  };
  
  variants.forEach((v: any) => processVariant(v));
  return result;
};

const getProductQuantity = (product: Product, inventoryData: Record<string, number>): number => {
  try {
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantTotal = calculateNestedVariantQuantity(product.variants);
      if (variantTotal > 0) return variantTotal;
    }
    return inventoryData[product.id] || 0;
  } catch {
    return inventoryData[product.id] || 0;
  }
};

export const exportProductListPDF = ({
  products,
  inventoryData,
  title = 'Product Catalog',
  clientName,
  clientCode,
  isAdmin = false,
}: ExportOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 28;

  if (clientName) {
    doc.text(`Client: ${clientName}${clientCode ? ` (${clientCode})` : ''}`, 14, yPos);
    yPos += 6;
  }

  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, yPos);
  yPos += 4;
  doc.text(`Total Products: ${products.length}`, 14, yPos + 4);
  yPos += 10;

  // Summary stats
  const totalQty = products.reduce((sum, p) => sum + getProductQuantity(p, inventoryData), 0);
  const totalValue = products.reduce((sum, p) => {
    const qty = getProductQuantity(p, inventoryData);
    return sum + (p.value ? p.value * qty : 0);
  }, 0);
  const activeCount = products.filter(p => p.is_active).length;

  doc.setFontSize(9);
  doc.text(`Active: ${activeCount} | Inactive: ${products.length - activeCount} | Total Qty: ${totalQty.toLocaleString()} | Total Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 14, yPos);
  yPos += 6;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos, pageWidth - 14, yPos);
  yPos += 4;

  // Products table
  const tableColumns = isAdmin
    ? ['#', 'Product', 'SKU', 'Client', 'Qty', 'Value', 'Min Qty', 'Status']
    : ['#', 'Product', 'SKU', 'Qty', 'Value', 'Min Qty', 'Status'];

  const tableRows = products.map((product, index) => {
    const qty = getProductQuantity(product, inventoryData);
    const row = [
      (index + 1).toString(),
      product.name,
      product.sku || 'N/A',
    ];
    if (isAdmin) {
      row.push(product.companies?.name || 'Unknown');
    }
    row.push(
      qty.toLocaleString(),
      product.value ? `$${product.value.toFixed(2)}` : '—',
      product.minimum_quantity ? product.minimum_quantity.toString() : '—',
      product.is_active ? 'Active' : 'Inactive',
    );
    return row;
  });

  autoTable(doc, {
    startY: yPos,
    head: [tableColumns],
    body: tableRows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 65, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: isAdmin
      ? { 0: { cellWidth: 10 }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } }
      : { 0: { cellWidth: 10 }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  // Variant details section
  const productsWithVariants = products.filter(p => p.variants && Array.isArray(p.variants) && p.variants.length > 0);

  if (productsWithVariants.length > 0) {
    let variantY = (doc as any).lastAutoTable?.finalY + 10 || yPos + 20;

    // Check if we need a new page
    if (variantY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      variantY = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Variant Details', 14, variantY);
    variantY += 8;

    for (const product of productsWithVariants) {
      const flatVariants = flattenVariantsForPdf(product.variants);
      if (flatVariants.length === 0) continue;

      // Check page space
      if (variantY > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        variantY = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const productLabel = isAdmin
        ? `${product.name} (${product.companies?.name || 'Unknown'})`
        : product.name;
      doc.text(productLabel, 14, variantY);
      if (product.sku) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`SKU: ${product.sku}`, 14, variantY + 4);
      }
      variantY += product.sku ? 7 : 3;

      const variantRows = flatVariants.map(v => [
        v.path,
        v.sku || '—',
        v.quantity.toLocaleString(),
        v.minimumQuantity ? v.minimumQuantity.toString() : '—',
        product.value ? `$${(product.value * v.quantity).toFixed(2)}` : '—',
      ]);

      autoTable(doc, {
        startY: variantY,
        head: [['Variant Path', 'Variant SKU', 'Qty', 'Min Qty', 'Value']],
        body: variantRows,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [100, 120, 150], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        margin: { left: 18 },
      });

      variantY = (doc as any).lastAutoTable?.finalY + 6 || variantY + 20;
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
    doc.text(
      'ClearPath Warehouse',
      14,
      doc.internal.pageSize.getHeight() - 10,
    );
    doc.setTextColor(0);
  }

  const filename = clientName
    ? `${clientName.replace(/[^a-z0-9]/gi, '_')}_products_${format(new Date(), 'yyyyMMdd')}.pdf`
    : `product_catalog_${format(new Date(), 'yyyyMMdd')}.pdf`;

  doc.save(filename);
  return filename;
};

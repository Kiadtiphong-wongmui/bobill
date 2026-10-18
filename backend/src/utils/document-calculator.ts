/**
 * Shared Document Calculation Helper
 * Handles financial calculations (subtotal, line totals, grand totals)
 * and converting numeric amounts to Thai Baht text format.
 */

export interface InputItem {
  lineNo?: number;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
}

export interface CalculatedItem {
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CalculatedTotals {
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  items: CalculatedItem[];
  amountInWords: string;
}

/**
 * Calculates line totals, subtotal, discount, and grand total for invoice/quotation items.
 */
export function calculateDocumentTotals(
  rawItems: InputItem[],
  discountInput: number | string = 0
): CalculatedTotals {
  const discountTotal = Math.max(0, Number(discountInput) || 0);

  const items: CalculatedItem[] = (rawItems || []).map((item, index) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unitPrice) || 0);
    const lineTotal = Math.round((qty * price) * 100) / 100;

    return {
      lineNo: item.lineNo || index + 1,
      description: item.description || "",
      quantity: qty,
      unitPrice: price,
      lineTotal,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandTotal = Math.max(0, Math.round((subtotal - discountTotal) * 100) / 100);
  const amountInWords = arabicToThaiBahtText(grandTotal);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    grandTotal,
    items,
    amountInWords,
  };
}

/**
 * Converts a number to Thai Baht Text format (e.g. 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์")
 */
export function arabicToThaiBahtText(amount: number | string): string {
  const num = Math.abs(Number(amount) || 0);
  if (num === 0) return "ศูนย์บาทถ้วน";

  const digits = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const fixedStr = num.toFixed(2);
  const [bahtStr, satangStr] = fixedStr.split(".");

  function convertGroup(str: string): string {
    let result = "";
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(str[i], 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          result += "สิบ";
        } else if (pos === 1 && digit === 2) {
          result += "ยี่สิบ";
        } else if (pos === 0 && digit === 1 && len > 1) {
          result += "เอ็ด";
        } else {
          result += digits[digit] + positions[pos];
        }
      }
    }
    return result;
  }

  function convertBaht(str: string): string {
    if (str === "0") return "";
    let result = "";
    let tempStr = str;

    while (tempStr.length > 6) {
      const highGroup = tempStr.substring(0, tempStr.length - 6);
      tempStr = tempStr.substring(tempStr.length - 6);
      result = convertBaht(highGroup) + "ล้าน" + convertGroup(tempStr);
    }
    if (!result) {
      result = convertGroup(tempStr);
    }
    return result;
  }

  const bahtText = convertBaht(bahtStr);
  const satangNum = parseInt(satangStr, 10);

  let satangText = "";
  if (satangNum > 0) {
    satangText = convertGroup(satangStr) + "สตางค์";
  } else {
    satangText = "ถ้วน";
  }

  return (bahtText ? bahtText + "บาท" : "") + satangText;
}

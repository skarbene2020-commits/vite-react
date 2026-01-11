
import { COLUMN_ALIASES } from '../constants';
import { Order, OrderStatus } from '../types';
import { storageService } from './storageService';

function normalizeString(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str).toLowerCase().trim();
}

function checkMatch(cellValue: any, aliases: string[]): 'exact' | 'partial' | 'none' {
  const normalizedCell = normalizeString(cellValue);
  if (!normalizedCell) return 'none';

  for (const alias of aliases) {
    const normAlias = normalizeString(alias);
    if (normalizedCell === normAlias) return 'exact';
  }

  for (const alias of aliases) {
    const normAlias = normalizeString(alias);
    if (normalizedCell.includes(normAlias) || normAlias.includes(normalizedCell)) {
      return 'partial';
    }
  }

  return 'none';
}

function parsePrice(value: any): number {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  
  let strValue = String(value).trim();
  if (!strValue) return 0;

  let cleaned = strValue.replace(/[^\d.,-]/g, '');
  if (/,\d{3}($|[^0-9])/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } else {
    cleaned = cleaned.replace(/,/g, '.');
  }

  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

export const excelService = {
  getSheetNames: async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const XLSX = (window as any).XLSX;
          if (!XLSX) throw new Error("مكتبة الإكسيل غير محملة");
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook.SheetNames);
        } catch (err) {
          reject(new Error("فشل في قراءة ملف الإكسيل"));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  parseExcel: async (file: File, sheetName?: string, isAppend: boolean = false): Promise<Order[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const XLSX = (window as any).XLSX;
          if (!XLSX) throw new Error("مكتبة الإكسيل غير محملة");
          const workbook = XLSX.read(data, { type: 'array' });
          const targetSheetName = sheetName || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[targetSheetName];
          
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
          if (rows.length < 1) throw new Error("الملف يبدو فارغاً");

          let bestHeaderIndex = -1;
          let maxScore = 0;
          let bestMapping: Record<string, number> = {};
          
          for (let i = 0; i < Math.min(rows.length, 50); i++) {
            const row = rows[i] as any[];
            if (!row || !Array.isArray(row)) continue;
            
            let currentMapping: Record<string, number> = {};
            let currentScore = 0;

            Object.entries(COLUMN_ALIASES).forEach(([key, aliases]) => {
              const exactIdx = row.findIndex(cell => checkMatch(cell, aliases) === 'exact');
              if (exactIdx !== -1) {
                currentMapping[key] = exactIdx;
                currentScore += 5;
              } else {
                const partialIdx = row.findIndex(cell => checkMatch(cell, aliases) === 'partial');
                if (partialIdx !== -1) {
                  currentMapping[key] = partialIdx;
                  currentScore += 2;
                }
              }
            });

            if (currentScore > maxScore) {
              maxScore = currentScore;
              bestHeaderIndex = i;
              bestMapping = { ...currentMapping };
            }
          }
          
          if (maxScore < 8) {
            throw new Error("لم نتمكن من التعرف على أعمدة الملف.");
          }

          const existingOrders = storageService.getOrders();
          let nextSequence = 1;
          if (isAppend && existingOrders.length > 0) {
            nextSequence = Math.max(...existingOrders.map(o => parseInt(o.sequence) || 0)) + 1;
          }

          const orders: Order[] = [];
          const batchId = Math.random().toString(36).substr(2, 5);
          const timestamp = Date.now();

          for (let i = bestHeaderIndex + 1; i < rows.length; i++) {
            const row = rows[i] as any[];
            if (!row || row.length === 0) continue;
            
            const orderIdVal = bestMapping.orderId !== undefined ? String(row[bestMapping.orderId] ?? '').trim() : '';
            const phoneVal = bestMapping.phoneNumber !== undefined ? String(row[bestMapping.phoneNumber] ?? '').trim() : '';
            
            if (!orderIdVal && !phoneVal) continue;
            
            orders.push({
              id: `ord-${batchId}-${timestamp}-${i}`,
              orderId: orderIdVal,
              phoneNumber: phoneVal.replace(/[^0-9]/g, ''),
              country: bestMapping.country !== undefined ? String(row[bestMapping.country] ?? '').trim() : '',
              deliveryCompany: bestMapping.deliveryCompany !== undefined ? String(row[bestMapping.deliveryCompany] ?? '').trim() : '',
              price: bestMapping.price !== undefined ? parsePrice(row[bestMapping.price]) : 0,
              note: bestMapping.note !== undefined ? String(row[bestMapping.note] ?? '').trim() : '',
              sequence: String(nextSequence++),
              packageName: bestMapping.packageName !== undefined ? String(row[bestMapping.packageName] ?? '').trim() : '',
              status: OrderStatus.PENDING,
              statusUpdatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          }

          resolve(orders);
        } catch (err: any) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
};

import { DOMParser } from '@xmldom/xmldom';

export const parseSvgDimensions = (svgText: string): { 
  width: number | null;
  height: number | null;
  viewBox: { x: number; y: number; w: number; h: number } | null;
} => {
  const parser = new DOMParser();

  try {
    const doc = parser.parseFromString(svgText, 'text/xml');
    const svg = doc.documentElement;

    // 检查XML解析错误
    const errors = doc.getElementsByTagName('parsererror');
    if (errors.length > 0) {
      throw new Error('XML格式错误: ' + errors[0].textContent);
    }

    // 解析数字属性（带单位处理）
    const parseUnitValue = (val: string | null): number | null => {
      if (!val) return null;
      const num = parseFloat(val.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? null : num;
    };

    // 解析viewBox
    const parseViewBox = (): { x: number; y: number; w: number; h: number } | null => {
      if (!svg) throw new Error('SVG元素未找到');
      const vb = svg.getAttribute('viewBox');
      if (!vb) throw new Error('viewBox属性未找到');
      
      const parts = vb.split(/[ ,]/).filter(Boolean).map(Number);
      return parts.length === 4 ? {
        x: parts[0],
        y: parts[1],
        w: parts[2],
        h: parts[3]
      } : null;
    };

    return {
      width: svg ? parseUnitValue(svg.getAttribute('width')) : null,
      height: svg ? parseUnitValue(svg.getAttribute('height')) : null,
      viewBox: svg ? parseViewBox() : null
    };
  } catch (error) {
    console.error('[SVG解析] 异常:', error);
    return { width: null, height: null, viewBox: null };
  }
}

export function parseToNumber(
  value: any, 
  defaultValue: number = 0, 
  decimalPlaces?: number,
  min?: number,
  max?: number
): number {
  let num = parseFloat(value);
  if (isNaN(num)) {
    num = defaultValue;
  }

  if (typeof min === 'number') {
    num = Math.max(min, num);
  }
  if (typeof max === 'number') {
    num = Math.min(max, num);
  }

  if (typeof decimalPlaces === 'number' && decimalPlaces >= 0) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
  }
  return num;
}

// Add other utility functions if they exist or as needed.



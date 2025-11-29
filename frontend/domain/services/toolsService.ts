import { AuthService } from './authService';

const API_URL = import.meta.env.VITE_API_URL;

class ToolsService {
  private static getAuthHeaders(): HeadersInit {
    const key = AuthService.getKey();
    return {
      'Content-Type': 'application/json',
      ...(key && { 'x-auth-key': key }),
    };
  }

  // TEXT TOOLS
  static async base64Encode(text: string) {
    const response = await fetch(`${API_URL}/api/text/base64/encode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async base64Decode(text: string) {
    const response = await fetch(`${API_URL}/api/text/base64/decode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async urlEncode(text: string) {
    const response = await fetch(`${API_URL}/api/text/url/encode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async urlDecode(text: string) {
    const response = await fetch(`${API_URL}/api/text/url/decode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async hash(text: string, algorithm: string = 'sha256') {
    const response = await fetch(`${API_URL}/api/text/hash`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, algorithm }),
    });
    return response.json();
  }

  static async jwtDecode(token: string) {
    const response = await fetch(`${API_URL}/api/text/jwt/decode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ token }),
    });
    return response.json();
  }

  static async textDiff(text1: string, text2: string) {
    const response = await fetch(`${API_URL}/api/text/diff`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text1, text2 }),
    });
    return response.json();
  }

  static async caseConvert(text: string, type: string) {
    const response = await fetch(`${API_URL}/api/text/case`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, type }),
    });
    return response.json();
  }

  static async generateLorem(paragraphs: number = 3, wordsPerParagraph: number = 50) {
    const response = await fetch(`${API_URL}/api/text/lorem`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ paragraphs, wordsPerParagraph }),
    });
    return response.json();
  }

  static async countWords(text: string) {
    const response = await fetch(`${API_URL}/api/text/count`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async markdownToHtml(text: string) {
    const response = await fetch(`${API_URL}/api/text/markdown`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async reverseString(text: string) {
    const response = await fetch(`${API_URL}/api/text/string/reverse`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async sortLines(text: string, delimiter: string = '\n') {
    const response = await fetch(`${API_URL}/api/text/string/sort`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, delimiter }),
    });
    return response.json();
  }

  static async uniqueLines(text: string, delimiter: string = '\n') {
    const response = await fetch(`${API_URL}/api/text/string/unique`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, delimiter }),
    });
    return response.json();
  }

  // CODE TOOLS
  static async formatJson(text: string, indent: number = 2) {
    const response = await fetch(`${API_URL}/api/code/json/format`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, indent }),
    });
    return response.json();
  }

  static async minifyJson(text: string) {
    const response = await fetch(`${API_URL}/api/code/json/minify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async jsonToYaml(text: string) {
    const response = await fetch(`${API_URL}/api/code/json-to-yaml`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async yamlToJson(text: string, indent: number = 2) {
    const response = await fetch(`${API_URL}/api/code/yaml-to-json`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, indent }),
    });
    return response.json();
  }

  static async formatSql(text: string, language: string = 'sql') {
    const response = await fetch(`${API_URL}/api/code/sql/format`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, language }),
    });
    return response.json();
  }

  static async htmlEncode(text: string) {
    const response = await fetch(`${API_URL}/api/code/html/encode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async htmlDecode(text: string) {
    const response = await fetch(`${API_URL}/api/code/html/decode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async minifyCss(text: string) {
    const response = await fetch(`${API_URL}/api/code/css/minify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async minifyJs(text: string) {
    const response = await fetch(`${API_URL}/api/code/js/minify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  // URL TOOLS
  static async parseUrl(url: string) {
    const response = await fetch(`${API_URL}/api/url/parse`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    return response.json();
  }

  static async generateQrCode(text: string, size: number = 300) {
    const response = await fetch(`${API_URL}/api/url/qrcode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, size }),
    });
    return response.json();
  }

  static async generateSlug(text: string) {
    const response = await fetch(`${API_URL}/api/url/slug`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text }),
    });
    return response.json();
  }

  static async parseQueryString(query: string) {
    const response = await fetch(`${API_URL}/api/url/query-parse`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ query }),
    });
    return response.json();
  }

  // OTHER TOOLS
  static async generateUuid(count: number = 1) {
    const response = await fetch(`${API_URL}/api/other/uuid`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ count }),
    });
    return response.json();
  }

  static async generateRandomString(options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
  }) {
    const response = await fetch(`${API_URL}/api/other/random-string`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(options),
    });
    return response.json();
  }

  static async timestampToDate(timestamp: number) {
    const response = await fetch(`${API_URL}/api/other/timestamp/to-date`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ timestamp }),
    });
    return response.json();
  }

  static async dateToTimestamp(date: string) {
    const response = await fetch(`${API_URL}/api/other/timestamp/from-date`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ date }),
    });
    return response.json();
  }

  static async getCurrentTimestamp() {
    const key = AuthService.getKey();
    const response = await fetch(`${API_URL}/api/other/timestamp/now`, {
      headers: key ? { 'x-auth-key': key } : {},
    });
    return response.json();
  }

  static async convertBase(number: string, fromBase: number, toBase: number) {
    const response = await fetch(`${API_URL}/api/other/base-convert`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ number, fromBase, toBase }),
    });
    return response.json();
  }

  static async convertColor(color: string, fromFormat: string, toFormat: string) {
    const response = await fetch(`${API_URL}/api/other/color-convert`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ color, fromFormat, toFormat }),
    });
    return response.json();
  }

  // IMAGE TOOLS
  static async generateImageQrCode(text: string, size: number = 300, format: string = 'png') {
    const response = await fetch(`${API_URL}/api/image/qrcode`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ text, size, format }),
    });
    return response.json();
  }
}

export default ToolsService;

# 工具函数 (utils/)

---

## id.ts — ID 生成

**文件**: `src/utils/id.ts` (10 行)

```typescript
import { v4 as uuidv4 } from 'uuid';

// 生成 UUID v4（用于实体 ID）
export function generateId(): string {
  return uuidv4();
}

// 生成短 ID（用于显示）
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}
```

---

## download.ts — 文件下载

**文件**: `src/utils/download.ts` (25 行)

通过创建 Blob URL 并模拟点击下载文件。

```typescript
// 通用文件下载
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSON 文件下载
export function downloadJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

// Markdown 文件下载
export function downloadMarkdown(content: string, filename: string): void {
  downloadFile(content, filename, 'text/markdown');
}
```

**使用位置**: PluginsView.tsx（导出按钮）、WFFile.ts（.wf.json 下载）。

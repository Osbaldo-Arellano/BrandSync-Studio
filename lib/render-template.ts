export function renderTemplate(
  htmlBody: string,
  vars: Record<string, string>,
): string {
  return htmlBody.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

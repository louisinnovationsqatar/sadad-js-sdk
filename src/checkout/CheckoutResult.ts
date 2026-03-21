// SADAD Payment Gateway SDK for JavaScript/TypeScript
// Built by Louis Innovations (www.louis-innovations.com)

type ParamValue = string | number | boolean | null | ParamObject | ParamValue[];
interface ParamObject {
  [key: string]: ParamValue;
}

export class CheckoutResult {
  readonly url: string;
  readonly params: Record<string, ParamValue>;

  constructor(url: string, params: Record<string, ParamValue>) {
    this.url = url;
    this.params = params;
  }

  /**
   * Generate an HTML form that posts all checkout parameters to the SADAD gateway.
   *
   * Array values (e.g. productdetail) are expanded into indexed inputs:
   *   productdetail[0][order_id], productdetail[0][amount], etc.
   *
   * @param formId     The HTML id attribute for the <form> element.
   * @param autoSubmit Whether to append a JS auto-submit script.
   */
  toHtmlForm(formId: string = 'sadad-checkout-form', autoSubmit: boolean = true): string {
    const inputs = this.buildInputs(this.params);

    const escapedFormId = escapeHtml(formId);
    const escapedUrl = escapeHtml(this.url);

    let html = `<form id="${escapedFormId}" method="POST" action="${escapedUrl}">\n`;

    for (const [name, value] of inputs) {
      html += `    <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(String(value))}">\n`;
    }

    html += '</form>';

    if (autoSubmit) {
      html += `\n<script>document.getElementById("${escapedFormId}").submit();</script>`;
    }

    return html;
  }

  private buildInputs(
    params: Record<string, ParamValue>,
    prefix: string = '',
  ): [string, string | number | boolean | null][] {
    const inputs: [string, string | number | boolean | null][] = [];

    for (const [key, value] of Object.entries(params)) {
      const inputName = prefix === '' ? key : `${prefix}[${key}]`;

      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const item = value[i];
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            inputs.push(...this.buildInputs(item as Record<string, ParamValue>, `${inputName}[${i}]`));
          } else {
            inputs.push([`${inputName}[${i}]`, item as string | number | boolean | null]);
          }
        }
      } else if (value !== null && typeof value === 'object') {
        inputs.push(...this.buildInputs(value as Record<string, ParamValue>, inputName));
      } else {
        inputs.push([inputName, value]);
      }
    }

    return inputs;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

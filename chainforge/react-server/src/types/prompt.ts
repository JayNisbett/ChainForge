export interface PromptField {
  type: string;
  rules: string;
  value: string;
  title: string;
  placeHolder?: string;
  defaultValue: string;
  key: string;
  options?: string[];
}

export interface PromptData {
  _id: string;
  title: string;
  categoryRef: number;
  fields: PromptField[];
  outputFormat: string;
  displayButton: any[]; // Define proper type
  stream: boolean;
}

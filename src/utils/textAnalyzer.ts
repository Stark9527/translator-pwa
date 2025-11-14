// 文本分析工具 - 判断文本类型

/**
 * 判断输入文本是否为单个英文单词
 *
 * 判断标准：
 * 1. 去除标点符号后
 * 2. 按空格分割
 * 3. 只有1个单词
 * 4. 且该单词只包含英文字母、连字符、撇号
 *
 * @param text 输入文本
 * @returns 是否为单词
 *
 * @example
 * isWord("hello")        // true
 * isWord("it's")         // true
 * isWord("light")        // true
 * isWord("hello world")  // false
 * isWord("你好")         // false
 * isWord("Hello!")       // true (标点会被去除)
 */
export function isWord(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 去除首尾空白和常见标点符号
  const cleaned = text.trim().replace(/^[.,!?;:"'()[\]{}]+|[.,!?;:"'()[\]{}]+$/g, '');

  // 按空格分割
  const words = cleaned.split(/\s+/);

  // 检查是否只有1个单词
  if (words.length !== 1) {
    return false;
  }

  const word = words[0];

  // 检查是否只包含英文字母、连字符、撇号
  // 允许: a-z, A-Z, ', -
  const isEnglishWord = /^[a-zA-Z'-]+$/.test(word);

  // 检查长度是否合理（1-45个字符）
  // 最长的英文单词大约是45个字母
  const isReasonableLength = word.length >= 1 && word.length <= 45;

  return isEnglishWord && isReasonableLength;
}

/**
 * 判断文本是否为英文
 *
 * @param text 输入文本
 * @returns 是否为英文
 */
export function isEnglish(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 简单判断：英文字母占比 > 50%
  const cleaned = text.replace(/[^a-zA-Z]/g, '');
  const englishRatio = cleaned.length / text.length;

  return englishRatio > 0.5;
}

/**
 * 判断文本是否为中文
 *
 * @param text 输入文本
 * @returns 是否为中文
 */
export function isChinese(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  // 中文字符范围
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseMatches = text.match(chineseRegex);

  if (!chineseMatches) {
    return false;
  }

  // 中文字符占比 > 50%
  const chineseRatio = chineseMatches.length / text.length;

  return chineseRatio > 0.5;
}

/**
 * 标准化文本（去除多余空格、换行等）
 *
 * @param text 输入文本
 * @returns 标准化后的文本
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // 多个空格替换为一个
    .replace(/\n+/g, ' ')  // 换行替换为空格
    .replace(/\r/g, '');   // 删除回车符
}

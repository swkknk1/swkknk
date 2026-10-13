import React from 'react';

interface FormattedDescriptionProps {
  description?: string;
  className?: string;
}

/**
 * Extracts a concise, clean single-line preview from formatted multiline descriptions,
 * stripping section headers like 【...】 and bullet marks for use in cards and list rows.
 */
export function getPlainDescriptionPreview(description?: string, maxLength = 90): string {
  if (!description) return '';
  const cleaned = description
    .replace(/【.*?】/g, '') // remove section headers
    .replace(/^[•\-*]\s*/gm, '') // remove bullet points
    .replace(/\s+/g, ' ') // collapse multi-spaces and newlines into single spaces
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.slice(0, maxLength) + '...';
}

export interface CardHighlightData {
  coreFeature: string;
  tags: string[];
}

/**
 * Extracts key focal points (1 core highlight bullet + clean tag pills)
 * for compact homepage product cards without increasing card size.
 */
export function getItemCardHighlights(
  item: {
    title: string;
    description?: string;
    tags?: string[];
    condition?: string;
    price?: number;
    originalPrice?: number;
  },
  currency = '$'
): CardHighlightData {
  const tags: string[] = [];

  // 1. Gather explicit tags if present
  if (item.tags && item.tags.length > 0) {
    tags.push(...item.tags);
  }

  // 2. Add discount tag if there is savings
  if (item.originalPrice && item.price && item.originalPrice > item.price) {
    const diff = item.originalPrice - item.price;
    tags.push(`省${currency}${diff}`);
  }

  // 3. Extract core feature from description
  let coreFeature = '';
  if (item.description) {
    const lines = item.description.split('\n').map((l) => l.trim()).filter(Boolean);
    // Look for first bullet point line starting with • or - or *
    const bulletLine = lines.find((l) => /^[•\-*]/.test(l));
    if (bulletLine) {
      coreFeature = bulletLine.replace(/^[•\-*]\s*/, '').trim();
    } else {
      // Look for a non-header content line
      const contentLine = lines.find((l) => !/^【.+】$/.test(l) && !/^\[.+\]:?$/.test(l));
      if (contentLine) {
        coreFeature = contentLine.trim();
      }
    }
  }

  // If tags is still empty, add condition prefix
  if (tags.length === 0 && item.condition) {
    tags.push(item.condition.split(' ')[0]);
  }

  return {
    coreFeature,
    tags: Array.from(new Set(tags)),
  };
}

/**
 * Beautifully formats multi-line product descriptions with proper vertical hierarchy,
 * clean paragraph spacing, styled section headers (e.g. 【物品说明】), and indented bullet lists.
 */
export const FormattedDescription: React.FC<FormattedDescriptionProps> = ({
  description,
  className = '',
}) => {
  if (!description || !description.trim()) {
    return (
      <p className="text-xs sm:text-sm text-stone-400 italic">
        暂无详细描述，如有疑问可直接通过微信联系或勾选提交意向咨询。
      </p>
    );
  }

  const lines = description.split('\n');

  return (
    <div className={`space-y-1.5 text-xs sm:text-sm text-stone-700 leading-relaxed ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line -> breathing space between paragraphs
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Section Header: e.g. 【核心性能】 or [配置参数]
        if (/^【.+】$/.test(trimmed) || /^\[.+\]:?$/.test(trimmed)) {
          const title = trimmed.replace(/^[【\[]|([】\]]:?)$/g, '');
          return (
            <div
              key={idx}
              className="font-bold text-stone-900 text-xs sm:text-sm mt-3.5 first:mt-0 pt-1 flex items-center gap-1.5 border-b border-stone-100 pb-1"
            >
              <span className="w-1 h-3.5 bg-amber-600 rounded-full" />
              <span>{title}</span>
            </div>
          );
        }

        // Bullet point: starts with • or - or * or numbered list like 1. 2.
        if (/^[•\-*]\s*/.test(trimmed)) {
          const content = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-stone-600">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600/80 mt-1.5 shrink-0" />
              <span className="flex-1">{content}</span>
            </div>
          );
        }

        // Numbered item: e.g. 1. 2. 3.
        const numMatch = trimmed.match(/^(\d+[\.、])\s*(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-stone-600">
              <span className="font-mono text-amber-700 font-semibold shrink-0">
                {numMatch[1]}
              </span>
              <span className="flex-1">{numMatch[2]}</span>
            </div>
          );
        }

        // Standard paragraph line (maintains any inline indentation)
        return (
          <p key={idx} className="text-stone-600 leading-relaxed whitespace-pre-wrap">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

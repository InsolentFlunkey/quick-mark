// Reviewed catalog for the pinned markdownlint 0.41.1 profile. No parser code in Settings.
export interface LintRule { id: string; description: string; defaultEnabled: boolean; available: boolean; note?: string }
export const LINT_GROUPS: readonly { name: string; rules: readonly LintRule[] }[] = [
  {
    "name": "Headings",
    "rules": [
      {
        "id": "MD001",
        "description": "Heading levels should only increment by one level at a time",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD003",
        "description": "Heading style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD018",
        "description": "No space after hash on atx style heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD019",
        "description": "Multiple spaces after hash on atx style heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD020",
        "description": "No space inside hashes on closed atx style heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD021",
        "description": "Multiple spaces inside hashes on closed atx style heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD022",
        "description": "Headings should be surrounded by blank lines",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD023",
        "description": "Headings must start at the beginning of the line",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD024",
        "description": "Multiple headings with the same content",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD025",
        "description": "Multiple top-level headings in the same document",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD026",
        "description": "Trailing punctuation in heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD036",
        "description": "Emphasis used instead of a heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD041",
        "description": "First line in a file should be a top-level heading",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD043",
        "description": "Required heading structure",
        "defaultEnabled": true,
        "available": true,
        "note": "No required heading outline is configured; this rule currently adds no constraints."
      }
    ]
  },
  {
    "name": "Lists",
    "rules": [
      {
        "id": "MD004",
        "description": "Unordered list style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD005",
        "description": "Inconsistent indentation for list items at the same level",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD007",
        "description": "Unordered list indentation",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD029",
        "description": "Ordered list item prefix",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD030",
        "description": "Spaces after list markers",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD032",
        "description": "Lists should be surrounded by blank lines",
        "defaultEnabled": true,
        "available": true
      }
    ]
  },
  {
    "name": "Spacing and blockquotes",
    "rules": [
      {
        "id": "MD009",
        "description": "Trailing spaces",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD010",
        "description": "Hard tabs",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD012",
        "description": "Multiple consecutive blank lines",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD013",
        "description": "Line length",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD027",
        "description": "Multiple spaces after blockquote symbol",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD028",
        "description": "Blank line inside blockquote",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD047",
        "description": "Files should end with a single newline character",
        "defaultEnabled": true,
        "available": true
      }
    ]
  },
  {
    "name": "Code blocks and inline code",
    "rules": [
      {
        "id": "MD014",
        "description": "Dollar signs used before commands without showing output",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD031",
        "description": "Fenced code blocks should be surrounded by blank lines",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD038",
        "description": "Spaces inside code span elements",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD040",
        "description": "Fenced code blocks should have a language specified",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD046",
        "description": "Code block style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD048",
        "description": "Code fence style",
        "defaultEnabled": true,
        "available": true
      }
    ]
  },
  {
    "name": "Links, images and HTML",
    "rules": [
      {
        "id": "MD011",
        "description": "Reversed link syntax",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD033",
        "description": "Inline HTML",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD034",
        "description": "Bare URL used",
        "defaultEnabled": false,
        "available": true,
        "note": "Off by default: QuickMark turns bare URLs into links."
      },
      {
        "id": "MD039",
        "description": "Spaces inside link text",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD042",
        "description": "No empty links",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD045",
        "description": "Images should have alternate text (alt text)",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD051",
        "description": "Link fragments should be valid",
        "defaultEnabled": false,
        "available": false,
        "note": "Unavailable until heading fragment validation matches Preview navigation."
      },
      {
        "id": "MD052",
        "description": "Reference links and images should use a label that is defined",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD053",
        "description": "Link and image reference definitions should be needed",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD054",
        "description": "Link and image style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD059",
        "description": "Link text should be descriptive",
        "defaultEnabled": true,
        "available": true
      }
    ]
  },
  {
    "name": "Emphasis and names",
    "rules": [
      {
        "id": "MD037",
        "description": "Spaces inside emphasis markers",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD044",
        "description": "Proper names should have the correct capitalization",
        "defaultEnabled": true,
        "available": true,
        "note": "No required spelling list is configured; this rule currently adds no constraints."
      },
      {
        "id": "MD049",
        "description": "Emphasis style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD050",
        "description": "Strong style",
        "defaultEnabled": true,
        "available": true
      }
    ]
  },
  {
    "name": "Tables and thematic breaks",
    "rules": [
      {
        "id": "MD035",
        "description": "Horizontal rule style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD055",
        "description": "Table pipe style",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD056",
        "description": "Table column count",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD058",
        "description": "Tables should be surrounded by blank lines",
        "defaultEnabled": true,
        "available": true
      },
      {
        "id": "MD060",
        "description": "Table column style",
        "defaultEnabled": true,
        "available": true
      }
    ]
  }
];

export type RuleOverrides = Record<string, boolean>;
export const LINT_RULES = LINT_GROUPS.flatMap(group => group.rules);
export function ruleEnabled(rule: LintRule, overrides: RuleOverrides): boolean {
  return rule.available && (overrides[rule.id] ?? rule.defaultEnabled);
}
export function validateOverrides(value: unknown): RuleOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid lint rule choices");
  const result: RuleOverrides = {};
  for (const [id, enabled] of Object.entries(value)) {
    if (!LINT_RULES.some(rule => rule.id === id && rule.available) || typeof enabled !== "boolean") throw new Error("Invalid lint rule choice: " + id);
    result[id] = enabled;
  }
  return result;
}
export function ruleConfigurationKey(overrides: RuleOverrides = {}): string {
  return LINT_RULES.map(rule => ruleEnabled(rule, overrides) ? "1" : "0").join("");
}

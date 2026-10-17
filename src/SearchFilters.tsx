import type { Content } from "./model";
import { contentTags } from "./search";
export function SearchFilters({
  contents,
  language,
  tag,
  onLanguage,
  onTag,
}: {
  contents: Content[];
  language: string;
  tag: string;
  onLanguage: (value: string) => void;
  onTag: (value: string) => void;
}) {
  const languages = Array.from(
    new Set(
      contents
        .flatMap((content) => [
          content.primaryLanguage,
          content.secondaryLanguage,
        ])
        .filter(Boolean),
    ),
  ).sort();
  const tags = Array.from(new Set(contents.flatMap(contentTags))).sort();
  return (
    <div className="search-filters">
      <label>
        Language
        <select
          aria-label="Search language"
          value={language}
          onChange={(event) => onLanguage(event.target.value)}
        >
          <option value="">All languages</option>
          {languages.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        Tag
        <select
          aria-label="Search tag"
          value={tag}
          onChange={(event) => onTag(event.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {(language || tag) && (
        <button
          onClick={() => {
            onLanguage("");
            onTag("");
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

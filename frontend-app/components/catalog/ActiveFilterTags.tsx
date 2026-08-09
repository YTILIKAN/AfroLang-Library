import { AppliedFilters } from "@/lib/types";
import { tagClass } from "@/components/ui/styles";

interface ActiveFilterTagsProps {
  filters: AppliedFilters;
}

export function ActiveFilterTags({ filters }: ActiveFilterTagsProps) {
  const tags: string[] = [];

  if (filters.language) {
    tags.push(
      filters.language_code && filters.language_code !== "inconnu"
        ? `Langue · ${filters.language} (${filters.language_code})`
        : `Langue · ${filters.language}`,
    );
  }
  if (filters.source) {
    tags.push(`Source · ${filters.source}`);
  }
  if (filters.task) {
    tags.push(
      filters.task_code ? `Tâche · ${filters.task} (${filters.task_code})` : `Tâche · ${filters.task}`,
    );
  }
  if (filters.data_format) {
    tags.push(`Format · ${filters.data_format}`);
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className={tagClass}>
          {tag}
        </li>
      ))}
    </ul>
  );
}

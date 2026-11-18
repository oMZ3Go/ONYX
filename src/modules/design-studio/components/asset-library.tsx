import Image from "next/image";
import { Icon } from "@/components/icon";
import { StudioIcon } from "./studio-icon";
import type {
  CatalogArtwork,
  LibrarySection,
  LocalizedStudioProps,
  StudioCatalog,
  WorkspaceState,
} from "../types";

interface Props extends LocalizedStudioProps {
  compact: boolean;
  catalog: StudioCatalog;
  artworks: readonly CatalogArtwork[];
  workspace: WorkspaceState;
  onCategory: (id: string) => void;
  onSection: (section: LibrarySection) => void;
  onInspect: (id: string) => void;
}
const sections = ["artwork", "upload", "text", "shapes", "saved"] as const;
function ToolIcon({ section }: { section: LibrarySection }) {
  if (section === "artwork" || section === "text")
    return <Icon name={section === "artwork" ? "image" : "text"} />;
  return (
    <StudioIcon
      name={section === "upload" ? "upload" : section === "shapes" ? "shapes" : "folder"}
    />
  );
}
export function AssetLibrary({
  locale,
  copy,
  catalog,
  artworks,
  workspace,
  onCategory,
  onSection,
  onInspect,
  compact,
}: Props) {
  const entries = artworks.filter((artwork) => artwork.categoryId === workspace.categoryId);
  const trigger = (section: LibrarySection) => (
    <button
      id={`ds-tool-${section}`}
      className="ds-tool-trigger"
      type="button"
      aria-expanded={workspace.section === section}
      aria-controls={`ds-tool-content-${section}`}
      aria-label={copy.library[section]}
      onClick={() => onSection(section)}
    >
      <ToolIcon section={section} />
      <span className="ds-tool-label">{copy.library[section]}</span>
      <span className="ds-tool-short" aria-hidden="true">
        {copy.tools[section]}
      </span>
      <StudioIcon name="chevron" className="ds-chevron" />
    </button>
  );
  return (
    <div className="ds-library ds-surface">
      <h2>{copy.library.title}</h2>
      {compact && (
        <nav className="ds-mobile-tabs" aria-label={copy.library.tools}>
          {sections.map((section) => (
            <div key={section}>{trigger(section)}</div>
          ))}
        </nav>
      )}
      <div className="ds-library-tools" aria-label={copy.library.tools}>
        {sections.map((section) => (
          <section
            className="ds-tool-section"
            key={section}
            data-expanded={workspace.section === section}
          >
            {!compact && <h3>{trigger(section)}</h3>}
            <div
              id={`ds-tool-content-${section}`}
              className="ds-tool-content"
              role="region"
              aria-labelledby={`ds-tool-${section}`}
              aria-hidden={workspace.section !== section}
              inert={workspace.section !== section}
            >
              <div className="ds-tool-reveal">
                <div className="ds-tool-inner">
                  {section === "artwork" ? (
                    <>
                      <div className="ds-category-tabs" aria-label={copy.library.categories}>
                        {catalog.categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={workspace.categoryId === category.id}
                            onClick={() => onCategory(category.id)}
                          >
                            {category.name[locale]}
                          </button>
                        ))}
                      </div>
                      <div className="ds-library-content" aria-live="polite">
                        {entries.length ? (
                          <div className="ds-artwork-grid">
                            {entries.map((artwork) => (
                              <button
                                key={artwork.id}
                                className="ds-artwork"
                                type="button"
                                aria-label={`${copy.library.inspect}: ${artwork.name[locale]}`}
                                aria-pressed={workspace.inspectedArtworkId === artwork.id}
                                onClick={() => onInspect(artwork.id)}
                              >
                                <span className="ds-artwork-image">
                                  <Image
                                    src={artwork.thumbnail.src}
                                    width={artwork.thumbnail.width}
                                    height={artwork.thumbnail.height}
                                    alt=""
                                    sizes="(max-width: 600px) 40vw, 170px"
                                  />
                                </span>
                                <span>{artwork.name[locale]}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="ds-empty">
                            <Icon name="image" />
                            <h3>{copy.library.empty}</h3>
                            <p>{copy.library.emptyHint}</p>
                          </div>
                        )}
                      </div>
                      <p className="ds-library-note">{copy.library.referenceNote}</p>
                    </>
                  ) : (
                    <div className="ds-tool-detail">
                      <div
                        className={
                          section === "upload" ? "ds-upload-preparation" : "ds-tool-preview"
                        }
                        aria-hidden="true"
                      >
                        {section === "text" ? (
                          <span dir="ltr">
                            Aa <b lang="ar">أب</b>
                          </span>
                        ) : (
                          <StudioIcon
                            name={
                              section === "upload"
                                ? "cloud"
                                : section === "shapes"
                                  ? "shapes"
                                  : "folder"
                            }
                          />
                        )}
                      </div>
                      <h3>{copy.library[section]}</h3>
                      <p>{copy.deferred[section]}</p>
                      <button
                        type="button"
                        className="ds-text-button"
                        onClick={() => onSection("artwork")}
                      >
                        {copy.library.back}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

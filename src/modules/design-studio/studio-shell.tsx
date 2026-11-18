"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { initializeLogoMotion } from "@/modules/landing/motion/logo-motion";
import { usePanelPreferences } from "./use-panel-preferences";
import {
  mobileDock,
  mobilePanelWidth,
  panelWidths,
  sheetSizes,
  sideSheetSizes,
  type PanelPreferences,
} from "./panel-layout";
import { PanelResizeHandle } from "./components/panel-resize-handle";
import { initialCamera, type Camera } from "./camera";
import { useWorkspaceTheme } from "./use-workspace-theme";
import { Icon } from "@/components/icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { assets } from "@/modules/landing/assets";
import { direction } from "@/i18n/config";
import { availableVariants, compatibleArtworks } from "./catalog/selectors";
import { createProject, initialWorkspace } from "./state";
import { AssetLibrary } from "./components/asset-library";
import { Inspector } from "./components/inspector";
import { Workspace } from "./components/workspace";
import { WorkflowBar } from "./components/workflow-bar";
import { StudioIcon } from "./components/studio-icon";
import { ResponsivePanel, MobileTools, useCompactLayout } from "./components/responsive-panel";
import { SaveStatus } from "./components/save-status";
import { AppearanceControl } from "./components/appearance-control";
import { workspaceAssets } from "./catalog/assets";
import type {
  GarmentProduct,
  LocalizedStudioProps,
  Panel,
  StudioCatalog,
  WorkspaceState,
  WorkspaceTheme,
} from "./types";

export function StudioShell({
  catalog,
  product,
  locale,
  copy,
  initialTheme,
}: LocalizedStudioProps & {
  catalog: StudioCatalog;
  product: GarmentProduct;
  initialTheme: WorkspaceTheme;
}) {
  const compact = useCompactLayout();
  const [collapsed, setCollapsed] = useState({ library: false, inspector: false });
  const [focus, setFocus] = useState(false);
  const [panels, setPanels] = usePanelPreferences();
  const [sideExpanded, setSideExpanded] = useState(false);
  const main = useRef<HTMLElement>(null);
  const [mainSize, setMainSize] = useState({
    width: 1200,
    height: 600,
    viewportHeight: 900,
    viewportWidth: 1440,
  });
  const [resizing, setResizing] = useState(false);
  const [liveSheetHeight, setLiveSheetHeight] = useState<number | null>(null);
  const [livePanelWidth, setLivePanelWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = main.current!;
    const observer = new ResizeObserver(([entry]) => {
      if (entry)
        setMainSize({
          width:
            entry.contentRect.width - 2 * (parseFloat(getComputedStyle(element).columnGap) || 0),
          height: entry.contentRect.height,
          viewportHeight: innerHeight,
          viewportWidth: innerWidth,
        });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const widths = panelWidths(mainSize.width, panels, collapsed);
  const dock = mobileDock(panels.dock, mainSize.viewportWidth, mainSize.viewportHeight);
  const sideDock = dock === "left" || dock === "right";
  const narrowSide = sideDock && mainSize.viewportWidth < 700;
  const rail = narrowSide && !sideExpanded;
  const rawSnaps =
    sideDock && !narrowSide
      ? sideSheetSizes(mainSize.height)
      : sheetSizes(mainSize.viewportHeight, mainSize.height);
  const snaps = narrowSide
    ? (Object.fromEntries(
        Object.entries(rawSnaps).map(([key, value]) => [key, value + 44]),
      ) as typeof rawSnaps)
    : rawSnaps;
  const mobileWidth = mobilePanelWidth(
    mainSize.viewportWidth - 16,
    panels.mobileWidth,
    sideDock && !narrowSide,
  );
  const changePanels = (patch: Partial<PanelPreferences>) => {
    if (patch.dock && patch.dock !== panels.dock) setSideExpanded(false);
    setPanels(patch);
  };
  const expanded = panels.size === "expanded";
  const [camera, setCamera] = useState<Camera>(initialCamera);
  const previousCamera = useRef(initialCamera);
  const [theme, setTheme] = useWorkspaceTheme(initialTheme);
  useEffect(() => initializeLogoMotion(), []);
  const variants = availableVariants(product);
  const [project, setProject] = useState(() =>
    createProject(catalog.revision, product.id, variants[0]!.id),
  );
  const [workspace, setWorkspace] = useState(() =>
    initialWorkspace(catalog.categories[0]?.id ?? ""),
  );
  const restorePanelFocus = useRef<Panel>(null);
  useEffect(() => {
    if (workspace.panel === null && restorePanelFocus.current) {
      document
        .getElementById(`ds-toggle-${restorePanelFocus.current}`)
        ?.focus({ preventScroll: true });
      restorePanelFocus.current = null;
    }
  }, [workspace.panel]);
  const variant = variants.find((item) => item.id === project.garment.variantId)!;
  const artworks = compatibleArtworks(catalog.artworks, product.id, variant.id);
  const artwork = artworks.find((item) => item.id === workspace.inspectedArtworkId);
  const update = (patch: Partial<WorkspaceState>) =>
    setWorkspace((current) => ({ ...current, ...patch }));
  const openPanel = (panel: Exclude<Panel, null>) => {
    if (compact) update({ panel });
    else setCollapsed((current) => ({ ...current, [panel]: false }));
  };
  const closePanel = () => {
    setSideExpanded(false);
    restorePanelFocus.current = workspace.panel;
    update({ panel: null });
  };
  const toggleDesktop = (panel: Exclude<Panel, null>) => {
    setCollapsed((current) => ({ ...current, [panel]: !current[panel] }));
    document.getElementById(`ds-desktop-${panel}`)?.focus({ preventScroll: true });
  };
  const toggleFocus = () => {
    if (!focus) previousCamera.current = camera;
    setCamera(focus ? previousCamera.current : initialCamera);
    setFocus(!focus);
  };
  const exitFocus = useEffectEvent(() => {
    setCamera(previousCamera.current);
    setFocus(false);
  });
  useEffect(() => {
    if (!focus) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.getElementById("ds-fullscreen")?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = [
          ...document.querySelectorAll<HTMLButtonElement>(
            ".ds-canvas-bottom button:not(:disabled)",
          ),
        ].filter((button) => button.getClientRects().length);
        const target = event.shiftKey ? controls.at(-1) : controls[0];
        const boundary = event.shiftKey ? controls[0] : controls.at(-1);
        if (document.activeElement === boundary) {
          event.preventDefault();
          target?.focus();
        }
        return;
      }
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      exitFocus();
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", escape, true);
      document.getElementById("ds-fullscreen")?.focus({ preventScroll: true });
    };
  }, [focus]);
  const library = (
    <AssetLibrary
      compact={compact}
      locale={locale}
      copy={copy}
      catalog={catalog}
      artworks={artworks}
      workspace={workspace}
      onCategory={(categoryId) => update({ categoryId, section: "artwork" })}
      onSection={(section) => update({ section })}
      onInspect={(inspectedArtworkId) => {
        update({ inspectedArtworkId, inspectorTab: "element" });
        openPanel("inspector");
      }}
    />
  );
  const inspector = (
    <Inspector
      compact={compact}
      split={panels.split}
      onSplit={(split) => setPanels({ split })}
      locale={locale}
      copy={copy}
      product={product}
      variants={variants}
      variant={variant}
      artwork={artwork}
      tab={workspace.inspectorTab}
      onTab={(inspectorTab) => update({ inspectorTab })}
      onVariant={(variantId) => {
        if (
          variantId !== project.garment.variantId &&
          variants.some((item) => item.id === variantId)
        ) {
          setProject((current) => ({
            ...current,
            garment: { ...current.garment, variantId },
          }));
          update({ inspectedArtworkId: null });
        }
      }}
    />
  );
  const tools = (
    <div className="ds-panel-toggles" aria-label={copy.panels}>
      <button
        id="ds-toggle-library"
        type="button"
        aria-expanded={workspace.panel === "library"}
        aria-controls="ds-library-panel"
        onClick={() => (workspace.panel === "library" ? closePanel() : openPanel("library"))}
      >
        <Icon name="image" />
        {copy.tools.library}
      </button>
      {(["text", "upload"] as const).map((section) => (
        <button
          key={section}
          type="button"
          aria-controls="ds-library-panel"
          aria-expanded={workspace.panel === "library" && workspace.section === section}
          onClick={() => update({ panel: "library", section })}
        >
          {section === "text" ? <Icon name="text" /> : <StudioIcon name="upload" />}
          {copy.tools[section]}
        </button>
      ))}
      <button
        id="ds-toggle-inspector"
        type="button"
        aria-expanded={workspace.panel === "inspector"}
        aria-controls="ds-inspector-panel"
        onClick={() => (workspace.panel === "inspector" ? closePanel() : openPanel("inspector"))}
      >
        <Icon name="adjustments" />
        {copy.tools.inspector}
      </button>
    </div>
  );
  return (
    <div
      className="ds-page"
      data-focus={focus}
      data-resizing={resizing}
      data-panel-dock={dock}
      data-panel-side={sideDock}
      data-panel-rail={rail}
      data-panel-side-expanded={narrowSide && sideExpanded}
      data-library-collapsed={collapsed.library}
      data-inspector-collapsed={collapsed.inspector}
      data-panel-expanded={expanded}
      data-locale={locale}
      data-theme={theme}
      data-panel-open={workspace.panel !== null}
    >
      {(["dark", "light"] as const).map((theme) => (
        <Image
          key={theme}
          src={workspaceAssets[theme].src}
          width={workspaceAssets[theme].width}
          height={workspaceAssets[theme].height}
          alt=""
          className={`ds-environment ds-environment-${theme}`}
          sizes="100vw"
          loading="eager"
          unoptimized
          aria-hidden="true"
        />
      ))}
      <header className="ds-header">
        <div className="ds-header-start">
          <div className="ds-brand">
            <Link className="brand-logo" href={`/${locale}`} aria-label={copy.home}>
              <Image
                {...assets.logo[theme === "dark" ? "light" : "navy"]}
                alt="ONYX"
                sizes="88px"
                loading="eager"
              />
            </Link>
            <div className="ds-title-status">
              <h1>{copy.title}</h1>
              <SaveStatus copy={copy} />
            </div>
          </div>
        </div>
        <Link className="ds-home-link" href={`/${locale}`}>
          <Icon name="home" />
          <span>{copy.backHome}</span>
        </Link>
        <div className="ds-header-utilities">
          <AppearanceControl copy={copy} theme={theme} onTheme={setTheme} />
          <LanguageSwitcher locale={locale} label={copy.language} />
        </div>
      </header>
      <main
        ref={main}
        id="main-content"
        className="ds-layout"
        tabIndex={-1}
        style={
          {
            "--ds-left-width": `${widths.library}px`,
            "--ds-right-width": `${widths.inspector}px`,
            "--ds-sheet-height": `${liveSheetHeight ?? snaps[panels.size]}px`,
            "--ds-mobile-width": `${livePanelWidth ?? mobileWidth.value}px`,
          } as CSSProperties
        }
      >
        {!compact && (
          <ResponsivePanel
            id="library"
            resize={
              !collapsed.library && (
                <PanelResizeHandle
                  side="library"
                  label={copy.resizeLibrary}
                  width={widths.library}
                  maximum={widths.libraryMaximum}
                  onResize={(library) => setPanels({ library })}
                  onDragging={setResizing}
                />
              )
            }
            title={copy.library.title}
            collapseLabel={copy.collapsePanel}
            collapsed={collapsed.library}
            onToggle={() => toggleDesktop("library")}
            locale={locale}
          >
            {library}
          </ResponsivePanel>
        )}
        <div
          className="ds-center"
          dir={direction(locale)}
          role={focus ? "dialog" : undefined}
          aria-modal={focus ? true : undefined}
          aria-label={focus ? copy.fullscreen : undefined}
        >
          <Workspace
            compact={compact}
            focus={focus}
            onFocus={toggleFocus}
            tools={compact && workspace.panel && !focus ? null : tools}
            locale={locale}
            copy={copy}
            variant={variant}
            workspace={workspace}
            theme={theme}
            onView={(view) => update({ view })}
            camera={camera}
            onCamera={setCamera}
            onGrid={() => update({ grid: !workspace.grid })}
          />
        </div>
        {!compact && (
          <ResponsivePanel
            id="inspector"
            resize={
              !collapsed.inspector && (
                <PanelResizeHandle
                  side="inspector"
                  label={copy.resizeInspector}
                  width={widths.inspector}
                  maximum={widths.inspectorMaximum}
                  onResize={(inspector) => setPanels({ inspector })}
                  onDragging={setResizing}
                />
              )
            }
            title={copy.properties.title}
            collapseLabel={copy.collapsePanel}
            collapsed={collapsed.inspector}
            onToggle={() => toggleDesktop("inspector")}
            locale={locale}
          >
            {inspector}
          </ResponsivePanel>
        )}
        {compact && (
          <MobileTools
            onPanelChange={openPanel}
            dock={dock}
            rail={rail}
            narrowSide={narrowSide}
            onSideExpanded={setSideExpanded}
            mobileWidth={mobileWidth}
            shortLandscape={
              mainSize.viewportWidth >= 700 &&
              mainSize.viewportWidth < 1000 &&
              mainSize.viewportHeight <= 500
            }
            locale={locale}
            copy={copy}
            panel={workspace.panel}
            suspended={focus}
            preferences={panels}
            onPreferences={changePanels}
            snaps={snaps}
            onLiveHeight={setLiveSheetHeight}
            liveHeight={liveSheetHeight}
            liveWidth={livePanelWidth}
            onLiveWidth={setLivePanelWidth}
            onDragging={setResizing}
            onClose={closePanel}
            library={library}
            inspector={inspector}
          />
        )}
      </main>
      <WorkflowBar locale={locale} copy={copy} product={product} variant={variant} />
    </div>
  );
}

"use client";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import type { SurfaceProps } from "./editor-surface";

const Surface = dynamic(() => import("./editor-surface"), { ssr: false });
class RenderBoundary extends Component<
  { children: ReactNode; message: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p className="ds-render-error" role="alert">
        {this.props.message}
      </p>
    ) : (
      this.props.children
    );
  }
}
export function SurfaceBoundary(props: SurfaceProps) {
  return (
    <RenderBoundary message={props.copy.editor.renderError}>
      <Surface {...props} />
    </RenderBoundary>
  );
}

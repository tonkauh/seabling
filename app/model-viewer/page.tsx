import type { Metadata } from "next";
import ModelViewer from "@/components/model-viewer/ModelViewer";

export const metadata: Metadata = {
  title: "3D Model Studio — SEABLING",
  description:
    "View, orbit, and edit the position, rotation, and scale of a local 3D model.",
};

export default function ModelViewerPage() {
  return <ModelViewer />;
}

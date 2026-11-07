"use client";

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Box3, MathUtils, Mesh, PerspectiveCamera, Vector3 } from "three";
import type { Object3D } from "three";
import type { ModelTransform } from "./types";
import styles from "./ModelViewer.module.css";

const MODEL_URL = "/models/model.glb";

export default function ModelCanvas({
  transform,
}: {
  transform: ModelTransform;
}) {
  const [retryKey, setRetryKey] = useState(0);
  const retryModel = useCallback(() => {
    useGLTF.clear(MODEL_URL);
    setRetryKey((current) => current + 1);
  }, []);

  return (
    <div
      className={styles.canvasShell}
      role="region"
      aria-label="Interactive 3D model. Drag to orbit, scroll or pinch to zoom, and right-drag to pan."
    >
      <Canvas
        className={styles.canvas}
        camera={{ position: [5, 4, 7], fov: 40, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true, powerPreference: "high-performance" }}
        fallback={
          <div className={styles.canvasError} role="alert">
            This browser could not create a WebGL context. Try an up-to-date
            browser with hardware acceleration enabled.
          </div>
        }
      >
        <color attach="background" args={["#e8e7e1"]} />
        <fog attach="fog" args={["#e8e7e1", 18, 45]} />
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#fff8e9", "#72746f", 1.5]} />
        <directionalLight
          castShadow
          position={[6, 10, 5]}
          intensity={3.2}
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
          shadow-bias={-0.00015}
        />

        <mesh
          position={[0, -0.035, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[200, 200]} />
          <shadowMaterial transparent opacity={0.2} />
        </mesh>

        <ModelErrorBoundary key={retryKey} onRetry={retryModel}>
          <Suspense fallback={<LoadingIndicator />}>
            <ModelStage transform={transform} />
          </Suspense>
        </ModelErrorBoundary>
      </Canvas>
    </div>
  );
}

function LoadingIndicator() {
  const { progress } = useProgress();
  const percentage = Math.round(progress);

  return (
    <Html center>
      <div className={styles.loadingCard} role="status" aria-live="polite">
        <span className={styles.spinner} aria-hidden="true" />
        <strong>Preparing your model</strong>
        <span>{percentage}%</span>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Model loading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </Html>
  );
}

function ModelStage({ transform }: { transform: ModelTransform }) {
  const { scene } = useGLTF(MODEL_URL);
  const prepared = useMemo(() => {
    const object = scene.clone(true);
    const bounds = new Box3().setFromObject(object);

    if (bounds.isEmpty()) {
      throw new Error("The GLB file does not contain any renderable geometry.");
    }

    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());

    object.traverse((node: Object3D) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    return {
      object,
      size,
      offset: new Vector3(-center.x, -bounds.min.y, -center.z),
    };
  }, [scene]);

  return (
    <>
      <group
        position={[transform.position.x, transform.position.y, transform.position.z]}
        rotation={[
          MathUtils.degToRad(transform.rotation.x),
          MathUtils.degToRad(transform.rotation.y),
          MathUtils.degToRad(transform.rotation.z),
        ]}
        scale={[transform.scale.x, transform.scale.y, transform.scale.z]}
      >
        <group position={prepared.offset}>
          <primitive object={prepared.object} />
        </group>
      </group>
      <ContactShadows
        position={[0, -0.025, 0]}
        opacity={0.42}
        scale={18}
        blur={2.5}
        far={10}
        resolution={512}
      />
      <AutoFitCamera size={prepared.size} />
    </>
  );
}

function AutoFitCamera({ size }: { size: Vector3 }) {
  const { camera, size: viewportSize } = useThree();

  useEffect(() => {
    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    const radius = size.length() / 2;
    const verticalFov = MathUtils.degToRad(
      camera instanceof PerspectiveCamera ? camera.fov : 40,
    );
    const aspect = viewportSize.width / Math.max(viewportSize.height, 1);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(aspect, 0.1));
    const fitFov = Math.min(verticalFov, horizontalFov);
    const distance = (radius / Math.sin(fitFov / 2)) * 1.2;
    const target = new Vector3(0, size.y * 0.48, 0);

    camera.position.set(distance * 0.72, distance * 0.52, distance);
    camera.near = Math.max(0.01, maxDimension / 1000);
    camera.far = Math.max(100, distance * 8);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }, [camera, size, viewportSize.height, viewportSize.width]);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={Math.max(100, size.length() * 8)}
      target={[0, size.y * 0.48, 0]}
      maxPolarAngle={Math.PI * 0.49}
    />
  );
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unable to load the 3D model.", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <Html center>
          <div className={styles.modelError} role="alert">
            <strong>Model could not be loaded</strong>
            <span>
              Check that <code>{MODEL_URL}</code> exists and contains a valid
              GLB 2.0 model.
            </span>
            <button type="button" onClick={this.props.onRetry}>
              Retry loading
            </button>
          </div>
        </Html>
      );
    }

    return this.props.children;
  }
}

import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface LiquidMetalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  id?: string;
}

export function LiquidMetalCard({
  title,
  description,
  icon,
  onClick,
  id,
}: LiquidMetalCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const shaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const shaderMount = useRef<any>(null);

  useEffect(() => {
    const styleId = "shader-canvas-style-card";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-card canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 20px !important;
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy();
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.0,
              u_shiftBlue: 0.0,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("Failed to load card shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(isHovered ? 1.5 : 0.6);
    }
  }, [isHovered]);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <div
      id={id}
      className="relative cursor-pointer select-none h-full"
      style={{
        perspective: "1000px",
        perspectiveOrigin: "50% 50%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: isPressed ? "scale(0.96)" : isHovered ? "scale(1.02) translateY(-4px)" : "scale(1)",
        }}
      >
        {/* Layer 1: Liquid Metal Shader Backdrop */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: "translateZ(0px)",
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: "100%",
              borderRadius: "20px",
              boxShadow: isPressed
                ? "0px 0px 0px 1px rgba(0, 0, 0, 0.5), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                : isHovered
                  ? "0px 0px 0px 1px rgba(0, 0, 0, 0.4), 0px 18px 40px -18px rgba(255,255,255,0.2), 0px 8px 16px -8px rgba(0,0,0,0.4)"
                  : "0px 0px 0px 1px rgba(0, 0, 0, 0.3), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease",
              background: "transparent",
            }}
          >
            <div
              ref={shaderRef}
              className="shader-container-card"
              style={{
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>

        {/* Layer 2: Dark Plate Layer */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: "translateZ(10px)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "calc(100% - 4px)",
              height: "calc(100% - 4px)",
              margin: "2px",
              borderRadius: "18px",
              background: "linear-gradient(180deg, #202020 0%, #000000 100%)",
              boxShadow: isPressed
                ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                : "none",
              transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease",
            }}
          />
        </div>

        {/* Layer 3: Interactive Content Layer */}
        <div
          style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transform: "translateZ(20px)",
            zIndex: 30,
            padding: "20px 20px 22px",
          }}
          className="flex flex-col h-full items-start"
        >
          {/* Icon Wrap */}
          <div className="custom-icon-wrap" style={{ pointerEvents: "none" }}>
            {icon}
          </div>

          <h3
            style={{
              fontSize: "14.5px",
              fontWeight: 600,
              margin: "0 0 6px",
              letterSpacing: "-0.01em",
              color: "#F5F7FA",
            }}
          >
            {title}
          </h3>

          <p
            style={{
              fontSize: "12.5px",
              lineHeight: 1.55,
              margin: 0,
              color: "#94A3B8",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

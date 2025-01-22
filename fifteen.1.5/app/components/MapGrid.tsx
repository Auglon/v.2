import { useRef, useState, useEffect } from "react";
import type { Sector, UnknownEntity, EmergencyLevel } from "../types/map";
import type { transform } from "next/dist/build/swc/generated-native";
import path from "path";
import { text } from "stream/consumers";
import type style from "styled-jsx/style";
import { map } from "zod";

interface MapGridProps {
  sectors: Sector[];
  unknownEntity: UnknownEntity;
  onSectorSelect: (sector: Sector) => void;
  emergencyLevel: EmergencyLevel;
}

export function MapGrid({
  sectors,
  unknownEntity,
  onSectorSelect,
  emergencyLevel,
}: MapGridProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null); // Ref for the audio element
  const viewBoxSize = 2000;

  // Load the alarm sound
  useEffect(() => {
    audioRef.current = new Audio("/alarm.mp3"); // Replace with your actual path
    audioRef.current.loop = true; // Loop the alarm sound
    audioRef.current.volume = 0.8;
  }, []);

  // Play/pause the alarm based on emergencyLevel
  useEffect(() => {
    if (emergencyLevel === "RED") {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [emergencyLevel]);

  const getSectorPath = (id: string) => {
    switch (id) {
      case "R":
        // Reactor Core (more realistic shape)
        return `
        M1000,850 
        L1100,900 
        L1100,1000 
        L1000,1050 
        L900,1000 
        L900,900 
        Z`;
      case "PS":
        // Power Station (detailed)
        return `
        M1200,800 
        L1400,800 
        L1400,850 
        L1380,850
        L1380,900 
        L1400,900
        L1400,920 
        L1200,920 
        Z`;
      case "LA":
        // Lab A (more realistic)
        return `
        M700,400 
        L950,400 
        L950,550 
        L1000,550
        L1000,600 
        L700,600 
        Z`;
      case "LB":
        // Lab B (improved)
        return `
        M400,400 
        L600,350 
        L650,350
        L650,400
        L700,400
        L700,500 
        L400,550 
        Z`;
      case "LC":
        // Lab C (more detail)
        return `
        M300,700 
        L450,680 
        L450,720
        L500,720
        L500,750 
        L470,750
        L470,820 
        L300,800 
        Z`;
      case "Q":
        // Living Quarters (realistic layout)
        return `
        M1100,1200 
        L1150,1150 
        L1250,1150 
        L1250,1200
        L1300,1200
        L1300,1300 
        L1250,1300
        L1250,1350 
        L1150,1350 
        L1100,1300 
        Z`;
      case "MB":
        // Medical Bay (more realistic)
        return `
        M800,1200 
        L800,1180
        Q820,1160 850,1160 
        L950,1160 
        Q1000,1170 1000,1200
        L1000,1220
        Q980,1240 950,1240
        L850,1240
        Q800,1230 800,1220
        Z
        `;
      case "C2":
        // Command Center
        return `
        M1300,500
        C1300,450 1350,400 1400,450
        L1450,450
        C1450,450 1500,450 1500,500
        C1500,550 1450,550 1450,550
        L1400,550
        C1350,600 1300,550 1300,500
        `;
      case "ST":
        // Storage (detailed)
        return `
        M200,1100 
        L300,1100 
        L300,1150
        L400,1150
        L400,1300 
        L200,1300 
        Z`;
      case "CV":
        // Cargo Vault (detailed)
        return `
        M450,1050 
        L650,1050 
        L650,1150
        L600,1150
        L600,1200
        L650,1200
        L650,1300 
        L450,1300 
        Z`;
      case "T":
        // Radio Tower (more realistic)
        return `
        M1800,200 
        L1850,100 
        L1900,200 
        L1900,300
        L1875,300
        L1875,400 
        L1850,450 
        L1825,400
        L1825,300
        L1800,300
        Z`;
      case "H":
        // Hydroponics / Biosphere (detailed)
        return `
        M300,1400
        A 200 200 0 0 1 700 1400
        L700,1450
        C650,1550 550,1600 450,1550
        L300,1500
        Z`;
      case "M":
        // Maintenance (more detail)
        return `
        M900,700 
        L950,680 
        L1000,720 
        L1000,750
        L950,750
        L950,800 
        L900,800 
        Z`;
      default:
        return "";
    }
  };

  const getCorridorPaths = () => {
    return [
      // Main corridors with more detail
      "M300,350 L700,350 L750,360 L1350,360 L1400,350",
      "M850,600 L950,650 L1000,700 L1000,850",
      "M1100,900 L1150,920 L1200,920",
      "M600,450 L650,450 L700,450",
      "M500,550 L700,600 L900,680",
      "M950,750 L950,850",
      "M1050,950 L1100,900 L1150,750 L1250,600 L1300,550",
      "M1400,500 L1400,800 L1380,850",
      "M1000,1000 L1050,1050 L1100,1100 L1100,1200",
      "M900,1200 C900,1050 950,1050 950,1000",
      "M1100,1300 L950,1280 L800,1200",
      "M400,1200 L450,1200",
      "M450,1050 L400,900 L400,700",
      "M400,700 L400,500",
      "M450,1300 L400,1350 L300,1450",
      "M1400,350 L1600,300 L1800,200",

      // Service tunnels with more realistic paths
      "M700,600 L700,1400",
      "M1000,600 L1000,1160",
    ];
  };

  const getEntityPosition = () => {
    const x = 100 + unknownEntity.position.x * 180;
    const y = 100 + unknownEntity.position.y * 180;
    return { x, y };
  };

  const handleSectorClick = (sector: Sector) => {
    onSectorSelect(sector);
  };

  // Function to get the center of a sector for label positioning
  const getSectorCenter = (sectorId: string) => {
    const pathData = getSectorPath(sectorId);
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathElement.setAttribute("d", pathData);
    const pathLength = pathElement.getTotalLength();
    const midpoint = pathElement.getPointAtLength(pathLength / 2);

    // Default positions in case midpoint calculation fails
    let labelX = 1000;
    let labelY = 1000;

    // Use midpoint if available
    if (midpoint && midpoint.x && midpoint.y) {
      labelX = midpoint.x;
      labelY = midpoint.y;
    }

    return { x: labelX, y: labelY };
  };

  return (
    <div className="relative w-full aspect-square max-w-[1200px] mx-auto">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full"
        style={{
          filter:
            emergencyLevel === "RED"
              ? "drop-shadow(0 0 15px rgba(255,0,0,0.7))"
              : undefined,
        }}
      >
        {/* --- DEFINITIONS --- */}
        <defs>
          {/* More realistic grid background */}
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <rect width="50" height="50" fill="#000000" />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#ffa500"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <circle cx="50" cy="50" r="1" fill="#ffa500" opacity="0.3" />
          </pattern>

          {/* Sector glow */}
          <radialGradient id="sectorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,165,0,0.4)" />
            <stop offset="100%" stopColor="rgba(255,165,0,0)" />
          </radialGradient>

          {/* Pattern for service tunnels */}
          <pattern
            id="servicePattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="20" height="20" fill="none" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="20"
              stroke="rgba(255,165,0,0.4)"
              strokeWidth="3"
            />
          </pattern>

          {/* Hatch pattern for walls */}
          <pattern
            id="wallHatch"
            width="4"
            height="4"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="4" height="4" fill="#000000" />
            <line x1="0" y1="0" x2="0" y2="4" stroke="#ffa500" opacity="0.3" />
          </pattern>
        </defs>

        {/* --- BACKGROUND --- */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* --- WALLS --- */}
        <g className="walls">
          <rect
            x="50"
            y="50"
            width={viewBoxSize - 100}
            height={viewBoxSize - 100}
            fill="url(#wallHatch)"
            stroke="#ffa500"
            strokeWidth="5"
            style={{
              filter: "drop-shadow(0 0 2px rgba(255,165,0,0.5))"
            }}
          />
        </g>

        {/* --- CORRIDORS (some standard, some service) --- */}
        <g className="corridors">
          {getCorridorPaths().map((path, idx) => {
            const isService = idx >= 16;
            const strokeWidth = isService ? 5 : 10;
            const opacity = isService ? 0.3 : 0.7;

            return (
              <path
                key={`corridor-${idx}`}
                d={path}
                stroke={isService ? "url(#servicePattern)" : "#ffa500"}
                strokeWidth={strokeWidth}
                fill="none"
                opacity={opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: "drop-shadow(0 0 1px rgba(255,165,0,0.3))"
                }}
              />
            );
          })}
        </g>

        {/* --- SECTORS --- */}
        {sectors.map((sector) => {
          const pathData = getSectorPath(sector.id);
          if (!pathData) return null;

          const glowOpacity = sector.powerOutput
            ? sector.powerOutput / 100
            : 0.1;
          const fillOpacity = sector.powerOutput
            ? sector.powerOutput / 200
            : 0.1;

          const labelPosition = getSectorCenter(sector.id);

          return (
            <g key={sector.id} className="sector">
              {/* Glow */}
              <path
                d={pathData}
                fill="url(#sectorGlow)"
                opacity={glowOpacity}
                style={{
                  filter: "drop-shadow(0 0 3px rgba(255,165,0,0.6))"
                }}
              />
              {/* Main sector body */}
              <path
                d={pathData}
                fill={`rgba(255,165,0,${fillOpacity})`}
                stroke="#ffa500"
                strokeWidth="2"
                onClick={() => handleSectorClick(sector)}
                className="cursor-pointer transition-colors duration-200 hover:fill-[rgba(255,165,0,0.3)]"
                style={{
                  filter: "drop-shadow(0 0 2px rgba(255,165,0,0.4))"
                }}
              />
              {/* Label */}
              <text
                x={labelPosition.x}
                y={labelPosition.y}
                fill="#ffa500"
                fontSize="38"
                fontWeight="600"
                textAnchor="middle"
                alignmentBaseline="middle"
                fontFamily="'VT323', monospace"
                className="pointer-events-none"
                style={{
                  filter: "drop-shadow(0 0 1px rgba(255,165,0,0.8))"
                }}
              >
                {sector.id}
              </text>
            </g>
          );
        })}

        {/* --- UNKNOWN ENTITY --- */}
        {unknownEntity && (
          <g
            transform={`translate(${getEntityPosition().x},${
              getEntityPosition().y
            })`}
          >
            <circle
              r="30"
              fill="none"
              stroke="rgba(255,0,0,0.2)"
              strokeWidth="1"
              className="animate-ping"
              style={{
                filter: "drop-shadow(0 0 2px rgba(255,0,0,0.4))"
              }}
            />
            <circle
              r="15"
              fill="none"
              stroke="rgba(255,0,0,0.4)"
              strokeWidth="2"
              className="animate-ping"
              style={{ 
                animationDelay: "-0.5s",
                filter: "drop-shadow(0 0 2px rgba(255,0,0,0.6))"
              }}
            />
            <circle 
              r="5" 
              fill="#FF0000" 
              className="animate-pulse"
              style={{
                filter: "drop-shadow(0 0 3px rgba(255,0,0,0.8))"
              }}
            />
          </g>
        )}

        {/* --- EMERGENCY OVERLAY --- */}
        {emergencyLevel !== "GREEN" && (
          <>
            <rect
              width="100%"
              height="100%"
              fill={
                emergencyLevel === "RED"
                  ? "rgba(255,0,0,0.2)"
                  : emergencyLevel === "ORANGE"
                  ? "rgba(255,165,0,0.2)"
                  : "rgba(255,255,0,0.2)"
              }
              className={
                emergencyLevel === "RED"
                  ? "animate-pulse"
                  : ""
              }
              style={{
                mixBlendMode: "overlay"
              }}
            />
            {/* More prominent emergency indicators */}
            {emergencyLevel === "RED" && (
              <g className="emergency-indicators">
                {[0, 90, 180, 270].map((angle) => (
                  <path
                    key={`warning-${angle}`}
                    d="M-50,-250 L50,-250 L0,-150 Z"
                    fill="rgba(255,0,0,0.7)"
                    stroke="rgba(255,0,0,0.9)"
                    strokeWidth="2"
                    className="animate-pulse"
                    transform={`translate(1000,1000) rotate(${angle}) scale(1.5)`}
                    style={{
                      filter: "drop-shadow(0 0 4px rgba(255,0,0,0.8))"
                    }}
                  />
                ))}
              </g>
            )}
          </>
        )}
      </svg>
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
          mixBlendMode: "multiply",
          opacity: 0.3
        }}
      />
    </div>
  );
}
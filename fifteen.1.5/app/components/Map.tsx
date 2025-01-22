"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Skull } from "lucide-react"
import { MapGrid } from "./MapGrid"
import type { EmergencyLevel, Sector, UnknownEntity } from "../types/map"
import { updateMetric, getMotionData, invokeLockdown } from "../utils/mapUtils"
import "../styles/terminal.css"

const INITIAL_EMERGENCY_LEVEL: EmergencyLevel = "GREEN"

const INITIAL_SECTORS: Sector[] = [
  { id: "R", name: "Reactor Core", temperature: 100, coolantPressure: 50, radiationLeak: 0 },
  { id: "A", name: "Main Hallway A", motionDetected: false, airQuality: 95, lightingCondition: 100 },
  { id: "B", name: "Main Hallway B", motionDetected: false, airQuality: 97, lightingCondition: 98 },
  { id: "C", name: "Main Hallway C", motionDetected: false, airQuality: 96, lightingCondition: 99 },
  { id: "T", name: "Radio Tower", interference: 10, signalStrength: 80, weather: "Clear" },
  { id: "H", name: "Biosphere", oxygenLevel: 95, plantCondition: 90, soilMoisture: 75 },
  { id: "S", name: "Armory", lockdownStatus: false, ammoReserves: 100, cameraStatus: "Online" },
]

const INITIAL_UNKNOWN_ENTITY: UnknownEntity = {
  position: { x: 5, y: 5 },
  lastSeenSector: "B",
}

export default function Map() {
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS)
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>(INITIAL_EMERGENCY_LEVEL)
  const [unknownEntity, setUnknownEntity] = useState<UnknownEntity>(INITIAL_UNKNOWN_ENTITY)
  const [systemMessages, setSystemMessages] = useState<string[]>([])
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      updateMapData()
      triggerRandomGlitch()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const triggerRandomGlitch = () => {
    if (Math.random() > 0.7) {
      setGlitching(true)
      setTimeout(() => setGlitching(false), 500)
    }
  }

  const addSystemMessage = (message: string) => {
    setSystemMessages((prev) => [...prev, `[SYSTEM] ${message}`].slice(-5))
  }

  const updateMapData = () => {
    setSectors((prevSectors) =>
      prevSectors.map((sector) => {
        const updatedSector = {
          ...sector,
          temperature: sector.temperature ? updateMetric(sector.temperature, 0, 200, 10) : undefined,
          coolantPressure: sector.coolantPressure ? updateMetric(sector.coolantPressure, 0, 100, 5) : undefined,
          radiationLeak: sector.radiationLeak ? updateMetric(sector.radiationLeak, 0, 100, 2) : undefined,
          airQuality: sector.airQuality ? updateMetric(sector.airQuality, 0, 100, 5) : undefined,
          lightingCondition: sector.lightingCondition ? updateMetric(sector.lightingCondition, 0, 100, 3) : undefined,
        }

        if (updatedSector.temperature && updatedSector.temperature > 150) {
          addSystemMessage(`WARNING: Critical temperature in ${sector.name}`)
        }

        return updatedSector
      }),
    )

    updateEmergencyLevel()
    moveUnknownEntity()
  }

  const updateEmergencyLevel = () => {
    const reactorSector = sectors.find((s) => s.id === "R")
    if (reactorSector && reactorSector.temperature && reactorSector.temperature > 150) {
      setEmergencyLevel("RED")
      addSystemMessage("EMERGENCY: Reactor meltdown imminent")
    } else if (reactorSector && reactorSector.temperature && reactorSector.temperature > 120) {
      setEmergencyLevel("ORANGE")
      addSystemMessage("WARNING: Reactor temperature exceeding safe levels")
    } else if (unknownEntity.position.x < 3 && unknownEntity.position.y < 3) {
      setEmergencyLevel("YELLOW")
      addSystemMessage("ALERT: Unknown entity proximity warning")
    }
  }

  const moveUnknownEntity = () => {
    setUnknownEntity((prev) => {
      const newX = Math.max(0, Math.min(10, prev.position.x + Math.floor(Math.random() * 3) - 1))
      const newY = Math.max(0, Math.min(10, prev.position.y + Math.floor(Math.random() * 3) - 1))
      const newSector = ["A", "B", "C"][Math.floor(Math.random() * 3)]

      if (newSector !== prev.lastSeenSector) {
        addSystemMessage(`Movement detected in Sector ${newSector}`)
      }

      return {
        position: { x: newX, y: newY },
        lastSeenSector: newSector,
      }
    })
  }

  return (
    <div className="terminal min-h-screen p-8">
      <div className={`max-w-4xl mx-auto ${glitching ? "flicker" : ""}`}>
        <header className="mb-8">
          <h1 className="text-2xl font-bold mb-2 glitch" data-text="UPSILON-7 FACILITY MONITORING SYSTEM">
            UPSILON-7 FACILITY MONITORING SYSTEM
          </h1>
          <div className="text-sm opacity-70">
            <div>K.E.R.O.S. v4.9.1 - © Erebus Corp. 2147</div>
            <div>Quantum Architecture: [INITIALIZING...]</div>
          </div>
        </header>

        <div className="grid gap-6">
          <div
            className={`p-4 border ${
              emergencyLevel === "RED"
                ? "border-red-500 bg-red-500/10"
                : emergencyLevel === "ORANGE"
                  ? "border-orange-500 bg-orange-500/10"
                  : emergencyLevel === "YELLOW"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : "border-green-500 bg-green-500/10"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {emergencyLevel !== "GREEN" && <AlertTriangle className="w-5 h-5" />}
              <span className="font-bold">Emergency Level: {emergencyLevel}</span>
            </div>
            <div className="text-sm opacity-70">
              {emergencyLevel === "RED" && "CRITICAL: Immediate evacuation required"}
              {emergencyLevel === "ORANGE" && "WARNING: Severe system instability detected"}
              {emergencyLevel === "YELLOW" && "CAUTION: Unknown entity presence confirmed"}
              {emergencyLevel === "GREEN" && "Systems operating within normal parameters"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-[#FFB000]/30 bg-black/30">
              <MapGrid sectors={sectors} unknownEntity={unknownEntity} />
            </div>

            <div className="p-4 border border-[#FFB000]/30 bg-black/30">
              <h2 className="text-lg font-bold mb-4">System Messages</h2>
              <div className="space-y-2">
                {systemMessages.map((message, index) => (
                  <div key={index} className="text-sm font-mono">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sectors.map((sector) => (
              <div key={sector.id} className="p-4 border border-[#FFB000]/30 bg-black/30">
                <h3 className="font-bold mb-2">{sector.name}</h3>
                <div className="space-y-1 text-sm">
                  {sector.temperature && <div>Temperature: {sector.temperature.toFixed(1)}°C</div>}
                  {sector.coolantPressure && <div>Coolant: {sector.coolantPressure.toFixed(1)}%</div>}
                  {sector.airQuality && <div>Air Quality: {sector.airQuality.toFixed(1)}%</div>}
                  {sector.lightingCondition && <div>Lighting: {sector.lightingCondition.toFixed(1)}%</div>}
                  {sector.oxygenLevel && <div>Oxygen: {sector.oxygenLevel.toFixed(1)}%</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


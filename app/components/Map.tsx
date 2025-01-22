"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertTriangle, Skull, Radio, Thermometer, Wind, Shield, Power } from "lucide-react"
import { MapGrid } from "./MapGrid"
import type { EmergencyLevel, Sector, UnknownEntity, SystemMessage } from "../types/map"
import { updateMetric, getMotionData, invokeLockdown } from "../utils/mapUtils"
import { useAudio } from "../hooks/useAudio"

const INITIAL_EMERGENCY_LEVEL: EmergencyLevel = "GREEN"

const INITIAL_SECTORS: Sector[] = [
  {
    id: "R",
    name: "Reactor Core", 
    temperature: 100,
    coolantPressure: 50,
    radiationLeak: 0,
    powerOutput: 85,
    status: "STABLE",
  },
  {
    id: "A",
    name: "Main Hallway A",
    motionDetected: false,
    airQuality: 95,
    lightingCondition: 100,
    securityStatus: "NOMINAL",
    doorStatus: "OPEN",
  },
  {
    id: "B", 
    name: "Main Hallway B",
    motionDetected: false,
    airQuality: 97,
    lightingCondition: 98,
    securityStatus: "NOMINAL",
    doorStatus: "OPEN",
  },
  {
    id: "C",
    name: "Main Hallway C",
    motionDetected: false,
    airQuality: 96,
    lightingCondition: 99,
    securityStatus: "NOMINAL",
    doorStatus: "OPEN",
  },
  {
    id: "T",
    name: "Radio Tower",
    interference: 10,
    signalStrength: 80,
    weather: "Clear",
    transmissionStatus: "ACTIVE",
    lastTransmission: "NO SIGNAL",
  },
  {
    id: "H",
    name: "Biosphere",
    oxygenLevel: 95,
    plantCondition: 90,
    soilMoisture: 75,
    contamination: 0,
    quarantineStatus: "INACTIVE",
  },
  {
    id: "S",
    name: "Armory",
    lockdownStatus: false,
    ammoReserves: 100,
    cameraStatus: "Online",
    securityLevel: "HIGH",
    breachStatus: "SECURE",
  },
]

const INITIAL_UNKNOWN_ENTITY: UnknownEntity = {
  position: { x: 5, y: 5 },
  lastSeenSector: "B",
  movementPattern: "ERRATIC",
  threatLevel: "UNKNOWN",
  signatureType: "ANOMALOUS",
}

export default function Map() {
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS)
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>(INITIAL_EMERGENCY_LEVEL)
  const [unknownEntity, setUnknownEntity] = useState<UnknownEntity>(INITIAL_UNKNOWN_ENTITY)
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([])
  const [glitching, setGlitching] = useState(false)
  const [powerStatus, setPowerStatus] = useState<"NORMAL" | "FLUCTUATING" | "CRITICAL">("NORMAL")
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null)
  const [staticBurst, setStaticBurst] = useState(false)
  
  const messageIdCounter = useRef(0)
  const alarmSound = useAudio("/alarm.mp3")
  const roarSound = useAudio("/roar.mp3")
  const staticSound = useAudio("/static.mp3")

  const addSystemMessage = useCallback((message: string, type: "INFO" | "WARNING" | "ERROR" | "CRITICAL") => {
    const timestamp = new Date().toLocaleTimeString()
    messageIdCounter.current += 1
    
    const newMessage: SystemMessage = {
      id: messageIdCounter.current,
      timestamp,
      message,
      type,
    }
    
    setSystemMessages((prev) => [...prev, newMessage].slice(-8))
  }, [])

  const triggerStaticBurst = useCallback(() => {
    setStaticBurst(true)
    setTimeout(() => setStaticBurst(false), 100)
  }, [])

  const triggerGlitch = useCallback(() => {
    setGlitching(true)
    setTimeout(() => setGlitching(false), 500)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      updateMapData()
      if (Math.random() > 0.9) triggerGlitch()
      if (Math.random() > 0.95) triggerStaticBurst()
    }, 5000)

    return () => clearInterval(interval)
  }, [triggerGlitch, triggerStaticBurst])

  useEffect(() => {
    if (emergencyLevel === "RED") {
      alarmSound.play()
    } else {
      alarmSound.stop()
    }
  }, [emergencyLevel, alarmSound])

  useEffect(() => {
    const distance = Math.sqrt(
      Math.pow(unknownEntity.position.x - 5, 2) + 
      Math.pow(unknownEntity.position.y - 5, 2)
    )

    if (distance < 3) {
      roarSound.play()
    } else if (distance < 5) {
      staticSound.play()
    } else {
      roarSound.stop()
      staticSound.stop()
    }
  }, [unknownEntity.position, roarSound, staticSound])

  const updateMapData = useCallback(() => {
    setSectors((prevSectors) =>
      prevSectors.map((sector) => {
        const updatedSector = {
          ...sector,
          temperature: sector.temperature ? updateMetric(sector.temperature, 0, 200, 10) : undefined,
          coolantPressure: sector.coolantPressure ? updateMetric(sector.coolantPressure, 0, 100, 5) : undefined,
          radiationLeak: sector.radiationLeak ? updateMetric(sector.radiationLeak, 0, 100, 2) : undefined,
          airQuality: sector.airQuality ? updateMetric(sector.airQuality, 0, 100, 5) : undefined,
          lightingCondition: sector.lightingCondition ? updateMetric(sector.lightingCondition, 0, 100, 3) : undefined,
          powerOutput: sector.powerOutput ? updateMetric(sector.powerOutput, 0, 100, 8) : undefined,
        }

        if (updatedSector.temperature && updatedSector.temperature > 150) {
          addSystemMessage(`CRITICAL: Temperature spike in ${sector.name}`, "CRITICAL")
          triggerGlitch()
        }

        if (updatedSector.radiationLeak && updatedSector.radiationLeak > 50) {
          addSystemMessage(`WARNING: Radiation leak detected in ${sector.name}`, "WARNING")
          triggerStaticBurst()
        }

        return updatedSector
      }),
    )

    updateEmergencyLevel()
    moveUnknownEntity()
  }, [addSystemMessage, triggerGlitch, triggerStaticBurst])

  const updateEmergencyLevel = useCallback(() => {
    const reactorSector = sectors.find((s) => s.id === "R")
    if (reactorSector?.temperature && reactorSector.temperature > 150) {
      setEmergencyLevel("RED")
      setPowerStatus("CRITICAL")
      addSystemMessage("EMERGENCY: Reactor meltdown imminent", "CRITICAL")
    } else if (reactorSector?.temperature && reactorSector.temperature > 120) {
      setEmergencyLevel("ORANGE")
      setPowerStatus("FLUCTUATING")
      addSystemMessage("WARNING: Reactor temperature exceeding safe levels", "WARNING")
    } else if (unknownEntity.position.x < 3 && unknownEntity.position.y < 3) {
      setEmergencyLevel("YELLOW")
      addSystemMessage("ALERT: Unknown entity proximity warning", "WARNING")
    }
  }, [sectors, unknownEntity.position, addSystemMessage])

  const moveUnknownEntity = useCallback(() => {
    setUnknownEntity((prev) => {
      const newX = Math.max(0, Math.min(10, prev.position.x + Math.floor(Math.random() * 3) - 1))
      const newY = Math.max(0, Math.min(10, prev.position.y + Math.floor(Math.random() * 3) - 1))
      const newSector = ["A", "B", "C"][Math.floor(Math.random() * 3)]

      if (newSector !== prev.lastSeenSector) {
        addSystemMessage(`Movement detected in Sector ${newSector}`, "WARNING")
        triggerStaticBurst()
      }

      return {
        ...prev,
        position: { x: newX, y: newY },
        lastSeenSector: newSector,
        movementPattern: Math.random() > 0.7 ? "APPROACHING" : "ERRATIC",
        threatLevel: Math.random() > 0.8 ? "EXTREME" : "UNKNOWN",
      }
    })
  }, [addSystemMessage, triggerStaticBurst])

  return (
    <div className={`facility-map ${glitching ? 'glitch' : ''} ${staticBurst ? 'static-burst active' : ''}`}>
      <div className="map-container">
        <header className="map-header">
          <h2 className="text-sm font-bold mb-2">FACILITY MONITORING</h2>
          <div className="text-xs opacity-70 flex items-center gap-2">
            <span>Power: {powerStatus}</span>
            <Power
              className={`w-3 h-3 ${
                powerStatus === "CRITICAL"
                  ? "text-amber-900 animate-pulse"
                  : powerStatus === "FLUCTUATING"
                    ? "text-amber-500 animate-pulse"
                    : "text-amber-700"
              }`}
            />
          </div>
        </header>

        <div className={`p-4 ${glitching ? "glitch" : ""}`}>
         
          
       

          <div className="mt-4">
            <h3 className="text-xs font-bold mb-2">System Messages</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-none">
              {systemMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`text-[10px] ${
                    msg.type === "CRITICAL"
                      ? "text-amber-900"
                      : msg.type === "ERROR"
                        ? "text-amber-500"
                        : msg.type === "WARNING"
                          ? "text-amber-500"
                          : "text-amber-700"
                  }`}
                >
                  [{msg.timestamp}] {msg.message}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="map-overlay">

        </div>
      </div>
    </div>
  )
}

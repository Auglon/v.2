import type { type } from "os"

export type EmergencyLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED"

export interface SystemMessage {
  id: number
  timestamp: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "CRITICAL"
}

export interface Sector {
  id: string
  name: string
  temperature?: number
  coolantPressure?: number
  radiationLeak?: number
  motionDetected?: boolean
  airQuality?: number
  lightingCondition?: number
  interference?: number
  signalStrength?: number
  weather?: string
  oxygenLevel?: number
  plantCondition?: number
  soilMoisture?: number
  lockdownStatus?: boolean
  ammoReserves?: number
  cameraStatus?: string
  powerOutput?: number
  securityStatus?: string
  doorStatus?: string
  transmissionStatus?: string
  lastTransmission?: string
  contamination?: number
  quarantineStatus?: string
  securityLevel?: string
  breachStatus?: string
  status?: string
}

export interface UnknownEntity {
  position: { x: number; y: number }
  lastSeenSector: string
  movementPattern: "ERRATIC" | "HUNTING" | "STALKING"
  threatLevel: "UNKNOWN" | "HIGH" | "EXTREME"
  signatureType: "ANOMALOUS" | "BIOLOGICAL" | "UNKNOWN"
}



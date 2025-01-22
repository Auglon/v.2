export type EmergencyLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED"

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
}

export interface UnknownEntity {
  position: { x: number; y: number }
  lastSeenSector: string
}


import type { Sector, UnknownEntity } from "../types/map"

interface MapGridProps {
  sectors: Sector[]
  unknownEntity: UnknownEntity
}

export function MapGrid({ sectors, unknownEntity }: MapGridProps) {
  const gridSize = 11
  const grid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(null))

  // Place sectors on the grid
  sectors.forEach((sector, index) => {
    const row = Math.floor(index / 3) * 3 + 1
    const col = (index % 3) * 3 + 1
    grid[row][col] = sector
  })

  // Place unknown entity
  grid[unknownEntity.position.y][unknownEntity.position.x] = "UNKNOWN"

  return (
    <div className="font-mono text-xs leading-none select-none">
      <div className="mb-2">FACILITY SCHEMATIC [TOP VIEW]</div>
      <pre className="grid grid-cols-11 gap-0">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            let content = "."
            let classes = "w-6 h-6 flex items-center justify-center"

            if (cell === "UNKNOWN") {
              content = "?"
              classes += " text-red-500 animate-pulse"
            } else if (cell) {
              content = cell.id
              classes += " text-[#FFB000]"

              // Add connecting lines
              if (rowIndex > 0 && grid[rowIndex - 1][colIndex]?.id) {
                content = "║"
              }
              if (colIndex > 0 && grid[rowIndex][colIndex - 1]?.id) {
                content = "═"
              }
              if (
                rowIndex > 0 &&
                colIndex > 0 &&
                grid[rowIndex - 1][colIndex]?.id &&
                grid[rowIndex][colIndex - 1]?.id
              ) {
                content = "╬"
              }
            }

            return (
              <div key={`${rowIndex}-${colIndex}`} className={classes}>
                {content}
              </div>
            )
          }),
        )}
      </pre>
    </div>
  )
}


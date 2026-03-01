import { useMemo } from 'react'
import { Source, Layer } from '@vis.gl/react-maplibre'

// ─── Layer spec ───────────────────────────────────────────────────────────────

const lineLayer = {
  id: 'branch-lines',
  type: 'line',
  paint: {
    'line-color': '#52B788',
    'line-width': 2,
    'line-dasharray': [3, 3],
    'line-opacity': 0.7,
  },
}

// ─── BranchLines ─────────────────────────────────────────────────────────────

export default function BranchLines({ posts }) {
  const geojson = useMemo(() => {
    const features = posts
      .filter((p) => p.is_branch && p.parent_id)
      .map((branch) => {
        const parent = posts.find((p) => p.id === branch.parent_id)
        if (!parent) return null
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [parent.lng, parent.lat],
              [branch.lng, branch.lat],
            ],
          },
          properties: { branchId: branch.id, parentId: parent.id },
        }
      })
      .filter(Boolean)

    return { type: 'FeatureCollection', features }
  }, [posts])

  if (!geojson.features.length) return null

  return (
    <Source id="branch-lines-source" type="geojson" data={geojson}>
      <Layer {...lineLayer} />
    </Source>
  )
}

import { useMemo } from 'react'
import { Source, Layer } from '@vis.gl/react-maplibre'

const glowLayer = {
  id: 'branch-lines-glow',
  type: 'line',
  paint: {
    'line-color': '#52B788',
    'line-width': 6,
    'line-opacity': 0.18,
    'line-blur': 4,
  },
}

const lineLayer = {
  id: 'branch-lines',
  type: 'line',
  paint: {
    'line-color': '#74C69D',
    'line-width': 2.5,
    'line-dasharray': [4, 3],
    'line-opacity': 0.85,
  },
}

const dotLayer = {
  id: 'branch-line-dots',
  type: 'circle',
  paint: {
    'circle-radius': 3,
    'circle-color': '#95D5B2',
    'circle-opacity': 0.9,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#2D6A4F',
    'circle-stroke-opacity': 0.5,
  },
}

export default function BranchLines({ posts }) {
  const { lineGeo, pointGeo } = useMemo(() => {
    const lineFeatures = []
    const pointFeatures = []

    posts
      .filter((p) => p.is_branch && p.parent_id)
      .forEach((branch) => {
        const parent = posts.find((p) => p.id === branch.parent_id)
        if (!parent) return

        lineFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [parent.lng, parent.lat],
              [branch.lng, branch.lat],
            ],
          },
          properties: { branchId: branch.id, parentId: parent.id },
        })

        const midLng = (parent.lng + branch.lng) / 2
        const midLat = (parent.lat + branch.lat) / 2
        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [midLng, midLat] },
          properties: { branchId: branch.id },
        })
      })

    return {
      lineGeo: { type: 'FeatureCollection', features: lineFeatures },
      pointGeo: { type: 'FeatureCollection', features: pointFeatures },
    }
  }, [posts])

  if (!lineGeo.features.length) return null

  return (
    <>
      <Source id="branch-lines-source" type="geojson" data={lineGeo}>
        <Layer {...glowLayer} />
        <Layer {...lineLayer} />
      </Source>
      <Source id="branch-dots-source" type="geojson" data={pointGeo}>
        <Layer {...dotLayer} />
      </Source>
    </>
  )
}

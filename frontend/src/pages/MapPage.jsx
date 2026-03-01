import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import SeedMarker from '../components/Map/SeedMarker'
import BranchLines from '../components/Map/BranchLines'
import SearchBar from '../components/Map/SearchBar'
import FilterSheet from '../components/Map/FilterSheet'
import EventPicker from '../components/Map/EventPicker'
import PlantTree from '../components/Map/PlantTree'
import LocationPicker from '../components/Map/LocationPicker'
import PostCard from '../components/Posts/PostCard'
import BottomNav from '../components/Nav/BottomNav'
import { supabase } from '../lib/supabase'

// ─── Constants ───────────────────────────────────────────────────────────────

const PHILLY = { longitude: -75.1652, latitude: 39.9526 }

const DEFAULT_FILTERS = {
  stages:   [],
  distance: '10 mi',
  time:     'Any',
  type:     'All',
  sort:     'Newest',
}

// ─── Hardcoded test data ──────────────────────────────────────────────────────

const SEED_POSTS = [
  {
    id: 1,
    title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park. Bring your own bags!',
    lat: 39.9541, lng: -75.1878,
    waters_count: 0, growth_stage: 'seed', is_branch: false,
  },
  {
    id: 2,
    title: 'Sunday Morning Yoga 🧘',
    content: 'Free community yoga in Fairmount Park every Sunday at 8am. All levels welcome.',
    lat: 39.9726, lng: -75.1895,
    waters_count: 4, growth_stage: 'sapling', is_branch: true, parent_id: 3,
  },
  {
    id: 3,
    title: 'Neighborhood Cleanup 🌳',
    content: 'Monthly cleanup crew keeping our streets beautiful. Gloves provided!',
    lat: 39.9621, lng: -75.1712,
    waters_count: 12, growth_stage: 'oak', is_branch: false,
  },
  {
    id: 4,
    title: 'Community Garden 🌿',
    content: 'New raised beds available for the season. Sign up at the rec center.',
    lat: 39.9448, lng: -75.1602,
    waters_count: 2, growth_stage: 'sprout', is_branch: false,
  },
  {
    id: 5,
    title: 'Book Swap at Library 📚',
    content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library.',
    lat: 39.9381, lng: -75.1823,
    waters_count: 7, growth_stage: 'tree', is_branch: false,
  },
]

// ─── Haversine distance helper ────────────────────────────────────────────────

const getDistanceMiles = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const DISTANCE_MILES = {
  'Nearby': 0.5,
  '0.5 mi': 0.5,
  '1 mi':   1,
  '2 mi':   2,
  '5 mi+':  5,
  '10 mi':  999,
}

// ─── Spread overlapping posts so all markers are visible ─────────────────────

function spreadPosts(posts) {
  const seen = {}
  return posts.map((post) => {
    const key = `${post.lat.toFixed(4)},${post.lng.toFixed(4)}`
    seen[key] = (seen[key] || 0)
    const offset = seen[key]
    seen[key]++
    return {
      ...post,
      lat: post.lat + offset * 0.0003,
      lng: post.lng + offset * 0.0003,
    }
  })
}

// ─── MapPage ─────────────────────────────────────────────────────────────────

export default function MapPage() {
  const navigate = useNavigate()
  const mapRef   = useRef(null)

  const [posts, setPosts]               = useState(SEED_POSTS)
  const [plantOpen, setPlantOpen]       = useState(false)
  const [clickCoords, setClickCoords]   = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [filters, setFilters]           = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen]     = useState(false)
  const [pickerPosts, setPickerPosts]   = useState([])
  const [pickerOpen, setPickerOpen]     = useState(false)
  const [currentLocation, setCurrentLocation] = useState({
    name: 'West Philadelphia',
    lat:  39.9526,
    lng:  -75.1652,
  })
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)

  const handleLocationChange = useCallback((loc) => {
    setCurrentLocation(loc)
    setLocationPickerOpen(false)
    mapRef.current?.flyTo({
      center:   [loc.lng, loc.lat],
      zoom:     14,
      duration: 1200,
      essential: true,
    })
  }, [])

  // Supabase real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
          )
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // ── Filtered posts ──────────────────────────────────────────────────────────
  const filteredPosts = useMemo(() =>
    posts
      .filter((p) =>
        filters.stages.length === 0 ||
        filters.stages.includes(p.growth_stage)
      )
      .filter((p) => {
        const maxMiles = DISTANCE_MILES[filters.distance] ?? 999
        if (maxMiles === 999) return true
        return getDistanceMiles(
          currentLocation.lat, currentLocation.lng,
          p.lat, p.lng
        ) <= maxMiles
      })
      .filter((p) =>
        filters.type === 'All' ||
        (filters.type === 'Trees Only'    && !p.is_branch) ||
        (filters.type === 'Branches Only' &&  p.is_branch)
      )
      .sort((a, b) =>
        filters.sort === 'Most Watered'
          ? b.waters_count - a.waters_count
          : 0
      ),
    [posts, filters, currentLocation]
  )

  // Spread co-located markers for display
  const displayPosts = useMemo(() => spreadPosts(filteredPosts), [filteredPosts])

  const activeFilterCount =
    filters.stages.length +
    (filters.distance !== '10 mi' ? 1 : 0) +
    (filters.time     !== 'Any'    ? 1 : 0) +
    (filters.type     !== 'All'    ? 1 : 0) +
    (filters.sort     !== 'Newest' ? 1 : 0)

  // ── Map click — proximity detection ────────────────────────────────────────
  const handleMapClick = useCallback((e) => {
    if (selectedPost) { setSelectedPost(null); return }

    const tapLat = e.lngLat.lat
    const tapLng = e.lngLat.lng

    const nearby = displayPosts.filter((p) =>
      Math.abs(p.lat - tapLat) < 0.0005 &&
      Math.abs(p.lng - tapLng) < 0.0005
    )

    if (nearby.length >= 2) {
      setPickerPosts(nearby)
      setPickerOpen(true)
    } else if (nearby.length === 1) {
      setSelectedPost(nearby[0])
    } else {
      setClickCoords({ lat: tapLat, lng: tapLng })
      setPlantOpen(true)
    }
  }, [selectedPost, displayPosts])

  const handleSelectPost = useCallback((post) => {
    setSelectedPost(post)
    setPlantOpen(false)
    setPickerOpen(false)
  }, [])

  return (
    <div className="relative w-[360px] h-[640px] overflow-hidden bg-[#0D1F16]">
      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...PHILLY, zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://tiles.openfreemap.org/styles/dark"
        attributionControl={false}
        onClick={handleMapClick}
      >
        <BranchLines posts={displayPosts} />
        {displayPosts.map((post) => (
          <SeedMarker key={post.id} post={post} onSelect={handleSelectPost} />
        ))}
      </Map>

      {/* Search bar — floats over map */}
      <SearchBar
        onTap={() => navigate('/explore')}
        onFilterOpen={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Location indicator — tappable */}
      <button
        className="absolute left-1/2 -translate-x-1/2 z-20 border-none cursor-pointer"
        style={{
          bottom: 72,
          background: 'rgba(13,31,22,0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(82,183,136,0.25)',
          borderRadius: 20,
          padding: '6px 14px',
        }}
        onClick={() => setLocationPickerOpen(true)}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: 12,
            color: '#95D5B2',
          }}
        >
          📍 {currentLocation.name}
        </span>
      </button>

      {/* Overlays */}
      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <EventPicker
        posts={pickerOpen ? pickerPosts : []}
        onSelect={handleSelectPost}
        onClose={() => setPickerOpen(false)}
      />
      <PlantTree
        open={plantOpen}
        onClose={() => setPlantOpen(false)}
        coords={clickCoords}
      />
      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onLocationChange={handleLocationChange}
        currentLocation={currentLocation}
      />
      <PostCard
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}

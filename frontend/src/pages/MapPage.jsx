import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Map } from '@vis.gl/react-maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import SeedMarker, { isFallen, isDecayed } from '../components/Map/SeedMarker'
import BranchLines from '../components/Map/BranchLines'
import SearchBar from '../components/Map/SearchBar'
import FilterSheet from '../components/Map/FilterSheet'
import EventPicker from '../components/Map/EventPicker'
import PlantTree from '../components/Map/PlantTree'
import LocationPicker from '../components/Map/LocationPicker'
import PostCard from '../components/Posts/PostCard'
import BottomNav from '../components/Nav/BottomNav'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const PHILLY = { longitude: -75.1652, latitude: 39.9526 }

const DEFAULT_FILTERS = {
  stages: [],
  distance: '10 mi',
  time: 'Any',
  type: 'All',
  sort: 'Newest',
  showFallen: false,
}

// ─── Hardcoded test data ──────────────────────────────────────────────────────

const SEED_POSTS = [

  // ── Active public tree ──
  {
    id: 1,
    title: 'Saturday Farmers Market 🌽',
    content: 'Fresh local produce every Saturday morning at Clark Park. Bring your own bags!',
    link: 'https://clarkparkfarmersmarket.com',
    event_time: '2026-03-08T09:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park, Philadelphia',
    lat: 39.9541, lng: -75.1878,
    waters_count: 12, growth_stage: 'oak',
    is_branch: false, branch_count: 4,
    privacy: 'public',
    author: {
      id: 'u1', username: 'alex_r', initials: 'AR',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 7, waters: 34, branches: 3,
      friendship_status: 'none',
    },
  },

  // ── Active branch of post 1 ──
  {
    id: 2,
    title: 'Live Cooking Demo 🍳',
    content: 'Watch Chef Maria cook with seasonal market ingredients. Free samples!',
    link: null,
    event_time: '2026-03-08T11:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park, Philadelphia',
    lat: 39.9555, lng: -75.1860,
    waters_count: 4, growth_stage: 'sapling',
    is_branch: true, parent_id: 1, branch_count: 1,
    privacy: 'public',
    author: {
      id: 'u2', username: 'chef_maria', initials: 'CM',
      user_type: 'business', business_name: "Maria's Kitchen",
      community: 'West Philadelphia',
      verified: true, trees: 3, waters: 18, branches: 1,
      friendship_status: 'friends',
    },
  },

  // ── Active private group tree ──
  {
    id: 3,
    title: 'Neighborhood Watch Meeting 🔒',
    content: 'Monthly safety and community update for West Philly residents.',
    link: 'https://forms.gle/example',
    event_time: '2026-03-12T19:00:00',
    timezone: 'America/New_York',
    location: '52nd Street Community Center',
    lat: 39.9621, lng: -75.1712,
    waters_count: 6, growth_stage: 'tree',
    is_branch: false, branch_count: 1,
    privacy: 'private_group',
    author: {
      id: 'u3', username: 'block_captain', initials: 'BC',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 4, waters: 22, branches: 2,
      friendship_status: 'friends',
    },
  },

  // ── Active invite-only tree ──
  {
    id: 4,
    title: 'Secret Rooftop Dinner 🌙',
    content: 'Private dinner for the founding members of our community group.',
    link: null,
    event_time: '2026-03-15T19:30:00',
    timezone: 'America/New_York',
    location: null,
    lat: 39.9448, lng: -75.1602,
    waters_count: 3, growth_stage: 'sapling',
    is_branch: false, branch_count: 0,
    privacy: 'invite_only',
    members: [
      { id: 1, username: 'alex_r',   initials: 'AR', role: 'creator', status: 'accepted' },
      { id: 2, username: 'maya_w',   initials: 'MW', role: 'member',  status: 'accepted' },
      { id: 3, username: 'jordan_k', initials: 'JK', role: 'member',  status: 'pending'  },
    ],
    author: {
      id: 'u4', username: 'maya_w', initials: 'MW',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 2, waters: 9, branches: 0,
      friendship_status: 'none',
    },
  },

  // ── Active sprout ──
  {
    id: 5,
    title: 'Community Garden Workday 🌿',
    content: 'New raised beds available this season. Gloves and tools provided!',
    link: 'https://phillygarden.org',
    event_time: '2026-03-22T10:00:00',
    timezone: 'America/New_York',
    location: 'Kingsessing Recreation Center Garden',
    lat: 39.9381, lng: -75.1823,
    waters_count: 2, growth_stage: 'sprout',
    is_branch: false, branch_count: 1,
    privacy: 'public',
    author: {
      id: 'u5', username: 'green_philly', initials: 'GP',
      user_type: 'business', business_name: 'Green Philly Org',
      community: 'Kingsessing',
      verified: true, trees: 12, waters: 89, branches: 5,
      friendship_status: 'none',
    },
  },

  // ── Recently fallen tree (event just passed) ──
  {
    id: 6,
    title: 'Jazz Night at Clark Park 🎷',
    content: 'What an incredible night! Thank you to all 40+ neighbors who came out.',
    link: null,
    event_time: '2026-02-22T20:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park Amphitheater',
    lat: 39.9480, lng: -75.1750,
    waters_count: 9, growth_stage: 'tree',
    fallen: true,
    is_branch: false, branch_count: 1,
    privacy: 'public',
    author: {
      id: 'u6', username: 'jazz_collective', initials: 'JC',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 5, waters: 31, branches: 2,
      friendship_status: 'friends',
    },
  },

  // ── Fully decayed tree (7+ days past) ──
  {
    id: 7,
    title: 'Winter Coat Drive 🧥',
    content: 'We collected over 200 coats. This neighborhood is incredible. Thank you all.',
    link: 'https://coatdrive.org/results',
    event_time: '2026-02-01T10:00:00',
    timezone: 'America/New_York',
    location: 'University City Community Center',
    lat: 39.9560, lng: -75.1800,
    waters_count: 14, growth_stage: 'oak',
    decayed: true,
    is_branch: false, branch_count: 3,
    privacy: 'public',
    author: {
      id: 'u7', username: 'community_org', initials: 'CO',
      user_type: 'business', business_name: 'West Philly Community Org',
      community: 'West Philadelphia',
      verified: true, trees: 18, waters: 142, branches: 9,
      friendship_status: 'none',
    },
  },

  // ── Fallen tree — visible on map with floating 🪵 icon ──
  {
    id: 9,
    title: 'Street Mural Painting Day 🎨',
    content: 'We painted the most beautiful mural on 48th Street. What an amazing turnout!',
    link: null,
    event_time: '2026-02-25T11:00:00',
    timezone: 'America/New_York',
    location: '48th & Baltimore Ave',
    lat: 39.9500, lng: -75.1770,
    waters_count: 11, growth_stage: 'tree',
    fallen: true,
    is_branch: false, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u9', username: 'mural_arts', initials: 'MA',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 3, waters: 19, branches: 1,
      friendship_status: 'none',
    },
  },

  // ── New seed just planted ──
  {
    id: 8,
    title: 'Book Swap at Library 📚',
    content: 'Bring a book, take a book. Every Tuesday at Kingsessing Library.',
    link: null,
    event_time: '2026-03-05T17:00:00',
    timezone: 'America/New_York',
    location: 'Kingsessing Library, Philadelphia',
    lat: 39.9510, lng: -75.1690,
    waters_count: 0, growth_stage: 'seed',
    is_branch: false, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u8', username: 'kingsessing_lib', initials: 'KL',
      user_type: 'business', business_name: 'Kingsessing Library',
      community: 'Kingsessing',
      verified: true, trees: 6, waters: 44, branches: 2,
      friendship_status: 'none',
    },
  },

  // ── Branch of Farmers Market (post 1) — vendor signup ──
  {
    id: 10,
    title: 'Vendor Sign-Up Open 🧺',
    content: 'Want to sell at Clark Park market? Applications for spring season are open now.',
    link: null,
    event_time: '2026-03-10T09:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park, Philadelphia',
    lat: 39.9528, lng: -75.1855,
    waters_count: 6, growth_stage: 'tree',
    is_branch: true, parent_id: 1, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u1', username: 'alex_r', initials: 'AR',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 7, waters: 34, branches: 3,
      friendship_status: 'none',
    },
  },

  // ── Branch of Farmers Market (post 1) — kids corner ──
  {
    id: 11,
    title: 'Kids Craft Corner 🎨',
    content: 'Free face painting and crafts for kids at the market every Saturday!',
    link: null,
    event_time: '2026-03-08T10:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park, Philadelphia',
    lat: 39.9552, lng: -75.1905,
    waters_count: 3, growth_stage: 'sprout',
    is_branch: true, parent_id: 1, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u10', username: 'philly_parents', initials: 'PP',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 2, waters: 11, branches: 0,
      friendship_status: 'none',
    },
  },

  // ── Sub-branch of Cooking Demo (post 2) — recipe swap (chain: 1→2→12) ──
  {
    id: 12,
    title: 'Recipe Swap Thread 📝',
    content: 'Share your favorite seasonal recipes inspired by the cooking demo!',
    link: null,
    event_time: '2026-03-09T12:00:00',
    timezone: 'America/New_York',
    location: 'Clark Park, Philadelphia',
    lat: 39.9570, lng: -75.1842,
    waters_count: 2, growth_stage: 'sprout',
    is_branch: true, parent_id: 2, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u11', username: 'foodie_jay', initials: 'FJ',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 1, waters: 5, branches: 0,
      friendship_status: 'none',
    },
  },

  // ── Branch of Neighborhood Watch (post 3) — block party ──
  {
    id: 13,
    title: 'Block Party Planning 🎉',
    content: 'Spring block party on 52nd St! Help us plan food, music, and activities.',
    link: null,
    event_time: '2026-03-20T18:00:00',
    timezone: 'America/New_York',
    location: '52nd & Walnut',
    lat: 39.9640, lng: -75.1735,
    waters_count: 5, growth_stage: 'sapling',
    is_branch: true, parent_id: 3, branch_count: 0,
    privacy: 'private_group',
    author: {
      id: 'u3', username: 'block_captain', initials: 'BC',
      user_type: 'local', community: 'West Philadelphia',
      verified: false, trees: 4, waters: 22, branches: 2,
      friendship_status: 'friends',
    },
  },

  // ── Branch of Community Garden (post 5) — seed share ──
  {
    id: 14,
    title: 'Spring Seed Share 🌻',
    content: 'Bring extra seeds, take what you need. Tomato, basil, and sunflower starters available.',
    link: null,
    event_time: '2026-03-23T09:00:00',
    timezone: 'America/New_York',
    location: 'Kingsessing Recreation Center Garden',
    lat: 39.9368, lng: -75.1798,
    waters_count: 1, growth_stage: 'seed',
    is_branch: true, parent_id: 5, branch_count: 0,
    privacy: 'public',
    author: {
      id: 'u12', username: 'garden_guru', initials: 'GG',
      user_type: 'local', community: 'Kingsessing',
      verified: false, trees: 1, waters: 3, branches: 0,
      friendship_status: 'none',
    },
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
  '1 mi': 1,
  '2 mi': 2,
  '5 mi+': 5,
  '10 mi': 999,
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
  const mapRef = useRef(null)
  const { isDark } = useTheme()

  const [posts, setPosts] = useState(SEED_POSTS)
  const [plantOpen, setPlantOpen] = useState(false)
  const [clickCoords, setClickCoords] = useState(null)
  const [branchParent, setBranchParent] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [pickerPosts, setPickerPosts] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [currentLocation, setCurrentLocation] = useState({
    name: 'West Philadelphia',
    lat: 39.9526,
    lng: -75.1652,
  })
  const [locationPickerOpen, setLocationPickerOpen] = useState(false)

  function handleTestFallen() {
    setPosts((prev) => prev.map((p) =>
      p.id === 1 ? { ...p, event_time: new Date(Date.now() - 86400000).toISOString() } : p
    ))
  }

  const handleLocationChange = useCallback((loc) => {
    setCurrentLocation(loc)
    setLocationPickerOpen(false)
    mapRef.current?.flyTo({
      center: [loc.lng, loc.lat],
      zoom: 14,
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
      .filter((p) => filters.showFallen || !isDecayed(p))
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
        (filters.type === 'Trees Only' && !p.is_branch) ||
        (filters.type === 'Branches Only' && p.is_branch)
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
    (filters.time !== 'Any' ? 1 : 0) +
    (filters.type !== 'All' ? 1 : 0) +
    (filters.sort !== 'Newest' ? 1 : 0)

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
      setBranchParent(null)
      setPlantOpen(true)
    }
  }, [selectedPost, displayPosts])

  const handleSelectPost = useCallback((post) => {
    setSelectedPost(post)
    setPlantOpen(false)
    setPickerOpen(false)
  }, [])

  const handlePlant = useCallback((newPost) => {
    setPosts((prev) => {
      let updated = [...prev, newPost]
      if (newPost.is_branch && newPost.parent_id) {
        updated = updated.map((p) =>
          p.id === newPost.parent_id
            ? { ...p, branch_count: (p.branch_count ?? 0) + 1 }
            : p
        )
      }
      return updated
    })
    setBranchParent(null)
  }, [])

  return (
    <div
      className="relative w-[360px] h-[640px] overflow-hidden"
      style={{ background: isDark ? '#0D1F16' : '#F4FAF6', transition: 'background 0.3s ease' }}
    >
      {/* Map */}
      <Map
        ref={mapRef}
        initialViewState={{ ...PHILLY, zoom: 14 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={isDark ? "https://tiles.openfreemap.org/styles/dark" : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"}
        attributionControl={false}
        onClick={handleMapClick}
      >
        <BranchLines posts={displayPosts} />
        {displayPosts.map((post) => (
          <SeedMarker key={post.id} post={post} onSelect={handleSelectPost} />
        ))}
      </Map>

      {/* Search bar — floats over map, hidden while planting */}
      {!plantOpen && (
        <SearchBar
          onTap={() => navigate('/explore')}
          onFilterOpen={() => setFilterOpen(true)}
          activeFilterCount={activeFilterCount}
        />
      )}

      {/* Location indicator — tappable */}
      <button
        className="absolute left-1/2 -translate-x-1/2 z-20 border-none cursor-pointer"
        style={{
          bottom: 88,
          background: isDark ? 'rgba(13,31,22,0.85)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: isDark ? '1px solid rgba(82,183,136,0.25)' : '1px solid rgba(45,106,79,0.2)',
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
            color: isDark ? '#95D5B2' : '#2D6A4F',
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
        onClose={() => { setPlantOpen(false); setBranchParent(null) }}
        coords={clickCoords}
        parentPost={branchParent}
        onPlant={handlePlant}
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
        onAddBranch={(post) => {
          setSelectedPost(null)
          setClickCoords({ lat: post.lat, lng: post.lng })
          setBranchParent(post)
          setPlantOpen(true)
        }}
      />

      {/* Dev: test fallen tree */}
      <button
        onClick={handleTestFallen}
        className="absolute border-none cursor-pointer"
        style={{ bottom: 72, left: 8, background: 'transparent', fontSize: 8, color: 'rgba(255,255,255,0.3)', opacity: 0.3, padding: 2 }}
      >
        🍂 Test Fallen
      </button>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { BookOpen, MapPin, Maximize, Minimize, Users, X } from 'lucide-react';
import cgGeoJsonUrl from '../../assets/cg.json?url';

const MapResizer = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timeout = setTimeout(() => { if (map._container) map.invalidateSize(); }, 400);
    return () => clearTimeout(timeout);
  }, [trigger, map]);
  return null;
};

const MapLocationController = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target && target.length === 2) {
      map.flyTo(target, 10, { animate: true, duration: 1.5 });
    }
  }, [target, map]);
  return null;
};

// --- SMART MAP COMPONENT (UPDATED WITH MARKER) ---
const TraineeLocationMap = ({ trainingLocations, focusTarget, markerColor }) => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(cgGeoJsonUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Map boundary data could not be loaded');
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setGeoJsonData(data);
      })
      .catch((error) => {
        if (!cancelled) console.error('Failed to load map boundary data:', error);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedTraining) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedTraining]);

  const MIN_LAT = 17.5; const MAX_LAT = 24.0; const MIN_LNG = 79.5; const MAX_LNG = 85.0;
  const isWithinCG = (lat, lng) => lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;

  const validTrainingLocations = (trainingLocations || []).filter(training => {
    const lat = Number(training?.location_details?.latitude);
    const lng = Number(training?.location_details?.longitude);
    return !isNaN(lat) && !isNaN(lng) && isWithinCG(lat, lng);
  });

  const totalTrainings = validTrainingLocations.length;

  // Group by coordinate key for same-spot stacking, keeping district info
  const groupedLocations = useMemo(() => {
    return validTrainingLocations.reduce((acc, training) => {
      const lat = Number(training.location_details?.latitude);
      const lng = Number(training.location_details?.longitude);
      const key = `${lat.toFixed(4)}-${lng.toFixed(4)}`;
      if (!acc[key]) acc[key] = { lat, lng, trainings: [], district: training.location_details?.district || 'Unknown' };
      acc[key].trainings.push(training);
      return acc;
    }, {});
  }, [validTrainingLocations]);

  // Group location-spots by district for district-wise clustering
  const districtGrouped = useMemo(() => {
    const byDistrict = {};
    Object.values(groupedLocations).forEach((loc) => {
      const district = loc.district || 'Unknown';
      if (!byDistrict[district]) byDistrict[district] = [];
      byDistrict[district].push(loc);
    });
    return byDistrict;
  }, [groupedLocations]);

  // --- Training Markers Icon ---
  // CHANGED: color now comes from the selected training-type phase (passed as `markerColor` prop),
  // falling back to the original green when no phase filter is active.
  const MARKER_COLOR = markerColor || '#16a34a';

  const createCustomIcon = (count, color = MARKER_COLOR) => {
    const stackShadow = count > 1
      ? `2px -2px 0 rgba(255,255,255,0.9), 3px -3px 0 ${color}, 4px -4px 0 rgba(255,255,255,0.9), 5px -5px 0 ${color}`
      : '0 4px 14px rgba(0,0,0,0.15)';

    return L.divIcon({
      className: 'smart-marker-container',
      html: `
        <div class="smart-marker-body" style="
            width: 40px; height: 40px; 
            display: flex; align-items: center; justify-content: center;
            background: ${color}; 
            border-radius: 50%; 
            color: white; 
            font-weight: 800; 
            font-size: 14px; 
            font-family: 'Inter', sans-serif;
            border: 2.5px solid #ffffff;
            box-shadow: ${stackShadow};
            cursor: pointer;
            transition: transform 0.2s ease;
            position: relative;
            z-index: 10;
        ">
            ${count}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      interactive: true
    });
  };

  // --- NEW: Focus/Center Marker Icon ---
  const createFocusIcon = () => {
    return L.divIcon({
      className: 'focus-marker-container',
      html: `
        <style>
          @keyframes pulse-ring {
            0% { transform: scale(0.33); opacity: 1; }
            80%, 100% { opacity: 0; transform: scale(2.5); }
          }
          .pulse-circle {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 100%; height: 100%;
            background: rgba(220, 38, 38, 0.4);
            border-radius: 50%;
            animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
        </style>
        <div style="
            width: 30px; height: 30px; 
            position: relative;
            display: flex; align-items: center; justify-content: center;
            color: #ffffff;
        ">
          <div class="pulse-circle"></div>
          <div style="
            width: 20px; height: 20px;
            background: #dc2626; /* Red color for focus */
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.5);
            z-index: 10;
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      interactive: false // No need to click this center marker
    });
  };

  const containerStyle = {
    height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
    background: '#ffffff', borderRadius: isFullScreen ? '0' : '20px',
    border: isFullScreen ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
    boxShadow: isFullScreen ? 'none' : '0 10px 30px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(isFullScreen ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 } : {})
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .smart-marker-container:hover .smart-marker-body { transform: scale(1.1) translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important; }
      `}</style>

      {/* Map Control: Info Badge */}
      <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 900, background: 'rgba(255, 255, 255, 0.95)', padding: '9px 14px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: MARKER_COLOR, boxShadow: `0 0 0 4px ${MARKER_COLOR}1f` }}></div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>Chhattisgarh</div>
          <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b', marginTop: '1px' }}>{totalTrainings} training locations</div>
        </div>
      </div>

      {/* Map Control: Fullscreen */}
      <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 900 }}>
        <button onClick={() => setIsFullScreen(!isFullScreen)} style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          {isFullScreen ? <Minimize size={18} color="#64748b" /> : <Maximize size={18} color="#64748b" />}
        </button>
      </div>

      <MapContainer style={{ width: '100%', height: '100%' }} zoomControl={false} minZoom={5}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* Controller to handle map movement based on selection */}
        <MapLocationController target={focusTarget} />

        {/* Adjusts bounds if no specific target is selected */}
        <MapBoundsAdjuster geoJsonData={geoJsonData} trigger={isFullScreen} focusTarget={focusTarget} />

        <MapResizer trigger={isFullScreen} />

        {geoJsonData && <GeoJSON data={geoJsonData} style={{ color: '#4f46e5', weight: 2, fillColor: '#818cf8', fillOpacity: 0.08, dashArray: '3 4' }} />}

        {/* NEW: Render Focus Marker if a target is selected */}
        {focusTarget && (
          <Marker position={focusTarget} icon={createFocusIcon()} />
        )}

        {/* Render Training Markers with Marker Clustering */}
        {/* District-wise Marker Clustering — one MCG per district */}
        {Object.entries(districtGrouped).map(([district, locations]) => {
          return (
            <MarkerClusterGroup
              key={`cluster-${district}`}
              chunkedLoading
              maxClusterRadius={80}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              iconCreateFunction={(cluster) => {
                const childMarkers = cluster.getAllChildMarkers();
                let total = 0;
                childMarkers.forEach((m) => { total += (m.options?.trainingCount || 1); });
                const size = total > 50 ? 56 : total > 20 ? 50 : 44;
                const fontSize = total > 99 ? '12px' : '14px';
                return L.divIcon({
                  html: `
                    <div style="
                      width: ${size}px;
                      height: ${size}px;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      background: ${MARKER_COLOR};
                      border-radius: 50%;
                      color: white;
                      font-weight: 800;
                      font-size: ${fontSize};
                      font-family: 'Inter', sans-serif;
                      border: 3px solid #ffffff;
                      box-shadow: 0 4px 16px ${MARKER_COLOR}59;
                      cursor: pointer;
                      line-height: 1.1;
                    ">
                      <span>${total}</span>
                    </div>
                  `,
                  className: 'custom-district-cluster-icon',
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                });
              }}
            >
              {locations.map((location, i) => {
                const trainings = location.trainings;
                const count = trainings.length;
                return (
                  <Marker
                    key={`${district}-marker-${i}`}
                    position={[location.lat, location.lng]}
                    icon={createCustomIcon(count, MARKER_COLOR)}
                    trainingCount={count}
                    eventHandlers={{
                      click: () => { setSelectedTraining([...trainings]); },
                    }}
                  />
                );
              })}
            </MarkerClusterGroup>
          );
        })}
      </MapContainer>

      {/* MODAL */}
      {Array.isArray(selectedTraining) && selectedTraining.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 10000,
            animation: "fadeIn 0.25s ease-out"
          }}
          onClick={() => setSelectedTraining(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "880px",
              maxHeight: "88vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 25px 60px -15px rgba(88, 28, 135, 0.3)",
              position: "relative",
              border: "1px solid rgba(192, 132, 252, 0.3)"
            }}
          >
            {/* Header Banner */}
            <div
              style={{
                padding: "24px 30px",
                background:
                  "linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7e22ce 100%)",
                borderRadius: "24px 24px 0 0",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div
                  style={{
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px"
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#ffffff",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <BookOpen size={14} color="#e9d5ff" />
                    Subject
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize: "20px",
                      fontWeight: "800",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    Marketplace Literacy
                  </h2>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                {/* Session Count */}
                <span
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    padding: "5px 14px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: "700"
                  }}
                >
                  {selectedTraining.length} Session
                  {selectedTraining.length > 1 ? "s" : ""}
                </span>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedTraining(null)}
                  style={{
                    width: 36,
                    height: 36,
                    border: "none",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.25)",
                    color: "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.25)";
                  }}
                >
                  <X size={18} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "24px"
              }}
            >
              {selectedTraining.map((training, index) => {
                return (
                  <div
                    key={training.id || index}
                    style={{
                      border: "1px solid #ede9fe",
                      borderRadius: "20px",
                      overflow: "hidden",
                      background: "#ffffff",
                      boxShadow: "0 8px 24px rgba(124, 58, 237, 0.06)"
                    }}
                  >
                    {/* Training Hero Image */}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "200px",
                        overflow: "hidden"
                      }}
                    >
                      <img
                        src={
                          training.training_image ||
                          "https://placehold.co/1200x250/ede9fe/6b21a8?text=Marketplace+Literacy+Training"
                        }
                        alt="Training Session"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(30, 27, 75, 0.75) 0%, transparent 60%)"
                        }}
                      />
                    </div>

                    {/* Content Section */}
                    <div
                      style={{
                        padding: "24px",
                        display: "grid",
                        gridTemplateColumns: "200px 1fr",
                        gap: "24px",
                        alignItems: "center"
                      }}
                    >
                      {/* Trainer Profile */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          padding: "16px",
                          background: "#faf5ff",
                          borderRadius: "16px",
                          border: "1px solid #f3e8ff"
                        }}
                      >
                        <div
                          style={{
                            width: 68,
                            height: 68,
                            borderRadius: "50%",
                            padding: "3px",
                            background:
                              "linear-gradient(135deg, #7c3aed, #c084fc)",
                            marginBottom: 10
                          }}
                        >
                          <img
                            src={
                              training.trainer_profile_image ||
                              training.trainer_image ||
                              "https://placehold.co/110x110/f3e8ff/6b21a8?text=👤"
                            }
                            alt="Master Trainer"
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src =
                                "https://placehold.co/110x110/f3e8ff/6b21a8?text=👤";
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: "#ffffff"
                            }}
                          />
                        </div>

                        <h3
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: "800",
                            color: "#3b0764"
                          }}
                        >
                          {training.trainer_name || "Trainer Name"}
                        </h3>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#7c3aed",
                            fontWeight: "600",
                            marginTop: "2px"
                          }}
                        >
                          Master Trainer
                        </span>
                      </div>

                      {/* Metadata */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "12px"
                        }}
                      >
                        {/* Participants */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              marginBottom: "3px"
                            }}
                          >
                            Participants
                          </div>

                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <Users size={15} color="#7c3aed" />
                            {training.total_participants ||
                              training.actual_participants ||
                              0}{" "}
                            Participants
                          </div>
                        </div>

                        {/* District */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              marginBottom: "3px"
                            }}
                          >
                            District
                          </div>

                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <MapPin size={15} color="#7c3aed" />
                            {training.location_details?.district ||
                              "Chhattisgarh"}
                          </div>
                        </div>

                        {/* Block */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              marginBottom: "3px"
                            }}
                          >
                            Block
                          </div>

                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <MapPin size={15} color="#7c3aed" />
                            {training.location_details?.block || "-"}
                          </div>
                        </div>

                        {/* Village */}
                        <div
                          style={{
                            padding: "10px 14px",
                            background: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px solid #f1f5f9"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              marginBottom: "3px"
                            }}
                          >
                            Village
                          </div>

                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#0f172a",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <MapPin size={15} color="#7c3aed" />
                            {training.location_details?.village ||
                              training.location_details?.block ||
                              "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modern Completed Status */}
                    {training.status?.toLowerCase() === "completed" && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "0 24px 22px"
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "9px",
                            padding: "8px 20px",
                            borderRadius: "999px",
                            background:
                              "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                            border: "1px solid #86EFAC",
                            color: "#166534",
                            fontSize: "11px",
                            fontWeight: "800",
                            letterSpacing: "0.08em",
                            boxShadow:
                              "0 4px 14px rgba(22, 163, 74, 0.12)"
                          }}
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: "#22C55E",
                              boxShadow:
                                "0 0 0 4px rgba(34, 197, 94, 0.12)"
                            }}
                          />

                          COMPLETED
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MapBoundsAdjuster = ({ geoJsonData, trigger, focusTarget }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !geoJsonData || focusTarget) return;
    const layer = L.geoJSON(geoJsonData); const bounds = layer.getBounds(); if (!bounds.isValid()) return;
    const timeout = setTimeout(() => { if (map._container) { map.invalidateSize(); map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40], maxZoom: 8 }); } }, 400);
    return () => clearTimeout(timeout);
  }, [geoJsonData, trigger, focusTarget, map]);
  return null;
};


export default TraineeLocationMap;
